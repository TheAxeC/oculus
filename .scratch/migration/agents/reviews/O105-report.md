NOT done: check 1 of "Verify before you report" did not print "every command passed". Both runs of the list ended `test:quick: ...; failed: vitest, vitest slow`. In the second run the 6 red tests are all timeouts in 5 files this step does not change, and each of the 5 passes when run alone; the rule of the spec's line 26 says the list is not run again for them. Everything else in the brief is done.

# O105 report

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:166`, with the two lines under it, and nothing listed before `## Closed items`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run

No case of the brief's rules came out wrong, so the builder did not stop.

The first run of the kept tests was on the unchanged source: 4 test files, `35 failed | 62 passed (97)`. The failing line of each test is below, as printed, with the character outside the set written `<ellipsis>`. A title and its failing line are one entry; where titles stand together vitest printed them over one failure.

```
tests/routes/docs/audit.test.ts > the website of the audit > raise nothing about a title or a CV value of the website's own file
    AssertionError: expected [ { scope: 'website', <ellipsis>(8) }, <ellipsis>(1) ] to deeply equal []
tests/routes/docs/audit.test.ts > the website of the audit > compare the file website.files names, and leave the shipped path alone
    AssertionError: expected [] to deeply equal [ 'data/papers.yml' ]
tests/routes/docs/audit.test.ts > the website of the audit > name the configured path of the website's own file for a research line its programs: lacks
    AssertionError: expected [ <ellipsis>(2) ] to deeply equal [ Array(1) ]
tests/routes/docs/audit.test.ts > the website of the audit > give one finding naming the key of a path that cannot be used and read no file: a path out of the folder
    AssertionError: expected [ [ '_data/website.yml', <ellipsis>(1) ] ] to deeply equal [ [ 'website.files.cv', <ellipsis>(1) ] ]
tests/routes/docs/audit.test.ts > the website of the audit > give one finding naming the key of a path that cannot be used and read no file: an empty path
    AssertionError: expected [ [ '_data/website.yml', <ellipsis>(1) ] ] to deeply equal [ [ 'website.files.papers', <ellipsis>(1) ] ]
tests/routes/docs/audit.test.ts > the website of the audit > give one finding naming the key of a path that cannot be used and read no file: two keys naming one file
    AssertionError: expected [ [ '_data/website.yml', <ellipsis>(1) ] ] to deeply equal [ [ 'website.files.site', <ellipsis>(1) ] ]
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > stops before the first write when a path of website.files names a folder that is not there
    AssertionError: expected { ok: true, written: [ <ellipsis>(3) ], <ellipsis>(1) } to deeply equal { error: 'website-unwritable', <ellipsis>(1) }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: the CV out of the folder
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: the website's own file out of the folder
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: an absolute path whose joined folder is in the website
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: a path through a link in the folder that points out of it
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: a file that is a link to a file out of the folder
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: the website's own file and the CV on one file
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: the CV and the publications on one file
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the key of a path of website.files that cannot be used, asks no approval and writes nothing: an empty path
    AssertionError: expected { status: 200, body: { <ellipsis>(2) } } to deeply equal { status: 409, body: { <ellipsis>(2) } }
tests/routes/sessions/website.test.ts > a press of Write the website that is refused > names the configured path of a website's own file that is not YAML, before an approval is asked
    AssertionError: expected { <ellipsis>(2) } to deeply equal { <ellipsis>(2) }
tests/routes/sessions/website.test.ts > a press of Write the website that is taken > writes the file website.files names and not the shipped one
    AssertionError: expected [ '_data/data.yml', <ellipsis>(2) ] to deeply equal [ '_data/data.yml', <ellipsis>(2) ]
tests/data/hubs/website-files.test.ts > the website files the hub gives > no section of the CV or the publications holds a title, and the publications hold none at the top
    AssertionError: expected true to be false // Object.is equality
tests/data/hubs/website-files.test.ts > the website files the hub gives > both person blocks hold the names and the links and nothing of the website file
    AssertionError: expected [ 'first-name', 'last-name', <ellipsis>(3) ] to deeply equal [ 'first-name', 'last-name', 'links' ]
tests/data/hubs/website-files.test.ts > the website files the hub gives > a title or a CV value of the website's own file changes none of the three files
    AssertionError: expected { <ellipsis>(3) } to deeply equal { <ellipsis>(3) }
tests/data/hubs/website-files.test.ts > the website files the hub gives > the files are named by the paths of website.files, in the order a write takes them
    AssertionError: expected [ '_data/data.yml', <ellipsis>(2) ] to deeply equal [ '_data/data.yml', <ellipsis>(2) ]
tests/data/hubs/website-files.test.ts > the website files the hub gives > a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults
    AssertionError: expected undefined to deeply equal { site: '_data/website.yml', <ellipsis>(3) }
tests/data/hubs/website-files.test.ts > the website files the hub gives > a hub that sets one key of website.files reads it, and the shipped value of the others
    AssertionError: expected undefined to deeply equal { site: '_data/website.yml', <ellipsis>(3) }
tests/data/hubs/website-files.test.ts > the files the audit reads and the watcher hears > are the paths of website.files without the bad ones: a path of a folder of the website
    AssertionError: expected [ <ellipsis>(4) ] to deeply equal [ <ellipsis>(4) ]
tests/data/hubs/website-files.test.ts > the files the audit reads and the watcher hears > are the paths of website.files without the bad ones: a path out of the folder
    AssertionError: expected [ <ellipsis>(4) ] to deeply equal [ <ellipsis>(3) ]
tests/data/hubs/website-files.test.ts > the files the audit reads and the watcher hears > are the paths of website.files without the bad ones: an absolute path
    AssertionError: expected [ <ellipsis>(4) ] to deeply equal [ <ellipsis>(3) ]
tests/data/hubs/website-files.test.ts > the files the audit reads and the watcher hears > are the paths of website.files without the bad ones: an empty path
    AssertionError: expected [ <ellipsis>(4) ] to deeply equal [ <ellipsis>(3) ]
tests/data/hubs/website-files.test.ts > the files the audit reads and the watcher hears > are the paths of website.files without the bad ones: a link out of the folder
    AssertionError: expected [ <ellipsis>(4) ] to deeply equal [ <ellipsis>(3) ]
tests/data/hubs/website-files.test.ts > the files the audit reads and the watcher hears > are the paths of website.files without the bad ones: two keys naming one file
    AssertionError: expected [ <ellipsis>(4) ] to deeply equal [ <ellipsis>(2) ]
tests/state/sessions/source/website-store.test.ts > the tip of Write the website > names the paths the settings give: the shipped paths and no command
tests/state/sessions/source/website-store.test.ts > the tip of Write the website > names the paths the settings give: a path of website.files.cv and no command
tests/state/sessions/source/website-store.test.ts > the tip of Write the website > names the paths the settings give: a path of website.files.papers and a command
    TypeError: storeOf(...).tip is not a function
tests/state/sessions/source/website-store.test.ts > the tip of Write the website > is the reason while the button is off
    TypeError: storeOf(...).tip is not a function
tests/state/sessions/source/website-store.test.ts > a press over a file a source tab holds unsaved text of > stops before it is sent: a path website.files.papers names
    AssertionError: expected { <ellipsis>(2) } to deeply equal { <ellipsis>(2) }
tests/state/sessions/source/website-store.test.ts > a press over a file a source tab holds unsaved text of > stops before it is sent: a path written with a dot segment
    AssertionError: expected { <ellipsis>(2) } to deeply equal { <ellipsis>(2) }
```

