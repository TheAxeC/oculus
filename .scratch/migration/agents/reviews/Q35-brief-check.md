# Step Q35 brief check (on main at 9ec1e8ef; src, tests, DESIGN.md and HELP.md are unchanged since the brief's 9e9cd419)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/Q35.md`. Nothing was changed. `config/local.yml` was not opened, and no server, browser, curl or git write was used. A unit-suite or test run was not made (it would write caches); where a test would go red, the claim is derived from the test's source and marked so.

Head moved during the check: `git log --oneline -4` prints `9ec1e8ef Order D11 after D17`, `5ede4759 Launch Q66's builder`, `8e5ca1de Prepare Q66...`, `249a5ef0 Stop S4 at /spec...`. `git diff --stat 9e9cd419..HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/HELP.md` printed nothing, so every premise below holds at both heads.

Summary of what the session must close (F numbers are used in "Closed" at the end):
- F1 B6 (the Customizations 404) is on the step's line in plan.md:125 and has no item in the brief.
- F2 and F3: two parts of the step line are called "on the tree" and are not: Changes paths still cut at their START, and the Read/Write column still floats.
- F4: item 2 (Present) can pass every case and leave the stated defect (slide in the left part of the pane, text smaller than the UI in ordinary panes).
- F5 to F8: tests/checks that go red or are missed (`tinted`, `allow-audits.txt`, the scale cases' location, the row's attribute).
- F9 onward: contradictions and gaps inside the brief.

## 1. Names

Each name grepped across `src tests config docs DESIGN.md HELP.md README.md utils bin --exclude=local.yml`.

- `Card` (import and `<Card`) in `Audit.svelte`: `grep -rn "audit/Audit\|Audit\.svelte" src tests config docs *.md utils bin` printed only `tests/views/whole/type-scale.test.ts:61: 'system/audit/Audit.svelte':` outside the Audit test. But two tests read every view source, not by this name:
  - `tests/views/whole/tinted.test.ts` (header, lines 1-13; `bare()` and `faults()`): a view that neither declares a wall surface nor renders a Card, itself or through a partial, is "bare" and must ask `<Pane ... tinted>`. `Audit.svelte` today renders `Card` (`grep -n "<Card" Audit.svelte` prints `113: <Card id=...`), so it is not bare. After item 1 it imports only `$lib/ui/...` (no `$lib/views/` partial: `grep -n "import" Audit.svelte` lists only ui/, state/ and type imports), so it becomes bare and `faults(sources).missing` lists it unless its Pane carries `tinted`. Today it reads `<Pane title={t('audit.title')} {bar}>` (Audit.svelte:~157); the Findings view, which draws a list straight into the pane, reads `<Pane title={t('views.findings')} tinted>` (Findings.svelte:36). Pane.svelte:15-24 says the same in its own comment. The brief's item 1 does not mention `tinted`. Derived from the test source, not run. F5.
  - `tests/views/whole/type-scale.test.ts:61` pins the Audit row `'h3=fs-xs | .count=fs-sm | .where=fs-sm | .message=fs-md | .note=fs-sm'`; the brief names this file, fine. A new `.scope` role at `--fs-md` changes the string.
- The case names in `tests/views/system/audit.test.ts` and their `tests/checks/tree/allow-audits.txt` entries: `grep -n "audit.test" tests/checks/tree/allow-audits.txt` prints lines 11-14. Line 11 is `tests/views/system/audit.test.ts :: draws a card with the primitive and filters with the search primitive | the case draws nothing and asserts over source`; that case asserts `import Card from '$lib/ui/frame/Card.svelte'` (audit.test.ts, describe "the view as it is written") and goes false. The file's own header says an entry goes when its case renames itself to an audit or starts rendering. `allow-audits.txt` is not in "Paths this step writes". F6.
- `data-card` on each card: `grep -rn "data-card" src` prints `Card.svelte:69 data-card={id}`, `shell/keys/workbench-keys.svelte.ts:263 pane.querySelectorAll<HTMLElement>('[data-card]')` and `shell/keys/key-dom.ts:29`. The shell's arrow-key cursor and its `scrollIntoView` step through every `[data-card]` in the pane (workbench-keys.svelte.ts:261-276). Audit's cards carry it today (`id={finding.signature}`), and `tests/views/system/audit.test.ts:67` reads it as the "keyed by signature" marker. The brief says "keyed by its signature" and never says which attribute carries it on the `li`. F8.
- Prose in the files the step rewrites that the change makes false (the verify grep `grep -n "Card" Audit.svelte` is case-sensitive and misses them): Audit.svelte head comment "the card is drawn in the muted section at the end" (lines ~14-17) and the audit.test.ts head comment ("a card per finding ... filters the cards"), its describe "the cards" and helper `cards()`. Item 1 and item 3 should name them. F12.
- `class="cards"`, `.act`, the `card` snippet, `--card-reveal`: no hit outside Audit.svelte for the Audit's own use (`grep -rnE "\.cards\b" src` prints only Framing, Leads, Inbox, which are their own classes).
- DESIGN.md and HELP.md: `grep -n -i "audit" DESIGN.md HELP.md README.md` prints DESIGN.md:85,309,327,378,407 and HELP.md:19,139,222,256; none describes the Audit's cards (DESIGN.md:378 describes the scan, the signature, the mute write). `grep -n -i "slide\|deck\|present"` prints DESIGN.md:367 and HELP.md:120 ("The public deck, one slide at a time, with an overview grid"); neither states a size, so none is made false. Item 4 as written ("only the sentences item 4 finds") therefore finds nothing, and a new behaviour (a 16:9 frame at a 1280 by 720 design size, letterboxed) is left unwritten in DESIGN.md:367 and HELP.md:120. F13.

