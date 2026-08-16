import { type NextRequest, NextResponse } from "next/server";
import { createLink, getLinks } from "@/lib/actions/links";
import { requireApiKeyAuth } from "@/lib/auth/api-key";
import { isDemoMode } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

/**
 * List all short links
 *
 * Returns every short link ordered by creation date (newest first). Includes
 * the redirect counter for each link so you can see which destinations are
 * performing well.
 *
 * @openapi
 * @tag Links
 * @summary List all short links
 * @description Returns every short link ordered by creation date (newest first). Includes the redirect counter for each link.
 * @auth bearer
 * @response 200:LinkListResponse:Links retrieved successfully
 * @response 401:ErrorResponse:Unauthorized — invalid or missing API key
 * @response 500:ErrorResponse:Internal server error
 */
export async function GET(req: NextRequest) {
  const denied = requireApiKeyAuth(req);
  if (denied) return denied;

  const result = await getLinks();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.data);
}

/**
 * Create a new short link
 *
 * Creates a new short link. A random slug is generated when `r_path` is
 * omitted. The link is created active (`is_active: true`) by default.
 *
 * @openapi
 * @tag Links
 * @summary Create a short link
 * @description Creates a new short link. A random slug is generated when `r_path` is omitted.
 * @auth bearer
 * @body CreateLinkBody
 * @bodyDescription Create link request
 * @response 201:LinkResponse:Link created successfully
 * @response 400:ErrorResponse:Validation error — invalid URL or r_path format
 * @response 401:ErrorResponse:Unauthorized — invalid or missing API key
 * @response 409:ErrorResponse:Path already in use
 * @response 500:ErrorResponse:Internal server error
 */
export async function POST(req: NextRequest) {
  const denied = requireApiKeyAuth(req);
  if (denied) return denied;

  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Read-only demo mode is active" },
      { status: 403 },
    );
  }

  let body: { r_to?: string; r_path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.r_to) {
    return NextResponse.json({ error: "r_to is required" }, { status: 400 });
  }

  const result = await createLink({ r_to: body.r_to, r_path: body.r_path });

  if (!result.success) {
    const status = result.error?.includes("already in use")
      ? 409
      : result.error?.includes("valid URL")
        ? 400
        : result.error?.includes("characters")
          ? 400
          : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data, { status: 201 });
}
