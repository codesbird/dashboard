import { NextResponse } from 'next/server';
import { sheets, getSheetId, parseSheetToData } from '../../../lib/sheetHelpers.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const spreadsheetId = getSheetId();
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

    return NextResponse.json({
      periods,
      revenue,
      refunds: { totalRefunds: aggregatedRefund, items: refundItems },
      expenses,
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error.message);
    return NextResponse.json({ error: 'Failed to fetch data from Google Sheets' }, { status: 500 });
  }
}
