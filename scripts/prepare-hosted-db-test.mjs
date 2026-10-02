import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// The dashboard shows one result grid. Turn every pgTAP failure into a SQL
// exception so a hidden failing assertion cannot look like a successful run.
const source = await readFile(new URL('../supabase/tests/phase0_rls.test.sql', import.meta.url), 'utf8');
let count = 0;
const sql = source.replace(/^select ((?:is|ok|throws_ok)\([\s\S]*?);/gm, (_, expression) => {
  count++;
  return `do $phase0assert$ declare result text; begin select ${expression} into result; if result like 'not ok%' then raise exception '%', result; end if; end $phase0assert$;`;
});
assert.equal(count, 17, 'Review the wrapper when the test plan changes');
assert.match(source, /select plan\(17\);/);
assert.match(sql.trimEnd(), /rollback;$/i);
const directory = new URL('../.cache/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('phase0-hosted-rls.sql', directory), sql);
console.log('Prepared .cache/phase0-hosted-rls.sql: 17 assertions, rollback-only fixtures.');
