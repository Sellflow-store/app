export { CLAUSE_GROUPS, CLAUSE_GROUP_IDS, clauseGroupsByIds } from "./clauses";
export type { ClauseGroup } from "./clauses";
export {
  DEFAULT_LEGAL_DATA,
  normalizeLegalData,
  resolveLegalFields,
  resolveLegalVars,
  missingLegalFields,
  shopPublicUrl,
  REQUIRED_LEGAL_FIELDS,
} from "./data";
export type { LegalVars, LegalSources, ResolvedField, VarSource } from "./data";
export { buildTerms, buildPrivacy, formatLegalDate } from "./templates";