Paths, folder and file limits (`ls | wc -l`, `wc -l`):
- `src/lib/state/life/` holds exactly 10 files (`ls src/lib/state/life | wc -l` prints 10): a new file there breaks the ten-items rule of spec.md. Adding the function to `present.ts` (447 lines) is allowed. The brief leaves "markup.ts or state/life/present.ts, whichever the layer rules allow" open. `markup.ts` is the Markdown and KaTeX module (head comment, and it imports `katex/dist/katex.min.css`), so a scale function there breaks its cohesion. State the choice. F9.
- `views/academic/present/` holds 6 items (Overview, Panel, Present, Slide, markup.ts, parts): room. `tests/checks/tree/` holds exactly 10 items: no new file there. `Audit.svelte` 263 and `Present.svelte` 209 lines: far under 540.
- The brief's Audit entry is written as prose ("the markup from `:104` and the style; not the reader at `:53-61`"), not in the template's form ``- `<path>` lines <a>-<b>` ``. The range also leaves out line 25 (`import Card`) and the import block, which the step must edit, and the module script if `tinted` or anything else moves. The range must be `lines` form and include the imports.
- Missing from "Paths this step writes": `tests/checks/tree/allow-audits.txt` (F6), `tests/views/whole/tinted.test.ts` only if its rule changes (it should not; Audit asks `tinted`), `tests/state/life/present.test.ts` (exists: `ls tests/state/life` prints present.test.ts) if the scale function sits in `state/life/present.ts`, `src/lib/state/life/present.ts` if chosen, and for F1 the Customizations files.

Overlap with steps in flight (`orchestrator-state.md` dispatch block, `agents/briefs/Q85d.md`):
- Q85d (dispatched, repair round 1 building, worktree `.agents/worktrees/Q85d`, base 131d750f). Its item 3 puts `Audit.svelte`'s `search` through `instanceText` and `showMuted` through `instanceFlag` (Q85d.md:38, "Audit's `search`" / "Audit's `showMuted` `instanceFlag`"), which also adds an import and removes the `raw`/`held` derivations at Audit.svelte:53-61. Its item 10 and its refuter (`agents/reviews/Q85d-refuter.md:80`, "7 Audit: met, `audit.test.ts` 'the pane state the view reads'") add a case to `tests/views/system/audit.test.ts`. It writes `allow-audits.txt` line 58. So Q35 and Q85d share `Audit.svelte`, `audit.test.ts` and `allow-audits.txt`. The brief says "other hunks" for `Audit.svelte`; the import block is a shared hunk (Q35 deletes `import Card` at line 25, Q85d adds an import in the same block), which git can report as a conflict when the lines touch. Safest: Q35 waits for Q85d's landing (Q85d is in repair round 1). If it does not wait, steps 5 and 9 of `spec` need `shared_paths:` for these three files, and every line number in the brief is stale after Q85d lands.
- S4 (stopped at /spec on Z190; plan.md:203-205, Z169, Z170): removes the Config view and "places Status, Findings, Audit, History and Gallery where they fit". It will edit `config/layout.yml`, HELP.md and possibly the registration case in `audit.test.ts` (`group: 'info', order: 2`) and Audit.svelte's `<script module>` (lines 1-12). Disjoint hunks from Q35's markup and style. No conflict with the brief as written.
- Q66, D35, L4: their "Paths this step writes" (Q66.md, `grep -n` of its paths section) name neither `Audit.svelte`, `Present.svelte`, nor the Customizations files. No overlap. M4 (Present equations, queued) is after Q35 in the queue and touches the parts, not `Present.svelte`'s box.

Findings: F5, F6, F8, F9, F12, F13, plus the path-list corrections above (Audit entry form, missing paths) and the Q85d / S4 overlap note.

## 2. The step line

The plan line as booked (quoted whole in the brief) and plan.md's two sub-bullets (plan.md:124 premises, plan.md:125 widening), part by part:

- "Session, Transcript, Timeline, Changes and Agents with a way to pick a session and an empty state that says so": on the tree. `grep -rn "detail_empty" src/lib/views config/text` prints Transcript.svelte:161, Changes.svelte:150, SessionDetail.svelte:265, Agents.svelte:116, Timeline.svelte:128 and `config/text/views/sessions/session-list.yml:13: detail_empty: No session is picked. Pick one with the session control on this view's bar, or in the Sessions list.`; `grep -c "SessionPicker"` prints 2 for each of the five views. Premise holds.
- "Timeline grouped": on the tree. Timeline.svelte:14 head comment and `const turns = $derived(timelineTurns(events));` at :56. Holds.
- "Agents with true durations and sizes": on the tree, and the brief cites only the head comment and `:97`. The data is true: `src/lib/server/sessions/fold.ts:245 agent.ended = stamp;`, `:247 agent.resultChars = resultLength(block.content);`, a background launch notice does not end an agent (fold.ts:10 and `isLaunch` at ~:240), covered by `tests/server/sessions/stores/background.test.ts`. Holds.
- "Changes with paths cut at the end": NOT on the tree. See F2. No item.
- "and aligned columns": NOT on the tree. See F3. No item.
- "Present filling its pane": item 2. See the question (F4).
- "Config ... as lists": S4. plan.md:204 `Widened 2026-10-01 by Axel (ruling Z169): the Config view removed ...` and plan.md:763 `Open item Z169 (2026-10-01): (a), the Config view removed ... (the user)`. Belongs to another step; holds.
- "Audit as lists": item 1.
- "the source tab with wrap and line numbers": line numbers are on the tree, but the brief cites the wrong file: it says "Monaco's gutter in `views/sources/source/Editor.svelte`"; `grep -n "lineNumbers\|wordWrap\|wrap" src/lib/views/sources/source/*.svelte` finds no `lineNumbers` there, and `src/lib/ui/controls/editor/Editor.svelte:343` is `lineNumbers: held[1].length === 0 ? 'on' : blameNumbers(held[1], count)`. Wrap: D25 (plan.md:425 "word wrap (Alt+Z) and rulers"; `agents/briefs/D25.md:11` D29 "word wrap per language ... with Alt+Z for the open tab"); D25 is queued "once S4 has landed" (`queue.md`). Premise holds once the file is corrected. F11.
- plan.md:125 "Widened 2026-10-01 by the orchestrator, automode (no tiny steps), from U2's review B6 ...: a Customizations row whose file is a symlink resolving outside every root ... opens a source tab that answers `Cannot open: HTTP 404`; Q35 ends it under DESIGN.md:87's roots boundary": no item in the brief, no premise, not in the brief's list of what is "on the tree or another step's". F1.
- Items booked to Q35 by the 2026-09-16 13:05 agreement (`orchestrator-state.md` line 664) that the line's text does not carry: (a) "under a rice theme the wallpaper shows through the Present pane so the slide text sits on the picture ... (Q33 and Q35)": not on the tree fixed, see F10; (b) "the Deposit view shows code/README.md as raw markdown in monospace ... (Q35)": gone, `grep -n "README\|readme" src/lib/views/boards/deposit/Deposit.svelte` prints only the comment at :31 and the finding key at :110 (the view lists plan files, `.fl` rows, no document body).

