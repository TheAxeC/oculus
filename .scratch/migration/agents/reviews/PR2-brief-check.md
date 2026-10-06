# Brief check of PR2 (oculus/migration)

Main moved during the check. It is now at `4f97e9fad` (O30b landed; `git log --oneline -4`), not the `7e6c14d8c` the brief reads. O30b changed `tools/oculus/DESIGN.md`, `HELP.md`, `README.md`, `docs/diagrams/layers.*`, `src/lib/data/sources/config.ts` and `vite.config.ts` (`git show --stat 4f97e9fad`). The worktree is cut at the new head, so every DESIGN.md line number below is given for both heads.

## 1. Names

`git grep` over the whole repository, excluding `tools/oculus/config/local.yml` and `.scratch`. Each hit below sits outside "Paths this step writes" and is made false, or broken, by the change:

**Source files the change breaks (the type check or the build fails if they are left alone):**
- `src/lib/data/snapshot/normalise.ts:33,293,339,753` imports `PresentSlide` and sets `project.present` from `raw.present`. Part 2 removes `project.present`, so this must change.
- `src/lib/state/boards/board/items.ts:176-192`: `markdownDocNames` adds `presentDoc` when `project.present` is non-empty.
- `src/lib/server/edit/writes/config/config-sources.ts:13,19,60-66` and `src/lib/state/system/config/editors/sources.ts:15,24,108-115` import `deckSources` from `data/helpers/deck.ts` and `slideTagClasses` over `project.present`. These feed the Settings option sources `slides` and `slide_tags`.
  - `slide_tags` still feeds `options.yml:972` (`values_from: slide_tags`, the `tag_tones` keys) after the change.
  - The brief never says where tag classes come from once `project.present` is gone.
- `src/lib/server/edit/writes/bodies.ts:96-100,260-264,394-399` holds `DeckWrite`, `deckShape` and `deckWrite`.
- `src/lib/server/edit/writes/app-gate.ts:78` holds `['deck', deckWrite]`.
- `src/lib/data/helpers/files/apps.ts:134` lists `'deck'` in `CLOSED_WRITES`. Its comment at `:90` says an unnamed kind is `unknown`, so `deck-slides` has to be added there.

