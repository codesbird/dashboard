import { sheets } from './googleAuth.js';
import { getSpreadsheetId } from './config.js';

export { sheets };
export function getSheetId() { return getSpreadsheetId(); }

const CATEGORY_MAP = [
  { pattern: /brokerage/i, category: 'Brokerage' },
  { pattern: /salary/i, category: 'Salary Exp.' },
  { pattern: /electricity/i, category: 'Electricity Exp.' },
  { pattern: /sales.*marketing/i, category: 'Sales & Marketing' },
  { pattern: /stamp\s*duty/i, category: 'Fees & Taxes' },
  { pattern: /rera/i, category: 'Fees & Taxes' },
  { pattern: /jda/i, category: 'Fees & Taxes' },
  { pattern: /legal|professional|consultancy/i, category: 'Fees & Taxes' },
  { pattern: /land\s*owner/i, category: 'Land Owner' },
  { pattern: /land\s*scap/i, category: 'Site Expenses' },
  { pattern: /site\s*exp/i, category: 'Site Expenses' },
  { pattern: /work\s*contract/i, category: 'Site Expenses' },
  { pattern: /office\s*exp/i, category: 'Office Exp.' },
  { pattern: /graphite|design\s*stu/i, category: 'Office Exp.' },
  { pattern: /refund/i, category: 'Refund' },
];

function deriveCategory(particulars) {
  for (const { pattern, category } of CATEGORY_MAP) {
    if (pattern.test(particulars)) return category;
  }
  return 'Other';
}

export function parseSheetToData(rows, format = 'auto') {
  if (!rows || rows.length < 2) return { periods: [], categories: {} };

  const headers = rows[0];
  const firstHeader = String(headers[0] || '').trim().toLowerCase();
  const isOutflow = format === 'outflow' || firstHeader === 'particulars';
  const dataStart = isOutflow ? 2 : 3;
  const periods = headers.slice(dataStart);
  const categories = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    let category, name, totalIdx;
    if (isOutflow) {
      const particulars = String(row[0] || '').trim();
      if (!particulars) continue;
      category = deriveCategory(particulars);
      name = particulars;
      totalIdx = 1;
    } else {
      category = String(row[0] || '').trim();
      name = String(row[1] || '').trim();
      totalIdx = 2;
      if (!category || !name) continue;
    }

    const sheetTotal = Number(row[totalIdx]) || 0;
    const item = { name };
    let computedTotal = 0;
    periods.forEach((month, idx) => {
      const val = Number(row[dataStart + idx]) || 0;
      if (val > 0) {
        item[month] = val;
        computedTotal += val;
      }
    });
    item.total = computedTotal > 0 ? computedTotal : sheetTotal;

    if (!categories[category]) categories[category] = [];
    categories[category].push(item);
  }

  return { periods, categories };
}

export function addSumFormulas(rows, dataStart = 3) {
  const colLetter = String.fromCharCode(64 + dataStart + 1);
  return rows.map((row, i) => {
    if (i === 0) return row;
    const rowNum = i + 1;
    const newRow = [...row];
    newRow[dataStart - 1] = `=SUM(${colLetter}${rowNum}:${rowNum})`;
    return newRow;
  });
}

export async function appendRows(sheetName, dataRows) {
  const spreadsheetId = getSpreadsheetId();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:A100`,
  });
  const nextRow = (existing.data.values?.length || 1) + 1;

  const isOutflow = sheetName === 'Outflow';
  const dataStart = isOutflow ? 2 : 3;
  const colLetter = String.fromCharCode(64 + dataStart + 1);

  const rowsWithFormulas = dataRows.map((row, i) => {
    const rowNum = nextRow + i;
    const newRow = [...row];
    newRow[dataStart - 1] = `=SUM(${colLetter}${rowNum}:${rowNum})`;
    return newRow;
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rowsWithFormulas },
  });

  return rowsWithFormulas.length;
}
