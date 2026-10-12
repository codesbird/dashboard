import { NextResponse } from 'next/server';
import { sheets, getSheetId, addSumFormulas } from '../../../lib/sheetHelpers.js';

export async function POST(request) {
  try {
    const { rows } = await request.json();
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const spreadsheetId = getSheetId();
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating outflow:', error.message);
    return NextResponse.json({ error: 'Failed to update outflow data' }, { status: 500 });
  }
}