Each case by its name, with the first run and the run after the change:

| Case | How checked | First run | After the change |
| --- | --- | --- | --- |
| A | case-run program below, `node --experimental-transform-types --no-warnings case-gen.mts <tree> <hub> <website> <out>` | Output block A-first | Output block A-after |
| B | kept tests 'a title or a CV value of the website's own file changes none of the three files' and 'raise nothing about a title or a CV value of the website's own file' | both fail, lines above | pass |
| C | kept test 'name the configured path of the website's own file for a research line its programs: lacks' | fails, line above | pass |
| D | kept tests 'the files are named by the paths of website.files, in the order a write takes them', 'compare the file website.files names, and leave the shipped path alone', 'writes the file website.files names and not the shipped one', row 'a path of a folder of the website' | fail, lines above | pass |
| E | kept test 'a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults' | fails, line above | pass |
| F | kept table 'names the key of a path of website.files that cannot be used, asks no approval and writes nothing', rows 'the CV out of the folder', 'the website's own file out of the folder', 'an absolute path whose joined folder is in the website', 'a path through a link in the folder that points out of it', 'a file that is a link to a file out of the folder' | all fail, lines above | pass |
| G | kept tests 'names the configured path of a website's own file that is not YAML, before an approval is asked' and 'writes the three files while the website's own file at a configured path is missing' | the first fails, line above; the second passes, a behaviour the change preserves | pass |
| H | case-run program, the changed generator over a hub that still has `title:` in its 8 rows and `parts:` in its career file | Output block A-first shows both reach the files on the unchanged tree | Output block H |
| I | `python3 _scripts/cv_pdf_generator.py --quiet`, `python3 _industry/cv_pdf_generator.py --profile analyst --quiet` in each scratch copy, `pdftotext -layout`, `cmp`, `pdfimages -list` | the copy at 4e1437c built with exit 0 | Output block I |
| J | `bundle exec jekyll build` in each scratch copy, `grep -E 'psec-h\|class="secnav"' -A1`, `cmp`, then every html page compared | the copy at 4e1437c built with exit 0 | Output block J |
| K | kept store test 'names the paths the settings give: a path of website.files.cv and no command' | fails, line above | pass |
| L | read, below | blank heading, stop of the CV | same behaviour, below |
| M | kept rows 'the website's own file and the CV on one file', 'the CV and the publications on one file' | fail, lines above | pass |
| N | kept row 'an empty path' of the press table | fails, line above | pass |
| O | kept table 'give one finding naming the key of a path that cannot be used and read no file' | fails, lines above | pass |
| P | kept store table 'stops before it is sent', rows 'a shipped path', 'a path website.files.papers names', 'a path written with a dot segment' | 'a shipped path' passes, a behaviour the change preserves; the other two fail, lines above | pass |
| Q | kept test 'stops before the first write when a path of website.files names a folder that is not there' | fails, line above | pass |

Run after the change, the last run of each changed test file:

```
npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/data/sources/career.test.ts tests/state/sessions/source/website-store.test.ts
 Test Files  4 passed (4)
      Tests  105 passed (105)

npx vitest run tests/routes/sessions/website.test.ts --tagsFilter slow --testTimeout 20000 --reporter=dot
 Test Files  1 passed (1)
      Tests  20 passed (20)

npx vitest run tests/routes/sessions/website.test.ts tests/server/root/watch/website-watch.test.ts --reporter=verbose
 Test Files  2 passed (2)
      Tests  21 passed (21)
```

The 105-test run and the 21-test run came before a prettier format of `tests/routes/docs/audit.test.ts` and the rewrap of one comment in `publications.ts`; the second list run comes after both, and none of these test files is red in it.

Output block A-first (unchanged source, scratch hub, website copy at 4e1437c):

```
files built: _data/data.yml, _data/publications.yml, _data/industry.yml
problems: 0
data.yml sections with title: references, experience, academic, students, news, education, grants, projects, awards, extracurricular
data.yml personal keys: first-name, last-name, titles, portrait_url, footer, secondary-title, author, website, links
publications.yml top title: Publications
publications.yml sections with title: papers-in-review, papers-in-preparation, journal, conference, other-publications, thesis, abstracts, posters
industry.yml shared.personal keys: first-name, last-name, portrait_url, author, website, links
parsed diff of _data/data.yml against the disk: 0 {}
parsed diff of _data/publications.yml against the disk: 0 {}
parsed diff of _data/industry.yml against the disk: 0 {}
```

Output block A-after (changed source, scratch hub with the hub patch, website with the patch). The program also printed one line per removed key; none is an `added` or `changed` line, as the counts show.

```
files built: _data/data.yml, _data/publications.yml, _data/industry.yml
problems: 0
data.yml sections with title: (none)
data.yml personal keys: first-name, last-name, links
publications.yml top title: (none)
publications.yml sections with title: (none)
industry.yml shared.personal keys: first-name, last-name, links
parsed diff of _data/data.yml against the disk: 16 { removed: 16 }
parsed diff of _data/publications.yml against the disk: 9 { removed: 9 }
parsed diff of _data/industry.yml against the disk: 3 { removed: 3 }
```

Output block H (changed source, scratch hub without the hub patch, so its 8 rows keep `title:` and its career file keeps `parts:`). The problems line 0 also shows such a hub raises nothing.

```
files built: _data/data.yml, _data/publications.yml, _data/industry.yml
problems: 0
data.yml sections with title: (none)
data.yml personal keys: first-name, last-name, links
publications.yml top title: (none)
publications.yml sections with title: (none)
industry.yml shared.personal keys: first-name, last-name, links
parsed diff of _data/data.yml against the disk: 16 { removed: 16 }
parsed diff of _data/publications.yml against the disk: 9 { removed: 9 }
parsed diff of _data/industry.yml against the disk: 3 { removed: 3 }
```

Output block I. No `--save` was used.

