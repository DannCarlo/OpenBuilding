import type { StaadMemberProperty } from '../types';
import { expandRange, stripComments } from '../utils';

/**
 * Parse a MEMBER PROPERTY line.
 * Format: [memberIds/Ranges] PRIS YD <val> ZD <val>
 *         [memberIds/Ranges] TABLE ST <name>
 */
export function parseMemberPropertyLine(line: string): StaadMemberProperty | null {
  const cleaned = stripComments(line);
  if (!cleaned) return null;

  const tokens = cleaned.split(/\s+/);
  if (tokens.length < 2) return null;

  // Find where the property type keyword starts
  let propStartIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const upper = tokens[i].toUpperCase();
    if (upper === 'PRIS' || upper === 'TABLE' || upper === 'TAPERED' || upper === 'USER') {
      propStartIdx = i;
      break;
    }
  }

  if (propStartIdx === -1) return null;

  // IDs are everything before the property keyword
  const idTokens = tokens.slice(0, propStartIdx);
  const propTokens = tokens.slice(propStartIdx);

  const memberIds = expandRange(idTokens);
  if (memberIds.length === 0) return null;

  const propType = propTokens[0].toUpperCase();

  const prop: StaadMemberProperty = {
    memberIds,
    type: 'UNKNOWN',
    description: '',
  };

  if (propType === 'PRIS') {
    prop.type = 'PRIS';
    const ydIdx = propTokens.findIndex(t => t.toUpperCase() === 'YD');
    const zdIdx = propTokens.findIndex(t => t.toUpperCase() === 'ZD');
    const ybIdx = propTokens.findIndex(t => t.toUpperCase() === 'YB');
    const zbIdx = propTokens.findIndex(t => t.toUpperCase() === 'ZB');
    if (ydIdx >= 0 && ydIdx < propTokens.length - 1) {
      prop.yd = parseFloat(propTokens[ydIdx + 1]);
    }
    if (zdIdx >= 0 && zdIdx < propTokens.length - 1) {
      prop.zd = parseFloat(propTokens[zdIdx + 1]);
    }
    if (ybIdx >= 0 && ybIdx < propTokens.length - 1) {
      prop.yb = parseFloat(propTokens[ybIdx + 1]);
    }
    if (zbIdx >= 0 && zbIdx < propTokens.length - 1) {
      prop.zb = parseFloat(propTokens[zbIdx + 1]);
    }
    // Description handled by toBaseResult() for accurate shape naming
    prop.description = `PRIS ${prop.yd ?? '?'}×${prop.zd ?? '?'}m`;
  } else if (propType === 'TABLE') {
    prop.type = 'TABLE';
    // TABLE <material> <sectionName>
    if (propTokens.length >= 3) {
      prop.tableName = propTokens.slice(2).join(' ');
    } else if (propTokens.length >= 2) {
      prop.tableName = propTokens[1];
    }
    prop.description = `TABLE ${prop.tableName ?? 'unknown'}`;
  } else {
    prop.description = propTokens.join(' ');
  }

  return prop;
}
