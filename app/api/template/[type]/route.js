import { NextResponse } from 'next/server';
import { sheets, getSheetId } from '../../../../lib/sheetHelpers.js';
import ExcelJS from 'exceljs';

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    const sheetName = type === 'inflow' ? 'Inflow' : 'Outflow';
    const spreadsheetId = getSheetId();

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

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=heritage_${type}_template.xlsx`,
      },
    });
  } catch (error) {
    console.error('Error generating template:', error.message);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
