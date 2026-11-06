# Brief check of O150 (brief `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O150.md`)

Main's head was 61d4ac3af when this check started (`git log -1 --format=%h`). During the check it moved to 25fed4eb1. `git diff --stat 61d4ac3af 25fed4eb1` shows only ledger files (the O158 brief check, the state file, plan.md, queue.md), so nothing the step reads has changed. O158 (the facts strip, `Slide.svelte`) is in flight. It shares no path with O150, but the look at landing will draw whatever O158 has left.

## Names

Command (hub): `grep -rn --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.venv -I -E 'pillars\.count|more\.count|projects\.count|transition\.md|legend: (pillars|more|ideas|projects)|slides: (pillars|more|ideas|projects)|of: (pillars|more|ideas)|pillar projects|deck/(present\.yml|title\.md|engine\.md|transition\.md|closing\.md)' . | grep -v '^./deck/'`. Output: nothing.

Inside `deck/` (`grep -n 'legend' deck/*.md`):
- `deck/title.md:4` `legend: pillars`
- `deck/transition.md:3` `legend: more`

Every other hit is one the brief already lists. The bare words `pillars`, `ideas`, `more` and `projects` hit hundreds of unrelated places in the hub (`.oculus/data/pillars/`, `projects/ideas/`), so I grepped them only in their deck forms.

The hub's `README.md:60` says "the portfolio deck is the hub's `deck/` folder" and calls `present/main.md` a project's "public slide". The change does not make it false.

Command (oculus): `grep -rn -I --exclude=local.yml -E '<same pattern>|same backbone|technical briefing|Structured models' src tests config docs README.md`. Hits:
- `tests/server/edit/deck/deck-edit.test.ts:31-32`, `tests/routes/edit/write-fixture.ts:264,266`, `tests/routes/edit/deck-slides.test.ts:199,235-236`, `tests/data/sources/present.test.ts:164-174`. These are synthetic fixtures that use groups named `pillars` and `more`. None reads the research hub, so the change makes none of them false.
- `tests/fixtures/hubs/demo/deck/title.md:4,8` and `tests/fixtures/hubs/demo/deck/present.yml:12`, the demo hub, already using `legend: projects` and `{{projects.count}}`. Not made false.
- `src/lib/views/shared/card/record/registry/LineCard.svelte:92` `pillars.counts_tip`, a catalog key of the pillars collection. Unrelated.

Command: `grep -rn -I --exclude=local.yml 'public artifact' src tests config docs README.md`. Hit: `tests/fixtures/hubs/demo/deck/present.yml:1`, the same "Rules for what goes on a slide (a public artifact) ..." comment the step removes from the research hub. The step does not touch it or make it false. It is the one other copy of the removed comment.

Test that reads the real hub's portfolio deck: `tests/checks/config/integrity.test.ts:256`, 'reads the portfolio deck with every named deck found'. It asserts state `ok`, `findings` equal to `[]`, at least one group, and `missing` equal to `[]` per group. After the change it still holds, but its "every named deck" half becomes vacuous, since the new group names no deck. It is not made false, and it is the one existing check of C1 on the real hub (see Other checks).

## The step line

`grep -n '^- O150' .scratch/migration/plan.md` gives line 1703. Each part of the line and the requirement that serves it:
- "after O154 and O155": both are ticked (`grep -n -E '^- (<white heavy check mark> )?O15[0-9]'` shows O154 at 1694 and O155 at 1696 with the mark). The brief cites both.
- "one group that finds every research project's deck at every depth ... under `projects/`": item 1, decision 2, C2.
- "with `discover: true`": item 1.
- "placed by one `{ slides: <group> }` entry after `title.md` and `engine.md` and before `closing.md`": item 1's four-entry order, C3.
- "its order from `deck_order` (O155)": item 1 ("names no `sort`"), C4.
- "every narrowing from the filter (O154)": item 1 (no `stages`, `forms` or `status`), C5.
- "the old groups, their summary and grid entries ... removed": item 1, C3, C9.
- "`deck/transition.md` removed (ruling 678)": item 2, C9.
- "the comment on `deck/present.yml:1` ... removed": item 1, C8.
- The `deck/engine.md:12` sentence: item 4, C7.
- "`deck/title.md` names no count of the removed groups": item 3, C6.
- "built by a builder agent": the brief is a builder brief with a worktree.
- "the hub commit on the user's word (ruling 678)": item 6 and "Writes to the hub".
- "(ruling O150 and O151 undone)": the first bullet of "What is on the tree".

