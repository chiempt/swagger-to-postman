export function convertToOpenApiUrl(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);

    // Nếu đã là openapi.json thì giữ nguyên
    if (/\/openapi\.json$/i.test(u.pathname)) {
      return u.toString();
    }

    // Regex nhận dạng các path swagger phổ biến ở cuối URL
    const swaggerPatterns = /(docs|redoc|swagger(-ui)?)(\/)?$/i;

    if (swaggerPatterns.test(u.pathname)) {
      // Thay cụm swagger/docs/redoc ở cuối bằng openapi.json
      u.pathname = u.pathname.replace(swaggerPatterns, "openapi.json");
    } else {
      // Nếu không match gì thì append openapi.json vào
      // Always replace trailing slash with openapi.json
      // Remove any hash and everything after it, then append /openapi.json
      u.hash = "";

      u.pathname = u.pathname.replace(/\/$/, "") + "/openapi.json";
      const arrPath = u.pathname.split("/");
      arrPath.pop();
      u.pathname = arrPath.join("/") + "/openapi.json";
    }

    return u.toString();
  } catch {
    return inputUrl;
  }
}

export async function fetchSwaggerJson(inputUrl: string) {
  const apiUrl = convertToOpenApiUrl(inputUrl);

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch Swagger JSON from ${apiUrl}:`, err);
    throw err;
  }
}

export function getOpenApiUrl(url: string) {
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  if (match) {
    return match[1];
  }
  return url;
}

export function generatePostmanCollection(
  json: any,
  url: string,
  authorization?: string
) {
  const openApiUrl = getOpenApiUrl(url);
  const oldUrl = json.servers?.[0]?.url || "";
  const newUrl = openApiUrl + oldUrl;

  // Set baseUrl
  json.servers = [{ url: newUrl }];

  // Add Authorization header variable if provided
  if (authorization) {
    if (!json.components) json.components = {};
    if (!json.components.securitySchemes) json.components.securitySchemes = {};

    json.components.securitySchemes.BearerAuth = {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    };

    // Add global security requirement
    json.security = [{ BearerAuth: [] }];

    // Optionally, add a variable for the token in the description
    if (!json.variables) json.variables = {};
    json.variables.AUTHORIZATION = {
      default: authorization,
      description: "Authorization token for API requests",
    };
  }

  return json;
}