Findings: F1, F2, F3, F10, F11.

## 3. Premises

Each command of "What is on the tree" rerun:

- `ls tools/oculus/docs/adr docs/adr`: from `tools/oculus`, `ls docs/adr docs/adr` prints `ls: docs/adr: No such file or directory` twice; `ls /Users/axelfaes/workspace/research-hub/docs/adr` prints `No such file or directory`; `grep -n "adr" .agents/plan.yaml tools/oculus/.scratch/migration/orchestrator-state.md` prints nothing. Matches.
- `grep -rn "detail_empty" src/lib/views config/text`: output above; the brief's five line numbers match (Transcript's `PickSession` opens at :160, the `message=` at :161). `session-list.yml:13` text matches the brief's quote byte for byte.
- Audit.svelte lines: 263 lines matches (`wc -l`). Sections: the brief says `:73-86`, actual `:73-85`; card snippet `:112-131` matches; card loop `:146-158` matches (`146 <section ... 158 {/if}`); muted section `:160-176`, actual `:160-177`; search in the toolbar `:105-109`, actual `:106-110`; reader `:53-61` matches. `--card-reveal` rule: `Audit.svelte:239-246` matches.
- `Findings.svelte:40-50` matches (`40 {:else}` to `50 {/if}`, `<ul>` 41-49); the `min-height: calc(var(--tree-row) * var(--text-scale, 1))` row rule matches. The brief's claim "A selected or hovered row takes the list's hover and selection fills the Findings rows use" is FALSE: `grep -rn "hover\|select" src/lib/views/system/findings` prints nothing. The tree's list fills live in `ui/tree/TreeItem.svelte` (`--row-bg: var(--panel)` at :303, `var(--chip)` at :308, `var(--accent-bg)` at :319). Audit has no selection state at all (`cursor={false}`). F7.
- `Present.svelte` 209 lines matches; the slide is at `:191` (`<Slide row={shown} />`), the brief says `:192`.
- "the slide parts ... stretch with `min-height: 100%`": only two of ten parts do: `grep -n "min-height" src/lib/views/academic/present/parts/*.svelte` prints `Closing.svelte:33` and `Title.svelte:35`. The deck box is `.present { min-height: 100%; }` (Present.svelte:197-200), an auto-height parent, so a child's `min-height: 100%` does not resolve against it either. That is the mechanism of the observed corner placement, and it is what the frame must replace; the brief's sentence overstates it. Minor.
- `grep -rn "aspect-ratio\|cqw\|cqh\|container-type\|scale(" src/lib/views/academic/present` prints nothing (exit 1). Matches.
- Q85d changes the reader at `Audit.svelte:53-61`: confirmed (Q85d.md:18 lists `Audit.svelte:54-60` and `:61`).
- Findings on the Changes and Agents premises: see section 2 and F2/F3.
- Line count claims: `audit.test.ts` 241 matches; `markup.ts` 85 matches.
- Verify commands: `ls ~/.nvm/versions/node` prints v23.11.0 and v24.21.0; `~/.claude/skills/land/templates/checks.sh` exists and prints `checks: <n> commands passed`; the state file's `verify:` block holds 7 commands. Matches.