Every part has a requirement. Item 3 goes past the line in two ways: the legend names the new group (needed, since `legend: pillars` would otherwise be the finding `legend_unknown`, read.ts:438), and the thesis sentence is kept word for word. Item 7 (docs) also goes past the line. Ruling 678 (plan.md:3570) still quotes `projects/*/*/present` and `sort: folder`. The later step line ("every depth") and the ruling Deck order (plan.md:3584) supersede it, and the brief follows the step line.

## Premises

- `ls -la deck` shows `closing.md`, `engine.md`, `present.yml`, `title.md`, `transition.md`. Holds.
- `sed -n '20,32p' .oculus/config.yml`: line 27 is `portfolio_deck: deck`. Holds.
- `wc -l deck/present.yml` gives 53. Line 1 is the comment as quoted. The three groups hold 7, 6 and 9 named decks, with the globs, `discover` and stage lists as described. The order is as described. Holds.
- `git diff -- deck/present.yml` shows only `-        sort: folder` in `more`. Holds.
- `grep -rn 'pillars\|more\.\|ideas\|transition' deck/*.md` gives `title.md:4`, `title.md:8` and `transition.md:6` exactly as quoted. `engine.md:12` is as quoted, and `closing.md` names no group. Holds. The brief's grep misses `deck/transition.md:3` `legend: more` (`more\.` needs a dot), but the file is removed whole, so nothing follows from it.
- `find projects -path '*/present/present.yml' | wc -l` gives 25: 13 manuscripts, 9 ideas, 2 under `archive/published/2026`, 1 under `archive/failed`. All 25 have `tier: research`, and `fed-faithful-ecg` is at stage `failed`. Holds. By reading the three groups' rules I get 24 placed today: pillars 7, more 6 named plus `ecg-readable-substrate` and `hccnet-fl` discovered, ideas 9. Holds.
- Research projects by depth do not hold as stated. The brief's counts per depth are right but its paths are wrong. The command was `for f in $(find projects -name project.yml | awk -F/ 'NF>=5'); do ...grep tier...`:
  - Depth 5 has 7 research projects under `projects/archive/<kind>/` and 2 under `projects/coauthor/<kind>/` (`coauthor/stopped/individual-reference-intervals`, `coauthor/active/flkit`), plus 1 software project (`coauthor/active/elixir-fl4e`). The brief says all 9 are under `projects/archive/<kind>/`.
  - Depth 6 has 20 under `projects/archive/published/<year>/` and 12 under `projects/coauthor/published/<year>/`. The brief says all 32 are under `projects/archive/published/<year>/`.
  - Depth 4: `projects/*/*/project.yml` gives 54 research and 3 software. Holds.
  - Total research is 95, so 70 have no deck. C10's 70 holds. `projects/coauthor` is a scan folder (`.oculus/config.yml` scan list), and `**` covers it.
- `node -e` globSync run in the hub (`export PATH=...v24.21.0/bin`, node v24.21.0): `globSync('projects/**/present')` gives "matches 25 with present.yml 25"; no match lacks `present.yml`. The old two globs give 24, and the only deck new to `**` is `projects/archive/failed/fed-faithful-ecg/present`. Holds.
  - Unstated: `**` does not enter dot folders (`globSync('projects/**/bin')` returns no `.venv/bin`). It does not descend through a linked folder: of 51 entries under `projects/active/linfoot-estimator/manuscript/**`, none is reached through the `results -> ../code/results` link.
  - Unstated cost: `**` walks the 70,316 files under `projects` (`find projects -type f | wc -l`). Three timed runs took 1080.9, 1046.1 and 1018.9 ms. The old `projects/*/*/present` took 2 ms. The list `[projects/*/*/present, projects/*/*/*/present, projects/*/*/*/*/present]` finds the same 25 in 27.2 ms. The reader caches globs per reader only (`read.ts:217,347-362`), and a new reader is made for every snapshot build (`readDecks`, `documents/decks.ts`) and every deck route read, a filtered read included (`server/content/deck/read.ts:101` passes `keep` to a new `deckReader`). So every snapshot build and every filter change in the Present view would pay about 1 s. Decision 2 does not name this cost.
- Cited lines checked with `sed -n`: `docs/decks.md:111-114` (find, folders, tiers; folders and tiers are at 112-113), `:152` (count), `:351` (legend), `:379` (filter narrows) all hold. `read.ts:340-366` is `under()` and `:360` is the `existsSync(join(dir, DECK_FILE))` keep. Holds. plan.md lines 1703, 3570 and 3581 hold.
- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. Holds.

## Cases and checks

