import XLSX from 'xlsx';
import { sheets } from './googleAuth.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const { spreadsheetId } = config;

const filePath = process.argv[2] || 'C:\\Users\\Tech2Saini\\Downloads\\THE HERITAGE.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets['inflow'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

function normalizeMonth(raw) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (typeof raw === 'number') {
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    const yr = String(d.getFullYear()).slice(2);
    return `${months[d.getMonth()]}-${yr}`;
  }
  return String(raw).trim();
}

const rawHeaders = data[0];
// Skip Type column (index 0), keep Category (1), Payee Name (2), Total (3), months (4+)
const monthHeaders = rawHeaders.slice(4).map(normalizeMonth);
const header = ['Category', 'Payee Name', 'Total', ...monthHeaders];

const rows = [header];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const category = String(row[1] || '').trim();
  const name = String(row[2] || '').trim();
  if (!category || !name) continue;

  const values = row.slice(4).map(cell => {
    if (cell === '' || cell == null) return '';
    return Number(cell) || 0;
  });

  const rowNum = rows.length + 1;
  rows.push([category, name, `=SUM(D${rowNum}:${rowNum})`, ...values]);
}

console.log(`Parsed ${rows.length - 1} inflow entries`);
console.log('Months:', monthHeaders.join(', '));

try {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Inflow!A1:AZ100',
  });
} catch (e) {
  console.log('Could not clear Inflow sheet:', e.message);
}

// Header as RAW to prevent date auto-formatting
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Inflow!A1',
  valueInputOption: 'RAW',
  requestBody: { values: [header] },
});

// Data as USER_ENTERED so formulas work
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Inflow!A2',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: rows.slice(1) },
});

console.log(`Uploaded ${rows.length - 1} inflow entries to Google Sheets "Inflow" tab`);
