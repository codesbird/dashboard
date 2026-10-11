import { sheets } from './googleAuth.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const { spreadsheetId } = config;

function parseCSV(csvText) {
  const rows = csvText.trim().split('\n');
  return rows.map((row, i) => {
    const values = row.split(',');
    return values.map((v, col) => {
      if (i > 0 && col === 2) {
        return `=SUM(D${i + 1}:${i + 1})`;
      }
      const trimmed = v.trim().replace(/["\r]/g, '');
      const num = Number(trimmed);
      return isNaN(num) ? trimmed : num;
    });
  });
}

async function main() {
  console.log(`Populating spreadsheet: ${spreadsheetId}\n`);

  const inflowCSV = readFileSync(join(__dirname, '..', 'data', 'inflow.csv'), 'utf8');
  const outflowCSV = readFileSync(join(__dirname, '..', 'data', 'outflow.csv'), 'utf8');

  const inflowData = parseCSV(inflowCSV);
  const outflowData = parseCSV(outflowCSV);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Inflow!A1:Z100',
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Inflow!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: inflowData },
  });

  console.log('Inflow sheet populated.');

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Outflow!A1:Z100',
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Outflow!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: outflowData },
  });

  console.log('Outflow sheet populated.');
  console.log('\nSetup complete!');
  console.log(`Spreadsheet URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

main().catch(console.error);
