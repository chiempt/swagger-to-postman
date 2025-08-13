import { type NextRequest, NextResponse } from "next/server";
import { load } from "js-yaml";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  convertToOpenApiUrl,
  generatePostmanCollection,
} from "@/utils/postman";

const RequestSchema = z.object({
  url: z.string().url(),
});

const OpenAPISchema = z
  .object({
    openapi: z.string().optional(),
    swagger: z.string().optional(),
  })
  .refine((data) => data.openapi || data.swagger, {
    message: "Must contain either 'openapi' or 'swagger' field",
  });

function isPrivateIP(hostname: string): boolean {
  // Basic check for private/local IPs
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  return privatePatterns.some((pattern) => pattern.test(hostname));
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_URL", message: "Invalid URL provided" },
        },
        { status: 400 }
      );
    }

    const { url } = validation.data;
    const parsedUrl = new URL(url);

    // Security checks
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_PROTOCOL",
            message: "Only HTTP and HTTPS URLs are allowed",
          },
        },
        { status: 400 }
      );
    }

    if (isPrivateIP(parsedUrl.hostname)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PRIVATE_IP",
            message: "Private IP addresses are not allowed",
          },
        },
        { status: 400 }
      );
    }

    // Fetch with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      // Convert docs URL to openapi.json or .open.json if possible
      const openApiUrl = convertToOpenApiUrl(url);
      const response = await fetch(openApiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "FETCH_ERROR",
              message: `HTTP ${response.status}: ${response.statusText}`,
            },
          },
          { status: 502 }
        );
      }

      // Check content length
      const contentLength = response.headers.get("content-length");
      if (contentLength && Number.parseInt(contentLength) > 3 * 1024 * 1024) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "TOO_LARGE", message: "Content exceeds 3MB limit" },
          },
          { status: 413 }
        );
      }

      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      // Size check after download
      if (text.length > 3 * 1024 * 1024) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "TOO_LARGE", message: "Content exceeds 3MB limit" },
          },
          { status: 413 }
        );
      }

      let parsed: any;

      // Parse based on content type or content detection
      if (
        contentType.includes("yaml") ||
        text.includes("openapi:") ||
        text.includes("swagger:")
      ) {
        try {
          parsed = load(text);
        } catch (yamlError) {
          // Fallback to JSON if YAML parsing fails
          try {
            parsed = JSON.parse(text);
          } catch (jsonError) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  code: "PARSE_ERROR",
                  message: "Content is neither valid JSON nor YAML",
                },
              },
              { status: 400 }
            );
          }
        }
      } else {
        try {
          parsed = JSON.parse(text);
        } catch (jsonError) {
          // Fallback to YAML if JSON parsing fails
          try {
            parsed = load(text);
          } catch (yamlError) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  code: "PARSE_ERROR",
                  message: "Content is neither valid JSON nor YAML",
                },
              },
              { status: 400 }
            );
          }
        }
      }

      // Validate OpenAPI structure
      const schemaValidation = OpenAPISchema.safeParse(parsed);
      if (!schemaValidation.success) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "INVALID_OPENAPI",
              message: "Invalid OpenAPI specification",
            },
          },
          { status: 400 }
        );
      }

      // Final size check
      const finalJson = JSON.stringify(parsed);
      if (finalJson.length > 2.5 * 1024 * 1024) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "TOO_LARGE",
              message: "Processed content exceeds 2.5MB limit",
            },
          },
          { status: 413 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: generatePostmanCollection(parsed, url),
        meta: {
          sourceContentType: contentType,
          bytes: text.length,
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "TIMEOUT",
              message: "Request timed out after 15 seconds",
            },
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: { code: "NETWORK_ERROR", message: "Failed to fetch the URL" },
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
