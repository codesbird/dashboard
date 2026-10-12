import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let _spreadsheetId;

export function getSpreadsheetId() {
  if (_spreadsheetId) return _spreadsheetId;

  const filePath = join(process.cwd(), 'server', 'config.json');

  if (existsSync(filePath)) {
    const config = JSON.parse(readFileSync(filePath, 'utf8'));
    _spreadsheetId = config.spreadsheetId;
  } else if (process.env.SPREADSHEET_ID) {
    _spreadsheetId = process.env.SPREADSHEET_ID;
  } else {
    throw new Error('No spreadsheet ID found. Provide server/config.json or set SPREADSHEET_ID env variable.');
  }
  return _spreadsheetId;
}
