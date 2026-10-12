import { NextResponse } from 'next/server';
import { sheets, getSheetId } from '../../../../lib/sheetHelpers.js';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const spreadsheetId = getSheetId();

    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Villas!A1:G200',
    });

    const rows = sheetRes.data.values || [];
    const headers = rows.length > 0 ? rows[0] : ['Sr No', 'Client Name', 'Villa No.', 'Unit Type', 'Ats Value', 'Amount Received', 'Balance'];

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Villas Template');

    const headerRow = ws.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF4472C4' } } };
      cell.alignment = { horizontal: 'center' };
    });

    ws.getColumn(1).width = 8;
    ws.getColumn(2).width = 30;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 12;
    ws.getColumn(5).width = 14;
    ws.getColumn(6).width = 18;
    ws.getColumn(7).width = 14;

    const unitTypes = ['4 BHK'];
    const formulae = `"${unitTypes.join(',')}"`;
    for (let r = 2; r <= 101; r++) {
      ws.getCell(`D${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [formulae],
        showErrorMessage: false,
      };
    }

    const noteWs = workbook.addWorksheet('Instructions');
    noteWs.getColumn(1).width = 50;
    noteWs.addRow(['Villa Data Upload Instructions']);
    noteWs.getRow(1).font = { bold: true, size: 14 };
    noteWs.addRow([]);
    noteWs.addRow(['Columns:']);
    noteWs.addRow(['Sr No — Serial number (required)']);
    noteWs.addRow(['Client Name — Leave blank if villa is unsold']);
    noteWs.addRow(['Villa No. — e.g. "Villa No. 01"']);
    noteWs.addRow(['Unit Type — e.g. "4 BHK"']);
    noteWs.addRow(['Ats Value — Agreement to sell value in INR']);
    noteWs.addRow(['Amount Received — Payment received so far']);
    noteWs.addRow(['Balance — Remaining amount due']);

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=heritage_villas_template.xlsx',
      },
    });
  } catch (error) {
    console.error('Error generating villas template:', error.message);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
