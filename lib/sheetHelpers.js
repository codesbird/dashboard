import { sheets } from './googleAuth.js';
import { spreadsheetId } from './config.js';

export { sheets, spreadsheetId };

export function parseSheetToData(rows) {
  if (!rows || rows.length < 2) return { periods: [], categories: {} };

  const headers = rows[0];
  const periods = headers.slice(3);
  const categories = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const category = String(row[0] || '').trim();
    const name = String(row[1] || '').trim();
    const sheetTotal = Number(row[2]) || 0;

    if (!category || !name) continue;

    const item = { name };
    let computedTotal = 0;
    periods.forEach((month, idx) => {
      const val = Number(row[3 + idx]) || 0;
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

export function addSumFormulas(rows) {
  return rows.map((row, i) => {
    if (i === 0) return row;
    const rowNum = i + 1;
    const newRow = [...row];
    newRow[2] = `=SUM(D${rowNum}:${rowNum})`;
    return newRow;
  });
}

export async function appendRows(sheetName, dataRows) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:A100`,
  });
  const nextRow = (existing.data.values?.length || 1) + 1;

  const rowsWithFormulas = dataRows.map((row, i) => {
    const rowNum = nextRow + i;
    const newRow = [...row];
    newRow[2] = `=SUM(D${rowNum}:${rowNum})`;
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
