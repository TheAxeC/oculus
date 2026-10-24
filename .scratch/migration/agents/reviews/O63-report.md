Everything in the brief and in repair round 1 is done; no item is handed back.

# O63 report: the audit's hub conventions become one hub setting `audit:` (state after repair round 1)

## Open items of the state file, verbatim

The section "Open items" of `.scratch/migration/orchestrator-state.md` in the worktree (read with `sed -n 173,178p`) holds its heading and its standing sentence and no entry:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## Repair round 1, item by item

| Item | State | Check |
| --- | --- | --- |
| 1. A skipped-tier project claims the feed paper it matches; a test row over every finding of the hub | DONE | new row in 'the website of the audit', run on the base replica and the changed tree, quoted below |
| 2. The dead-end text names the stages a publication takes | DONE | case-run r2, quoted below |
| 3. The head comments describe the audit as it now is | DONE | the round's grep, below |
| 4. Each edited comment paragraph wrapped as a whole | DONE | the paragraph list under "Verify 7" |
| 5. `noSetting` not exported | DONE | verify 4 shows no added line |
| 6. The fold of a block's flags exists once | DONE | `grep -rn "flagSources(" src`, below |
| 7. The audit's file watches follow the setting | DONE | case-runs r7a and r7b, quoted below |
| 8. A `required_sections` row reads a workspace repository project's own manifest | DONE, no fix needed | case-run r8, quoted below |
| 9. The report quotes the end state | DONE | this report |

### Item 1

The claim stays as built (`src/lib/server/content/audit/publications.ts`, the `isPersonal` branch of the first loop over the projects): a project of a tier `research_audit.skip_tiers` names matches the feed at the loose threshold, adds the paper to `claimed`, and gets no finding. The new row of `tests/routes/docs/audit.test.ts`, describe 'the website of the audit':

```ts
    it('count the paper only a project of the tier personal matches as matched, and give no finding of any scope', () => {
        const personal = projectAt('projects/paper', {
            stage: 'published',
            form: 'journal',
            tier: 'personal',
            lead: ['hub:someone']
        });
        const found = findingsOf(hubOf(website, { 'site/pubs.yml': feedOf('journal') }), [personal]);
        expect(found).toEqual([]);
    });
```

The assertion is over every finding of the hub. The project names a lead, since a project with none gets the placement finding `msg_no_lead` of every tier, which is not part of this row.

- On the base replica (the scratch copy of the unchanged tree with the new test file copied in), `npx vitest run tests/routes/docs/audit.test.ts tests/state/boards/board/board-rules.test.ts`: the row fails with `TypeError: hubAuditSetting is not a function` at `tests/routes/docs/audit.test.ts:419:23`, as every row of the file does there (`Tests 27 failed (27)` for the file).
- On the changed tree, `npx vitest run tests/routes/docs/audit.test.ts`: `Tests 27 passed (27)`.

### Item 2

`msg_site_deadend` now reads `'the stage {0} marks a dead end, but the website shows it under {1}: give it one of the stages {2} if it is a publication, else take it off the website (or mute if intentional)'`. `{2}` is the labels of the stages carrying the flag `public`, in the vocabulary's order, each in double quotes, joined by `, ` (`const published` before the dead-end loop of `publications.ts`). The signature still reads the stage word and the sections, so a mute holds. Case-run r2 (`<scratchpad>/caserun/caserun3.ts r2` on the changed tree) prints:

```
r2 a project at the dead-end stage stopped, shown on the feed:
  projects/x | the stage stopped (dropped or abandoned) marks a dead end, but the website shows it under ['journal']: give it one of the stages "in preparation", "submit-ready", "submitted / under review", "major revision (back with the authors)", "published" if it is a publication, else take it off the website (or mute if intentional)
```

### Item 3

`src/lib/views/system/audit/Audit.svelte:19-27` and the doc comment of `AuditKind` (`src/lib/data/model/index.ts:356-364`) now name each section by what it holds: `data` a manifest field, a gap in a collection's entries or a heading a `required_sections` row asks for; `conform` a file a `required_files` row asks for or a part of `audit:` not of its shape; `manifest` the lead, board and chip-lane checks and a project outside its `stage_folders`; `publink` the hub's own website feed, which `audit.website` names. `publications.ts:79` said "the public website" and now says "the website's feed".

`grep -rniE "research standard|folder the|retired doc|tier conformance|folders off the standard" src docs --exclude=local.yml` prints 158 lines. None holds "research standard", "retired doc", "tier conformance" or "folders off the standard" (`grep -ciE` over the output: 0). Every line is a hit of "folder the", each "the folder that ..." in another sense (`The folder the app goes to when no --out is given`, `a folder the reader picked`, `the folder the adapter runs in` and the like); none names the audit's folder check. The output, as printed, is quoted under "The round's grep outputs".

### Item 4

`src/lib/state/system/config/editors/fields.ts:7-13` and `src/lib/state/system/config/editors/draft.ts:11-16` are rewrapped as whole paragraphs. Every comment paragraph the step adds or changes was read for a line ending short inside a sentence; the list is under "Verify 7".

### Item 5

`noSetting` (`src/lib/server/content/audit/setting.ts:55`) is local. `tests/state/boards/board/board-rules.test.ts:387-388` gets the empty setting from the reader:

```ts
            // `/hub` holds no settings file, so its setting names none of the checks.
            setting: hubAuditSetting('/hub'),
```

with `import { hubAuditSetting } from '../../../../src/lib/server/content/audit/setting.ts';` at `:45`. The unused-exports comparison shows no added line (verify 4).

### Item 6

The helper is `blockFlags(spec, items)` in `src/lib/data/sources/config/catalog/options.ts:148-162`, beside `flagSources`, which it folds over: that file reads `FLAG_SOURCES` and is imported by all three callers already, so it is the one module the data layer, the schema and the server's write share without a new import edge. The three call it:

- `flaggedItems` (`options.ts`): `return blockFlags(spec, (source) => configItems(source, config));`
- `blockSchema` (`src/lib/data/sources/config/catalog/schemas/options.ts:118`): `const flags = blockFlags(spec, (source) => lists.items(source));`
- `listsFor` (`src/lib/server/edit/writes/config/config-fit.ts:196`): `flagged: blockFlags(spec, (source) => sources.items(source)),`

`grep -rn "flagSources(" src`:

```
src/lib/state/system/config/editors/fields.ts:340:    return poolOf({ ...spec, options: [], from: flagSources(spec) }, {}, lists);
src/lib/data/sources/config/catalog/value-rule.ts:181:        : { kind: 'flag', sources: flagSources(spec) };
src/lib/data/sources/config/catalog/options.ts:141:export function flagSources(spec: Pick<FieldSpec, 'from'>): Source[] {
src/lib/data/sources/config/catalog/options.ts:157:    for (const source of flagSources(spec)) {
src/lib/data/sources/config/catalog/schemas/options.ts:124:    const flagged = flagSources(spec).length === 0 ? { type: 'array', maxItems: 0 } : listOf(flags);
```

The remaining calls take the list of flag sources itself: the helper's own loop, the schema's test for a list with no flags, the pool of the field's flag picks, and the sources a `flag` problem names.

### Item 7

`src/lib/server/root/watch/portfolio/portfolio.ts`: `watchAuditFiles(files)` opens the watches of every file `auditFiles` gives at this rebuild and closes each handle an earlier rebuild opened for a file no longer given (`auditKeys`, the keys opened at the last rebuild; `closeHandle`). For each file:

- its watch through its folder (`audit:<file>`), and a flat watch on the folder above its folder filtered on the folder's name (`audit-folder:<folder>`), so the folder removed or made again queues a rebuild;
- each of the two is opened through `openOn`, which records the inode of the folder the handle watches and closes the handle first when that folder has gone or carries another inode, so a folder made again at the same path is watched again;
- while the folder is not there, the file is waited for through its nearest folder that is (`openParent`), and that `parent:` key is the audit's until the folder is there.

A `parent:` handle another role shares is opened again by that role later in the same rebuild, since `watchAuditFiles` runs before `watchHubFolders` and `openRootFolder`. Case-runs r7a and r7b (`caserun3.ts r7a r7b` on the changed tree) print:

```
r7a the feed renamed in audit.website.file:
  the old feed site/pubs.yml edited while named: rebuilt
  audit.website.file changed to other/pubs.yml: rebuilt
  the old feed site/pubs.yml edited: NO REBUILD within 4 s
  the new feed other/pubs.yml edited: rebuilt
r7b the feed folder removed and made again:
  the feed folder site/data removed: rebuilt
  the feed folder made again with the feed: rebuilt
  the feed edited: rebuilt
    website findings: on the website under ['thesis'] but hub stage `published` expects ['journal']: wrong section?
  the feed edited again: rebuilt
    website findings: (none)
  the folder site renamed away and back: NO REBUILD within 4 s
  the feed edited after the rename: rebuilt
```

In r7a the edit of the old feed after the rename gives no rebuild (its handle is closed) and the edit of the new one rebuilds. In r7b the feed's folder removed, made again and the feed then edited each rebuild, and the findings follow the feed. The rename of `site` away and back gives no rebuild; by my reading of `openAuditFile` (not measured further) the cause is that the audit's flat watch is on the folder above `site/data`, which is `site` itself, and `site` keeps its inode through the rename; the feed's edit after it still rebuilds.

### Item 8

`caserun3.ts r8` on the changed tree, a workspace repository whose `.oculus/project.yml` holds `datasets: [d1]` and no `README.md`, with `required_sections: [{ file: README.md, heading: "## Data", key: datasets }]` in the primary hub:

```
r8 required_sections over a workspace repository project:
  repo | README.md | has a value at `datasets` but README.md has no heading `## Data`
```

One finding naming `datasets`, `README.md` and `## Data`, scope `repo`: `manifestValue` reads the repository project's manifest from its own folder, so no fix was needed.

### Item 9

Verify 4 below is quoted from the run after the last change; verify 7 states the reading of item 4; every changed line of `tests/checks/config/config-folder.test.ts` is listed under "Verify 6: tests on the base replica and the changed tree".

## The cases' first run

The unchanged tree is a scratch copy of `.agents/worktrees/O63-base` (its `config`, `src`, `tests`, `utils`), with the worktree's `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.npmrc`, `.svelte-kit`, `assets`, `docs` and `README.md` beside them and `node_modules` linked to the worktree's, at `<scratchpad>/basetree` (the base copy has no `node_modules` and is not written to). `<scratchpad>` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`.

```
cd <scratchpad>/basetree && TREE=<scratchpad>/basetree node <scratchpad>/caserun/caserun.ts    # cases 1-12, 15-17, unchanged tree
cd <worktree> && TREE=<worktree> node <scratchpad>/caserun/caserun.ts                          # the same, changed tree
cd <scratchpad>/basetree && TREE=<scratchpad>/basetree node <scratchpad>/caserun/caserun2.ts   # cases 13, 14, 18, 19, unchanged tree
cd <worktree> && TREE=<worktree> node <scratchpad>/caserun/caserun2.ts                         # the same, changed tree
```

The programs plant each case's hubs in a temporary folder, open a workspace on them, run `watchPortfolio`'s first build (case 19: its rebuilds) and print the audit findings and the config findings of the hubs' files; `caserun2.ts` also reads the Settings rows and drafts and the editor's schema. Their full text is quoted at the end. On the unchanged tree the hub file's `audit:` gives the config finding "key audit is not one the hub's settings file takes" in every case that sets one. The runs below, on both trees, are from after this round's last change, and print the same lines as the runs the first build's report quoted.

- 1. Unchanged: two `conform` findings for `projects/ideas/a`, "missing: the one private doc every project needs" and "code/ has no README.md (the deposit root)". Changed: nothing. Met.
- 2a. Unchanged: one README finding for `nascent-no-readme` (the `standard` flag). Changed: one finding "missing README.md, a file the hub requires" for `nascent-no-readme`; none for the project at `published` or the one holding a README. Met.
- 2b. Unchanged: nothing. Changed: one `NOTES.md` finding for `exploring-x`, none for `nascent`. Met.
- 2c. Unchanged: nothing. Changed: one `LICENSE` finding for each of the two projects. Met.
- 2d. Unchanged: the code README finding for `live-code` and `nascent-code`. Changed: one `code/README.md` finding for `live-code` only. Met.
- 3. Unchanged: code README findings for `projects/active/with-code` and `repo`. Changed: the same two, worded "missing code/README.md, a file the hub requires", the repository's with the scope `repo`. Met.
- 4. Unchanged: README findings for `projects/coauthor/y`, `projects/manuscripts/x` and `repo`. Changed: one, for `projects/manuscripts/x`. Met.
- 5a. Unchanged: nothing. Changed: a `data` finding naming `datasets`, `README.md` and `## Data` for `no-match`, `database` (`## Database`) and `data-notes` (`### Data notes`); none for `## Data`, `## Data + reproduction`, `datasets: []` or no `datasets`. Met.
- 5b. Changed: findings for `deposited`, `text-key`, `number` (3) and `true`; none for `{ status: "" }`, `false` or a map. Met. 5c. Nothing on both trees. Met.
- 6. Unchanged: a README finding for `projects/manuscripts/x6`. Changed: one `data` finding for `x6`, none for the project under `projects/coauthor/published/2025/`. Met.
- 7a-7e. Unchanged: nothing. Changed: 7a nothing; 7b the wrong-section finding with `['thesis']` and `['journal', 'other-publications']`; 7c (`list: items`, `title: name`) nothing; 7d as 7b; 7e the finding with `['journal']` and `['articles']`. Met.
- 8a. Nothing on both trees. 8b. Changed: one finding "could not parse site/pubs.yml: ...", `where` `site/pubs.yml`. Met.
- 9a, 9b. Changed: each hub's projects are checked against its own feed, the second hub included. Met.
- 10a, 10b. Changed: in both spellings of the folder, findings for `projects/active/x1` and `projects/archive/published-old/x4`; none for the projects under `projects/archive/published/` or `projects/coauthor/published/2025/`, the `submitted` project or the repository's project. Met.
- 11. Nothing of any check on both trees. Met.
- 12. Unchanged: "retired doc: fold it into README.md" for `IDEA.md` and "non-canonical folder: rename to manuscript/" for `paper/`. Changed: nothing. Met.
- 13a. Changed: `hub_key_unknown` for `publications_file` (unchanged: nothing). 13b. Changed: `shape_unknown` for `stages.exploring.standard` (unchanged: nothing). 13c. Unchanged: "audit is not an option"; changed: `settings_hub_key` for `audit.required_files`. Met.
- 14. Unchanged: 0 findings, `publication_kinds` present, nine stages carrying `standard`. Changed: 0 findings, `publication_kinds` absent, no stage carrying `standard`. Met.
- 15a, 15b, 15c. Changed: on the primary, a second hub and a workspace with no primary, seven shape findings naming `.oculus/config.yml` and `audit.required_files.0.file`, `audit.required_sections`, `audit.website.list`, `audit.website.title`, `audit.website.kinds`, `audit.stage_folders.0.folders` and `audit.colour`, and the README finding of the well-formed row; the config channel also gives `hub_key_unknown` for `audit.colour` (judgment call 1). Met.
- 16. Changed: one shape finding for `audit.website.kinds`, no website finding. Met.
- 17. Changed: one README finding for `projects/active/nostage` (unchanged: nothing). Met.
- 18. Unchanged: three rows in "Audit checks"; `audit` undeclared in the schema. Changed: ten rows, the hub's values shown for the two it sets; `stages` fields with the control `words`; the draft read back after adding `words: [exploring]` is `{"ok":true,...}`; the schema underlines `audit.required_files[0].stages.word` and accepts the hub rewrite's value. Met.
- 19. Unchanged: only the README removal rebuilds. Changed: all four events rebuild and the findings change as the case says. Met.

No case of the first run showed one of the brief's rules wrong.

### Cases 1-12, 15-17, unchanged tree, as printed

