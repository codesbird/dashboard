import { NextResponse } from 'next/server';
import { appendRows } from '../../../../lib/sheetHelpers.js';

export async function POST(request) {
  try {
    const { rows } = await request.json();
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided' }, { status: 400 });
    }
    const added = await appendRows('Inflow', rows);
    return NextResponse.json({ success: true, added });
  } catch (error) {
    console.error('Error appending inflow:', error.message);
    return NextResponse.json({ error: 'Failed to append inflow data' }, { status: 500 });
  }
}