Findings: F7, plus the three off-by-one and overstatement corrections above (to fix in the brief's text).

## 4. Cases and checks

- Case 1 ("three `li` rows keyed by signature, no `Card` element"): "keyed by signature" has no form in markup (a Svelte key is not output). It needs the named attribute, F8. "No Card element": `Card` renders `<article class="card" data-card=...`; assert on that, not on the word.
- Cases 2, 3, 4: consistent with spec.md (they render with `svelte/server`). They pass on the unchanged tree in card form, as the brief says.
- Case 5 ("the slide is drawn inside the frame element, which carries the 1280 by 720 design size"): renderable, but the brief names no attribute or inline style by which a test sees the design size. Under server render the bound sizes stay at their initial values: `node -e` compile of `<div bind:clientWidth={w} bind:clientHeight={h}>` with `generate:'server'` (svelte 5.57.1) prints `let w = 0; let h = 0; const s = $.derived(() => Math.min(w / 1280, h / 720));` and the markup `<div><p style="transform:scale(${s()})">`, so the bindings are dropped and `s` is `0` in every unit render. What the SSR draws is therefore decided by how item 2 treats a zero box, see F9.
- Case 6: `0 by 0 gives a scale ... (0, with no division error)` contradicts item 2: "A box of zero size (a hidden tab) draws the slide at no scale change and no error". A scale of 0 is not "no scale change" (that is 1), and `min(0/1280, 0/720)` cannot raise a division error anyway. State: the function answers 0 for a non-positive box and the view draws scale 1 for 0 (or the function answers 1); say which, and what the SSR body shows. F9.
- Case 6 and `tests/checks/tree/audits.test.ts`: header "Every case under tests/views/ is read. A case is coverage when its body reaches a render ... Anything else is an audit and says so in its name". A case that asserts `scale(1920, 720)` draws nothing, so under `tests/views/academic/present.test.ts` it must carry the word "audit" in its name or fail `audits.test.ts`; placed in `tests/state/life/present.test.ts` (exists) it is outside that rule. The brief puts it in the views file. Derived from the test source, not run. F6/F9.
- Case 7: consistent.
- Missing from "Cases" (code step): see section 6.
- The "builder's first task" paragraph: cases 1, 5, 6 fail on the unchanged tree (agreed: no `li`, no frame, no function). Case 6 fails by an import error, which is a form of red the builder must note.

Findings: F8, F9, and F6 (location of the scale cases).

## 5. The question

"Could this pass without the goal being reached?", the goal of Q35 being: the Audit view as a list, and the Present slide filling its pane.

- Item 1 (Audit as a list), cases 1 to 4: could the cases pass with rows that read badly? Partly yes. The cases check text and presence only; they cannot see the reveal, the row height, wrapping or the pointer fill (look items cover those). A row list without `tinted` would fail `tinted.test.ts` (F5), so that is guarded once item 1 says it. The "hover and selection fills the Findings rows use" part is checking nothing because those fills do not exist (F7).
- Item 2 (Present), cases 5, 6, 7: YES, they can all pass while the defect Axel reported stays. Evidence of the defect: `orchestrator-state.md` line 664 "Present (the slide sits in the top-left corner of an empty pane)"; `agents/reviews/U2-audit.md:352-366` "Spacing: the slide uses the left 430 px of the 1454 px pane; the rest is empty." and "Type sizes: slide title 19px ... 11.5px x8". Why the 430 px: the slide parts cap their width in `ch`, `grep -n "max-width" parts/*.svelte` prints `Title.svelte:54 70ch`, `Closing.svelte:52 70ch`, `Project.svelte:127 34ch`, `:141 96ch`, `:244 90ch`, `Framing.svelte:52 74ch`, `Ideas.svelte:48 80ch`. At 13px a `70ch` lede is about 500 px. Inside a 1280 by 720 frame the content is therefore still about 40 percent of the frame's width and hugs its left edge; the brief forbids changing the parts, so the scaled frame fills the pane with a mostly empty slide. Second, the slide's words are the UI's type tokens (`grep -n "^\s*--fs-" themes/tokens.css`: 11, 12, 13, 14, 16, 20, 26 px at `--text-scale` 1). With `s = min(w/1280, h/720)`: `python3` for four panes prints
  - 700 x 500: s=0.547, 12px becomes 6.6px, 13px becomes 7.1px, 11px becomes 6.0px, 26px becomes 14.2px
  - 1000 x 600: s=0.781, 12px becomes 9.4px, 13px becomes 10.2px
  - 1454 x 800: s=1.111, 13px becomes 14.4px
  - 1920 x 1000: s=1.389, 13px becomes 18.1px
  So in any pane narrower than 1280 px, which is every split pane, the words are smaller than the UI's own scale (11px floor) that U3 put every view on; only the full page reads larger than today. Z189 weighed (b) container units and (c) leave as is; it did not weigh this. Z189 was closed by the orchestrator in automode (`choices.md` Z189), not by Axel. The check that would settle it is a look at TEST, which the brief schedules only after the build. Recommendation for the session: put the legibility and content-width question to the closing of this finding before dispatch (the options: keep Z189 and accept the shrink; give the frame a slide type scale and let the parts' widths follow it, which means changing the parts; or fill by stretch, `.present { height: 100% }` and parts centred, with no scaling). F4.
