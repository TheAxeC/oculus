# Diagnosis: the float's tab strip will not scroll back to the first tab

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: none, run by a person (Axel present in the session).

## Symptom

`tools/oculus/.scratch/migration/plan.md`, step D66, part (3): "in the right-docked float of `[hpc, usage, workbenches]` at size 0.2, with the last tab showing, the scroll-left control moves the strip a few pixels and then not at all, so the first tab cannot be reached, and a press on a tab half out of sight scrolls the strip without showing that tab; find why and end it, so the controls reach every tab and a press on any tab shows it". Axel's words: "switching tabs is weird in the float (usage, hpc, workbenches)", "Restart your scratch server, and reset pages, then you'll b able to reproduce", "now try going back to the left".

## Where the probes run

The scratch copy `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.TffuiH/tree`, a detached worktree at `e74a5d459` (main's head) with nothing applied, its `tools/oculus/node_modules` a link to the gate worktree's, its `tools/oculus/config/local.yml` holding `port: 8796` alone, served by `npx vite dev` on 127.0.0.1:8796 and shown in the session's own Chrome tab. The paths redirected under `$TMPDIR`: HOME (the session scratchpad's `floatlook/home`, whose layout was reset with Reset all pages so the float is the one `config/layout.yml:124` ships, `{ view: [hpc, usage, workbenches], dock: right, size: 0.2 }`), TMUX_TMPDIR. ORDO_STABLE and ORDO_SKILL_DIRS: not touched by the red.

## Red command

A browser sequence on the page at 127.0.0.1:8796 (way 11 driven by the session's own pointer, since the symptom needs real pointer presses):

```
1. navigate http://127.0.0.1:8796/ ; wait 5 s
2. JS: show the Workbenches tab of the float ([data-float] [role=tab] "Workbenches" .click()); wait 0.6 s; print the list's scrollLeft
3. real pointer press on the float's "Scroll tabs left" control (1229, 18); wait 1 s
4. real pointer press on the same control again; wait 1 s
5. JS: print "A scroll=" + scrollLeft of [data-float] .tabs           (part A red: anything above 0)
6. real pointer press on the visible part of the half-hidden Usage tab (1265, 18), whose label document.elementFromPoint(1265, 18) returns; wait 1 s
7. JS: print "B selected=" + the float's tabs with aria-selected="true" (part B red: not Usage)
```

Runs:

```
run 1: 143 | after the two presses: 143 | B: selected Workbenches, scroll 143
run 2: 143 | A scroll=143 | B selected=Workbenches scroll=143
run 3: 143 | A scroll=143 | B selected=Workbenches scroll=143
```

The list is 216 px wide holding 360 px of tabs (largest offset 144); with Live HPC showing first the strip rests at 0.

## No red command

not applicable

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The real pointer presses of steps 3 and 4, replaced by `button.click()` from JS (three calls, 0.6 s apart) | green: scrollLeft 143, 116, 0, 0 | put back: the symptom needs a real pointer press |
| The press of step 2 as a real press, replaced by `.click()` | red still (runs 1 to 3) | cut |

The shrunk case, as it stands: the float docked at 0.2 with three tabs, the last one showing, and a real pointer press on the scroll-left control or on a half-hidden tab.

## Hypotheses

1. If the real press moves the focus into the float's pane, and the focused strip draws something the unfocused one does not (`strip ... unfocused` is the class at rest), so the tab list's width changes and `resized()` in `ui/tabs/tab-scroll.svelte.ts` brings the showing tab back (`was && !showingWhole(list)` then `reveal(parts.shown())`), then keeping the list's width unchanged by the focus (or not revealing on a resize the reader's own scroll caused) turns the red command green. Falsified by: the list's `clientWidth` identical just before and just after the press.
2. If the pane's focus path (the press on a pane asking for the focus) calls `reveal` of the showing tab directly, not through a resize, then removing that reveal on a press inside the strip turns it green. Falsified by: no `reveal(shown)` call on the press, seen by a tagged log in `reveal`.
3. If the press puts the keyboard focus on the showing tab's element and the browser scrolls the focused element into view by itself, then focusing nothing inside the list on a control press turns it green. Falsified by: `document.activeElement` after the press is not the Workbenches tab and the scroll is undone with no `scrollTo` from oculus.
4. Part B alone: if the tab press brings the pressed tab in whole on `pointerdown`, moving it from under the pointer so `pointerup` lands on another element and no `click` reaches the tab, then revealing on the click instead turns part B green. Falsified by: the element under (1265, 18) at `pointerup` is still the Usage tab. Hypotheses 1 to 3 explain both parts by the strip returning to the showing tab; this one explains part B only.

The reply to the hypotheses: Axel's "Why are you waiting?", taken as the go to probe the list as it stands.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

