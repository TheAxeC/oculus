# O162 brief check

Read on main at `0b80bb57c` (`git log --oneline -3` prints `0b80bb57c Move O151 and O159 back to the queue` first). `.scratch/migration/plan.md` has no Goal section: `grep -n "^#" .scratch/migration/plan.md` prints only `# Plan: migration (cockpit to oculus)`, `## Steps, in execution order`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked, and by what`. I used the goal stated in my task (no slide draws the hint, no room is kept for it, nothing else changes) together with the ruling at `plan.md:3609` and the step line at `plan.md:1702`. The state file's standing demand at `orchestrator-state.md:70` (ruling Brief check scope, amended by 374 (a)) decides where each fix goes, and each finding below says whether it stays inside the step line.

## Names

`git grep -n -i -e "key_hint" -e "key hint" -e "keys-past" -e "names the keys" -- src tests docs config/text` gives these hits outside the write list:

- `src/lib/themes/slide.css:14`: "The frame itself, the slide's foot under the content (the strip of a project's facts) and the key hint keep the factor 1." The change makes it false.
- These hits are about menu key hints, a different thing: `src/lib/state/sources/explorer/acts/keys.ts:95`, `src/lib/views/shared/explorer/tree/control/picks.svelte.ts:70`, and `src/lib/views/shared/explorer/tree/menu/row-menu.ts:115,157,223,328`. The change does not make them false.
- These hits use "names the keys" about other maps: `src/lib/data/sources/config/catalog/latex-tables.ts:95`, `src/lib/data/sources/config/merge/workspace-layer.ts:118,164`, `src/lib/server/root/process/context/machine-values.ts:74`, `src/lib/themes/vscode-map.ts:243`, `tests/checks/tree/layer-rows.ts:121`, `tests/routes/hubs/machine-answer.test.ts:55`. The change does not make them false.

The other names have no hit outside the write list:

- `present.key_hint`: only `present.yml:82` and `Slide.svelte:465,467`.
- `--keys-past` and the `.keys` rule (`git grep -n -e '\.keys\b' -e 'class="keys"'`, `Object.keys` filtered out): only in `Slide.svelte`.
- `past` (`git grep -n -w past -- src/lib/views/academic/present src/routes/present src/lib/themes`): as a variable only in `Slide.svelte`; every other hit is the plain word.
- `keys`: as a variable only in `Slide.svelte`; the other hits are the plain word or the file `screen/keys.ts`.
- The `first` prop: `git grep -n "first={\|{first}" -- src` lists only the callers the write list holds, plus `apps.ts:51`, `Overview.svelte:170`, `Source.svelte:485-486` and `SourceBody.svelte:158`, which are other `first`s.
- The probe's text `t('present.key_hint')`: only `Slide.svelte:467`.
- `README.md`, `docs/HELP.md`, `utils` and `bin` have no hit.
- Ledger files under `.scratch` name the hint (`git grep -c ... -- .scratch` lists 20 and more). They are records, and the change does not make them false in a way that matters.

C-1. `src/lib/themes/slide.css:13-15` names the key hint and is missing from the brief: from "Comments and pages that name the hint" (brief:17-21), from requirement 5 (brief:31) and from "Paths this step writes" (brief:46-58). To close: add `src/lib/themes/slide.css` lines 10-15 (the paragraph, rewrapped) to all three. The step line covers this ("every page and test that names the hint removed", and spec.md:72), so it is not a widening for Axel.

## The step line

The parts of `plan.md:1702` against "What to build":

- "no slide draws the line ...": requirement 1, and C1.
- "`present.key_hint` (present.yml:82)" removed: requirement 5.
- "the hint's paragraph": requirement 1.
- "its use as the probe's text in Slide.svelte:465,467": requirement 3.
- "the room the slide keeps for it (`--keys-past`, Slide.svelte:209-211,400,472-482,514-516)": requirement 2, with requirement 1 for the `.keys` rule. The brief also covers `- past` at :214, which the line leaves out.
- "the `first` slide's comment that it names the keys (Slide.svelte:66)": requirement 5, and requirement 4 removes the prop itself.
- "every page and test that names the hint removed": requirement 5 for the pages. The tests are the premise at brief:22 (none name the hint). It is short by slide.css (C-1).
- "the probe still measuring a line of the frame's body type": requirement 3, and C3.
- "built by a builder agent" and "before O158's look": the dispatch and brief:23. These need no requirement.

C-2. Requirement 4 and Decision 2 (brief:30, :63) remove the `first` prop and reach five files the step line does not name: `Present.svelte:419`, `Tile.svelte:115`, `Presenter.svelte:110,122`, `print/+page.svelte:190` and `show/+page.svelte:276`. The line names only the comment at :66. The removal follows from spec.md:89 (nothing kept without a reader), and nothing a user sees changes. That makes it an internal widening under ruling 374 (a). To close: book it in `choices.md` and name it in the next report, as `orchestrator-state.md:70` asks.

No part of "What to build" serves nothing in the line. Requirement 6 serves the goal's "nothing else changes".

## Premises

Rerun, with what each printed:

- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. Holds.
- `sed -n 82p config/text/views/academic/present.yml` prints the `key_hint:` line exactly as quoted. Holds.
- `git grep -n "key_hint" -- src tests docs config ':!config/local.yml'` prints `present.yml:82` and `Slide.svelte:465,467` only. Holds.
- `wc -l Slide.svelte` prints 539. Holds.
- The Slide.svelte lines (from a read of the whole file) hold:
  - :464-466 is `{#if first}` / `<p class="keys" bind:this={keys}>` / `{/if}`;
  - :467 is the probe;
  - :103-104, :114, :207-211, :214, :400, :471-482 and :507-526 are as stated (:526 is the blank line after the rule);
  - :35-39 and :66 are the comments quoted.
- The `first` premises hold:
  - Slide reads `first` at :464 only; it is also declared at :67 and destructured at :74.
  - `Framed.svelte:25-26,33,52` hold.
  - `git grep -n "first={\|{first}" -- src` prints exactly the callers listed.
  - `Group.svelte:45` is the prop `first: boolean;` of a group.
- `Stage.svelte:17-19`, `show/+page.svelte:5-6` and `docs/decks.md:166` read as quoted. Holds.
- `git grep -n -i "key_hint\|Arrow keys or Space" -- tests` prints nothing (exit 1). Holds.
- guarded.md:3 says "Views have no entry". Holds.
- O158 on `present.yml` and `docs/decks.md`: `diff -u config/text/views/academic/present.yml .agents/worktrees/migration-O158/...` prints `@@ -97,6 +97,7 @@` / `+        fact_count: '+{0}'`, and the same diff of `docs/decks.md` prints `@@ -383,14 +383,16 @@`. Holds.

C-3. brief:21 says `git grep -n -i -e "key hint" -e "key_hint" -e "names the keys" -e "keys-past" -- docs src tests config/text` finds the comments of Stage, show and decks.md. The same grep also prints slide.css:14 and the 17 unrelated hits listed under Names. To close: list slide.css:14 under the premise and say that the other hits are menu key hints and other maps.

C-4. brief:23 says O158 changes `Slide.svelte` "at its hunks around :395-404 and :468-522". `diff -u .agents/worktrees/O158-base/src/lib/views/academic/present/Slide.svelte .agents/worktrees/migration-O158/src/lib/views/academic/present/Slide.svelte | grep "^@@"` prints:

```
@@ -1,9 +1,10 @@
@@ -21,22 +22,28 @@
@@ -46,8 +53,15 @@
@@ -100,111 +114,38 @@
@@ -395,10 +336,10 @@
@@ -468,34 +409,37 @@
@@ -505,18 +449,19 @@
```

So O158 also rewrites the head comment's hint sentences at :35-39 (its new text keeps "The first slide of a deck carries the key hint ... kept at the slide's foot"), the `past` comment at :103 ("kept at the slide's foot"), and the measure block in :100-210. Nearly every hunk of O162 in Slide.svelte overlaps one of O158's, so taking O158 onto O162's head is not a simple merge. To close: correct brief:23 to this hunk list, and say that O158's round after O162 lands removes the hint wording O158 adds.

C-5. brief:13 says the effect is at `:373-392`. It spans :373-394 (`$effect(() => {` to `});`). To close: correct the range.

## Cases and checks

C-6. C5 (brief:42) expects `git grep -n -i -e "key_hint" -e "key hint" -e "keys-past" -e "names the keys" -- src tests docs config/text` to print nothing after the change. It cannot: the 17 unrelated hits under Names stay. This conflicts with spec.md:84, since the expected result does not reproduce. It also pushes the builder toward spec.md:35, because making it pass means editing files outside the write list. Verify item 7 (brief:91) quotes the same grep. To close: replace the case with two greps:

- `git grep -n -e "key_hint" -e "keys-past" -e 'class="keys"' -e "Arrow keys or Space" -- src tests docs config/text` prints nothing;
- `git grep -n -i -e "key hint" -e "names the keys" -- src/lib/views/academic/present src/routes/present src/lib/themes/slide.css docs/decks.md docs/HELP.md` prints nothing.

The second grep prints today exactly the eleven lines the step removes, slide.css:14 included.

C-7. C6 (brief:43) asks the builder to confirm a list of hits in places the step does not change (`apps.ts:51`, `Overview.svelte:170`, `Source.svelte:485-486`, `SourceBody.svelte:158`). Being case-sensitive, it would also pass if the prop were renamed (`isFirst={...}`). To close: use `git grep -n "first={\|{first}" -- src/lib/views/academic/present src/routes/present`, which should print only `Overview.svelte:170`, and `git grep -n -w first -- src/lib/views/academic/present/Slide.svelte src/lib/views/academic/present/screen/Framed.svelte`, which should print only the comment "the bottom margin of the first figure's box".

C-8. "Paths this step writes" gives `Stage.svelte lines 17-19` and `show/+page.svelte lines 5-6` (brief:50, :55). spec.md:45 says a comment the step edits is rewrapped as a whole paragraph at 100 columns. Those paragraphs are `Stage.svelte:14-26` and `show/+page.svelte:2-10`, so the rewrap writes lines outside the ranges given. To close: give the paragraph ranges. They are in the same files and inside the step line.

No other case conflicts with spec.md or guarded.md:

- C1 to C4 and C7 are proved by reading and by the look at landing (spec.md:65, :67).
- The builder starts no page (brief:93).
- No test is asked for (guarded.md:3).

## The question

- The step line's check: the line names no command. As an outcome, "no slide draws the line" cannot hold while the `.keys` paragraph exists.
- C1 (brief:38) does not hold while the hint is drawn in the pane. It does not reach full screen (C-13).

C-9. C2 (brief:39) could pass without the goal being reached.

- The Stage scales the frame to the pane, and the slide is laid out in the frame's own px (`Stage.svelte:2-7`, `Slide.svelte:201-203`), so a narrow pane does not change the reading column.
- In the 1040 px column the hint fits the 64 px padding at text size 1.6 ("2 x 13 x 1.6 x 1.25 = 52 px and a padding of 10.4 px", `Slide.svelte:509-511`).
- 1.6 is the largest text size (`src/lib/state/shared/words/appearance.ts:332`, `Math.min(1.6, ...)`).
- So on the unchanged tree `past` is 0 for C2's input, and the case reads the same before and after.

The room was kept only in a deck frame narrow enough that the hint wraps to three lines at 1.6. Judging by the hint's 131 characters at 20.8 px, a frame of about 800 px wide does it (not measured). To close: C2's input becomes a deck with a narrow `deck.frame` (for example `{ width: 800, height: 600 }`), at text size 1.6, whose first slide's content fills its room. Expected on the unchanged tree: the pane's first slide draws its text smaller than its Overview tile, or is flagged too tall where the tile is not. After the change the two match.

C-10. C7 (brief:44) has the same gap. The strip sat higher on the first slide only when `past > 0` (`padding-bottom: var(--keys-past, 0px)`, :482), so at the default frame it passes before and after. To close: give C7 the input of C-9, with the first slide a project slide carrying a strip.

C-11. Requirement 3 (brief:29) asks for "a fixed ASCII run". It admits an empty string or a space. With `white-space: nowrap` (:534) a lone space collapses, the box is 0 by 0 and never changes size, so the probe stops measuring, and only the look would catch it. To close: "a fixed, non-blank run of ASCII letters (for example `Mg`)".

C-12. C3 (brief:40) covers a change of the text size and of the theme, but not the probe's third cause, "the slide being shown" (`Slide.svelte:374-376`).

- `layOutSlide` returns while `column.offsetWidth === 0` (:198).
- Neither the first effect (:357-371) nor the Stage lays the slide out again when a hidden tab is shown, so the probe's ResizeObserver is the only path.
- If it fails, `laid` stays false and the content stays `visibility: hidden` (`.waiting`, :493-495): a blank slide.

To close: add to C3 "a Present pane opened behind another tab, then brought to the front: the slide is laid out and shown". This sits inside the step line ("the probe still measuring").

C-14. Requirement 2 (brief:28) leaves open whether the `flushSync()` at `Slide.svelte:212` stays. It sits there so that `past`, and with it `--keys-past`, is applied before the foot is measured at :213. Either answer passes requirement 2. Keeping it is a flush with no stated reason; removing it changes when pending state is applied before `tall(foot)`. My judgment is that removal is harmless, since every caller enters after a flush, but this is not verified. To close: requirement 2 says which, and why.

The other items:

- C4 (brief:41) checks that nothing else changes. It cannot fail because of the goal, which is right for that kind of case.
- Requirement 1 cannot pass while `.keys` is drawn.
- Requirement 2 cannot pass while `past` or `--keys-past` exists.
- Requirement 4 cannot pass while a caller passes `first`; with C-7's grep, a renamed prop is caught too.
- Requirement 5 passes while slide.css:14 stays false (C-1).
- Requirement 6 is the "nothing else changes" check.

## Implied inputs

The inputs the step implies but the brief does not state:

- A deck with one slide: its first slide is also its last. Expected: no hint, the full room, as in C1. Not missing; C1 covers it.
- A first slide that is a project slide with a strip: C7, short of its input (C-10).
- The print page: C4. It never drew the hint (`first={false}` at `print/+page.svelte:190`). Covered.
- A narrow pane at a large text size: wrongly given as the input that kept room (C-9). The right input is a narrow deck frame at 1.6.
- A probe that never changes size: C-11.
- A hidden pane brought to the front: C-12.
- Moving from the second slide back to the first, which mounted and unmounted `.keys` on the unchanged tree: covered by C1 after the change.
- The rice theme, which changes `--slide-design-body` (`slide.css:63-69`): covered by C3's "the theme".

C-13. The first slide in full screen from the pane. `Present.svelte:419` passes `first={at === 0}` together with `bare={full}`, so the hint was drawn in full screen as well, the view an audience sees. C1 names only "the Present pane". Expected: no line of words under the first slide in full screen. To close: add full screen to C1.

C-15. Decision 1 (brief:62) does not say why the probe keeps a text instead of the text-less probe form the tree already uses: `src/lib/ui/tree/list/VirtualRows.svelte:236,263` and `src/lib/shell/keys/rows/FileRows.svelte:195,228`, each an empty element sized by CSS from `--text-scale`. spec.md:89 asks for reuse. In my judgment a text probe is the right choice, since it also changes size when the font's metrics change and a box sized by CSS does not. To close: one clause in Decision 1 saying so.

C-16. Decision 3 (brief:64) says "the keys stay in the Help page". `docs/HELP.md:199-200` lists `F / P / O | in Present: full screen / presenter screen / overview` and `Space / Shift+Space | next / previous slide`, but not the arrow keys that move the deck (`screen/keys.ts:76`, `case 'ArrowRight':`). Once the hint goes, nothing a reader sees names them. To close: correct Decision 3 to what Help holds. Adding the arrows to Help would widen the step, so it goes to Axel as an open item if wanted, not into the brief.

## ADRs

`test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`, and `ls docs` lists `apps.md data-map.md decks.md diagrams HELP.md licenses palette.md templates.md third-party.md`. There is no ADR folder. Confirmed; no finding.

## Dictated text

The brief dictates no text word for word.

- `grep -n -i "word for word\|verbatim\|reads exactly\|the words:\|writes:\|becomes \"" .scratch/migration/agents/briefs/O162.md` prints only `102:- The open items of the state file, verbatim.`, which is about the report's shape, not text for the tree.
- The quotations at brief:9-20 are of existing text that the step removes.
- Decision 1's `Mg` is given "for example".
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O162.md` prints nothing.

None.

## Declined to judge

- Whether a short probe text such as `Mg` changes size under every theme change that needs a new layout. A theme that changes only the font family at the same size has not been measured; settling it takes a page, which this check does not open.
- The frame width at which the hint wraps to three lines at text size 1.6 (C-9) is an estimate from its character count; it was not measured on a page.

Usage: a782354b0336a03d9, claude-opus-5-5, 169025 tokens, 46 tool uses, 8.7 min

## Closed

- C-1, C-3: `src/lib/themes/slide.css:10-15` added to the brief's premises, requirement 5 and "Paths this step writes"; the 17 other hits of the premise grep are named as not about this hint.
- C-2: the `first` prop goes with the hint, taken under the state file's rule on internal widenings and booked in `choices.md` ("O162's brief check"); Decision 2 names the booking.
- C-4: the brief's "The step in flight beside it" gives O158's seven hunks of `Slide.svelte` and says the hand merge at O158's landing removes the hint wording and the `past` room from O158's version.
- C-5: the effect's range corrected to `:373-394`.
- C-6: C5 replaced by the two greps the finding gives.
- C-7: C6 replaced by the two greps over the present folders, Slide and Framed.
- C-8: the comment ranges corrected to `Stage.svelte:14-26` and `show/+page.svelte:2-10`, in requirement 5 and the paths.
- C-9, C-10: C2 and C7 use a deck with `deck.frame: { width: 800, height: 600 }` at text size 1.6, each with the unchanged tree's result.
- C-11: requirement 3 and Decision 1 say a fixed, non-blank run of ASCII letters.
- C-12: requirement 3 and C3 add a pane opened behind another tab and brought to the front.
- C-13: C1 adds full screen.
- C-14: requirement 2 removes the `flushSync()` at `:212` with `past`.
- C-15: Decision 1 says why a text probe is kept in place of the text-less probes of `VirtualRows.svelte` and `FileRows.svelte`.
- C-16: Decision 3 corrected to what `docs/HELP.md:199-200` holds; whether Help names the arrow keys is open item 706 in the state file, since it widens the step's paths.