- Item 2, the slide taller than the frame: Present's narrative slides are a PRESENT.md body of any length (`Project.svelte:107-108 <div class="body"><Words text={slide.body} block /></div>`, `.body { max-width: 90ch }` at :243-246) and `[TOC]` links inside them are handled by `views/shared/prose/jump.ts` (it computes `scroller.scrollTop += heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top`, jump.ts:35, and takes the nearest scrolling box no further out than the pane's `data-scroll` body). In a fixed 720 px design frame such a slide is clipped (overflow hidden) or becomes a nested scroller inside a `transform: scale(s)`, where the rectangle difference is in scaled pixels and `scrollTop` is not: the jump lands at the wrong place by a factor s. The brief neither says what overflow does nor has a case. F4b/section 6.
- Layout of the frame: `transform: scale(s)` does not change the layout box; a 1280 by 720 box inside `.present` overflows the pane body, which scrolls (`Pane.svelte:149 overflow: auto; padding: 10px 12px`), so scrollbars appear and change the very `clientWidth` the scale is read from. The brief says only "a 16:9 frame fitted inside the deck box and centred ... transform: scale(s)". It needs: an outer box sized `1280*s` by `720*s` px (centred), an inner 1280 by 720 box with `transform: scale(s); transform-origin: 0 0`, and `overflow: hidden` on the deck box. F4c.
- What the unit suite can and cannot prove about the scale (as asked): it can prove the pure function (`scale(w, h)` for the listed boxes) and the frame's markup (nesting, design size attribute). It cannot prove that the bound sizes are the right box, the fit and centring, the letterbox, scrollbars, text legibility, the slide taller than the frame, the hidden-to-shown change, or the first paint: server render drops the bindings (compile output above), `*.client.test.ts` has no DOM (`agents/spec.md`), and an assertion over source text is an audit by the rule. Those stay with the look at TEST. The brief's look items name the wide, tall and full-page panes and the grid, but not the narrow pane, a long narrative slide, or the text-size control; add them. The brief should also say the frame wiring is not covered by the unit suite, as spec.md asks a green result to say.
- First paint: with `bind:` the first client paint has `w = h = 0`. Mapping 0 to scale 1 draws a 1280 by 720 slide in the pane for a frame (scrollbars flash), mapping it to 0 hides the slide until measured. Neither is stated. F9.
- Check on the step line (parts with no item): F1, F2, F3 (answered in section 2).
- Check of item 3 (tests) and item 4 (docs): item 3's "every other case keeps its meaning" is false for the source-text case (F6); item 4 can pass with no change (F13).