```
1:
  audit hub conform scope=projects/ideas/a where=code/ file=: code/ has no README.md (the deposit root)
  audit hub conform scope=projects/ideas/a where=README.md file=: missing: the one private doc every project needs
2a README not_flags terminal:
  audit hub conform scope=projects/ideas/nascent-no-readme where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
2b NOTES words exploring:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
2c LICENSE every project:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
2d code/README.md live with code:
  audit hub conform scope=projects/active/live-code where=code/ file=: code/ has no README.md (the deposit root)
  audit hub conform scope=projects/ideas/nascent-code where=code/ file=: code/ has no README.md (the deposit root)
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
3:
  audit hub conform scope=projects/active/with-code where=code/ file=: code/ has no README.md (the deposit root)
  audit hub conform scope=repo where=code/ file=: code/ has no README.md (the deposit root)
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
4:
  audit hub conform scope=projects/coauthor/y where=README.md file=: missing: the one private doc every project needs
  audit hub conform scope=projects/manuscripts/x where=README.md file=: missing: the one private doc every project needs
  audit hub conform scope=repo where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
5a datasets:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
5b code_availability.status:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
5c unparsed manifest:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
6:
  audit hub conform scope=projects/manuscripts/x6 where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7a journal:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7b thesis:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7c items/name journal:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7d items/name thesis:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7e kinds articles:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
8a missing feed:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
8b unparsable feed:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
9a second hub own feed:
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
9b two hubs one feed each:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
10a:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
10b trailing slash:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
11 personal:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
12:
  audit hub conform scope=projects/active/x where=IDEA.md file=projects/active/x/IDEA.md: retired doc: fold it into README.md
  audit hub conform scope=projects/active/x where=paper/ file=: non-canonical folder: rename to manuscript/
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
15a primary:
  audit hub conform scope=projects/active/x where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
15b second hub:
  audit lab conform scope=projects/active/x where=README.md file=: missing: the one private doc every project needs
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
15c no primary:
  audit lab conform scope=projects/active/x where=README.md file=: missing: the one private doc every project needs
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
16:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
17:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
```

### Cases 1-12, 15-17, changed tree, as printed

```
1: (nothing)
2a README not_flags terminal:
  audit hub conform scope=projects/ideas/nascent-no-readme where=README.md file=: missing README.md, a file the hub requires
2b NOTES words exploring:
  audit hub conform scope=projects/active/exploring-x where=NOTES.md file=: missing NOTES.md, a file the hub requires
2c LICENSE every project:
  audit hub conform scope=projects/active/one where=LICENSE file=: missing LICENSE, a file the hub requires
  audit hub conform scope=projects/archive/two where=LICENSE file=: missing LICENSE, a file the hub requires
2d code/README.md live with code:
  audit hub conform scope=projects/active/live-code where=code/README.md file=: missing code/README.md, a file the hub requires
3:
  audit hub conform scope=projects/active/with-code where=code/README.md file=: missing code/README.md, a file the hub requires
  audit hub conform scope=repo where=code/README.md file=: missing code/README.md, a file the hub requires
4:
  audit hub conform scope=projects/manuscripts/x where=README.md file=: missing README.md, a file the hub requires
5a datasets:
  audit hub data scope=projects/active/data-notes where=README.md file=projects/active/data-notes/README.md: has a value at `datasets` but README.md has no heading `## Data`
  audit hub data scope=projects/active/database where=README.md file=projects/active/database/README.md: has a value at `datasets` but README.md has no heading `## Data`
  audit hub data scope=projects/active/no-match where=README.md file=projects/active/no-match/README.md: has a value at `datasets` but README.md has no heading `## Data`
5b code_availability.status:
  audit hub data scope=projects/active/deposited where=README.md file=projects/active/deposited/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
  audit hub data scope=projects/active/number where=README.md file=projects/active/number/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
  audit hub data scope=projects/active/text-key where=README.md file=projects/active/text-key/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
  audit hub data scope=projects/active/true where=README.md file=projects/active/true/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
5c unparsed manifest: (nothing)
6:
  audit hub data scope=projects/manuscripts/x6 where=README.md file=: has a value at `datasets` but README.md has no heading `## Data`
7a journal: (nothing)
7b thesis:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
7c items/name journal: (nothing)
7d items/name thesis:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
7e kinds articles:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['journal'] but hub stage `published` expects ['articles']: wrong section?
8a missing feed: (nothing)
8b unparsable feed:
  audit hub publink scope=website where=site/pubs.yml file=site/pubs.yml: could not parse site/pubs.yml: Flow sequence in block collection must be sufficiently indented and end with a ] at line 2, column 1:
9a second hub own feed:
  audit lab publink scope=projects/archive/q where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
9b two hubs one feed each:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
  audit lab publink scope=projects/archive/q where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
10a:
  audit hub manifest scope=projects/active/x1 where=stage file=projects/active/x1/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
  audit hub manifest scope=projects/archive/published-old/x4 where=stage file=projects/archive/published-old/x4/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
10b trailing slash:
  audit hub manifest scope=projects/active/x1 where=stage file=projects/active/x1/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
  audit hub manifest scope=projects/archive/published-old/x4 where=stage file=projects/archive/published-old/x4/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
11 personal: (nothing)
12: (nothing)
15a primary:
  audit hub conform scope=.oculus/config.yml where=audit.colour file=.oculus/config.yml: audit.colour in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.required_files.0.file file=.oculus/config.yml: audit.required_files.0.file in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.required_sections file=.oculus/config.yml: audit.required_sections in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.stage_folders.0.folders file=.oculus/config.yml: audit.stage_folders.0.folders in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.website.list file=.oculus/config.yml: audit.website.list in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.website.title file=.oculus/config.yml: audit.website.title in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=projects/active/x where=README.md file=: missing README.md, a file the hub requires
  config <case>/hub/.oculus/config.yml key=audit.colour: key audit.colour is not one the hub's settings file takes; it is not applied
15b second hub:
  audit lab conform scope=.oculus/config.yml where=audit.colour file=.oculus/config.yml: audit.colour in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_files.0.file file=.oculus/config.yml: audit.required_files.0.file in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_sections file=.oculus/config.yml: audit.required_sections in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.stage_folders.0.folders file=.oculus/config.yml: audit.stage_folders.0.folders in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.list file=.oculus/config.yml: audit.website.list in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.title file=.oculus/config.yml: audit.website.title in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=projects/active/x where=README.md file=: missing README.md, a file the hub requires
  config <case>/lab/.oculus/config.yml key=audit.colour: key audit.colour is not one the hub's settings file takes; it is not applied
15c no primary:
  audit lab conform scope=.oculus/config.yml where=audit.colour file=.oculus/config.yml: audit.colour in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_files.0.file file=.oculus/config.yml: audit.required_files.0.file in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_sections file=.oculus/config.yml: audit.required_sections in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.stage_folders.0.folders file=.oculus/config.yml: audit.stage_folders.0.folders in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.list file=.oculus/config.yml: audit.website.list in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.title file=.oculus/config.yml: audit.website.title in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=projects/active/x where=README.md file=: missing README.md, a file the hub requires
  config <case>/lab/.oculus/config.yml key=audit.colour: key audit.colour is not one the hub's settings file takes; it is not applied
16:
  audit hub conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
17:
  audit hub conform scope=projects/active/nostage where=README.md file=: missing README.md, a file the hub requires
```

### Cases 13, 14, 18, 19, unchanged tree, as printed

```
13a hub publications_file:
  (nothing)