```
cv exit 0
industry exit 0
   38402 old-_scripts-_tmp-cv.pdf.txt    38402 new-_scripts-_tmp-cv.pdf.txt EQUAL _scripts-_tmp-cv.pdf
    7409 old-_industry-_tmp-cv.pdf.txt     7409 new-_industry-_tmp-cv.pdf.txt EQUAL _industry-_tmp-cv.pdf
    2852 old-_industry-_tmp-coverletter.pdf.txt     2852 new-_industry-_tmp-coverletter.pdf.txt EQUAL _industry-_tmp-coverletter.pdf
old _scripts/_tmp/cv.pdf:        1 image(s)
old _industry/_tmp/cv.pdf:        1 image(s)
old _industry/_tmp/coverletter.pdf:        1 image(s)
new _scripts/_tmp/cv.pdf:        1 image(s)
new _industry/_tmp/cv.pdf:        1 image(s)
new _industry/_tmp/coverletter.pdf:        1 image(s)
```

Output block J, on the final `about.html`. Past the `site.css?v=` build stamp every html page of the two sites is the same, and `feed.xml` differs only in its `<updated>` line.

```
jekyll exit 0
html files compared: 16; differing past the css build stamp: 0
      32 J-old-cv.txt       32 J-new-cv.txt EQUAL cv
      26 J-old-publications.txt       26 J-new-publications.txt EQUAL publications
cv: 10 headings old, 10 new; empty new: 0
publications: 8 headings old, 8 new; empty new: 0
References
Work &amp; Research Experience
Teaching &amp; Academic Activities
Students
Talks, presentations and other media
Educational background
Grants &amp; Funding
Projects
Honors &amp; Awards
Professional Development Activities
International Journal Papers
Conference Papers
Papers in Review
Papers in Preparation
Other publication
Thesis
Extended Abstracts
Posters
```

The about page is built at `/cv/` on this website, so the page the brief calls about is `cv/index.html` above.

Case L, read:

- A section key of `data.yml` with no title in `sections:`: `_includes/site/about.html` prints `{{ site.data.website.sections[seckey] }}`, which is nil and prints as nothing, so the heading is blank, as `coll[1].title` nil gave today.
- A `website.kinds` key with no title: `_includes/site/publications.html` loops over its own `section_order` and reads `site.data.website.sections[seckey]`, blank in the same way, and only for a section the file holds.
- The CV: a template reading `website['sections'][<key>]` for a missing key raises `KeyError`, so the CV build stops, as `data[<key>]['title']` did today. A key no template reads stops nothing.
- No finding is raised, as the brief's decision 5 says.

The case-run program, which lived in the scratchpad and is gone (`rm -rf` of the scratch folder before this report). A reviewer runs it with the line in its head.

```ts
// Case-run program of O105, cases A and H. Builds the website's three files from a scratch hub with
// the generator of the tree named, prints what each case asks of them, and writes the built texts
// into the scratch folder `out`.
// node --experimental-transform-types --no-warnings case-gen.mts <tree> <hub> <website> <out>
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const [tree, hub, website, out] = process.argv.slice(2);
const at = (path: string) => import(join(tree, 'src/lib', path));
const { parse } = await import(join(tree, 'node_modules/yaml/dist/index.js'));

const { engineDir, loadConfig } = await at('data/sources/config.ts');
const { readMachine } = await at('data/sources/config/machine.ts');
const { websiteSettings } = await at('data/sources/config/settings/files.ts');
const { rootOf } = await at('data/helpers/hub-names.ts');
const { Hub } = await at('server/core/channels.ts');
const { auditRules } = await at('server/content/audit/rules.ts');
const { websiteFiles } = await at('server/content/audit/website/files.ts');
const { readSite } = await at('server/content/audit/website/site.ts');
const { watchPortfolio } = await at('server/root/watch/portfolio/portfolio.ts');
const { writeState } = await at('server/files/workspace/state.ts');
const { openWorkspace } = await at('server/files/workspace/open.ts');

const state = mkdtempSync(join(tmpdir(), 'o105-state-'));
writeState(state, {
    open: null,
    recent: [],
    unsaved: { folders: [{ name: 'hub', path: hub }], primary: 'hub' }
});
const channels = new Hub();
const open = () => openWorkspace(state);
const watcher = watchPortfolio(
    channels,
    {
        engine: engineDir(),
        icons: { set: {} },
        host: { name: 'test', address: '127.0.0.1' },
        open,
        settings: (dir: string) => loadConfig(engineDir(), { hub: dir }),
        defaults: () => loadConfig(engineDir()),
        problems: () => [],
        self: () => readMachine(open().hubs, open().primary).config.self
    },
    { debounce: 20 }
);
watcher.close();
const snapshot = channels.latest('portfolio').payload;
const config = loadConfig(engineDir(), { hub }).config;
const setting = websiteSettings(config);
const { entities } = snapshot;
const ours = (all: Record<string, { root?: string }>) =>
    Object.values(all).filter((one) => rootOf(one) === 'hub');
const people = Object.values(entities.people) as { id: string; self?: boolean }[];
const sitePath = setting.files?.site ?? '_data/website.yml';
const built = websiteFiles({
    projects: ours(entities.projects),
    collections: ours(entities.collections),
    people,
    career: entities.career,
    self: new Set(people.filter((one) => one.self === true).map((one) => one.id)),
    kinds: setting.kinds,
    rules: auditRules(config),
    site: readSite(parse(readFileSync(join(website, sitePath), 'utf8')), sitePath),
    paths: setting.files
});

console.log('files built:', built.files.map((one: { name: string }) => one.name).join(', '));
console.log('problems:', built.problems.length);
for (const file of built.files) {
    const path = join(out, file.name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.text);
}

/** Every place two values differ, by kind: removed, added or changed. */
function diff(old: unknown, now: unknown, place: string, found: string[]): void {
    const map = (one: unknown) => typeof one === 'object' && one !== null && !Array.isArray(one);
    if (Array.isArray(old) && Array.isArray(now)) {
        const length = Math.max(old.length, now.length);
        for (let i = 0; i < length; i += 1) diff(old[i], now[i], `${place}.${i}`, found);
        return;
    }
    if (map(old) && map(now)) {
        const a = old as Record<string, unknown>;
        const b = now as Record<string, unknown>;
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (!(key in b)) found.push(`removed ${place}.${key}`);
            else if (!(key in a)) found.push(`added ${place}.${key}`);
            else diff(a[key], b[key], `${place}.${key}`, found);
        }
        return;
    }
    if (old !== now) found.push(`changed ${place}: ${String(old)} -> ${String(now)}`);
}

const titled = (value: Record<string, Record<string, unknown>>) =>
    Object.entries(value)
        .filter(([, part]) => typeof part === 'object' && part !== null && 'title' in part)
        .map(([key]) => key);

const named = (name: string) => built.files.find((one: { name: string }) => one.name === name);
const [cvName, papersName, industryName] = built.files.map((one: { name: string }) => one.name);
const cv = parse(named(cvName).text);
const papers = parse(named(papersName).text);
const industry = parse(named(industryName).text);
console.log('data.yml sections with title:', titled(cv).join(', ') || '(none)');
console.log('data.yml personal keys:', Object.keys(cv.personal).join(', '));
console.log('publications.yml top title:', 'title' in papers ? papers.title : '(none)');
console.log('publications.yml sections with title:', titled(papers).join(', ') || '(none)');
console.log('industry.yml shared.personal keys:', Object.keys(industry.shared.personal).join(', '));

for (const [name, now] of [
    [cvName, cv],
    [papersName, papers],
    [industryName, industry]
]) {
    const disk = join(website, name);
    const old = existsSync(disk) ? parse(readFileSync(disk, 'utf8')) : null;
    const found: string[] = [];
    diff(old, now, '', found);
    const kinds = new Map<string, number>();
    for (const line of found) {
        const kind = line.split(' ')[0];
        kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    }
    console.log(`parsed diff of ${name} against the disk:`, found.length, Object.fromEntries(kinds));
    for (const line of found) console.log('  ', line.slice(0, 120));
}
process.exit(0);
```

