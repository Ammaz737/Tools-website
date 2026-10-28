// Prepare application-owned local secrets. No provider accounts, network calls or secret output.
import { readFile, writeFile, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";
const target = resolve('.env.local');
let text;
try { text = await readFile(target, 'utf8'); }
catch (error) { if (error.code !== 'ENOENT') throw error; text = await readFile(resolve('.env.example'), 'utf8'); }
const values = parseEnv(text);
function fill(name, value) {
  if (values[name]?.trim()) return;
  const line = new RegExp('^' + name + '[ \\t]*=.*$', 'm');
  if (line.test(text)) text = text.replace(line, name + '=' + value);
  else text += '\n' + name + '=' + value + '\n';
  values[name] = value;
}
for (const name of ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'COPYLEAKS_WEBHOOK_SECRET', 'OFFICE_CONVERTER_PASSWORD']) fill(name, randomBytes(32).toString('base64url'));
fill('OFFICE_CONVERTER_USERNAME', 'local-qa');
fill('OFFICE_CONVERTER_AUTH_HEADER', 'Basic ' + Buffer.from(values.OFFICE_CONVERTER_USERNAME + ':' + values.OFFICE_CONVERTER_PASSWORD).toString('base64'));
fill('OFFICE_CONVERTER_URL', 'http://127.0.0.1:3101');
const temporary = target + '.' + randomBytes(8).toString('hex') + '.tmp';
try { await writeFile(temporary, text, { flag: 'wx', mode: 0o600 }); await rename(temporary, target); }
finally { await rm(temporary, { force: true }); }
console.log('Private local settings prepared. Existing nonblank values preserved; secrets were not printed.');
