import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// The dashboard shows one result grid. Turn every pgTAP failure into a SQL
// exception so a hidden failing assertion cannot look like a successful run.
const phase = process.argv[2] ?? 'phase0';
const plans = {phase0: ['phase0_rls.test.sql',17], phase1: ['phase1_accounts.test.sql',42], phase1_realtime: ['phase1_realtime.test.sql',6],phase2:['phase2_world.test.sql',28],phase2_realtime:['phase2_realtime.test.sql',6]};
assert.ok(Object.hasOwn(plans,phase), 'Use a supported phase/security test plan');
const [filename, planned] = plans[phase];
const source = await readFile(new URL(`../supabase/tests/${filename}`, import.meta.url), 'utf8');
let count = 0;
const sql = source.replace(/^select ((?:is|ok|throws_ok|lives_ok)\([\s\S]*?);/gm, (_, expression) => {
  count++;
  return `do $phase0assert$ declare result text; begin select ${expression} into result; if result like 'not ok%' then raise exception '%', result; end if; end $phase0assert$;`;
});
assert.equal(count, planned, 'Review the wrapper when the test plan changes');
assert.ok(source.includes(`select plan(${planned});`));
assert.match(sql.trimEnd(), /rollback;$/i);
const directory = new URL('../.cache/', import.meta.url);
await mkdir(directory, { recursive: true });
const withReport = sql.replace(/rollback;\s*$/i, `reset role; select jsonb_build_object('checks_passed',${planned},'verification','passed') as ${phase}_checks; rollback;`);
await writeFile(new URL(`${phase}-hosted-rls.sql`, directory), withReport);
console.log(`Prepared .cache/${phase}-hosted-rls.sql: ${planned} assertions, rollback-only fixtures.`);