The scratch hub for the program held `.oculus` and the `project.yml` manifests of the hub, and my own `.oculus/local.yml` with the one line `self: axel-faes`; no `local.yml` of a hub or of oculus was read.

## DONE / NOT DONE

The list ran 2 times; no other whole-suite command ran. The first run was red in `tests/routes/sessions/website.test.ts`, a file the step changed, by a timeout, so it was rerun alone and the list ran once more, as the spec's line 26 says.

| Item | State | Output of the final run |
| --- | --- | --- |
| Verify 1, `npm run diagrams && npm run docs:palette && npm run test:quick` | NOT DONE | second run, below |
| Verify 1, the ASCII gate | DONE | `ok      ASCII gate (2.2 s)` |
| Verify 1, prettier, eslint, svelte-check, the checks | DONE | second run, below |
| Verify 2 | DONE | below |
| Verify 3, both patches dry-run | DONE | below, exit 0 each |
| Verify 4 | DONE | below |
| Verify 5, each test on the unchanged tree and after | DONE | first-run lines above, the proofs and audits below |
| Verify 6, sentences and list items read | DONE | below |
| Character-set check | DONE | below |
| Item 1, the website reads its own words | DONE | case I and J blocks |
| Item 2, generated files hold only what the hub gives | DONE | case A and H blocks |
| Item 3, `website.files` | DONE | cases D to G, K, M to Q; verify 4 |
| Item 4, the `programs:` check stays | DONE | case C |
| Item 5, no old form | DONE | case H, verify 2 |
| Item 6, docs and tests | DONE | counts below |

Second run of the list, the lines of its stages as printed:

```
test:quick: 37 changed file(s), from git since HEAD
test:quick: 264 test file(s)
ok      ASCII gate (2.2 s)
ok      prettier (2.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      eslint (34.6 s)
ok      svelte-check (55.3 s): 1793404211702 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (297.9 s): Duration  288.80s (transform 126.13s, setup 0ms, import 375.79s, tests 591.17s, environment 6ms)
FAILED  vitest (308.9 s)
      Tests  3 failed | 2650 passed | 642 skipped (3295)
FAILED  vitest slow (392.7 s)
      Tests  3 failed | 639 passed | 262 skipped (904)
test:quick: 395.3 s; failed: vitest, vitest slow
```

The six red tests of that run, named here by file and describe, since their full titles were not kept. Every one is a timeout (`3 Error: Test timed out in 20000ms.`, `3 Error: Test timed out in 5000ms.`):

- `tests/data/snapshot/rename.test.ts`, the rename of a hub key.
- `tests/server/edit/app-store.test.ts`, writes the store of an app as the app-store kind.
- `tests/data/sources/manifests/manifests.test.ts`, the scan and the manifest's own tier and stage.
- `tests/data/hubs/hub-portfolio.test.ts`, two tests of a workspace of several hubs.
- `tests/routes/edit/config-key.test.ts`, Reset of an option.

Each rerun alone, none a file the step changes:

```
tests/data/snapshot/rename.test.ts exit 0: 31 passed (31)
tests/server/edit/app-store.test.ts exit 0: 15 passed (15)
tests/data/sources/manifests/manifests.test.ts exit 0: 36 passed (36)
tests/data/hubs/hub-portfolio.test.ts exit 0: 16 passed (16)
tests/routes/edit/config-key.test.ts exit 0: 14 passed (14)
```

The first run of the list had `23 failed` and `18 failed`: 38 timeouts of 5000, 20000 or 90000 ms, and one `AssertionError: expected 400 to be 200` at `tests/routes/git/clone.test.ts:139`, with `uptime` load averages of 10.45 14.35 11.35 just after it. Of the files it named, each one the step does not change passed when rerun alone:

```
tests/data/snapshot/references.test.ts exit 0: 40 passed (40)
tests/data/snapshot/relation-shapes.test.ts exit 0: 12 passed (12)
tests/data/sources/scan.test.ts exit 0: 10 passed (10)
tests/data/helpers/code-theme-pairs.test.ts exit 0: 2 passed (2)
tests/data/hubs/workspace-projects.test.ts exit 0: 5 passed (5)
tests/routes/hubs/make.test.ts exit 0: 35 passed (35)
tests/routes/git/deposit.test.ts exit 0: 10 passed (10)
tests/routes/git/zenodo.test.ts exit 0: 51 passed (51)
tests/routes/machine/cpp.test.ts exit 0: 5 passed (5)
tests/server/sessions/usage-sessions.test.ts exit 0: 2 passed (2)
tests/routes/sessions/terminal.test.ts exit 0: 3 passed (3)
tests/server/accounts/connect/git/routes.test.ts exit 0: 9 passed (9)
tests/server/machine/hpc/clusters/cluster-row.test.ts exit 0: 8 passed (8)
tests/server/machine/runs/schedules/commands.test.ts exit 0: 3 passed (3)
tests/data/hubs/hub-portfolio.test.ts exit 0: 16 passed (16)
tests/routes/git/clone.test.ts exit 0: 23 passed (23)
tests/server/edit/config-key.test.ts exit 0: 36 passed (36)
tests/server/edit/config-value.test.ts exit 0: 23 passed (23)
tests/server/machine/apps/tools/tasks.test.ts exit 0: 6 passed (6)
```

`tests/routes/sessions/website.test.ts`, the one changed file red in the first run, timed out in 2 tests at 20000 ms there; `npx vitest run` of it alone without the tier's flag has the 5000 ms default and gave `1 failed | 19 passed (20)` at load 16.27, each test taking 1.5 to 8 s; with `--tagsFilter slow --testTimeout 20000`, the flags of `npm run test:slow`, it gave `Tests  20 passed (20)`, and it is not red in the second list run. The file's head comment says its cases time out under the load of a full run. No timeout in any file or config was changed.

Whether the timeouts are load alone is my judgment from the runs above; what would settle it is one list run on a machine with nothing else running.

Verify 2. `git grep` is not one of the three git commands the spec allows, so plain `grep -rnE` stood in, over the same paths:

```
grep -rnE 'SITE_FILE|CV_FILE|PAPERS_FILE|INDUSTRY_FILE|titleOf\(input|[^b]site\.(cv|sections)' src tests; echo "exit $?"
exit 1
grep -n -w parts src/lib/server/content/audit/website/cv.ts; echo "exit $?"
exit 1
```

