import { load } from "js-yaml"
import { z } from "zod"

const OpenAPISchema = z
  .object({
    openapi: z.string().optional(),
    swagger: z.string().optional(),
  })
  .refine((data) => data.openapi || data.swagger, {
    message: "Must contain either 'openapi' or 'swagger' field",
  })

export async function processLocalContent(content: string): Promise<any> {
  try {
    let parsed: any

    // Try JSON first
    try {
      parsed = JSON.parse(content)
    } catch {
      // If JSON fails, try YAML
      try {
        parsed = load(content)
      } catch (yamlError) {
        throw new Error("Content is neither valid JSON nor YAML")
      }
    }

    // Validate the parsed content
    const validation = OpenAPISchema.safeParse(parsed)
    if (!validation.success) {
      throw new Error("Invalid OpenAPI specification: " + validation.error.message)
    }

    // Check size limit (2.5MB)
    const stringified = JSON.stringify(parsed)
    if (stringified.length > 2.5 * 1024 * 1024) {
      throw new Error("Content exceeds 2.5MB size limit")
    }

    return parsed
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to process content")
  }
}
