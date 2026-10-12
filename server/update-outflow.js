import XLSX from 'xlsx';
import { sheets } from './googleAuth.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const { spreadsheetId } = config;

const filePath = process.argv[2] || 'C:\\Users\\Tech2Saini\\Downloads\\deepak sir _data sheet.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

function normalizeMonth(raw) {
  const monthMap = { January:'Jan', February:'Feb', March:'Mar', April:'Apr', May:'May', June:'Jun', July:'Jul', August:'Aug', September:'Sep', October:'Oct', November:'Nov', December:'Dec' };

  if (typeof raw === 'number') {
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const yr = String(d.getFullYear()).slice(2);
    return `${months[d.getMonth()]}-${yr}`;
  }
  const s = String(raw).trim();
  const rangeMatch = s.match(/^\d+-(\w+)-(\d+)\s+to\s+/);
  if (rangeMatch) {
    const [, mon, yr] = rangeMatch;
    const shortMon = monthMap[mon] || mon.slice(0, 3);
    const shortYr = yr.length === 4 ? yr.slice(2) : yr;
    return `${shortMon}-${shortYr}`;
  }
  const simpleMatch = s.match(/^(\w+)-(\d+)$/);
  if (simpleMatch) {
    const [, mon, yr] = simpleMatch;
    const shortMon = monthMap[mon] || mon.slice(0, 3);
    const shortYr = yr.length === 4 ? yr.slice(2) : yr;
    return `${shortMon}-${shortYr}`;
  }
  return s;
}

const rawHeaders = data[0];
const months = rawHeaders.slice(2).map(normalizeMonth);
const header = ['Particulars', 'Total', ...months];

const rows = [header];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const particulars = String(row[0] || '').trim();
  if (!particulars) continue;

  const values = row.slice(2).map(cell => {
    if (cell === '' || cell == null) return '';
    return Number(cell) || 0;
  });

  rows.push([particulars, `=SUM(C${i + 1}:${String.fromCharCode(66 + months.length)}${i + 1})`, ...values]);
}

console.log(`Parsed ${rows.length - 1} outflow entries`);
console.log('Normalized months:', months.join(', '));

try {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Outflow!A1:AZ100',
  });
} catch (e) {
  console.log('Could not clear Outflow sheet:', e.message);
}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Outflow!A1',
  valueInputOption: 'RAW',
  requestBody: { values: [header] },
});

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Outflow!A2',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: rows.slice(1) },
});

console.log(`Uploaded ${rows.length - 1} outflow entries to Google Sheets "Outflow" tab`);