13b vocab stage row with standard: true (exploring:    { label: exploring, icon: orange, color: "#f59...):
  (nothing)
13c workspace settings: audit:
  <case>/w.yml key=settings.audit: audit is not an option; it is not applied
14: findings=0 publication_kinds=present stages with standard=[nascent, scoping, de-risking, exploring, in-prep, building, submit-ready, submitted, revision]
18a rows of the section Audit checks: 3
  read_limits control=family own=false value={"status.line":220,"next":300,"latest":200,"eli5":360,"results":300} fields=[key:choice value:number]
  audit_ignore control=parked own=false value=[]
  focus.stale_lag_days control=number own=false value=1
18d schema, stages: { word: [x] }: 
  line 1: key audit is not declared by the schema of this file
18e schema, the hub rewrite value: 
  line 1: key audit is not declared by the schema of this file
19 start: website findings: (none)
19 start: README.md missing for [], code/LICENSE missing for []
  README.md of projects/a removed: rebuilt
    README.md missing for []
  code/LICENSE of projects/b created: NO REBUILD within 6 s
    code/LICENSE missing for []
  feed outside every scan folder edited: NO REBUILD within 6 s
    website findings: (none)
  README.md of the repository removed: NO REBUILD within 6 s
    README.md missing for []
```

### Cases 13, 14, 18, 19, changed tree, as printed

```
13a hub publications_file:
  <case>/.oculus/config.yml key=publications_file: key publications_file is not one the hub's settings file takes; it is not applied
13b vocab stage row with standard: true (exploring:    { label: exploring, icon: orange, color: "#f59...):
  catalogs/vocab.yml key=stages.exploring.standard: key stages.exploring.standard is not a key this file takes
13c workspace settings: audit:
  <case>/w.yml key=settings.audit.required_files: audit.required_files is a key of the hub's settings file, .oculus/config.yml, which a workspace file does not set; it is not applied
14: findings=0 publication_kinds=absent stages with standard=[]
18a rows of the section Audit checks: 10
  read_limits control=family own=false value={"status.line":220,"next":300,"latest":200,"eli5":360,"results":300} fields=[key:choice value:number]
  audit_ignore control=parked own=false value=[]
  audit.required_files control=family own=true value=[{"file":"README.md","stages":{"not_flags":["terminal"]}}] fields=[file:text stages:words folder:text folders:list]
  audit.required_sections control=family own=false value=[] fields=[file:text heading:text key:text folders:list]
  audit.stage_folders control=family own=true value=[{"stages":{"words":["published"]},"folders":["projects/archive"]}] fields=[stages:words folders:list]
  audit.website.file control=file own=false value=""
  audit.website.list control=text own=false value=""
  audit.website.title control=text own=false value=""
  audit.website.kinds control=family own=false value=[] fields=[kind:list stages:multi forms:multi]
  focus.stale_lag_days control=number own=false value=1
18b draft of audit.required_files: [{"file":"README.md","stages":{"not_flags":["terminal"]}}]
18c the draft read back after adding words [exploring]: {"ok":true,"value":[{"file":"README.md","stages":{"not_flags":["terminal"],"words":["exploring"]}}]}
18d schema, stages: { word: [x] }: 
  line 2: key audit.required_files[0].stages.word is not declared by the schema of this file
18e schema, the hub rewrite value: (nothing)
19 start: website findings: (none)
19 start: README.md missing for [], code/LICENSE missing for [projects/b]
  README.md of projects/a removed: rebuilt
    README.md missing for [projects/a]
  code/LICENSE of projects/b created: rebuilt
    code/LICENSE missing for []
  feed outside every scan folder edited: rebuilt
    website findings: on the website under ['thesis'] but hub stage `published` expects ['journal']: wrong section?
  README.md of the repository removed: rebuilt
    README.md missing for [projects/a, repo]
```

## DONE / NOT DONE (the brief)

| Item | State | Check |
| --- | --- | --- |
| 1. `audit:` with its four parts, the hub list rows, the defaults, the options in "Audit checks" | DONE | cases 1-11, 15-18; `audit.test.ts` 27 rows green |
| 1. The control `words` in every file of the control switch | DONE | case 18 |
| 1. The reader of `audit:`, one finding per malformed part, per hub | DONE | cases 15, 16 |
| 2. The removals | DONE | cases 12, 13, 14; verify 3 |
| 3. The watcher rebuilds on the audit paths; its rule in `watch/portfolio/` | DONE | case 19, case-runs r7a and r7b; `ls src/lib/server/root/watch` 10 items |
| 4. The reworded finding texts | DONE | the `audit.yml` diff below |
| 5. The documents | DONE | `git diff docs/` |
| 6. The tests under G125, and `config-folder.test.ts` | DONE | runs below |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | `test:quick: 239.8 s; every command passed`, exit 0 (ASCII gate, prettier, svelte-kit sync, eslint, svelte-check, vitest checks, vitest, vitest slow each `ok`) |
| Verify 2: the character-set check over every changed file | DONE | the perl gate over the 59 changed files printed nothing, `ascii exit 0` |
| Verify 3: the grep of removed names | DONE | 44 lines, the same hits as before the round, only unrelated names (below) |
| Verify 4: unused exports against the base | DONE | no added line (below) |
| Verify 5: `sh utils/folder-check.sh`; line counts | DONE | folder-check printed nothing, exit 0; largest changed source `git.ts` 878 (one import line changed), largest component `FieldControl.svelte` 497 |
| Verify 6: each new or changed test on the base replica and the changed tree | DONE | below |
| Verify 7: comments and document sentences | DONE | below |
| `npx prettier --check` over the 59 changed files | DONE | "All matched files use Prettier code style!" |

### Verify 3

`grep -rnE "publications_file|...|author_chips" src config tests docs --exclude=local.yml` prints 44 lines, every one a name of another meaning: `APP_FOLDERS`, `PLAIN_FOLDERS`, `MOST_FOLDERS`, `LEFT_OUT_FOLDERS`, `READER_FOLDERS`, `FOLDERS_LOADING`, `RETIRED_KINDS`, local constants `FOLDERS` of `pdfjs-assets.ts`, `lists/folders.ts`, `manifest.test.ts` and `opening-apps.test.ts`, the terminal text `# WORKSPACE FOLDERS (no hub)`, the git visibility `'PUBLIC'` of three tests, an HTML doctype `PUBLIC`, and the planted file body `'deposit root\n'` of `tests/data/sources/docs.test.ts:46`. The output is quoted under "The round's grep outputs".

### Verify 4, as printed after the last change

```
$ sh utils/unused-exports.sh > unused-r1.txt; echo "exit $?"; diff .agents/worktrees/O63-base/unused-exports.txt unused-r1.txt
exit 0
103c103
< src/lib/server/root/watch/portfolio.ts: DEBOUNCE, MAX_WAIT, audited, relevant, namedByConfig, watchedDirectories, roleDirectories, watchFile
---
> src/lib/server/root/watch/portfolio/portfolio.ts: DEBOUNCE, MAX_WAIT, watchFile
```

The counts are unchanged (230 exports, 111 types). The one changed line is the moved file: the five names it drops are imported across the files of `watch/portfolio/`.

### Verify 6: tests on the base replica and the changed tree

The base replica is the scratch copy of the unchanged tree with the changed test files copied in.

- `tests/routes/docs/audit.test.ts`, all 27 rows (the 26 of the build and item 1's row). Base replica: each row fails at its first scan, `TypeError: hubAuditSetting is not a function` (the build's rows at lines 130, 144, 159, 177, 195, 210, 218, 226, 253, 273, 297, 322, 330, 344, 354, 368, 375, 391, 407, 429, 441, 451, 496, 505, 520 and 555 of the build's file; item 1's row at `:419:23` of this round's file); the unchanged tree has no reader of `audit:`. Changed tree: `Tests 27 passed (27)`.
- `tests/checks/config/config-folder.test.ts`. Base replica: 'holds exactly the expected top-level keys, and no more' fails at `:360`, `expected [ Array(100) ] to deeply equal [ Array(99) ]`; 'describes every flag of stages, forms, chips, statuses, lead_statuses and tiers and every key of a roles and categories row in the schema of vocab.yml' fails at `:686`, `to have a length of 33 but got 34`; 'reads each file on its own and finds its own keys there and nowhere else' fails at `:792`, `expected [ 'apps', 'audit_ignore', ...(24) ] to deeply equal [ 'apps', 'audit', ...(25) ]`. Changed tree: passes (`Test Files 2 passed (2)` with `boundaries.test.ts`).
- `tests/state/boards/board/board-rules.test.ts`. Base replica: fails at its import, `:45`, `Cannot find module '../../../../src/lib/server/content/audit/setting.ts'`. Changed tree: passes. It holds no new assertion; its change is the `setting` field `AuditInput` requires.

Every changed line of `tests/checks/config/config-folder.test.ts` (from `diff -U2` of the base and the worktree), one row each:

| Line (base / worktree) | Before | After |
| --- | --- | --- |
| - / 152 | (none) | `'audit',` in the key list of `behavior.yml`, after `'audit_ignore',` |
| 201 / - | `'publications_file',` in the key list of `sources.yml` | (removed) |
| 228 / - | `'publication_kinds',` in the key list of `catalogs/vocab.yml` | (removed) |
| 340-345 / - | the shape row `['catalogs/vocab.yml', 'publication_kinds: { kind: thesis }\n', 'publication_kinds', 'publication_kinds must be a list']` (six lines) | (removed) |
| 655 / 648 | title `'describes every flag of stages, forms, chips, statuses, lead_statuses and tiers and every key of a roles, categories and publication_kinds row in the schema of vocab.yml'` | title `'describes every flag of stages, forms, chips, statuses, lead_statuses and tiers and every key of a roles and categories row in the schema of vocab.yml'` |
| 682 / 675 | `['categories', vocab.categories?.items],` | `['categories', vocab.categories?.items]` |
| 683 / - | `['publication_kinds', vocab.publication_kinds?.items]` | (removed) |
| 692-694 / 684-685 | comment: 14 stage flags, ..., the 2 keys of a roles row, the 6 keys of a categories row and the 3 keys of a publication_kinds row | comment: 13 stage flags, ..., the 2 keys of a roles row and the 6 keys of a categories row |
| 695 / 686 | `expect(keys).toHaveLength(37);` | `expect(keys).toHaveLength(33);` |

### Verify 7: comments and document sentences

Every comment paragraph the step adds or changes was read whole for a line that ends short inside a sentence, for what it says against the code, and against `spec.md`'s rules on comments. The paragraphs read are those holding a line the diff adds or changes, and every paragraph of the files the step adds or moves (`setting.ts`, `watch/portfolio/portfolio.ts`, `audited.ts`, `reads.ts`), 187 in all, listed below by path and first line, each marked "wrapped" (read, ends at the column or at its end) or "rewrapped" (rewrapped in this round) (from `<scratchpad>/caserun/paragraphs.py`, which only lists the paragraphs; the reading is mine). Rewrapped in this round:

- `src/lib/state/system/config/editors/fields.ts:7` (the paragraph broke after "unset. A held");
- `src/lib/state/system/config/editors/draft.ts:11` (the paragraph broke after "records as cards of its own.");
- `src/lib/views/system/workbench/editors/FieldControl.svelte:2` (it named `state/system/config/editors/ fields.ts` with a space inside the path, as the base did; the path is joined and the paragraph rewrapped);
- `src/lib/server/root/watch/portfolio/portfolio.ts:323` (the paragraph moved from the base broke after "a career file made after the server");
- `src/lib/views/system/audit/Audit.svelte:19` and `src/lib/data/model/index.ts:356` (rewritten under item 3).

Every other paragraph listed is wrapped: each line ends where the next word would pass 100 columns, or at the paragraph's end. The YAML comments of `config/` are one line per paragraph, as those files write them. No comment tells history.

```
config/catalogs/vocab.yml:51 wrapped
config/catalogs/vocab.yml:79 wrapped
config/catalogs/vocab.yml:207 wrapped
config/defaults/behavior.yml:1 wrapped
config/defaults/behavior.yml:28 wrapped
config/defaults/sources.yml:56 wrapped
config/options/appearance.yml:6 wrapped
src/lib/data/helpers/hub-names.ts:353 wrapped
src/lib/data/model/index.ts:356 rewrapped
src/lib/data/places/code-rules.ts:1 wrapped
src/lib/data/shapes/boards/words.ts:1 wrapped
src/lib/data/shapes/catalog-files/vocab.ts:221 wrapped
src/lib/data/shapes/catalog-words.ts:82 wrapped
src/lib/data/sources/config/catalog/options.ts:138 wrapped
src/lib/data/sources/config/catalog/options.ts:149 wrapped
src/lib/data/sources/config/catalog/options.ts:321 wrapped
src/lib/data/sources/config/catalog/options.ts:618 wrapped
src/lib/data/sources/config/catalog/schemas/options.ts:9 wrapped
src/lib/data/sources/config/catalog/schemas/options.ts:112 wrapped
src/lib/data/sources/config/catalog/schemas/options.ts:123 wrapped
src/lib/data/sources/config/catalog/value-rule.ts:7 wrapped
src/lib/data/sources/config/catalog/value-rule.ts:57 wrapped
src/lib/data/sources/config/catalog/value-rule.ts:163 wrapped
src/lib/data/sources/config/sections/findings.ts:1 wrapped
src/lib/data/sources/config/settings/reader.ts:61 wrapped
src/lib/server/content/audit/projects.ts:1 wrapped
src/lib/server/content/audit/projects.ts:52 wrapped
src/lib/server/content/audit/projects.ts:262 wrapped
src/lib/server/content/audit/projects.ts:270 wrapped
src/lib/server/content/audit/projects.ts:276 wrapped
src/lib/server/content/audit/projects.ts:301 wrapped
src/lib/server/content/audit/projects.ts:318 wrapped
src/lib/server/content/audit/projects.ts:326 wrapped
src/lib/server/content/audit/projects.ts:338 wrapped
src/lib/server/content/audit/projects.ts:363 wrapped
src/lib/server/content/audit/projects.ts:381 wrapped
src/lib/server/content/audit/projects.ts:389 wrapped
src/lib/server/content/audit/publications.ts:1 wrapped
src/lib/server/content/audit/publications.ts:79 wrapped
src/lib/server/content/audit/publications.ts:85 wrapped
src/lib/server/content/audit/publications.ts:88 wrapped
src/lib/server/content/audit/publications.ts:92 wrapped
src/lib/server/content/audit/publications.ts:116 wrapped
src/lib/server/content/audit/publications.ts:153 wrapped
src/lib/server/content/audit/publications.ts:194 wrapped
src/lib/server/content/audit/publications.ts:253 wrapped
src/lib/server/content/audit/publications.ts:275 wrapped
src/lib/server/content/audit/rules.ts:48 wrapped
src/lib/server/content/audit/rules.ts:205 wrapped
src/lib/server/content/audit/scan.ts:1 wrapped
src/lib/server/content/audit/scan.ts:21 wrapped
src/lib/server/edit/writes/config/config-fit.ts:1 wrapped
src/lib/server/edit/writes/config/config-fit.ts:59 wrapped
src/lib/server/edit/writes/config/config-fit.ts:195 wrapped
src/lib/server/edit/writes/config/config-value.ts:5 wrapped
src/lib/server/root/watch/build.ts:1 wrapped
src/lib/state/system/config/editors/draft.ts:4 wrapped
src/lib/state/system/config/editors/draft.ts:11 rewrapped
src/lib/state/system/config/editors/fields.ts:7 rewrapped
src/lib/state/system/config/editors/fields.ts:118 wrapped
src/lib/state/system/config/editors/fields.ts:123 wrapped
src/lib/state/system/config/editors/fields.ts:267 wrapped
src/lib/state/system/config/editors/fields.ts:334 wrapped
src/lib/state/system/config/rows.ts:178 wrapped
src/lib/views/system/audit/Audit.svelte:19 rewrapped
src/lib/views/system/workbench/editors/Editor.svelte:2 wrapped
src/lib/views/system/workbench/editors/FieldControl.svelte:2 rewrapped
src/lib/views/system/workbench/editors/FieldControl.svelte:232 wrapped
src/routes/+page.server.ts:15 wrapped
tests/checks/config/config-folder.test.ts:684 wrapped
tests/data/hubs/hub-portfolio.test.ts:1 wrapped
tests/data/snapshot/references.test.ts:15 wrapped
tests/routes/docs/audit.test.ts:1 wrapped
tests/routes/docs/audit.test.ts:23 wrapped
tests/routes/docs/audit.test.ts:29 wrapped
tests/routes/docs/audit.test.ts:42 wrapped
tests/routes/docs/audit.test.ts:57 wrapped
tests/routes/docs/audit.test.ts:73 wrapped
tests/routes/docs/audit.test.ts:78 wrapped
tests/routes/docs/audit.test.ts:86 wrapped
tests/routes/docs/audit.test.ts:103 wrapped
tests/routes/docs/audit.test.ts:239 wrapped
tests/routes/docs/audit.test.ts:491 wrapped
tests/state/boards/board/board-rules.test.ts:387 wrapped
src/lib/server/content/audit/setting.ts:1 wrapped
src/lib/server/content/audit/setting.ts:7 wrapped
src/lib/server/content/audit/setting.ts:25 wrapped
src/lib/server/content/audit/setting.ts:28 wrapped
src/lib/server/content/audit/setting.ts:31 wrapped
src/lib/server/content/audit/setting.ts:35 wrapped
src/lib/server/content/audit/setting.ts:40 wrapped
src/lib/server/content/audit/setting.ts:43 wrapped
src/lib/server/content/audit/setting.ts:48 wrapped
src/lib/server/content/audit/setting.ts:50 wrapped
src/lib/server/content/audit/setting.ts:54 wrapped
src/lib/server/content/audit/setting.ts:65 wrapped
src/lib/server/content/audit/setting.ts:68 wrapped
src/lib/server/content/audit/setting.ts:71 wrapped
src/lib/server/content/audit/setting.ts:74 wrapped
src/lib/server/content/audit/setting.ts:77 wrapped
src/lib/server/content/audit/setting.ts:80 wrapped
src/lib/server/content/audit/setting.ts:84 wrapped
src/lib/server/content/audit/setting.ts:127 wrapped
src/lib/server/content/audit/setting.ts:135 wrapped
src/lib/server/content/audit/setting.ts:143 wrapped
src/lib/server/content/audit/setting.ts:146 wrapped
src/lib/server/content/audit/setting.ts:149 wrapped
src/lib/server/content/audit/setting.ts:153 wrapped
src/lib/server/content/audit/setting.ts:190 wrapped
src/lib/server/content/audit/setting.ts:214 wrapped
src/lib/server/content/audit/setting.ts:227 wrapped
src/lib/server/root/watch/portfolio/audited.ts:1 wrapped
src/lib/server/root/watch/portfolio/audited.ts:7 wrapped
src/lib/server/root/watch/portfolio/audited.ts:22 wrapped
src/lib/server/root/watch/portfolio/audited.ts:27 wrapped
src/lib/server/root/watch/portfolio/audited.ts:33 wrapped
src/lib/server/root/watch/portfolio/audited.ts:49 wrapped
src/lib/server/root/watch/portfolio/audited.ts:63 wrapped
src/lib/server/root/watch/portfolio/audited.ts:82 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:1 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:5 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:9 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:18 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:91 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:93 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:95 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:98 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:104 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:110 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:114 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:117 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:125 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:130 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:136 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:142 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:150 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:155 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:164 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:167 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:173 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:176 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:184 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:202 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:215 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:225 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:229 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:232 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:237 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:240 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:244 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:249 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:254 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:258 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:290 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:296 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:323 rewrapped
src/lib/server/root/watch/portfolio/portfolio.ts:356 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:358 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:369 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:386 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:421 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:434 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:450 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:478 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:490 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:504 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:519 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:534 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:541 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:555 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:580 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:589 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:595 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:605 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:616 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:679 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:701 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:705 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:741 wrapped
src/lib/server/root/watch/portfolio/portfolio.ts:809 wrapped
src/lib/server/root/watch/portfolio/reads.ts:1 wrapped
src/lib/server/root/watch/portfolio/reads.ts:14 wrapped
src/lib/server/root/watch/portfolio/reads.ts:51 wrapped
src/lib/server/root/watch/portfolio/reads.ts:65 wrapped
src/lib/server/root/watch/portfolio/reads.ts:76 wrapped
src/lib/server/root/watch/portfolio/reads.ts:81 wrapped
src/lib/server/root/watch/portfolio/reads.ts:97 wrapped
```

## Runs of `npm run test:quick` and whole-suite commands

`npm run test:quick` ran once to completion in this round, after `npm run diagrams` and after the last change. Two earlier starts in this round were stopped before they finished: one to take in a comment change, and one after its eslint step reported `no-useless-assignment` on the initial value of `let inode` in `openOn` (`portfolio.ts:373`), which the complete run's code no longer has. No whole-suite command ran. Targeted runs in this round: `npx vitest run tests/routes/docs/audit.test.ts` (twice), the related set `tests/routes/docs/audit.test.ts tests/state/boards/board/board-rules.test.ts tests/checks/config tests/checks/source/keys.test.ts tests/data/sources/config tests/state/system/settings tests/server/edit tests/routes/edit tests/data/hubs tests/data/snapshot/references.test.ts tests/checks/tree/boundaries.test.ts` (once: 46 of 48 files passed; `boundaries.test.ts` 'holds across src/lib' at 8152 ms and `config-folder.test.ts` 'names a glyph only where the source or another config file reads it' at 16198 ms failed with no assertion output captured), and those two files alone (twice: `Test Files 2 passed (2)`, `Tests 39 passed | 2 skipped (41)`), as the state file's verification section reads a load-bound file alone as the second measurement.

## Files with line counts

Before (the base copy, or `git show HEAD:` for `docs/`) | after, by `wc -l`:

```
config/catalogs/vocab.yml | 264 | 250
config/defaults/behavior.yml | 305 | 312
config/defaults/sources.yml | 114 | 113
config/options/appearance.yml | 212 | 212
config/options/behavior.yml | 756 | 838
config/options/sources.yml | 125 | 118
config/text/findings.yml | 394 | 396
config/text/server.yml | 536 | 538
config/text/views/system/audit.yml | 75 | 74
config/text/views/system/workbench.yml | 252 | 258
docs/data-map.md | 228 | 234
docs/HELP.md | 558 | 559
docs/templates.md | 1360 | 1398
src/lib/data/helpers/hub-names.ts | 474 | 481
src/lib/data/model/index.ts | 842 | 846
src/lib/data/places/code-rules.ts | 29 | 29
src/lib/data/shapes/boards/words.ts | 98 | 99
src/lib/data/shapes/catalog-files/options.ts | 127 | 129
src/lib/data/shapes/catalog-files/vocab.ts | 422 | 395
src/lib/data/shapes/catalog-words.ts | 96 | 107
src/lib/data/sources/config/catalog/options.ts | 631 | 673
src/lib/data/sources/config/catalog/schemas/options.ts | 329 | 354
src/lib/data/sources/config/catalog/value-rule.ts | 263 | 298
src/lib/data/sources/config/catalog/value-words.ts | 119 | 123
src/lib/data/sources/config/merge/workspace-layer.ts | 282 | 287
src/lib/data/sources/config/sections/findings.ts | 47 | 48
src/lib/data/sources/config/settings/reader.ts | 181 | 184
src/lib/server/content/audit/projects.ts | 542 | 600
src/lib/server/content/audit/publications.ts | 275 | 301
src/lib/server/content/audit/rules.ts | 376 | 349
src/lib/server/content/audit/scan.ts | 66 | 82
src/lib/server/content/audit/setting.ts | new | 230
src/lib/server/edit/writes/config/config-fit.ts | 470 | 481
src/lib/server/edit/writes/config/config-value.ts | 307 | 308
src/lib/server/root/context.ts | 820 | 820
src/lib/server/root/process/context/dependencies.ts | 122 | 122
src/lib/server/root/process/context/rebuild.ts | 113 | 113
src/lib/server/root/watch/apps.ts | 496 | 496
src/lib/server/root/watch/bookmarks.ts | 117 | 117
src/lib/server/root/watch/build.ts | 208 | 208
src/lib/server/root/watch/git.ts | 878 | 878
src/lib/server/root/watch/portfolio.ts | 880 | moved
src/lib/server/root/watch/portfolio/audited.ts | new | 104
src/lib/server/root/watch/portfolio/portfolio.ts | 880 (src/lib/server/root/watch/portfolio.ts) | 850
src/lib/server/root/watch/portfolio/reads.ts | new | 114
src/lib/server/root/watch/sessions.ts | 322 | 322
src/lib/state/system/config/editors/draft.ts | 595 | 598
src/lib/state/system/config/editors/fields.ts | 691 | 751
src/lib/state/system/config/messages.ts | 64 | 65
src/lib/state/system/config/rows.ts | 450 | 455
src/lib/views/system/audit/Audit.svelte | 352 | 355
src/lib/views/system/workbench/editors/Editor.svelte | 242 | 243
src/lib/views/system/workbench/editors/FieldControl.svelte | 449 | 497
src/routes/+page.server.ts | 93 | 93
tests/checks/config/config-folder.test.ts | 814 | 805
tests/data/hubs/hub-portfolio.test.ts | 538 | 538
tests/data/hubs/hubs-fixture.ts | 118 | 121
tests/data/snapshot/references.test.ts | 614 | 614
tests/routes/docs/audit.test.ts | 111 | 571
tests/state/boards/board/board-rules.test.ts | 604 | 607
docs/diagrams/channels.dot, channels.svg, layer-data.dot, layer-data.svg, layer-server.dot, layer-server.svg, layer-state.dot, layer-state.svg, layers.dot, layers.svg, writes.dot, writes.svg | regenerated by npm run diagrams
```

Files outside the brief's path list, each with what reached it:

- `src/lib/server/root/watch/apps.ts`, `bookmarks.ts`, `git.ts`, `sessions.ts`: each imports `type Watcher` from `./portfolio.ts`; `npm run check` reported the missing module after the move. One import line each.
- `tests/state/boards/board/board-rules.test.ts`: `npm run check` reported `Property 'setting' is missing in type ... but required in type 'AuditInput'` at `:388`; widened for this round by the round brief (item 5).
- `src/lib/views/system/audit/Audit.svelte`, `src/lib/data/model/index.ts`: widened by the round brief (item 3).
- `src/lib/data/shapes/boards/words.ts`: exports `BLOCK_LISTS` and `BlockList` for the control; its head comment names the control.
- `src/lib/data/sources/config/catalog/options.ts`: `flagSources`, `blockFlags` (item 6) and `flaggedItems`, and `readSpec` reporting `no_values` for a words control with no `from`.
- `src/lib/data/sources/config/settings/reader.ts`, `src/lib/data/sources/config/merge/workspace-layer.ts`: pass `flagged` to the value rule.
- `src/lib/server/edit/writes/config/config-value.ts`: its head comment names the word block.
- `src/lib/state/system/config/messages.ts`, `config/text/views/system/workbench.yml`: the control's words in the Settings view and `settings_mismatch_block`; `desc_vocab`, which named "the publication kinds"; `desc_behavior` and `desc_config` naming `audit:`.
- `config/options/appearance.yml`: holds the options catalog's head comment, which describes the controls.
- `src/lib/data/sources/config/catalog/schemas/engine.ts` and `src/lib/state/system/config/groups.ts` are in the list and unchanged: they match the `audit.*` rows as they are (case 18).

## Judgment calls

1. The reader takes `audit:` from the hub's own `.oculus/config.yml` read raw, since the merge of the hub file applies only hub-list keys and a key the setting does not take (case 15's `colour`) never reaches the merged configuration. The config channel still reports such a key as `hub_key_unknown` for the primary, so case 15 shows it twice.
2. A `website` with any part not of its shape is off whole, every bad part named.
3. `sec_conform` is "Hub conventions".
4. A project of a skipped tier claims the feed paper it matches and gets no finding (ruled by Z984; item 1).
5. No refusal beside `type_records`, which is `src/lib/server/edit/writes/entries.ts:144`'s refusal over manifest field types; the config-write refusals `wants_block` and `not_flag` sit beside `wants_records`.
6. A list that carries no flags gets `maxItems: 0` for `flags` and `not_flags` in the schema, and the value rule refuses such flags.
7. The website feed and a workspace repository project's files are watched one at a time through their folder, with that folder watched flat through the folder above it, and the handles follow the hubs' `audit:` at every rebuild (item 7).
8. The watcher matches a required path by its last segments and does not read a row's `folders`; an event on such a path of a project a row leaves alone costs one rebuild that finds nothing new.
9. A shape finding is filed under the scope `.oculus/config.yml` with the dotted key as its `where`, so a mute of it holds across rebuilds.
10. A missing file and a missing heading of a required section give the same text, naming the key, the file and the heading.
11. The dead-end text lists the public stages' labels each in double quotes, joined by `, ` (item 2).
12. `blockFlags` lives in `catalog/options.ts` beside `flagSources` (item 6).

## Host- and user-visible changes, before and after

- `publications_file`: before, the feed's path; after, `hub_key_unknown` (13a). The hub sets it at `.oculus/config.yml:30`.
- `publication_kinds` and the stage flag `standard`: gone; `standard: true` on a stage row is `shape_unknown` (13b).
- A hub with no `audit:`: before, the README, code README, Data-section, retired-document and folder-name checks ran on every hub; after, none (cases 1, 12). The retired-document and folder-name checks are gone with no setting.
- A workspace file's `settings: audit:`: before "audit is not an option"; after `settings_hub_key` (13c).
- The website check: before, the primary hub only, from `publications_file`, `papers` and `title`; after, every hub that sets `audit.website`, each against its own feed with the keys the setting names (cases 7, 9). A finding's `where` names the feed's file (on the real hub `side-projects/theaxec.github.io/_data/publications.yml`) in place of `publications.yml`.
- A project of a skipped tier on the feed: before, the base skipped it before matching (`if (isPersonal(project, rules)) continue;` at the base's `publications.ts:178`, read, not run, since the base has no setting to run the row with), so the feed's paper it alone matches was listed in the hub's untracked finding ("N website papers not matched to any hub project, ..."); after, the project claims the paper, which is not listed, and the project gets no finding (item 1's row). On the real hub this changes no finding (see "Hub rewrite").
- The dead-end finding: before, "... hub marks this `stopped` but it appears on the PUBLIC website under ...; set the stage to `published` if it is a real publication, ..."; after, "the stage stopped (dropped or abandoned) marks a dead end, but the website shows it under ['journal']: give it one of the stages "in preparation", "submit-ready", "submitted / under review", "major revision (back with the authors)", "published" if it is a publication, else take it off the website (or mute if intentional)" (case-run r2).
- New findings: a missing required file, a missing required section, a stage folder, a part of `audit:` not of its shape.
- The Audit view: "Tier conformance" is "Hub conventions"; the empty text is "Nothing open: no markers, no data gaps or missing sections, no missing required files, no status chip or project folder out of place, no readability warnings and nothing to reconcile with the website."
- Settings, "Audit checks": three rows become ten, adding `audit.required_files`, `audit.required_sections`, `audit.stage_folders`, `audit.website.file`, `.list`, `.title` and `.kinds`, each written to the hub's `.oculus/config.yml` (case 18).
- The control `words`: four multi-picks, "one of these words", "none of these words", "a word with one of these flags" and "no word with one of these flags", a held word outside the list marked "(not in the list)"; a value of the wrong shape shows "The value in force is {0}, which is not a map of the lists words, not_words, flags and not_flags."; a write is refused with "This field takes a map of the lists words, not_words, flags and not_flags, each a list of words" or "A flag is not one of the flags of the list {0}".
- The audit's rebuilds: before, only on `README.md` and `code/README.md`, and a feed outside the scan folders was not watched at all (case 19 on the unchanged tree); after, also on every file and folder of `required_files`, every file of `required_sections`, the website feed wherever it lies and a workspace repository project's required files (case 19). The watches of those files follow the hubs' `audit:`: a feed renamed in `audit.website.file` stops being watched at its old path and is watched at its new one (r7a), and a feed folder removed and made again is watched again, so its later edits rebuild without a restart (r7b).
- `config/text/views/system/audit.yml`, before and after (`diff -u` of the base and the worktree):

```
--- ../O63-base/config/text/views/system/audit.yml
+++ config/text/views/system/audit.yml
@@ -10,12 +10,12 @@
         title: Audit
         toolbar: Audit controls
         search: 'Search findings ...'
-        empty: 'Nothing open: no markers, no data gaps, no conformance gaps, no status chip out of place, no readability warnings and nothing to reconcile with the website.'
+        empty: 'Nothing open: no markers, no data gaps or missing sections, no missing required files, no status chip or project folder out of place, no readability warnings and nothing to reconcile with the website.'
         empty_glyph: circle_empty
         none_match: No finding matches the search.
         sec_todo: Open items (TODO / VERIFY)
         sec_data: Missing data
-        sec_conform: Tier conformance
+        sec_conform: Hub conventions
         sec_manifest: Manifest guardrails
         sec_readability: Readability
         sec_publink: Website publications sync
@@ -43,19 +43,18 @@
         msg_missing_field: 'missing `{0}`'
         msg_provisional: '{0} provisional results: the numbers are not final'
         msg_provisional_one: 'one provisional result: the number is not final'
-        msg_no_data_section: 'has `datasets` but no Data section (README.md `## Data` or DATA.md)'
+        msg_required_section: 'has a value at `{0}` but {1} has no heading `{2}`'
         msg_docs_ahead: 'docs changed {0}, {1}d after the manifest; refresh project.yml'
-        msg_deposit_before_reproduction: 'deposit dated {0} predates the from-scratch reproduction {1}: the reproduced code may not be what was pushed; re-push code/ and bump `code_availability.date`'
+        msg_deposit_before_reproduction: 'deposit dated {0} predates the from-scratch reproduction {1}: the reproduced code may not be what was deposited; deposit it again and bump `code_availability.date`'
         msg_collection_missing: collection file missing
         msg_entry_no_title: missing title
         msg_entry_no_status: missing status
         msg_entry_no_date: 'status "{0}" but no date tracked'
         msg_entry_related: 'related id `{0}` is not a known project'
         msg_entry_link: 'link path missing: {0}'
-        msg_no_readme: 'missing: the one private doc every project needs'
-        msg_retired_doc: 'retired doc: fold it into README.md'
-        msg_bad_folder: 'non-canonical folder: rename to {0}'
-        msg_code_no_readme: code/ has no README.md (the deposit root)
+        msg_required_file: 'missing {0}, a file the hub requires'
+        msg_stage_folder: 'at the stage `{0}` but under none of {1}'
+        msg_setting_shape: '{1} in {0} is not of the shape the audit setting takes, so that part is off'
         msg_no_lead: 'names no lead: add `lead:` with the person who leads the work'
         msg_no_board: 'on no board: tier {0}, role {1}, stage {2}'
         msg_terminal_lane_chip: 'the stage `{0}` is done but the chip `{1}` puts it on a Focus lane: remove the chip'
@@ -65,11 +64,11 @@
         msg_missing: missing
         msg_too_long: '{0} chars (>{1}): trim to a glance; detail belongs in the prose docs'
         msg_result_too_long: '{0} chars (>{1}): headline only'
-        msg_site_unreadable: 'could not parse publications.yml: {0}'
+        msg_site_unreadable: 'could not parse {0}: {1}'
         msg_site_wrong_section: 'on the website under {0} but hub stage `{1}` expects {2}: wrong section?'
         msg_site_title_differs: 'likely on the website as "{0}" (section {1}) but the titles differ: reconcile them'
         msg_site_missing: 'public (`{0}`) but no website entry: add it (likely section {1})'
-        msg_site_negative: 'hub-private negative result (`{0}`) but appears on the PUBLIC website under {1}: remove it (null/negative results never leave the hub)'
-        msg_site_deadend: 'hub marks this `{0}` but it appears on the PUBLIC website under {1}; set the stage to `published` if it is a real publication, else remove it from the site (or mute if intentional)'
-        msg_site_untracked: '{0} website papers not matched to any hub project, expected for pre-hub work; verify none are stale or duplicated: {1}'
-        msg_site_untracked_one: 'one website paper not matched to any hub project, expected for pre-hub work; verify it is not stale or duplicated: {1}'
+        msg_site_negative: 'the stage {0} marks a negative result, but the website shows it under {1}'
+        msg_site_deadend: 'the stage {0} marks a dead end, but the website shows it under {1}: give it one of the stages {2} if it is a publication, else take it off the website (or mute if intentional)'
+        msg_site_untracked: '{0} website papers not matched to any project of the hub; verify none are stale or duplicated: {1}'
+        msg_site_untracked_one: 'one website paper not matched to any project of the hub; verify it is not stale or duplicated: {1}'
```

- The documents: `docs/HELP.md` (the Audit row of the view table, the Audit bullet, the `behavior.yml` line, the `vocab.yml` list, a bullet on `audit:`), `docs/data-map.md` (the Audit row, 33 hub keys with the seven `audit.*` rows and without `publications_file`, the sentence on a hub other than the primary), `docs/templates.md` (`publications_file` gone; a commented `audit:` block with its four keys and an example).

## Where the brief was wrong or impossible

- The brief's grep for importers of `portfolio.ts` misses `./portfolio.ts` in `watch/apps.ts`, `bookmarks.ts`, `git.ts` and `sessions.ts`; the type check found them.
- `AuditInput` gains `setting`, so `board-rules.test.ts`, which builds one, needed the field.
- Case 11 against item 1's "its matching ... as today": today's matching skips a personal project before matching, so its feed paper is untracked, which case 11 forbids; ruling Z984 keeps the claim.
- `config/text/server.yml` "beside `type_records`": that text belongs to the manifest entry writes, which the control does not reach.
- Nothing in the round brief was wrong or impossible.

## Rows of today's `audit.test.ts` deleted

- 'raise a marker, a readability and a publication row for a project of the tier research'
- 'raise none of the three for a project of the tier personal'
- 'ask a project read from a workspace folder the order of its deposit and its reproduction, and the README of its code folder'

The changes of `config-folder.test.ts` are listed row by row under "Verify 6".

## Hub rewrite

The `audit:` value for `~/workspace/research-hub/.oculus/config.yml`, built from the hub's files read only; `publications_file:` (line 30, with its comment) is removed at the same time:

```yaml
audit:
  required_files:
    - { file: README.md, stages: { not_flags: [terminal] } }
    - { file: code/README.md, folder: code }
  required_sections:
    - { file: README.md, heading: "## Data", key: datasets, folders: [projects/ideas, side-projects, projects/active, projects/manuscripts, projects/software, projects/archive] }
  stage_folders:
    - { stages: { words: [published] }, folders: [projects/archive/published, projects/coauthor, projects/archive/phd] }
  website:
    file: side-projects/theaxec.github.io/_data/publications.yml
    list: papers
    title: title
    kinds:
      - { kind: [thesis], forms: [thesis] }
      - { kind: [papers-in-review], stages: [submitted, revision] }
      - { kind: [papers-in-preparation], stages: [in-prep, submit-ready] }
      - { kind: [abandoned-papers], stages: [stopped] }
      - { kind: [abstracts], forms: [abstract] }
      - { kind: [posters], forms: [poster] }
      - { kind: [conference], forms: [conference] }
      - { kind: [journal, other-publications], forms: [journal] }
      - { kind: [abstracts, conference, journal, other-publications, posters, thesis] }
```

The run: the hub's `*.yml` and `*.md` files and its folders copied with rsync (without `.git` and `.oculus/local.yml`) to `<scratchpad>/hubcopy/research-hub`; `hubrun.ts` with the unchanged tree over the copy before its `config.yml` was changed (`hub-old.txt`), and with the changed tree, after this round's last change, over the copy with `publications_file` removed and the value above appended (`hub-new-end.txt`). The orchestrator reruns the old side at landing.

```
$ diff hub-old.txt hub-new-end.txt
1c1
< audit conform | projects/coauthor/active/flkit | README.md | missing: the one private doc every project needs
---
> audit conform | projects/coauthor/active/flkit | README.md | missing README.md, a file the hub requires
15,17c15,17
< audit publink | projects/manuscripts/bt-operator-theory | publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
< audit publink | projects/manuscripts/btfno | publications.yml | public (`revision`) but no website entry: add it (likely section papers-in-review)
< audit publink | projects/manuscripts/covert-applied | publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
---
> audit publink | projects/manuscripts/bt-operator-theory | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
> audit publink | projects/manuscripts/btfno | side-projects/theaxec.github.io/_data/publications.yml | public (`revision`) but no website entry: add it (likely section papers-in-review)
> audit publink | projects/manuscripts/covert-applied | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
```

- `projects/coauthor/active/flkit`: the same missing README, from the `required_files` row, worded "missing README.md, a file the hub requires".
- The three website findings: the same findings, their `where` the feed's path.

No finding comes or goes; the 13 `data` findings and the config finding of `wallpaper.image` (the copy holds no pictures) are in both runs.

```
audit conform | projects/coauthor/active/flkit | README.md | missing README.md, a file the hub requires
audit data | projects/coauthor/active/clinical-hccnet | project.yml | missing `datasets`
audit data | projects/coauthor/active/clinical-hccnet | project.yml | missing `results`
audit data | projects/coauthor/active/clinical-hccnet | venue | at the stage in preparation, which carries a venue, but no venue
audit data | projects/coauthor/active/flkit | project.yml | missing `results`
audit data | projects/ideas/adapter-format-theory | project.yml | missing `results`
audit data | projects/ideas/conformal-tensor-factors | project.yml | missing `results`
audit data | projects/ideas/ecg-af-fair | project.yml | missing `results`
audit data | projects/ideas/fed-duplication-limits | project.yml | missing `results`
audit data | projects/ideas/pathology-tensor-mil | project.yml | missing `results`
audit data | projects/ideas/serial-ecg-af | project.yml | missing `datasets`
audit data | projects/ideas/serial-ecg-af | project.yml | missing `results`
audit data | projects/ideas/strokeop | project.yml | missing `datasets`
audit data | projects/ideas/strokeop | project.yml | missing `results`
audit publink | projects/manuscripts/bt-operator-theory | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
audit publink | projects/manuscripts/btfno | side-projects/theaxec.github.io/_data/publications.yml | public (`revision`) but no website entry: add it (likely section papers-in-review)
audit publink | projects/manuscripts/covert-applied | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
config | .oculus/config.yml | wallpaper.image | wallpaper.image is research-hub/ss_7f426c69d4f27dff1e19aea7560c89bc27421104.jpg, and the wallpaper folder of that hub holds no such file; no wallpaper is shown
```

## The round's grep outputs

### Item 3: `grep -rniE "research standard|folder the|retired doc|tier conformance|folders off the standard" src docs --exclude=local.yml`

```
src/desktop/package.ts:89: * The folder the app goes to when no `--out` is given: `~/Applications` on macOS, the folder of a
src/lib/shell/keys/Palette.svelte:51:    // account, each cloned into a folder the reader picks (rows/CloneRows.svelte). `:theme`,
src/lib/shell/keys/rows/CloneRows.svelte:5:    // palette and clones it into a folder the system's folder panel asks for; the clone store says
src/lib/server/core/json.ts:82: * written, the old content and the folder then left as they were. The file is indented by two
src/lib/server/core/json.ts:126: * folder the wall lists or a half-written upload in a folder the Files view lists.
src/lib/server/core/json.ts:393: * the work the process that left it was doing may be half done. A folder the lock cannot be made in
src/lib/server/core/changes.ts:163:    /** The folder the values of a record's `kept` are written to, one `<at>.json` each. */
src/lib/server/core/git/run.ts:50:// `check-ignore` is the file browser's: which entries of one listed folder the repository ignores,
src/lib/server/core/git/files.ts:2:// which entries of a listed folder the repository ignores, the paths it tracks under a folder, the
src/lib/server/content/memories.ts:23:// file cannot be written under a picture's name into a folder the page then draws from.
src/lib/server/content/latex.ts:277: * `dir` is the folder the build ran in, for the one case a log names an absolute path, and `prefix`
src/lib/server/content/latex/recipes.ts:10:// `latex.aux_dir` resolved from the main's folder; one that leaves the folder the root serves is
src/lib/server/content/latex/endpoint.ts:283: * PDF its build writes, which is in the output folder the configuration names.
src/lib/server/content/audit/projects.ts:52: * The documents of a project folder the markers are read from, folder-relative. The portfolio
src/lib/server/edit/writes.ts:175:     * What a write from an app's frame needs: the apps the server holds, the folder the machine
src/lib/server/edit/writes/config/lists/folders.ts:8:// read back and compared with the original before anything is written. Removing the folder the file
src/lib/server/sessions/group.ts:49:/** A project folder the caller knows about: its absolute path and the project's title. */
src/lib/server/accounts/calendar/poll.ts:50:    /** The folder the credential files live in, already resolved. */
src/lib/server/accounts/calendar/poll.ts:52:    /** The folder the providers' client halves live in, already resolved. */
src/lib/server/accounts/mail/poll.ts:52:    /** The folder the credential files and the triage notes live in, already resolved. */
src/lib/server/accounts/mail/poll.ts:54:    /** The folder the providers' client halves live in, already resolved. */
src/lib/server/accounts/mail/triage.ts:32:/** The file the notes live in, inside the folder the machine's own configuration names. */
src/lib/server/accounts/connect/loop.ts:34:    /** The folder the account files are read from, already resolved. */
src/lib/server/accounts/connect/loop.ts:59:    /** The folder the loop reads now. */
src/lib/server/accounts/connect/setup.ts:25:    /** The folder the providers' client halves live in, already resolved. */
src/lib/server/accounts/connect/actions.ts:59:    /** The folder the account files live in, already resolved. */
src/lib/server/accounts/connect/actions.ts:61:    /** The folder the providers' client halves live in, already resolved. */
src/lib/server/machine/pty/latex/latex.ts:29:// recipe and folder the terminal's task mark holds, and respawns nothing while something is
src/lib/server/machine/pty/sessions.ts:102: * the pane's folder, or the folder the session started in once the pane's process ended and tmux
src/lib/server/machine/lsp/choices.ts:50:/** ~/.oculus/lsp, the folder the `lsp` key names when it is not set, resolved at the call. */
src/lib/server/machine/lsp/adapters/asks.ts:27:     * path; `parents` also tells the creation of a folder the path lies in. A second call with the
src/lib/server/machine/lsp/adapters/entry.ts:62:    /** The folder the `lsp` key names. */
src/lib/server/machine/lsp/adapters/markdown/diagnostics.ts:4:// in a folder the server is never given; plus the entry's own mark for a backticked path that is
src/lib/server/machine/lsp/relay/relay-options.ts:25:    /** The folder the lsp key names, read at each use so a changed key is followed. */
src/lib/server/machine/lsp/held/requests/followed.ts:7:// a folder the followed path lies in when the id asked for its parents, which is how a link to a
src/lib/server/machine/approvals/approvals.ts:81: * The text a debug launch is approved by: the repository's real path, the folder the adapter runs
src/lib/server/machine/apps/read/scan.ts:76:    /** The folder the machine apps' stores are written in. */
src/lib/server/machine/apps/reach/private.ts:3:// each hub (`privateFolders`), the machine's `local.yml` files, and each state file or folder the
src/lib/server/machine/apps/reach/private.ts:22:    /** The bookmarks, the schedules and the apps folder the merged config places. */
src/lib/server/machine/runs/schedules/task.ts:29:    /** The primary hub's folder the session starts in; null while the workspace has no primary. */
src/lib/server/machine/runs/lint/writing/folder.ts:1:// Layer 2, server. The plan of a folder's Fix All: which files under a folder the writing rules can
src/lib/server/machine/runs/commands/repo.ts:4:// folder the file browser does not serve.
src/lib/server/machine/runs/seeds/task-seed.ts:3:// folder the agent starts in and the name of its terminal, or as the word that refuses it.
src/lib/server/machine/runs/seeds/task-seed.ts:128:/** The folder the agent starts in: the project's, the scheme's, or the hub root. */
src/lib/server/machine/runs/recover/unpack.ts:30:// folder the archive does not hold, or holds empty, fails the unpack of that archive with a line
src/lib/server/machine/runs/recover/unpack.ts:31:// naming it, and nothing is moved. Below the starting folder the walk reads each entry with
src/lib/server/machine/runs/recover/unpack.ts:170:/** The files of the 7z-wasm folder the program needs, copied to the cluster as they are. */
src/lib/server/root/watch/apps.ts:121:    /** The folder the machine apps' stores live in; `~/.oculus/app-data` when absent. */
src/lib/server/root/vite-plugin.ts:43: * adapter writes the built server into `options.out`, the folder the build of this Vite mode owns.
src/lib/server/machine/debug/session/types.ts:32:/** What a launch carries: the program and folder the route resolved, and what the page holds. */
src/lib/server/machine/debug/session/types.ts:38:    /** The absolute real path of the folder the adapter runs in. */
src/lib/server/root/watch/pollers.ts:87:    // The calendar poller reads the credential files of the folder the machine's own file names, so
src/lib/server/root/watch/pollers.ts:107:    // The mail poller reads the credential files and the triage notes of the folder the machine's
src/lib/server/root/process/server-context.ts:151:     * The folder the calendar credential files live in, resolved once for the poller and the
src/lib/server/root/process/server-context.ts:157:    /** The folder the mail credential files and the triage notes live in, resolved once. */
src/lib/server/root/process/server-context.ts:161:    /** The folder the one client half per provider lives in, resolved once. */
src/lib/server/root/watch/portfolio/portfolio.ts:370:     * gone or was made again since (another inode), which hears nothing of the folder there now.
src/lib/server/root/watch/repos/depth.ts:7: * at most `depth` segments names a folder the walk lists, and a path ending in `/.git` of at most
src/lib/server/root/watch/repos/depth.ts:8: * `depth + 1` segments is the repository mark of a folder the walk lists. A path inside a `.git`
src/lib/server/root/watch/git.ts:17:// The open workspace's own poll (workspace/follow.ts) tells this watcher of a move, so a folder the
src/lib/server/files/workspace/open.ts:58:    /** The name of the hub folder the open file lies in, empty for the unsaved workspace. */
src/lib/server/files/workspace/open.ts:75:    /** The folder the state lives in. */
src/lib/server/files/workspace/state.ts:34:/** The folder the state lives in, `~/.oculus`, resolved at the call. */
src/lib/server/files/workspace/folders.ts:16:// the folder the Repositories view looks for repositories, -1 meaning no limit. Any other value is
src/lib/server/files/workspace/folders.ts:231: * relative path, nothing there, a file, or a folder the workspace already lists. The real paths are
src/lib/server/files/project/project-files.ts:55:/** What the endpoint answers with: the rows, the cap, and the folder they are relative to. */
src/lib/server/files/project/project-files.ts:145: * Every file of one project folder the config lists, newest first, capped. A folder that is not
src/lib/server/files/workspace/follow.ts:35:    /** The state folder the workspace is read from. */
src/lib/server/files/fs/notes.ts:14:// note by its path inside the folder without `.md`. In each folder the folders come first, by name,
src/lib/server/files/fs/notes.ts:327: * no notes folder yet is inside the folder the first note makes.
src/lib/server/git/clone/github.ts:11:// into the folder the reader picked, in a folder named for the repository as GitHub gives it, and
src/lib/server/git/clone/github.ts:91:    /** The repository's name as GitHub gives it, which names the folder the clone is made in. */
src/lib/server/git/clone/github.ts:95:    /** The folder the repository's own folder is made in. */
src/lib/server/git/clone/clone.ts:1:// Layer 2, server. Cloning the repository of a project into a folder the reader picked. The folder
src/lib/server/git/clone/clone-git.ts:2:// argument vector at a time, never a shell. A clone runs in a folder the reader picked, so unlike
src/lib/server/git/clone/exclude.ts:15:// A repository that git ignores already (a worktree folder the hub's `.gitignore` names) gets no
src/lib/state/system/problem-sources.ts:125:/** The errors and warnings of the latest LaTeX build of every folder the page holds. */
src/lib/state/system/config/view/folders.ts:32:/** How deep under a folder the walk goes; a listing deeper than the config tree is a loop. */
src/lib/state/system/apps/tools/decorations.svelte.ts:149:     * What the apps say of a row: the joined decoration, or for a folder the colour a decorated
src/lib/state/sessions/latex/latex.svelte.ts:300:     * root holds it), or a file the folder's main depends on is in a folder the message names. A
src/lib/state/sessions/latex/latex-state.ts:400:    // The files of a log are against the folder the main file is in, which is the manuscript folder
src/lib/state/sessions/latex/latex-state.ts:401:    // of the project and not the folder the PDF is written to, and the state's `dir` is that
src/lib/state/sessions/terminal/composer/worktree.ts:8:// project's folder there. A name `validName` refuses is refused here, before anything is sent.
src/lib/state/workbench/layout.svelte.ts:261:         * is the key of the workspace folder the path lies in. The returned id names the Files
src/lib/state/workbench/layout.svelte.ts:267:         * it, scrolled to the top of the pane. The root is the key of the workspace folder the path
src/lib/state/sessions/terminal/composer/composer.ts:139: * The folder the composer starts in: the tab's choice while it is offered, else the primary hub's
src/lib/state/workbench/navigation/rail.ts:53: * folder the rail pages' arrangements show as tabs, then the `docs:` entries.
src/lib/state/boards/board/new-project.ts:25: * The folder the form of one tier starts with, or the empty text when the tier has no usable
src/lib/state/sources/explorer/sections/open-editors.ts:28:    /** The folder the file sits in, drawn after the name. Empty at a root's top. */
src/lib/state/sources/explorer/naming.ts:59: * when it is a folder, the folder the selected file sits in, and the first root when nothing is
src/lib/state/sources/explorer/rows/filter.ts:39: * entries are the listings already read, `null` for a folder never read: a folder the reader opened
src/lib/state/sources/explorer/rows/compact.ts:22:/** The folder the chain stands on, `from` the folder above it. */
src/lib/state/sources/explorer/rows/decorations.ts:30:/** The lists of one repository the fold reads, and the folder the repository is. */
src/lib/state/sources/explorer/rows/tree-rows.ts:42:/** Whether the name being typed sits at a folder, as a new file or folder there. */
src/lib/state/sources/explorer/rows/tree-rows.ts:55: * The lines of the tree: every root, and under each open folder the entries the server answered for
src/lib/state/sources/explorer/rows/tree-rows.ts:58: * being typed (`naming`) is a row too: for a new file or folder the first row under its folder,
src/lib/state/sources/explorer/notes/note-tree.ts:209: * folder the input is in (a note's name read without `.md`, a folder's or another file's whole
src/lib/state/sources/explorer/view/tab-roots.ts:128: * folder as the head of the tree, and the folder the row above the head moves to (none at the
src/lib/state/sources/explorer/view/disk.ts:53: * The path under a served root of a folder the message names, where the root lies at `from` under
src/lib/state/sources/repositories/repositories.ts:459:     * The top folder in the spelling of the roots, the folder the repository's state paths join.
src/lib/state/sources/search/file-match.ts:82: * the folder the query reached into.
src/lib/state/sources/clone/clone.svelte.ts:88:     * The folder the reader picks with the system's panel, starting at `start` when given: its
src/lib/state/sources/clone/clone-after.svelte.ts:71:    /** Make the folder the only one of the unsaved workspace. */
src/lib/state/client/selectors.svelte.ts:363:     * a hub, and for a document of oculus's own folder the hub that holds the folder and the
src/lib/state/client/selectors.svelte.ts:595:     * The known project folders of one workspace: the areas the grouping filed under a folder the
src/lib/data/file-ops.ts:378: * and for a folder the bytes and the newest modification below it, so a folder that something was
src/lib/data/file-ops.ts:379: * added to is not the folder the operation left. `kept` is the id of the copy of a file's content
src/lib/data/snapshot/references/build.ts:21:// Files are named by the workspace folder they are served under: the hub's name for a hub's files,
src/lib/data/snapshot/references/build.ts:22:// and for oculus's own configuration folder the name of the first workspace folder that holds it,
src/lib/data/snapshot/references/build.ts:72:    /** The name of the workspace folder the hub's files are named under. */
src/lib/data/model/model-sessions.ts:128:     * The store folder the file sits in: the project slug for Claude, the date folder for Codex.
src/lib/data/model/model-entities.ts:19:    /** The key, entry or folder the problem is about; empty when it is about the whole file. */
src/lib/data/model/apps/model-apps-tools.ts:102:    /** `absolute`, `relative` or `autoDetect`; relative to the folder the task runs in. */
src/lib/data/model/apps/model-apps-tools.ts:122:    /** `global`, `workspace` or the file URI of the folder the task belongs to. */
src/lib/data/model/apps/model-apps-tools.ts:153:    /** The folder the task belongs to as a file URI; empty for the workspace and global tasks. */
src/lib/data/model/index.ts:351: * read, and the real path of every apps folder the watcher holds.
src/lib/data/model/index.ts:382:    /** The path of an existing file below the folder the `root` names, else the empty text. */
src/lib/data/model/accounts/model-connect.ts:7:// state words; the only things that differ are the scopes asked for and the folder the file sits
src/lib/data/model/machine/model-machine.ts:356:     * recipe its line was made from (empty for a step of none) and the folder the request named,
src/lib/data/model/machine/model-machine.ts:784: * The answer of POST /api/lint to the action `folder`: the files of the folder the writing rules
src/lib/data/sources/origin.ts:53: * The git folder the repository at `dir` keeps its history and config in: a clone's own `.git`,
src/lib/data/model/machine/model-debug.ts:19:    /** The folder the adapter runs in: an absolute real path. */
src/lib/data/model/machine/model-debug.ts:193:    /** The folder the adapter runs in relative to the repository; `.` for the repository. */
src/lib/data/sources/manifests.ts:331:/** A project folder the scan rules reach: where it lies and its file. */
src/lib/data/sources/manifests.ts:472: * The absolute folder of a manifest's project: the workspace folder the project is read from, or
src/lib/data/helpers/files/apps/apps.ts:233: * Whether a path under a root starts with a folder the list names, compared segment by segment and
src/lib/views/shared/card/RootChip.svelte:3:    // with the name of the workspace folder the hub is served under. Every record carries its
src/lib/views/personal/memories/Memories.svelte:75:    /** How many answers of the folder the wall has drawn. */
src/lib/views/shared/forms/NewIdeaForm.svelte:67:     * The folder the form starts with for the hub `at`: the tier's `new_project_dir` entry of the
src/lib/views/shared/forms/entry/entry-actions.ts:170:    /** Open the workbench of a folder; `own` says it is the folder the entry's page is for. */
src/lib/views/shared/explorer/rooted-tree.svelte.ts:60:    /** The folder the tree is rooted at, drawn as its head, or null for the roots as they are. */
src/lib/views/shared/explorer/rooted-tree.svelte.ts:62:    /** The folder the row above the head moves to, or null when there is no such row. */
src/lib/views/shared/explorer/WritingFixDialog.svelte:7:    // says why. While the plan is read the dialog says so, and a folder the plan refused shows the
src/lib/views/shared/explorer/tree/Follow.svelte:24:    /** The folder the tab last opened, so each move is asked for once. */
src/lib/views/shared/explorer/tree/menu/row-drop.ts:71:     * Things dropped from Finder onto a row: the files upload into the folder the row stands for,
src/lib/views/shared/links/FolderLine.svelte:3:    // the words that say which folder the tab is limited to, and a control that takes the limit
src/lib/views/shared/links/FolderLine.svelte:11:        /** The line: which folder the tab is limited to. */
src/lib/views/shared/links/FolderFiles.svelte:33:        /** The folder as a path of the hub, or undefined for a folder the hub does not hold. */
src/lib/views/academic/present/Present.svelte:24:    // The deck is a folder the server reads (api/deck): `present.yml` and the Markdown slide files,
src/lib/views/system/workbench/settings/EditLink.svelte:6:    // workspace folder that holds it; with no such folder the control says so instead, and with the
src/lib/views/sessions/terminal/start/Composer.svelte:267:        // new worktree's folder is offered beside the folder the composer was opened in.
src/lib/views/sessions/terminal/start/SeedApproval.svelte:12:        /** The folder the start runs in, as the server resolved it. */
src/lib/views/sessions/terminal/start/worktree/WorktreeName.svelte:4:    // it opens, the folder the session will start in, and the Repositories view's warning when the
src/lib/views/sessions/terminal/start/worktree/WorktreeName.svelte:16:        /** The folder the session starts in once the worktree is made. */
src/lib/views/boards/entry/Entry.svelte:160:    /** The folder the entry's link names, undefined while the listing of its parent is read. */
src/lib/views/boards/entry/EntryFolder.svelte:39:        /** The folder the entry's link names; undefined while the listing of its parent is read. */
src/lib/views/sources/repositories/refs/Worktrees.svelte:26:    // opens this page's address again as well; a folder the workspace refuses is said in one muted
src/lib/views/sources/search/Search.svelte:18:    // searched here, and a folder the reader added is searched as a configured one is. Nothing else
src/lib/views/sources/doc/Doc.svelte:169:    /** The folder the bar's file is in: the tab's hub, or the hub that holds the engine folder. */
src/lib/views/sources/files/sections/notes-section.svelte.ts:133:    /** The folder the section head's New Note writes into: the primary hub's, else the first's. */
src/lib/views/sources/data/recover/Recover.svelte:17:    // the target the tab holds (this Mac or the cluster): the dataset's folder there with the free
src/routes/api/(files)/search/+server.ts:4:// The roots are the folders of the open workspace and no others, so a folder the reader added in
src/routes/api/(files)/ops/+server.ts:8:// The roots are the open workspace's folders, so a folder the reader added in the file browser is a
src/routes/api/(files)/ops/+server.ts:9:// folder these operations reach and no other is. The operations wait on the process's own write
src/routes/api/(files)/source/+server.ts:4:// The roots are the folders of the open workspace and no others: a folder the reader added in the
src/routes/api/(docs)/deck/+server.ts:3:// export only HTTP verbs. The roots are the workspace's folders and nothing else, so a folder the
docs/HELP.md:34:- Open in Program, Open Folder and a link to another site go through `xdg-open`, and under WSL2 through `wslview`, so the program the desktop names for the file opens it. Reveal in Finder is Open Containing Folder there, as in VS Code, and opens the folder that holds the file. A `.desktop` file and a file with its execute bit set are refused, since opening one runs it.
docs/HELP.md:419:- New worktree, beside the composer's branch, is offered for a folder inside a repository Source Control watches. Type a name: Start makes `<root>/.agents/worktrees/<name>` on a new branch, as Source Control's New worktree does, then starts Claude, Codex or the shell there, in the same subfolder (a project's folder starts in that project's folder of the new worktree). Esc or a second press takes the choice back. A refused name or write starts nothing; a worktree made whose start failed stays picked, so Start again starts there. The folder list offers the folder the composer was opened in, and the new worktree's folder once it is made, until a start from that composer lands, even when no place lists either.
```

### Verify 3

```
src/desktop/release.ts:30:import { APP_FOLDERS } from '../lib/server/root/process/build-folders.ts';
src/desktop/release.ts:52:const SHIPPED = [...SHIPPED_SOURCES, APP_FOLDERS.adapter];
src/lib/server/content/latex/pdfjs-assets.ts:18:const FOLDERS = ['cmaps', 'standard_fonts', 'wasm'] as const;
src/lib/server/content/latex/pdfjs-assets.ts:21:const assetShape = z.tuple([z.enum(FOLDERS), z.string().min(1)]);
src/lib/server/edit/writes/config/lists/folders.ts:40:const FOLDERS = 'folders';
src/lib/server/edit/writes/config/lists/folders.ts:111:        folders: itemsOf(record[FOLDERS]),
src/lib/server/edit/writes/config/lists/folders.ts:137:    const list = root.get(FOLDERS, true);
src/lib/server/edit/writes/config/lists/folders.ts:157:    const list = root.get(FOLDERS, true);
src/lib/server/edit/writes/config/lists/folders.ts:214:    const skip = [FOLDERS, PRIMARY];
src/lib/server/edit/writes/config/lists/folders.ts:240:    const edited = withPrimary(setItems(source, null, FOLDERS, items), wanted.primary);
src/lib/server/edit/writes/config/lists/folders.ts:249:        changed: [FOLDERS],
src/lib/server/edit/writes/config/lists/folders.ts:251:        records: [{ file, key: FOLDERS, field: FOLDERS, before, after: wanted, undo: 'field' }],
src/lib/server/sessions/cache.ts:37:const READER_FOLDERS = ['src/lib/server/sessions', 'src/lib/server/transcripts'];
src/lib/server/sessions/cache.ts:44: * module of READER_FOLDERS they import, directly or not, each hashed whole with its path, in the
src/lib/server/sessions/cache.ts:48:    const folders = READER_FOLDERS.map((folder) => join(root, folder) + sep);
src/lib/server/machine/lines.ts:43:const LEFT_OUT_FOLDERS = ['.scratch/', 'docs/diagrams/'];
src/lib/server/machine/lines.ts:63:    return !LEFT_OUT_FOLDERS.some((folder) => path.startsWith(folder));
src/lib/server/machine/pty/start/context.ts:96:            parts.push('# WORKSPACE FOLDERS (no hub)\n');
src/lib/server/root/watch/git.ts:103:import { APP_FOLDERS, PLAIN_FOLDERS } from '../process/build-folders.ts';
src/lib/server/root/watch/git.ts:119:const MOST_FOLDERS = 64;
src/lib/server/root/watch/git.ts:124:    ...Object.values(PLAIN_FOLDERS),
src/lib/server/root/watch/git.ts:125:    ...Object.values(APP_FOLDERS),
src/lib/server/root/watch/git.ts:512:                    const named = heard.whole || heard.folders.size > MOST_FOLDERS;
src/lib/server/root/watch/git.ts:558:        if (span.folders.size > MOST_FOLDERS) span.whole = true;
src/lib/server/root/process/build-folders.ts:15:export const APP_FOLDERS = { kit: '.svelte-kit-app', adapter: 'build-app' } as const;
src/lib/server/root/process/build-folders.ts:18:export const PLAIN_FOLDERS = { kit: '.svelte-kit', adapter: 'build' } as const;
src/lib/server/root/process/build-folders.ts:22:    return join(checkout, APP_FOLDERS.adapter, 'handler.js');
src/lib/state/sessions/source/write-files.ts:243:const FOLDERS_LOADING = 'folders_loading';
src/lib/state/sessions/source/write-files.ts:259:        return { ok: false, changed: [], refused: [], error, code: FOLDERS_LOADING };
tests/shell/keys/clone-rows.test.ts:17:        visibility: 'PUBLIC',
tests/server/desktop/start.test.ts:21:import { APP_FOLDERS, APP_MODE } from '../../../src/lib/server/root/process/build-folders.ts';
tests/server/desktop/start.test.ts:31:const HANDLER = join(CHECKOUT, APP_FOLDERS.adapter, 'handler.js');
tests/server/machine/apps/manifest/manifest.test.ts:35:const FOLDERS: Folder[] = [
tests/server/machine/apps/manifest/manifest.test.ts:354:    ...FOLDERS.map(oneFolder),
tests/server/machine/runs/recover/answers/geo/listing.body:1:<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
tests/state/sources/clone.test.ts:23:    visibility: 'PUBLIC',
tests/fixtures/kinds.ts:20:const RETIRED_KINDS = ['deck'];
tests/fixtures/kinds.ts:58: * endpoint takes as a `store` body of an app and no `kind`, the `deck` kind of RETIRED_KINDS, and
tests/fixtures/kinds.ts:68:        ...new Set([...found, ...RETIRED_KINDS, FILES_KIND, APP_STORE, ...callerKinds()])
tests/data/sources/docs.test.ts:46:        plantFile(root, 'code/README.md', 'deposit root\n');
tests/views/shared/explorer/opening-apps.test.ts:23:const FOLDERS = ['/hub/.oculus/apps'];
tests/views/shared/explorer/opening-apps.test.ts:27:    inAppsFolder(FOLDERS, root === 'hub' ? '/hub' : '', path);
tests/routes/sessions/terminal-actions.test.ts:778:                '# WORKSPACE FOLDERS (no hub)',
tests/routes/git/clone.test.ts:288:                visibility: 'PUBLIC',
```

## The case-run programs

### `<scratchpad>/caserun/caserun.ts`

```ts
// Case-run program of step O63: plants each case's hubs in a temporary folder, runs the portfolio
// watcher's first build over them and prints the audit findings and config findings the case is
// about. Run: TREE=<tree> node caserun.ts [case numbers]
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const W = process.env.TREE!;
const { watchPortfolio } = await import(
    existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
        ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
        : `${W}/src/lib/server/root/watch/portfolio.ts`
);
const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);

const made: string[] = [];
function tmp(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    made.push(dir);
    return dir;
}
function plant(root: string, files: Record<string, string>, folders: string[] = []): void {
    for (const one of folders) mkdirSync(join(root, one), { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(dirname(join(root, rel)), { recursive: true });
        writeFileSync(join(root, rel), body);
    }
}
function manifest(fields: Record<string, unknown>): string {
    const base: Record<string, unknown> = { tier: 'research', lead: ['someone'], ...fields };
    return (
        Object.entries(base)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n') + '\n'
    );
}

type HubSpec = { name: string; config: string; files?: Record<string, string>; folders?: string[] };
type RepoSpec = { name: string; files: Record<string, string>; folders?: string[] };
type Spec = { hubs: HubSpec[]; repos?: RepoSpec[]; primary?: string | null };

const { config: engine } = loadConfig(engineDir());
const catalog = textCatalog(engine);
const UNRELATED = [
    'audit.msg_no_lead',
    'audit.msg_no_board',
    'audit.msg_missing_field',
    'audit.msg_no_venue',
    'audit.msg_docs_ahead',
    'audit.msg_collection_missing',
    'audit.msg_entry_no_status',
    'audit.msg_entry_no_title',
    'audit.msg_entry_no_date',
    'audit.msg_entry_related',
    'audit.msg_entry_link'
].map((key) => new RegExp(`^${String(catalog[key] ?? '').replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '.*')}$`));

function workspaceOf(state: string) {
    const noop = () => {};
    return { stateFolder: state, open: () => openWorkspace(state), subscribe: () => noop, changed: noop, close: noop };
}

function setUp(spec: Spec) {
    const base = tmp('o63-case-');
    const folders: { name: string; path: string }[] = [];
    for (const hub of spec.hubs) {
        const dir = join(base, hub.name);
        plant(dir, { '.oculus/config.yml': hub.config, ...(hub.files ?? {}) }, hub.folders ?? []);
        folders.push({ name: hub.name, path: dir });
    }
    for (const repo of spec.repos ?? []) {
        const dir = join(base, repo.name);
        plant(dir, repo.files, repo.folders ?? []);
        folders.push({ name: repo.name, path: dir });
    }
    const state = tmp('o63-state-');
    const primary = spec.primary === undefined ? spec.hubs[0]?.name : spec.primary;
    writeState(state, {
        open: null,
        recent: [],
        unsaved: { folders, ...(primary === null || primary === undefined ? {} : { primary }) }
    });
    return { base, state };
}

function watch(state: string, built?: () => void) {
    const channels = new Hub();
    const watcher = watchPortfolio(
        channels,
        {
            engine: engineDir(),
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => openWorkspace(state),
            settings: (dir: string) => loadConfig(engineDir(), { hub: dir }),
            problems: () => []
        },
        { debounce: 20, ...(built === undefined ? {} : { built }) }
    );
    return { channels, watcher };
}

function show(channels: InstanceType<typeof Hub>, base: string) {
    const audit = channels.latest('audit')?.payload as { findings: any[] };
    const config = channels.latest('config')?.payload as { findings: any[] };
    const strip = (text: string) => text.split(base).join('<case>');
    const rows = (audit?.findings ?? [])
        .filter((f) => f.kind !== 'todo' && f.kind !== 'readability')
        .filter((f) => f.message !== catalog['audit.msg_missing'])
        .filter((f) => !UNRELATED.some((pattern) => pattern.test(f.message)))
        .map((f) => `  audit ${f.hub} ${f.kind} scope=${strip(f.scope)} where=${f.where} file=${f.file}: ${f.message}`);
    const cfg = (config?.findings ?? [])
        .filter((f) => /audit|publications_file|publication_kinds|standard/.test(JSON.stringify(f)))
        .map((f) => `  config ${strip(String(f.file ?? ''))} key=${f.key}: ${f.message}`);
    return [...rows, ...cfg];
}

function run(label: string, spec: Spec): void {
    const { base, state } = setUp(spec);
    const { channels, watcher } = watch(state);
    watcher.close();
    const lines = show(channels, base);
    console.log(`${label}:${lines.length === 0 ? ' (nothing)' : ''}`);
    for (const line of lines) console.log(line);
}

const hubCfg = (audit: string) => (audit === '' ? '{}\n' : `audit:\n${audit}\n`);
const PROJ = (path: string, fields: Record<string, unknown>, extra: Record<string, string> = {}) => ({
    [`${path}/project.yml`]: manifest({ title: path.split('/').pop(), ...fields }),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [`${path}/${k}`, v]))
});
const KINDS_TODAY = `    kinds:
      - { kind: [thesis], forms: [thesis] }
      - { kind: [papers-in-review], stages: [submitted, revision] }
      - { kind: [papers-in-preparation], stages: [in-prep, submit-ready] }
      - { kind: [abandoned-papers], stages: [stopped] }
      - { kind: [abstracts], forms: [abstract] }
      - { kind: [posters], forms: [poster] }
      - { kind: [conference], forms: [conference] }
      - { kind: [journal, other-publications], forms: [journal] }
      - { kind: [abstracts, conference, journal, other-publications, posters, thesis] }`;

const cases: Record<number, () => Promise<void> | void> = {
    1: () =>
        run('1', {
            hubs: [
                {
                    name: 'hub',
                    config: '{}\n',
                    files: {
                        ...PROJ('projects/ideas/a', { stage: 'nascent', datasets: ['d1'] }, { 'code/main.py': 'x\n' }),
                        ...PROJ('projects/active/b', { stage: 'published', form: 'journal' }, { 'README.md': '# b\n' })
                    }
                }
            ]
        }),
    2: () => {
        run('2a README not_flags terminal', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md, stages: { not_flags: [terminal] } }]'), files: {
                ...PROJ('projects/ideas/nascent-no-readme', { stage: 'nascent' }),
                ...PROJ('projects/archive/published-no-readme', { stage: 'published' }),
                ...PROJ('projects/ideas/nascent-readme', { stage: 'nascent' }, { 'README.md': '# x\n' })
            } }]
        });
        run('2b NOTES words exploring', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: NOTES.md, stages: { words: [exploring] } }]'), files: {
                ...PROJ('projects/active/exploring-x', { stage: 'exploring' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/ideas/nascent-x', { stage: 'nascent' }, { 'README.md': '# x\n' })
            } }]
        });
        run('2c LICENSE every project', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: LICENSE }]'), files: {
                ...PROJ('projects/active/one', { stage: 'exploring' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/archive/two', { stage: 'published' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/archive/three', { stage: 'published' }, { 'README.md': '# x\n', LICENSE: 'MIT\n' })
            } }]
        });
        run('2d code/README.md live with code', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: code/README.md, stages: { flags: [live] }, folder: code }]'), files: {
                ...PROJ('projects/active/live-code', { stage: 'exploring' }, { 'README.md': '# x\n', 'code/main.py': 'x\n' }),
                ...PROJ('projects/active/live-nocode', { stage: 'exploring' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/ideas/nascent-code', { stage: 'nascent' }, { 'README.md': '# x\n', 'code/main.py': 'x\n' })
            } }]
        });
    },
    3: () =>
        run('3', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: code/README.md, folder: code }]'), files: {
                ...PROJ('projects/active/with-code', { stage: 'published' }, { 'README.md': '# x\n', 'code/main.py': 'x\n' }),
                ...PROJ('projects/active/no-code', { stage: 'published' }, { 'README.md': '# x\n' })
            } }],
            repos: [{ name: 'repo', files: { '.oculus/project.yml': manifest({ title: 'Repo', stage: 'published' }), 'README.md': '# r\n', 'code/main.py': 'x\n' } }]
        }),
    4: () =>
        run('4', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md, folders: [projects/manuscripts] }]'), files: {
                ...PROJ('projects/manuscripts/x', { stage: 'exploring' }),
                ...PROJ('projects/coauthor/y', { stage: 'exploring' })
            } }],
            repos: [{ name: 'repo', files: { '.oculus/project.yml': manifest({ title: 'Repo', stage: 'exploring' }) } }]
        }),
    5: () => {
        const cfg = hubCfg('  required_sections: [{ file: README.md, heading: "## Data", key: datasets }]');
        const rows: [string, Record<string, unknown>, string | null][] = [
            ['no-match', { datasets: ['d1'] }, '# x\n\nnothing\n'],
            ['data', { datasets: ['d1'] }, '# x\n\n## Data\n'],
            ['data-plus', { datasets: ['d1'] }, '# x\n\n## Data + reproduction\n'],
            ['database', { datasets: ['d1'] }, '# x\n\n## Database\n'],
            ['data-notes', { datasets: ['d1'] }, '# x\n\n### Data notes\n'],
            ['empty-list', { datasets: [] }, '# x\n'],
            ['no-key', {}, '# x\n']
        ];
        const files: Record<string, string> = {};
        for (const [name, fields, readme] of rows) Object.assign(files, PROJ(`projects/active/${name}`, { stage: 'exploring', ...fields }, readme === null ? {} : { 'README.md': readme }));
        run('5a datasets', { hubs: [{ name: 'hub', config: cfg, files }] });
        const cfg2 = hubCfg('  required_sections: [{ file: README.md, heading: "## Data", key: code_availability.status }]');
        const vals: [string, unknown][] = [
            ['deposited', { status: 'deposited' }],
            ['empty-status', { status: '' }],
            ['text-key', 'yes'],
            ['number', 3],
            ['true', true],
            ['false', false],
            ['map', { other: 1 }]
        ];
        const files2: Record<string, string> = {};
        for (const [name, value] of vals) {
            const fields = typeof value === 'object' && value !== null && 'status' in (value as object)
                ? { code_availability: value }
                : { code_availability: { status: value } };
            Object.assign(files2, PROJ(`projects/active/${name}`, { stage: 'exploring', ...fields }, { 'README.md': '# x\n' }));
        }
        run('5b code_availability.status', { hubs: [{ name: 'hub', config: cfg2, files: files2 }] });
        run('5c unparsed manifest', { hubs: [{ name: 'hub', config: cfg, files: { 'projects/active/broken/project.yml': 'title: [unclosed\n', 'projects/active/broken/README.md': '# x\n' } }] });
    },
    6: () =>
        run('6', {
            hubs: [{ name: 'hub', config: hubCfg('  required_sections: [{ file: README.md, heading: "## Data", key: datasets, folders: [projects/manuscripts, projects/archive] }]'), files: {
                ...PROJ('projects/coauthor/published/2025/x5', { stage: 'published', datasets: ['d1'] }),
                ...PROJ('projects/manuscripts/x6', { stage: 'exploring', datasets: ['d1'] })
            } }]
        }),
    7: () => {
        const feed = (section: string, list = 'papers', title = 'title') => `${section}:\n  ${list}:\n    - { ${title}: "A study of graph things" }\n`;
        const proj = PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'A study of graph things' }, { 'README.md': '# x\n' });
        const cfg = (list: string, title: string, kinds = KINDS_TODAY) => hubCfg(`  website:\n    file: site/pubs.yml\n    list: ${list}\n    title: ${title}\n${kinds}`);
        run('7a journal', { hubs: [{ name: 'hub', config: cfg('papers', 'title'), files: { ...proj, 'site/pubs.yml': feed('journal') } }] });
        run('7b thesis', { hubs: [{ name: 'hub', config: cfg('papers', 'title'), files: { ...proj, 'site/pubs.yml': feed('thesis') } }] });
        run('7c items/name journal', { hubs: [{ name: 'hub', config: cfg('items', 'name'), files: { ...proj, 'site/pubs.yml': feed('journal', 'items', 'name') } }] });
        run('7d items/name thesis', { hubs: [{ name: 'hub', config: cfg('items', 'name'), files: { ...proj, 'site/pubs.yml': feed('thesis', 'items', 'name') } }] });
        run('7e kinds articles', { hubs: [{ name: 'hub', config: cfg('papers', 'title', '    kinds: [{ kind: [articles], forms: [journal] }]'), files: { ...proj, 'site/pubs.yml': feed('journal') } }] });
    },
    8: () => {
        const cfg = hubCfg(`  website:\n    file: site/pubs.yml\n    list: papers\n    title: title\n${KINDS_TODAY}`);
        const proj = PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'A study of graph things' }, { 'README.md': '# x\n' });
        run('8a missing feed', { hubs: [{ name: 'hub', config: cfg, files: proj }] });
        run('8b unparsable feed', { hubs: [{ name: 'hub', config: cfg, files: { ...proj, 'site/pubs.yml': 'journal: [unclosed\n' } }] });
    },
    9: () => {
        const cfg = (file: string) => hubCfg(`  website:\n    file: ${file}\n    list: papers\n    title: title\n${KINDS_TODAY}`);
        run('9a second hub own feed', {
            hubs: [
                { name: 'hub', config: '{}\n', files: PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'Primary paper title words' }, { 'README.md': '# x\n' }) },
                { name: 'lab', config: cfg('site/pubs.yml'), files: { ...PROJ('projects/archive/q', { stage: 'published', form: 'journal', title: 'Lab paper about kernels' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Lab paper about kernels" }\n' } }
            ]
        });
        run('9b two hubs one feed each', {
            hubs: [
                { name: 'hub', config: cfg('site/pubs.yml'), files: { ...PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'Primary paper title words' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Primary paper title words" }\n' } },
                { name: 'lab', config: cfg('site/pubs.yml'), files: { ...PROJ('projects/archive/q', { stage: 'published', form: 'journal', title: 'Lab paper about kernels' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Lab paper about kernels" }\n' } }
            ]
        });
    },
    10: () => {
        const rows = (folder: string) => hubCfg(`  stage_folders: [{ stages: { words: [published] }, folders: [${folder}, projects/coauthor] }]`);
        const files = {
            ...PROJ('projects/active/x1', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/archive/published/x2', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/coauthor/published/2025/x3', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/archive/published-old/x4', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/active/y', { stage: 'submitted' }, { 'README.md': '# x\n' })
        };
        const repos = [{ name: 'repo', files: { '.oculus/project.yml': manifest({ title: 'Repo', stage: 'published' }), 'README.md': '# r\n' } }];
        run('10a', { hubs: [{ name: 'hub', config: rows('projects/archive/published'), files }], repos });
        run('10b trailing slash', { hubs: [{ name: 'hub', config: rows('projects/archive/published/'), files }], repos });
    },
    11: () =>
        run('11 personal', {
            hubs: [{
                name: 'hub',
                config: hubCfg(`  required_files: [{ file: README.md }, { file: code/README.md, folder: code }, { file: LICENSE, folders: [projects/active] }]
  required_sections: [{ file: README.md, heading: "## Data", key: datasets }]
  stage_folders: [{ stages: { words: [published] }, folders: [projects/archive] }]
  website:
    file: site/pubs.yml
    list: papers
    title: title
${KINDS_TODAY}`),
                files: {
                    ...PROJ('projects/active/mine', { tier: 'personal', stage: 'published', form: 'journal', title: 'Personal graph study', datasets: ['d1'] }, { 'code/main.py': 'x\n' }),
                    'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Personal graph study" }\n'
                }
            }]
        }),
    12: () =>
        run('12', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md }]'), files: PROJ('projects/active/x', { stage: 'exploring' }, { 'README.md': '# x\n', 'IDEA.md': '# idea\n', 'paper/main.tex': 'x\n' }) }]
        }),
    15: () => {
        const bad = `  required_files: [{ stages: { flags: [live] } }, { file: README.md }]
  required_sections: x
  website: { file: f }
  stage_folders: [{ stages: { words: [published] } }]
  colour: 1`;
        const files = PROJ('projects/active/x', { stage: 'exploring' });
        run('15a primary', { hubs: [{ name: 'hub', config: hubCfg(bad), files }] });
        run('15b second hub', { hubs: [{ name: 'hub', config: '{}\n' }, { name: 'lab', config: hubCfg(bad), files }] });
        run('15c no primary', { hubs: [{ name: 'lab', config: hubCfg(bad), files }], primary: null });
    },
    16: () =>
        run('16', {
            hubs: [{ name: 'hub', config: hubCfg('  website: { file: site/pubs.yml, list: papers, title: title, kinds: [] }'), files: { ...PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'A study of graph things' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Other paper entirely here" }\n' } }]
        }),
    17: () =>
        run('17', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md, stages: { not_flags: [terminal] } }]'), files: { 'projects/active/nostage/project.yml': manifest({ title: 'No stage' }) } }]
        })
};

const wanted = process.argv.slice(2).map(Number);
for (const [n, fn] of Object.entries(cases)) {
    if (wanted.length > 0 && !wanted.includes(Number(n))) continue;
    await fn();
}
for (const dir of made) rmSync(dir, { recursive: true, force: true });
```

### `<scratchpad>/caserun/caserun2.ts`

```ts
// Case-run program of step O63, cases 13, 14, 18 and 19. Run: TREE=<tree> node caserun2.ts [cases]
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const W = process.env.TREE!;
// The client state modules use Svelte's runes, which only the Svelte compiler defines; plain values
// stand in for them here, since the case reads the rows and drafts once and never reacts.
Object.assign(globalThis, {
    $state: (value: unknown) => value,
    $derived: (value: unknown) => value,
    $effect: () => {}
});
const portfolioPath = existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
    ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
    : `${W}/src/lib/server/root/watch/portfolio.ts`;
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);

const made: string[] = [];
function tmp(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    made.push(dir);
    return dir;
}
function plant(root: string, files: Record<string, string>, folders: string[] = []): void {
    for (const one of folders) mkdirSync(join(root, one), { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(dirname(join(root, rel)), { recursive: true });
        writeFileSync(join(root, rel), body);
    }
}
const ENGINE = engineDir();
const strip = (base: string, text: string) => text.split(base).join('<case>');

const HUB_REWRITE = readFileSync(new URL('./hub-audit.yml', import.meta.url), 'utf8');

const cases: Record<number, () => Promise<void> | void> = {
    13: () => {
        const hub = tmp('o63-13-');
        plant(hub, { '.oculus/config.yml': 'publications_file: x.yml\n' });
        const a = loadConfig(ENGINE, { hub }).findings.filter((f: any) => f.key === 'publications_file');
        console.log('13a hub publications_file:');
        for (const f of a) console.log(`  ${strip(hub, f.file)} key=${f.key}: ${f.message}`);
        if (a.length === 0) console.log('  (nothing)');
        const vocab = readFileSync(join(ENGINE, 'config/catalogs/vocab.yml'), 'utf8');
        const line = vocab.split('\n').find((one) => /^\s+exploring:\s*\{/.test(one)) ?? '';
        const withStandard = vocab.replace(line, line.replace(/\}\s*$/, ', standard: true }').replace(', standard: true, standard: true', ', standard: true'));
        const b = loadConfig(ENGINE, { instead: { name: 'catalogs/vocab.yml', text: withStandard, layer: 'engine' } })
            .findings.filter((f: any) => /standard/.test(`${f.key} ${f.message}`));
        console.log(`13b vocab stage row with standard: true (${line.trim().slice(0, 60)}...):`);
        for (const f of b) console.log(`  ${f.file.split('/config/')[1]} key=${f.key}: ${f.message}`);
        if (b.length === 0) console.log('  (nothing)');
        const ws = tmp('o63-13ws-');
        plant(ws, { 'w.yml': 'folders: []\nsettings:\n  audit:\n    required_files: [{ file: README.md }]\n' });
        const c = loadConfig(ENGINE, { workspace: { file: join(ws, 'w.yml') } }).findings.filter((f: any) => /audit/.test(`${f.key}`));
        console.log('13c workspace settings: audit:');
        for (const f of c) console.log(`  ${strip(ws, f.file)} key=${f.key}: ${f.message}`);
        if (c.length === 0) console.log('  (nothing)');
    },
    14: () => {
        const { config, findings } = loadConfig(ENGINE);
        const stages = config.stages as Record<string, Record<string, unknown>>;
        const flagged = Object.entries(stages).filter(([, row]) => row !== null && typeof row === 'object' && 'standard' in row).map(([k]) => k);
        console.log(`14: findings=${findings.length} publication_kinds=${'publication_kinds' in config ? 'present' : 'absent'} stages with standard=[${flagged.join(', ')}]`);
    },
    18: async () => {
        const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
        const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
        const { createChecker, checkDocument } = await import(`${W}/src/lib/data/snapshot/schema/check.ts`);
        const { schemaFor } = await import(`${W}/src/lib/data/snapshot/schema/set.ts`);
        const { withOwnSchemas } = await import(`${W}/src/lib/server/root/watch/build.ts`);
        const { catalogOf } = await import(`${W}/src/lib/data/sources/config/catalog/options.ts`);
        const { fileRows } = await import(`${W}/src/lib/state/system/config/rows.ts`);
        const hubAudit = 'audit:\n  required_files:\n    - { file: README.md, stages: { not_flags: [terminal] } }\n  stage_folders:\n    - { stages: { words: [published] }, folders: [projects/archive] }\n';
        // The Settings view's rows of behavior.yml over a hub that sets audit:.
        const hub = tmp('o63-18-');
        plant(hub, { '.oculus/config.yml': hubAudit });
        const { config } = loadConfig(ENGINE, { hub });
        const entries = catalogOf(config)['behavior.yml'] ?? {};
        const text = { text: hubAudit, truncated: false, error: '', loading: false };
        const { rows } = fileRows('behavior.yml', entries, config, { hubFile: { text, present: true }, workspace: null });
        const audit = rows.filter((row: any) => row.section === 'Audit checks');
        console.log(`18a rows of the section Audit checks: ${audit.length}`);
        for (const row of audit) {
            const fields = Object.entries(row.fields ?? {}).map(([name, spec]: [string, any]) => `${name}:${spec.control}`).join(' ');
            console.log(`  ${row.key} control=${row.control} own=${row.own} value=${JSON.stringify(row.value)}${fields === '' ? '' : ` fields=[${fields}]`}`);
        }
        const draftPath = `${W}/src/lib/state/system/config/editors/draft.ts`;
        const fieldsPath = `${W}/src/lib/state/system/config/editors/fields.ts`;
        const required = audit.find((row: any) => row.key === 'audit.required_files');
        if (required !== undefined) {
            const { draftOf, draftValue, applyEdit } = await import(draftPath);
            const fields = await import(fieldsPath);
            const draft = draftOf(required);
            console.log(`18b draft of audit.required_files: ${JSON.stringify(draft?.cards.map((card: any) => card.fields))}`);
            if (draft !== null && fields.fromBlock !== undefined) {
                const next = applyEdit(draft, { do: 'set', index: 0, field: 'stages', value: fields.fromBlock(draft.cards[0].fields.stages, 'words', ['exploring']) });
                const lists = { items: () => ({ state: 'ready', items: ['exploring', 'nascent', 'published', 'terminal', 'live'] }), labels: () => new Map(), groups: () => new Map(), folder: () => ({ state: 'ready', entries: [] }), config, hues: [], glyphs: [] };
                console.log(`18c the draft read back after adding words [exploring]: ${JSON.stringify(draftValue(next, required, lists))}`);
            }
        }
        // The editor's schema of the hub's .oculus/config.yml.
        const checker = createChecker();
        const schemas = withOwnSchemas(buildOneHub(hub, portfolioConfigFrom(config), 1, [], checker, null, 'hub').schemas);
        const name = schemaFor(schemas, 'hub', '.oculus/config.yml');
        const check = (label: string, body: string) => {
            const found = checkDocument({ name, file: '.oculus/config.yml', text: body }, schemas.texts, checker, portfolioConfigFrom(config).text);
            console.log(`${label}: ${found.length === 0 ? '(nothing)' : ''}`);
            for (const one of found) console.log(`  line ${one.line ?? 0}: ${one.message}`);
        };
        check('18d schema, stages: { word: [x] }', 'audit:\n  required_files: [{ file: README.md, stages: { word: [x] } }]\n');
        check('18e schema, the hub rewrite value', HUB_REWRITE);
    },
    19: async () => {
        const { watchPortfolio } = await import(portfolioPath);
        const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
        const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
        const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
        const catalog = textCatalog(loadConfig(ENGINE).config);
        const required = (file: string) => String(catalog['audit.msg_required_file']).replace('{0}', file);
        const base = tmp('o63-19-');
        const hub = join(base, 'hub');
        const repo = join(base, 'repo');
        const site = join(hub, 'site');
        const manifest = (title: string) => `tier: research\nstage: exploring\ntitle: ${title}\nlead: [someone]\n`;
        plant(hub, {
            '.oculus/config.yml': `scan:\n  - { dir: projects }\naudit:\n  required_files:\n    - { file: README.md }\n    - { file: code/LICENSE, folder: code }\n  website:\n    file: site/pubs.yml\n    list: papers\n    title: title\n    kinds: [{ kind: [journal] }]\n`,
            'projects/a/project.yml': manifest('Alpha').replace('stage: exploring', 'stage: published\nform: journal'),
            'projects/a/README.md': '# a\n',
            'projects/b/project.yml': manifest('Beta'),
            'projects/b/README.md': '# b\n',
            'projects/b/code/main.py': 'x\n'
        });
        plant(repo, { '.oculus/project.yml': manifest('Gamma'), 'README.md': '# r\n' });
        plant(site, { 'pubs.yml': 'journal:\n  papers:\n    - { title: "Alpha" }\n' });
        const state = tmp('o63-19s-');
        writeState(state, { open: null, recent: [], unsaved: { folders: [{ name: 'hub', path: hub }, { name: 'repo', path: repo }], primary: 'hub' } });
        let builds = 0;
        const channels = new Hub();
        const watcher = watchPortfolio(channels, {
            engine: ENGINE,
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => openWorkspace(state),
            settings: (dir: string) => loadConfig(ENGINE, { hub: dir }),
            problems: () => []
        }, { debounce: 50, built: () => { builds += 1; } });
        const findings = () => ((channels.latest('audit')?.payload as any)?.findings ?? []) as any[];
        const scopes = (message: string) => findings().filter((f) => f.message === message).map((f) => strip(base, f.scope)).sort();
        const waitBuild = async (from: number, label: string) => {
            const end = Date.now() + 6000;
            while (builds === from && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
            console.log(`  ${label}: ${builds > from ? 'rebuilt' : 'NO REBUILD within 6 s'}`);
        };
        await new Promise((r) => setTimeout(r, 400));
        console.log(`19 start: website findings: ${findings().filter((f) => f.kind === 'publink').map((f) => f.message).join(' | ') || '(none)'}`);
        console.log(`19 start: README.md missing for [${scopes(required('README.md')).join(', ')}], code/LICENSE missing for [${scopes(required('code/LICENSE')).join(', ')}]`);
        let at = builds;
        unlinkSync(join(hub, 'projects/a/README.md'));
        await waitBuild(at, 'README.md of projects/a removed');
        console.log(`    README.md missing for [${scopes(required('README.md')).join(', ')}]`);
        at = builds;
        writeFileSync(join(hub, 'projects/b/code/LICENSE'), 'MIT\n');
        await waitBuild(at, 'code/LICENSE of projects/b created');
        console.log(`    code/LICENSE missing for [${scopes(required('code/LICENSE')).join(', ')}]`);
        at = builds;
        writeFileSync(join(site, 'pubs.yml'), 'thesis:\n  papers:\n    - { title: "Alpha" }\n');
        await waitBuild(at, 'feed outside every scan folder edited');
        console.log(`    website findings: ${findings().filter((f) => f.kind === 'publink').map((f) => f.message).join(' | ') || '(none)'}`);
        at = builds;
        unlinkSync(join(repo, 'README.md'));
        await waitBuild(at, 'README.md of the repository removed');
        console.log(`    README.md missing for [${scopes(required('README.md')).join(', ')}]`);
        watcher.close();
    }
};

const wanted = process.argv.slice(2).map(Number);
for (const [n, fn] of Object.entries(cases)) {
    if (wanted.length > 0 && !wanted.includes(Number(n))) continue;
    await fn();
}
for (const dir of made) rmSync(dir, { recursive: true, force: true });
process.exit(0);
```

### `<scratchpad>/caserun/caserun3.ts` (repair round 1, items 2, 7 and 8)

```ts
// Case-run program of step O63, repair round 1: items 2, 7 and 8. Plants each case's hub in a
// temporary folder, runs the portfolio watcher over it and prints what the item asks for.
// Run: TREE=<tree> node caserun3.ts [cases]
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const W = process.env.TREE!;
const portfolioPath = existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
    ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
    : `${W}/src/lib/server/root/watch/portfolio.ts`;
const { watchPortfolio } = await import(portfolioPath);
const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
const ENGINE = engineDir();

const made: string[] = [];
function tmp(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    made.push(dir);
    return dir;
}
function plant(root: string, files: Record<string, string>): void {
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(dirname(join(root, rel)), { recursive: true });
        writeFileSync(join(root, rel), body);
    }
}
const manifest = (title: string, stage: string) =>
    `tier: research\nstage: ${stage}\nform: journal\ntitle: ${title}\nlead: [someone]\n`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A watcher over the hub (and the repository when given), with a count of its rebuilds. */
function watched(hub: string, repo?: string) {
    const state = tmp('o63-r1s-');
    const folders = [{ name: 'hub', path: hub }, ...(repo === undefined ? [] : [{ name: 'repo', path: repo }])];
    writeState(state, { open: null, recent: [], unsaved: { folders, primary: 'hub' } });
    const channels = new Hub();
    const counter = { builds: 0 };
    const watcher = watchPortfolio(
        channels,
        {
            engine: ENGINE,
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => openWorkspace(state),
            settings: (dir: string) => loadConfig(ENGINE, { hub: dir }),
            problems: () => []
        },
        { debounce: 50, built: () => { counter.builds += 1; } }
    );
    const findings = () => ((channels.latest('audit')?.payload as any)?.findings ?? []) as any[];
    const waitBuild = async (label: string, change: () => void) => {
        await sleep(300);
        const from = counter.builds;
        change();
        const end = Date.now() + 4000;
        while (counter.builds === from && Date.now() < end) await sleep(50);
        console.log(`  ${label}: ${counter.builds > from ? 'rebuilt' : 'NO REBUILD within 4 s'}`);
    };
    return { watcher, findings, waitBuild };
}

const site = (title: string, section: string) => `${section}:\n  papers:\n    - { title: "${title}" }\n`;
const website = (file: string) =>
    `audit:\n  website:\n    file: ${file}\n    list: papers\n    title: title\n    kinds: [{ kind: [journal] }]\n`;

const cases: Record<string, () => Promise<void>> = {
    'r2': async () => {
        console.log('r2 a project at the dead-end stage stopped, shown on the feed:');
        const hub = tmp('o63-r2-');
        plant(hub, {
            '.oculus/config.yml': `scan:\n  - { dir: projects }\n${website('site/pubs.yml')}`,
            'projects/x/project.yml': manifest('A dropped study of things', 'stopped'),
            'site/pubs.yml': site('A dropped study of things', 'journal')
        });
        const { watcher, findings } = watched(hub);
        await sleep(300);
        for (const f of findings().filter((one) => one.kind === 'publink')) console.log(`  ${f.scope} | ${f.message}`);
        watcher.close();
    },
    'r7a': async () => {
        console.log('r7a the feed renamed in audit.website.file:');
        const hub = tmp('o63-r7a-');
        plant(hub, {
            '.oculus/config.yml': `scan:\n  - { dir: projects }\n${website('site/pubs.yml')}`,
            'projects/x/project.yml': manifest('Alpha', 'published'),
            'site/pubs.yml': site('Alpha', 'journal'),
            'other/pubs.yml': site('Alpha', 'journal')
        });
        const { watcher, waitBuild } = watched(hub);
        await waitBuild('the old feed site/pubs.yml edited while named', () =>
            writeFileSync(join(hub, 'site/pubs.yml'), site('Alpha', 'thesis')));
        await waitBuild('audit.website.file changed to other/pubs.yml', () =>
            writeFileSync(join(hub, '.oculus/config.yml'), `scan:\n  - { dir: projects }\n${website('other/pubs.yml')}`));
        await waitBuild('the old feed site/pubs.yml edited', () =>
            writeFileSync(join(hub, 'site/pubs.yml'), site('Alpha', 'journal')));
        await waitBuild('the new feed other/pubs.yml edited', () =>
            writeFileSync(join(hub, 'other/pubs.yml'), site('Alpha', 'thesis')));
        watcher.close();
    },
    'r7b': async () => {
        console.log('r7b the feed folder removed and made again:');
        const hub = tmp('o63-r7b-');
        plant(hub, {
            '.oculus/config.yml': `scan:\n  - { dir: projects }\n${website('site/data/pubs.yml')}`,
            'projects/x/project.yml': manifest('Alpha', 'published'),
            'site/data/pubs.yml': site('Alpha', 'journal')
        });
        const { watcher, findings, waitBuild } = watched(hub);
        await waitBuild('the feed folder site/data removed', () =>
            rmSync(join(hub, 'site/data'), { recursive: true, force: true }));
        await waitBuild('the feed folder made again with the feed', () =>
            plant(hub, { 'site/data/pubs.yml': site('Alpha', 'journal') }));
        await waitBuild('the feed edited', () =>
            writeFileSync(join(hub, 'site/data/pubs.yml'), site('Alpha', 'thesis')));
        console.log(`    website findings: ${findings().filter((f) => f.kind === 'publink').map((f) => f.message).join(' | ') || '(none)'}`);
        await waitBuild('the feed edited again', () =>
            writeFileSync(join(hub, 'site/data/pubs.yml'), site('Alpha', 'journal')));
        console.log(`    website findings: ${findings().filter((f) => f.kind === 'publink').map((f) => f.message).join(' | ') || '(none)'}`);
        await waitBuild('the folder site renamed away and back', () => {
            renameSync(join(hub, 'site'), join(hub, 'site-moved'));
            renameSync(join(hub, 'site-moved'), join(hub, 'site'));
        });
        await waitBuild('the feed edited after the rename', () =>
            writeFileSync(join(hub, 'site/data/pubs.yml'), site('Alpha', 'thesis')));
        watcher.close();
    },
    'r8': async () => {
        console.log('r8 required_sections over a workspace repository project:');
        const hub = tmp('o63-r8-');
        const repo = tmp('o63-r8r-');
        plant(hub, {
            '.oculus/config.yml': `scan:\n  - { dir: projects }\naudit:\n  required_sections:\n    - { file: README.md, heading: "## Data", key: datasets }\n`
        });
        plant(repo, { '.oculus/project.yml': `${manifest('Gamma', 'exploring')}datasets: [d1]\n` });
        const { watcher, findings } = watched(hub, repo);
        await sleep(300);
        const shown = findings().filter((f) => f.kind === 'data' && f.message.includes('heading'));
        for (const f of shown) console.log(`  ${f.scope} | ${f.where} | ${f.message}`);
        if (shown.length === 0) console.log('  (no section finding)');
        watcher.close();
    }
};

const wanted = process.argv.slice(2);
for (const [name, fn] of Object.entries(cases)) {
    if (wanted.length > 0 && !wanted.includes(name)) continue;
    await fn();
}
for (const dir of made) rmSync(dir, { recursive: true, force: true });
process.exit(0);
```

### `<scratchpad>/caserun/hubrun.ts`

```ts
// The audit of a copy of the research hub, the hub alone in the workspace and its primary, by the
// tree TREE names. Prints one line per finding, sorted. Run: TREE=<tree> HUB=<copy> node hubrun.ts
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const W = process.env.TREE!;
const HUB = process.env.HUB!;
const { watchPortfolio } = await import(
    existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
        ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
        : `${W}/src/lib/server/root/watch/portfolio.ts`
);
const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);

const state = mkdtempSync(join(tmpdir(), 'o63-hubrun-'));
writeState(state, { open: null, recent: [], unsaved: { folders: [{ name: 'research-hub', path: HUB }], primary: 'research-hub' } });
const channels = new Hub();
const watcher = watchPortfolio(
    channels,
    {
        engine: engineDir(),
        icons: { set: {} },
        host: { name: 'test', address: '127.0.0.1' },
        open: () => openWorkspace(state),
        settings: (dir: string) => loadConfig(engineDir(), { hub: dir }),
        problems: () => []
    },
    { debounce: 20 }
);
watcher.close();
const audit = channels.latest('audit')?.payload as { findings: any[] };
const config = channels.latest('config')?.payload as { findings: any[] };
const lines = (audit?.findings ?? []).map((f) => `audit ${f.kind} | ${f.scope} | ${f.where} | ${f.message}`);
const cfg = (config?.findings ?? [])
    .filter((f) => String(f.file ?? '').startsWith(HUB))
    .map((f) => `config | ${String(f.file).slice(HUB.length + 1)} | ${f.key} | ${f.message}`);
for (const line of [...lines, ...cfg].sort()) console.log(line);
rmSync(state, { recursive: true, force: true });
process.exit(0);
```

### `<scratchpad>/caserun/paragraphs.py` (lists the paragraphs read for verify 7)

```python
# Prints every comment paragraph of the worktree that holds a line the step added or changed,
# with its path and first line, for reading. Run from the worktree root.
import re, subprocess, sys
ROOT = '.'
files = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=AM'], capture_output=True, text=True).stdout.split()
new = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard'], capture_output=True, text=True).stdout.split()
files = [f for f in files + new if not f.startswith('.scratch') and not f.startswith('docs/diagrams') and re.search(r'\.(ts|svelte|yml|js|mjs)$', f)]
def touched(f):
    if f in new: return None
    out = subprocess.run(['git', 'diff', '-U0', '--', f], capture_output=True, text=True).stdout
    lines = set()
    for m in re.finditer(r'^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@', out, re.M):
        a = int(m.group(1)); n = int(m.group(2) or '1')
        lines.update(range(a, a + n))
    return lines
COMMENT = re.compile(r'^\s*(//|\*(?!/)|/\*\*|#)')
count = 0
for f in files:
    t = touched(f)
    text = open(f).read().split('\n')
    i = 0
    while i < len(text):
        if COMMENT.match(text[i]) and not re.match(r'^\s*(//|\*|#)\s*$', text[i]) and not re.match(r'^\s*/\*\*\s*$', text[i]):
            j = i
            while j + 1 < len(text) and COMMENT.match(text[j + 1]) and not re.match(r'^\s*(//|\*|#)\s*$', text[j + 1]) and not text[j+1].strip().startswith('*/'):
                j += 1
            if t is None or any(k in t for k in range(i + 1, j + 2)):
                count += 1
                print(f'=== {f}:{i + 1}')
                for k in range(i, j + 1): print(f'{len(text[k]):3d} {text[k]}')
            i = j + 1
        else:
            i += 1
print('paragraphs', count, file=sys.stderr)
```