The red command was moved to dispatched pointer sequences (pointerdown and mousedown on the control or tab, then pointerup and mouseup on `document.elementFromPoint` at the same point, then a click only when that element is in the same tab or button), since the session's real presses were dropped after script calls. Part B presses Usage 8 px inside its right edge, where the red shows. The script runs on the page at 127.0.0.1:8796 after a fresh navigation, prints whether the served `Tabs.svelte` holds the change, then the list's `scrollLeft` after Workbenches is shown and after each of three presses on "Scroll tabs left" (part A), then shows Workbenches again, presses the control once and presses Usage (part B).

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | none: the list's `clientWidth` and a tagged count of `resized()` calls read around the press | width 216 before and after the press, `resized()` not called | falsified |
| 2 (refined: the reveal comes from the `$effect` in `Tabs.svelte` that reveals the showing tab, which re-runs on every layout write because it reads `tabs`, and a press in a pane writes the layout, so every strip gets a new `tabs` array) | the diff below | without: `start 143 / A 116 / A 116 / A 116 / B up on svg scroll 143 selected Workbenches`; with: `start 143 / A 116 / A 0 / A 0 / B up on SPAN scroll 116 selected Usage` | standing |
| 3 | not probed: the probe of rank 2 turns both parts green with focus handling unchanged | | falsified by rank 2's run |
| 4 | not probed: part B's pointerup lands off the tab because the effect of rank 2 scrolls the strip back between pointerdown and pointerup (`B up on svg`), so part B is the same cause | | folded into rank 2 |

The diff of the probe of rank 2:

```diff
--- a/tools/oculus/src/lib/ui/tabs/Tabs.svelte
+++ b/tools/oculus/src/lib/ui/tabs/Tabs.svelte
@@ -1,4 +1,5 @@
 <script lang="ts">
+    import { untrack } from 'svelte';
@@ -166,9 +167,12 @@
+    let revealedFor: string | undefined = undefined;
     $effect(() => {
         const selected = active;
-        const index = tabs.findIndex((tab) => tab.id === selected);
+        if (selected === revealedFor) return;
+        revealedFor = selected;
+        const index = untrack(() => tabs.findIndex((tab) => tab.id === selected));
         queueMicrotask(() => scrolling.reveal(index));
     });
```

The change was undone after the run (`git checkout -- tools/oculus/src/lib/ui/tabs/Tabs.svelte` in the scratch copy, `git status --short` then listing only the untracked `node_modules` link).

## Cause

The `$effect` in `src/lib/ui/tabs/Tabs.svelte` (about line 169 at `e74a5d459`) that brings the showing tab into view reads both `active` and `tabs`. Every layout write hands each strip a new `tabs` array, and a press inside a pane is such a write (the pane asks for the focus). So each press on the scroll-left control, and each pointerdown on a half-hidden tab, re-runs the effect, which reveals the showing tab again: the strip goes back to the showing tab after the control's step (part A stops one step short, at 116 of 143), and on a tab press the strip moves between pointerdown and pointerup, so the pointerup lands on another element and no click reaches the pressed tab (part B). Shown by the probe of rank 2: the red command is red without the change and green with it.

## Fix and test

No test is written. The failure costs nothing under the test rule (`agents/spec.md:58`: a test exists only as the test of an entry of `agents/guarded.md`, for behaviour whose failure costs lost work, a broken installation or a wrong configuration accepted); a strip that scrolls back loses no work. The behaviour also needs a DOM and real layout, which `agents/spec.md:68` leaves to the look. The red command's failure on the tree without the fix is quoted under "Probes" (rank 2, "without").

The fix, made in the scratch copy: the effect reveals the showing tab only when the showing tab's id changes, and reads `tabs` untracked, as the diff under "Probes" shows. A strip's first draw still reveals the showing tab (`revealedFor` starts undefined), and a changed width still goes through `resized()` in `tab-scroll.svelte.ts`, which this fix does not touch.

Runs with the fix:

```
red command:   fixed=true | start 143 | A 116 | A 0 | A 0 | B before scroll 116 usage right 1313 | B up on SPAN scroll 116 selected Usage
red command, the tree without the fix:   fixed=false | start 143 | A 116 | A 116 | A 116 | B before scroll 116 usage right 1313 | B up on svg scroll 143 selected Workbenches
original case, real presses of the session's pointer, Workbenches showing:
  two presses on "Scroll tabs left" (1229, 18): the strip shows Live HPC and Usage whole, the left control disabled
  a press on Usage (1395, 18): Usage shows
  a press on "Scroll tabs right" (1471, 18): the strip moves right and stays, Workbenches half in view
  a press on the half-hidden Workbenches (1400, 18): Workbenches shows
```

## Cleanup

The grep of `DIAG-a7c1` over the scratch copy's `tools/oculus/src` prints nothing. The scratch copy is removed with `git worktree remove --force` from the main checkout and the scratch server on 8796 is stopped, as the session's run of Steps 22 records.
