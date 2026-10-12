import { readFileSync } from 'fs';
import { join } from 'path';

const config = JSON.parse(readFileSync(join(process.cwd(), 'server', 'config.json'), 'utf8'));

export const { spreadsheetId } = config;
