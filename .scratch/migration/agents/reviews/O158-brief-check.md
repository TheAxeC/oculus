# O158 brief check

Brief check of O158 (`.scratch/migration/agents/briefs/O158.md`), read on main at 61d4ac3af (`git log -1 --format=%h` printed `61d4ac3af`). Nothing was written or changed.

The findings that matter most:
- Slide.svelte is 539 lines, over the rules file's 520-line limit for a component. The step changes it, so the rules file requires a split by concern in the step. The brief does not name a split and does not widen the write list for it, and its verify item 4 cannot pass. The folders such a split could use: `present/` has 10 items (full), `screen/` has 7, `parts/project` has 2.
- Item 6 (every fact fits in two lines) is probably not reachable at the sizes the brief dictates. This is my estimate, not a measurement. The brief's only answer to a miss is to report it.
- C6 expects the words "failed". The server draws the stage's vocab label, "failed (no-go or disproved)".
- C14's input (a domain no hub holds) produces no domain fact at all. The hue functions also give 'grey', not the untoned dot C14 expects.
- Item 5 leaves funding out of the list fields, and does not say whether the "+n" count survives when the ellipsis cuts the value.
- Item 9 names HELP.md:341 and :345. The lines the step makes false are :342 and :343.

## Names

- `grep -rn "Facts\.svelte\|parts/project/Facts" src tests config docs utils README.md --exclude=local.yml` gives:
  - `src/lib/views/academic/present/Slide.svelte:44`: the import, inside the write list.
  - `src/lib/views/shared/card/project/ProjectCard.svelte:7,44` and `src/lib/views/boards/focus/lanes/LaneCard.svelte:10`: these name `CardFacts.svelte`, a different component. The change does not make them false.
- `grep -rn "present\.fact\b..." ...` finds only `Facts.svelte:88`. `grep -rn "fact_more\|present\.fact_" src tests config docs utils --exclude=local.yml` finds `Facts.svelte:48,50` (`fact_chips`, `fact_pillars`). `fact_more` exists nowhere, so the new key collides with nothing. All hits are inside the write list.
- `.foot` and `.strip`: `grep -rn "querySelector[^)]*\(foot\|strip\|fact\)\|'\.foot\|\"\.foot\|\.strip\b\|data-facts\|\[data-fact" src tests utils config docs --exclude=local.yml`.
  - The only Present hit is `Slide.svelte:503`.
  - The other `.strip` hits are scoped classes of other components: `ui/tabs/Tabs.svelte:386`, `ActionStrip.svelte:81`, `TabFace.svelte:226-331`, `GroupHead.svelte:221`, `SplitView.svelte:195`. The change does not reach them.
  - `data-facts` and `data-fact` appear only in `Facts.svelte:132,135`. `DetailsBody.svelte:196,221` has its own unrelated `data-fact`.
- Dot.svelte: `grep -rn "Dot.svelte" src tests docs utils config --exclude=local.yml` gives `parts/Summary.svelte:14` and `parts/Grid.svelte:10`. A change to Dot's 9 px size would reach the summary rows and idea cards.
  - The brief does not say those two must stay at 9 px, for example through a custom property with a 9 px default.
  - Dot's head comment (`Dot.svelte:2`, "The hue dot beside a summary row's field and an idea card's title") becomes incomplete once the strip uses Dot. It is not named in item 9.
- Docs section "The project facts strip": the hits come from `grep -rn -i "facts strip\|project facts\|strip of a project..."` and `grep -n "strip's words" docs/decks.md docs/HELP.md`.
  - `docs/HELP.md:342` ("as a labelled chip in the words and hues of the project card") and `:343` ("a chip too long for its room is cut with an ellipsis") become false. They lie inside the write range 341-345, but item 9 names only `:341` and `:345`, which stay true.
  - `docs/decks.md:393` and `docs/HELP.md:347` (`{{project.<field>}}` "in the strip's words, the words of a list joined with ', '") are outside the write list. They are not strictly false after the step, but they become misleading once the strip draws a list as "first +n". They should be read and named.
  - `docs/decks.md:388` and `HELP.md:344` (domain) stay true.
  - `src/lib/themes/slide.css:13-14`, `Stage.svelte:19-21`, `Present.svelte:71-75`, `Presenter.svelte:14`, `Framed.svelte:13`, `arrange.ts:48`, `present.ts:106` and `tests/checks/tree/layer-rows.ts:139` stay true. None of them describes chips.
  - `vscode-map.ts:517` is about another strip.
