import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limiter";
import renderPostmanFromSwagger from "@/lib/renderPostmanFromSwagger";

const RequestSchema = z.object({
  url: z.string().url(),
  filename: z.string().optional().default("postman_collection"),
});

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
          error: { code: "INVALID_REQUEST", message: "Invalid request data" },
        },
        { status: 400 }
      );
    }

    const { url, filename } = validation.data;

    try {
      // Generate Postman collection
      const collection = await renderPostmanFromSwagger({ url });

      // Return the collection as downloadable JSON
      const response = NextResponse.json({
        ok: true,
        data: collection,
        meta: {
          filename: `${filename}.json`,
          contentType: "application/json",
          size: JSON.stringify(collection).length,
        },
      });

      // Set headers for download
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${filename}.json"`
      );
      response.headers.set("Content-Type", "application/json");

      return response;
    } catch (error) {
      console.error("Postman generation error:", error);

      if (error instanceof Error) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "GENERATION_ERROR",
              message: error.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNKNOWN_ERROR",
            message: "Failed to generate Postman collection",
          },
        },
        { status: 500 }
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