- The brief conflicts with the rules file on `test:quick`. The brief says "`npm run test:quick` is not run, since the step changes no oculus file". `spec.md:78` says "At minimum: `npm run test:quick`", `spec.md:26` says to run it once after the last change, and `spec.md:3` says nothing in a brief overrides the spec. The brief must either have the builder run it once or name this as a departure for the orchestrator to rule.
- The brief is stricter than the rules file on scripts. It bans any script other than one the step builds, while `spec.md:66` allows a case-run program (prints only, writes nothing into the diff). The effect is that C2-C4 can only be read by hand, on the code and the 25 manifests.
- Item 7 is narrower than the rules file. It greps only `docs` for `pillars\|transition.md`, while `spec.md:72` asks for a grep of a changed name across `src`, `tests`, `config`, `docs` and `README.md`. That grep, run here (see Names), finds only synthetic fixtures, so nothing follows, but the brief should name the full grep.
- Verify item 3 (`git diff --stat` prints nothing outside the ledger) does not show an untracked file. A new oculus file would pass it. `git status --short` is the command the builder may run that would show one (`spec.md:33`).
- C10, C11 and C12 ask the builder to check reader behaviour the step does not change: `read.ts` and `groups.ts` stay as they are. C11 says outright "read the code". They are reads of unchanged code (`groups.ts:79-87` `keeps`, `read.ts:360`), relevant only as the inputs the new glob meets. No such deck or folder exists today (`find projects -name present` gives 25 folders, all decks; no non-research project has a deck).
- No other case breaks the rules file. The builder runs no page, and every look is the orchestrator's (`spec.md:65`).

## The question

The goal: the hub's portfolio deck places every research project's deck, ordered by `deck_order` and narrowed by the filter, with no stale word.

- C1: yes, alone. A group that finds no deck raises no finding (`groups.ts:189-235` raises nothing for an empty find), so a deck that places nothing passes C1. Only C1 together with C2 and C3 settles it.
- C2: no for today's 25. It names the count and the edge decks.
- C3: yes. It gives no slide count and no deck list, so a look by eye cannot tell 24 decks from 25. It needs the expected count (the Overview group's count, `read.ts:707`) and the 25 deck names in order.
- C4: yes. It states the rule but no expected sequence. From the manifests (stage, form, `config/catalogs/vocab.yml:270-280`) the expected sequence is:
  - publications: `dongho-ecg-clustering` and `hccnet-fl`, by stage, year, title;
  - in-review: the 11 `submitted` decks, by title;
  - in-flight: `btfno` and `bt-operator-theory` (revision), then `ecg-af-fair` (exploring), by stage then title;
  - idea: 6 `nascent` decks, then `florank-personalization` and `hccnet-pathology` (scoping), by title within a stage;
  - dead-ends: `fed-faithful-ecg`;
  - no deck has no category.
  The case should give this list with the titles as the board orders them.
- C5: yes, vacuously. No project of the 25 decks is at stage `in-prep`. The stages are submitted, revision, accepted, failed, nascent, scoping and exploring (the stage listing loop above). Picking `in-prep` empties the group, so "only the decks of the projects the bar shows" holds with zero decks. Also, "with Clear all, the 25 again" holds only if Mine only keeps all 25, since Clear all "leaves the search and the toggles" (`docs/decks.md:380`). All 25 name `axel-faes` as lead or supervisor (grep of `lead:` and `supervisors:`), and `isMine` keeps any role field holding self (`src/lib/data/shapes/boards/roles.ts:99-106`). That self is `axel-faes` is not verified, because `local.yml` is off limits. The case should pick `submitted` (11 decks) and state the 11.
- C6: yes for the legend. It says "draws the domains" with no list. Expected: 7 domains, heart, liver, method, brain, meta, privacy, liverfl, each once, in member order (`read.ts:435-447`). The new lede's words are a reading by the orchestrator, not a check.
- C7: yes. It proves the bytes, not that the sentence is true (see Dictated text).
- C8: yes. `grep -n 'public artifact'` passes with another comment line in the file, and item 1 forbids every comment. The check should be `grep -n '^\s*#' deck/present.yml` printing nothing.
- C9: no for the names listed, yes for "no stale word": the kicker "June 2026" (`deck/title.md:3`) stays under item 3.
- C10, C11, C12: pass by reading the unchanged code. They do not bear on whether the goal is reached.
- The check on the step line: the plan line names none. Every proof is the orchestrator's look at landing.
- Item 1: no, for placement and order. It does not weigh the 1 s glob cost (Premises).
- Item 2: no.
- Item 3: yes. It can be met while the deck keeps words that are now stale or too strong: the "June 2026" kicker and "A shared thesis ... block-term tensor structure" applied to every research project. Three of the 25 decks name no tensor or block-term word: `grep -c -i -E 'block-term|tensor|multi-way|BTD|Tucker'` gives 0 for `clinical-ai-eval-artifacts`, `fl-privacy-auditing` and `ssm-longitudinal`.
- Item 4: yes. The dictated sentence is false at O150's landing (see Dictated text).
- Item 5: no.
- Item 6: yes. The report can carry correct texts while the hub is unchanged. The goal is reached only when the orchestrator writes the files.
- Item 7: no.
- The builder's verify list: yes. ASCII, YAML parse, `git diff --stat` and a prose read all pass for a `present.yml` whose group places nothing. Nothing the builder runs exercises placement, order or filter.

## Implied inputs

- A deck seen by two globs or two groups: one glob and one group, so it cannot happen. `under()` dedupes within a group anyway (`read.ts:364`). No case needed.
- A research project at a depth not yet seen: `**` takes any depth, and today's depths are 4, 5 and 6, including the `projects/coauthor/...` branch the brief does not name. Missing from Cases: a deck under `projects/coauthor/` (none today; O151 adds 14 such projects' decks). Expected: found and placed by its category.
- Does `projects/**/present` match the portfolio deck or anything outside `projects/`? No:
  - the pattern is relative to the hub root and starts at `projects/` (`read.ts:351`);
  - `deck/` is not under it, and `visible` drops the deck itself (`groups.ts:102`, `one.dir !== doc.dir`);
  - `side-projects/` is outside the pattern;
  - `projects/software/*` decks are matched but dropped by `tiers: [research]` (`groups.ts:81`);
  - a `present` folder holding a `present.yml` inside a project's subfolder (for example `manuscript/present`) is a deck of no project, `projectOf` returns null (`read.ts:280`), and `within([research], undefined)` is false, so it is dropped with no finding. This holds today: no such folder exists.
