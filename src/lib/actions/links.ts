/**
 * Link actions — single import point for all components and pages.
 *
 * All logic lives in src/lib/api/links/ (queries + mutations).
 * This file re-exports everything under the cleaner @/lib/actions/links path.
 */
export {
  getLinks,
  getLinkByPath,
  getLinkById,
  getLinkStats,
  type LinkRecord,
} from "@/lib/api/links/queries";

export {
  createLink,
  updateLink,
  enableLink,
  disableLink,
  deleteLink,
  recordRedirect,
} from "@/lib/api/links/mutations";