Findings: F4, F4b, F4c, F9, F7.

## 6. Implied inputs

Code step. Inputs the rules of the changed code and its callers imply and "Cases" does not list, each with the expected result the session should set:

Audit
- Two findings with one signature in one section (the signature is a hash of scope, place, kind, message key and arguments, so equal findings collide; the `each` is keyed `(finding.signature)`): expected one stated outcome (one row, no thrown `each_key_duplicate`), noted in the cases' first run on the unchanged tree.
- A finding with an empty `scope` or an empty `where`: expected a row with no empty gap and the control still present.
- A message with HTML characters (`<b>x</b>`) and an unmatched backtick: expected drawn as text, no element; spec.md says a hub value that reaches HTML is untrusted.
- The mute pressed while a write is in flight (`busy`): expected a disabled control, one write (existing behaviour, keep a case).
- A search that matches only a parked finding: expected the muted section's count shown, no `audit.none_match` (existing behaviour, keep a case).
- Row key attribute (F8): the shell's stepping over `[data-card]` must either still find the rows or be stated as dropped.

Present
- A box of 0 by 0: expected a stated result (F9), and a case for the view, not only for the function.
- A tiny box (100 by 50): `s = 0.078`; expected a stated minimum or none.
- A negative or NaN size: expected a stated result of the function.
- A narrative slide taller than 720 design px, with a `#` link: expected what scrolls and where `jump.ts` lands (F4b).
- `--text-scale` other than 1 (the text-size control): tokens are `calc(13px * var(--text-scale, 1))`, so content grows inside a fixed frame: expected overflow behaviour as above.
- The empty deck (`present.empty`) and the grid: the brief says "not scaled" in item 2 but case 7 covers only the grid; add the empty state.
- The hidden tab shown again (a pane keeps a hidden tab's view mounted at no size, `ui/shown.ts` header): expected the slide rescaled on show; look only, say so.

Findings: each item above is missing from "Cases".

## 7. ADRs

- `ls /Users/axelfaes/workspace/research-hub/tools/oculus/docs/adr` and `ls /Users/axelfaes/workspace/research-hub/docs/adr` both print `No such file or directory`; `find` for a directory named `adr` under the hub (excluding node_modules) prints nothing; no `adr:` key in `.agents/plan.yaml` or the state file's block. No record, so no record touches the step and none contradicts the brief. The brief's statement matches.
- The decisions that stand where an ADR would (DESIGN.md) are not named in the brief, though `agents/spec.md` "Read first" 1 says the brief names the DESIGN.md sections the package is measured against, and the brief's "Read" list names none. For this step: DESIGN.md:87 (roots boundary, needed by F1), DESIGN.md:367 (Present), DESIGN.md:378 (Audit), and the layer and ten-items sections. F13.

Findings: none against an ADR; F13 for the missing DESIGN.md sections.

## Findings, in one list (for "Closed")

- F1. Missing item: B6, plan.md:125. Facts: `ls -la ~/.claude/agents/` prints `ordo-high.md -> /Users/axelfaes/.local/share/ordo-stable/agents/ordo-high.md` (and four more, all symlinks); `Customizations.svelte:88-95` `open(item)` calls the client-side `rootHolding(currentWorkspace(workspaces()).roots, item.path)` (fs.ts:731, no realpath) and opens a source tab on a hit, else the read-only `customization` viewer at :95; the server refuses the realpath outside every root (`server/files/open.ts:211-218`, `realpathSync(candidate)` then `inside(real, realpathSync(root.dir))`). Nothing in `server/sessions/stores/customizations.ts` or `data/model/model-agents.ts` resolves symlinks (`grep -n "realpath\|lstat\|symlink"` there prints nothing). The brief must contain the investigation's result and the fix (for example the listing carries the resolved path or a served flag so a row outside every root opens the viewer), its paths (`Customizations.svelte`, the store, the model type, tests in `tests/views/sessions/session-list.test.ts` and the store's test) and cases (a symlink inside a root, a symlink resolving outside, a dangling symlink). If the fix adds a field to `CustomizationItem` that crosses the wire, that is a public shape and a stop for the user; if it stays in the listing's server side and a view flag, the session can close it. The plan.md:124 premise bullet should also stop omitting it.
- F2. Changes paths are cut at the START. `src/lib/state/shared/words/format.ts:126-131` `elide`: `const keep = Math.max(max - 3, nameOf(text).length); return t('sessions.ch_elide', text.slice(text.length - keep));` with `PATH_MAX = 54` (format.ts:15) and `ch_elide: ...{0}` (`config/text/views/sessions/changes.yml:62`), asserted as intended by `tests/state/shared/words/format.test.ts:136-141` ("takes the head off a long path and keeps its tail"). Called from `ChangesTouched.svelte:43` and `shared/changes/ChangeGroups.svelte:125` (the Repositories rows too) and `Repo.svelte:147`. The brief's premise reads only the CSS `.pa { text-overflow: ellipsis }`, which then also cuts the end of an already head-cut path. The defect Axel recorded is exactly this ("Changes truncates paths at their start", state line 664). The brief needs an item: the cut at the end for the paths of Changes, which decides whether `elide` changes for all three callers (ChangeGroups is also the Repositories view's) or only ChangesTouched, and rewrites the `format.test.ts` cases that assert the old behaviour on purpose.
- F3. The Read/Write column floats. `ChangesTouched.svelte:87-95`: `.ct, .to { flex: 0 0 auto; ... }` then `.to, .ct { margin-left: auto; }`; two `margin-left: auto` items in a flex row split the free space between them, so `.to` sits at an x that depends on the path's width in each row. `agents/reviews/U2-audit.md:545` records it on the unchanged tree: "the verb column starts at varying x". Derived from the CSS and the audit; not seen in a browser by this check. The brief's premise ("`.ct` / `.to` (`margin-left: auto`, `--font-num`)") names the cause as the proof. Item needed: a fixed-width column for the verb and the count (`.ct` right-aligned in a column of the widest value, `.to` in its own column), and a look item for a narrow pane.
- F4. Present as specified can pass without the goal; see section 5. The session closes it by deciding, before dispatch: (i) whether the 1280 by 720 frame with the UI's type tokens and unchanged parts is the design (then the brief states plainly that words shrink below the UI scale in panes under 1280 px and that content stays in the frame's left part, and Axel rules); (ii) or the parts change (brief item and paths: `parts/*.svelte`, `Panel.svelte`, the `type-scale.test.ts` rows); (iii) or a fill without scaling. F4b: the overflow of a slide taller than the frame and `jump.ts`. F4c: the frame's layout (outer sized box, inner transformed box, `overflow: hidden` on the deck box). Z189 is the orchestrator's automode choice; a change of what it means to fill is a user-visible choice.
- F5. Item 1 must say the Pane asks `tinted`; `tests/views/whole/tinted.test.ts` fails otherwise (derived from source).
- F6. `tests/checks/tree/allow-audits.txt` (line 11 and the renamed case) belongs in the paths and item 3 must handle the source-text case; the scale cases go to `tests/state/life/present.test.ts` (or carry "audit" in their name if kept under `tests/views`).
- F7. The "hover and selection fills the Findings rows use" sentence is false; name the real tokens (`--chip` at hover, `--accent-bg` selected, `ui/tree/TreeItem.svelte:303-319`) or drop it. Audit has no selection; say so.
- F8. Name the attribute the row carries (`data-card={signature}` keeps the shell's arrow-key stepping at `workbench-keys.svelte.ts:263`; its absence loses keyboard reach over the findings, which the Card gave), whether a cursor is drawn (`Card` took `cursor={false}`), and the test helper that reads it. The reveal's three triggers (hover, focus-within, no hover device) match `Card.svelte:106-131`; the card's `[data-cursor]` trigger is not used by Audit and is rightly dropped. What else the card gave and the row must replace: the heading element (`level={4}`, an `h4`), which the row loses unless it keeps a heading or states the loss; the translucent surface (replaced by `tinted`); the border and shadow. The parked state gave nothing beyond the control: `grep -n "muted" Audit.svelte` shows the card is the same for a parked finding, only the control differs.
- F9. Decide: where the scale function lives (`state/life/present.ts`, F6 and the 10-item folder), what a zero or non-positive box answers and what the view draws for it (case 6 against item 2), and what the first paint shows.
- F10. The wallpaper under Present (state line 664, "under a rice theme the wallpaper shows through the Present pane so the slide text sits on the picture (Q33 and Q35)"): not in the line's text, not on the tree fixed. `Present.svelte:171` `<Pane title={t('present.title')} {bar}>`, no `tinted`; and `tinted.test.ts` forbids `tinted` on a view that renders a surface, and Present does (Overview renders `Card`; `Panel.svelte:148` and `Equation.svelte:57` have wall surfaces). Either an item (the slide's own surface under `body.wall`) or a stated exclusion with the reason.
- F11. Correct the source-tab premise: line numbers are `ui/controls/editor/Editor.svelte:343`, not `views/sources/source/Editor.svelte`.
- F12. Prose and comment names in Audit.svelte and audit.test.ts that the change makes false (section 1).
- F13. DESIGN.md:367 and HELP.md:120 get a sentence about the frame (item 4 as written finds none); add the DESIGN.md sections the step is measured against.
- Brief text corrections (no scope change): Audit line numbers (`:73-85`, `:160-177`, `:106-110`), `Present.svelte:191`, the `min-height: 100%` sentence (two parts, not all).
- plan.md:124 (uncommitted "Premises corrected" bullet) says "Changes' cut paths and columns ... are on the tree": it needs the same correction as F2 and F3, and should list B6.

