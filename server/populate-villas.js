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
const ws = wb.Sheets['Villas'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

const header = ['Sr No', 'Client Name', 'Villa No.', 'Unit Type', 'Ats Value', 'Amount Received', 'Balance'];
const rows = [header];

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const srNo = row[0];
  if (!srNo && srNo !== 0) continue;

  const clientName = String(row[1] || '').trim();
  const villaNo = String(row[2] || '').trim();
  const unitType = String(row[3] || '').trim();
  const atsValue = Number(row[4]) || 0;
  const received = typeof row[5] === 'string' ? Number(row[5].replace(/,/g, '')) : (Number(row[5]) || 0);
  const balance = typeof row[6] === 'string' ? Number(row[6].replace(/,/g, '')) : (Number(row[6]) || 0);

  rows.push([Number(srNo), clientName, villaNo, unitType, atsValue, received, balance]);
}

console.log(`Parsed ${rows.length - 1} villas from Excel`);

try {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'Villas!A1:G200',
  });
} catch (e) {
  console.log('Villas sheet may not exist, attempting to create...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: 'Villas' } } }],
    },
  });
}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Villas!A1',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: rows },
});

console.log(`Uploaded ${rows.length - 1} villas to Google Sheets "Villas" tab`);
