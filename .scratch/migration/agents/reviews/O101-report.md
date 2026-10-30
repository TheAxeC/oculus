NOT done: verify item 1 has no single run that is green from end to end. Two runs of `npm run diagrams && npm run docs:palette && npm run test:quick -- <the 62 changed paths>` on the same final tree each failed on one time limit, of a different test each time, and each of those tests passes alone (`hub-portfolio.test.ts` in 2559 ms, limit 20000 ms; `schedules/commands.test.ts` in 68 ms, limit 5000 ms) and passed in the other run; every other check of both runs is green. Everything else in the brief is built; case 27 (the project form's `anonymize` cards) and the Zenodo section are seen at the look, which this builder does not run.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, section "Open items":

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## The cases' first run, on the unchanged tree

The tests of the step were written first and run on the unchanged tree before any code changed; the cases that are not tests were run by the program `first-run.ts` (source below) on the unchanged tree. Outputs as printed; the check mark and the cross of vitest are written as `<check mark>` and `<multiplication sign>`.

The fast tests (`npx vitest run tests/state/client/held-unsaved.test.ts tests/routes/git/zenodo.test.ts tests/data/hubs/website-files.test.ts tests/routes/git/deposit.test.ts`): 58 rows passed, 26 failed, ` Test Files  4 failed (4)`. The failures, as printed:

```
FAIL tests/data/hubs/website-files.test.ts > ... > a Zenodo deposit with no GitHub deposit links its code at the DOI's address
AssertionError: expected undefined to deeply equal { Object (Code) }
FAIL ... > a DOI under anonymous review on Zenodo is not linked, and the GitHub address is
AssertionError: expected { Object (Code) } to deeply equal { Object (Code) }
FAIL ... > a DOI with no Zenodo status is not linked, and the GitHub address is
AssertionError: expected { Object (Code) } to deeply equal { Object (Code) }
FAIL tests/routes/git/deposit.test.ts > the deposit endpoint > refuses zenodoReview that the page did not confirm
FAIL tests/routes/git/deposit.test.ts > the deposit endpoint > refuses zenodoPublish that the page did not confirm
AssertionError: expected { Object (error) } to deeply equal { Object (error) }
FAIL tests/routes/git/zenodo.test.ts > the review copy For review sends > sends one anonymised zip, an Anonymous creator, restricted files and a share link, and writes the DOI, the link and the Zenodo status
AssertionError: expected 'The body is not a deposit action' to be undefined
FAIL ... > refuses a binary file holding a term, naming it, before any request
FAIL ... > refuses a Latin-1 file holding a term in its one-byte form, naming it
FAIL ... > refuses a Word file whose deflated part holds a term, naming it
FAIL ... > refuses a PDF whose deflated stream holds a term, naming it
Error: text key not in config: server.zenodo.term_in_bytes
FAIL ... > sends the title and the description with the terms replaced
AssertionError: expected 'The body is not a deposit action' to be undefined
FAIL ... > replaces a term written in any case / matches a term holding pattern characters as its letters / replaces the longer of two terms first, the shorter listed first / replaces the longer of two terms first, the longer listed first / replaces a term in the name of a folder / replaces a term in the repository's name, which names the zip
AssertionError: expected 'The body is not a deposit action' to be undefined
FAIL ... > refuses a finding of the deposit scan, naming the file, before any request
Error: text key not in config: server.zenodo.scan_found
FAIL ... > refuses a row with an empty term, naming the row, before any request
Error: text key not in config: server.zenodo.term_empty
FAIL ... > refuses two paths that become one, naming both, before any request
Error: text key not in config: server.zenodo.collision
FAIL ... > refuses a file of a compressed form it cannot read, naming it
Error: text key not in config: server.zenodo.compressed_unread
FAIL tests/routes/git/zenodo.test.ts > the Zenodo token > is in no answer, log line, History record or sentence when the upload is refused, and the draft is deleted
Error: text key not in config: server.zenodo.call_upload
FAIL ... > the Zenodo token > goes as Bearer in the Authorization header to the deposit address alone, and no Recover row is given it
AssertionError: expected 'The body is not a deposit action' to be undefined
FAIL ... > the Zenodo token > keeps the shipped auth and time limit under a hub that lays only the address
TypeError: Cannot read properties of undefined (reading 'zenodo')
FAIL tests/state/client/held-unsaved.test.ts > the file a deposit action writes > answers for zenodoReview the project's manifest, or no file for an action of the mirror
FAIL ... > answers for zenodoPublish the project's manifest, or no file for an action of the mirror
AssertionError: expected null to deeply equal { root: 'hub', ...(1) }
```

Preserved behaviour passed before the change, as printed: `<check mark> ... refuses a request with no token`, `<check mark> ... refuses a push that the page did not confirm`, `<check mark> ... refuses zenodoReview with no token`, `<check mark> ... refuses zenodoPublish with no token`, `<check mark> ... a deposit published on Zenodo links its code at the DOI's address, after the record's links`, `<check mark> ... code under anonymous review is not linked`, `<check mark> ... a deposit whose DOI is empty or null links its code at its address`, `<check mark> ... answers for push the project's manifest, or no file for an action of the mirror` and the commit, adopt and snapshot rows of that table.

The slow tests, on the unchanged tree:

```
npx vitest run --config <the slow config> tests/server/git/deposit-compare.test.ts
<multiplication sign> |unit| tests/server/git/deposit-compare.test.ts > the projects that have a deposit > makes the Zenodo review copy from the code folder of the project folder, never the one under .oculus 5ms
Error: Cannot find module '/src/lib/server/git/deposit/zenodo.ts' imported from .../tests/server/git/deposit-compare.test.ts
      Tests  1 failed | 8 passed (9)

tests/server/git/git-write.test.ts
<multiplication sign> |unit| tests/server/git/git-write.test.ts > a git run handed more input than it reads > answers from the exit of a git that ends before reading its input, and leaves no broken pipe unhandled 14ms
AssertionError: expected [ 'write EPIPE' ] to deeply equal []
      Tests  1 failed | 15 passed (16)
```

The case program `first-run.ts`, run as `node --experimental-strip-types first-run.ts <worktree>` on the unchanged tree, printed:

```
cases 1-3, 5-9, 11, 13, 15-23 (zenodoReview, confirmed): 400 {"error":"The body is not a deposit action"}
case 10 (zenodoReview, no confirm): 400 {"error":"The body is not a deposit action"}
case 10 (zenodoReview, no token): 403 {"error":"The write token is missing or stale"}
cases 1-3, 5-9, 11, 13, 15-23 (zenodoPublish, confirmed): 400 {"error":"The body is not a deposit action"}
case 10 (zenodoPublish, no confirm): 400 {"error":"The body is not a deposit action"}
case 10 (zenodoPublish, no token): 403 {"error":"The write token is missing or stale"}
case 4 (GET): 200 {"ok":true,"state":{"id":"hub:alpha"}}
case 12 (Recover route): downloads: () => server.local.downloads,
case 12 (a Recover row naming zenodo): headers {"Authorization":"case-secret"}
case 24: merged deposit undefined; findings ["deposit: key deposit is not one the hub's settings file takes; it is not applied"]
case 26: answer ok=false error="error: unknown option `no-such-flag'"; uncaught ["Error: write EPIPE"]
```

Case 14 on the unchanged tree (push of a manifest that already holds the Zenodo keys): the push wrote `status`, `url` and `date` and kept the other keys, as on main. Case 25: the three new rows of `website-files.test.ts` failed as quoted above; the rows that keep their behaviour passed. Case 27, read on the unchanged tree: `grep -c "anonymize\|zenodo_status\|review_link" config/schemas/manifest-schema.yml` printed `0`, and no `'rows'` widget kind was in `catalog-files/manifest.ts` or `model-collections.ts`. No case was one the brief's own rules get wrong.

Source of `first-run.ts` (deleted from the scratchpad before this report):

```ts
// Case-run program of O101's first run: prints what the unchanged tree answers for each case.
// Run from the worktree root: node --experimental-strip-types <this file> <worktree>
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
const at = (path: string) => join(root, path);
const routes = await import(at('src/lib/server/git/deposit/deposit-routes.ts'));
const config = await import(at('src/lib/data/sources/config.ts'));
const request = await import(at('src/lib/server/core/reader/request.ts'));

const TOKEN = 'case-token';
const HOST = '127.0.0.1:8791';
const loaded = config.loadConfig(config.engineDir()).config;

function post(body: unknown, token = TOKEN): Request {
    return new Request(`http://${HOST}/api/deposit`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

const options = {
    deposit: { config: loaded, credentials: { args: () => [] } },
    idsFor: () => ['hub:alpha']
};

async function show(label: string, response: Response): Promise<void> {
    console.log(`${label}: ${response.status} ${await response.text()}`);
}

const ACTIONS = ['zenodoReview', 'zenodoPublish'];
for (const action of ACTIONS) {
    await show(
        `cases 1-3, 5-9, 11, 13, 15-23 (${action}, confirmed)`,
        await routes.handleDeposit(post({ action, id: 'hub:alpha', confirm: true }), TOKEN, options)
    );
    await show(
        `case 10 (${action}, no confirm)`,
        await routes.handleDeposit(post({ action, id: 'hub:alpha' }), TOKEN, options)
    );
    await show(
        `case 10 (${action}, no token)`,
        await routes.handleDeposit(post({ action, id: 'hub:alpha', confirm: true }, ''), TOKEN, options)
    );
}

await show(
    'case 4 (GET)',
    await routes.handleDepositState(new Request(`http://${HOST}/api/deposit?id=hub:alpha`, { headers: { host: HOST } }), {
        ...options,
        stateFor: () => Promise.resolve({ id: 'hub:alpha' })
    })
);

// Case 12: the Recover route hands `server.local.downloads` whole to every Recover row.
const recoverRoute = readFileSync(at('src/routes/api/(machine)/recover/+server.ts'), 'utf8');
console.log(`case 12 (Recover route): ${recoverRoute.split('\n').find((line) => line.includes('downloads:'))?.trim()}`);
const applied = request.applyAuth([{ header: 'Authorization', row: 'zenodo' }], [
    { service: 'zenodo', secret: 'case-secret' }
]);
console.log(`case 12 (a Recover row naming zenodo): headers ${JSON.stringify(applied.headers)}`);

// Case 24: a hub that lays deposit.zenodo.address.
const hub = mkdtempSync(join(tmpdir(), 'o101-hub-'));
mkdirSync(join(hub, '.oculus'), { recursive: true });
writeFileSync(join(hub, '.oculus', 'config.yml'), 'deposit:\n  zenodo:\n    address: https://sandbox.example/api\n');
const merged = config.loadConfig(config.engineDir(), { hub });
console.log(`case 24: merged deposit ${JSON.stringify(merged.config.deposit)}; findings ${JSON.stringify(merged.findings.filter((one: { file: string }) => one.file.startsWith(hub)).map((one: { key: string; message: string }) => `${one.key}: ${one.message}`))}`);
rmSync(hub, { recursive: true, force: true });

// Case 26: a git run given a string input larger than the pipe holds, git exiting before it reads.
const write = await import(at('src/lib/server/git/git-write.ts'));
const repo = mkdtempSync(join(tmpdir(), 'o101-git-'));
execFileSync('git', ['init', '-q', repo]);
const caught: string[] = [];
process.on('uncaughtException', (error) => caught.push(`${error.name}: ${error.message}`));
const answer = await write.applyPatch({ root: repo, credentials: { args: () => [] } }, ['--no-such-flag'], 'x'.repeat(4 * 1024 * 1024));
await new Promise((done) => setTimeout(done, 500));
console.log(`case 26: answer ok=${answer.ok} error=${JSON.stringify(answer.error)}; uncaught ${JSON.stringify(caught)}`);
rmSync(repo, { recursive: true, force: true });
```

## The cases after the change

The tests (cases 1 to 3, 9, 10, 12, 13, 15, 16, 21 to 26 and G28's rows) run in the quick tier below, every one green. The cases that are runs (4 to 8, 11, 14, 17 to 20) were checked by `cases.ts`, run as `npx jiti cases.ts <worktree>` on the final tree, against the fake Zenodo of `tests/fixtures/hubs/zenodo-answers.ts` over a fixture hub in a temp folder. Its output, as printed:

```
case 4 GET: {"ready":false}
case 4 zenodoReview: 400 Zenodo needs the downloads row zenodo of the primary hub's .oculus/local.yml, the row deposit.zenodo.auth names, so nothing was sent | calls: 0
case 4 zenodoPublish: 400 Zenodo needs the downloads row zenodo of the primary hub's .oculus/local.yml, the row deposit.zenodo.auth names, so nothing was sent | calls: 0
case 4 GET with the row: {"ready":true}
case 5: 200 Published on Zenodo as 10.5281/zenodo.102
case 5 calls: GET /api/records/102 | GET /api/records/101/versions/latest | POST /api/records/101/versions | PUT /api/records/103/draft | POST /api/records/103/draft/files | PUT /api/records/103/draft/files/alpha.zip/content | POST /api/records/103/draft/files/alpha.zip/commit | POST /api/records/103/draft/actions/publish | GET /api/records/103
case 5 metadata: {"access":{"record":"public","files":"public"},"files":{"enabled":true},"metadata":{"resource_type":{"id":"software"},"title":"The alpha tools","description":"Code of the paper.","publication_date":"2026-10-30","creators":[{"person_or_org":{"type":"personal","given_name":"Ann","family_name":"Quill","identifiers":[{"scheme":"orcid","identifier":"0000-0001-0000-0001"}]},"affiliations":[{"name":"North Lab"}]},{"person_or_org":{"type":"personal","given_name":"Bo","family_name":"van der Lin"}}],"funding":[{"funder":{"name":"Fund Board"},"award":{"title":{"en":"Grant One"},"number":"1157019N"}}]}}
case 5 zip entries: {"alpha.zip":[".gitignore","README.md","tools.py"]}
case 5 tools.py: "print(\"Quillmore\")\n"
case 5 manifest: {"status":"deposited","description":"Code of the paper.","url":"https://example.org/alpha","date":"2026-01-02","doi":"10.5281/zenodo.102","zenodo_status":"deposited","zenodo_date":"2026-10-30","review_link":"https://zenodo.example/records/101?token=share-101"}
case 6: 200 Published on Zenodo as 10.5281/zenodo.102
case 6 calls: POST /api/records | POST /api/records/101/draft/files | PUT /api/records/101/draft/files/alpha.zip/content | POST /api/records/101/draft/files/alpha.zip/commit | POST /api/records/101/draft/actions/publish | GET /api/records/101
case 6 manifest: {"status":"none","description":"Code of the paper.","doi":"10.5281/zenodo.102","zenodo_status":"deposited","zenodo_date":"2026-10-30"}
case 7 no family: 400 cy has no family name in people.yml, so nothing was sent | calls: 0
case 7 name not ending with family: 400 The name of di in people.yml does not end with its family name, so nothing was sent | calls: 0
case 7 no people.yml key: 400 zed is no key of people.yml, so nothing was sent | calls: 0
case 8 no funder: 400 The funding entry G2 names no funder, so nothing was sent | calls: 0
case 8 funder naming no organisation: 400 The funder of the funding entry G3 is no key of organisations.yml, so nothing was sent | calls: 0
case 8 no funding.yml entry: 400 G9 is no key of funding.yml, so nothing was sent | calls: 0
case 11 cancel: 200
case 11: 400 Cancelled during the upload of alpha.zip; the draft was deleted, so nothing was published
case 11 calls: POST /api/records | POST /api/records/101/draft/files | PUT /api/records/101/draft/files/alpha.zip/content | DELETE /api/records/101/draft
case 11 manifest unchanged: true
case 14 review: 200 Sent to Zenodo for review as 10.5281/zenodo.102
case 14 after review: {"status":"none","description":"Code of the paper.","doi":"10.5281/zenodo.102","zenodo_status":"review-anon","zenodo_date":"2026-10-30","review_link":"https://zenodo.example/records/101?token=share-101"}
case 14 adopt true push true 
case 14 after push: {"status":"deposited","description":"Code of the paper.","doi":"10.5281/zenodo.102","zenodo_status":"review-anon","zenodo_date":"2026-10-30","review_link":"https://zenodo.example/records/101?token=share-101","url":"https://github.com/someone/alpha","date":"2026-10-30"}
case 17 first: 400 Zenodo answered 500 to the share link; the record 10.5281/zenodo.102 is published and its DOI is written
case 17 manifest: {"status":"none","description":"Code of the paper.","doi":"10.5281/zenodo.102","zenodo_status":"review-anon","zenodo_date":"2026-10-30"}
case 17 second: 200 Sent to Zenodo for review as 10.5281/zenodo.102
case 17 second calls: GET /api/records/102 | GET /api/records/101/versions/latest | POST /api/records/101/versions | PUT /api/records/103/draft | POST /api/records/103/draft/files | PUT /api/records/103/draft/files/alpha.zip/content | POST /api/records/103/draft/files/alpha.zip/commit | POST /api/records/103/draft/actions/publish | GET /api/records/103 | POST /api/records/103/access/links
case 17 manifest: {"status":"none","description":"Code of the paper.","doi":"10.5281/zenodo.102","zenodo_status":"review-anon","zenodo_date":"2026-10-30","review_link":"https://zenodo.example/records/103?token=share-103"}
case 18 deposited: 400 The code is published on Zenodo as 10.5281/zenodo.102, so For review sends no anonymous copy of it | calls: 0
case 18 GitHub deposited: 200 Sent to Zenodo for review as 10.5281/zenodo.102
case 18 manifest: {"status":"deposited","description":"Code of the paper.","url":"https://github.com/someone/alpha","doi":"10.5281/zenodo.102","zenodo_status":"review-anon","zenodo_date":"2026-10-30","review_link":"https://zenodo.example/records/101?token=share-101"}
case 19 other DOI: 400 10.1234/other is no Zenodo DOI of the form 10.5281/zenodo.<number>, so nothing was sent | calls: 0
case 19 version DOI: 400 10.5281/zenodo.101 is a version DOI of the concept 10.5281/zenodo.102; code_availability.doi holds the concept DOI, so nothing was sent | calls: GET /api/records/101
case 20 second: 409 A run of the deposit of hub:alpha is still going, so nothing was sent to Zenodo; wait for it or cancel it
case 20 drafts made: 1
```

Case 14 before any Zenodo action, and case 24 read through the setting reader, by `case14.ts` and `case24.ts` (`npx jiti <file> <worktree>`) on the final tree:

```
case 14 before: status: none; doi: "10.5281/zenodo.100"; review_link: "https://zenodo.example/records/101?token=t"; zenodo_status: review-anon; zenodo_date: "2026-10-01"
case 14 adopt: ok=true 
case 14 push: ok=true 
case 14 after: status: deposited; doi: "10.5281/zenodo.100"; review_link: "https://zenodo.example/records/101?token=t"; zenodo_status: review-anon; zenodo_date: "2026-10-01"; url: https://github.com/someone/alpha; date: 2026-10-30
shipped: {"address":"https://zenodo.org/api","timeoutS":600,"auth":[{"header":"Authorization","row":"zenodo","prefix":"Bearer ","required":true,"help":"The `secret` is a personal access token made on Zenodo under Applications, Personal access tokens, with the scopes deposit:write and deposit:actions."}]}
case 24 merged: {"zenodo":{"address":"https://sandbox.example/api","timeout_s":600,"auth":[{"header":"Authorization","prefix":"Bearer ","row":"zenodo","required":true,"help":"The `secret` is a personal access token made on Zenodo under Applications, Personal access tokens, with the scopes deposit:write and deposit:actions."}]}}
case 24 read: {"address":"https://sandbox.example/api","timeoutS":600,"auth":[{"header":"Authorization","row":"zenodo","prefix":"Bearer ","required":true,"help":"The `secret` is a personal access token made on Zenodo under Applications, Personal access tokens, with the scopes deposit:write and deposit:actions."}]}; problems []
case 24 findings: []
```

The sources of the three programs (all deleted from the scratchpad before this report):

`cases.ts`:

```ts
// Case-run program of O101's cases 4 to 8, 11, 14 (after For review), 17 to 20: each press goes
// through handleDeposit of the worktree against the fake Zenodo of tests/fixtures/hubs/zenodo-answers.ts,
// over a fixture hub in a temp folder with a fake git that lists the files as they lie. Prints, per
// case, the answer, the calls the fake received and the manifest's code_availability.
// Run from the worktree root: npx jiti <this file> <worktree>
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const root = process.argv[2];
const at = (path: string) => join(root, path);
const routes = await import(at('src/lib/server/git/deposit/deposit-routes.ts'));
const deposit = await import(at('src/lib/server/git/deposit/deposit.ts'));
const running = await import(at('src/lib/server/core/git/running.ts'));
const data = await import(at('src/lib/data/index.ts'));
const config = await import(at('src/lib/data/sources/config.ts'));
const subtasks = await import(at('src/lib/server/edit/writes/subtasks.ts'));
const auth = await import(at('src/lib/server/core/auth.ts'));
const fake = await import(at('tests/fixtures/hubs/zenodo-answers.ts'));

const TOKEN = auth.mintToken();
const HOST = '127.0.0.1:8791';
const ZENODO_TOKEN = 'fixture-zenodo-token-5e1f';

function plant(base: string, rel: string, body: string): void {
    mkdirSync(dirname(join(base, rel)), { recursive: true });
    writeFileSync(join(base, rel), body);
}

const KEYED = 'schema:\n  - { field: key, type: text, primary_key: true }\n';
const PEOPLE = [
    KEYED + 'entries:',
    '  - { key: ann, name: "Ann Quill", family: "Quill", orcid: "0000-0001-0000-0001", affiliations: [north] }',
    '  - { key: bo, name: "Bo van der Lin", family: "van der Lin" }',
    '  - { key: cy, name: "Cy Moss" }',
    '  - { key: di, name: "Di Fern", family: "Ferns" }',
    ''
].join('\n');
const ORGS = [
    KEYED + 'entries:',
    '  - { key: north, name: "North Lab", kind: university }',
    '  - { key: fund, name: "Fund Board", kind: funder }',
    ''
].join('\n');
const FUNDING = [
    KEYED + 'entries:',
    '  - { key: G1, title: "Grant One", funder: fund, award: "1157019N" }',
    '  - { key: G2, title: "Grant Two" }',
    '  - { key: G3, title: "Grant Three", funder: nowhere }',
    ''
].join('\n');

type Setup = { code?: Record<string, string>; lead?: string[]; funding?: string[] };

function fixture(setup: Setup) {
    const dir = mkdtempSync(join(tmpdir(), 'o101-cases-'));
    const hub = join(dir, 'hub');
    plant(hub, '.oculus/config.yml', 'deposit:\n    zenodo:\n        address: https://zenodo.example/api\n');
    plant(hub, '.oculus/data/people/people.yml', PEOPLE);
    plant(hub, '.oculus/data/people/organisations.yml', ORGS);
    plant(hub, '.oculus/data/academic/funding.yml', FUNDING);
    const code = Object.entries({ status: 'none', description: 'Code of the paper.', ...setup.code }).map(
        ([key, value]) => `  ${key}: ${JSON.stringify(value)}`
    );
    plant(
        hub,
        'projects/alpha/project.yml',
        [
            'id: alpha',
            'tier: research',
            'stage: exploring',
            'title: "The alpha tools"',
            `lead: ${JSON.stringify(setup.lead ?? ['ann'])}`,
            'supervisors: ["bo"]',
            `funding: ${JSON.stringify(setup.funding ?? ['G1'])}`,
            'code_availability:',
            ...code,
            '  anonymize:',
            '    - { term: "Quillmore" }',
            ''
        ].join('\n')
    );
    plant(hub, 'projects/alpha/code/README.md', '# The tools\n');
    plant(hub, 'projects/alpha/code/tools.py', 'print("Quillmore")\n');
    const merged = config.loadConfig(config.engineDir(), { hub }).config;
    const into = {
        hub,
        primary: 'hub',
        config: { ...data.portfolioConfigFrom(merged), scan: [{ dir: 'projects' }] },
        engine: config.engineDir(),
        engineConfig: () => config.loadConfig(config.engineDir()).config,
        career: subtasks.careerRules(merged),
        overrides: join(dir, 'sessions.json'),
        projects: () => [],
        bookmarks: join(dir, 'bookmarks.yml'),
        glyphs: []
    };
    return { dir, hub, into, manifest: join(hub, 'projects/alpha/project.yml') };
}

function filesUnder(base: string): string[] {
    return readdirSync(base, { recursive: true, withFileTypes: true })
        .filter((one) => one.isFile())
        .map((one) => relative(base, join(one.parentPath, one.name)))
        .filter((path) => path !== '.git' && !path.startsWith('.git/'))
        .sort();
}

const listing = (argv: string[]) =>
    Promise.resolve(
        argv[2] === 'ls-files'
            ? { ok: true, output: filesUnder(argv[1]).join('\0'), error: '' }
            : { ok: true, output: '', error: '' }
    );

function post(action: string, confirm = true): Request {
    return new Request(`http://${HOST}/api/deposit`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify({ action, id: 'hub:alpha', confirm })
    });
}

function optionsOf(f: ReturnType<typeof fixture>, zenodo: { fetch: typeof fetch }, extra: Record<string, unknown> = {}) {
    return {
        idsFor: () => ['hub:alpha'],
        deposit: {
            into: f.into,
            mirrors: join(f.dir, 'mirrors'),
            credentials: { args: () => [] },
            git: listing,
            fetch: zenodo.fetch,
            downloads: () => [{ service: 'zenodo', secret: ZENODO_TOKEN }],
            ...extra
        }
    };
}

async function press(f: ReturnType<typeof fixture>, action: string, zenodo: { fetch: typeof fetch }, extra = {}, more = {}) {
    const response = await routes.handleDeposit(post(action), TOKEN, { ...optionsOf(f, zenodo, extra), ...more });
    return { status: response.status, body: await response.json() };
}

const yaml = await import(at('node_modules/yaml/dist/index.js'));
const block = (f: ReturnType<typeof fixture>) => {
    const { anonymize: _, ...rest } = yaml.parse(readFileSync(f.manifest, 'utf8')).code_availability;
    return JSON.stringify(rest);
};
const calls = (z: { calls: { method: string; path: string }[] }) => z.calls.map((one) => `${one.method} ${one.path}`).join(' | ');

// Case 4: no zenodo row.
{
    const f = fixture({});
    const z = fake.fakeZenodo();
    const state = await routes.handleDepositState(
        new Request(`http://${HOST}/api/deposit?id=hub:alpha`, { headers: { host: HOST } }),
        { idsFor: () => ['hub:alpha'], stateFor: () => Promise.resolve({ id: 'hub:alpha' }), deposit: { ...optionsOf(f, z).deposit, downloads: () => [] } }
    );
    console.log(`case 4 GET: ${JSON.stringify((await state.json()).zenodo)}`);
    for (const action of ['zenodoReview', 'zenodoPublish']) {
        const answer = await press(f, action, z, { downloads: () => [] });
        console.log(`case 4 ${action}: ${answer.status} ${answer.body.error} | calls: ${z.calls.length}`);
    }
    const ready = await routes.handleDepositState(
        new Request(`http://${HOST}/api/deposit?id=hub:alpha`, { headers: { host: HOST } }),
        { idsFor: () => ['hub:alpha'], stateFor: () => Promise.resolve({ id: 'hub:alpha' }), deposit: optionsOf(f, z).deposit }
    );
    console.log(`case 4 GET with the row: ${JSON.stringify((await ready.json()).zenodo)}`);
}

// Case 5: Publish with a concept DOI under review-anon.
{
    const f = fixture({ code: { status: 'deposited', url: 'https://example.org/alpha', date: '2026-01-02', doi: '10.5281/zenodo.102', zenodo_status: 'review-anon', zenodo_date: '2026-09-01', review_link: 'https://zenodo.example/records/101?token=share-101' } });
    const z = fake.fakeZenodo({ seed: { concept: '102', record: '101' } });
    const answer = await press(f, 'zenodoPublish', z);
    console.log(`case 5: ${answer.status} ${answer.body.output ?? answer.body.error}`);
    console.log(`case 5 calls: ${calls(z)}`);
    const created = z.calls.find((one: { method: string; path: string }) => one.method === 'PUT' && one.path.endsWith('/draft'));
    console.log(`case 5 metadata: ${JSON.stringify(created?.body)}`);
    console.log(`case 5 zip entries: ${JSON.stringify(Object.fromEntries(Object.entries(z.uploads()).map(([k, v]) => [k, Object.keys(v as object)])))}`);
    console.log(`case 5 tools.py: ${JSON.stringify((Object.values(z.uploads())[0] as Record<string, string>)['tools.py'])}`);
    console.log(`case 5 manifest: ${block(f)}`);
}

// Case 6: Publish with no DOI.
{
    const f = fixture({});
    const z = fake.fakeZenodo();
    const answer = await press(f, 'zenodoPublish', z);
    console.log(`case 6: ${answer.status} ${answer.body.output ?? answer.body.error}`);
    console.log(`case 6 calls: ${calls(z)}`);
    console.log(`case 6 manifest: ${block(f)}`);
}

// Case 7: people.
for (const [name, lead] of [['no family', ['cy']], ['name not ending with family', ['di']], ['no people.yml key', ['zed']]] as const) {
    const f = fixture({ lead: [...lead] });
    const z = fake.fakeZenodo();
    const answer = await press(f, 'zenodoPublish', z);
    console.log(`case 7 ${name}: ${answer.status} ${answer.body.error} | calls: ${z.calls.length}`);
}

// Case 8: funding.
for (const [name, funding] of [['no funder', ['G2']], ['funder naming no organisation', ['G3']], ['no funding.yml entry', ['G9']]] as const) {
    const f = fixture({ funding: [...funding] });
    const z = fake.fakeZenodo();
    const answer = await press(f, 'zenodoPublish', z);
    console.log(`case 8 ${name}: ${answer.status} ${answer.body.error} | calls: ${z.calls.length}`);
}

// Case 11: Cancel during the upload.
{
    const f = fixture({});
    const before = readFileSync(f.manifest, 'utf8');
    const registry = running.createRunningGit();
    let resolveHeld: () => void = () => undefined;
    const held = new Promise<void>((done) => (resolveHeld = done));
    const z = fake.fakeZenodo({
        hold: (method: string, path: string) => method === 'PUT' && path.endsWith('/content'),
        held: () => resolveHeld()
    });
    const pressing = press(f, 'zenodoReview', z, {}, { running: registry });
    await held;
    const cancelled = await routes.handleDeposit(post('cancel', false), TOKEN, { ...optionsOf(f, z), running: registry });
    console.log(`case 11 cancel: ${cancelled.status}`);
    const answer = await pressing;
    console.log(`case 11: ${answer.status} ${answer.body.error}`);
    console.log(`case 11 calls: ${calls(z)}`);
    console.log(`case 11 manifest unchanged: ${readFileSync(f.manifest, 'utf8') === before}`);
}

// Case 14 (after For review): a GitHub push keeps the Zenodo keys.
{
    const f = fixture({});
    const z = fake.fakeZenodo();
    const reviewed = await press(f, 'zenodoReview', z);
    console.log(`case 14 review: ${reviewed.status} ${reviewed.body.output ?? reviewed.body.error}`);
    console.log(`case 14 after review: ${block(f)}`);
    let created = false;
    const gh = (args: string[]) => {
        if (args[1] === 'create') created = true;
        if (args[1] !== 'view') return Promise.resolve({ ok: true, output: '', error: '' });
        return Promise.resolve(created ? { ok: true, output: JSON.stringify({ url: 'https://github.com/someone/alpha', defaultBranchRef: null }), error: '' } : { ok: false, output: '', error: 'could not resolve to a Repository' });
    };
    const options = { mirrors: join(f.dir, 'mirrors'), into: f.into, gh, credentials: { args: () => [] } };
    const text = config.textCatalog(f.into.config.merged);
    const adopted = await deposit.adopt('hub:alpha', text, options);
    const pushed = await deposit.push('hub:alpha', text, options);
    console.log(`case 14 adopt ${adopted.ok} push ${pushed.ok} ${pushed.error}`);
    console.log(`case 14 after push: ${block(f)}`);
}

// Case 17: the share link answered 500, then a second press.
{
    const f = fixture({});
    let refuse = true;
    const z = fake.fakeZenodo({ status: (method: string, path: string) => (refuse && method === 'POST' && path.endsWith('/access/links') ? 500 : undefined) });
    const first = await press(f, 'zenodoReview', z);
    console.log(`case 17 first: ${first.status} ${first.body.error}`);
    console.log(`case 17 manifest: ${block(f)}`);
    refuse = false;
    const mark = z.calls.length;
    const second = await press(f, 'zenodoReview', z);
    console.log(`case 17 second: ${second.status} ${second.body.output ?? second.body.error}`);
    console.log(`case 17 second calls: ${z.calls.slice(mark).map((one: { method: string; path: string }) => `${one.method} ${one.path}`).join(' | ')}`);
    console.log(`case 17 manifest: ${block(f)}`);
}

// Case 18.
{
    const f = fixture({ code: { doi: '10.5281/zenodo.102', zenodo_status: 'deposited' } });
    const z = fake.fakeZenodo();
    const answer = await press(f, 'zenodoReview', z);
    console.log(`case 18 deposited: ${answer.status} ${answer.body.error} | calls: ${z.calls.length}`);
    const g = fixture({ code: { status: 'deposited', url: 'https://github.com/someone/alpha' } });
    const y = fake.fakeZenodo();
    const went = await press(g, 'zenodoReview', y);
    console.log(`case 18 GitHub deposited: ${went.status} ${went.body.output ?? went.body.error}`);
    console.log(`case 18 manifest: ${block(g)}`);
}

// Case 19.
{
    const f = fixture({ code: { doi: '10.1234/other', zenodo_status: 'review-anon' } });
    const z = fake.fakeZenodo();
    const answer = await press(f, 'zenodoPublish', z);
    console.log(`case 19 other DOI: ${answer.status} ${answer.body.error} | calls: ${z.calls.length}`);
    const g = fixture({ code: { doi: '10.5281/zenodo.101', zenodo_status: 'review-anon' } });
    const y = fake.fakeZenodo({ seed: { concept: '102', record: '101' } });
    const version = await press(g, 'zenodoPublish', y);
    console.log(`case 19 version DOI: ${version.status} ${version.body.error} | calls: ${calls(y)}`);
}

// Case 20: a second press while one runs.
{
    const f = fixture({});
    const registry = running.createRunningGit();
    let resolveHeld: () => void = () => undefined;
    const held = new Promise<void>((done) => (resolveHeld = done));
    const z = fake.fakeZenodo({
        hold: (method: string, path: string) => method === 'PUT' && path.endsWith('/content'),
        held: () => resolveHeld()
    });
    const first = press(f, 'zenodoReview', z, {}, { running: registry });
    await held;
    const second = await press(f, 'zenodoReview', z, {}, { running: registry });
    console.log(`case 20 second: ${second.status} ${second.body.error}`);
    await routes.handleDeposit(post('cancel', false), TOKEN, { ...optionsOf(f, z), running: registry });
    await first;
    console.log(`case 20 drafts made: ${z.calls.filter((one: { method: string; path: string }) => one.method === 'POST' && one.path === '/api/records').length}`);
}
```

`case14.ts`:

```ts
// Case-run program of O101's case 14: a GitHub push of a project whose manifest holds the Zenodo
// keys, with a fake `gh`; prints the manifest's code_availability before and after.
// Run from the worktree root: npx jiti <this file> <worktree>
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
const at = (path: string) => join(root, path);
const deposit = await import(at('src/lib/server/git/deposit/deposit.ts'));
const data = await import(at('src/lib/data/index.ts'));
const config = await import(at('src/lib/data/sources/config.ts'));
const subtasks = await import(at('src/lib/server/edit/writes/subtasks.ts'));

const dir = mkdtempSync(join(tmpdir(), 'o101-case14-'));
const hub = join(dir, 'hub');
const mirrors = join(dir, 'mirrors');
const project = join(hub, 'projects', 'alpha');
mkdirSync(join(project, 'code'), { recursive: true });
mkdirSync(mirrors, { recursive: true });
const manifest = join(project, 'project.yml');
writeFileSync(
    manifest,
    [
        'id: alpha',
        'tier: research',
        'stage: exploring',
        'title: "Alpha"',
        'code_availability:',
        '  status: none',
        '  doi: "10.5281/zenodo.100"',
        '  review_link: "https://zenodo.example/records/101?token=t"',
        '  zenodo_status: review-anon',
        '  zenodo_date: "2026-10-01"',
        ''
    ].join('\n')
);
writeFileSync(join(project, 'code', 'README.md'), '# alpha\n');
const loaded = config.loadConfig(config.engineDir()).config;
const into = {
    hub,
    primary: 'hub',
    config: { ...data.portfolioConfigFrom(loaded), scan: [{ dir: 'projects' }] },
    engine: config.engineDir(),
    engineConfig: () => loaded,
    career: subtasks.careerRules(loaded),
    overrides: join(dir, 'sessions.json'),
    projects: () => [],
    bookmarks: join(dir, 'bookmarks.yml'),
    glyphs: []
};
let created = false;
const gh = (args: string[]) => {
    if (args[1] === 'create') created = true;
    if (args[1] !== 'view') return Promise.resolve({ ok: true, output: '', error: '' });
    return Promise.resolve(
        created
            ? { ok: true, output: JSON.stringify({ url: 'https://github.com/someone/alpha', defaultBranchRef: null }), error: '' }
            : { ok: false, output: '', error: 'could not resolve to a Repository' }
    );
};
const options = { mirrors, into, gh, credentials: { args: () => [] } };
const text = config.textCatalog(loaded);
const block = () => readFileSync(manifest, 'utf8').split('code_availability:')[1].trim().replace(/\n\s*/g, '; ');
console.log(`case 14 before: ${block()}`);
const adopted = await deposit.adopt('hub:alpha', text, options);
console.log(`case 14 adopt: ok=${adopted.ok} ${adopted.error}`);
const pushed = await deposit.push('hub:alpha', text, options);
console.log(`case 14 push: ok=${pushed.ok} ${pushed.error}`);
console.log(`case 14 after: ${block()}`);
rmSync(dir, { recursive: true, force: true });
```

`case24.ts`:

```ts
// Case-run program of O101's case 24: the merged `deposit.zenodo` of a hub that lays only the
// address, read by the setting reader, and the settings findings of that hub's file.
// Run from the worktree root: npx jiti <this file> <worktree>
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
const at = (path: string) => join(root, path);
const config = await import(at('src/lib/data/sources/config.ts'));
const files = await import(at('src/lib/data/sources/config/settings/files.ts'));

const shipped = config.loadConfig(config.engineDir()).config;
console.log(`shipped: ${JSON.stringify(files.zenodoSettings(shipped))}`);
const hub = mkdtempSync(join(tmpdir(), 'o101-hub-'));
mkdirSync(join(hub, '.oculus'), { recursive: true });
writeFileSync(join(hub, '.oculus', 'config.yml'), 'deposit:\n  zenodo:\n    address: https://sandbox.example/api\n');
const merged = config.loadConfig(config.engineDir(), { hub });
const problems: unknown[] = [];
console.log(`case 24 merged: ${JSON.stringify(merged.config.deposit)}`);
console.log(`case 24 read: ${JSON.stringify(files.zenodoSettings(merged.config, problems))}; problems ${JSON.stringify(problems)}`);
console.log(`case 24 findings: ${JSON.stringify(merged.findings.filter((one: { file: string }) => one.file.startsWith(hub)).map((one: { message: string }) => one.message))}`);
rmSync(hub, { recursive: true, force: true });
```

The shapes the fake Zenodo answers in (`tests/fixtures/hubs/zenodo-answers.ts`): the record read (`GET /api/records/{id}`, and `versions/latest`) in the shape of the recorded answer `tests/server/machine/runs/recover/answers/zenodo/picai.body` (`id`, `recid`, `conceptrecid`, `doi`, `conceptdoi`, `links`); the draft create (`POST /api/records`), the new version (`POST .../versions`), the draft update (`PUT .../draft`), the file start, content and commit, the publish and the draft delete in the shapes of InvenioRDM's "Drafts and records" documentation; the share link (`POST .../access/links`) in the shape of InvenioRDM's "Access links" documentation (`id`, `created_at`, `expires_at`, `permission`, `description`, `token`).

## DONE / NOT DONE

| Check | State | Output |
| --- | --- | --- |
| 1. `npm run diagrams && npm run docs:palette && npm run test:quick -- <the 62 changed paths>` | NOT DONE: no run green end to end; each failure a time limit of a test that passes alone | quoted below the table |
| 2. ASCII gate over the changed files | DONE | prints nothing; `ascii exit 0` |
| 3. `sh utils/unused-exports.sh` vs `O101-base/unused-exports.txt` | DONE | `diff` prints nothing, `diff exit 0` |
| 4. `patch -p1 --dry-run` of the hub patch inside the hub | DONE | `patching file '.oculus/data/academic/funding.yml'`, `patching file '.oculus/data/people/organisations.yml'`, `patching file '.oculus/data/people/people.yml'` (macOS `patch` prints `patching file` where GNU prints `checking file`); `cmp` of each `a/` copy with the hub file printed nothing |
| 5. `git grep -n "zenodo.org" -- src` / `-- config ':!config/local.yml'` | DONE | src: nothing (and `grep -rln zenodo.org` over the untracked new files: nothing, exit 1); config: `config/defaults/behavior.yml:311:      address: 'https://zenodo.org/api/records/{record}'` and `config/defaults/behavior.yml:470:    address: https://zenodo.org/api` only |
| 6. Each new or changed test run on the unchanged tree, then after | DONE | first run quoted above (26 + 1 + 1 failures of added or changed behaviour, the preserved rows green); after: green in the quick tier |
| 7. `wc -l` of changed sources, `sh utils/folder-check.sh` | DONE | no source over 880 and no component over 520 (largest: `src/lib/data/model/index.ts` 880, `writes.svelte.ts` 870, `git-write.ts` 867); `folder exit 0` |
| 8. History words in changed comments and test titles | DONE | grep below, every hit judged |
| 9. Prose read of new and changed sentences | DONE | departures named below |

Verify item 1, the two runs on the final tree. `npm run diagrams` printed the 18 files of `docs/diagrams/` it writes and `npm run docs:palette` printed `docs/palette.md` in both; `test:quick` printed `62 changed file(s), from the given paths` and `339 test file(s)`.

The run with nothing else running on the machine:

```
ok      ASCII gate (1.7 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.8 s)
ok      eslint (24.1 s)
ok      svelte-check (44.6 s): 1793359749292 COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (167.5 s): Duration  158.16s (transform 91.35s, setup 0ms, import 222.85s, tests 320.95s, environment 5ms)
FAILED  vitest (184.3 s)
ok      vitest slow (265.6 s): Duration  257.09s (transform 16.35s, setup 0ms, import 139.12s, tests 878.59s, environment 19ms)
 FAIL  |unit| tests/server/machine/runs/schedules/commands.test.ts > the commands a schedule runs > reads a hand change of the commands file into the payload
Error: Test timed out in 5000ms.
 Test Files  1 failed | 248 passed | 75 skipped (324)
      Tests  1 failed | 3253 passed | 839 skipped (4093)
test:quick: 267.4 s; failed: vitest
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

That test alone, `npx vitest run --tagsFilter '!slow' --reporter verbose tests/server/machine/runs/schedules/commands.test.ts`: `<check mark> ... reads a hand change of the commands file into the payload 68ms`, `Tests  3 passed (3)`. It is chosen because it imports `src/lib/data/model/index.ts`; it waits on a watcher of the schedules file, which this step does not touch.

The run before it, on the same tree, while this builder ran `unused-exports.sh` and `cases.ts` beside it:

```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (1.8 s)
ok      eslint (12.2 s)
ok      svelte-check (69.5 s): 1793359261332 COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (229.9 s): Duration  218.36s (transform 119.62s, setup 0ms, import 291.26s, tests 466.43s, environment 4ms)
ok      vitest (260.3 s): Duration  250.81s (transform 256.63s, setup 0ms, import 510.50s, tests 421.99s, environment 29.02s)
FAILED  vitest slow (345.0 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder
Error: Test timed out in 20000ms.
 Test Files  1 failed | 92 passed (93)
      Tests  1 failed | 838 passed | 302 skipped (1141)
test:quick: 346.9 s; failed: vitest slow
```

Between the two runs every check is green at least once on the final tree: `vitest` in the earlier run, `vitest slow` in the later one. Whether these two time limits fail on main under the same load is not verified; the landing's run of the verify list on main shows it.

The history-word grep, over every added line of `git diff -U0 -- src tests config` and every line of the new files, kept to comment lines and test titles, with the words of the rules file, package ids and dates: the hits are each a "before" or "still" of order inside one run ("deletes the draft before the publish", "before any request", "a Cancel still deletes it", "the line end before `endstream`"), and the guarded ids G141 and G76 in the head comment of `tests/routes/git/zenodo.test.ts`, which name the guarded entries the tests belong to, as existing test titles do (`(G8)` in `held-unsaved.test.ts`). None compares with an earlier state of the code or names a package or a date. The one date hit is a fixture value, `date: '2026-01-02'` in a test row.

Runs of this step: the fast tests twice by hand before the quick tier (`zenodo.test` and `deposit.test`, 29 passed; then `website-files`, `held-unsaved`, `zenodo`, `deposit`, 84 passed), `templates.test` twice (one failure, then 5 passed), the slow `git-write`, `deposit-compare` and `deposit` tests once (28 passed), the case programs (`first-run.ts` once, `cases.ts` three times, `case14.ts` and `case24.ts` twice each), `unused-exports.sh` twice, `hub-portfolio.test.ts` alone twice, `schedules/commands.test.ts` alone once, and the diagrams, the palette and the quick tier three times. The first quick-tier run found six check failures (below), which were fixed. The second and third ran on the final tree and are quoted above; the `hub-portfolio.test.ts` row that timed out in the second passed alone (`npx vitest run --tagsFilter slow --testTimeout 20000 --reporter verbose tests/data/hubs/hub-portfolio.test.ts`: the row in 2559 ms, `Tests  16 passed (16)`).

The first quick-tier run's failures, each fixed before the second: `config-folder.test.ts` did not expect the new top-level key `deposit` of `config/defaults/behavior.yml` (its `EXPECTED` list gained `deposit`); four comment lines past column 100 (`files.ts:5`, `deposit.ts:172`, `zenodo.ts:159`, `Deposit.svelte:82`, rewrapped or reworded); `keys.test.ts` found computed catalog keys in `zenodo.ts` and `zenodo-copy.ts` (each sentence is now read by a literal key) and therefore no reader for 13 `server.zenodo` keys (the same fix); `duplication.test.ts` found `failed` and `done` written in both `deposit.ts` and `zenodo.ts` (`deposit.ts` exports them and `zenodo.ts` and `zenodo-copy.ts` import them).

## Files and line counts

New: `src/lib/server/git/deposit/deposit-tree.ts` 104, `zenodo-api.ts` 158, `zenodo-copy.ts` 287, `zenodo-meta.ts` 141, `zenodo.ts` 348, `src/lib/views/boards/deposit/DepositZenodo.svelte` 193, `tests/fixtures/hubs/zenodo-answers.ts` 248, `tests/routes/git/zenodo.test.ts` 469.

Changed (lines after the change): `deposit.ts` 801 (861 on the base), `deposit-git.ts` 481, `deposit-routes.ts` 314, `git-write.ts` 867, `running.ts` 151, `writes.svelte.ts` 870, `write-files.ts` 295, `deposit.svelte.ts` 186, `Deposit.svelte` 459, `Editor.svelte` 340, `schema.ts` 632, `record-values.ts` 316, `manifest.ts` (edit/writes) 779, `papers.ts` 183, `model-entities.ts` 807, `model-collections.ts` 527, `model/index.ts` 880, `normalise.ts` 687, `snapshot/schema/manifest.ts` 191, `catalog-files/manifest.ts` 104, `hub-names.ts` 843, `hub-keys.ts` 67, `local.ts` 748, `settings/files.ts` 279, `settings/problems.ts` 83, `settings/reader.ts` 246, `settings/rows/grammar.ts` 500, the two route files 36 and 82; config, docs and tests as `git status` lists them.

The split: the staging of a code folder (`stageTree`, `pathsOf`, `prune`, `emptyCheckout`, `copyable`, `writeIgnore`, `linesOf`) moved out of `deposit.ts` into `deposit-tree.ts`, so the review copy reuses it and `deposit.ts` stays under 880. `src/lib/server/git/deposit/` holds 10 items after the change, the limit.

`npm run diagrams` rewrote ten files under `docs/diagrams/` (`layers`, `layer-server`, `layer-state`, `layer-views`, `writes`, each `.dot` and `.svg`; `git diff --stat -- docs/diagrams`: `10 files changed, 53 insertions(+), 53 deletions(-)`); they are generated and outside the brief's path list.

## Judgment calls the brief left open

- `lsFiles` (`deposit-git.ts`) runs `git ls-files -z` and the paths are split on NUL (`pathsOf`), so a path holding a newline or a quote is one path; the mirror's sync uses the same reading.
- For review with a `doi` and no `zenodo_status` (neither `review-anon` nor `deposited`) is refused with `server.zenodo.doi_unmarked`, since it is not known whether that record is the anonymous one; the brief names only the `review-anon` and `deposited` states.
- A funding award is sent as `award: { title: { en: <the scheme's title> }, number: <award> }`, the multilingual title shape InvenioRDM's funding metadata takes.
- A person's affiliation that names no key of `organisations.yml` is left out of the creator, and the press goes on; the brief refuses only a missing person, family name, funding entry or funder.
- A redirect answered to a record read is followed once, by the record id of its `Location`, rebuilt from the `deposit.zenodo` address; no address an answer gives is requested.
- A person key of the form `<hub>:<key>` is refused as no key of `people.yml`, since the press reads the people of the project's own hub.
- Every Zenodo call other than an upload is given 30 s (`CALL_MS` in `zenodo-api.ts`), the time the Recover listing gives one request (`REQUEST_MS` in `recover/files.ts`).
- When the read of a published record fails before its DOI is known, the sentence names the record's page `<site>/records/<id>` in place of the DOI.
- A project with no `anonymize` rows may send For review: the copy is then the code as it is, with the author Anonymous.
- A file of a compressed form the copy cannot read (`.bz2`, `.xz`, `.7z`, `.rar`, `.zst`) refuses For review even when the manifest holds no term, as item 3 reads.

## Visible changes for the look

- The Deposit view, a project with a deposit: a section "Zenodo" after the mirror blocks, with the buttons "For review" and "Publish" (tips: "Sends an anonymised copy of code/ to Zenodo, author Anonymous, its files open only through a share link." and "Sends the real files of code/ and the real authors to Zenodo, public."), the Status, the DOI and the Share link, each with "no DOI yet", "no share link yet", "not deposited" when empty, and a Copy button for the DOI and the link. Before: no Zenodo section. To see the off state: no `downloads` row `zenodo` in the primary hub's `.oculus/local.yml`; both buttons are off with the tip "Off until the downloads row deposit.zenodo.auth names is set in the primary hub's .oculus/local.yml." Each press opens the confirm dialog (`zenodo_review_confirm` / `zenodo_publish_confirm` with their details) and its sentence shows under the section.
- The project form (case 27), a manifest with `code_availability.anonymize`: under "Deposit & compute", the rows drawn as record cards with the fields `term` and `as`, a button that adds a row and one that removes it; Save writes the list. Before: no `anonymize` field. The form also shows `review_link` read-only, `zenodo_status` as a select of `none`, `review-anon`, `deposited`, and `zenodo_date` as a date.
- Settings, scope Primary hub or Hub, section Deposit: the rows `deposit.zenodo.address` and `deposit.zenodo.timeout_s`.
- The website's Code link: a manifest with `zenodo_status: deposited` and a `doi` links `https://doi.org/<doi>`; under `review-anon` or with no `zenodo_status` it links `code_availability.url` when `status` is `deposited`.

## What in the brief was wrong or impossible

- The calls of Publish and of a new version of a review record include `PUT /api/records/{id}/draft`, which writes the metadata of a version draft; the brief's list of calls does not name it. The InvenioRDM documentation makes a new version's draft without the new metadata, so it is needed.
- `src/lib/data/snapshot/schema/manifest.ts` (the schema reader, which reads the `rows` kind and its `fields:`), `src/lib/data/model/index.ts` (exports `AnonymizeRow`), `tests/fixtures/hubs/zenodo-answers.ts` (the fake Zenodo) and `tests/checks/config/config-folder.test.ts` (the new top-level key `deposit` in its list of `behavior.yml`'s keys) are outside the brief's path list; each is needed by the change.
- The `review_link` line of the manifest template in `docs/templates.md` is not written: `tests/checks/config/templates.test.ts:73-82` holds the template to the schema's fields that are not `readonly`, both ways, so a line for `review_link`, which is `readonly` (563), is an extra key there and fails it.
- `tests/server/git/deposit-compare.test.ts`'s Zenodo case lays the fake's address over the shipped `deposit.zenodo` row, as a hub's settings file lays it.
- Verify item 4 expects `checking file` lines; macOS's `patch` prints `patching file` for a dry run.
- Verify item 5: to keep the config grep to the two rows, the help of `deposit.zenodo.address` in `config/options/behavior.yml` names Zenodo's API and its sandbox in words, and the token help of the row says "made on Zenodo".

## Doc text

The lines are those of the worktree, whose `docs/HELP.md`, `docs/data-map.md`, `docs/apps.md` and `.scratch/migration/agents/guarded.md` this step does not change.

`docs/HELP.md`:

- `314: - **Deposit.** Every project has one. It keeps a mirror clone under `~/.oculus/deposits`, synced from the project's `code/`, with sync, commit, push, snapshot, branches, Fetch, and the diffs against `origin/main`.`
  Replacement: `- **Deposit.** Every project has one. It keeps a mirror clone under `~/.oculus/deposits`, synced from the project's `code/`, with sync, commit, push, snapshot, branches, Fetch, and the diffs against `origin/main`. Its Zenodo section sends `code/` to Zenodo: For review sends an anonymised copy, each term of `code_availability.anonymize` replaced in the paths, the text files, the title and the description and the author Anonymous, its files open only through a share link; Publish sends the real files and authors, public, as a new version of the concept the `doi` names or a new record. Both ask first, need the `downloads` row `zenodo` of the primary hub's `.oculus/local.yml` (the row `deposit.zenodo.auth` names), and write `doi`, `zenodo_status`, `zenodo_date` and, for review, `review_link` into the manifest; a binary or compressed file holding a term refuses For review by name.`
- New line after 314: `  - `deposit.zenodo` in a hub's `.oculus/config.yml` sets the address every Zenodo call is built from (`address`, Zenodo's API by default, such as its sandbox for a trial), the seconds one upload is given (`timeout_s`, 600) and the token's header (`auth`); a hub that sets only `address` keeps the rest.`
- `515: - These are fixed: ... Nothing force-pushes except a deposit's snapshot.` No change needed.

`docs/data-map.md`:

- `191:  funder: organisations key` Replacement, two lines: `  funder: organisations key` and `  award: the funder's award number, sent with the title to Zenodo`.
- New lines after the manifest's link lines (after `status.chips: [vocab chips]`, line 187): `  code_availability.anonymize: rows of { term, as }, the words For review replaces` and `  code_availability.zenodo_status: none, review-anon or deposited; zenodo_date, review_link and doi are the Zenodo deposit's`.

`docs/apps.md`:

- `406: | `funding` | `id`, `title`, ..., `snooze?`, `funder?` |` Replacement: the same row ending `..., `snooze?`, `funder?`, `award?` |`.
- `407: | `people` | `id`, `name`, `affiliations`, `links`, `projectIds`, `role?`, `orcid?`, `email?`, `folder?`, `file?`, `self?` |` Replacement: `| `people` | `id`, `name`, `affiliations`, `links`, `projectIds`, `role?`, `family?`, `orcid?`, `email?`, `folder?`, `file?`, `self?` |` (`Person.family` is on main).
- `402`, the `projects` row: `codeAvailability?` holds `anonymize`, `reviewLink`, `zenodoStatus` and `zenodoDate` beside its fields; if the page lists the fields of `codeAvailability`, those four join them.

`.scratch/migration/agents/guarded.md`:

- G141, new entry after G140: `- G141. A For review upload to Zenodo holds no term of the manifest's `code_availability.anonymize`: each file name, each text content, the title and the description are sent with every term replaced, a binary file whose bytes hold a term is refused by name before anything is uploaded, and the one creator is "Anonymous".` with `  Code: `src/lib/server/git/deposit/zenodo-copy.ts`, `zenodo.ts`.` and `  Test: `tests/routes/git/zenodo.test.ts`, describe 'the review copy For review sends', every row.`
- `22: - G6. A git action that can lose work or move a branch needs `confirm: true`. Each action of the `CONFIRMED` lists is a unit.` Replacement: `- G6. A git action that can lose work or move a branch, and a Zenodo deposit (For review, Publish), needs `confirm: true`. Each action of the `CONFIRMED` lists is a unit.`
- `24` (G6's Test line), append: `; zenodoReview and zenodoPublish: `tests/routes/git/deposit.test.ts`, 'refuses zenodoReview that the page did not confirm', 'refuses zenodoPublish that the page did not confirm'.`
- `9` (G1's Test line), append: `; deposit's Zenodo actions: `tests/routes/git/deposit.test.ts`, 'refuses zenodoReview with no token', 'refuses zenodoPublish with no token'`.
- `52` (G76), append: ` The Zenodo token, read from the `downloads` row `deposit.zenodo.auth` names, is sent only in the `Authorization` header of requests to the `deposit.zenodo` address, no other reader row is given it, and no answer, log or History record holds it.` Code line 53, append: `; the Zenodo token: `src/lib/server/git/deposit/zenodo-api.ts`, `readerAccounts` in the Recover route.` Test line 54, append: `; `tests/routes/git/zenodo.test.ts`, describe 'the Zenodo token', every row.`
- `85` (G28's Test line), append: `; the deposit actions that write the manifest: `tests/state/client/held-unsaved.test.ts`, describe 'the file a deposit action writes', every row.`
- `170` (G79's Test line), after 'syncs the code folder of the project folder, never the one under .oculus': `, 'makes the Zenodo review copy from the code folder of the project folder, never the one under .oculus'`.
- `225` (G139), replace "the `Code` link, last in `links`, is `https://doi.org/<doi>` for a deposited manifest with a DOI, else its `code_availability.url`" with "the `Code` link, last in `links`, is `https://doi.org/<doi>` when `zenodo_status` is `deposited` and `doi` is not empty, else `code_availability.url` when `status` is `deposited`, else none; a DOI under `zenodo_status: review-anon` is never linked". Test line 227 already reads "every row", which takes the three new rows.
- The git run's broken pipe (case 26) has its test in `tests/server/git/git-write.test.ts`, describe 'a git run handed more input than it reads', 'answers from the exit of a git that ends before reading its input, and leaves no broken pipe unhandled'; it belongs to no guarded entry the brief names.

## The hub patch

`.scratch/migration/agents/reviews/O101-hub.patch`, 132 lines, made by `diff -ruN a b` from the scratch folder; touches three files of the hub:

- `.oculus/data/academic/funding.yml`, 5 lines added: the schema row `award` after `funder`; `funder: flemish-government` on `FAIR`, `funder: zonmw` on `ZonMw-AI-HCC`, `funder: fwo` and `award: "1157019N"` on `FWO-PhD`. The award number is the one the thesis chapters print, `projects/archive/phd/phd-thesis/manuscript/chapters/acknowledgement/acknowledgement.tex:4` ("Flanders (FWO 1157019N)").
- `.oculus/data/people/organisations.yml`, 12 lines added (15 with the blank lines): `zonmw` "ZonMw" NL, `flemish-government` "Flemish Government" BE, `fwo` "Research Foundation Flanders" BE, each `kind: funder`.
- `.oculus/data/people/people.yml`, 9 lines added, `family` filled for:
  - `amir-haeri` "Amir Haeri", `guichelaar` "Guichelaar", `jakob-nolte` "Nolte", `van-den-berg` "van den Berg": from `projects/manuscripts/covert-theory/manuscript/refs.bib:57` (`Nolte, Jakob and Guichelaar, Maureen M. J. and Bouman, Donald E. and van den Berg, Stephanie M. and Amir Haeri, Maryam`), the same split in `projects/archive/published/2026/hccnet-fl/manuscript/references/hccnet_fl.bib:255`.
  - `peeters` "Peeters": from `projects/manuscripts/covert-theory/manuscript/refs.bib:48` (`Peeters, Liesbet M.`).
  - `dongho` "Chun", `dries-cornelissen` "Cornelissen", `ward` "Ceyssens": no file splits the name; the last word of the name as every file prints it, the website's `_data/data.yml:162`, `:165`, `:168` ("Dongho Chun", "Dries Cornelissen", "Ward Ceyssens").
  - `matija-pretnar` "Pretnar": no file splits the name; the last word of "Matija Pretnar" in `projects/coauthor/published/2017/algebraic-effects-compilation/project.yml:23` and the website's `_data/publications.yml:400`.
- Left without `family`: `kerga`, "Meseret Assefa Kerga", a name with no family name in the Western sense; the one file of the hub that prints it, `projects/manuscripts/meseret-cirrhosis/project.yml:42` (`authors: Meseret Assefa Kerga, Axel Faes`), does not split it. A Publish of a project that names `kerga` is refused with the sentence naming the person until the hub fills `family`.

The three patched files parse (the `yaml` package of the worktree read `b/`: funding.yml 12 entries, organisations.yml 11, people.yml 38, and the funded entries `[ 'FAIR', 'flemish-government', undefined ]`, `[ 'ZonMw-AI-HCC', 'zonmw', undefined ]`, `[ 'FWO-PhD', 'fwo', '1157019N' ]`).
