# O68 report (after repair round 1)

Everything in the brief and in repair round 1 is done. `npm run test:quick` has two red lines, and neither is a defect of the step:
- `tests/checks/source/history.test.ts` fails on `src/desktop/app.ts:161`. The step does not change that file, and the test fails the same way on the base. The round brief books this one for landing.
- `tests/routes/hubs/make.test.ts` timed out at 5000 ms on one `git init` row. Run alone in the worktree it passes 35 of 35. The run was under load: svelte-check took 158.9 s, against 45.9 s in the step's first run.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:162-164` holds no entry:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## Repair round 1, item by item

S below is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O68-builder` and W is the worktree.

### Item 1: the comment of `homeOf`, and every sentence that names a host write. DONE

`grep -rn "homeOf(" src`, as printed, the lines of `server/edit/writes/hubs.ts`'s `homeOf`:

```
src/lib/server/edit/writes.ts:550:        const home = homeOf(into, null);
src/lib/server/edit/writes.ts:563:        const home = rootedHome(into, fresh.root, app, () => homeOf(into, app));
src/lib/server/edit/writes.ts:671:        const home = rootedHome(into, idea.root, app, () => homeOf(into, app));
src/lib/server/edit/feeds/feed-route.ts:117:        const home = homeOf(into, app);
src/lib/server/edit/feeds/feed-route.ts:126:        const home = homeOf(into, app);
src/lib/server/edit/feeds/feed-route.ts:160:        const home = homeOf(into, app);
src/lib/server/edit/writes/hubs.ts:188:export function homeOf(into: WriteTarget, app: HeldApp | null): PrimaryTarget | null {
src/lib/server/edit/writes/hubs.ts:230:    return one === undefined ? homeOf(into, null) : within(into, one);
```

Each call and the write it serves:
- `writes.ts:550` is the `career` write.
- `writes.ts:563` is `new-entry` with no root.
- `writes.ts:671` is `new-idea` with no root.
- `feed-route.ts:117` is `lead-add`.
- `feed-route.ts:126` is `radar-add`.
- `feed-route.ts:160` is `linkedin-idea`.
- `hubs.ts:230` is `homeNaming`'s last resort.

The other `homeOf` hits are functions of their own:
- `writes/manifest.ts:267`
- `tabs/reopen.svelte.ts:127`

`src/lib/server/edit/writes/hubs.ts:183-188` now reads:

```ts
/**
 * The target for a write that names no record and needs a hub (the career file, a new project or a
 * new entry with no root, a lead, a Lit Watch paper and a LinkedIn idea, and `homeNaming` when no
 * hub holds the collection): the primary's, else, for the page, the first hub of the workspace, and
 * null when the workspace lists no hub, or for an app when it has no primary.
 */
```

`grep -rniE "host status|host write|host pipeline|career host" src docs --exclude=local.yml` printed four lines before the rewrite. After it, three lines remain, each about an app's host program:

```
src/lib/server/edit/writes/apps/host-store.ts:1:// Layer 2, server. The store of an app as its host writes it: one key at a time, as VS Code's
src/lib/server/machine/apps/host/runner/host-runner.mjs:17:// Whatever the host writes to standard output goes to standard error, so the messages are the only
src/lib/data/file-ops.ts:364: * `launch.yml`, and a file an app's host writes with `workspace.fs.writeFile`.
```

All three mean an app's host program, so they stay.

A wider grep, `grep -rniE "career.{0,60}host|host.{0,60}career|host candidate|hosts in flight|host outreach|score (chip|axes|column)" src docs config tests --exclude=local.yml`, run with the diagrams left out, prints one line: `src/lib/server/edit/writes/subtasks.ts:3`. The "host" there is the entry that holds a subtask block.

### Item 2: the two comments rewrapped at 100 columns. DONE

Each paragraph was rewrapped whole:
- `src/lib/server/edit/writes.ts:20-31` (the paragraph that names the modules);
- `src/lib/views/boards/focus/lanes/LaneCard.svelte:2-8` (the head paragraph).

The check ran over every changed `.ts`, `.svelte`, `.js` and `.mjs` file:

```
git status --short | grep -v "^ *D" | awk '{print $NF}' | grep -E "\.(ts|svelte|js|mjs)$" | xargs awk 'length($0) > 100 { print FILENAME":"FNR": "$0 }'
```

It prints 105 lines. Filtered to comment lines (`grep -E "^[^:]+:[0-9]+: *(//|\*|/\*|<!--)"`), it prints these six:

```
src/lib/state/client/writes.svelte.ts:632:     * names, else in the hub the server picks (the primary, else the first). `tier` and `folder` are
src/lib/views/boards/focus/career/CareerPanel.svelte:128: <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
src/lib/views/boards/focus/career/CareerPanel.svelte:160: (the same directive)
src/lib/views/boards/focus/career/CareerPanel.svelte:181: (the same directive)
src/lib/views/boards/focus/lanes/Lanes.svelte:267: (the same directive)
src/lib/views/boards/focus/lanes/Lanes.svelte:283: (the same directive)
```

The step edited none of these six lines:
- The `writes.svelte.ts:632` line is byte for byte line 640 of the base: `git show HEAD:src/lib/state/client/writes.svelte.ts | grep -nF` finds it there.
- The five lines in `CareerPanel.svelte` and `Lanes.svelte` are eslint directives that cannot be wrapped. The base `CareerPanel.svelte` holds six of them (`git show HEAD:... | grep -c` gives 6).

The other 99 lines are code, strings and test titles, which the comment rule does not cover.

### Item 3: HELP says when the funding line is drawn. DONE

`docs/HELP.md:287`, the Focus note, now reads:

> The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`): for each role that has a project in a record row of `categories:` (in review, in flight, publications, other outputs), one line per record row with its count, never summed. A further line counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn.

The new sentences follow the code:
- `{#if record.funding > 0}` in `CareerPanel.svelte`;
- `trackRecord`'s `held.length === 0 && funding === 0 ? null`.

### Item 4: each added or changed test row run on the unchanged source. DONE

The replica: `rsync -a $S/base-tree/ $S/base-newtests/`, then the step's current text of nine files copied in:
- `tests/data/sources/career.test.ts`
- `tests/server/edit/writes.test.ts`
- `tests/server/core/changes.test.ts`
- `tests/routes/edit/undo/undo.test.ts`
- `tests/checks/config/config-folder.test.ts`
- `tests/server/edit/writes-fixture.ts`
- `tests/routes/edit/write-fixture.ts`
- the demo hub's `.oculus/config.yml`
- the demo hub's `.oculus/data/academic/career.yml`

`diff -rq .agents/worktrees/O68-base/src $S/base-newtests/src` prints nothing, so the source is the base's.

The run: `cd $S/base-newtests && npx vitest run --root $S/base-newtests --reporter=verbose <the five test files>`, output in `$S/base-newtests-out.txt`. It gave `Tests  7 failed | 152 passed | 10 skipped (169)`.

**Rows of `tests/data/sources/career.test.ts`, as written.**
- 'parses it as the map it is, with no key renamed' passed (<check mark>). The reader is unchanged.
- The suite 'normalising it' failed in its `beforeAll`:

  ```
  FAIL  |unit| tests/data/sources/career.test.ts > normalising it
  TypeError: Cannot convert undefined or null to object
   <heavy right-pointing angle quotation mark> wordsWith src/lib/data/shapes/vocab-keys.ts:71:29
   <heavy right-pointing angle quotation mark> career src/lib/data/snapshot/normalise-parts/career.ts:122:19
   <heavy right-pointing angle quotation mark> tests/data/sources/career.test.ts:68:16
  ```

  The failure comes from the base's `career(raw, config)`, which reads `config.career_host_status`, and the test calls `career(raw)`. So the base skips the eight rows (marked <downwards arrow>): 'reads the title, the milestone and the situation strip', the six 'reads $name' rows, and 'reads none of the sections the banner does not draw into the model'.
- The two rows of 'what the editor edits' fail the same way: `TypeError: Cannot convert undefined or null to object` at `tests/data/sources/career.test.ts:160:22` and `:179:22`.

