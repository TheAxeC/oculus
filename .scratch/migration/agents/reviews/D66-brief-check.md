# Brief check of D66 (oculus/migration)

Main moved while this check ran. HEAD is now `e74a5d459`. Commit `f26eadd9b` ("Update type_color values ...", 12:30) changed `tools/oculus/config/catalogs/vocab.yml:55` (`paused: "#f59e0b"` became `paused: "#9ca3af"`) and `config/layout.yml`. `git diff --stat 18baa21ca HEAD -- tools/oculus` shows only those two files. The checks below were run on `e74a5d459` unless they say otherwise. The brief's premise header ("read on main at 18baa21ca") is out of date, and Case 1 now contradicts the tree (see Premises and Cases).

## Names

Commands: `git grep -n "nodeTone\|archiveStatuses\|archColors" -- ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'`, `git grep -n -l arch_color -- ':!tools/oculus/config/local.yml'`, `git grep -n "Project-card colours"`, `git grep -n -w Status -- tools/oculus/src/lib/views/structure/map`, and `git grep -n "live-row\|\.session\b" -- tests src`.

Hits outside "Paths this step writes":
- **`arch_color` in `tools/cockpit/`**: `DESIGN.md`, `README.md`, `data/config/vocab.yml`, `dummy/data/config/vocab.yml`, `src/cockpit/page.py`. The change does not make them false, because the cockpit has its own configuration (Decision 3).
- **`arch_color` in `tools/oculus/.scratch/`**: briefs D3, O10c, O24b, Q25, Q4b, Q85d; reviews A3, D14 (2), D18, M3 (2), O24b, Q4b, Q71, Q88c, S3a, X3c; `orchestrator-history.md`; `plan.md:766,1760`. These are logs. The change makes none of them false as records.
- **The `vocab.yml:54` comment** also appears at `tools/cockpit/data/config/vocab.yml:225`. It stays true there.
- **`nodeTone`, `archiveStatuses`, `archColors`**: no hit outside the write list.
- **`Status` in `Controls.svelte`**: local type, lines 22 and 27 only.
- **`.live-row`, `.session`**: no other CSS class hit. The `.session` hits in src are unrelated JS properties.
- **Indirect reader**: `VOCAB_FILE_KEYS` (`catalog-files.ts:103`, derived from `vocabFileShape`) is read by `src/lib/data/snapshot/schema/run.ts:134` and `static.ts:49`. Removing the key drops it from that list. No schema references `vocab:arch_color` (`git grep arch_color -- tools/oculus/config` gives only `vocab.yml`), so nothing becomes false.
- **Other layers**: none hold `arch_color`. Checked with `grep -rln --exclude=local.yml arch_color` over the hub `.oculus/`, every `~/workspace/*/.oculus` and `tools/oculus/demo/.oculus`. The only `~/.oculus` hit is `transcript-cache.json`, which is data and irrelevant.

## The step line

| Part of the D66 step line | Requirement in "What to build" |
|---|---|
| `arch_color` removed from `vocab.yml` and its schema | Item 1, bullet 1 |
| Map draws every node in the colour `type_color` gives its type (`nodeTone`, `archiveStatuses`, `Map.svelte`, `Graph.svelte`) | Item 1, bullets 3 to 5 (adds `Controls.svelte`, which the step needs) |
| `vocab.yml:54` comment | Item 1, bullet 2 |
| `config-folder.test.ts` | Item 1, bullet 6 |
| "every sentence naming `arch_color` follow" | Case 6 and Decision 3 |
| (2) live-session rows at the card's text size | Item 2 |
| "Independent of D63 and D64, before Q72" | Ordering only; needs no requirement |

The part with no satisfiable requirement is "**no known type draws grey**". `type_color` itself maps `dropped: "#9ca3af"` (already at 18baa21ca) and now `paused: "#9ca3af"` to the palette's `c-grey`. A Python read of `palette` against `type_color` printed `paused #9ca3af c-grey` and `dropped #9ca3af c-grey`, so those two known types draw grey on the boards and, after the step, on the Map. The step line wording needs to read "no known type draws a colour its board card lacks".

The phrase "the card's text size" is ambiguous. `ui/frame/Card.svelte:209` sets `.body { font-size: var(--fs-md) }`, which is the row's current size. The brief resolves this to `--fs-sm` in Decision 1.

## Premises