- The glyph keys and `computeGlyph` keep readers in `CardFacts.svelte:113,118,123` (`grep -rn "code_glyph\|repro_glyph\|computeGlyph" src`). Dropping the glyphs leaves no orphan key and no unused export.

## The step line

The step line is `plan.md:1702`.
- "the strip at the foot of a project's slide redesigned" is served by items 1-8.
- "the design shown to Axel as screenshots from a scratch server before the step lands" and "landed only on his word" are not items of "What to build". They are stated in "What is on the tree" (first bullet) and in the last paragraph of "Verify before you report". That is right for the orchestrator's part, but no part of "What to build" or "Report" asks the builder for what the screenshots must show beyond the C1-C14 look list.
- "built by a builder agent": the brief is a builder brief.

Ruling 680 (`plan.md:3572`):
- The 16 fields in their order are kept (item 7, `FACT_FIELDS`, `model-deck.ts:145-162`).
- "each field that holds a value" is kept, since the server is unchanged (`project-facts.ts:168-173`).
- The two lines are kept (item 6) and the toggle is kept (item 7; `Bar.svelte:82-86` unchanged).
- `{{project.<field>}}` is untouched, since the words are unchanged.

Ruling 684 (`plan.md:3580`), the stage as it is: kept in item 7 and C6. The words C6 expects are wrong (see Cases).

Ruling 682: the toggle follows the deck in `Bar.svelte`, which is unchanged, so it is kept.

## Premises

- `wc -l` gives Facts.svelte 198 lines, which holds. `sed -n` confirms the `.facts` clamp at `:159-171` (holds) and `present.yml:98` `fact: '{0}: {1}'` (holds).
- Slide.svelte:
  - `Slide.svelte:44` is the import. The draw is at `:460`.
  - The `{#if held !== null}` block runs 457-463 (463 is `{/if}`). The brief says 457-462 in "What is on the tree" and 456-462 in the write list; 456 is the content's `</div>`.
  - `.strip { padding-top: 1.2em }` is at 503-505, which holds. That 1.2em is in the reading column's font size (`--slide-fs-body`, 24 px), not the strip's.
  - The foot comment is lines 30-39, not 30-38: line 39, "the column's foot and taken off the content's room.", closes the paragraph. spec.md:45 asks for a whole-paragraph rewrap, so the write list should read 30-39.
  - The CSS comment of `.foot` at 497-498 ("holds the strip with its own space above it") lies outside the write range 499-505. Item 4 changes what is above the strip.
- `grep -rln "parts/project/Facts" src` gives `Slide.svelte`, which holds.
- Folders: `ls parts` shows 10 entries and `parts/project` 2, which holds. `present/` itself also has 10 entries.
- Tokens: `slide.css:21,40,63-69` confirms 18 px, 17 px under rice, times `--text-scale` (and `--slide-fit`, which is 1 at the foot). Dot is 9 px and uses `--line` and `--c-<tone>` (`Dot.svelte:16-33`). Holds.
- The hub decks: `find . -path '*/present/present.yml'` under `research-hub/projects` gives 25 decks. The brief says 24 in the deck menu; one deck is not accounted for.
  - The awk loop over each manifest's `status:` block prints `chips: []` for all 25. No deck carries any status chip, blocked or otherwise, which is stronger than the brief's statement.
  - `fed-faithful-ecg` is at `stage: failed`, which holds.
