import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let credentials;
const filePath = join(process.cwd(), 'Credentials.json');

if (existsSync(filePath)) {
  credentials = JSON.parse(readFileSync(filePath, 'utf8'));
} else if (process.env.GOOGLE_CREDENTIALS) {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} else {
  throw new Error('No Google credentials found. Provide Credentials.json or set GOOGLE_CREDENTIALS env variable.');
}

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
