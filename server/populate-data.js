import { sheets } from './googleAuth.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const { spreadsheetId } = config;

const periods = [
  'Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25',
  'Jan-26','Feb-26','Mar-26',
  'Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26',
  'Jan-27','Feb-27','Mar-27'
];

function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function buildRow(category, name, monthValues) {
  const rowNum = null; // placeholder, set below
  return [category, name, '', ...monthValues];
}

function addFormulas(rows) {
  return rows.map((row, i) => {
    if (i === 0) return row;
    const rowNum = i + 1;
    const newRow = [...row];
    newRow[2] = `=SUM(D${rowNum}:${rowNum})`;
    return newRow;
  });
}

const inflowData = (() => {
  const header = ['Category', 'Payee Name', 'Total', ...periods];

  const blockA = buildRow('Booking Advances', 'Block A Bookings', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 3) return rand(800000, 1500000);
    if (m < 6) return rand(500000, 1200000);
    if (m < 9) return rand(300000, 900000);
    if (m < 12) return rand(200000, 700000);
    if (m < 15) return rand(1000000, 1800000);
    if (m < 18) return rand(400000, 1000000);
    if (m < 21) return rand(200000, 600000);
    return rand(100000, 500000);
  }));

  const blockB = buildRow('Booking Advances', 'Block B Bookings', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 6) return rand(600000, 1400000);
    if (m < 12) return rand(300000, 800000);
    if (m < 18) return rand(1200000, 2000000);
    return rand(200000, 700000);
  }));

  const blockC = buildRow('Booking Advances', 'Block C Bookings', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 12) return rand(100000, 400000);
    return rand(500000, 1500000);
  }));

  const plinth = buildRow('Installments (Linked)', 'Plinth Level', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 4) return 0;
    if (m < 8) return rand(2000000, 5500000);
    if (m < 12) return rand(1000000, 3000000);
    if (m < 16) return rand(3000000, 6000000);
    if (m < 20) return rand(1500000, 4000000);
    return rand(500000, 2000000);
  }));

  const slab = buildRow('Installments (Linked)', 'Slab Casting', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 6) return 0;
    if (m < 10) return rand(3000000, 7000000);
    if (m < 14) return rand(1500000, 4000000);
    if (m < 18) return rand(4000000, 8000000);
    if (m < 22) return rand(2000000, 5000000);
    return rand(1000000, 3000000);
  }));

  const superstructure = buildRow('Installments (Linked)', 'Superstructure', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 10) return 0;
    if (m < 14) return rand(1000000, 3000000);
    if (m < 18) return rand(2000000, 5000000);
    return rand(1500000, 4000000);
  }));

  const handover = buildRow('Final Settlements', 'Handover Dues', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 8) return 0;
    if (m < 12) return rand(500000, 2000000);
    if (m < 16) return rand(1000000, 3000000);
    if (m < 20) return rand(800000, 2500000);
    return rand(1500000, 4000000);
  }));

  const registry = buildRow('Final Settlements', 'Registry Payments', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 10) return 0;
    if (m < 14) return rand(300000, 800000);
    if (m < 18) return rand(500000, 1200000);
    return rand(400000, 1000000);
  }));

  const otherIncome = buildRow('Other Income', 'Parking & Amenities', periods.map(() => rand(10000, 80000)));

  return addFormulas([header, blockA, blockB, blockC, plinth, slab, superstructure, handover, registry, otherIncome]);
})();