The plan has no "Goal" section (`grep -n -i goal plan.md` finds only lines 320 and 821). The goal was taken from this check's prompt.

Each premise rerun:
- **`vocab.yml:54` comment text**: holds (`sed -n 54p`).
- **`type_color` at line 55 with 16 types; `arch_color` at 225 to 234 with 9 types, colours equal**: holds on both 18baa21ca and HEAD (Python read printed `16 9 {}`). The types `arch_color` lacks: `['active', 'archived', 'exploring', 'finished', 'idea', 'paused', 'phd']`. This matches the brief.
- **New on HEAD, not in the brief**: `paused` is now `#9ca3af` (`c-grey`).
- **Blank lines**: `vocab.yml` lines 224, 235 and 236 are blank. Item 1's "with the blank line around them left as the file's spacing between keys" does not say which one goes. Removing 225 to 234 alone leaves three blank lines, and the file's spacing between groups is two (lines 52 and 53).
- **`arch_color` sites**: every line holds as cited: `catalog-files.ts:93`, `graph.ts:313`, `Graph.svelte:381`, `Map.svelte:67`, `node-view.ts:9,23,25-27`, `config-folder.test.ts:231`.
- **`graph.ts:79-81` `archived()` and `graph.ts:101` `type: project.type`**: hold.
- **`archiveStatuses` at `graph.ts:315-330`, `Controls.svelte:22` and `:118`**: hold.
- **`typeTone` at `tones.ts:139`**: holds. The board card uses the same call, `items.ts:107` `tone: typeTone(project.type ?? '')`.
- **No other oculus file names the three names**: holds outside `.scratch`. The brief's `'*.md'` pathspec also matches the `.scratch` files listed above.
- **Repo-wide `arch_color` only in `tools/cockpit/` besides the step's files**: holds if `tools/oculus/.scratch` is excepted.
- **`Usage.svelte` lines**: `.live-row` at 330 to 338 (`--fs-md`, line 337), `.session` at 340 to 344 and `.refresher` at 309 to 313 hold. `.live h3, .history h2` is lines 319 to **326**, not 325, and the rule is shared with `.history h2`.
- **`tokens.css:130-135` role rule**: holds.
- **Card sizes the brief omits**: `Card.svelte:166` title `--fs-md`, `:204` meta tags `--fs-xs`, `:209` body `--fs-md`, and `Meter.svelte:74` meter text `--fs-xs`.
- **Size premise the brief misses**: `wc -l` gives `src/lib/views/structure/map/Graph.svelte` **524 lines**. That is over spec.md:46's 520 for a component. The step changes this file, and removing `selectors: { configMap },` leaves it at about 523. Spec.md:46 says "A file the step changes that would pass ... 520 is split by concern in the step". The brief needs to name this: either a split, or a ruling that a file already over the line which the step shrinks is exempt. The size test refuses only 540 (`tests/checks/tree/size.test.ts:28-29`), so no check would catch it.
- **Unused exports already present**: `sh utils/unused-exports.sh` at HEAD prints `src/lib/state/boards/structure/graph.ts: typeCounts, lineCounts, layoutSeed` and `src/lib/state/boards/structure/graph.ts: GraphKind, EdgeKind, Direction`, out of 361 lines. Verify item 3 ("prints no line naming a file this step changes") therefore fails before any change. Spec.md:86 asks for a comparison with the base's output, which the brief must name.
- **No base copy named**: spec.md:32 and :86 need a base copy folder and a base `unused-exports.txt`. D65's brief names `.agents/worktrees/D65-base/...`; D66's names neither.

## Cases and checks

**Cases 1 to 4 cannot run the way they say.** They propose "a `node -e` or `npx tsx` run". `tones.ts` imports `generation.svelte.ts`, which holds a `$state` rune. Both `npx tsx -e "import('./src/lib/state/shared/words/tones.ts')..."` and the same import of `node-view.ts` printed `ERR $state is not defined`. Vitest only includes `tests/**/*.test.ts` (`vite.config.ts:152`). A run would also need `setVocab(<merged config>)` before `typeTone`, or every lookup answers `grey`. In practice only "a reading of the function" remains, and the brief should say so.

**Case 1 is inconsistent with the tree on HEAD.** It expects "never `grey` for a type `type_color` names" for `paused`. `type_color` now gives `paused` `#9ca3af`, which is `c-grey`, so `typeTone('paused')` is `grey`, the same as its board card. The case must expect `grey` for `paused`, the board's tone. Its "Unchanged tree: grey for paused ..." no longer distinguishes before from after for that type.