Verify 3:

```
patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O105-hub.patch
patching file '.oculus/config.yml'
patching file '.oculus/data/academic/career.yml'
exit 0
patch --dry-run -p1 -d ~/workspace/research-hub/side-projects/theaxec.github.io < .scratch/migration/agents/reviews/O105-website.patch
patching file '_data/website.yml'
patching file '_includes/site/about.html'
patching file '_includes/site/publications.html'
patching file '_industry/README.md'
patching file '_industry/cv_pdf_generator.py'
patching file '_industry/src/coverletter.tex.template'
patching file '_industry/src/cv.tex.template'
patching file '_scripts/src/cv/education.tex.template'
patching file '_scripts/src/cv/experience.tex.template'
patching file '_scripts/src/cv/extracurricular.tex.template'
patching file '_scripts/src/cv/grants.tex.template'
patching file '_scripts/src/cv/honors.tex.template'
patching file '_scripts/src/cv/projects.tex.template'
patching file '_scripts/src/cv/publications.tex.template'
patching file '_scripts/src/cv.tex.template'
exit 0
```

Verify 4, plain `grep -rnE '_data/(data|publications|industry|website)\.yml' src config --exclude=local.yml`:

```
config/defaults/behavior.yml:40:    site: _data/website.yml
config/defaults/behavior.yml:41:    cv: _data/data.yml
config/defaults/behavior.yml:42:    papers: _data/publications.yml
config/defaults/behavior.yml:43:    industry: _data/industry.yml
```

The grep of changed names across `src`, `tests`, `config`, `docs` and `README.md`: `SITE_FILE|CV_FILE|PAPERS_FILE|INDUSTRY_FILE` as in verify 2. `websiteKindShape|textsShape|\bGENERATED\b|GeneratedName|folderOf|\bFILES\b`: every hit is another module's own name of that spelling except `src/lib/data/sources/config/settings/files.ts:208,218,284`, `websiteKindShape`, which stays; `FILES` and `folderOf` of `website.svelte.ts` and `GENERATED`, `GeneratedName` and `textsShape` of `site.ts` have no hit. The refusal words:

```
src/lib/server/machine/runs/website.ts:147:    if (bad !== undefined) return refused('website-bad-path', [bad.key, bad.value]);
src/lib/server/machine/runs/website.ts:152:        return refused('website-site-unreadable', [setting.files.site]);
src/lib/state/sessions/source/website.svelte.ts:89:    'website-bad-path': 'career.website_bad_path',
src/lib/data/model/machine/model-machine.ts:372:    'website-bad-path',
```

The counts:

```
awk '/const HUB_LIST/,/^\];/' src/lib/data/helpers/hub-names.ts | grep -o "key: '[^']*'" | wc -l
      68
docs/data-map.md:83: `.oculus/config.yml` may set these 68 keys and no others
docs/data-map.md:141: website.files.site:       # the website's own file, relative to its folder
docs/data-map.md:297: - Twenty-seven keys of a hub's `config.yml` are read from the primary's alone
docs/data-map.md:298: - Settings writes those twenty-seven keys to the primary's `config.yml`
docs/data-map.md:303: In a workspace with no primary hub, Settings refuses the twenty-seven keys
```

Those five lines are cut after the words that hold the count, since the rest of each is unchanged by the count.

Verify 5, which tests are proofs:

- Proofs of a behaviour the change adds or changes, each failing on the unchanged tree: the 35 listed above. A test edited after that run was checked by reading it. That covers the rename of the local constants `*_FILE` to `*_PATH`, which verify 2 needs, the audit row of case C now asserting the scope `projects/lined`, and the prettier format of `audit.test.ts`.
- Tests of a preserved behaviour, passing on the unchanged tree and after: 'writes the three files while the website's own file at a configured path is missing', rows 'the four shipped paths' and 'a shipped path', 'are none while the setting names no folder', 'the sections come in the rows' order' (its title and assertion on a title changed), and the rows of the two press describes that stand as they were.
- `tests/data/sources/career.test.ts:356`, row 'a profile by its name in the map' with `parts` taken out: run on a scratch copy of the unchanged source with the row as edited: `Tests  1 passed | 27 skipped (28)`, and it passes after.
- Audits, which would still pass with the behaviour taken out: none, judged by reading each test.

Every edit to an existing assertion, before and after, from the diff against the base copy:

| File | Before | After |
| --- | --- | --- |
| `tests/data/hubs/website-files.test.ts` | rule "the sections come in the rows' order, each with the title its first row gives"; `expect((value.journal as { title: string }).title).toBe('Journal papers');` | rule "the sections come in the rows' order"; the title assertion leaves, and the new row 'no section of the CV or the publications holds a title, and the publications hold none at the top' asserts its absence |
| `tests/data/hubs/website-files.test.ts` | `expect((built.files[CV_FILE].awards as { title: string }).title).toBe('Awards');` | gone, for the same reason |
| `tests/data/hubs/website-files.test.ts` | `readSite(parse(SITE))`, `CV_FILE`, `PAPERS_FILE`, `INDUSTRY_FILE` imported from `site.ts` | `readSite(parse(SITE), SITE_PATH)`, local `*_PATH` constants; the rows of `SITE`, `KINDS` lose `title` |
| `tests/routes/sessions/website.test.ts` | block in 'writes none of the three when the writer cannot take one, naming that file': a link file gives `website-unwritable` naming `_data/industry.yml`, `linked.log.listed()` empty, the outside file `kept: 1`, no tmux start | moved to the row 'a file that is a link to a file out of the folder' of the new table, which expects `website-bad-path` naming `website.files.industry`, since case F wants this refusal; nothing written, no approval, the outside file kept |
| `tests/routes/sessions/website.test.ts` | `worldOf(folder = FOLDER, make = true, self = true)`, constants imported from `site.ts` | `worldOf(..., files)` with local `*_PATH` constants |
| `tests/routes/docs/audit.test.ts` | `siteText = 'programs: {}\nsections:\n  publications: Publications\n'`, `readSite(parse(siteText))`, `kinds` rows with `title`, `type Section = { title: string; papers: ... }`, `setting: { folder, cv: '', kinds }` | `siteText = 'programs: {}\n'`, `readSite(parse(siteText), paths.site)`, rows without `title`, `Section` without `title`, `setting` with `files` |
| `tests/routes/docs/audit.test.ts` | `said('audit.msg_site_differs_whole', CV_FILE)` | `said('audit.msg_site_differs_whole', CV_PATH)`, the same value |
| `tests/data/sources/career.test.ts:356` | `rows: { shared: { location: 'Enschede', parts: ['a'] } },` | `rows: { shared: { location: 'Enschede' } },` |
| `tests/server/root/watch/website-watch.test.ts` | the literal paths | the same paths, through `website.files` in the shipped shape |