## Declined to judge

- Whether the 1280 by 720 frame with unchanged parts is acceptable to read at ordinary pane sizes, and which of the three options in F4 to take: a design choice that is the user's call; a look at TEST would settle the content width and the legibility, a read cannot.
- Whether the Read/Write column (F3) and the head-cut paths (F2) look wrong in a real pane: derived from CSS, tests and U2's audit text; not seen in a browser (not allowed).
- Whether a long project slide exceeds 720 design px: needs layout, not measurable here.
- Whether `jscpd` (`tests/checks/tree/duplication.test.ts`, 8 lines and 50 tokens of markup) flags the row markup against `ChangeGroups` or `Findings`: styles are exempt by the test's header; markup clones not run.
- Whether the mute control's reveal reads right in the new row: look only.

Agent usage: claude-sonnet-5-5 served (ordo-high), 283,148 tokens, 102 tool uses, 16.1 min (from the completion notice).

## Closed

Each finding closed in `agents/briefs/Q35.md` before the preparation commit (the orchestrator, automode):

- F1: item 3, the listing gives each item's real path, so the roots boundary decides between a source tab and the viewer; case 11; `customizations.ts` and its test in the paths.
- F2: item 1, `elide` removed and every path cut at its end by CSS in its three callers; `format.test.ts` and `changes.yml:62` in the paths; case 10.
- F3: item 2, the Changes list a grid with subgrid rows, the verb and count in `max-content` columns.
- F4, F4b, F4c: Z193 amends Z189 (items 5 and 6): the deck box fills the pane with `overflow: hidden`, an outer box sized `1280 * s` by `720 * s` and centred, an inner transformed box; the parts laid out for the frame (a slide type scale in px, centred content, reading widths in frame px); a long slide scrolling inside the frame with `jump.ts` correcting for the scale (case 9); look items for narrow panes, a long slide and the text size.
- F5: item 4, the Pane asks `tinted`.
- F6: item 7, the source-text case and `allow-audits.txt:11` removed; `fit`'s cases in `tests/state/life/present.test.ts`.
- F7: item 4 names `--chip` under the pointer and says Audit has no selection.
- F8: item 4, `data-card={signature}` on each row; the `h4` given up for a `span`, stated.
- F9: `fit` in `state/life/present.ts`, 0 for a non-positive or non-finite size, the frame hidden while 0 (case 8).
- F10: item 5, the frame draws its own surface with the wallpaper mix.
- F11: the source tab's line numbers cited at `ui/controls/editor/Editor.svelte:343`.
- F12: item 4 makes the head comment and card comments true; item 7 renames the test's describe.
- F13: item 8 and the DESIGN.md passages named at the top.
- Text corrections: the Audit line numbers, `Present.svelte:191`, the parts' `ch` caps in place of the `min-height` sentence; implied inputs of section 6 are cases 2 to 6 and 8; the Q85d overlap is in the dispatch entry.

