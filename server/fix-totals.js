import { sheets } from './googleAuth.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const { spreadsheetId } = config;

async function fixSheet(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z100`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) {
    console.log(`${sheetName}: no data rows, skipping.`);
    return;
  }

  const formulas = [];
  for (let i = 1; i < rows.length; i++) {
    const rowNum = i + 1;
    formulas.push([`=SUM(D${rowNum}:${rowNum})`]);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!C2:C${rows.length}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: formulas },
  });

  console.log(`${sheetName}: set SUM formulas for ${formulas.length} rows (C2:C${rows.length}).`);
}

async function main() {
  console.log('Setting Total column formulas...\n');
  await fixSheet('Inflow');
  await fixSheet('Outflow');
  console.log('\nDone! Total columns now auto-sum all month columns.');
}

main().catch(console.error);
