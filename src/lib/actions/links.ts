/**
 * Link actions — single import point for all components and pages.
 *
 * All logic lives in src/lib/api/links/ (queries + mutations).
 * This file re-exports everything under the cleaner @/lib/actions/links path.
 */

export {
  createLink,
  deleteLink,
  disableLink,
  enableLink,
  recordRedirect,
  updateLink,
} from "@/lib/api/links/mutations";
export {
  getLinkById,
  getLinkByPath,
  getLinkStats,
  getLinks,
  type LinkRecord,
} from "@/lib/api/links/queries";