- The HCCNet manifest (`grep -nE` over `hccnet-revision/project.yml`) holds exactly 12 fact fields: stage, domain, pillars, datasets, lead (2), collaborators (3), year, venue, funding, compute, code, tier. This matches C1.
- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`, which holds.
- Reading the CSS for "What it looks like":
  - The stage is a filled `Chip` with border, `--chip` background and pill radius (`Chip.svelte` `.chip`).
  - The domain is a toned `Tag`. The other tags have no border or background and use the `--muted-txt` colour (`Tag.svelte` `.tag`).
  - The gap is `margin: 0.15em 0.35em 0.15em 0` (`Facts.svelte:185`), and the second line's ellipsis comes from `-webkit-line-clamp: 2`.
  - The description is consistent with the code.

## Cases and checks

- C6 is wrong in its words. The stage's words are the vocab row's label (`vocabWords`, `project-facts.ts:78-81`): `config/catalogs/vocab.yml:76` gives `failed: { label: "failed (no-go or disproved)", ... }`, and `grep -rn failed` over the hub's `.oculus/config.yml` finds no override of that label. The strip draws "failed (no-go or disproved)", not "failed".
- C14 is wrong in its input and in its expected result.
  - Input: `held('domains', ...)` (`project-facts.ts:108-114,134`) drops an id whose record is missing, so a domain no hub holds gives no domain fact at all.
  - Expected result: `stageTone`, `domainTone` and `statusMarkTone` never return undefined. They return `UNKNOWN_TONE = 'grey'` (`tones.ts:40`), which Dot draws as `--c-grey`, not as its untoned `--line` dot. Item 2's "neutral dot" and C14 contradict "in the hue the strip gives them today".
  - The reachable input is a stage, form or chip word with no colour, which gives 'grey'. The brief has to say whether 'grey' is mapped to Dot's untoned dot.
- C9 requires the rule to hide with the toggle. Item 4 places the rule's room in `Slide.svelte`'s `.strip`, which the toggle (`Facts.svelte` `.hidden`) does not reach. The brief should say the rule is drawn inside the hidden box.
- C10's "the hidden facts counted" has no expected value, so it checks only the two-line limit.
- C11 checks one rice theme and the base theme. `config/defaults/appearance.yml:8-40` ships about 20 VS Code themes, two of them high contrast, and 11 terminal themes. Item 8 says "the rice theme" in the singular.
- No case asks the builder to change a place the step does not change. C12 and C13 are reads and look items over unchanged code, which spec.md:65 allows.
- Every case is a look on landing, which is consistent with spec.md:65 and :67.

## The question

- Item 1, one visual language. It can pass with a design Axel rejects; only his word on the screenshots settles it, and the brief routes it there.
- Item 2, the hues as dots. It can pass with grey dots where the brief means neutral, or the reverse (see C14).
- Item 3, facts set apart. It does not bear on the goal beyond the look.
- Item 4, the rule above the strip. It can pass with a rule the toggle does not hide; its placement is left open.
- Item 5, short values. It can pass while the "+n" count is cut away by the 16em ellipsis, because the brief does not require the count to stay visible when the first entry is cut. A reader then sees one entry. Funding, a list (`project.fundingIds`, `project-facts.ts:146`), is missing from item 5's list of list fields. In the PDF and the audience window there is no tooltip, so the entries behind "+n" are seen nowhere there.
- Item 6, two lines and every fact seen. Yes, it can pass without the goal being reached. "should fit" plus "a deck that still hides a fact is named" turns a miss into a report line, and the brief gives no design lever to use when C2-C4 fail.
  - My estimate, a judgment and not a measurement: at 18 px, labels at 0.8em in capitals with letter spacing are about as wide per letter as the values. With 1.25em gaps, the HCCNet strip's 12 facts (about 74 label letters, about 170 value letters after "+n") need roughly 2,500 to 2,800 px against two 1040 px lines (2,080 px). Today's strip spends about the same room on the 7 facts it shows.
  - A measurement at the scratch-server look would settle it.
- Item 7, kept as it is. "no taller than today's two lines" gives no figure. Today's height depends on whether a chip sits on a line (chip min-height 18/11 x 18 = about 29.5 px against a 23.4 px tag line), so it can pass or fail per deck. It also does not say whether the rule and the 0.6em count in the height.
- Item 8, themes. It can pass with an unreadable label in a VS Code high-contrast or terminal theme that C11 never opens.
- Item 9, docs. It can pass with `HELP.md:342-343` still false, because it names :341 and :345.
- Item 10, no new test. It holds: `guarded.md:3` says "Views have no entry".
- C1 can pass with the venue, the funding and the rest ellipsed.
- C2-C4 count fields, not entries, so they pass while lists are cut to "+n".
- C5, C7, C8 and C13 cannot pass without what they name.
- C6 would fail on correct code because of its words (see Cases).
- C12 does not combine the surfaces with the toggle.
- The check on the step line is Axel's word. It cannot pass without his approval, but the brief does not book that approval as a line in the report or the ledger.

## Implied inputs

- A fact with an empty list: it cannot happen, since `project-facts.ts:168-173` drops a field with no word. Nothing is missing.
- One very long word (a long dataset or funding id): no case. Expected: the value is cut with an ellipsis at about 16em and the tooltip gives it whole. Low cost.
- A list whose first entry fills the 16em: missing, and it costs a wrong reading. Expected: the first entry is cut and "+n" stays drawn.
- Funding with two schemes: missing. The hub has none today (every `funding:` line in the 25 manifests holds one id). Expected: "first +1", like the other lists.
- A blocked chip that is not the first chip: missing. Expected: the brief has to say whether a red dot beside a non-blocking first word is right (`isBlocked` reads every key, `Facts.svelte:104`).
- A deck in another hub whose words differ: missing. Expected: the hues are read in the deck's hub (`statusMarkTone(..., hub)`) and the labels come from oculus's catalog. Low cost.
- A project with every one of the 16 fields: missing. The hub's maximum is 13. Expected: whole facts on two lines and the rest hidden, which contradicts "every fact seen"; the brief should state that outcome.
- The rice theme: C11 checks reading only. The step drops `Tag`, whose rice brackets follow the `rice.brackets` setting (`Tag.svelte`, `:global(body.rice:where(:not(.rice-plain))) .tag::before`). The strip then no longer follows that setting. This is a user-visible change named nowhere in "Decisions".
- The strip in the Overview's small tiles: C12 covers "same strip". A 1 px rule scaled down to tile size may vanish. Expected: the rule visible, or its absence accepted in the report.
- A value holding Markdown or HTML characters (`|`, `<`, `&`): missing. Expected: drawn as literal text through Svelte text nodes, never `{@html}` (G5). Low cost, but the brief does not forbid `{@html}`.
- The toggle while the presenter screen or audience window is open: missing. Expected: words and rule hidden on every surface and the room kept.

## ADRs

`test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. `.agents/plan.yaml` names no ADR key, and `find . -name '[0-9][0-9][0-9][0-9]-*.md'` (outside node_modules) prints nothing. None.

