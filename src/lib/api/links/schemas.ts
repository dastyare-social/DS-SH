import { z } from "zod";
import { links } from "@/lib/db/schema";

// Export the inferred TypeScript type
export type LinkRecord = typeof links.$inferSelect;

/**
 * Create link request payload
 */
export const CreateLinkBody = z
  .object({
    r_to: z.string().url("r_to must be a valid URL").describe("Destination URL"),
    r_path: z
      .string()
      .min(2, "r_path must be at least 2 characters")
      .max(32, "r_path must be at most 32 characters")
      .regex(/^[a-z0-9-]+$/, "Only lowercase letters, digits and hyphens allowed")
      .optional()
      .describe("Optional custom slug (2–32 lowercase alphanumeric/hyphen chars)"),
  })
  .describe("Create link request payload")
  .meta({
    example: { r_to: "https://workshop.dastyare.social/summer-2026", r_path: "summer-2026" },
  });

/**
 * Update link request payload
 */
export const UpdateLinkBody = z
  .object({
    r_to: z.string().url("r_to must be a valid URL").optional().describe("New destination URL"),
    is_active: z.boolean().optional().describe("Active state (true = enabled, false = disabled)"),
  })
  .describe("Update link request payload")
  .meta({
    example: { r_to: "https://workshop.dastyare.social/winter-2026", is_active: false },
  });

/**
 * Path parameter for link routes
 */
export const LinkPathParam = z
  .object({
    link: z
      .string()
      .describe("Link ID or r_path slug")
      .meta({ example: "summer-2026" }),
  })
  .describe("Link path parameter")
  .meta({
    example: { link: "summer-2026" },
  });

/**
 * Link object
 */
export const LinkResponse = z
  .object({
    id: z.string().describe("Link ID"),
    r_path: z.string().describe("Short path slug"),
    r_to: z.string().describe("Destination URL"),
    is_active: z.boolean().describe("Active state"),
    redirects: z.string().describe("Redirect count"),
    createdAt: z.string().datetime().describe("Creation timestamp"),
    updatedAt: z.string().datetime().describe("Last update timestamp"),
  })
  .describe("Link object")
  .meta({
    example: {
      id: "a1b2c3d4e5f6g7h8",
      r_path: "summer-2026",
      r_to: "https://workshop.dastyare.social/summer-2026",
      is_active: true,
      redirects: "236",
      createdAt: "2026-06-01T10:30:00.000Z",
      updatedAt: "2026-07-15T14:20:00.000Z",
    },
  });

/**
 * Success response
 */
export const SuccessResponse = z
  .object({
    success: z.boolean().describe("Operation success status"),
  })
  .describe("Success response")
  .meta({
    example: { success: true },
  });

/**
 * Error response
 */
export const ErrorResponse = z
  .object({
    error: z.string().describe("Error message"),
  })
  .describe("Error response")
  .meta({
    example: { error: "Link not found" },
  });

/**
 * List of links
 */
export const LinkListResponse = z
  .array(LinkResponse)
  .describe("List of links")
  .meta({
    example: [
      {
        id: "a1b2c3d4e5f6g7h8",
        r_path: "summer-2026",
        r_to: "https://workshop.dastyare.social/summer-2026",
        is_active: true,
        redirects: "236",
        createdAt: "2026-06-01T10:30:00.000Z",
        updatedAt: "2026-07-15T14:20:00.000Z",
      },
      {
        id: "b2c3d4e5f6g7h8i9",
        r_path: "docs",
        r_to: "https://docs.dastyare.social",
        is_active: true,
        redirects: "42",
        createdAt: "2026-05-14T15:45:00.000Z",
        updatedAt: "2026-05-14T15:45:00.000Z",
      },
    ],
  });

// Export types for use in JSDoc
export type LinkResponseType = z.infer<typeof LinkResponse>;
export type SuccessResponseType = z.infer<typeof SuccessResponse>;
export type ErrorResponseType = z.infer<typeof ErrorResponse>;
export type LinkListResponseType = z.infer<typeof LinkListResponse>;
