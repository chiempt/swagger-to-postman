export function convertToOpenApiUrl(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    // If path ends with /docs or /docs/, replace with /openapi.json
    if (u.pathname.match(/\/docs\/?$/)) {
      u.pathname = u.pathname.replace(/\/docs\/?$/, "/openapi.json");
      return u.toString();
    }
    // If path ends with /swagger or /swagger/, replace with /openapi.json
    if (u.pathname.match(/\/swagger\/?$/)) {
      u.pathname = u.pathname.replace(/\/swagger\/?$/, "/openapi.json");
      return u.toString();
    }
    // If path ends with .docs, replace with .open.json
    if (u.pathname.endsWith(".docs")) {
      u.pathname = u.pathname.replace(/\.docs$/, ".open.json");
      return u.toString();
    }
    // If path ends with .docs.json, replace with .open.json
    if (u.pathname.endsWith(".docs.json")) {
      u.pathname = u.pathname.replace(/\.docs\.json$/, ".open.json");
      return u.toString();
    }
    // If path ends with .json, try replacing with .open.json
    if (u.pathname.endsWith(".json")) {
      u.pathname = u.pathname.replace(/\.json$/, ".open.json");
      return u.toString();
    }
    // If path does not end with .json, try appending /openapi.json
    if (!u.pathname.endsWith(".json")) {
      u.pathname = u.pathname.replace(/\/$/, "") + "/openapi.json";
      return u.toString();
    }
    // Fallback: return original
    return inputUrl;
  } catch {
    return inputUrl;
  }
}

export function getOpenApiUrl(url: string) {
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  if (match) {
    return match[1];
  }
  return url;
}

export function generatePostmanCollection(json: any, url: string, authorization?: string) {
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
      bearerFormat: "JWT"
    };

    // Add global security requirement
    json.security = [{ BearerAuth: [] }];

    // Optionally, add a variable for the token in the description
    if (!json.variables) json.variables = {};
    json.variables.AUTHORIZATION = {
      default: authorization,
      description: "Authorization token for API requests"
    };
  }

  return json;
}