const outflowData = (() => {
  const header = ['Category', 'Payee Name', 'Total', ...periods];

  const broker1 = buildRow('Brokerage', 'Sky Bridge Realty', periods.map(p => {
    const m = periods.indexOf(p);
    return m % 3 === 0 ? rand(300000, 800000) : rand(100000, 400000);
  }));

  const broker2 = buildRow('Brokerage', 'Narsinghpura Estates', periods.map(() => rand(50000, 250000)));

  const elec1 = buildRow('Electricity Exp.', 'Electricity Exp. Heritage', periods.map(p => {
    const m = periods.indexOf(p);
    const summer = [0,1,2,3,4,12,13,14,15,16];
    return summer.includes(m) ? rand(100000, 300000) : rand(40000, 120000);
  }));

  const elec2 = buildRow('Electricity Exp.', 'Jaipur Electricity', periods.map(p => {
    const m = periods.indexOf(p);
    const summer = [0,1,2,3,4,12,13,14,15,16];
    return summer.includes(m) ? rand(80000, 200000) : rand(30000, 90000);
  }));

  const salary1 = buildRow('Salary Exp.', 'Rawal Singh', periods.map(() => rand(30000, 55000)));
  const salary2 = buildRow('Salary Exp.', 'Mohan Lal', periods.map(() => rand(25000, 45000)));
  const salary3 = buildRow('Salary Exp.', 'Suresh Kumar', periods.map(() => rand(20000, 35000)));

  const contractor = buildRow('Work Contract', 'Karni Construction', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 4) return rand(1500000, 3000000);
    if (m < 8) return rand(2000000, 4000000);
    if (m < 12) return rand(1000000, 2500000);
    if (m < 16) return rand(2500000, 5000000);
    if (m < 20) return rand(1500000, 3500000);
    return rand(1000000, 2000000);
  }));

  const contractor2 = buildRow('Work Contract', 'Sharma Builders', periods.map(p => {
    const m = periods.indexOf(p);
    if (m < 6) return 0;
    if (m < 12) return rand(500000, 1500000);
    if (m < 18) return rand(800000, 2000000);
    return rand(400000, 1200000);
  }));

  const marketing = buildRow('Sales & Marketing', 'Digital Ads & Hoardings', periods.map(() => rand(50000, 200000)));
  const marketing2 = buildRow('Sales & Marketing', 'Broker Events', periods.map(p => {
    const m = periods.indexOf(p);
    return m % 4 === 0 ? rand(100000, 300000) : rand(20000, 80000);
  }));

  const fees = buildRow('Fees & Taxes', 'RERA & Legal Fees', periods.map(p => {
    const m = periods.indexOf(p);
    return m % 6 === 0 ? rand(200000, 500000) : rand(10000, 60000);
  }));

  const refund1 = buildRow('Refund', 'Rajesh', [
    rand(5000, 15000), 0, 0, 0, rand(3000, 8000), 0, 0, 0, 0, 0, 0, 0,
    rand(5000, 10000), 0, 0, 0, rand(2000, 5000), 0, 0, 0, 0, 0, 0, 0
  ]);
  const refund2 = buildRow('Refund', 'Brijesh', [
    0, rand(2000, 6000), 0, 0, 0, 0, rand(1000, 4000), 0, 0, 0, 0, 0,
    0, rand(3000, 7000), rand(500, 2000), 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]);
  const refund3 = buildRow('Refund', 'Priya Sharma', [
    0, 0, 0, 0, 0, 0, 0, 0, 0, rand(8000, 20000), 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, rand(5000, 15000), 0, 0, 0
  ]);

  return addFormulas([header, broker1, broker2, elec1, elec2, salary1, salary2, salary3, contractor, contractor2, marketing, marketing2, fees, refund1, refund2, refund3]);
})();

async function main() {
  console.log('Populating spreadsheet with full 2-year dummy data...\n');

  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Inflow!A1:Z100' });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Inflow!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: inflowData },
  });
  console.log(`Inflow: ${inflowData.length - 1} rows, ${periods.length} months`);

  await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'Outflow!A1:Z100' });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Outflow!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: outflowData },
  });
  console.log(`Outflow: ${outflowData.length - 1} rows, ${periods.length} months`);

  console.log('\nDone! Data now covers Apr-25 through Mar-27 (2 full financial years).');
  console.log(`Spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

main().catch(console.error);
