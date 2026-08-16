import { NextRequest, NextResponse } from "next/server";
import { requireApiKeyAuth } from "@/lib/auth/api-key";
import { getLinkById, getLinkByPath, updateLink, deleteLink } from "@/lib/actions/links";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ link: string }> };

/** Resolve a link by ID first, then by r_path slug. */
async function resolveLink(identifier: string) {
  const byId = await getLinkById(identifier);
  if (byId.success) return byId;
  return getLinkByPath(identifier);
}

/**
 * Get a link by ID or slug
 * 
 * Fetches a single link by its ID or r_path slug (searches by ID first, then by slug).
 * 
 * @openapi
 * @tag Links
 * @summary Get a link by ID or slug
 * @description Fetches a single link by its ID or r_path slug (searches by ID first, then by slug).
 * @auth bearer
 * @pathParams LinkPathParam
 * @response 200:LinkResponse:Link retrieved successfully
 * @response 401:ErrorResponse:Unauthorized — invalid or missing API key
 * @response 404:ErrorResponse:Link not found
 * @response 500:ErrorResponse:Internal server error
 */
export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireApiKeyAuth(req);
  if (denied) return denied;

  const { link } = await params;
  const result = await resolveLink(link);

  if (!result.success) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
  return NextResponse.json(result.data);
}

/**
 * Update a link
 * 
 * Update `r_to` and/or `is_active` for a link identified by ID or slug.
 * Provide at least one field; omitted fields are left unchanged.
 * 
 * @openapi
 * @tag Links
 * @summary Update a link
 * @description Update `r_to` and/or `is_active` for a link identified by ID or slug.
 * @auth bearer
 * @pathParams LinkPathParam
 * @body UpdateLinkBody
 * @bodyDescription Update link request
 * @response 200:LinkResponse:Link updated successfully
 * @response 400:ErrorResponse:Validation error — invalid URL or no fields provided
 * @response 401:ErrorResponse:Unauthorized — invalid or missing API key
 * @response 404:ErrorResponse:Link not found
 * @response 500:ErrorResponse:Internal server error
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = requireApiKeyAuth(req);
  if (denied) return denied;

  const { link } = await params;

  let body: { r_to?: string; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: { r_to?: string; is_active?: boolean } = {};
  if (body.r_to !== undefined) patch.r_to = body.r_to;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one field to update (r_to, is_active)" },
      { status: 400 },
    );
  }

  // Resolve to an ID first
  const resolved = await resolveLink(link);
  if (!resolved.success) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const result = await updateLink(resolved.data!.id, patch);
  if (!result.success) {
    const status = result.error?.includes("valid URL") ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.data);
}

/**
 * Delete a link
 * 
 * Permanently deletes the link identified by ID or slug. This cannot be undone.
 * 
 * @openapi
 * @tag Links
 * @summary Delete a link
 * @description Permanently deletes the link identified by ID or slug.
 * @auth bearer
 * @pathParams LinkPathParam
 * @response 200:SuccessResponse:Link deleted successfully
 * @response 401:ErrorResponse:Unauthorized — invalid or missing API key
 * @response 404:ErrorResponse:Link not found
 * @response 500:ErrorResponse:Internal server error
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const denied = requireApiKeyAuth(req);
  if (denied) return denied;

  const { link } = await params;

  const resolved = await resolveLink(link);
  if (!resolved.success) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const result = await deleteLink(resolved.data!.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