**Case 5 runs.** It reaches the module-local `vocabFileShape` through `shapeIssues`: `npx tsx -e "...shapeIssues('catalogs/vocab',{arch_color:{published:'#16a34a'}})"` printed `[]` (accepted) on the unchanged tree. The case should name `shapeIssues` or `fileShapeOf('catalogs/vocab').shape`, since `vocabFileShape` is not exported.

**Case 6 and verify item 2 conflict with spec.md:32.** They use `git grep`, and spec.md:32 says "You never run a git command, read-only ones included". They need a `grep -rn --exclude=local.yml` form over the worktree folders.

**Report shape and verify text**:
- The verify section says "piped through the filter the rules file names". `grep -n -i "filter\|pipe" agents/spec.md` prints nothing, so the rules file names no filter.
- The report parts omit spec.md:81's "anything in the brief or the design that turned out wrong or impossible" and "every limitation". D65's brief carried the first.

No case asks the builder to check, quote or explain a place the step does not change.

## The question

**Cases**
- **Case 1**: as a reading, `typeTone(node.type ?? '')` is the board's own call (`items.ts:107`), so passing implies the match. The run form cannot execute, and the "never grey" expectation is wrong for `paused`.
- **Case 2**: a regression guard only; it does not bear on the goal.
- **Case 3**: **can pass without the goal.** If `Controls.svelte` keeps `type Status = { status: string; color?: string }` and line 118, an array of `{ status, tone }` is still assignable to it: `status` is required, so the weak-type check does not apply, and no excess-property check applies to a non-literal. svelte-check stays green while every archive chip dot draws `--c-grey`. No case reads the dot. Case 3 should also read `Controls.svelte`'s dot as `var(--c-${item.tone})` and the `Status` type as `{ status: string; tone: string }`.
- **Case 4**: matches the board through the same function. It cannot pass with the goal unmet.
- **Case 5**: proves the schema only. It could pass while the Map still reads a removed key; Cases 1 and 6 cover that.
- **Case 6**: could pass with nodes still grey, for example a hard-coded grey branch for archived nodes. Case 1 covers that.
- **Case 7**: passes with `--fs-sm`. The ruling's complaint was rows "larger than the 'Live sessions' heading". After the change they remain larger (12 px against the 11 px uppercase bold `--fs-xs`), and Case 7 itself asserts the heading is "smaller than the row". The prompt's goal ("no larger than the card's secondary text") is met, but Axel's stated symptom is only reduced. Decision 1 records this; it should be shown at the look on landing as a choice he may reverse.

**Step line check and verify list**
- `npm run test:quick` and verify 2 to 4 can all pass with the goal unmet. No test covers `nodeTone`, `archiveStatuses`, Map, Graph, Controls or Usage: `ls tests/views/structure` gives "No such file", and `git grep` in tests finds none. `config-folder.test.ts` checks keys only.
- Verify 2 cannot fail on the grey-dot defect from Case 3.
- Verify 3 is red before any change.
- The proof of the goal therefore rests on the readings and the look on landing.

**"What to build" items**
- **1.1** (removal): necessary, not sufficient; the other items cover the rest.
- **1.2** (comment): does not bear on the goal.
- **1.3** (`nodeTone`): reaches the node half of the goal; TypeScript catches a stale two-argument call in `Graph.svelte`.
- **1.4** (`archiveStatuses` and `Controls`): reaches the chip half, but its Controls part is unproven by any case (see Case 3).
- **1.5** (call sites): the type check catches the arity.
- **1.6** (test key list) and **1.7** (unused imports): do not bear on the goal.
- **2.1 to 2.3**: meet the "no larger than secondary text" goal by reading. See Case 7 for the heading.

## Implied inputs

