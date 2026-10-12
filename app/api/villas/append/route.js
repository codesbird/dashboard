import { NextResponse } from 'next/server';
import { sheets, getSheetId } from '../../../../lib/sheetHelpers.js';

export async function POST(request) {
  try {
    const { rows } = await request.json();
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided' }, { status: 400 });
    }

    const spreadsheetId = getSheetId();

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Villas!A1:G200',
    });
    const existingRows = existing.data.values || [];
    const startRow = existingRows.length + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Villas!A${startRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    return NextResponse.json({ success: true, added: rows.length });
  } catch (error) {
    console.error('Error appending villas:', error.message);
    return NextResponse.json({ error: 'Failed to append villa data' }, { status: 500 });
  }
}