**The same rows with the base's call shape.** The calls of the copied file were changed to give the base's second argument: `sed -E 's/(career\(readCareer\([^;]*CATALOG\)\.career)\);/\1, {});/'` on the five calls. Then `npx vitest run --root $S/base-newtests --reporter=verbose tests/data/sources/career.test.ts`, output in `$S/base-career-arg-out.txt`:

```
 <check mark> reading the career file > parses it as the map it is, with no key renamed
 <multiplication sign> normalising it > reads the title, the milestone and the situation strip
     AssertionError: expected undefined to be 'Assistant professor'  (tests/data/sources/career.test.ts:73:28)
 <multiplication sign> normalising it > reads 'a goal and a milestone with its day'
     AssertionError: expected undefined to be 'Assistant professor'  (:133:28)
 <check mark> normalising it > reads 'a milestone with no milestone_date, w...'
 <check mark> normalising it > reads 'a milestone_date that is not a day, w...'
 <multiplication sign> normalising it > reads 'an empty milestone, which is none wha...'
     AssertionError: expected '' to be undefined  (:134:33)
 <check mark> normalising it > reads 'an empty goal, which is none'
 <check mark> normalising it > reads 'a milestone that is a map, which is n...'
 <multiplication sign> normalising it > reads none of the sections the banner does not draw into the model
     AssertionError: expected [ 'dropped', 'eligibility', ...(9) ] to deeply equal [ 'goal', 'milestone', ...(6) ]  (:140:48)
 <check mark> what the editor edits > keeps every section as the file holds it, with the schema left out
 <check mark> what the editor edits > carries the file schema, one field per section, and not as a section
```

Reading of these results:
- The four failing rows pin the change: the goal is read, an empty milestone is no milestone, and the old sections are no longer read into the model.
- Four 'reads $name' rows pass on the base, because the base reads no goal and no milestone date at all. They pin the refusal half of the new reading (case 9): no date and a date that is no day give no `milestoneDate`, and an empty goal and a map milestone give none.
- The two editor rows check behaviour the step keeps: the sections the editor edits and the schema it carries.

**`tests/server/edit/writes.test.ts`, describe 'writing career sections'.** All three rewritten rows pass on the base (<check mark>):
- 'writes a renamed label and a changed sentence of the situation as one map'
- 'changes the day of one task of the order of work and keeps the other tasks'
- 'changes one fact of the situation and keeps the other with its comment'

So does 'refuses a value of the wrong type for a section and writes nothing'. These rows check the career write, which the step keeps; only their fixture sections changed.

**The renamed rows.** Both pass on the base (<check mark>) and check kept behaviour:
- `tests/server/core/changes.test.ts` 'records a session override and a feed field'
- `tests/routes/edit/undo/undo.test.ts` 'takes an added subtask line out again'

**`tests/checks/config/config-folder.test.ts`.**
- 'uses glyph names for every configured icon' passes on the base (<check mark>). It checks kept behaviour: every icon of the four lists is a glyph.
- 'describes every flag of stages, forms, chips, statuses, lead_statuses and tiers and every key of a roles, categories and publication_kinds row' fails on the base, because the base has no `obtained` flag:

  ```
  AssertionError: expected [ { key: 'stages.idea', ...(1) }, ...(36) ] to have a length of 38 but got 37
   (tests/checks/config/config-folder.test.ts:688:22)
  ```

Four other rows of `config-folder.test.ts` fail in this replica. The step changes none of them, and each fails on a file the replica does not hold:
- 'writes one description for every config file and none for a file that is not there': `expected [ 'settings.desc_agents', ...(16) ] to deeply equal [ 'settings.desc_agents', ...(15) ]`, since the replica has no `config/options/local.yml`.
- 'matches the hub's own files of a scratch hub to a schema each, read with no finding' and 'reads a key of .oculus/config.yml outside the hub list as not declared': `ENOENT ... base-newtests/docs/templates.md`.
- 'reads each file on its own and finds its own keys there and nowhere else': `ENOENT ... base-newtests/config/options/local.yml`.

The replica was built with every `local.yml` and the `docs/` folder left out (`ls $S/base-newtests/docs` reports no such directory).

### Item 5: the greps the rules file asks for. DONE

**Removed text keys and refusals: their readers on the base.** Command:

```
cd .agents/worktrees/O68-base && grep -rnE "career\.not_a_status|edit\.host_no_field|edit\.host_no_status|edit\.no_host\b|edit\.no_hosts|write_route\.no_host\b|hostNoField|hostNoStatus|\bnoHost\b|\bnoHosts\b|kind_host|focus\.(career_caveat|career_rules|career_score_tip|career_shots|dropped|eligibility|host|host_pipeline|in_flight|not_hosts|wait_hosts)\b|'(career_caveat|career_rules|career_score_tip|career_shots|host_pipeline|wait_hosts|not_hosts)'" src tests --exclude=local.yml | grep -v "hpc/host.ts\|machine-defaults.ts"
```

The filtered files hold the cluster's own `noHost`. Output:

```
src/lib/server/edit/entry-edit/host-status.ts:45:        return refuseAll(source, STATUS, why(REFUSALS.noHosts), catalog);
src/lib/server/edit/entry-edit/host-status.ts:63:                    ? fail(REFUSALS.hostNoField)
src/lib/server/edit/entry-edit/host-status.ts:66:            out = fail(REFUSALS.hostNoStatus);
src/lib/server/edit/entry-edit/host-status.ts:80:    return refuseAll(source, STATUS, why(REFUSALS.noHost, name), catalog);
src/lib/server/edit/writes.ts:558:            const error = words(into.config.text, 'server.write_route.no_host', host.name);
src/lib/server/edit/writes/subtasks.ts:325:                { field: 'status', reason: words(text, 'server.career.not_a_status', status) }
src/lib/server/edit/yaml/why.ts:28:    hostNoField: 'server.edit.host_no_field',
src/lib/server/edit/yaml/why.ts:29:    hostNoStatus: 'server.edit.host_no_status',
src/lib/server/edit/yaml/why.ts:41:    noHost: 'server.edit.no_host',
src/lib/server/edit/yaml/why.ts:42:    noHosts: 'server.edit.no_hosts',
src/lib/views/boards/focus/career/CareerHosts.svelte:71:                        <span class="score" title={t('focus.career_score_tip', dim.label, value)}>
src/lib/views/boards/focus/career/CareerHosts.svelte:92:                                title={t('focus.host', one.key)}
src/lib/views/boards/focus/Focus.svelte:141:                  { key: 'hosts', label: t('focus.wait_hosts'), names: countedNames(strip.hosts) },
src/lib/views/boards/focus/career/CareerPanel.svelte:100:            flight > 0 ? t('focus.in_flight', flight) : ''
src/lib/views/boards/focus/career/CareerPanel.svelte:179:                    {@render section(t('focus.host_pipeline'))}
src/lib/views/boards/focus/career/CareerPanel.svelte:190:                        {@render section(t('focus.not_hosts'))}
src/lib/views/boards/focus/career/CareerPanel.svelte:205:                    {@render section(t('focus.eligibility'))}
src/lib/views/boards/focus/career/CareerPanel.svelte:207:                        <p class="sub">{t('focus.career_shots')}</p>
src/lib/views/boards/focus/career/CareerPanel.svelte:219:                        <p class="sub">{t('focus.career_rules')}</p>
src/lib/views/boards/focus/career/CareerPanel.svelte:229:                            <b>{t('focus.career_caveat')}</b>
src/lib/views/boards/focus/career/CareerPanel.svelte:237:                    {@render section(t('focus.dropped'))}
tests/server/edit/writes.test.ts:343:                reason: words(configFor().text, 'server.career.not_a_status', 'promoted')
tests/data/sources/career.test.ts:109:            'not_hosts',
```

Every reader is code the step deletes or rewrites:
- the host write: `host-status.ts`, `writes.ts:558`, `subtasks.ts:325` and the `REFUSALS` rows in `why.ts`;
- the host views: `CareerHosts.svelte`, `CareerPanel.svelte`'s old sections and `Focus.svelte:141`;
- the two tests of those.