- **Archive project of type `phd`**: has happened (the hub holds 1). Today it draws grey; after the step it takes `typeTone('phd')`, indigo, as on its board card.
- **Archive projects of type `dropped`**: has happened (2 in the hub). Grey before and after, since `type_color` gives `#9ca3af`, the same as the board.
- **Project of type `paused`**: `type_color` is now grey. Expected `grey`, the same as the board.
- **Archive or coauthor project with no `type` or an empty one**: `archived()` gives `undefined`, so the node always shows and `typeTone('')` gives grey; `archiveStatuses` skips it (`project.type` falsy). Expected: unchanged.
- **Type in another case (`Published`)**: `typeTone` lower-cases (`tones.ts:141`), whereas `arch_color` was read with the exact key. Expected: Map and board both green; the chip label keeps the case as written.
- **A config push that edits `type_color`**: `typeTone` reads `configGeneration()`, so `archiveStatuses` inside Map's `$derived` and `nodeTone` in the template re-draw on the push. Expected: dot and node colours follow without a reload.
- **A hub layer setting `type_color`**: the Map follows it as the boards do.
- **A hub layer that still names `arch_color`**: the merge at `merge.ts:401` and the unknown-key walk give a finding. No layer holds one today (grep above).
- **Archived nodes keep `.node.archived { opacity: 0.6 }`** (`Graph.svelte:493-495`): they show the board's hue at 60 percent. The look on landing should expect that.

## ADRs

`ls docs/adr` from the repository root and `ls tools/oculus/docs/adr` both give "No such file or directory". `find . -type d -name adr` (excluding node_modules and `.agents`) prints nothing, and `orchestrator-state.md` names no ADR. No record touches the step.

## Dictated text

The brief dictates no verbatim words for any file, so there is no line to `grep -n`. It dictates content in two places:
- **The `vocab.yml:54` comment**: "type_color gives each project type, keyed by the manifest's type, its colour on the boards and on the Map". `typeTone` also colours the Present view's project chip (`src/lib/views/academic/present/parts/Project.svelte:42`) and `chipTone` (`tones.ts:228`), so a comment naming only the boards and the Map would be incomplete, though not false.
- **The doc comments of `nodeTone` and `archiveStatuses`**: "the tone is the type's through `type_color`". This holds.

## Declined to judge

- Whether `--fs-sm` or another size is what Axel meant by "the card's text size". That is his to rule; the brief records it as Decision 1.
- Whether `Graph.svelte` at 524 lines must be split in this step or is exempt as a file over the line before the step. Spec.md:46's "would pass" does not settle a file that is already over; the orchestrator rules.
- Whether writing the report under `.scratch/.../reviews/` conflicts with spec.md:35 ("never edit anything under `tools/oculus/.scratch/`"). Every prior brief does the same, so I treat it as the plan's convention.
- `sh utils/unused-exports.sh` and the tsx imports were run read-only. No test suite was run.

Usage: a040ddeba649f939d, claude-opus-5-5, 167802 tokens, 65 tool uses, 7.3 min.

# Closed

- Premises, the header out of date and `paused` now grey: the header reads e74a5d459, and the `type_color` premise names `paused` and `dropped` as `c-grey`.
- The step line, "no known type draws grey": corrected in `plan.md:766` to "no known type draws a colour its board card lacks", a premise correction the plan absorbs.
- The step line, "the card's text size": Decision 1 gives the sizes in pixels, says the rows stay one pixel above the uppercase heading, and sends the card to Axel at the look.
- Premises, the blank lines: item 1 removes lines 224 to 234, leaving the two blank lines before `# Dataset access`.
- Premises, `.live h3` lines and the shared rule: corrected to lines 319-326, shared with `.history h2`.
- Premises, the card sizes omitted: the card title, body, meta tags and meter text are named with their lines.
- Premises, `Graph.svelte` at 524 lines: a new premise, and item 1 splits it by concern under the size rule, with a path line for the new file.
- Premises, the unused exports and the missing base copy: the brief names `.agents/worktrees/D66-base/tools/oculus/` and its `unused-exports.txt`; verify 3 compares against it.
- Cases 1 to 4, not runnable: the cases say they are readings and why; Case 1 expects `grey` for `paused`, as its board card.
- Case 3, passing with a grey dot: the case reads the dot and the `Status` type.
- Case 5, `vocabFileShape` not exported: the case runs `shapeIssues('catalogs/vocab', ...)`.
- Case 6 and verify 2, `git grep`: both use `grep -rn --exclude=local.yml` over the worktree folders.
- The filter sentence: removed.
- The report parts: "anything wrong or impossible" and "every limitation" added.
- Implied inputs: Case 8 holds `dropped`, a type in another case, an archive project with no type, and the archived nodes' opacity.
- Dictated text, the `vocab.yml:54` comment: it names every place a type is drawn (the board card, the Map, the Present view's project chip).
- Declined to judge, `Graph.svelte`'s size: ruled in the brief, split in the step.