Verify 6. New list items and sentences were read against the spec. Places that depart, with why:

- The head comment of `src/lib/server/machine/runs/website.ts` is one long sentence listing the refusals; it was that shape and the list is one thing, so the step added a clause and rewrapped it.
- The help lines of the four keys in `config/options/behavior.yml` repeat one sentence on bad paths, since a Settings row is read alone.
- The Doc text below keeps the long form of the guarded entries.

History words in added comments and test titles, `grep -i -w -E 'before|used to|no longer|still|always|previously|now|anymore|earlier|old|former|legacy|was|were|again|new'` over the added lines. Every hit is plain present-tense use:

| Hit | Judged |
| --- | --- |
| `model-machine.ts` "last run still running"; `website.ts` "still runs", "writer still refuses"; `website.test.ts` head "still runs" | a state now, unchanged words rewrapped |
| `files.ts` "printed before and after the venue" | place in a line |
| `website.ts` "refused before the website's own file is read", "before the first is written"; `website.svelte.ts` "refused before it is sent"; `website-store.test.ts:3,100`; titles 'stops before the first write ...', '... before an approval is asked'; `website.test.ts` head "after the first was written" | order of steps in a press |
| `audited.ts` "finds nothing new" | words of the existing sentence |
| `website.svelte.ts` "presses again"; `website-files.test.ts` head "again from the same input" | a repeat of an action, existing sentences rewrapped |

`sh utils/unused-exports.sh` against the base file, exit 0. The base run stopped at knip for want of `.svelte-kit`; the after run did not. No line is added:

```
1,2d0
< ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)
< ERROR: Please fix or visit https://knip.dev/reference/known-issues
340d337
< knip stopped with status 2
```

Character-set check, `LC_ALL=C grep -n '[^ -~]'` over the 37 changed files with the `.svg` files left out, run before this report was written:

```
34
grep exit 0
```

All 34 hits are the header lines of the two patches, which `diff -ruN` writes with a `<tab>` before each date, for example `.scratch/migration/agents/reviews/O105-hub.patch:2:--- a/.oculus/config.yml<tab>2026-10-31 00:14:48`. Over every other changed file there is no hit. The patches' dates are the output of the one redirect the brief builds, and `patch` needs nothing else from them.

## Terms

There is no `docs/glossary.md`, so no term is added.

## Files with line counts

From `wc -l` and `git status --short`. The list against the base copy (`diff -rq` of `src`, `tests`, `config`, `docs`, `utils`) names the same files, and nothing in `utils`.

