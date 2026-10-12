import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';

const credentials = JSON.parse(readFileSync(join(process.cwd(), 'Credentials.json'), 'utf8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

export const drive = google.drive({ version: 'v3', auth });
export const sheets = google.sheets({ version: 'v4', auth });
export { auth };
