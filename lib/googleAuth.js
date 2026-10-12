import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let _auth, _sheets, _drive;

function getCredentials() {
  const filePath = join(process.cwd(), 'Credentials.json');

  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } else if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  throw new Error('No Google credentials found. Provide Credentials.json or set GOOGLE_CREDENTIALS env variable.');
}

function getAuth() {
  if (!_auth) {
    _auth = new google.auth.GoogleAuth({
      credentials: getCredentials(),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
  }
  return _auth;
}

export const sheets = new Proxy({}, {
  get(_, prop) {
    if (!_sheets) _sheets = google.sheets({ version: 'v4', auth: getAuth() });
    return _sheets[prop];
  }
});

export const drive = new Proxy({}, {
  get(_, prop) {
    if (!_drive) _drive = google.drive({ version: 'v3', auth: getAuth() });
    return _drive[prop];
  }
});

export { getAuth as auth };
