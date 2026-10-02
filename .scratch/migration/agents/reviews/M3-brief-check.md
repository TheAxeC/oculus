# M3 brief check

BRIEF CHECK OF M3 (resources registry). Read-only: no file written, no git command that changes state, no skill, no agent, no URL, no port. Base: main at 3dc0b879, brief on disk (169 lines).

Disclosure first: one command of mine, `grep -rn "max_lines\|maxLines\|900" config/*.yml | grep -v local.yml | head`, had a glob that included `config/local.yml`. Its output went through `grep -v local.yml`, so nothing from that file was printed or used. Every other grep over `config/` was `git grep` with `':!config/local.yml'` (git ignores the file) or named files.

Note on the plan: `plan.md` has no "Goal" section (its sections are Packages, Could run in parallel, Rulings, Blocked). I used the goal from the task text: one registry of compute resources that manifests and the Live HPC poller name by key.

Findings that need the brief changed before dispatch, in short: N4, N1 and N2 (paths and names the brief misses), P1 (line-count limit of tests), C1 and C2 (two cases the code contradicts), Q2 and I (the item 8 design gaps and untrusted host), X (the spec's rule on writing hub data), and S1 (D18 moves the HPC text file).

## Names

Grep command family: `git grep -n <names> -- . ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch' ':!projects' ':!.agents'` over the whole repository, plus `grep -rln ... src`.

N1. `src/routes/api/(machine)/hpc/+server.ts:12` (not in "Paths this step writes"; the brief's grep misses it). It reads `host: locals.server.local.hpcHost ?? slurmSettings(locals.config().config).host` and hands that host to `handleHpc` for the cancel and log actions (`routes.ts:27-28`, `actions.ts:39,55` run `ssh <host> ...`). After `SlurmSettings.host` becomes `resource` this line no longer type-checks and, once fixed naively, would resolve a different host from the poller's. The brief's path rule is `grep -rn "\.compute\b\|slurm\.host\|SlurmSettings" src`; the file uses lower-case `slurmSettings(` and is not in its output:
`grep -rln "\.compute\b\|slurm\.host\|SlurmSettings" src` printed poll.ts, live-settings.ts, context.ts, forms/schema.ts, facets.ts, items.ts, normalise.ts, settings.ts, config.ts, ProjectCard.svelte. The brief says nothing about what the cancel and log actions do when the host is `''` (they would run `ssh '' scancel N`).

N2. `src/lib/views/boards/projects/Projects.svelte:88`: `filterGroups(facets(items, preset), held.filters, preset)`. `facets(items, preset)`, `orderValues(facet, counts, preset)` and `valueLabel(facet, value)` (`facets.ts:95,69`, `filter-menu.ts:73`) take no snapshot, so item 5's "entry's name" and "registry's order" cannot reach them unless the item carries them or a signature gains a parameter. Either way a file outside the Paths list may change (Projects.svelte if the signature changes; none if items carry names). Not in Paths.

N3. "Seven registries" counts the change makes false, outside the brief's single mention (`registries.ts:1`):
- `src/lib/data/sources/registries.ts:19` ("The seven hub-relative paths") and `:122` ("Read the seven registries")
- `src/lib/data/model/model-entities.ts:19` ("The seven registries") and `:24` ("The seven hub-relative registry paths")
- `src/lib/state/forms/schema.ts:5` ("one of the seven registries"; the file is in Paths, the line is not named)
- `tests/data/demo-hub.test.ts:7` and `:48` (title "holds the seven registries"); the test still passes because it lists seven names, but its title and head comment become false once `demo/registries/resources.yml` exists.
Command: `grep -rniE "seven (registr|hub-relative|file)|seven registry" src tests config DESIGN.md HELP.md README.md docs`. `state/boards/collection.ts:147,283` say "the seven files" about collection files and stay true.

N4. `config/catalogs/manifest-schema.yml:16-17`: the comment "`from:` names where the choices come from: a registry (venues, pillars, funding, datasets, domains), `people`, `organisations`, `projects`, or a vocabulary key" becomes incomplete with `from: resources`. The brief limits this file to line 68.

N5. `DESIGN.md:240` says "every config push hands them the settings read again through live-settings.ts"; after item 8 a portfolio rebuild also hands the poller its host. `DESIGN.md:132` (the Live HPC paragraph) never says where the host comes from. The brief writes DESIGN.md only at line 401.

N6. Cockpit text catalogs: `tools/cockpit/data/config/text.yml:388-390,447,449` and the dummy twin `tools/cockpit/dummy/data/config/text.yml:377-379,436,438` (`board.compute_hpc`, `compute_local`, `compute_none`, `cards.hpc_label`, `cards.local_label`). After item 11 rewrites `page.py:199` and `cards.py:150-153`, the first four have no reader. The cockpit's text gate (`selftest.py:735-770`) only fails a used-but-missing key, so nothing fails; the keys stay as dead entries. Neither file is in Paths. Also `tools/cockpit/data/config/manifest-schema.yml:59` (`compute: { label: "Compute" }`) is label-only and stays true.

N7. Other hits of the listed names, checked, none made false: `hpc_glyph` at `config/text/views/system/hpc.yml:74` and `Hpc.svelte:8` is `views.hpc_glyph`, a different key from `project.card.hpc_glyph`; `WatchOptions` is imported by `tests/server/root/watch/portfolio/start.ts:10,50` (an optional field added is compatible); `HpcOptions` by `context.ts:61,194` and `tests/server/machine/hpc/poll-live.test.ts:11,59`; `RegistryName`/`RegistryFiles` by `tests/data/real-hub.probe.ts:17,21`, `validate.test.ts:14,67,684`, `normalise.test.ts:22,54`, `validate-shapes.test.ts:16,20,64,96`, `build-timing.test.ts`; `COMPUTE_VALUES` only in `presets.ts:229` and `facets.ts:7,73`.

N8. Tests using the old slurm host in forms the brief's grep (`slurm.host\|host: 'cluster'`) does not find: inline `slurm: { host: ... }` or `blockWith('slurm', { host: 'other' })` at `tests/checks/config/options-catalog.test.ts:44`, `tests/server/root/context-fixture.ts:140`, `tests/server/root/context.test.ts:351-352,586,608,611,617`, `tests/state/system/settings/search.test.ts:62`, `write.test.ts:42`, `rows.test.ts:151,292`. All are under `tests/` (covered by the blanket path), but verify command 4 (`grep -rn "slurm\.host\|COMPUTE_VALUES\|compute_hpc\|compute_local"`) would print nothing while such `host:` fixtures remain. It also lacks `--exclude=local.yml`, which the configuration requires for every grep over `config/`.

N9. Relation tables: `Relations` (`model/index.ts:166-179`) lists one table per relation; 22 test files build it by hand with `projectDataset: []` (`git grep -l "projectDataset" -- tests` lists 22). If item 3's join table is built, `projectResource` joins `Relations` and every one of those fixtures changes; the brief names `model/index.ts` only for `entities`. See C1: the join table should not be built.

N10. Files the step writes that D18, X3a or Q88c also write, which brief line 24 omits (checked against the "Paths this step writes" blocks of the three briefs): D18: `config/text/views/system/hpc.yml`, `tests/server/root/context.test.ts`, `context-fixture.ts`, `config/behavior.yml`, `tests/checks/config/config-folder.test.ts`, `options-catalog.test.ts`. X3a: `config/behavior.yml`, `config-folder.test.ts`. Q88c: `config-folder.test.ts`. See S1 for the hpc.yml move.

## The step line

Step line `plan.md:402`: registry of clusters, machines, storage; entry `{ key, name, kind, host, access, links }`; `slurm.resource: <key>` in place of `slurm.host`; a manifest's `compute:` a list of entry keys. Ruling `plan.md:622` adds that `slurm.resource` names the cluster. Rulings Z248, Z249, Z250 (`plan.md:863-865`).

Mapping:
- registry of the three kinds and the six fields: item 1 (schema list, Decision 1 seeds), items 2 and 3 (reader, `Resource` type).
- `slurm.resource` in place of `slurm.host`: item 8 (`behavior.yml`, `slurmSettings`, `SlurmSettings.resource`), item 9 (options entries).
- `slurm.resource` names the cluster: item 8 (entry must be of kind `cluster` with a host).
- `compute:` a list of keys: item 3 (`resourceIds`), item 4 (validator), items 5 to 7 (board, card, form), item 10 (17 manifests), item 11 (cockpit).
- Z248: Decision 1 and item 10. Z249: items 5 to 7. Z250: item 8, all four resolution moments (start, config push, `hostChanged()`, after each portfolio rebuild) are present.

Part with no item: none. Items without a plan-line part: 11 (cockpit) and 12 (tests, docs), both needed by the manifest change.

Two parts of the step line are served only partly: the kind `storage` and the fields `access` and `links` are read into the model but nothing draws or checks them (same as `organisations.links`); that is what the ruling asked for, so it is not a finding, only a statement.

## Premises

Reran the brief's "What is on the tree".
- P0. Confirmed: registries 9 files and demo 8 (`ls registries tools/oculus/demo/registries`); 17 manifests (`grep -rnE '^compute:' projects --include=project.yml | wc -l` prints 17; `hpc` x9 and `local` x8, as listed); `grep -rln organisations tests | wc -l` prints 32; folder counts by `git ls-tree --name-only HEAD <dir>/ | wc -l`: registries 9, demo/registries 8, src/lib/data/sources 10, tests/data/sources 10, snapshot 7, tests/data/snapshot 4, server/root 9, tests/server/root 10; `wc -l`: validate.ts 851, normalise.ts 778, context.ts 878; no demo manifest has compute (only `sparse-attention/project.yml:10`, a status line); line numbers `registries.ts:23-31`, `data/index.ts:140`, `model/index.ts:154`, `normalise.ts:102,709,720,769`, `validate.ts:64,73,774,837-840`, `sources.yml:47`, `schema.ts:180`, `context.ts:396,498,512,513,835`, `live-settings.ts:79,116-123,209-217`, `poll.ts:22,125,164,320`, `portfolio.ts:563,613`, `channels.ts:59`, `options.yml:218-221,603-604`, `settings.ts:87-98`, cockpit `page.py:199,226`, `cards.py:150-153,193`, `02-views.js:443`, `schema.py:94`, `config.py:152`. Both ADR folders absent.
- P1. Wrong line numbers: `registries.ts` SHAPES is `:38-46` (brief `:37-45`) and NAMES `:48-56` (brief `:47-55`); `validate.ts` REFERENCES starts at `:87` (brief `:90`), SHAPES `:132` (brief `:133`).
- P2. Wrong locations in the board premise (line 19): the item's value `[item.compute === '' ? NONE : item.compute]` is `facets.ts:34`, not `:73-74`; `:73` is `COMPUTE_VALUES.filter(has)`. `COMPUTE_VALUES` is not in `filter-menu.ts` at all (`filter-menu.ts:47` is `board.facet_compute`); it is defined at `presets.ts:229` (`:85` is the field `compute: string;`). Item 5 therefore sends the ordering change to `filter-menu.ts`, where it does not live; it lives in `facets.ts:orderValues`.
- P3. `poll.ts:108-118` is the definition of `degraded`; the `'unreachable'` publish is at `:170` and `:205`. Harmless.
- P4. Size limit: the brief says 900. `utils/size-check.sh:29` (`$1 > 900 || (.svelte && $1 > 540)`) and `tests/checks/tree/size.test.ts:28` (`LINES = 900`) agree. `agents/spec.md` says "One source file under 1000 lines", and the state file's verify note also says 1000. The brief's 900 is right; the spec text is stale. The same limit applies to files under `tests/`: see P5.
- P5. Test file sizes against 900 (not in the brief): `wc -l` prints `tests/server/root/context.test.ts` 871, `context-reload.test.ts` 808, `tests/data/snapshot/normalise.test.ts` 867, `validate.test.ts` 780. `tests/server/root/` holds 10 items (full), so no new test file can go there. Cases 11 to 18 (about eight cases of the host resolution, in flight, after close, superseded) must go into `context.test.ts` (29 lines of room), `context-reload.test.ts` (92 lines) or a folder the brief does not name. The brief's statement "No new source or test file is needed in a full folder" holds only for the registry reader; it does not hold for item 8's tests, and the folder list also omits full folders: `tests/state/boards/board` (10), `tests/views/boards` (10), `tests/server/root/watch` (10), `tests/data/sources/config` (10), `src/lib/data/sources/config` (10).
- P6. `tools/oculus/demo/registries/resources.yml` invented entries `demo-cluster` and `laptop` are named by no manifest and by no setting; `behavior.yml` `slurm.resource: utwente` resolves to nothing in the demo hub (see Implied inputs I9).

## Cases and checks

Read against `agents/spec.md` and the code.

C1. Case 6 ("`compute: [utwente, data]`: two tags in that order, the glyph on the first only") contradicts item 3 ("keeps the known keys through a join table as `datasetIds` does"). In `normalise.ts:135-145`, `pairs()` dedupes and sorts by `(from, to)`, and `targets()` (`:148`) returns that order: `[data, utwente]`. The join-table route therefore puts the glyph on the second tag and also reorders the manifest's list. Item 3's own words ("in the manifest's order") need a plain filter of the manifest's keys by the known set, with no join table (nothing reads a back-reference `Resource.projectIds`), which also removes N9. Expected result of the case once decided: `resourceIds` is `['utwente','data']`; a duplicate key `[utwente, utwente]` gives `['utwente']` (an each-block keyed by the key throws on a duplicate).

C2. Case 19 ("keys present in the order this-mac, utwente in the registry ... the menu lists This Mac, UTwente HPC") cannot test the stated order. `byId()` (`normalise.ts:127-133`) inserts into `entities.resources` sorted by id, so `Object.keys(entities.resources)` is alphabetical, and `this-mac` < `utwente` alphabetically: the case passes with an alphabetical order and with a registry order alike. It also contradicts Decision 1, whose file order is `utwente, this-mac, data` (`Resource` carries no order field). Either the model keeps the file position (a field or an ordered array) and the case uses a file order that differs from the alphabetical one (for example `utwente` before `this-mac`), or the brief says "alphabetical by key" and the case is dropped.

C3. Item 5 and cases 5, 6, 19: `BoardItem.compute: string[]` (item 5) holds keys only, but item 6 needs the entry's name and kind per tag, and the facet needs names (`facets.ts` has no snapshot). `itemOf()` (`items.ts:77`) has the snapshot and builds `datasets: BoardTag[]` as `tag(id, id)`, so the natural carrier is an item field with `{ id, label, kind }` per key. As written, the case results cannot be produced from `string[]`.

C4. Case 2 ("an entry kind: gpu ... `x` is not in the entities") and item 3 ("an entry whose kind is none of the three words is left out"): `organisation()` (`normalise.ts:438-448`) keeps the entry with `kind: str(entry.kind)`; the brief's `Resource.kind` union forces a different treatment and then `idSets()` (`validate.ts:764-767`) still holds `x` from the raw entries. A manifest naming `x` gets no `no_resource` finding and `x` silently vanishes from `resourceIds`. No case covers that.

C5. Case 3 and `checkOrganisations` (`validate.ts:633-634`: `if (kind === undefined) return;`): the schema marks `kind` required, but copying the organisations check gives no finding for an entry with no `kind:`, and item 3 then drops the entry. Expected result missing from the cases (see Implied inputs I3).

C6. Case 4, 8, 9 check against the code: case 4 matches `readYamlMap`/`file_missing`; case 8 matches (`strings('hpc')` is `[]` at `guards.ts:67`, and `readOr(idsShape, 'hpc', [])` adds no second finding); case 9 for `compute: []` matches, but a bare `compute:` (YAML null) becomes a finding under `{ field: 'compute', kind: 'list', nullable: false }` (`checkShapes`, `validate.ts:326-338`), where today `str(null)` is silent. Not in the cases.

C7. Case 13 to 15 sentence count: item 8 lists three sentences. A fourth is needed for a host that cannot be passed to ssh (I1 below).

C8. Case 17/18 messages: `settingOf(..., 'slurm', 'resource', ...)` gives `config/behavior.yml: slurm.resource must be a non-empty string`; consistent with `settings.test.ts:75,89` today.

C9. Status word `unreachable` exists in `HpcStatus` (poll.ts uses it at `:170,205`), so the wire vocabulary does not change, as Decision 3 says. The HPC view draws every non-ok status as `Cluster unreachable - on UT network / EduVPN?` followed by the hint in code (`Hpc.svelte:52-55`, `hpc.yml:68-69`), so a configuration sentence is shown after the VPN question, and the footer prints `t('hpc.footer', data.host)` with an empty host. The brief's "the HPC view shows the sentence" is true but the view's first line misleads for a configuration cause; the brief does not decide it.

C10. Verification list items against the code: command 3 (`grep -rnE '^compute: *(hpc|local)'` empty and count 17) passes with every manifest mapped to `[utwente]`; command 4 does not find `host:` under `slurm:` (N8) or the unread `hpc_label`/`local_label`; command 5 only parses YAML; command 2 (cockpit selftest) cannot reach the compute rendering on the dummy hub (no manifest there has `compute`).

## The question

For each case, check and item: could it pass without "one registry that manifests and the Live HPC poller name by key"?
- Items 1 to 3 and case 1 (registry, reader, model): yes, they pass with nothing reading the registry; they serve the goal only together with items 4 to 8. Not a defect.
- Item 4, cases 2, 3, 7, 8: no for the manifest side; they fail if the validator has no `compute` row.
- Items 5 and 6, cases 5, 6, 7, 9, 19: yes for 6 and 19 as written (C1, C2): a build that sorts keys alphabetically puts the glyph and the menu in an order the case does not detect. Case 5 passes if the tag label is the key rather than the name unless the test asserts "UTwente HPC" text.
- Item 7, case 10: no (the chips field fails if `resources` is not in `choicesFor`). `tests/state/forms/schema.test.ts:223` (`choicesOf('compute')` returns the literal list) changes.
- Item 8, cases 11 to 16: yes for case 16 if the portfolio watcher is a fake. `context.test.ts` and the fixture replace `watchPortfolio` with `() => ({ close })` (`context-fixture.ts:181`, `context.test.ts:40`); a test that calls the `built` option by hand proves nothing about `watchPortfolio` calling it after the real publish. A test over the real `watchPortfolio` (`tests/server/root/watch/portfolio/`, 5 items, room) with a registry file edit and an observed `built` call is the only form that fails without the fix.
- Item 8, cases 13 to 15: no ssh runs. A test with a mock `Runner` that fails if called proves it; one that only checks the payload's hint does not (the poller could still spawn ssh and ignore the result).
- Item 10, verify 3: yes (above).
- Item 11, case 20: yes. `build.py --selftest` and `--dummy` pass with no compute rendering, because the dummy hub has no `compute:` key and the selftest asserts no badge. Nothing in the brief asserts that `compute: [utwente]` draws `cb-hpc` or filters under `utwente`; the case needs a hub-side assertion or the look. The cockpit has its own test script (`bash tools/cockpit/tests/run.sh`, named in the hub CLAUDE.md "Verify before done") that the brief does not list.
- Verify 4: yes (N8).

## Implied inputs

Missing from "Cases", with the expected result I propose (the brief must rule on each):
- I1. Registry `host` that is not safe as an ssh argument (leading `-`, for example `-oProxyCommand=...`; whitespace; control characters). The host now comes from hub data (`registries/resources.yml`), which `agents/spec.md` calls untrusted when it reaches a shell, and `run()` (`ssh.ts:32`) is `spawn('ssh', [...OPTIONS, host, remote])` with no `--`. Previously the host came from machine config. Expected: no ssh, status `unreachable`, a fourth sentence naming the key ("the cluster X has an unusable host"); `ssh.ts` is not in Paths, so the check belongs in the resolver (`live-settings.ts`) and a `--` is not available without widening Paths. `hpc_host` of `local.yml` is machine-owned and unchanged.
- I2. Malformed or unparseable `registries/resources.yml`: same as case 4 plus the parse finding. Duplicate `key:` in the registry: not defined for any registry today (`byId` keeps one, `readRegistry` adds no finding); `agents/spec.md` requires "empty, duplicated, and colliding with a configured or reserved key" for every key a package introduces. Expected needs a ruling (finding, or documented first/last wins); the host resolver must not pick differently from the entity map.
- I3. Entry with no `kind:`, or `host:`/`name:` not a string, or `links:` not a list: `strings()` gives `[]` for links with no finding (as for organisations); missing `kind` (C5); a non-string `host` should read as "the cluster has no host".
- I4. Reserved or colliding keys: a resource keyed `__none__` collides with `NONE` (`presets.ts:11`, the facet's "unset"): a project naming it counts under both meanings. `__proto__` and `constructor` as keys: `byId` assigns `out[item.id] = item` on a plain object, where `__proto__` replaces the prototype. Expected: finding and entry left out (a single check beside `checkResources`).
- I5. Manifest `compute:` with a non-string entry (`[1, utwente]`): no finding (as `datasets`), `resourceIds` drops the number. Duplicate entry `[utwente, utwente]`: one tag (C1). Bare `compute:`: finding (C6).
- I6. Saved board state: `parseBoardState` (`state.ts:97-101`) keeps `filters.compute: ['hpc']` from a layout saved before the change; after the change no item has that value, the facet menu never offers it, and the board shows no cards with a filter the reader cannot see or clear except by "clear". Expected: either the stored values that are not keys of the facet are dropped when read, or the case states the result.
- I7. `hub.latest('portfolio')` absent at start (the first `buildPortfolio` threw: `portfolio.ts` catches it and publishes nothing): host `''` with the sentence "names no resource", which is wrong as a cause. The brief says "an empty map when there is none" and leaves the sentence; expected: a fifth wording or the same wording with the cause "the registry is not read yet". In `context.test.ts` all portfolios are fakes, so every existing HPC-host test starts in this state.
- I8. A registry edit while the server runs, beyond case 16: the host removed (`utwente` loses `host:`), then restored: the poller goes `unreachable` with the sentence, then back to polling; `kind` changed to `machine`; two edits within one debounce; a rebuild during a poll in flight; `built` called after `close()`. `agents/spec.md` requires "in flight, after close, and superseded" for every asynchronous path.
- I9. Demo hub: `config/behavior.yml` (shared) names `utwente`; the demo registry has none; the HPC view on the demo hub shows "utwente names no resource". Expected: stated as accepted, or demo manifests/settings given a cluster.
- I10. Cockpit dummy hub: no `registries/resources.yml` there (`ls tools/cockpit/dummy/registries` has pillars.yml only per the earlier grep). Item 11 reads the file "once per build"; expected: an absent file gives an empty map, no exception, the key is the label, every badge `cb-local`. The path in the cockpit: the brief does not say whether it is a constant or a key in `tools/cockpit/data/config/*.yml`, whose twins under `dummy/` would then both change (outside Paths). The cockpit joins keys in `data-compute` with a space, where `data-datasets`, `data-pillar` and `data-funding` use `|` (`cards.py:190-193`); a resource key with a space would split into two. `cards.py:151` today is `'...>{G.hpc} ' + T(...)`, a non-f-string, so the glyph prints literally; the rewrite removes it, which is fine, but no case asserts the glyph.
- I11. `hpc_host` set and `slurm.resource` unresolved: host is `hpc_host`, no sentence. Case 12 covers only a resolved key.
- I12. Actions of the HPC route with host `''` (cancel, log): expected refusal, no ssh (N1).
- I13. `slurm.resource` changing from `nowhere` to `this-mac` while the host stays `''`: `poll.ts:320` only acts on `next.host !== before.host`, so the new sentence is not published until the next retry (2 minutes). Expected: `set()` republishes when `missing` changes.

## ADRs

`ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both. `grep -n adr .agents/plan.yaml` prints nothing, so the configuration has no `adr:` key. The brief's statement is right.

## Item 8 and sizes

Q1. Resolution in `live-settings.ts` from `hub.latest('portfolio')`: fits. `Message.payload` is the Snapshot object (`channels.ts:98`), `folders()` at `context.ts:449-452` already reads it this way, and the portfolio watcher builds and publishes the first snapshot synchronously inside `watchPortfolio` (`portfolio.ts:613`), before `watchHpc` at `context.ts:512`.

Q2. Things the design omits that the code needs:
- `liveSettings()` (`live-settings.ts:75-76`) does `const { hpcHost, ...held } = start; const current = structuredClone(held);`. A `resources` function left in `held` makes `structuredClone` throw `DataCloneError`; `resources` must be taken out beside `hpcHost`.
- `hostChanged()` has no configuration in hand, so the sentences (from the text catalog) must come in `LiveStart` as words, as `calendarWords` and `mailWords` do, and be refreshed in `take()`; the brief says "the sentence from the text catalog" and no more.
- `poll.ts:320` host-change handling covers `host` only (I13). `publishQuota` (`:125`), `poll` (`:164`) and `prewarmStep` (`:236`) all pass `current.host` to the runner; the three need the `host === ''` guard, the retry still arms (`schedule(RETRY_MIN)`, so the unreachable payload republishes every 2 minutes and logs `hpc publish: unreachable` each time).
- `built?: () => void` called after `hub.publish('portfolio', snapshot)` (`portfolio.ts:563`) sits inside the rebuild's try block; a throw from the callback would skip the audit and feeds publishes at `:566-593`. `hostChanged()` catches through `attempt`, so it does not throw; a direct call needs the same care. At the first build `built.live` is undefined (`context.ts:433,559`), so the callback is a no-op and the start-up host comes from item 8's direct resolution, as the brief says.
- `make.watchPortfolio(hub, {...})` at `context.ts:441` has two arguments; `WatchOptions` is the third parameter of `watchPortfolio(hub, paths, options = {})` (`portfolio.ts:284`). `ContextDependencies.watchPortfolio` is `typeof watchPortfolio` (`context.ts:189`), so the third argument is accepted.
- The cancel/log route (N1).

Q3. Line counts, by estimate (nothing written, so "not verified"): `validate.ts` 851 plus about 33 (a `REFERENCES` row 6, a `SHAPES` row 1, `IdSets` and `idSets` 2, a kinds constant with its comment 6, `checkResources` with its comment 16, the call 1) is about 884 and stays under 900 with about 16 to spare; the brief's fallback (one function over a table) is available. `context.ts` 878 plus about 12 (a `built` option at the `startPortfolio` call 4, the `resources` entry of `LiveStart` 4, the host at `:513` 3, a `missing` field 1) is about 890, under 900 by about 10 for M3 alone. D18 (in flight) also writes `context.ts` (its watcher, built and closed) and states that it may need a new module "only if `context.ts` would pass 900 lines" (`D18.md:91`); the two merged very probably pass 900, and the M3 brief says nothing about how `context.ts` is kept under 900 (for example the whole host resolution as one call into `live-settings.ts`).

Q4. `ProjectCard.svelte` is 477 lines against 540; one tag loop fits.

Q5. HPC view's text file: `config/text/views/system/hpc.yml` exists (listed by `git ls-tree`). S1: D18's brief moves it: `D18.md:46,86` put it at `config/text/views/system/machine/hpc.yml` ("`config/text/views/system/hpc.yml` and `usage.yml` (moved away)"). The M3 brief's fallback "or `findings.yml` if D18 has moved it at landing" is wrong; if D18 lands first the file is `config/text/views/system/machine/hpc.yml`, and the folder `config/text/views/system` has 10 items today (full), so the new sentences cannot go in a new file there either. The group `hpc` stays in one file.

Q6. Tests that would break and whether Paths covers them: all are under `tools/oculus/tests/`, covered by the blanket line, but the brief names only some. Breaking, by reading: `tests/checks/config/config-folder.test.ts:170-171` (the `sources.yml` key list gains `resources_file`), `options-catalog.test.ts` (slurm.host rows), `tests/data/sources/config/settings.test.ts:60-95`, `tests/server/root/context.test.ts` and `context-reload.test.ts:412,430` and `context-fixture.ts:140` (host expectations; the fake portfolio publishes nothing so the host would be `''`), `tests/server/root/watch/portfolio/portfolio.test.ts:675-681` (the fixture hub has no resources registry: a third `findings.registries.file_missing` in an exact list of two), `tests/data/demo-hub.test.ts` (title), `tests/state/forms/schema.test.ts:41-52,223` (`SOURCES` list and `choicesOf('compute')`), board tests (`board-filters.test.ts:38`, `board-filter-menu.test.ts:59-119`, `board-fixture.ts:158,177`, `projects.test.ts:121,140,351-352,537-554`, `chips.test.ts:93,370`, `card-docs.test.ts:83`, `cardlinks.test.ts:117`, `editor.test.ts:73`), `normalise.test.ts:106,287`, 22 relation fixtures if the join table is built, `tests/state/system/settings/{write,search,rows}.test.ts`, `tests/views/system/workbench/settings.test.ts:404,531,736`, `tests/checks/tree/allow-duplication.txt:39-40` (keys on `registries.test.ts` blocks). `tests/server/edit/yaml-edit.test.ts` uses `compute: hpc` only as a generic edit fixture and does not break. Not under `tests/`: `tools/cockpit/tests/run.sh` (named by the hub CLAUDE.md) is not in the brief's verify list.

X. Spec conflict: `agents/spec.md` (last paragraph) lets a package write hub data "through the script the brief names and by nothing else", and the same file forbids writes under `registries/` and `projects/`. The brief names no script for the 17 manifest edits and the two registry files; items 1 and 10 and the Conventions paragraph leave the builder with only Edit. The brief should name the method (a sed command per manifest with its re-parse, or an explicit permission to use Edit on the listed lines).

Other observations: the brief's "A design ruling decides what is built. It never exempts the code" paragraph and the "Libraries checked" section are consistent with the plan configuration (`libraries: check`). The brief has no non-ASCII character (`LC_ALL=C grep -n '[^ -~]' M3.md` prints nothing).

## Declined to judge

- Whether the facet, the card and the form read well on screen: needs the look on TEST.
- Whether the build, the 7-command list or the cockpit selftest pass: I ran none (a build or selftest can write files; this check changes nothing).
- Line counts after the change (Q3): estimates only, not verified.
- Whether the first-seen order of cockpit facets versus the registry order is a good UI choice: a design ruling, not a brief defect.
- Whether Sonnet 5.5 can carry item 8 together with eleven other items in one dispatch: no evidence to read here.

Usage: claude-sonnet-5-5 (the transcript's message.model, read at 08:38), 309,063 tokens, 105 tool uses, 18.5 min.

# Closed

Each finding closed by a change to `agents/briefs/M3.md`, before the preparation commit:

- N1, I12: item 12 (new) routes the HPC route's host through `hpcHostOf` and refuses a cancel or a log while the host is empty; the route, `routes.ts` and the `slurmSettings(` callers are in the paths; case 21.
- N2, C3: item 5 carries `{ id, label, cluster }` per key on the board item; `facets()` records the labels and order from the items; `Projects.svelte` keeps its call.
- N3: item 2 lists every "seven" comment and the demo-hub test title, which become "eight".
- N4: `manifest-schema.yml:16-17` added to item 13 and the paths.
- N5: `DESIGN.md:132` and `:240` added to item 13 and the paths.
- N6: item 11 removes the unread cockpit text keys from `data/config/text.yml` and its dummy twin; both in the paths.
- N7: no change needed.
- N8: verify 4 widened to the `host:` fixtures and the card keys, with `--exclude=local.yml`.
- N9, C1: Decision 5, `resourceIds` is a plain filter in the manifest's order with no join table; case 6 and case 25.
- N10: the shared files with D18, X3a and Q88c listed in the last premise.
- P1, P2, P3: the line numbers corrected in "What is on the tree", and the ordering change placed in `facets.ts`'s `orderValues`.
- P4, P5: the 900 and 540 limits stated with their source; the full test folders and the test files near the limit listed; item 13 places each new test in a folder with room.
- P6, I9: the demo registry's cluster is keyed `utwente`, so the shared setting resolves on the demo hub as before; case 26.
- C2: Decision 4, the facet sorted by name then registry order (`Resource.order`); case 22 uses names whose order differs from the keys'.
- C4, C5: item 3 and item 4 keep an entry only with a known kind, a free key and no earlier twin, and the validator's id set follows the same rules; cases 2 and 3.
- C6: the `compute` shape is `nullable: true`; case 9.
- C7, I1: Decision 6 and item 8's resolver refuse a host that is not a usable ssh alias with a fourth sentence; case 16.
- C8: no change needed.
- C9: item 8's view bullet draws the hint alone and no host footer when the host is empty; case 13.
- C10: verify 4a adds `bash tools/cockpit/tests/run.sh` and the counts in the built cockpit page (9 `utwente`, 8 `this-mac`, as `grep -c` gives 9 `hpc` and 8 `local` today); case 27.
- The question (case 16 on a fake watcher, cases 13 to 15 on the payload): item 13 puts the `built` test on the real `watchPortfolio`, and cases 13 to 16 require a runner that fails when called.
- I2, I4: duplicate and reserved keys give `resource_duplicate` and `resource_reserved`, the first twin kept for both the entities and the resolver; case 24; a file that does not parse joins case 4.
- I3: a non-string host reads as none (case 15); `links` read with `strings` as for organisations.
- I5: case 25.
- I6: item 5 drops a saved compute filter value the facet does not offer; `state.ts` in the paths; case 23.
- I7: a fifth sentence for no snapshot yet; case 19.
- I8: case 17 covers removal and restore, one debounce, a poll in flight and after close; item 8 calls `built` after the audit and feeds in its own `try`, never after `close()`.
- I10: item 11 reads the cockpit registry path as a constant, an absent file as an empty map, and joins `data-compute` with `|`; case 27.
- I11: case 12.
- I13: item 8's `set()` treats a changed `missing` as a changed host; case 18.
- Q1: no change needed.
- Q2: item 8 takes `resources` out before the clone, hands the sentences in the start as `HostWords`, guards the quota read, the poll and the prewarm, and wraps the `built` call.
- Q3: item 8 caps the change to `context.ts` at six lines.
- Q4: no change needed.
- Q5, S1: the HPC sentences go in `config/text/views/system/hpc.yml`, carried into D18's moved file by whichever step lands second.
- Q6: item 13 and the paths name where each test goes; `config-folder.test.ts` and the other config tests are under the tests line.
- X: "Conventions" names the commands that write the hub data: one heredoc per registry file and one `perl` command over the 17 manifests, with the parse check after; Decision 1's five cases are that command's output.
- The plan's missing Goal section: the brief check used the goal the step line gives; no change.

