import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let spreadsheetId;
const filePath = join(process.cwd(), 'server', 'config.json');

if (existsSync(filePath)) {
  const config = JSON.parse(readFileSync(filePath, 'utf8'));
  spreadsheetId = config.spreadsheetId;
} else if (process.env.SPREADSHEET_ID) {
  spreadsheetId = process.env.SPREADSHEET_ID;
} else {
  throw new Error('No spreadsheet ID found. Provide server/config.json or set SPREADSHEET_ID env variable.');
}

export { spreadsheetId };
