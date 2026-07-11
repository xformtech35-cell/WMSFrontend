/**
 * Parses GS1-128 or GS1 DataMatrix scans containing GTIN, Expiry, Batch, and Serial.
 * Supports:
 * 1. Parenthesized format: (01)08901072001234(17)261231(10)LOT12345
 * 2. GS/FNC1 separated raw format: 01089010720012341726123110LOT12345 (with \x1d separator)
 *
 * @param {string} scan Raw scanner input string.
 * @returns {object|null} Parsed GS1 components.
 */
export function parseGS1(scan) {
  if (!scan) return null;
  
  const trimmed = scan.trim();
  
  // 1. Parenthesized human-readable format
  if (trimmed.startsWith('(')) {
    const regex = /\((\d{2,4})\)([^()]+)/g;
    let match;
    const results = {};
    while ((match = regex.exec(trimmed)) !== null) {
      results[match[1]] = match[2];
    }
    return mapAIs(results);
  }

  // 2. Raw transmission format
  // Strip standard symbology prefixes: ]C1 (GS1-128), ]d2 (GS1 DataMatrix)
  let raw = trimmed.replace(/^\]C1|^\]d2/, '');
  
  const results = {};
  let idx = 0;
  const gsChar = '\x1d'; // standard ASCII 29 Group Separator
  
  while (idx < raw.length) {
    if (raw.startsWith('01', idx)) {
      results['01'] = raw.substring(idx + 2, idx + 16);
      idx += 16;
    } else if (raw.startsWith('17', idx)) {
      results['17'] = raw.substring(idx + 2, idx + 8);
      idx += 8;
    } else if (raw.startsWith('11', idx)) {
      results['11'] = raw.substring(idx + 2, idx + 8);
      idx += 8;
    } else if (raw.startsWith('10', idx)) {
      let nextGs = raw.indexOf(gsChar, idx + 2);
      if (nextGs === -1) nextGs = raw.length;
      results['10'] = raw.substring(idx + 2, nextGs);
      idx = nextGs + 1;
    } else if (raw.startsWith('21', idx)) {
      let nextGs = raw.indexOf(gsChar, idx + 2);
      if (nextGs === -1) nextGs = raw.length;
      results['21'] = raw.substring(idx + 2, nextGs);
      idx = nextGs + 1;
    } else {
      // Fallback: If we hit unrecognized characters, skip forward to scan next characters
      idx++;
    }
  }

  // Fallback: If no AIs were parsed but the string has basic length (e.g. simple serial/GTIN),
  // return null or treat as standard barcode.
  if (Object.keys(results).length === 0) {
    return null;
  }

  return mapAIs(results);
}

function mapAIs(ais) {
  const gtin = ais['01'] || null;
  const expiryRaw = ais['17'] || null;
  const manufactureRaw = ais['11'] || null;
  const batchNumber = ais['10'] || null;
  const serialNumber = ais['21'] || null;

  // Format Expiry: YYMMDD -> YYYY-MM-DD
  const formatGS1Date = (dateStr) => {
    if (!dateStr || dateStr.length !== 6) return null;
    const yy = parseInt(dateStr.substring(0, 2), 10);
    const mm = dateStr.substring(2, 4);
    const dd = dateStr.substring(4, 6);
    const year = yy >= 50 ? '19' + yy : '20' + yy;
    return `${year}-${mm}-${dd}`;
  };

  return {
    gtin,
    expiryDate: formatGS1Date(expiryRaw),
    manufactureDate: formatGS1Date(manufactureRaw),
    batchNumber,
    serialNumber,
    raw: ais
  };
}