**Words, documents and tests the change makes false or breaks:**
- `config/text/views/system/history.yml:49` `kind_deck: deck`: the new kind `deck-slides` needs its own word there.
- `config/text/views/system/workbench.yml:22` `desc_present` ("the deck slides, the domain themes, the tag tones and the order") becomes false.
- `config/text/views/boards/project.yml:78-79` `present_tip: open the public deck at this project's slide` becomes false. Part 5's Open presentation control on the project tab also needs a word, and none is named.
- `tests/checks/config/config-folder.test.ts:118` `'present.yml': ['deck']` (G12) fails once the top-level key is `defaults`.
- `tests/checks/tree/boundaries.test.ts:32,42-44,169` (G16) allows and explains `data/helpers/deck`, which part 1 replaces or renames.
- `tests/checks/tree/allow-duplication.txt:30` (G21) names `tests/data/sources/present.test.ts`, which is replaced.
- `tests/data/snapshot/normalise.test.ts:235` passes `present: {}` in the raw portfolio, which breaks once `RawPortfolio.present` (`model/index.ts:60`) goes.
- `tests/server/edit/writes.test.ts:153` (G8, 'scaffolds an idea folder with a manifest and a README') asserts `'  chips: [exploring]'`. Part 3 changes `manifest.ts:444` to `nascent`, so this guarded assertion changes. The brief neither lists it nor names it under G8.
- `tools/oculus/docs/apps.md:271` documents `present?` (list of slides) on a Project in the portfolio payload apps read. Removing it and adding "whether it has a deck" changes a wire format, and the brief names no field for it.
- `docs/DATA-MAP.md:234,253,311,356` (`present.yml`'s "deck-level slides, themes and order", "The Present view reads tools/oculus/config/present.yml", `deck.order[].ref` twice) become false. The brief lists only 88, 89, 217 and 254.
- `.agents/skills/research-cockpit/SKILL.md:62,92` tell a SYNC run to edit and rebuild from `<project>/PRESENT.md`.
  - The brief leaves this to O29, but O29 is paused (`plan.md:1175`, Z425).
  - After PR2 the skill sends an agent to a file that no longer exists, and `README.md:23` points readers at that skill.
  - `tools/present/build.py` will build an empty deck.
  - This needs a stated decision.
- `projects/manuscripts/raw-pls/code/campaigns/brats_realdata/saliency_overlay_figure.py:8` ("present/ for PRESENT.md") becomes false. It is project code, so it is out of the step's write rights; list it only.
- `tools/oculus/demo/README.md:5` says `tests/data/demo-hub.test.ts` exists. It does not (`ls tests/data`; the file went in T2d), and the demo gains a deck in this step.

**Hits that the brief covers, or that are not made false:**
- `git-index.ts:336` `ALREADY_PRESENT`.
- `layout.yml:141,152` `exploring` (stays).
- The cockpit and `tools/present` text (left as it is by the brief).
- `tests/fixtures/present.ts`: it is a value-presence helper (`present<T>(value, what)`) used by app-store, manifests, app-open and write-fixture tests, and has nothing to do with decks. The brief lists it as a deck reader and in its write list, which invites a harmful edit.

## 2. The step line and the design against "What to build"

Every point of the PR2 step line (`plan.md:649`) and of `PR2-design.md` maps to a part:
- folder format and slide split: part 1
- the three places decks live and `portfolio_deck`: part 2
- groups, `find`, `discover`, `sort`, `slides`, missing names and conflicts: part 1
- computed summary, legend, count and grid: part 1
- `themes` removed: part 1
- maturity chips: part 3
- conversion: part 4
- Open presentation: part 6
- Slides view: part 7
- `OPEN_TIERS` removed: part 1

Gaps and changes:
- **Audit markers.** The design says "the Projects view, the audit and every other reader read the project's `present/` deck". `audit/projects.ts:35` `SCANNED` (the TODO and VERIFY markers) is in the write list, but no requirement says what it scans after the change (`present/*.md`?).
- **Key hint.** The design says "Present shows its own key hint from oculus's key catalog". No key catalog exists: the keys are hard-coded at `Present.svelte:249,254`, and no keys file is under `config/` (`ls config config/catalogs`). Part 5 turns the hint into a text word drawn only on the `title` kind's foot, so a deck with no title slide never shows it. That is a narrower reading of the design, and the brief does not say it is one.
- **Opening from the Present view.** The design says a deck opens from the Present view. Part 5's deck menu lists only the portfolio deck and project decks, so a custom deck opens only from the Files view.
- **Counts.** The design says `{{<group>.count}}` is "the number of slides the group holds" and reads "any group, shown or not". Part 1 says "the number of slides the group places". Read literally, `{{ideas.count}}` is 0, because `ideas` is never placed by `{ slides: }`. No case covers a count of an unshown group.
- **Z638 (several slide files in a portfolio project).** Nothing requires or exercises a member deck whose `order:` holds two files expanded inside `{ slides: g }` and counted.
- **Ruled points changed, each covered by a Z649 self-rule rather than by Axel:**
  - `summary1`'s foot loses its domain list; the design names only `summary2`'s foot.
  - the grid gains `lede`/`foot`.
  - the New idea write starts at `nascent`.

## 3. Premises

- `wc -l` matches the brief: `present.yml` 273, `sources/present.ts` 403, `helpers/deck.ts` 188, `state/life/present.ts` 473, `present.svelte.ts` 92, `slides.ts` 139, `Slides.svelte` 336, `writes/config/deck.ts` 133, `deck-edit.ts` 64, `list-edit.ts` 193.
- These hold: 21 `order` lines; 11 `themes`; 8 and 6 summary rows; 10 idea cards; the 12 vocab domains; `status_legend:74`, `exploring:95`, `parked:96`, `status_palette:106`, `exploring:119`; `manifest-schema.yml:36`; `model-entities.ts:15`; `manifest.ts:444`; `project.idea.yml:11`; the project-new `SKILL.md:44,46`; `files.svelte.ts:12-16`; `package.json:74-102`; `row-menu.ts:78,223,262,506-517`; `Panel.svelte:29-32`; `index.ts:40,182`; `config-write.ts:61`; `undo.ts:313`; `writes.svelte.ts:404`; `shapes.ts:221`; `options.yml:963-1141,1060`; HELP.md 81, 139, 298; no `deck/` folder and no `portfolio_deck` key.
- **The 23 ideas:** confirmed with a `yaml.safe_load` loop. There are 33 manifests: 32 `exploring` and `fedbtd` `parked`. All 32 write `chips: [exploring]` inline (`grep -l` count 32). The 23 names match the brief exactly.

Premises that are wrong:
- **"15 PRESENT.md files" is wrong.** `find projects tools/oculus/demo -name PRESENT.md | wc -l` gives 18. The `-maxdepth 3` in the brief misses two archive files:
  - `projects/archive/published/2026/hccnet-fl/PRESENT.md`, a full `present:` map with 10 keys and its own `present/` folder holding `eq_hccnetfl.png`.
  - `projects/archive/nogo/fed-faithful-ecg/PRESENT.md`, prose only.
- **The HCCNet-FL reason is false.** "summary1's HCCNet-FL row has no deck (its project is archived and has no `PRESENT.md`)" (`PR2.md:165`) does not hold. The oculus snapshot reads it today: archive is scanned nested (`sources.yml`), and `config/present.yml:48` places `hccnet-fl`.
- **Consequence for case 17.** Part 4 converts neither archive file, but case 17 requires that no `PRESENT.md` is left under `projects/`. The builder must either convert them or delete them, and deleting them loses the hccnet-fl slide. The brief must say which.
- **Demo `slides:` list.** The demo `graph-bandits/PRESENT.md` declares a `slides:` list (one more slide, id `ablations`). "None declares slides:" holds for the 13, but part 4 converts the demo "the same way" without saying where its second slide goes.
- **No saved lists in `config/present.yml`.** "the Slides view's saved `selection:` and `slide_order:`": `grep -c -E "selection:|slide_order:" config/present.yml` gives 0.
- **Line numbers off:**
  - `card.ts:95`: `deckSlideOf` is at `:94`.
  - `ProjectCard.svelte:185-193`: the control is at 182-195.
  - `layout.yml:146` and `:157`: the lines are 141 and 152.
  - DESIGN.md `:110`, `:382`, `:389`:
    - At `7e6c14d8c`, 110 is blank, 382 is the opened-views bullet and 389 is the manual bullet. The deck lines are 111, 383 and 390.
    - At `4f97e9fad` they are 113, 385 and 392 (`git show <rev>:tools/oculus/DESIGN.md | perl -ne 'print "$.\n" if /PRESENT|.../'`).
- **"btfno ... the 12 present: keys"** (decision 1): btfno has 11 (`tag, title, sub, hook, eli5, equation, specs, panels, method, results, extra`).
- **Readers list incomplete:** it misses `normalise.ts`, `items.ts`, `config-sources.ts`, `editors/sources.ts`, `bodies.ts`, `app-gate.ts` and `apps.ts` (all under check 1).
- **Case 19 cannot run as written.** It names "`npm run demo` or the demo the tests start". `grep -c demo package.json` gives 0, and `git grep -i demo` over src, tests, utils, bin and config gives nothing.
- **No base copy named.** Unlike PR1's brief (`PR1.md:26,149`), this brief names no base copy and no `unused-exports.txt`. Spec lines 32, 34 and 83 require both, and without a base copy the builder cannot make its file table, which needs `diff -rq` against it.

## 4. Cases against spec.md and guarded.md

- **G32's guarantee.** Cases 5, 6, 7, 9 and 10 are filed under G32. G32 guarantees that a well-formed file is read into its values. The brief rewords it to add "each malformed input into a finding". That changes an entry's guarantee, which spec line 57 says needs Axel's yes. G32's Code line is `src/lib/data/sources/`, but part 1 lets the reader live anywhere under `src/lib/data/`.
- **G2's Code line.** Cases 13 and 15 are put under G2, whose Code line names neither `api/deck` nor the write route. The brief says the orchestrator rewrites only the test references at landing; the Code lines also have to change.
- **G14 is not named.** G14 says the real hub builds with no findings, and `integrity.test.ts` is held whole.
  - Part 1's summary rule gives a finding for a member whose `main.md` is not a project slide.
  - Part 4 makes `ecg-readable-substrate` a `kind: text` slide, and `more` discovers it.
  - So the converted hub carries a standing finding, and 'validates with no findings' fails.
- **G12, G16, G21 and G24 are not named** (check 1), although the change touches each.
- **Hub data writes.** Part 3 edits 32 `projects/ideas/*/project.yml` with no named script. Spec line 101 lets a hub data path be written only "through the script the brief names". Spec line 37 bans writing a `project.yml` otherwise.
- **Git commands.** Part 4 says the builder "commits its output". Verify item 3 and case 17 use `git grep`. Spec line 32 says the builder runs no git command at all.
- **ASCII check.** Verify item 4 uses the `LC_ALL=C grep '[^ -~]'` form. Spec line 97 says the perl form replaces it wherever a brief names it.
- **No port.** No scratch port is named for verify item 6, although spec line 38 says the dev server "uses the port the brief names".
- **No case asks the builder to check a place the step does not change.**

## 5. Could each pass without the goal being reached?

The goal: the ruled format works for every deck, the portfolio deck included, with nothing copied by hand.

**Cases:**
- Case 1: yes. It passes with summary rows, `mechanism` and `headline` typed into `deck/present.yml`, because no case edits a `main.md` headline and sees the row follow. It also hides the `ecg-readable-substrate` empty row and finding (check 4).
- Case 2: only partly. It tests a shown group; `{{ideas.count}}` could read 0 and pass.
- Cases 3 and 4: yes for the ambiguity in check 6: a direct separator followed by `# heading` and a `- list` parses as YAML.
- Case 5: no.
- Case 6: no.
- Case 7: no.
- Case 8: no.
- Case 9: no.
- Case 10: no.
- Case 11: no. It is the only case that exercises "every deck" outside the hub.
- Case 12: no.
- Case 13: yes. An `order:` entry or an image path with `..`, or a symlink, can still leave the root (check 6).
- Case 14: yes. A flow-style `slides: [...]` (the form the design and the converted `deck/present.yml` use) is rewritten by `setItems` as a block list indented from the flow item's column (`list-edit.ts:141-152`). "Every other byte kept" still passes.
- Case 15: yes. It never tests a base the file no longer holds (G8's second sentence).
- Case 16: no. It is the case that proves colours come from `vocab.yml`.
- Case 17: it fails, or passes only by deleting hccnet-fl's slide (check 3).
- Case 18: no.
- Case 19: it cannot run (check 3).
- Case 20: no.

**Step-line check:** the step line carries no check of its own, and "the brief's writer verifies every mechanism" is met by the brief, not the build. The goal clauses with no case are Z638 (several slide files in a member deck) and Z637 (`config/present.yml` no more powerful than a folder deck), the latter so far as `defaults.tag_tones` per deck is never tested.

**Items of "What to build":**
- Part 1: yes, through the YAML-list front-matter ambiguity and an unresolved name space for a group with no `find:` (check 6).
- Part 2: it passes while `docs/apps.md:271`, `normalise.ts` and `items.ts` are left out of the write list; the build would fail and the builder must widen the paths.
- Part 3: it could pass with the manifests hand-edited, against spec line 101.
- Part 4: it leaves two archive files and the demo's second slide undefined.
- Part 5: custom decks are absent from the deck menu.
- Part 6: no.
- Part 7: there is no stale-base refusal.
- Part 8: four DATA-MAP lines, the research-cockpit skill, `docs/apps.md` and three text catalogs are left false.

## 6. Implied inputs

Each item: the input, whether it has happened, and the expected result.

- **An `order:` entry, image path, `panels[].figure` or `find.folders` with `..`, an absolute path or a symlink out of the root**
  - Not seen in a deck, but the cost is high: `api/deck` reads the named file's text into slides, so `order: ['../config/local.yml']` from a deck under the engine root breaks G2 and G3.
  - Expected: a finding, nothing read.
  - The deck folder being a symlink out of the root falls under the same rule.
- **A direct separator followed by Markdown that parses as YAML**
  - Example: `---` then `# Where it wins` then `- item` then `---`. `#` is a YAML comment and `- item` is a YAML list.
  - Expected: front matter only when the block parses to a map; otherwise the lines are the slide's body.
- **A group with no `find:`**: what do `slides:` names resolve against? It is unstated. Expected: every deck the snapshot knows (project decks), or a finding.
- **A deck that `find:` matches itself** (a project deck whose group globs `projects/*/*/present`). Expected: never its own candidate, and no permanent cycle finding.
- **A name in two groups' `slides:`**: unstated. Expected: placed in both, and the Slides view allows or refuses a second tick consistently.
- **Two decks with the same name** (same folder name in two tiers, or a non-project `present/` whose parent shares a project id). Expected: a finding naming both paths, neither placed.
- **`domain:` not in `vocab.yml`**
  - This has happened: the demo's `graph-bandits/project.yml:11` has `domain: graphs`, and `vocab.yml` `domains` has no `graphs`. The demo deck's summary and legend hit it.
  - Expected: an empty field, neutral tone and no legend chip, with or without a finding (to be stated).
- **No `status.chips`**: dropped by a `status:` find. This follows from the brief's wording but is unstated.
- **An empty `present.yml`, or one that does not parse**
  - Expected: the empty state naming the folder, plus an `unreadable` finding.
  - The Slides view Save is refused.
  - Only "empty deck" is stated, and parse failure is not.
- **A slide file with only front matter, or an empty one**
  - The btfno conversion produces the front-matter-only form.
  - Expected: one slide drawn from the front matter for front matter only; zero slides and a finding for an empty file.
- **An `order:` entry naming a missing `.md` file, or an unknown map**: a likely hand-edit typo, unstated. Expected: a finding naming the entry, nothing placed.
- **An invalid `sort:` value**: unstated. Expected: a finding and `folder`.
- **A write racing an edit of the same `present.yml`** (Axel edits `slides:` by hand while the Slides view holds the old list). Expected: refused with the sentence that the file changed since it was read (G8). The brief has no base in the `deck-slides` body.
- **Old `deck` records in the change log**
  - This has happened: `grep -c '"kind":"deck"' ~/.oculus/changes.jsonl` gives 2.
  - Expected: the History view still names them, and their undo is refused with a sentence, never writing `selection:` back into `config/present.yml`.
- **Saved Present pane instance state from before the step** (`{ slide: 'hccnet-fl' }` with no `root`/`path`). Expected: the portfolio deck at its first slide.
- **Idea decks in `more`**: `more` discovers over tiers `[active, manuscripts, ideas]` with no status filter. Any idea that later gets a deck and is not named in `ideas`'s `slides:` lands in the project slides and the `more` summary. This is the ruled config; tell Axel.
- **`status_palette` side effect**: adding the three chips there also makes them collection-entry statuses (`vocab.statuses`, `data/index.ts:146`; option source `entry_statuses`). Their icons `white`, `yellow` and `blue` repeat those of `results-positive`, `admin-prep` and `numbers-pending`.

## 7. ADRs

`ls tools/oculus/docs/adr docs/adr` gives "No such file or directory" for both. None.

## 8. Dictated text

Each phrase is located in PR2.md with `grep -n -F "<phrase>"`; the number after each is the line it is on.

- "{{pillars.count}} pillar projects and {{more.count}} more." (139, 260): holds. It is a verbless fragment, carried from the original lede's form.
- "Structured models,<br>everywhere they hide" (139): holds.
- "{{more.count}} more, same backbone" (141, 260): holds.
- "Unified by structured, interpretable tensor models." (138): holds against spec.md. It recapitalises Axel's mid-sentence clause from `present.yml:160` into a verbless fragment.
- "The same structured-tensor backbone throughout." (138): holds against spec.md. It is a verbless fragment.
- "Each gated on a novelty check before committing." (138): holds (carried).
- "nascent (concept)", "scoping (lit-check and framing)", "de-risking (feasibility experiment)" (123): hold.
- "A Certificate, Not Just an Explanation, for ECG AI" (134): breaks spec.md line 20 ("no 'not X but Y' construction") if read as authored text. It is Axel's heading carried verbatim, so flag it for him rather than edit it. The carried body also has "guarantees, not just saliency maps - the black-box", a spaced hyphen used as a dash.
- "The wider portfolio, at a glance" and "Structured models, everywhere they hide" (138): hold.
- "Thank you" (142): holds.
- "Open presentation" (40, 176, 178, 180, ...): holds.
- The `sources.yml` comment, "it is the hub folder the Present view opens when no deck is named" (113): holds.
- "naming the keys PR1 built" (174): an instruction, not dictated text.
- The brief's own non-ASCII (`LC_ALL=C grep -n '[^ -~]' PR2.md PR2-design.md`): only `Linköping` at `PR2.md:294`, which is allowed.

## Declined to judge

- The "Libraries checked" facts (`npm view`): they need network lookups, and they sit outside "What is on the tree".
- Whether the sparse checkout carries the hub-root `README.md`: the PR2 worktree does not exist yet (`ls .agents/worktrees/PR2`).
- Path overlap with the steps in flight (D23, Q124, Q125 in `git worktree list`): this is the spec step's comparison, and the brief check does not include it.
- Whether the new chip hexes pass `contrast.test.ts`: that needs a test run, which this read-only check does not do. All three hexes are in the palette (`vocab.yml:28,32,38`).
- Whether `Present.svelte` (502 lines) passes 520 after part 5: it cannot be known before the build.

Usage: Opus 5.5 (claude-opus-5-5); about 255k tokens; about 75 tool uses.

## Closed

Each finding is closed in `agents/briefs/PR2.md` as rewritten after this check (main at 4f97e9fad), or raised to Axel.

- Check 1, names: every source, word, test and document hit is now named in "What is on the tree" and in "Paths this step writes" (`normalise.ts`, `items.ts`, `config-sources.ts`, `editors/sources.ts`, `bodies.ts`, `app-gate.ts`, `apps.ts`, `history.yml`, `workbench.yml`, `project.yml` words, `config-folder.test.ts`, `boundaries.test.ts`, `allow-duplication.txt`, `normalise.test.ts`, `writes.test.ts:153`, `docs/apps.md:271`, DATA-MAP 234, 253, 311, 356, `demo/README.md:5`); `slide_tags` reads the project slides' `tag.class` (part 1); `tests/fixtures/present.ts` taken out of the readers and the write list; the raw-pls project comment listed for the report only; the research-cockpit skill and `tools/present` raised to Axel as Z650.
- Check 2: the audit's `SCANNED` (part 2); the key hint drawn on every deck's first slide (part 5, Z651); recent decks in the deck menu (part 5, Z651); counts follow the design's "holds" (part 1, case 2); Z638 by case 11; Z637 per-deck defaults by case 13; the Z649 points stand as self-rule, booked.
- Check 3: 18 `PRESENT.md` files with the two archive files converted (part 4, Z651); the HCCNet-FL reason rewritten from the design's groups; the demo's `slides:` list converted into a second slide; `selection:`/`slide_order:` premise corrected; line numbers corrected to 4f97e9fad (card.ts:94, ProjectCard 182-195, layout.yml 141 and 152, DESIGN.md 113, 385, 392); btfno's 11 keys; case 19 rewritten as case 22 over the deck reader; the base copy and `unused-exports.txt` named.
- Check 4: G32 keeps its wording; the malformed-input cases are quoted runs; G2 and G32 Code lines rewritten at landing; G12, G14, G16, G21, G24 named; the hub data writes go through `convert-decks.py` only; the builder runs no git command (verify 2, 3 and case 20 use `find` and `grep`); the ASCII gate in the perl form; port 8792 named.
- Check 5: case 1 now changes a `main.md` headline and sees the row follow; case 2 counts an unshown group; case 5 the YAML-list ambiguity; case 16 the path escapes; case 18 the stale `base`; block lists written by the script and a flow list read back (part 7); case 22 for the demo; G14 kept by the no-finding summary row (part 1, Z651).
- Check 6: every implied input given an expected result in part 1, part 5 or part 7; the `more` discovery of future idea decks and the three chips becoming entry statuses with repeated icons go to Axel in the report to him.
- Check 8: the carried "Not Just" heading and the spaced hyphen are Axel's words, carried as written and listed in the builder's report for him (Conventions).