| File | Lines |
| --- | --- |
| `src/lib/data/helpers/hub-names.ts` | 848 |
| `src/lib/data/model/machine/model-machine.ts` | 845 |
| `src/lib/data/model/model-entities.ts` | 807 |
| `src/lib/data/sources/config/settings/files.ts` | 298 |
| `src/lib/server/content/audit/publications.ts` | 137 |
| `src/lib/server/content/audit/website/cv.ts` | 431 |
| `src/lib/server/content/audit/website/files.ts` | 134 |
| `src/lib/server/content/audit/website/papers.ts` | 178 |
| `src/lib/server/content/audit/website/site.ts` | 134 |
| `src/lib/server/machine/runs/website.ts` | 235 |
| `src/lib/server/root/watch/portfolio/audited.ts` | 102 |
| `src/lib/server/root/watch/portfolio/portfolio.ts` | 819 |
| `src/lib/state/sessions/source/website.svelte.ts` | 226 |
| `src/lib/views/academic/career/Career.svelte` | 206 |
| `config/defaults/behavior.yml` | 955 |
| `config/options/behavior.yml` | 1624 |
| `config/schemas/manifest-schema.yml` | 134 |
| `config/text/views/academic/career.yml` | 42 |
| `config/text/views/system/audit.yml` | 83 |
| `docs/HELP.md` | 604 |
| `docs/data-map.md` | 307 |
| `docs/templates.md` | 1906 |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-server.dot`, `layer-server.svg`, `layer-state.dot`, `layer-state.svg` | written by `npm run diagrams`, 2 changed lines of each file by `git diff --stat`, a label count such as 534 to 536 |
| `tests/data/hubs/website-files.test.ts` | 695 |
| `tests/data/sources/career.test.ts` | 412 |
| `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml` | 175 |
| `tests/routes/docs/audit.test.ts` | 699 |
| `tests/routes/sessions/website.test.ts` | 428 |
| `tests/server/root/watch/website-watch.test.ts` | 139 |
| `tests/state/sessions/source/website-store.test.ts` (new) | 109 |
| `.scratch/migration/agents/reviews/O105-hub.patch` (new) | 53 |
| `.scratch/migration/agents/reviews/O105-website.patch` (new) | 318 |

`tests/state/sessions/source/` holds 7 items and `src/lib/server/content/audit/website/` 4. `src/routes/api/(sessions)/website/+server.ts` and `src/lib/state/system/config/` did not need a change.

## Judgment calls the brief left open

Each is a decision the orchestrator may reverse.

1. `below` of `core/paths.ts` in place of the brief's `inside`, so a path naming the website's folder itself is bad.
2. A link that leads nowhere is a bad path, since nothing tells where a write through it would land.
3. On a case-folding file system the check compares paths with their case folded, so `_data/Data.yml` and `_data/data.yml` are one file.
4. Both keys of a shared file are bad; the press and the finding name the first in the key order site, cv, papers, industry.
5. Each value is trimmed by `websiteSettings`, as `website.folder` and `website.cv` are.
6. The four rows carry `empty: true`, so an empty value reaches the check and gives case N in place of the option reader's default.
7. The refusal word is `website-bad-path`, and the finding's key is `audit.msg_site_bad_path`.
8. A group description for `website.files` is added to the options file, beside the rows.
9. The store reads `websiteSettings` with a try and catch in place of `folderOf`, since the configuration may not be there yet.
10. The unsaved guard folds the joined path with `foldedPath`, so a path with a dot segment finds its tab.
11. The website's `_includes/site/about.html` assigns `seckey` from `coll[0]`, because Liquid 4.0.4, which the website's bundle holds, does not read a nested `sections[coll[0]]`.
12. `README.md` lines 10-12 of the website are left, as nothing there becomes false; `_industry/README.md` and the template head comments are corrected.
13. `website.cv` stays as it is in the hub patch, as the hub uses the shipped paths.
14. The local constants of the test files are named `*_PATH`, so check 2 prints nothing while the tests keep a name for a path.
15. The store test lives at `tests/state/sessions/source/website-store.test.ts`, beside the store's folder name.
16. A case-run program was used for cases A and H. The brief says no script without an approval quoted from `plan.md`; the spec's line 65 allows a case-run program of this kind, and "Any other script" there is what needs the approval. I read the spec's line as the one that governs; the orchestrator may read it otherwise, and the program is quoted above.

## Host- and user-visible changes, for the look

| View | State to put it in | Before | After |
| --- | --- | --- | --- |
| Settings, Website section | open it | rows folder, cv, kinds, whose field list holds `title` | also four text rows `website.files.site`, `.cv`, `.papers`, `.industry`, with help lines; the kinds editor has no `title`; the help of `website.folder` names the keys |
| Career, button Write the website | hover it with a folder set | the tip names `_data/data.yml`, `_data/publications.yml`, `_data/industry.yml` | the tip names the three paths the settings give, and the command in `website.cv` |
| Career, button Write the website | set `website.files.cv: ../outside.yml`, press | the press writes | the line under the button says the sentence `career.website_bad_path`, naming the key and its value; no approval is asked |
| Audit, publications section | the same setting | no finding of this kind | one finding naming the key, with no file link, and no comparison of the website's files |
| Audit, publications section | after landing | the website's files compared with titles | compared without titles; a changed title in `website.yml` raises nothing |
| Website pages and CV PDFs | after both patches and the press | headings from `data.yml` and `publications.yml` | the same words from `website.yml` (cases I and J) |

Landing order matters: the website patch goes in with the press. If the press ran on a website without the patch, `about.html` and the CV would find no titles and the headings would be blank. The brief's decision 1 has the orchestrator do both.

Sharp edges:

- `cv.footer` stays in `website.yml` with no reader, as the brief's decision 3 says.
- Until the press at landing, `data.yml`, `publications.yml` and `industry.yml` on the website's disk hold the titles, so by reading `publications.ts` the audit reports each as differing. This was not run on the real hub.
- A `title` left in a `website.kinds` row, or `parts` left in a career file, is dropped with no finding (case H block). The brief asks for no finding.

## Anything in the brief that was wrong or impossible

- `git grep` in checks 2 and 4 is outside the three git commands the spec allows. Plain `grep` stood in, with `--exclude=local.yml`.
- The brief's item 1 says `about.html` takes `site.data.website.sections[<key>]`; with `coll[0]` as the key Liquid 4.0.4 prints nothing, so the patch assigns the key first (judgment call 11).
- `docs/diagrams/*` are outside "Paths this step writes" and the list's own `npm run diagrams` writes them.
- "A path is bad when ... its real path lies outside" is met with `below`, not `inside` (judgment call 1).

## Doc text

For `agents/guarded.md`. The orchestrator applies these at landing.

### G125

Current, line 189:

```
189:- G125. The audit holds a hub to the conventions its own `audit:` setting names, and to none it does not name: a file a `required_files` row requires when every key the row names holds (the stage, the folder in the project, the hub folders), a heading a `required_sections` row requires when the manifest key it names holds a value, and a hub project at a stage a `stage_folders` row names kept under one of its folders; a project of a tier `research_audit.skip_tiers` names is held to none, a project of a workspace repository to no row naming hub folders, a hub without `audit:` gets none of these findings, and a part of `audit:` that is not of its shape is a finding and is off while the rest runs. For the primary hub whose `website.folder` names a folder, the audit builds the website's three generated files in memory and compares each with the file on disk by parsed value, the order of the sections, of the entries and of a links list counted and the order of the keys inside an entry not: a file that differs is one finding naming the file and the first place it differs at, offering Write the website; a folder that is not there is one finding naming it, an empty `website.folder` gives none, a user who is not known is one finding and no file is compared, and a change on disk to any of the three raises or clears its finding without a restart.
```

Replacement:

```
- G125. The audit holds a hub to the conventions its own `audit:` setting names, and to none it does not name: a file a `required_files` row requires when every key the row names holds (the stage, the folder in the project, the hub folders), a heading a `required_sections` row requires when the manifest key it names holds a value, and a hub project at a stage a `stage_folders` row names kept under one of its folders; a project of a tier `research_audit.skip_tiers` names is held to none, a project of a workspace repository to no row naming hub folders, a hub without `audit:` gets none of these findings, and a part of `audit:` that is not of its shape is a finding and is off while the rest runs. For the primary hub whose `website.folder` names a folder, the audit builds the website's three generated files in memory and compares each with the file on disk at the path `website.files` gives, by parsed value, the order of the sections, of the entries and of a links list counted and the order of the keys inside an entry not: a file that differs is one finding naming the file and the first place it differs at, offering Write the website; a title or a `cv:` value of the website's own file raises nothing; a folder that is not there is one finding naming it, an empty `website.folder` gives none, a user who is not known is one finding and no file is compared, a path of `website.files` that is empty, absolute, comes to no place under the website's folder or names the file of another key is one finding naming the key and its value with none of the four files read, the watch list leaves such a path out, and a change on disk to any of the three raises or clears its finding without a restart.
```

Current, line 190:

```
190:  Code: `src/lib/server/content/audit/rules.ts`, `projects.ts`, `publications.ts`, `website/`, the reader of `audit:` in that folder, and `src/lib/server/root/watch/portfolio/audited.ts` (the three files watched).
```

Replacement:

```
  Code: `src/lib/server/content/audit/rules.ts`, `projects.ts`, `publications.ts`, `website/`, the reader of `audit:` in that folder, and `src/lib/server/root/watch/portfolio/audited.ts` (the files watched).
```

Current, line 191:

```
191:  Test: `tests/routes/docs/audit.test.ts`, every row of the describes 'the required files of the audit', 'the required sections of the audit', 'the website of the audit', 'the stage folders of the audit' and 'the shape of the audit setting'; `tests/server/root/watch/website-watch.test.ts`, 'publishes the audit again for a change on disk to each of the three generated files'.
```

Replacement:

```
  Test: `tests/routes/docs/audit.test.ts`, every row of the describes 'the required files of the audit', 'the required sections of the audit', 'the website of the audit' (among them 'raise nothing about a title or a CV value of the website's own file', 'compare the file website.files names, and leave the shipped path alone', 'name the configured path of the website's own file for a research line its programs: lacks' and every row of 'give one finding naming the key of a path that cannot be used and read no file'), 'the stage folders of the audit' and 'the shape of the audit setting'; `tests/data/hubs/website-files.test.ts`, every row of the describe 'the files the audit reads and the watcher hears'; `tests/server/root/watch/website-watch.test.ts`, 'publishes the audit again for a change on disk to each of the three generated files'.
```

### G139

Current, line 225:

```
225:- G139. The website's three data files are what the hub's files give: a manifest that carries `publication:` is an entry of the section of the first `website.kinds` row whose stages and forms hold its own, the sections in the rows' order under the first row's title and the entries by the record's `rank`; `order` is `first`, `senior` or `coauthor` from your place in `lead`, `supervisors` or `collaborators`; `pub_pre` and `pub_post` are the row's; the `Code` link, last in `links`, is `https://doi.org/<doi>` when `zenodo_status` is `deposited` and `doi` is not empty; under `status: deposited` it is `https://doi.org/<doi>` when `doi` is not empty and `zenodo_status` is not `review-anon`, else `code_availability.url`; else none; a DOI under `zenodo_status: review-anon` is never linked; `hide` is written through, true and false alike; a manifest at a stage that gives no section, or with `negative` or `dead_end`, and a paper that names you in none of the three fields under a row with `order` are each a finding and give no entry; a research line `website.yml`'s `programs:` lacks is a finding and the entry is still written; an award's day is written unquoted; the CV's sections and the employer CVs are written from the people, career, collection and manifest records that name them, the rows of a section by their rank and rows of one rank in the order they are read (the collections' entries, then the manifests, then the career file's references, positions, degrees and awards); the person blocks take `first-name` from the user's people entry's `name` with the space and its `family` taken off and `last-name` from `family`, and a user's entry with no `family`, or whose `name` does not end with a space and its `family`, is a finding and the blocks carry no names; a CV row naming no person gives no row and a finding; a profile or award row naming no record keeps the row and is a finding; a profile or award row naming a key two records hold (a collection entry's key, a manifest's folder name, a career row's `key`) is a finding naming the key, both places and the row, and the row takes nothing from either; a career row whose `key` is the empty text is a finding naming the row.
```

Replacement:

```
- G139. The website's three data files, at the paths `website.files` gives, the shipped four read through the merged defaults where a hub sets none and one key alone leaving the others shipped, are what the hub's files give and nothing of the website's own file: no section and no top level holds a title, and the person blocks hold the names and the links; a manifest that carries `publication:` is an entry of the section of the first `website.kinds` row whose stages and forms hold its own, the sections in the rows' order and the entries by the record's `rank`; `order` is `first`, `senior` or `coauthor` from your place in `lead`, `supervisors` or `collaborators`; `pub_pre` and `pub_post` are the row's; the `Code` link, last in `links`, is `https://doi.org/<doi>` when `zenodo_status` is `deposited` and `doi` is not empty; under `status: deposited` it is `https://doi.org/<doi>` when `doi` is not empty and `zenodo_status` is not `review-anon`, else `code_availability.url`; else none; a DOI under `zenodo_status: review-anon` is never linked; `hide` is written through, true and false alike; a manifest at a stage that gives no section, or with `negative` or `dead_end`, and a paper that names you in none of the three fields under a row with `order` are each a finding and give no entry; a research line `programs:` of the file `website.files.site` names lacks is a finding and the entry is still written; an award's day is written unquoted; the CV's sections and the employer CVs are written from the people, career, collection and manifest records that name them, the rows of a section by their rank and rows of one rank in the order they are read (the collections' entries, then the manifests, then the career file's references, positions, degrees and awards); the person blocks take `first-name` from the user's people entry's `name` with the space and its `family` taken off and `last-name` from `family`, and a user's entry with no `family`, or whose `name` does not end with a space and its `family`, is a finding and the blocks carry no names; a CV row naming no person gives no row and a finding; a profile or award row naming no record keeps the row and is a finding; a profile or award row naming a key two records hold (a collection entry's key, a manifest's folder name, a career row's `key`) is a finding naming the key, both places and the row, and the row takes nothing from either; a career row whose `key` is the empty text is a finding naming the row.
```

Current, line 226:

```
226:  Code: `src/lib/server/content/audit/website/` (`files.ts`, `papers.ts`, `cv.ts`, `site.ts`); `src/lib/data/snapshot/normalise-parts/publication.ts`.
```

Replacement:

```
  Code: `src/lib/server/content/audit/website/` (`files.ts`, `papers.ts`, `cv.ts`, `site.ts`); `src/lib/data/snapshot/normalise-parts/publication.ts`; `src/lib/data/sources/config/settings/files.ts`.
```

Current, line 227:

```
227:  Test: `tests/data/hubs/website-files.test.ts`, describe 'the website files the hub gives', every row but the three rows of the person blocks' names, which are G32's.
```

Replacement:

```
  Test: `tests/data/hubs/website-files.test.ts`, describe 'the website files the hub gives', every row but the three rows of the person blocks' names, which are G32's, among them 'no section of the CV or the publications holds a title, and the publications hold none at the top', 'both person blocks hold the names and the links and nothing of the website file', 'a title or a CV value of the website's own file changes none of the three files', 'the files are named by the paths of website.files, in the order a write takes them', 'a hub that sets no website.files reads the four shipped paths, from the merged shipped defaults' and 'a hub that sets one key of website.files reads it, and the shipped value of the others'.
```

### G140

Current, line 228:

```
228:- G140. Write the website writes the three files through the Files view's writer, one History record each that its Undo takes back, then runs `website.cv` in the website's folder as a task terminal of the Processes view after the approval a project command takes, the command named in the button's tip; a press is refused with nothing written while the user is not known, while `website.folder` is empty or names a folder that is not there, while the command's last run still runs, and when the writer cannot take one of the three files, which the refusal names, the files already written being put back.
```

Replacement:

```
- G140. Write the website writes the three files at the paths `website.files` gives through the Files view's writer, one History record each that its Undo takes back, then runs `website.cv` in the website's folder as a task terminal of the Processes view after the approval a project command takes, the three paths and the command named in the button's tip; a website's own file that is missing is no refusal, and one that is not YAML is refused naming its path; a press over one of the three paths a source tab holds unsaved text of stops before it is sent; a press is refused with nothing written while the user is not known, while `website.folder` is empty or names a folder that is not there, while a path of `website.files` is empty, absolute, comes to no place under the website's folder or names the file of another key, which the refusal `website-bad-path` names by its key and value before the website's own file is read and before an approval is asked, while the command's last run still runs, and when the writer cannot take one of the three files, which the refusal names, the files already written being put back.
```

Current, line 229:

```
229:  Code: `src/lib/server/machine/runs/website.ts`, `src/routes/api/(sessions)/website/+server.ts`, `src/lib/state/sessions/source/website.svelte.ts`, `src/lib/views/academic/career/Career.svelte`.
```

Replacement:

```
  Code: `src/lib/server/machine/runs/website.ts`, `src/routes/api/(sessions)/website/+server.ts`, `src/lib/server/content/audit/website/site.ts` (`badPaths`), `src/lib/state/sessions/source/website.svelte.ts`, `src/lib/views/academic/career/Career.svelte`.
```

Current, line 230:

```
230:  Test: `tests/routes/sessions/website.test.ts`, every row of the describes 'a press of Write the website that is refused' and 'a press of Write the website that is taken'.
```

Replacement:

```
  Test: `tests/routes/sessions/website.test.ts`, every row of the describes 'a press of Write the website that is refused' and 'a press of Write the website that is taken', among them 'stops before the first write when a path of website.files names a folder that is not there', every row of 'names the key of a path of website.files that cannot be used, asks no approval and writes nothing', 'names the configured path of a website's own file that is not YAML, before an approval is asked', 'writes the file website.files names and not the shipped one' and 'writes the three files while the website's own file at a configured path is missing'; `tests/state/sessions/source/website-store.test.ts`, every row of the describes 'the tip of Write the website' and 'a press over a file a source tab holds unsaved text of'.
```
