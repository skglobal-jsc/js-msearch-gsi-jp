#!/usr/bin/env node
// Fetches JMA area.json (or loads a local file) and builds reverse hierarchy map:
//   class20Code → { office, class10, class15, class20 } (nested structure)
// Output: src/data/jma-hierarchy.ts
//
// Usage:
//   node bin/build-jma-hierarchy.js                        # fetch from JMA URL
//   node bin/build-jma-hierarchy.js /path/to/new_area.const.js  # load local file

const https = require('https');
const fs = require('fs');
const path = require('path');

const AREA_JSON_URL = 'https://www.jma.go.jp/bosai/common/const/area.json';
const OUTPUT_PATH = path.join(__dirname, '../src/data/jma-hierarchy.ts');

// All supported language name fields (besides 'name' = Japanese and 'enName' = English)
const LANG_FIELDS = ['chName', 'zhName', 'koName', 'esName', 'ptName', 'thName', 'viName', 'inName', 'tlName', 'moName', 'buName', 'khName', 'neName'];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

/** Pick only defined lang fields from a source entry */
function pickLangFields(entry) {
  const result = {};
  for (const field of LANG_FIELDS) {
    if (entry?.[field] !== undefined) result[field] = entry[field];
  }
  return result;
}

async function main() {
  const localFile = process.argv[2];
  let area;
  let sourceLabel;

  if (localFile) {
    const resolved = path.resolve(localFile);
    console.log(`Loading local file: ${resolved}`);
    area = require(resolved);
    sourceLabel = resolved;
  } else {
    console.log('Fetching JMA area.json...');
    area = await fetchJson(AREA_JSON_URL);
    sourceLabel = AREA_JSON_URL;
  }

  const { offices = {}, class10s = {}, class15s = {}, class20s = {} } = area;
  const hasClass15s = Object.keys(class15s).length > 0;

  console.log(
    `offices: ${Object.keys(offices).length}, class10s: ${Object.keys(class10s).length}, ` +
    `class15s: ${Object.keys(class15s).length}, class20s: ${Object.keys(class20s).length}`
  );

  const hierarchy = {};

  for (const [class20Code, c20] of Object.entries(class20s)) {
    const parentCode = c20.parent;
    let officeCode, class10Code, class15Code;
    let officeEntry, class10Entry, class15Entry;

    if (hasClass15s && class15s[parentCode]) {
      class15Code = parentCode;
      class15Entry = class15s[parentCode];
      class10Code = class15Entry?.parent;
      class10Entry = class10s[class10Code];
      officeCode = class10Entry?.parent;
      officeEntry = offices[officeCode];
    } else if (class10s[parentCode]) {
      class10Code = parentCode;
      class10Entry = class10s[class10Code];
      officeCode = class10Entry?.parent;
      officeEntry = offices[officeCode];
    }

    hierarchy[class20Code] = {
      office: {
        code: officeCode,
        name: officeEntry?.name,
        enName: officeEntry?.enName,
        officeName: officeEntry?.officeName,
        ...pickLangFields(officeEntry),
      },
      class10: {
        code: class10Code,
        name: class10Entry?.name,
        enName: class10Entry?.enName,
        ...pickLangFields(class10Entry),
      },
      ...(class15Code && {
        class15: {
          code: class15Code,
          name: class15Entry?.name,
          enName: class15Entry?.enName,
        },
      }),
      class20: {
        code: class20Code,
        name: c20.name,
        enName: c20.enName,
        kana: c20.kana,
        ...pickLangFields(c20),
      },
    };
  }

  const langFieldLines = LANG_FIELDS.map(f => `  ${f}?: string;`).join('\n');

  const interfaceBlock =
    `/** Shared multilingual name fields across all JMA area types */\n` +
    `export interface JMALocalizedNames {\n` +
    `  /** Japanese (日本語) */\n` +
    `  name?: string;\n` +
    `  /** English */\n` +
    `  enName?: string;\n` +
    `  /** Chinese Simplified (简体中文) */\n` +
    `  chName?: string;\n` +
    `  /** Chinese Traditional (繁體中文) */\n` +
    `  zhName?: string;\n` +
    `  /** Korean (한국어) */\n` +
    `  koName?: string;\n` +
    `  /** Spanish (Español) */\n` +
    `  esName?: string;\n` +
    `  /** Portuguese (Português) */\n` +
    `  ptName?: string;\n` +
    `  /** Thai (ภาษาไทย) */\n` +
    `  thName?: string;\n` +
    `  /** Vietnamese (Tiếng Việt) */\n` +
    `  viName?: string;\n` +
    `  /** Indonesian (Bahasa Indonesia) */\n` +
    `  inName?: string;\n` +
    `  /** Filipino (Wikang Filipino) */\n` +
    `  tlName?: string;\n` +
    `  /** Mongolian (Монгол хэл) */\n` +
    `  moName?: string;\n` +
    `  /** Burmese (မြန်မာဘာသာ) */\n` +
    `  buName?: string;\n` +
    `  /** Khmer (ភាសាខ្មែរ) */\n` +
    `  khName?: string;\n` +
    `  /** Nepali (नेपाली) */\n` +
    `  neName?: string;\n` +
    `}\n\n` +
    `export interface JMAAreaInfo extends JMALocalizedNames {\n` +
    `  code?: string;\n` +
    `}\n\n` +
    `export interface JMAOfficeInfo extends JMAAreaInfo {\n` +
    `  /** Responsible meteorological office (気象台名) */\n` +
    `  officeName?: string;\n` +
    `}\n\n` +
    `export interface JMAClass20Info extends JMALocalizedNames {\n` +
    `  code?: string;\n` +
    `  /** Japanese reading (ふりがな) */\n` +
    `  kana?: string;\n` +
    `}\n\n` +
    `export interface JMAHierarchyEntry {\n` +
    `  office: JMAOfficeInfo;\n` +
    `  class10: JMAAreaInfo;\n` +
    `  class15?: JMAAreaInfo;\n` +
    `  class20: JMAClass20Info;\n` +
    `}`;

  const output =
    `// Auto-generated by bin/build-jma-hierarchy.js — do not edit manually\n` +
    `// Source: ${sourceLabel}\n\n` +
    `${interfaceBlock}\n\n` +
    `export const jmaHierarchy: Record<string, JMAHierarchyEntry> = ${JSON.stringify(hierarchy, null, 2)};\n`;

  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  console.log(`Written: ${OUTPUT_PATH} (${Object.keys(hierarchy).length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
