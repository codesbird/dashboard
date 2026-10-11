import express from 'express';
import cors from 'cors';
import { sheets } from './googleAuth.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const { spreadsheetId } = config;

const app = express();
app.use(cors());
app.use(express.json());

function parseSheetToData(rows) {
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

app.get('/api/data', async (req, res) => {
  try {
    const [inflowRes, outflowRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Inflow!A1:AZ100' }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Outflow!A1:AZ100' }),
    ]);

    const inflow = parseSheetToData(inflowRes.data.values);
    const outflow = parseSheetToData(outflowRes.data.values);

    const periods = inflow.periods.length > 0 ? inflow.periods : outflow.periods;

    const revenue = inflow.categories;

    const refundItems = [];
    const expenses = {};

    Object.entries(outflow.categories).forEach(([category, items]) => {
      if (category.toLowerCase().includes('refund')) {
        refundItems.push(...items);
      } else {
        expenses[category] = items;
      }
    });

    const aggregatedRefund = { name: 'Refund', total: 0 };
    for (const item of refundItems) {
      aggregatedRefund.total += item.total || 0;
      for (const month of periods) {
        if (item[month]) {
          aggregatedRefund[month] = (aggregatedRefund[month] || 0) + item[month];
        }
      }
    }

    res.json({
      periods,
      revenue,
      refunds: { totalRefunds: aggregatedRefund, items: refundItems },
      expenses,
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Google Sheets' });
  }
});

function addSumFormulas(rows) {
  return rows.map((row, i) => {
    if (i === 0) return row;
    const rowNum = i + 1;
    const newRow = [...row];
    newRow[2] = `=SUM(D${rowNum}:${rowNum})`;
    return newRow;
  });
}

app.post('/api/inflow', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Inflow!A1:AZ100',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Inflow!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: addSumFormulas(rows) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating inflow:', error.message);
    res.status(500).json({ error: 'Failed to update inflow data' });
  }
});

app.post('/api/outflow', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Outflow!A1:AZ100',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Outflow!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: addSumFormulas(rows) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating outflow:', error.message);
    res.status(500).json({ error: 'Failed to update outflow data' });
  }
});

async function appendRows(sheetName, dataRows) {
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

app.post('/api/inflow/append', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data rows provided' });
    }
    const added = await appendRows('Inflow', rows);
    res.json({ success: true, added });
  } catch (error) {
    console.error('Error appending inflow:', error.message);
    res.status(500).json({ error: 'Failed to append inflow data' });
  }
});

app.post('/api/outflow/append', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data rows provided' });
    }
    const added = await appendRows('Outflow', rows);
    res.json({ success: true, added });
  } catch (error) {
    console.error('Error appending outflow:', error.message);
    res.status(500).json({ error: 'Failed to append outflow data' });
  }
});

app.get('/api/template/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const sheetName = type === 'inflow' ? 'Inflow' : 'Outflow';

    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:AZ100`,
    });

    const rows = sheetRes.data.values || [];
    const headers = rows.length > 0 ? rows[0] : ['Category', 'Payee Name', 'Total'];
    const periods = headers.slice(3);

    const existingCategories = new Set();
    for (let i = 1; i < rows.length; i++) {
      const cat = String(rows[i]?.[0] || '').trim();
      if (cat) existingCategories.add(cat);
    }
    const categoryList = [...existingCategories].sort();

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Template');

    const headerRow = ws.addRow(['Category', 'Payee Name', 'Total', ...periods]);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF4472C4' } },
      };
      cell.alignment = { horizontal: 'center' };
    });

    ws.getColumn(1).width = 22;
    ws.getColumn(2).width = 25;
    ws.getColumn(3).width = 14;
    for (let i = 4; i <= 3 + periods.length; i++) {
      ws.getColumn(i).width = 12;
    }

    if (categoryList.length > 0) {
      const formulae = `"${categoryList.join(',')}"`;
      for (let r = 2; r <= 51; r++) {
        ws.getCell(`A${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formulae],
          showErrorMessage: false,
        };
      }
    }

    const noteWs = workbook.addWorksheet('Categories');
    noteWs.getColumn(1).width = 30;
    noteWs.addRow(['Available Categories']);
    noteWs.getRow(1).font = { bold: true };
    categoryList.forEach(cat => noteWs.addRow([cat]));
    noteWs.addRow([]);
    noteWs.addRow(['You can also type a custom category directly in Column A.']);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=heritage_${type}_template.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error.message);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