`history.kind_host` has no static reader: `History.svelte:120` words a kind as `history.kind_${word}` and falls back to the raw kind.

**The same keys on the tree as it is now.** Command, with counts as printed:

```
for k in not_a_status host_no_field host_no_status no_host no_hosts hostNoField hostNoStatus noHost noHosts career_caveat career_rules career_score_tip career_shots "focus.dropped" "focus.eligibility" "focus.host'" "focus.host\b" host_pipeline in_flight not_hosts wait_hosts kind_host; do printf '%s: ' "$k"; grep -rnE "$k" src config tests docs --exclude=local.yml --exclude-dir=diagrams | wc -l; done
```

```
not_a_status: 0
host_no_field: 0
host_no_status: 0
no_host: 7
no_hosts: 0
hostNoField: 0
hostNoStatus: 0
noHost: 5
noHosts: 0
career_caveat: 0
career_rules: 0
career_score_tip: 0
career_shots: 0
focus.dropped: 0
focus.eligibility: 0
focus.host': 0
focus.host\b: 0
host_pipeline: 0
in_flight: 4
not_hosts: 1
wait_hosts: 0
kind_host: 0
```

The remaining hits are other keys that share the words:
- `hpc/host.ts` `noHost` and `hpc.host_none`;
- `machine-defaults.ts` `server.machine_default.hpc_host`;
- `findings.apps.activation_no_host`;
- `source.submit_no_host`;
- `apps.tree_no_host`;
- `project.helper.xlink_in_flight`;
- `pillars.in_flight`;
- the `not_hosts:` fixture line at `tests/data/sources/career.test.ts:38`.

**The names of each added helper, type and schema, on the base, before they were written.** Command:

```
cd .agents/worktrees/O68-base && grep -rnwE "laneMarks|foldedLine|daysLeft|trackRecord|RecordLine|RoleRecord|TrackRecord|milestoneDate" src tests
```

It prints nothing, so no such name existed. Key calls on the base:
- `entryPeople`/`isSelfByKey`: `grep -rnE "function (entryPeople|isSelfByKey)|entryPeople\(|isSelfByKey\(" src tests` prints:
  ```
  src/lib/data/shapes/boards/roles.ts:110:function entryPeople(fields: Record<string, unknown>): PeopleOf {
  src/lib/data/shapes/boards/roles.ts:115:function isSelfByKey(self: ReadonlySet<Id>): (person: string) => boolean {
  src/lib/data/shapes/boards/roles.ts:198:    const isSelf = isSelfByKey(self);
  src/lib/data/shapes/boards/roles.ts:201:    const people = (entry: Fielded): PeopleOf => entryPeople(entry.fields);
  ```
  Both existed as local helpers, so the step exports them instead of writing new ones.
- The days-left words: `grep -rnE "focus\.(in_days|days_ago)" src` prints `src/lib/views/boards/focus/Band.svelte:97: label={days < 0 ? t('focus.days_ago', -days) : t('focus.in_days', days)}`. `daysLeft` reuses those two keys and `daysUntil` (`grep -rnE "export function daysUntil" src` prints `src/lib/state/boards/board/presets.ts:296`).
- A funding lead: `grep -rnE "isLead\(" src` prints `state/boards/board/items.ts:143`, `data/shapes/boards/roles.ts:76` (the definition) and `:206`. `trackRecord` calls `isLead`.
- The record rows: `grep -rnE "record\b" src/lib/data/shapes/boards/categories.ts` prints `:24`, `:25` and `:75`, the `record` flag that `categoriesOf` parses. No other reader of it exists on the base, so `trackRecord` filters `categoriesOf(config)` by it.
- A project's status words: `grep -rnE "projectStatusWords\(" src` prints `state/shared/words/tones.ts:269`, `Projects.svelte:258` and `LaneCard.svelte:81`. `laneMarks` calls `projectStatusWords`.

**Head comments, doc comments and document paragraphs that describe the changed behaviour.** Found with `grep -rnE "^\s*(//|\*|<!--).*(career|status marks|awaiting|Awaiting|track record|write kinds?|kind of write|OPEN_WRITES|hub list|hub's own words|record: true|record row)" src` and `grep -rniE "career|status mark|awaiting box|awaiting-a-response|track record|obtained" docs --exclude-dir=diagrams`, then read.

Rewritten:
- `src/lib/state/boards/focus.ts:370-379`: `waiting`, the awaiting box, without the hosts.
- `src/lib/state/boards/focus.ts:250-266`: `laneMarks`, new.
- `src/lib/state/boards/career.ts:1-8`: head comment.
- `src/lib/state/boards/career.ts:25-28`, `:44-48`, `:57-79`: doc comments.
- `src/lib/views/boards/focus/career/CareerPanel.svelte:2-25`: head comment.
- `src/lib/views/boards/focus/lanes/LaneCard.svelte:2-8` and `:34-38` (the `marks` prop).
- `src/lib/views/boards/focus/lanes/Lanes.svelte:2-7`.
- `src/lib/data/snapshot/normalise-parts/career.ts:1-6`, `:35-60`.
- `src/lib/data/snapshot/normalise.ts:574-576`: what `merged` is read for.
- `src/lib/data/sources/documents/career.ts:1-7` and `:14-17`.
- `src/lib/data/model/model-collections.ts:198-212` (`Career`).
- `src/lib/data/shapes/boards/roles.ts:1-8`.
- `src/lib/data/shapes/catalog-files/vocab.ts:3-4` and the `obtained` help at `:173`.
- `config/catalogs/vocab.yml:109`.
- `src/lib/data/helpers/hub-names.ts:360-363`: the hub-list comment.
- `src/lib/server/edit/writes.ts:20-31` and `:125` (the `career` field doc).
- `src/lib/server/edit/writes/subtasks.ts:1-4`, `:213-224` (`CareerRules`, `careerRulesShape`, `careerRules`).
- `src/lib/server/edit/writes/hubs.ts:183-188` (item 1).
- `src/lib/server/edit/entry-edit/entries.ts:1-2`.
- `src/lib/state/shared/words/tones.ts:262-269` (`projectStatusWords`): it said the words "draw on a lane card"; it now says the board's list names them all and a lane card draws those its lane does not say.
- `src/lib/data/sources/config/catalog/schemas/engine.ts:9-12`: its example of a catalog-file key of the hub list was "the career words of catalogs/vocab.yml" and is now "`leads_fit` of catalogs/vocab.yml" (`hub-names.ts:385`).
- `config/defaults/sources.yml:52` and `config/options/sources.yml:81`.
- `docs/HELP.md:287`.
- `docs/apps.md`: the `host` rows and the `:427` sentence.
- `docs/data-map.md:54`, `:62` and the hub-list block.
- `docs/templates.md:95`, `:1251-1290` and the hub-list block.

Still true:
- `src/lib/state/boards/focus.ts:71`: the `Waiting` type's head; its `hosts` field and that field's doc are gone.
- `src/lib/views/boards/focus/Focus.svelte:14-31`: the said line is still set by the command center, the tasks, the quick add and the lanes (`Focus.svelte:177,186,189,217`).
- `src/lib/views/boards/focus/Focus.svelte:112`.
- `src/lib/views/boards/focus/FoldHead.svelte:5`.
- `src/lib/views/shared/card/project/CardStatus.svelte:2-6`: the Projects board card.
- `src/lib/data/helpers/files/apps/apps.ts:1-13`.
- `src/lib/server/edit/writes/apps/gate.ts:1-12`.
- `src/lib/server/edit/yaml/why.ts:1-8`.
- `src/lib/server/edit/writes/bodies.ts:1-10`.
- `src/lib/server/edit/writes/undo.ts:1-14`.
- `src/lib/state/sessions/source/write-files.ts:1-20`.
- `src/lib/state/shared/stores/shapes.ts:1-9`.
- `src/lib/state/client/writes.svelte.ts:1-14`.
- `src/lib/server/machine/apps/read/manifest.ts:10`.
- `src/lib/views/system/history/History.svelte:18,114,125`.
- `src/lib/state/forms/page-entry.ts:2-12` and `src/lib/state/forms/entry-save.ts:3,89`.
- `src/lib/views/shared/forms/entry/edit/LabelRows.svelte:4`.
- `src/lib/server/root/watch/portfolio.ts:208,286,442,558`.
- `src/lib/data/snapshot/hubs/merge.ts:17,264`.
- `src/lib/data/index.ts:153,355,482,535`.
- `docs/apps.md:353,385`: the `career` channel is "the career file, or `null`".
- `docs/HELP.md:207`.
- `docs/data-map.md:90,216`.
- `docs/templates.md:136-142`: the statuses example.