- How `**` behaves in globSync: as the brief says, it matches at every depth (25 found). Unstated: it skips dot folders and linked folders, and it costs about 1 s on this hub (Premises).
- The title legend drawing many domains: 7 today. After O151, research manifests name up to 10 domains (`grep '^domain:'` over research manifests: brain, brainbci, cs, heart, immune, liver, liverfl, meta, method, privacy). The title slide's Too tall finding is a look-only fact. Missing from Cases (C6): the expected legend list.
- A project deck whose project has no category: none today, since every research stage and form pair falls in a row of `categories:` (the stage and form count above: published forms are all journal, conference, thesis, abstract, poster or tech-report). No case needed beyond C4's rule.
- A deck with no slides: none today. Every one of the 25 `present.yml` has an `order:` and none has `groups:` (loop check printed only "checked"). No case needed.
- The portfolio deck named under another hub: no other workspace folder holds `.oculus/config.yml` with `portfolio_deck` (loop over the workspace folders printed nothing). No case needed.
- The filter emptying the group: it happens with C5's own pick, `in-prep`. Missing from Cases with its expected result: the deck draws `title.md`, `engine.md` and `closing.md` only, state `ok`, the legend empty, no finding.
- A research project whose deck lives in its own repository (`workspaceFolder`): its deck is under another root, and a glob under the hub root cannot find it. None today: every repository manifest is `personal` or `software` (loop over `~/workspace/*/.oculus/project.yml`). Missing from Cases, costing nothing today. Expected: not found by the group, which the goal's "every research project" would make a gap if one arises.
- The nine idea decks: with no grid entry, each `idea` slide is placed as its own one-card slide (`kinds.ts:385-395`, `Slide.svelte:441`). That gives nine single-card slides where the deck had one grid. Missing from C3's expected view: what the nine idea slides look like.
- Mine only on by default (`docs/decks.md:378`) is an input to C3 and C5 (see The question). The state each case is opened in should name it.

## ADRs