## Dictated text

- `grep -n "fact_more" .scratch/migration/agents/briefs/O158.md` gives line 26: `fact_more: '{0} +{1}'`. Holds: ASCII, one line, the same placeholder form as `fact`, and the group `present` already lives in this file.
- `grep -n "visually hidden" .scratch/migration/agents/briefs/O158.md` gives line 22: "a visually hidden `: `". A literal `: ` that a screen reader reads breaks spec.md "What every package obeys", the catalog rule at line 51 ("every user-facing string from a catalog file under `config/text/` through `t()` ... A literal string ... anywhere a reader sees it is a defect"). It holds only if the separator comes from a catalog key.
- `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing, so the brief is ASCII.

## Other checks

- Write-list line ranges, checked with `sed -n`:
  - `Slide.svelte 30-38`: should be 30-39.
  - `456-462`: the block is 457-463.
  - `499-505`: misses the `.foot` comment at 497-498.
  - `present.yml 95-105`: holds, since `fact` is at 98.
  - `decks.md 383-389`: holds.
  - `HELP.md 341-345`: holds as a range.
- Size limits (`wc -l`):
  - Slide.svelte is 539 lines, over spec.md:48's 520 for a component. The size check allows up to 540 (`tests/checks/tree/size.test.ts:30`, `COMPONENT = 540`, `count > line`), and `grep -n Slide utils/size-allow.txt` prints nothing.
  - spec.md:48 says a file the step changes that would pass 520 "is split by concern in the step". The brief names no split, and verify item 4 cannot pass. A net reduction would still leave it over 520.
  - Facts.svelte 198, Dot.svelte 34: fine.
- Dot drawn elsewhere: `grep -rn "Dot.svelte" src` gives `Summary.svelte:14` and `Grid.svelte:10`. A size change reaches the summary rows and the idea cards unless it is done through a custom property with a 9 px default.
- Tests naming a changed file: `grep -rln "Facts.svelte\|Slide.svelte\|Dot.svelte\|present\.fact" tests` prints nothing.
  - The brief's own pattern adds `present.yml`, which lists 15 files. Fourteen of them name hub deck `present.yml` files, not the words file. Only `tests/checks/config/config-folder.test.ts:303` names `views/academic/present.yml`.
  - The test that a new words key has a reader is `tests/checks/source/keys.test.ts` ('has a reader for every catalog key', line 705). It is not named by that grep.

## Declined to judge

- The count of hidden facts per deck (16 of 24, btfno 9 of 12, and the rest) and the on-screen description of the HCCNet strip. Both were measured in a page, and this check runs no page. The description agrees with the CSS of `Facts.svelte`, `Chip.svelte` and `Tag.svelte`.
- Which of the 25 hub decks is not among the 24 of the deck menu. That needs the page's deck menu.
- The order of the collaborators ("Maryam Amir Haeri" first). It comes from the merged snapshot's team order (`model-deck.ts:168-170`), not the manifest order `[guichelaar, amir-haeri, van-den-berg]`, and is seen only in a page.
- Whether the 13-fact decks fit two lines at the dictated sizes. My estimate under The question is a judgment; only the look measures it.
- The statement that the state file's verify list equals its verification page. Not reread.

Usage: adc6d991942348bee, claude-opus-5-5, 190286 tokens, 51 tool uses, 8.8 min

## Closed

- Slide.svelte at 539 lines, over 520: item 11 added, the split by concern into `screen/`; the write list widened to the whole of `Slide.svelte` and one or two new files in `screen/`; case C16; the size check added to the verify item 2.
- Item 6 likely unreachable: item 6 now widens the strip to the slide's inner width (1150 px), sets the label at about 0.72em, the gap at about 1em and a value at most about 14em, with the numbers named in the report; the look counts the facts still hidden on each deck and the count goes to Axel with the screenshots; the 16-field outcome is stated.
- C6 words: now "failed (no-go or disproved)", the vocab label.
- C14 input and expectation: now a word with no colour, drawn in the `grey` tone, as today; item 2 says `grey`, not a neutral dot.
- Item 5: funding added to the list fields; the `+<n>` stays drawn when the first entry is cut (C15).
- HELP lines: item 9 names `:342` and `:343`, and `decks.md:393` and `HELP.md:347` are read and made exact; the write ranges widened to `decks.md` 383-393 and `HELP.md` 341-347.
- Slide.svelte ranges and the `.foot` comment: the comment is 30-39, the block 457-463, the CSS 497-505; the whole file is in the write list.
- Dot.svelte size reaching Summary and Grid: item 2 sets the size by a custom property with a 9 px default and names the strip in Dot's head comment.
- C9, the rule and the toggle: item 4 draws the rule inside `Facts.svelte`'s box; C9 also covers the presenter screen and the audience window open.
- C10: the hidden count is reported, more than at size 1 expected.
- C11 and item 8, themes: item 8 names every theme family shipped; C11 adds the base dark theme and one high-contrast theme.
- The accessible separator: item 1 says its words come from a catalog key through `t()`; values are text nodes, never `{@html}`.
- Item 7's height: now about two chip lines (about 59 px), with the room above the strip measured at the look.
- Rice brackets: item 8 and decision 5 name them as dropped with `Tag`.
- Overview tile rule: C12 states a thinner rule in the small tile is reported.
- Blocked chip not first: C13 and decision 6.
- Test grep: the verify item 2 names `keys.test.ts`, `config-folder.test.ts` and `size.test.ts`, and narrows `present.yml` to `views/academic/present.yml`.
- 24 of 25 decks: "What is on the tree" says the loop measured 24 and `hccnet-revision` was read on screen (5 of 12 hidden).
- The report's screenshots: the Report part names the decks and states to capture for Axel.
- Step line, Axel's word: the landing books his word in plan.md before the landing commit; no builder part.