## The cases' first run (unchanged tree)

Command (W = the worktree, S = `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O68-builder`): `cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/first.cases.test.ts`, output appended to `$S/first-out.txt`. The case file calls `laneOf` and `projectStatusWords` (cases 1-6; "drawn" is `words.slice(0, 2)`, what `LaneCard.svelte` drew with `CARD_CHIPS = 2`), the normaliser `career(raw, config)` and `summaryOf` (7-10), `categoryOf`/`projectRole` (11-14), `loadConfig` over a scratch copy of the demo hub (15), `handleWrite` over the route fixtures (16, 17). Output as printed:

```
case 1: lane=backburner words=["in-prep","journal","parked"] drawn=["in-prep","journal"]
case 2: lane=push words=["submit-ready"] drawn=["submit-ready"]
case 3: lane=review words=["submitted","journal","results-in","admin-prep","ai-tells"] drawn=["submitted","journal"]
case 4: lane=blocked words=["exploring","parked","blocked"] drawn=["exploring","parked"]
case 5: lane=idea words=["nascent"] drawn=["nascent"]
case 6a: lane=run words=["exploring","poster","poster"] drawn=["exploring","poster"]
case 6b: lane=run words=["exploring","results-in","results-in"] drawn=["exploring","results-in"]
case 7: goal=undefined milestone="FWO Senior" milestoneDate=undefined folded(summaryOf)="FWO Senior"
case 8: no days-left function on the tree
case 9a: goal=undefined milestone="FWO Senior" milestoneDate=undefined folded(summaryOf)="FWO Senior"
case 9b: goal=undefined milestone="FWO Senior" milestoneDate=undefined folded(summaryOf)="FWO Senior"
case 9c: goal=undefined milestone="" milestoneDate=undefined folded(summaryOf)=""
case 9d: goal=undefined milestone=undefined milestoneDate=undefined folded(summaryOf)=""
case 9e: goal=undefined milestone=undefined milestoneDate=undefined folded(summaryOf)=""
case 10 model: hosts=[{"name":"A","status":"warm","scores":{}}] hostCriteria=["x"] eligibility={"rule":["r"],"shots":[]} dropped=[{"what":"d"}] sections=["hosts","host_criteria","eligibility","dropped"]
case 10 findings on career.yml: []
case 11/13 p1: category=publications role=lead
case 11/13 p2: category=other-outputs role=supervisor
case 11/13 p3: category=in-review role=collaborator
case 11/13 p4: category=in-flight role=lead
case 11/13 p5: category=idea role=lead
case 11/13 p6: category=undefined role=lead
case 11/13 p13: category=in-review role=lead
case 11 record rows: ["in-review","in-flight","publications","other-outputs"]
case 11 roles with a field: ["lead","supervisor","collaborator"]
case 11-14: no track record function on the tree; no obtained flag in statuses: []
case 15 findings naming career_: []
case 15 demo config sets: ["career_host_status","career_score_dims","career_score_tones"]
case 16 page: status=200 body={"ok":true,"changed":[],"refused":[]} unchanged=true
case 16 page (candidate): status=200 body={"ok":true,"changed":["status"],"refused":[]} unchanged=false
case 17 host record line: {"at":"2026-10-24T17:57:33.522Z","kind":"host","file":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-route-lv3LIr/.oculus/data/academic/career.yml","key":"Naesens","field":"status","before":"warm","after":"candidate","undo":"field"}
case 17 undo: status=200 body={"ok":true,"changed":["status"],"refused":[]} back=true
case 16 app declaring [host]: status=200 body={"ok":true,"changed":[],"refused":[]} unchanged=true
case 16 app declaring [lead-add]: status=200 body={"ok":true,"changed":[],"refused":[]} unchanged=true
case 16 manifest findings for writes: [host]: []
```