`test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. None.

## Dictated text

- engine.md:12 sentence (`grep -n -F "The slides that follow are every research project's deck"` gives brief line 24). Character rules hold: ASCII, no em dash, no 'not X but Y' (`spec.md:21`). It breaks the truth rule, `spec.md` "What every package obeys", line 72 ("A sentence in a document ... that the change makes false is a defect of the change"), and the goal's "no stale word":
  - "every research project's deck": at O150's landing, 25 of 95 research projects have a deck (O151 at plan.md:1704 is unticked).
  - "The slides that follow are ... deck": the subject is slides and the complement is a deck.
  - "a project slide leads with its governing equation": false for `ward-bttr-crosssubject`, a `kind: project` slide with no `equation:` (`grep -n -i equation projects/manuscripts/ward-bttr-crosssubject/present/*.md` prints nothing).
  The sentence appears only in the plan line (`grep -n 'The slides that follow' plan.md orchestrator-state.md` gives only 1703), and no ruling quotes Axel on it. It is the orchestrator's to correct or to put to Axel.
- The thesis sentence (`grep -n -F 'A shared thesis: clinical data is intrinsically'` gives line 23). Character rules hold. Its claim of "a shared thesis" across every research project's deck is not borne out by the three decks above that name no tensor or block-term word. This is a judgment on content, Axel's to rule; the brief keeps it without weighing it. The heading `deck/engine.md:4` "The common engine" and `engine.md:6` "recurs across the portfolio" carry the same claim and stay under item 4.
- The `find:` value (`grep -n -F 'find: { folders: [projects/**/present], tiers: [research] }'` gives line 21). Holds. It parses with oculus's `yaml` to `{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}` (the `node -e` parse above).
- The group name `projects` (line 54) and the glob `projects/**/present` (line 55). Both hold the rules. The glob's cost is a finding under Premises.
- Not dictated text, but in the brief: decision 3 at line 56, "counts slides, not projects", is close to the negation contrast `spec.md:21` bans.

## Other checks

- `{{projects.count}}` and `legend: projects` raise no finding under `docs/decks.md`: a count or a legend is a finding only for a group the deck does not define (`decks.md:152`, `:351`; `read.ts:438,460`). The singular form `{{project.<field>}}` does not match `projects` (`read.ts:132`).
- Removing the summary and grid entries leaves nothing in oculus that relies on the research hub's deck shape. The fixtures with `pillars`, `more` and summaries are self-contained (Names), and the docs examples are generic. The only real-hub reader is `tests/checks/config/integrity.test.ts:256`, which still holds. It is not in the brief's verify list or the landing plan. Running it alone (`npx vitest run tests/checks/config/integrity.test.ts`) after the hub files are written would check C1 on the real hub, and it would also catch a finding in a member deck.
- A builder that writes no hub file can meet every item as text in the report: items 1-5 as the fenced files and the removal, item 6, and item 7 by grep. Every hub-state requirement and C1-C12 are then the orchestrator's at landing. The builder has no runnable proof that the new file places the 25 decks, because the brief bans the case-run program `spec.md:66` allows.

## Declined to judge

- `agents/guarded.md` was not read in full (447 lines, about 95,000 tokens). I grepped its entry heads for deck, slide and present (G8, G32, G66, G124, G126, G112). The step adds and changes no test, so no entry is touched.
- The words of the new title lede: they are not written yet, and they are a reading for the orchestrator.
- Whether the thesis, the "June 2026" kicker and the engine heading should change: content, Axel's to rule.
- The value of `self`: `local.yml` is off limits, so whether Mine only keeps all 25 is not verified.
- The slide count of the 25 decks: it needs the reader run over the hub, which I did not do without writing a program.
- Every look: no page was opened.

Usage: a29f2fa39393ed95d, claude-opus-5-5, 226538 tokens, 67 tool uses, 13.2 min

## Closed

- Depth premise: corrected in the brief's "The research decks" with the `coauthor` paths (54, 9, 32; 95 in all, 70 without a deck) and the hub's `README.md:52` any-depth rule.
- Glob cost: re-timed by the session (`projects/**/present 25 1319.171583 ms`, `projects/*/*/present 22 2.178208 ms`); named in "How a group finds decks" and decision 2; the reader's cost is outside the step's part and raised as open item 697.
- `test:quick`: the builder runs it once after the last change (verify 4).
- Case-run program: allowed as `spec.md:66` allows it, over a scratch copy of the deck in the scratchpad.
- Item 7: the grep is the rules file's, over `src`, `tests`, `config`, `docs` and `README.md`.
- Verify 3: `git status --short`.
- C10 to C12 on unchanged code: removed; C2 now names the 70 projects without a deck.
- C3, C4, C5, C7 (old C6), C9 (old C8): expected results named (the count and order reported, the C4 membership, `submitted` with 11 decks, the seven domains, the comment grep); the filter emptying the group is the new C6; Mine only named as the state.
- Dictated `engine.md:12` sentence: false at landing, so item 4 is now a requirement the builder writes to, and `plan.md:1703` is corrected the same way.
- Thesis, kicker, engine heading: kept as Axel's words, with a drafted rewrite in the report's "Proposed framing"; raised as open item 698.
- Decision 3: reworded without the contrast.
- `integrity.test.ts`: run by the orchestrator on main at landing once the hub files are written.
- Nine idea decks as their own slides: named in C3.
