import { NextResponse } from 'next/server';
import { sheets, getSheetId } from '../../../lib/sheetHelpers.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const spreadsheetId = getSheetId();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Villas!A1:G200',
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      return NextResponse.json({ villas: [] });
    }

    const villas = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;

      const clientName = String(row[1] || '').trim();
      const received = Number(String(row[5] || '0').replace(/,/g, '')) || 0;
      const balance = Number(String(row[6] || '0').replace(/,/g, '')) || 0;

      villas.push({
        srNo: Number(row[0]),
        clientName,
        villaNo: String(row[2] || '').trim(),
        unitType: String(row[3] || '').trim(),
        atsValue: Number(row[4]) || 0,
        received,
        balance,
        isSold: clientName.length > 0,
      });
    }

    return NextResponse.json({ villas });
  } catch (error) {
    console.error('Error fetching villa data:', error.message);
    return NextResponse.json({ error: 'Failed to fetch villa data' }, { status: 500 });
  }
}