Case 10 on a published snapshot of the unchanged tree, run on a replica of the base (`rsync` of `.agents/worktrees/O68-base` into `$S/base-tree`, `local.yml` excluded, node_modules linked): `cd $S/base-tree && npx vitest run --config $S/vitest.base.config.mts --root $S/base-tree $S/base10.cases.base.ts`. The model read `hosts`, `hostCriteria`, `notHosts`, `eligibility` and `dropped` (the demo's "Rivera Lab", "Meridian Institute", "Coastal AI Center"), and the schema check gave `hosts is [...], which is not a key of vocab.career_host_status`, since the demo config then defined that vocabulary; no `bad_from`.

No case is one the brief's rules get wrong. One observation on the base: case 16's "app declaring [lead-add]" row shows the server's app gate let an app send a `host` body with `X-Oculus-Kind: host` when its manifest declared only `lead-add` (200). The page frame refuses it before the request (`src/lib/state/system/apps/methods.ts:350`). After the step the `host` body matches no write kind, so that row is 403; the gate's handling of an undeclared but known kind is unchanged and outside this step.

## The cases after the change

Command: `cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/after.cases.test.ts`, output in `$S/after-out.txt`. Cases 1-6 call `laneMarks(project, lane)` (state/boards/focus.ts), the marks `LaneCard.svelte` now draws whole. Cases 7-9 call `career(raw)`, `daysLeft(date, Date.parse('2026-10-24T12:00:00'))` and `foldedLine`. Case 10 publishes a scratch copy of the demo hub with a `hosts` schema row and the four old sections appended. Cases 11-14 call `trackRecord(snapshot, config)`. Output as printed:

```
case 1: lane=backburner marks=["in-prep","journal"]
case 1 no form: lane=backburner marks=["in-prep"]
case 2: lane=push marks=["submit-ready"]
case 3: lane=review marks=["journal","results-in","admin-prep","ai-tells"]
case 4: lane=blocked marks=["exploring","parked"]
case 5: lane=idea marks=[]
case 6a: lane=run marks=["poster"]
case 6b: lane=run marks=["results-in"]
case 7: goal="Assistant professor" milestone="FWO Senior" milestoneDate="2026-11-17" daysLeft="in 24d" folded="Career strategy | Next: FWO Senior (2026-11-17)"
case 8: ["in 1d","today","1d ago","3d ago"]
case 9a: goal=undefined milestone="FWO Senior" milestoneDate=undefined daysLeft="" folded="Next: FWO Senior"
case 9b: goal=undefined milestone="FWO Senior" milestoneDate=undefined daysLeft="" folded="Next: FWO Senior"
case 9c: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 9d: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 9e: goal=undefined milestone=undefined milestoneDate=undefined daysLeft="" folded=""
case 10 model keys: ["title","situation","order","sections"] sections=["title","hosts","host_criteria","not_hosts","eligibility","dropped"]
case 10 findings on career.yml schema: [["schema.hosts","the field hosts takes its keys from vocab.career_host_status, which is no registry, projects or vocab list"]]
case 10 snapshot career keys: ["title","goal","milestone","milestoneDate","situation","order","sections","schema"]
case 11: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":1},{"key":"publications","label":"publications","count":1},{"key":"other-outputs","label":"other outputs","count":0}]},{"key":"supervisor","label":"Supervisor","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":1}]},{"key":"collaborator","label":"Collaborator","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]}],"funding":1}
case 12 self unset: null
case 12 nothing to count: null
case 13: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]}],"funding":0}
case 14: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":1},{"key":"publications","label":"publications","count":1},{"key":"other-outputs","label":"other outputs","count":0}]},{"key":"supervisor","label":"Supervisor","lines":[{"key":"in-review","label":"in review","count":0},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":1}]},{"key":"collaborator","label":"Collaborator","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]}],"funding":0}
case 15 findings naming career_: [["career_host_status","key career_host_status is not one the hub's settings file takes; it is not applied"]]
case 15 merged config holds career_host_status: false
case 16 page: status=400 body={"error":"the body is not a write this route knows"} unchanged=true
case 16 app declaring [host]: status=403 body={"error":"kind"} unchanged=true
case 16 app declaring [lead-add]: status=403 body={"error":"kind"} unchanged=true
case 16 manifest findings for writes: [host]: [["apps[notes]","writes names host, which is no write an app can ask for, so the folder is not an app"]]
case 17 undo: status=404 body={"error":"gone"} thrown="" unchanged=true
```

Reading of the results against the brief:

- Cases 1-6 match the brief. Case 3 draws all four marks; the card's first row `.card-h` has `flex-wrap: wrap` (`LaneCard.svelte:165`), so a narrow card wraps them. The look on the TEST page is at landing.
- Case 9c: the brief's `milestone: ""` with a date gives no milestone and no date. Case 9e: a map as `milestone` gives none.
- Case 10: the message is the catalog text of `findings.schema.bad_from` (`config/text/findings.yml:255`). The model keeps the four old sections only in `sections`, which the career editor edits; the banner reads none of them.
- Case 11: the `nascent` project files under `idea` and the published one with no form under no category, so neither is counted; funding obtained 1 (the `awarded` entry; `rejected` carries no `obtained`).
- Case 13: the project naming the user as lead and collaborator is counted once, under lead.
- Case 14: run with the merged config's `statuses` replaced by a map without `obtained`: funding 0, so the panel draws no funding line (`{#if record.funding > 0}`), no error.
- Case 17: the undo of a `host` record answers 404 `gone`, since the undo's record kinds no longer hold `host` (`undo.ts` `RECORD_KINDS`), no exception, the file unchanged.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| Brief 1: `laneMarks`, the card draws every mark its lane does not say, `CARD_CHIPS` gone | DONE | cases 1-6; grep 3 has no `CARD_CHIPS` |
| Brief 2: the career model, `Host` gone, the normaliser's `config` gone, `status-rows.ts` deleted | DONE | case 10 keys; `git status` lists `status-rows.ts` as deleted |
| Brief 3: the track record and the `obtained` flag on awarded and granted, with its comment and shape help | DONE | cases 11-14; `config/catalogs/vocab.yml:109`, `vocab.ts:173` |
| Brief 4: days-left words, panel sections, `foldedLine`, `CareerHosts.svelte` deleted, texts | DONE | cases 7-9 |
| Brief 5: write kind `host` removed everywhere, the three hub keys removed, the awaiting hosts removed, diagrams regenerated | DONE | cases 15-17; item 5's greps; grep 3 |
| Brief 6: demo fixture, docs, tests | DONE | files below; item 4's runs |
| Round item 1: `homeOf`'s comment and the host-write sentences | DONE | above |
| Round item 2: the comments at 100 columns | DONE | above |
| Round item 3: HELP's funding line | DONE | above |
| Round item 4: each added or changed row on the unchanged source | DONE | above |
| Round item 5: the greps and the comment list | DONE | above |
| Verify: `npm run diagrams && npm run test:quick` | two red rows the step does not cause | below |
| Verify: character-set check | DONE | prints nothing, exit 0 |
| Verify: grep 3 | DONE | no hit read by code for the removed things |
| Verify: unused exports | DONE | differs only by removals |

**`npm run diagrams && npm run test:quick`**, run from the worktree root after the last change. The output is in `$S/quick2.txt`; the tier lines as printed:

```
test:quick: 69 changed file(s), from git since HEAD
test:quick: 295 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.6 s)
ok      svelte-check (158.9 s): 1792868563975 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (215.9 s)
FAILED  vitest checks (242.0 s)
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
+ src/desktop/app.ts:161: // Every window of the app loads its pages on this session, so the mark rides every request
FAILED  vitest (273.0 s)
 FAIL  |unit| tests/routes/hubs/make.test.ts > the hub files, a git repository and the repository configuration > makes a folder with no .git a git repository by running git init there, recorded as one create of the .git folder, and refuses a folder that has one (G9)
ok      vitest slow (319.7 s): Duration  309.24s (transform 18.46s, setup 0ms, import 271.29s, tests 940.63s, environment 21ms)
test:quick: 322.7 s; failed: vitest checks, vitest
```

The two failures:
- **The history row.** It is the row the round brief books for landing. The pattern `SESSIONS = ['this session', 'earlier session']` (`tests/checks/source/history.test.ts:68`) matches the Electron session that `src/desktop/app.ts:161` names. `git diff --stat -- src/desktop/app.ts` prints nothing. On the base replica, `cd $S/base-tree && npx vitest run --root $S/base-tree tests/checks/source/history.test.ts` gives `Tests  1 failed | 5 passed (6)` with the same received line.
- **The `make.test.ts` row.** It failed with `Error: Test timed out in 5000ms.` at `tests/routes/hubs/make.test.ts:445:5`. Run alone, `npx vitest run tests/routes/hubs/make.test.ts` in the worktree gives `Test Files  1 passed (1)` and `Tests  35 passed (35)`. The step's first `test:quick` run, before this round, had `ok vitest`. This round changes comments and HELP only, and nothing `make.test.ts` runs. The 5000 ms limit was passed while svelte-check and eslint ran 3 to 10 times slower than in that first run.

**Character-set check.** `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` prints nothing; `echo $?` gives `0`. `LC_ALL=C grep -n '[^ -~]'` over `docs/HELP.md`, `docs/apps.md`, `docs/data-map.md`, `docs/templates.md` and this report prints nothing.

**Grep 3.** The brief's grep, counted by file (`... | cut -d: -f1 | sort | uniq -c`):

```
   1 src/hooks.server.ts
   2 src/lib/server/machine/apps/read/manifest.ts
   1 src/lib/server/machine/apps/serve/oculus.js
   2 src/lib/server/machine/runs/recover/routes.ts
   2 src/lib/shell/status/status-items.ts
   1 src/lib/shell/status/StatusBar.svelte
   1 src/lib/state/system/machine/recover-words.ts
   2 src/lib/state/workbench/layout.svelte.ts
   1 src/lib/state/workbench/layout/index.ts
   1 src/lib/state/workbench/layout/open/float/pages.ts
   3 src/lib/state/workbench/layout/tabs/instances.ts
   3 tests/data/sources/career.test.ts
   1 tests/routes/machine/recover.test.ts
   1 tests/server/machine/apps/oculus-frame.test.ts
   2 tests/server/machine/hpc/actions.test.ts
   1 tests/shell/panes/strip/app-editor-close.test.ts
   6 tests/state/forms/record-values.test.ts
   1 tests/state/workbench/options-pages.test.ts
   5 tests/ui/controls/editor/lsp-transport.test.ts
```

Each remaining hit is something else:
- `'host'` used for other things: the request header, the status bar item, an app's host program, the recover refusal, and test values.
- The workbench's `writeHost`, which writes a float window's workbench.
- The `eligibility` form fixture of `record-values.test.ts`.
- The old sections that `tests/data/sources/career.test.ts:36-40` feeds to 'reads none of the sections the banner does not draw into the model'.

`docs/diagrams/` has no hit after the regeneration.

**Unused exports.** `sh utils/unused-exports.sh` compared with `.agents/worktrees/O68-base/unused-exports.txt` differs in one line, `49c49`: `src/lib/server/edit/writes.ts` without `writeHost` and `hostWrite`. No line is added. The row types `RecordLine` and `RoleRecord` are local to `state/boards/career.ts`.

**The changed test files, whole, after the change.** The command:

```
npx vitest run tests/data/sources/career.test.ts tests/server/edit/writes.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/routes/hubs/hub-writes.test.ts tests/state/client/held-unsaved.test.ts tests/state/forms/page-entry.test.ts tests/checks/config/config-folder.test.ts
```

- Before the change: `Test Files  8 passed (8)`, `Tests  248 passed | 2 skipped (250)` (`$S/base-tests.txt`, the old text on the old source).
- After the change: `Test Files  8 passed (8)`, `Tests  251 passed | 2 skipped (253)` (`$S/after-tests.txt`).
- Item 4 above holds the run of the new rows on the old source.

## test:quick count and whole-suite commands

`npm run test:quick` ran to completion once in the build and once in this round, each time after that pass's last change. One start in the build was stopped before its vitest tiers and its output is not used. No whole-suite command ran.

## Files with line counts (base -> now)

```
config/catalogs/vocab.yml 264 -> 265
config/defaults/sources.yml 114 -> 114
config/options/sources.yml 125 -> 125
config/text/server.yml 536 -> 530
config/text/views/boards/focus.yml 136 -> 131
config/text/views/system/history.yml 111 -> 110
docs/HELP.md 558 -> 558
docs/apps.md 822 -> 820
docs/data-map.md 228 -> 223
docs/templates.md 1360 -> 1299
docs/diagrams/writes.dot 1160 -> 1148
docs/diagrams/writes.svg 3972 -> 3900
docs/diagrams/layers.dot 101 -> 101, layers.svg 556 -> 556
docs/diagrams/layer-data.dot 94 -> 94, layer-data.svg 465 -> 465
docs/diagrams/layer-server.dot 159 -> 159, layer-server.svg 781 -> 781
docs/diagrams/layer-state.dot 173 -> 173, layer-state.svg 855 -> 855
docs/diagrams/layer-views.dot 189 -> 189, layer-views.svg 855 -> 855
src/lib/data/helpers/files/apps/apps.ts 309 -> 308
src/lib/data/helpers/hub-names.ts 474 -> 470
src/lib/data/model/index.ts 842 -> 841
src/lib/data/model/model-collections.ts 267 -> 257
src/lib/data/shapes/boards/roles.ts 208 -> 208
src/lib/data/shapes/catalog-files/vocab.ts 422 -> 390
src/lib/data/snapshot/normalise-parts/career.ts 165 -> 87
src/lib/data/snapshot/normalise.ts 647 -> 647
src/lib/data/sources/config/catalog/schemas/engine.ts 235 -> 235
src/lib/data/sources/documents/career.ts 27 -> 27
src/lib/server/edit/entry-edit/entries.ts 391 -> 391
src/lib/server/edit/entry-edit/host-status.ts deleted (81)
src/lib/server/edit/entry-edit/index.ts 17 -> 16
src/lib/server/edit/writes.ts 804 -> 788
src/lib/server/edit/writes/apps/gate.ts 134 -> 132
src/lib/server/edit/writes/bodies.ts 706 -> 692
src/lib/server/edit/writes/hubs.ts 291 -> 292
src/lib/server/edit/writes/subtasks.ts 440 -> 339
src/lib/server/edit/writes/undo.ts 631 -> 615
src/lib/server/edit/yaml/why.ts 75 -> 71
src/lib/state/boards/career.ts 96 -> 114
src/lib/state/boards/focus.ts 492 -> 503
src/lib/state/client/writes.svelte.ts 868 -> 859
src/lib/state/sessions/source/write-files.ts 264 -> 263
src/lib/state/shared/stores/shapes.ts 517 -> 516
src/lib/state/shared/words/status-rows.ts deleted (40)
src/lib/state/shared/words/tones.ts 318 -> 319
src/lib/views/boards/focus/Focus.svelte 273 -> 272
src/lib/views/boards/focus/career/CareerHosts.svelte deleted (196)
src/lib/views/boards/focus/career/CareerPanel.svelte 412 -> 354
src/lib/views/boards/focus/lanes/LaneCard.svelte 233 -> 229
src/lib/views/boards/focus/lanes/Lanes.svelte 366 -> 369
tests/checks/config/config-folder.test.ts 814 -> 807
tests/data/real-hub.probe.ts 143 -> 145
tests/data/sources/career.test.ts 126 -> 183
tests/fixtures/hubs/demo/.oculus/config.yml 57 -> 39
tests/fixtures/hubs/demo/.oculus/data/academic/career.yml 34 -> 14
tests/routes/edit/undo/undo.test.ts 872 -> 863
tests/routes/edit/write-fixture.ts 547 -> 546
tests/routes/hubs/hub-writes.test.ts 841 -> 815
tests/server/core/changes.test.ts 573 -> 564
tests/server/edit/writes-fixture.ts 205 -> 207
tests/server/edit/writes.test.ts 845 -> 793
tests/state/client/held-unsaved.test.ts 449 -> 444
tests/state/forms/page-entry.test.ts 244 -> 239
```

Files beyond the brief's list, with why:
- `src/lib/server/edit/writes/hubs.ts`: round item 1, which widens the path list.
- `src/lib/state/shared/words/tones.ts` and `src/lib/data/sources/config/catalog/schemas/engine.ts`: each held a comment the step made false, found by round item 5's comment grep. The lane card no longer draws every word of `projectStatusWords`, and the career words are no longer catalog-file keys of the hub list.
- The eight `docs/diagrams/layer*.dot|svg` files: `npm run diagrams` rewrote them because the step's import changes move the folder-to-folder counts.

Files in the brief's list that the step does not change: `src/lib/data/index.ts`, `tests/fixtures/hubs/deposit-world.ts` and `tests/data/hubs/hubs-fixture.ts`. They call `readCareer` or `careerRules`, whose signatures stay, and name no host.

No source file passes 880 lines and no component passes 520. The largest are `writes.svelte.ts` at 859 and `CareerPanel.svelte` at 354.

## Judgment calls the brief left open

1. The model carries the milestone as two optional strings, `milestone` and `milestoneDate`, one for each key of the file, rather than one object.
2. `milestoneDate` is set only when `milestone_date` matches `ISO_DATE` (`src/lib/data/helpers/dates.ts`) and `milestone` holds words (case 9c).
3. A role of the track record lists every record row, zeros included, so each role shows the same rows in the same order. A role with all zeros is left out. The funding line is drawn only when its count is above 0.
4. The track record is the panel's last section, after the order of work, in the situation's label grid (`.facts`).
5. The days left are a `Tag` after the milestone's date on the Next line.
6. `entryPeople` and `isSelfByKey` in `data/shapes/boards/roles.ts` are exported, so the funding lead is read by `isLead` as the boards read it.
7. The icon row of `config-folder.test.ts` reads the icons of `stages`, `forms`, `chips` and `statuses` and asserts the list is not empty. The flag count rises from 37 to 38 for `obtained`.
8. The demo career file is rewritten with fake data in the new shape, with no `schema:` block; the base demo file had none either.
9. The `obtained` comment and shape help name the "career banner", the surface's name across the tree. The brief's dictated words said "career card". The round brief records this as the tree's word.

## Edits to existing assertions (before / after)

- `tests/checks/config/config-folder.test.ts` 'uses glyph names for every configured icon': before, `career_host_status` icons checked in the glyph catalog plus `statuses` icons; after, the icons of `stages`, `forms`, `chips`, `statuses`, `expect(icons.length).toBeGreaterThan(0)` added, the glyph check unchanged. Flag count: before `toHaveLength(37)` with "7 status flags"; after `toHaveLength(38)` with "8 status flags".
- `tests/server/edit/writes.test.ts`: describe 'writing one career host' removed with its write. In describe 'writing career sections' the fixture `CAREER_SECTIONS` holds `milestone_date`, `order` and `situation` instead of `hosts` and `eligibility`; 'writes a renamed label...' checks `toContain('order:\n  - { task: "Veni pre-proposal"')` (before `hosts:\n  - { name: "Naesens"`); 'changes a score column of a host and keeps the other hosts and columns' became 'changes the day of one task of the order of work and keeps the other tasks' (`changed` `['order']`, before `['hosts']`); 'changes the caveat of the eligibility map and keeps its rule' became 'changes one fact of the situation and keeps the other with its comment'; 'refuses a value of the wrong type...' writes `{ milestone_date: 'soon' }` (before a host with status `promoted`).
- `tests/server/core/changes.test.ts`: 'records a career host, a session override and a feed field' became 'records a session override and a feed field', the host record's `toMatchObject` removed; `CAREER` is `title: Career\ngoal: "Assistant professor"\n`.
- `tests/routes/edit/undo/undo.test.ts`: 'puts a career host and a subtask line back' became 'takes an added subtask line out again', the host write and its undo removed; the subtask part unchanged.
- `tests/routes/hubs/hub-writes.test.ts`: the row "writes an app's host status to the first hub's career file in a workspace with no primary" removed.
- `tests/state/client/held-unsaved.test.ts`: the row 'a host status' removed from describe 'a write that adds a record and names no hub, in a workspace with no primary'.
- `tests/data/sources/career.test.ts`: "gives a host with no status the hub's career_host_status word carrying default" removed; 'parses it as the map it is, with no key renamed' expects the `milestone_date` key; added `it.each` 'reads $name' (six rows: goal, milestone with its day, no day, a day that is no day, an empty milestone, a milestone that is a map) and 'reads none of the sections the banner does not draw into the model'.
- `tests/state/forms/page-entry.test.ts`: the model's `hosts`, `hostCriteria`, `notHosts`, `eligibility`, `dropped` removed from its career fixture.

## Visible changes, before and after

- Lane cards' marks: before, the first two of stage, form and chips, the lane's own words included (case 3 drew `submitted`, `journal`). After, every mark the lane does not say, each once, wrapping (case 3 draws `journal`, `results-in`, `admin-prep`, `ai-tells`; case 5 draws none).
- Career banner sections: before, situation, Next (milestone text), order of work, Host pipeline (`CareerHosts.svelte`, score chips, status menu), Not hosts, FWO Senior eligibility (Shots left, Rules, Caveat), Dropped. After, situation, Goal, Next (milestone, its date, days left), order of work with its note, Track record (role, one line per record row, "funding obtained: N").
- Folded line: before, title, `Next: ` the milestone cut at " (" or " - ", and "N in flight" (`Career strategy | Next: FWO Senior | 1 in flight` for the hub). After, title and `Next: FWO Senior (2026-11-17)`.
- Awaiting box: the "Host outreach" row is gone; the other rows are unchanged.
- App write kind `host`: before, accepted by the app gate and the page route (200). After, a page's `host` body is 400 "the body is not a write this route knows"; an app's is 403 `kind`; a manifest declaring `writes: [host]` gets `write_unknown` and is no app.
- Three hub keys: `career_host_status`, `career_score_dims`, `career_score_tones` in a hub's `.oculus/config.yml` are `hub_key_unknown` findings ("key career_host_status is not one the hub's settings file takes; it is not applied") and are not applied.
- History view: an old `host` record shows its raw kind `host`, since the view words a kind only when `history.kind_<kind>` is in the catalog (`src/lib/views/system/history/History.svelte:120`) and `kind_host` is gone; its undo answers 404 `gone` and changes nothing (case 17).

## Brief errors

None found in what the step builds.

Case 10's `bad_from` holds once the hub no longer defines `career_host_status`. On the base, where the demo hub defined it, the same schema row gave the finding "not a key of vocab.career_host_status" instead.

## Doc text

Each fragment below is quoted from `.scratch/migration/agents/guarded.md` as `grep -no` prints it; each line there runs from 5,000 to 11,000 characters. Each comes with its replacement. The round brief leaves these lines to the orchestrator at landing.

- G8, line 72:
  - The fragment `72:describe 'a write that makes a record' (with its row "writes an app's host status to the first hub's career file in a workspace with no primary")` names a row that sat in another describe. On the base, `git show HEAD:tests/routes/hubs/hub-writes.test.ts | grep -nE "^describe|writes an app's host status"` prints `576:describe('a write that makes a record'`, `670:describe('a write from an app'` and the row at `729`, so the row was in 'a write from an app'.
  - The step removes the row. The replacement drops the parenthesis and leaves `describe 'a write that makes a record'`, which names no row.
  - The fragment `72:describe 'writing career sections'` (followed by ", every row") stays: the describe keeps its name and its renamed rows.
- G9, line 75:
  - `75:'records a career host, a session override and a feed field'` becomes `'records a session override and a feed field'`.
  - `75:'puts a career host and a subtask line back'` becomes `'takes an added subtask line out again'`.
- G28, line 82: `82:describe 'the writes of the entry pages over a file a source tab holds unsaved text of', every row` and `82:describe 'a write that adds a record and names no hub, in a workspace with no primary'` stay. Each names a whole describe, and the removed row 'a host status' was in the second.
- G32, line 227: `` 227:`tests/data/sources/career.test.ts`, 'parses it as the map it is, with no key renamed', 'reads the title, the milestone and the situation strip' `` becomes `` `tests/data/sources/career.test.ts`, 'parses it as the map it is, with no key renamed', 'reads the title, the milestone and the situation strip', describe 'normalising it', the rows 'reads $name' and 'reads none of the sections the banner does not draw into the model' ``. The fragment "describe 'what the editor edits', every row" stays.

## Hub rewrite

Built from `~/workspace/research-hub/.oculus/data/academic/career.yml` (98 lines), `.oculus/config.yml` and `.oculus/data/academic/funding.yml`, read only. Drafts in `$S/hub/career.yml` and `$S/hub/hosts.md`. The drafted career file was read with this step's code over a scratch copy of the demo hub (`cd $W && npx vitest run --config $S/vitest.cases.config.mts --root $W $S/hubdraft.cases.test.ts`, output `$S/hubdraft-out.txt`):

```
model: {"title":"Career strategy","goal":"Assistant professor / tenure-track (NL UD or Flemish ZAP)","milestone":"FWO Senior","milestoneDate":"2026-11-17","situation":[{"label":"PhD",...},{"label":"Past",...},{"label":"Now",...},{"label":"Also",...}],"order":[{"task":"ERC Starting Grant","when":"Oct 2027","note":""}]}
schema fields: ["title:text","goal:text","milestone:text","milestone_date:date","situation:records","order_note:textarea","order:records"]
findings on career.yml: []
folded: "Career strategy | Next: FWO Senior (2026-11-17)" daysLeft on 2026-10-24: "in 24d"
```

The hub's career file has no `order_note`, no `not_hosts` and no `dropped:` key (line 98 is the comment `# Dropped - what + why` with nothing after it), so neither the new career file nor the Markdown file carries a dropped list or a not-hosts list.

### `.oculus/data/academic/career.yml`, whole new text

```yaml
# Career strategy: drawn by oculus as the Focus page's career banner, the Career strategy panel.
# This file holds the goal, the next milestone with its day, the situation and the order of work. Funding and career deadlines live as `deadline:` on the entries of .oculus/data/academic/funding.yml, where they drive the "This week" ticker. The FWO Senior hosts, the host criteria and the eligibility are in funding/2026-fwo-senior-transplant/hosts.md.
# Form schema: the sections of this file, one field each. A records field lists the fields of each row, and open: true lets a row carry keys the schema does not name (the situation's labels).
schema:
  - { field: title, type: text, help: "The name the Career strategy panel is listed under." }
  - { field: goal, type: text, help: "The position the career plan works toward." }
  - { field: milestone, type: text, help: "The next milestone, shown at the head of the panel." }
  - { field: milestone_date, type: date, help: "The day of the next milestone, YYYY-MM-DD; the panel counts the days left to it." }
  - field: situation
    type: records
    open: true
    help: "Facts about where the hub owner stands now, one label and one sentence each."
    fields: []
  - { field: order_note, type: textarea, help: "A note drawn over the order of work." }
  - field: order
    type: records
    help: "The order of work, in priority order."
    fields:
      - { field: task, type: text, required: true, help: "What to do." }
      - { field: when, type: text, help: "When it is due, as text." }
      - { field: note, type: text, help: "An optional remark on the task." }

title: Career strategy
goal: "Assistant professor / tenure-track (NL UD or Flemish ZAP)"
milestone: "FWO Senior"
milestone_date: "2026-11-17"

# Situation: a key-value fact strip
situation:
  PhD: "May 2023, KU Leuven (Marc Van Hulle)"
  Past: "Postdoc, UHasselt 2024-2025 (Liesbet Peeters)"
  Now: "Postdoc, U Twente - AI for HCC (ZonMw AI-HCC), since Jan 2026"
  Also: "Research Affiliate, UHasselt; BKO completed"

# Order of work, in priority order (task, when and an optional note)
order:
  - { task: "ERC Starting Grant", when: "Oct 2027", note: "" }
```

The situation's `Now` value keeps its " - " byte for byte, since it is the hub's data. The `Target` row is gone; its text is `goal`. The old header's "Dates verified June 2026; reconfirm per call page." referred to the eligibility dates, which move to the Markdown file.

### `.oculus/config.yml`

Lines to remove, 70 to 87 (`grep -n "" .oculus/config.yml | sed -n '/host pipeline of the Focus/,/leads_fit/p'`): the comment at 70, `career_host_status:` with its five rows (71-76), the blank 77, the comment at 78, `career_score_dims:` with its four rows (79-83), the blank 84, the comment at 85, `career_score_tones:` (86) and the blank 87. Line 88 (`# The colour of a Position Lead's fit chip, by its fit.`) and 89 (`leads_fit:`) stay.

Line 3 rewritten:

```
# This hub's settings for oculus: the folders and files the portfolio is built from, the hub's documents, the cluster its jobs run on, the files the writing rules skip or let draw arrows, the wallpaper image, and the hub's own words: the fit colours of the Position Leads. A key here replaces the value of the same key in oculus's own config/*.yml whole; a key outside oculus's hub list is a finding and is not applied. The hub's data files are at oculus's own paths under .oculus/data/ (its config/sources.yml), so this file names no `collections:` list and no `career_file`; a missing file of that list is a finding, since the hub holds the folder. The research domains, with their colours, labels and whether they expect a dataset, are the entries of .oculus/data/pillars/domains.yml, and the theme words of the venues and datasets are the options of the `themes` field of .oculus/data/research/venues.yml and .oculus/data/research/data.yml.
```

### `funding/2026-fwo-senior-transplant/hosts.md`, whole text

The folder holds no `hosts.md` (`ls` lists ASSESSMENT.md, concept-note, grants, meetings, naesens-concept-note.md, proposal, QUESTIONS-FOR-NAESENS.md, RESEARCHQUESTIONS.md). The scores of each host's note (`[proposal: ... | after: ...]`) are the table's columns, so the notes below start after them; every other word is the career file's.

```markdown
# FWO Senior hosts

The host candidates for the FWO Senior application (clinic-embedded AI and federated learning, Leuven area preferred), ranked with the best fit first, with the host criteria and the eligibility of the call. Status words: awaiting (email sent), warm (in dialogue), candidate (not yet contacted), drafted, dropped. Score columns: proposal, AI+FL+clinic fit, backing, after (post-postdoc / ZAP); scores Strong, Good or Mid, backing High or Med.

## Hosts

Naesens is the active host; the other fourteen are the long list, in rank order.

| Host | Institution | Field | Status | Proposal | AI+FL+clinic | Backing | After |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Naesens | KU Leuven / UZ Leuven | transplant nephrology | warm | Strong | Strong | High | Strong |
| Meyfroidt | UZ Leuven / KU Leuven | ICU / critical care | warm | Strong | Strong | High | Strong |
| Roskams | KU Leuven / UZ Leuven | digital pathology (liver/HCC) | dropped | Strong | Strong | High | Strong |
| Stalmans | KU Leuven / UZ Leuven | ophthalmology (retinal/OCT) | warm | Strong | Strong | Med-high | Strong |
| Vermeesch | KU Leuven | clinical genomics / cfDNA | candidate | Strong | Strong | High | Strong |
| Van Damme | VIB-KU Leuven / UZ Leuven | ALS (rare disease) | candidate | Strong | Strong | High | Good |
| Bosmans | KU Leuven / UZ Leuven | medical-physics AI assurance | candidate | Good | Good | Med-high | Good |
| Lambrechts | VIB-KU Leuven | cancer single-cell multi-omics | candidate | Strong | Good | High | Good |
| Vandecaveye | KU Leuven / UZ Leuven | radiology (tumor MRI) | candidate | Good | Strong | Med-high | Good |
| Vens | KU Leuven (Kulak) | interpretable ML / survival, ICU | candidate | Strong | Good | Good | Good |
| Nagels | VUB / UZ Brussel | MS / digital medicine | candidate | Strong | Strong | Med | Good |
| Mathieu | UZ Leuven / KU Leuven | diabetes | candidate | Good | Good | High clout | Mid |
| Laukens | UAntwerpen | biomedical data mining | candidate | Mid | Weak clinic | Med-high | Mid |
| Sijbers | UAntwerpen | imaging methods (MRI/CT) | candidate | Good | Weak clinic | Med | Mid |
| Vandemeulebroucke | VUB / UZ Brussel | imaging / CDS | candidate | Mid | Med | Med | Mid |

- **Naesens.** Federated + interpretable outcome prediction across international consortia; no in-house FL lead. Call went well, strongly interested; concept = next step. maarten.naesens@kuleuven.be
- **Meyfroidt.** Head of Clinic ICU; multi-centre (CENTER-TBI HR-ICU, SOPRANI MSCA network to Nov 2027), FL-natural; neuro-ICU signals are the closest domain match of any host. CAVEAT: Fabian Guiza has been the group's ML scientist 15+ yr, so no generic-ML pitch; the wedge is federation + multiway structure + conformal certification, and his recent line is the operationalization gap not more models. First meeting 06/08 in person, Leuven; prep in funding/2026-fwo-senior-meyfroidt/. geert.meyfroidt@kuleuven.be (he replies from kuleuven.be, not uzleuven.be)
- **Roskams.** Multiway whole-slide data, federation-natural; builds on the HCC domain. Emailed + nudged. tania.roskams@uzleuven.be
- **Stalmans.** Federated cross-centre + retina-as-cardiovascular-marker; replied warm, meeting (+Jan Van Eijgen, joining half-time). ML seat partly filled (Blaschko ESAT/PSI + Van Eijgen LUNet/PVBM). Use her personal (Mac) address, not KU Leuven.
- **Vermeesch.** cfDNA (MetDecode); cleanest FL hook (genomic privacy); new domain. 2nd-wave contact.
- **Van Damme.** Clinician-scientist; rare-disease federation hook; mild neuro overlap. 2nd-wave.
- **Bosmans.** Federated imaging (EuCanImage); faithful/verifiable-AI angle. Hold (Roskams same dept).
- **Lambrechts.** VIB Cancer Biology; single-cell multi-omics from trial biopsies; big omics pivot, not bedside.
- **Vandecaveye.** Tumor MRI AI; strong but closest to current imaging/HCC work. Hold.
- **Vens.** Interpretable ML for health + survival; Kortrijk (not Leuven) + overlaps interpretability strength.
- **Nagels.** Already does MS-FL; neuro overlap + Brussels.
- **Mathieu.** Max clinic + data, but weak methods-culture (service-analyst risk).
- **Laukens.** Not clinic-embedded; fits federated-tensor/omics strengths.
- **Sijbers.** Engineer (not clinic), imaging overlap.
- **Vandemeulebroucke.** Imaging + CDS; junior sponsor, Brussels.

## Host criteria

- Clinic-embedded, AI where federated learning is actionable
- Leuven-area (lifestyle)
- NOT a former supervisor (independence)
- I am the FL / interpretable-methods lead, not one of many
- A sponsor who backs me + a hireable niche (new institution is NOT the driver)

## Eligibility

The rule of the call:

- PhD 3-6 yr before 1 Oct of start
- >= 2 yr postdoc
- Flemish host
- max 2 applications/type (junior closed)

The calls that remain:

- Nov 2026 (Oct 2027 start)
- Nov 2027 (Oct 2028 start)

Caveat: From the 2027 round, the 2nd attempt lapses if the 1st was not top-50% at preselection, so a rushed 2026 try risks the second. Oct 2029 is >6 yr, so ineligible.
```

`LC_ALL=C grep -n '[^ -~]'` over both drafts printed nothing (exit 1).
