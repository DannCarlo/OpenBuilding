// Format dispatcher — centralized entry point for all parsers.
// Consumers import parse functions from here; the dispatcher
// routes to the correct format parser internally.
//
// Adding ETABS:
//   export { parseEtabsFile } from './etabs';
//
// Adding SAP2000:
//   export { parseSap2000File } from './sap2000';

export { parseStaadFile } from './staad';

// Re-export the shared output contract that ALL format parsers produce.
// The model builder and 3D viewer consume ONLY these types.
export type { BaseParseResult, ParseNode, ParseMember, ParseSection, ParseSupport } from './types';
