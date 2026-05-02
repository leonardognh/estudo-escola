import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const ptPath = path.join(root, 'public', 'i18n', 'pt-BR.json');
const enPath = path.join(root, 'public', 'i18n', 'en.json');

const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const extraPt = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n-extra-pt.json'), 'utf8'));
const extraEn = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n-extra-en.json'), 'utf8'));

fs.writeFileSync(ptPath, JSON.stringify({ ...pt, ...extraPt }, null, 2));
fs.writeFileSync(enPath, JSON.stringify({ ...en, ...extraEn }, null, 2));
console.log('merged', Object.keys(extraPt).length, 'keys');
