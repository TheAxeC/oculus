# Diagnosis: the held card cursor is lost on a reload (D33, second sub-bullet, Z461)

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. No output of this run held a secret. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: ad0e3246971001565, claude-opus-5-5, 338,024 tokens, 135 tool uses, 55.9 min.

Read first: the cause has two parts, both in `src/lib/shell/keys/workbench-keys.svelte.ts`, and one fix in that file covers both. Part A is the one the step's text names (`reconcilePane`). Part B was found while checking fix A against R6's pointer rule ("a pointer press keeps the cursor in one pane and clears it on a pane change"). After fix A keeps the cursor across a reload, the first press after the reload breaks that rule in both of its halves. No test is written, because the rules file's test rule allows none here (see "Fix and test"); the red commands are the checks for /spec to carry into the brief. Inbox is the one view that reads `cardCursor` and could not be run: the scratch copy has no mail account. One more finding, outside this part, is under "Outside this part".

## Symptom

From `tools/oculus/.scratch/migration/plan.md:581`, the second sub-bullet of D33's line (`plan.md:579`), rulings Z468 (the user, `plan.md:1230`), Z461 (`plan.md:1223`, `choices.md:1153`) and Z446 (`plan.md:1207`). This is the part that asks for a cause:

"the card cursor survives a reload: a held cursor (`cardCursor`, `state/workbench/layout/instance.ts:64`) is kept in the instance state the layout restores, but the shell's `reconcilePane` (`workbench-keys.svelte.ts:358-367`) may clear it before a view's channel sends its first rows; the cause is found with /diagnose, and the fix keeps the cursor on its row after a reload in every view that reads it"

Current line numbers at fb7f076f (`grep -n` and `sed -n` over the scratch copy): `cardCursor` is still at `src/lib/state/workbench/layout/instance.ts:64`. In `src/lib/shell/keys/workbench-keys.svelte.ts`: `reconcilePane` is :392-402 (doc comment :392), `writeCursor` :370, `moveCard` :351, `observePane` :405, `syncCards` :426-434, `stopCards` :436, `rememberPane` :442-450. The Workbench effect that calls `syncCards` and returns `stopCards` as its cleanup is `src/lib/shell/Workbench.svelte:231-235`. Main moved to f2567dcd during the run. `git diff --stat fb7f076f HEAD -- tools/oculus/src tools/oculus/tests` printed nothing, so these line numbers hold at main's head.

## Where the probes run

The scratch copy is `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.s3oGQR/tree`, made from the main checkout with `tmp=$(mktemp -d "${TMPDIR:-/tmp}/diagnose.XXXXXX"); git worktree add --detach "$tmp/tree" HEAD` at fb7f076f ("Stop D45 at /spec on open item Z671"). Nothing was applied to it (premise). `npm install` ran in its `tools/oculus` (477 packages).

The scratch copy's own `tools/oculus/config/local.yml` was written as the single line `port: 8796`. The main checkout's `local.yml` was never opened, printed, grepped or hashed. The dev server was started from the copy with `HOME=$tmp/home nohup npx vite dev`, ran on 127.0.0.1:8796 only, and was stopped at the end. Its PIDs were 86022 (vite) and 85940 (npm exec), and its cwd was confirmed as the scratch copy before `kill`. Headless Chrome (`/Applications/Google Chrome.app`, `--headless=new`) ran with a fresh `--user-data-dir` under `$tmp` on every run, so the layout in `localStorage` (`oculus.layout.v1`) starts empty each time. No process on 8787 or 8790 was touched.

The scratch hub copy got four synthetic LinkedIn files (`theaxec.github.io/_linkedin/01-post.md`, `02-post.md`, `03-post.md`, `xx-idea.md`), because that folder is not in the hub. The Literature search case sends one query to the public scholarly sources from the scratch server.

Paths redirected under `$TMPDIR`: HOME (`$tmp/home`). ORDO_STABLE and ORDO_SKILL_DIRS were not needed, since nothing touches the skills or the pinned checkout.

## Red command

```
node red.mjs "$tmp" <cdp port> Focus 1        # from the folder holding red.mjs and cdp.mjs, dev server of the scratch copy on 8796
```

What it does: it opens the page in a fresh headless Chrome profile on the Focus page (a single pane), presses `o` once so the cursor lands on a card, and reads the held cursor both as drawn (`[data-cursor]`, with its pane's instance id) and as saved (the tab whose `state.cursor` is set in `oculus.layout.v1`). Then it reloads the page and waits up to 5 s after the first rows for the mark. Each part of the symptom is asserted and printed on its own: part 1, the cursor kept in the saved instance state; part 2, the held row marked `data-cursor` in its own pane. Arguments `[page] [presses] [tab]` and the variables `OPEN_PROJECT`, `QUERY`, `GRID`, `KEY_K` and `NORELOAD` reach the other views and the cut. The sources are at the end of this record.

The first runs on main's head (fb7f076f), before the tightening (the first version of the script, which matched the saved cursor by regex):

```
$ for i in 1 2 3; do node red.mjs $R 935$i; echo "exit $?"; done
page Focus: cursor held on sandpile-operator; before reload {"drawn":["sandpile-operator"],"saved":"sandpile-operator","rows":55}
after reload {"drawn":[],"saved":null,"rows":55}
part 1, the held cursor kept in the saved instance state after the reload: FAIL (saved null, held sandpile-operator)
part 2, the held row marked data-cursor after the reload: FAIL (drawn [])
RED
exit 1
(run 2: same five lines, RED, exit 1)
(run 3: same five lines, RED, exit 1)
```

Runs after the tightening, on main's head (fb7f076f), with the final script. Each run makes its own profile, so all three start from the same state. Each takes about 12 s (`time node red.mjs $R 9354 Focus 1` printed `11.968 total`).

```
$ for i in 1 2 3; do node red.mjs $R 980$i Focus 1 | grep -E '^part|^RED|^GREEN|^ERROR'; done
part 1, the held cursor kept in the saved instance state after the reload: FAIL (saved [], held eeg-saad-challenge@4861cb8a-61cc-43b3-80c1-efa46d533dad)
part 2, the held row marked data-cursor in its pane after the reload: FAIL (drawn [])
RED
part 1, the held cursor kept in the saved instance state after the reload: FAIL (saved [], held eeg-saad-challenge@525cdd69-7e63-4b43-8d88-798c5b7a00d8)
part 2, the held row marked data-cursor in its pane after the reload: FAIL (drawn [])
RED
part 1, the held cursor kept in the saved instance state after the reload: FAIL (saved [], held eeg-saad-challenge@0c26ad31-c878-46bb-b867-70af21d8e113)
part 2, the held row marked data-cursor in its pane after the reload: FAIL (drawn [])
RED
```

The red commands for part B, built once fix A was in the copy (main plus fix A). Without fix A they cannot show part B, because the cursor is already gone at the reload.

`red2.mjs` checks a press into the pane that holds the cursor, after a reload, against the R6 rule's first half. Three runs on main plus fix A:

```
held: ["focus:eeg-saad-challenge"] ["eeg-saad-challenge"]
a second press into the pane, no reload: saved ["focus:eeg-saad-challenge"]: PASS
after the reload: saved ["focus:eeg-saad-challenge"], drawn ["eeg-saad-challenge"]
the first press into the pane after the reload: saved [], drawn []: FAIL
RED
exit 1
(runs 2 and 3: the same five lines, RED, exit 1)
```

`panechange.mjs` checks a press into another pane, after a reload, against the R6 rule's second half. On main plus fix A:

```
held: ["radar:Personalized Federated Learning for Tensor Regression#469"]
no reload, a press into the Calendar pane: saved []: PASS
held again: ["radar:Personalized Federated Learning for Tensor Regression#469"]
after the reload: saved ["radar:Personalized Federated Learning for Tensor Regression#469"], mark drawn
after the reload, a press into the Calendar pane: saved ["radar:Personalized Federated Learning for Tensor Regression#469"]: FAIL
RED
```

The same two scripts on main's head:

```
$ node red2.mjs $R 9804
held: ["focus:eeg-saad-challenge"] ["eeg-saad-challenge"]
a second press into the pane, no reload: saved ["focus:eeg-saad-challenge"]: PASS
after the reload: saved [], drawn [] (the mark did not come back: the reconcile cause, not this one)
the first press into the pane after the reload: saved [], drawn []: FAIL
RED
$ node panechange.mjs $R 9805
held: ["radar:Personalized Federated Learning for Tensor Regression#469"]
no reload, a press into the Calendar pane: saved []: PASS
held again: ["radar:Personalized Federated Learning for Tensor Regression#469"]
after the reload: saved [], mark not drawn
after the reload, a press into the Calendar pane: saved []: PASS
GREEN
```

On main's head, `panechange.mjs` is green only because the reconcile has already dropped the cursor at the reload, so there is nothing left to clear.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| Presses of `o` from 2 to 1 (`node red.mjs $R 9354 Focus 1`) | red: `part 1 ... FAIL (saved null, held eeg-saad-challenge)`, `part 2 ... FAIL (drawn [])` | cut |
| The view, Focus replaced by the Projects board (`node red.mjs $R 9355 Projects 2`) | red: `part 1 ... FAIL (saved null, held loewner)`; the view is not what decides the red, so Focus (a single pane, the landing page) is kept as the smallest page | no part removed; Focus kept |
| The reload, replaced by a 3 s wait (`NORELOAD=1 node red.mjs $R 9356 Focus 1`) | green: `part 1 ... PASS (saved eeg-saad-challenge ...)`, `part 2 ... PASS` | put back |

The shrunk case: the Focus page in an empty profile, one press of `o`, and a reload.

## Hypotheses

The first list, formed after the shrink:

1. If `reconcilePane`, run by `syncCards` then `observePane` at the page's first render after the reload, sees no drawn row because the view's channel has not sent its rows, and clears the held cursor, then not clearing while the pane draws no row turns the red command green. Falsified by: still red with that change.
2. If the saved-layout reader drops `cursor` from an instance's state when it restores the layout, then keeping the key in the reader turns it green. Falsified by: the restored instance holding the cursor when the shell first reconciles.
3. If the restored page is replaced by a freshly made arrangement (`startOnRailPage`, `Workbench.svelte:222-229`) with new instance ids, so the cursor sits on an instance no pane shows, then keeping the restored page turns it green. Falsified by: the clear writing to the instance id that held the cursor before the reload.
4. If a focus or pointer event at start (`rememberPane`) clears the cursor, then not clearing there turns it green. Falsified by: no write from `rememberPane` among the cursor writes after the reload.

The reply to the hypotheses: none, no person present.

The second list (every hypothesis of the first list falsified as the cause of the red: probes 1 to 3). Its base is main plus probe 2's change, since on main the first clear hides any later one:

5. If, once the empty-list clear is skipped, the observer reconciles on a partial first render (some rows drawn, the held one not yet) and clears, then clearing only a cursor whose row has been drawn in this observation turns the red command green. Falsified by: still red with that change.
6. If a path outside `writeCursor` (the view, or the layout store restating the instance) drops the cursor, then logging every `writeCursor` call shows no clear while the cursor still goes. Falsified by: the clear showing in the `writeCursor` log.

The third list is for part B (`red2.mjs` and `panechange.mjs`), formed on main plus fix A once both were red there:

7. If `rememberPane`, with no pane remembered after the reload (`lastFocusedPane` is null), clears the cursor of the pane being pressed (`writeCursor(lastFocusedPane ?? pane, null)`), then clearing only the pane the press leaves turns `red2.mjs` green. Falsified by: `red2.mjs` still red with that change.
8. If the press activates the tab and the activation restates the instance without its cursor, then the clear comes from the layout store. Falsified by: the clear's caller being `rememberPane`.
9. If a tab drag started by the press re-creates the instance, then the clear lands on a new instance id. Falsified by: the clear writing to the same instance id.

The fourth list, formed from probe 8:

10. If after a reload no pane is remembered as the one the keyboard is in, although the restored cursor marks that pane, and the shell has only the observation to know it, which the Workbench effect's re-run drops (`return keyboard.stopCards` at `Workbench.svelte:234`) when a press activates another pane, then remembering the pane that holds the cursor in `syncCards` while no pane is remembered turns `red2.mjs` and `panechange.mjs` green. Falsified by: either staying red.

## Probes

The tag of every logging line is `DIAG-7c3e`. Each probe was undone with `git checkout --` of the file (plus `git apply` of the base diff when the base was main plus a fix), and `git diff --binary | cmp - <base diff>` confirmed the base each time.

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 (logging, base main) | `reconcilePane`: `+ if (reconciled !== state) console.log('DIAG-7c3e reconcilePane clears', id, cardCursor(state), cards(pane).length, pane.querySelectorAll('[data-card]').length);` | `console: DIAG-7c3e reconcilePane clears 046adb6d-0933-4ac9-9841-faa1a47aaade eeg-saad-challenge 0 0`, RED | 1 still standing (the clear comes at zero rows drawn); 2 falsified (the restored instance holds `eeg-saad-challenge` at the first reconcile) |
| 1 (the change, base main) | `reconcilePane`: `+ const visible = cards(pane); + if (visible.length === 0) return;` and `reconcileCardCursor(state, visible.map(...))` | `part 1 ... FAIL (saved null, held eeg-saad-challenge)`, `part 2 ... FAIL (drawn [])`, RED | 1 falsified as the cause of the red |
| 3 and 4 (logging, base main) | `writeCursor`: `+ console.log('DIAG-7c3e writeCursor', id, cardCursor(state), '->', cursor, cards(pane).length, new Error().stack...)` before `restateInstance` | `writeCursor c2589f5c-... -> eeg-saad-challenge 55 at writeCursor < at selectCard < at moveCursor < at perform` then `writeCursor c2589f5c-... eeg-saad-challenge -> (null) 0 at writeCursor < at reconcilePane < at observePane < at Object.syncCards`, RED | 3 falsified (the same instance id before the reload and at the clear); 4 falsified (no write from `rememberPane`) |
| 5 and 6 (logging, base main plus probe 2's change) | the same `writeCursor` log line | `writeCursor 89892649-... -> eeg-saad-challenge 55 ... < at selectCard ...` then `writeCursor 89892649-... eeg-saad-challenge -> (null) 33 at writeCursor < at reconcilePane < at MutationObserver.<anonymous>`, RED | 6 falsified (the clear goes through `writeCursor`); 5 still standing (the observer clears on a render with 33 of the 55 rows) |
| 5 (the change, base main) | `+ let drawnCursor: string \| null = null;` and in `reconcilePane`: `+ const visible = cards(pane).map((card) => card.id); + const cursor = cardCursor(state); + if (cursor !== null && visible.includes(cursor)) drawnCursor = cursor; + if (cursor !== drawnCursor) return; + const reconciled = reconcileCardCursor(state, visible);` and in `stopCards`: `+ drawnCursor = null;` | `part 1 ... PASS (saved eeg-saad-challenge, held eeg-saad-challenge)`, `part 2 ... PASS (drawn ["eeg-saad-challenge"])`, GREEN; undone: `part 1 ... FAIL (saved null ...)`, `part 2 ... FAIL (drawn [])`, RED | still standing: cause A |
| 7, 8 and 9 (logging, base main plus fix A, over `red2.mjs`) | the `writeCursor` log line with three stack frames | `writeCursor 6f7df7fc-... -> eeg-saad-challenge at writeCursor < at selectCard < at moveCursor` then `writeCursor 6f7df7fc-... eeg-saad-challenge -> (null) at writeCursor < at rememberPane < at panePressed`, RED | 8 and 9 falsified (the caller is `rememberPane`, on the same instance id); 7 still standing |
| 7 (the change, base main plus fix A) | `rememberPane`: `- writeCursor(lastFocusedPane ?? pane, null);` `+ const left = lastFocusedPane ?? observedPane; + if (left !== pane) writeCursor(left, null);` | `red2.mjs`: `the first press into the pane after the reload: saved ["focus:eeg-saad-challenge"] ...: PASS`, GREEN. `panechange.mjs` with the same change: `after the reload, a press into the Calendar pane: saved ["radar:Personalized ...#469"]: FAIL`, RED | still standing for `red2.mjs`; does not explain `panechange.mjs` |
| 7 (logging, base main plus fix A plus probe 7's change, over `panechange.mjs`, two runs) | `rememberPane`: `+ console.log('DIAG-7c3e rememberPane', pane?.dataset.paneActive, 'last', ..., 'observed', ..., observedPane?.isConnected)`; end of `syncCards`: `+ console.log('DIAG-7c3e syncCards ends', pane?.dataset.paneActive, cursorIn(pane), 'observed', ..., 'activeMain', options.activeMain()?.id, 'active element', document.activeElement?.tagName)` | After the reload: `syncCards ends d5650e7d... Personalized ...#469 observed d5650e7d... activeMain d5650e7d...`, then `harness: the press into Calendar starts`, then `syncCards ends e7c22933... observed (none) activeMain e7c22933...`, then `rememberPane e7c22933... last (none) observed (none)`, RED | the Lit Watch pane is observed until the press; the press makes Calendar the active main, and the Workbench effect re-runs (cleanup `stopCards`, then `syncCards` on Calendar) before the Workbench's `pointerdown` reaches `rememberPane`, which then finds no pane to clear. This leads to hypothesis 10 |
| 10 (the change, base main plus fix A, without probe 7's change) | `syncCards`: `+ if (!lastFocusedPane?.isConnected) { const holding = [...document.querySelectorAll<HTMLElement>('[data-pane]')].find((one) => cursorIn(one) !== null); if (holding !== undefined) lastFocusedPane = holding; }` | `panechange.mjs`: `after the reload, a press into the Calendar pane: saved []: PASS`, GREEN. `red2.mjs`: `the first press into the pane after the reload: saved ["focus:eeg-saad-challenge"] ...: PASS`, GREEN. `red3.mjs`: `after the reload, o gives ["radar:A reproducible ..."]: PASS`, GREEN. Undone (main plus fix A): `panechange.mjs` `... saved ["radar:Personalized ...#469"]: FAIL`, RED | still standing: cause B. Probe 7's change is not needed and is not in the fix |

## Cause

**Cause A (the step's text).** `reconcilePane` judges that a held cursor's row is gone from a snapshot of the rows the pane draws. After a reload, `syncCards` observes the pane holding the restored cursor at the page's first render, when no row is drawn yet: probe 1 shows the clear at 0 rows. Then the `MutationObserver` reconciles on each partial render as the view's channels send their rows: probe 4 shows a clear at 33 of 55. The shell cannot tell a row not yet drawn from a row removed, so it writes the cursor away, and the layout saves that.

Probe 5 shows it: the red command is green when the reconcile clears only a cursor whose row this observation has drawn, and red without that change (the runs on main's head above).

**Cause B (the same reload, the R6 pointer rule).** After a reload no pane is remembered as the one the keyboard is in (`lastFocusedPane` starts null), although the restored cursor marks that pane. A press into the pane that holds the cursor then falls to `rememberPane`'s `writeCursor(lastFocusedPane ?? pane, null)` and clears that pane's own cursor (probe 6). A press into another pane finds no pane to clear, because the Workbench effect's re-run drops the observation before the press reaches `rememberPane` (probe 8).

Probe 10 shows it: remembering the pane that holds the cursor while no pane is remembered turns `red2.mjs` and `panechange.mjs` green, and `panechange.mjs` is red without the change. `red2.mjs` is red without it (three runs on main plus fix A, above).

## Fix and test

Test, run on the tree without the fix: no test is written, so none was run. The red commands' failures on the tree without the fix are quoted under "Red command".

No test is written, for two reasons from the rules file's test rule:

- `tools/oculus/.scratch/migration/agents/spec.md:57` lets a test exist only as the test of one entry of `agents/guarded.md`, and a step that needs a new entry stops and asks Axel. No entry of `agents/guarded.md` covers the card cursor or `src/lib/shell/keys/workbench-keys.svelte.ts`: `grep -n -i 'cursor\|instance\|workbench-keys\|layout' agents/guarded.md` printed only G28's draft lines, G29 and G31's saved layout, G51 and G52's terminal cursor, and G54's arrangements.
- The behaviour needs a DOM (`MutationObserver`, `offsetParent`, focus and pointer events), which `spec.md:65` leaves to the look. Losing a keyboard position is not lost work, a broken installation or a wrong configuration accepted.

Whether a guarded entry is wanted for the card cursor is Axel's call, and /spec raises it if it should be. Until then, the red commands below are the look's checks.

Fix (`git -C $tmp/tree diff`, the whole fix, one file):

```diff
--- a/tools/oculus/src/lib/shell/keys/workbench-keys.svelte.ts
+++ b/tools/oculus/src/lib/shell/keys/workbench-keys.svelte.ts
@@ -84,6 +84,8 @@ export function createWorkbenchKeys(options: Options): WorkbenchKeys {
     let lastPagePane: HTMLElement | null = null;
     let observedPane: HTMLElement | null = null;
     let cardObserver: MutationObserver | null = null;
+    /** The held cursor whose row the observed pane has drawn since its observation began. */
+    let drawnCursor: string | null = null;
 
@@ -352,6 +354,9 @@ export function createWorkbenchKeys(options: Options): WorkbenchKeys {
         const id = instanceIn(pane);
         const cursor = cursorIn(pane);
         if (id === null || cursor === null) return false;
+        // A held cursor whose row is not drawn names no card under the cursor: the view may hide
+        // that card behind a filter, and carrying it would reorder an entry the reader cannot see.
+        if (!cards(pane).some((card) => card.id === cursor)) return false;
         options.ui.requestCardMove(id, cursor, direction === 'left' ? -1 : 1);
         return true;
     }
@@ -389,15 +394,21 @@ export function createWorkbenchKeys(options: Options): WorkbenchKeys {
         writeCursor(focusedPaneElement(), null);
     }
 
-    /** Clear a stored cursor when a rendered card-list snapshot no longer contains its id. */
+    /**
+     * Clear a held cursor whose row the observed pane has drawn and a later render leaves out.
+     * A view draws its rows as its channels send them, so a pane shown from a restored layout first
+     * renders no row or only some of them; until the held row has been drawn once in this
+     * observation, its absence says only that it has not arrived, and the cursor is kept.
+     */
     function reconcilePane(pane: HTMLElement): void {
         const id = instanceIn(pane);
         if (id === null) return;
         const state = options.layout.instanceLayoutState(id);
-        const reconciled = reconcileCardCursor(
-            state,
-            cards(pane).map((card) => card.id)
-        );
+        const visible = cards(pane).map((card) => card.id);
+        const cursor = cardCursor(state);
+        if (cursor !== null && visible.includes(cursor)) drawnCursor = cursor;
+        if (cursor !== drawnCursor) return;
+        const reconciled = reconcileCardCursor(state, visible);
         if (reconciled !== state) writeCursor(pane, null);
     }
 
@@ -423,12 +434,23 @@ export function createWorkbenchKeys(options: Options): WorkbenchKeys {
         });
     }
 
-    /** Match observation to restored layout state and stop watching panes removed by a render. */
+    /**
+     * Match observation to restored layout state and stop watching panes removed by a render. A
+     * held cursor marks the pane the keyboard is in, so while no pane is remembered (none pressed or
+     * focused, or the remembered one gone from the page), the pane that holds the cursor is: the
+     * keys move that cursor, and a press into another pane clears it.
+     */
     function syncCards(): void {
         if (observedPane !== null) {
             if (!observedPane.isConnected || cursorIn(observedPane) === null) stopCards();
             else return;
         }
+        if (!lastFocusedPane?.isConnected) {
+            const holding = [...document.querySelectorAll<HTMLElement>('[data-pane]')].find(
+                (one) => cursorIn(one) !== null
+            );
+            if (holding !== undefined) lastFocusedPane = holding;
+        }
         const pane = focusedPaneElement();
         if (pane !== null && cursorIn(pane) !== null) observePane(pane);
     }
@@ -437,6 +459,7 @@ export function createWorkbenchKeys(options: Options): WorkbenchKeys {
         cardObserver?.disconnect();
         cardObserver = null;
         observedPane = null;
+        drawnCursor = null;
     }
```

What each hunk does:

- The `reconcilePane`, `drawnCursor` and `stopCards` hunks are cause A's fix.
- The `syncCards` hunk is cause B's fix.
- The `moveCard` line is needed because of fix A, which leaves one new case: a restored cursor whose row never draws, for example a card removed from the data between sessions, or hidden by the view's own filter state. That cursor stays held without a mark until Escape (`clear-cursor`, `keys.ts:228`), a press into another pane, or a cursor key. A cursor key moves it to the first card, since `horizontalCursor` and `rowCursor` start at 0 from a missing current (`keys.ts:74-83`). Enter acts on nothing, because `activateCursor` needs the row (`key-dom.ts:54-61`). Without the `moveCard` line, J or K would ask Collection to carry that entry, and `carry` writes the whole file order including hidden entries (`Collection.svelte:208-211`). The line makes J and K act only on a drawn row.
- `rememberPane` is unchanged.

`instance.ts`'s `reconcileCardCursor` comment ("clearing it only when its id is no longer present") is still true. Comments and test titles in the diff, grepped for the rules file's history words (`git diff -U0 | grep '^+' | grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously)\b"`), printed nothing (exit 1).

For `premise`, the test's source as written: none is written (the reasons above). The red commands' sources follow, for /spec to carry into the brief as the look's checks.

`cdp.mjs` (the driver every script imports):

```js
// A small Chrome DevTools Protocol driver: one headless Chrome with its own profile folder.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch(base, port) {
    const profile = mkdtempSync(join(base, 'chrome-'));
    const proc = spawn(
        CHROME,
        [
            '--headless=new',
            `--remote-debugging-port=${port}`,
            `--user-data-dir=${profile}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--window-size=1600,1000',
            'about:blank'
        ],
        { stdio: 'ignore' }
    );
    let targets = null;
    for (let i = 0; i < 100 && !targets; i++) {
        try {
            const r = await fetch(`http://127.0.0.1:${port}/json/list`);
            const list = await r.json();
            targets = list.filter((t) => t.type === 'page');
            if (targets.length === 0) targets = null;
        } catch {
            await sleep(100);
        }
    }
    if (!targets) throw new Error('chrome did not start');
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
    await new Promise((res, rej) => {
        ws.onopen = res;
        ws.onerror = rej;
    });
    let id = 0;
    const pending = new Map();
    const listeners = [];
    ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.id && pending.has(msg.id)) {
            const { res, rej } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) rej(new Error(JSON.stringify(msg.error)));
            else res(msg.result);
        } else if (msg.method) {
            for (const l of listeners) l(msg);
        }
    };
    const send = (method, params = {}) =>
        new Promise((res, rej) => {
            const n = ++id;
            pending.set(n, { res, rej });
            ws.send(JSON.stringify({ id: n, method, params }));
        });
    const console_ = [];
    listeners.push((m) => {
        if (m.method === 'Runtime.consoleAPICalled') {
            console_.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
        }
    });
    await send('Page.enable');
    await send('Runtime.enable');
    const evaluate = async (expression) => {
        const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
        return r.result.value;
    };
    const waitFor = async (expression, ms = 30000) => {
        const end = Date.now() + ms;
        while (Date.now() < end) {
            try {
                const v = await evaluate(expression);
                if (v) return v;
            } catch {
                /* page navigating */
            }
            await sleep(100);
        }
        return null;
    };
    const loaded = () =>
        new Promise((res) => {
            const l = (m) => {
                if (m.method === 'Page.loadEventFired') {
                    listeners.splice(listeners.indexOf(l), 1);
                    res();
                }
            };
            listeners.push(l);
        });
    const navigate = async (url) => {
        const p = loaded();
        await send('Page.navigate', { url });
        await p;
    };
    const reload = async () => {
        const p = loaded();
        await send('Page.reload', { ignoreCache: false });
        await p;
    };
    const key = async (keyName, code, keyCode, modifiers = 0) => {
        await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: keyName, code, windowsVirtualKeyCode: keyCode, modifiers });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: keyCode, modifiers });
    };
    const close = () => {
        try {
            ws.close();
        } catch {
            /* closed */
        }
        proc.kill('SIGKILL');
    };
    return { send, evaluate, waitFor, navigate, reload, key, close, console: console_, sleep };
}
```

`red.mjs` (the red command):

```js
// Red command for D33's second sub-bullet: a held card cursor is kept on its row after a reload.
// Usage: node red.mjs <scratch base> <cdp port> [rail page label] [presses of o] [tab label]
// OPEN_PROJECT=1 opens the first Focus card's project as its own tab and holds the cursor there.
// NORELOAD=1 waits 3 s in place of the reload (a cut of the shrink).
import { launch } from './cdp.mjs';
const [base, port, page = 'Focus', presses = '2'] = process.argv.slice(2);
let tab = process.argv[6] ?? '';
const c = await launch(base, Number(port));
// Each drawn cursor as card@instance, and each saved tab that holds a cursor as card@instance.
const state = () =>
    c.evaluate(`JSON.stringify((() => {
  const drawn = [...document.querySelectorAll('[data-cursor]')].map((e) => e.getAttribute('data-card') + '@' + (e.closest('[data-pane]')?.dataset.paneActive ?? '?'));
  const saved = [];
  const views = [];
  const walk = (n) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { if (typeof n.view === 'string' && n.state && typeof n.state.cursor === 'string') saved.push(n.state.cursor + '@' + n.id), views.push(n.id + ' is ' + n.view); Object.values(n).forEach(walk); } };
  try { walk(JSON.parse(localStorage.getItem('oculus.layout.v1') || 'null')); } catch {}
  return { drawn, saved, views, rows: document.querySelectorAll('[data-card]').length };
})())`).then(JSON.parse);
let failed = 0;
try {
    await c.navigate('http://127.0.0.1:8796/');
    if (page !== 'Focus') {
        await c.waitFor(`!!document.querySelector('nav button[aria-label="${page}"]')`);
        await c.evaluate(`document.querySelector('nav button[aria-label="${page}"]').click()`);
    }
    if (process.env.OPEN_PROJECT) {
        await c.waitFor(`document.querySelectorAll('[data-card] .name button').length > 0`);
        const label = await c.evaluate(`(() => { const b = document.querySelector('[data-card] .name button'); b.click(); return b.textContent.trim(); })()`);
        await c.waitFor(`[...document.querySelectorAll('[data-pane] [role=tab]')].some((e) => e.textContent.trim().startsWith(${JSON.stringify(label)}))`);
        console.log('opened project tab', label);
        tab = label;
    }
    if (tab !== '') {
        // The tab is activated, then pressed for real, so the shell takes its pane as the one the
        // keys address.
        const at = await c.waitFor(`(() => { const b = [...document.querySelectorAll('[data-pane] [role=tab]')].find((e) => e.textContent.trim().startsWith(${JSON.stringify(tab)})); if (!b) return null; b.click(); b.scrollIntoView({ block: 'nearest', inline: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
        if (!at) throw new Error('no tab ' + tab);
        await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 });
        await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 });
    }
    if (process.env.QUERY) {
        // Literature search: a query typed into its search box, then Enter.
        const box = `document.querySelector('[data-pane] input[placeholder^="Search the literature"]')`;
        await c.waitFor(`!!${box}`);
        await c.evaluate(`${box}.focus()`);
        await c.send('Input.insertText', { text: process.env.QUERY });
        await c.key('Enter', 'Enter', 13);
        await c.waitFor(`document.querySelectorAll('[data-pane-active] [data-card]').length > 0`, 30000);
        // Leave the text box so the cursor keys reach the shell.
        await c.evaluate(`document.activeElement.blur()`);
    }
    if (process.env.GRID) {
        // Present: the Overview button opens the overview grid, whose tiles are the deck's cards.
        const overview = `[...document.querySelectorAll('[data-pane] button')].find((b) => (b.getAttribute('aria-label') || b.textContent.trim()) === 'Overview')`;
        await c.waitFor(`!!${overview}`);
        await c.evaluate(`${overview}.click()`);
    }
    if (!(await c.waitFor(`document.querySelectorAll('[data-pane-active] [data-card]').length > 0`, 15000)))
        throw new Error('no rows drawn');
    for (let i = 0; i < Number(presses); i++) {
        if (process.env.KEY_K) await c.key('k', 'KeyK', 75);
        else await c.key('o', 'KeyO', 79);
        await c.sleep(150);
    }
    await c.waitFor(`!!document.querySelector('[data-cursor]')`, 5000);
    const before = await state();
    const held = before.drawn[0] ?? null;
    console.log(`page ${page}${tab ? ' tab ' + tab : ''}: cursor held on ${held}; before reload ${JSON.stringify(before)}`);
    if (held === null || !before.saved.includes(held)) throw new Error('setup: no held cursor saved');
    const [card, instance] = held.split('@');
    if (process.env.NORELOAD) await c.sleep(3000);
    else await c.reload();
    await c.waitFor(`document.querySelectorAll('[data-card]').length > 0`);
    // Wait for the mark on the held row in its pane, up to 5 s after the first rows are drawn.
    await c.waitFor(`[...document.querySelectorAll('[data-pane-active=${JSON.stringify(instance)}] [data-cursor]')].some((e) => e.getAttribute('data-card') === ${JSON.stringify(card)})`, 5000);
    const after = await state();
    console.log(`after reload ${JSON.stringify(after)}`);
    const part1 = after.saved.includes(held);
    const part2 = after.drawn.includes(held);
    console.log(`part 1, the held cursor kept in the saved instance state after the reload: ${part1 ? 'PASS' : 'FAIL'} (saved ${JSON.stringify(after.saved)}, held ${held})`);
    console.log(`part 2, the held row marked data-cursor in its pane after the reload: ${part2 ? 'PASS' : 'FAIL'} (drawn ${JSON.stringify(after.drawn)})`);
    failed = part1 && part2 ? 0 : 1;
} catch (e) {
    console.log('ERROR', e.message);
    failed = 2;
} finally {
    for (const l of c.console.filter((l) => l.includes('DIAG-'))) console.log('console:', l);
    c.close();
}
console.log(failed ? 'RED' : 'GREEN');
process.exit(failed);
```

`views.sh` (the red command once per view that reads `cardCursor`):

```sh
#!/bin/sh
# Runs the red command once per view that reads the card cursor, from the scratch base $1.
# Each line: view | rail page | tab | environment for red.mjs.
R=$1; n=0
while IFS='|' read -r view page tab envs; do
  n=$((n+1))
  printf '%s: ' "$view"
  env $envs node red.mjs "$R" $((9500+n)) "$page" 1 "$tab" | grep -E '^page|^part|^ERROR|^GREEN|^RED' | sed -e 's/^page.*"views":\["[^ ]* is \([a-z-]*\)".*/[held in an instance of view \1]/' -e 's/ (saved.*//' -e 's/ (drawn.*//' -e 's/, the held cursor kept in the saved instance state after the reload//' -e 's/, the held row marked data-cursor in its pane after the reload//' | tr '\n' ' '
  echo
done <<'LIST'
focus|Focus|| X=1
projects|Projects|Projects| X=1
projects (coauthor)|Projects|Coauthor| X=1
projects (archive)|Projects|Archive| X=1
personal|Projects|Personal| X=1
usage|Projects|Usage| X=1
project|Focus|| OPEN_PROJECT=1
radar (Lit Watch)|Incoming|Lit Watch| X=1
leads|Incoming|Position Leads| X=1
linkedin|Incoming|LinkedIn| X=1
literature|Incoming|Literature search| QUERY=block_term_tensor_decomposition
collection (Funding)|Academic Life|Funding| X=1
collection (Talks & Events)|Academic Life|Talks & Events| X=1
collection (Joint work)|Academic Life|Joint work| X=1
pillars|Pillars|Pillars| X=1
domains|Pillars|Domains| X=1
venues|References|Venues| X=1
data|References|Data| X=1
present (overview grid)|Present|Structured| KEY_K=1 GRID=1
gallery|System|Gallery| X=1
inbox|Incoming|Inbox| X=1
LIST
```

`red2.mjs` (a press into the cursor's pane after a reload):

```js
// Red command, second half of D33's reload part: a press into the pane that holds the cursor keeps
// it, after a reload as without one (the R6 pointer rule: a pointer press keeps the cursor in one
// pane and clears it on a pane change). Usage: node red2.mjs <scratch base> <cdp port>
import { launch } from './cdp.mjs';
const c = await launch(process.argv[2], Number(process.argv[3]));
const saved = () => c.evaluate(`(() => { const out = []; const walk = (n) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { if (typeof n.view === 'string' && n.state && typeof n.state.cursor === 'string') out.push(n.view + ':' + n.state.cursor); Object.values(n).forEach(walk); } }; walk(JSON.parse(localStorage.getItem('oculus.layout.v1') || 'null')); return JSON.stringify(out); })()`);
const drawn = () => c.evaluate(`JSON.stringify([...document.querySelectorAll('[data-cursor]')].map((e) => e.getAttribute('data-card')))`);
// A real pointer press on the Focus pane's own tab, which is already active.
const press = async () => {
  const at = await c.evaluate(`(() => { const r = document.querySelector('[data-pane] [role=tab]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 });
  await c.sleep(400);
};
let ok = true;
try {
  await c.navigate('http://127.0.0.1:8796/');
  await c.waitFor(`document.querySelectorAll('[data-pane-active] [data-card]').length > 2`);
  await press();
  await c.key('o', 'KeyO', 79); await c.sleep(300);
  const held = await saved();
  console.log('held:', held, await drawn());
  await press();
  const kept = (await saved()) === held;
  console.log(`a second press into the pane, no reload: saved ${await saved()}: ${kept ? 'PASS' : 'FAIL'}`);
  await c.reload();
  const marked = await c.waitFor(`!!document.querySelector('[data-cursor]')`, 8000);
  console.log(`after the reload: saved ${await saved()}, drawn ${await drawn()}${marked ? '' : ' (the mark did not come back: the reconcile cause, not this one)'}`);
  await press();
  const keptAfter = (await saved()) === held;
  console.log(`the first press into the pane after the reload: saved ${await saved()}, drawn ${await drawn()}: ${keptAfter ? 'PASS' : 'FAIL'}`);
  ok = kept && !!marked && keptAfter;
} finally { for (const l of c.console.filter((l) => l.includes('DIAG-'))) console.log('console:', l); c.close(); }
console.log(ok ? 'GREEN' : 'RED');
process.exit(ok ? 0 : 1);
```

`panechange.mjs` (a press into another pane after a reload). It has the same `saved()` helper as `red2.mjs`, and a `pressTab(label)` that finds the `[data-pane] [role=tab]` whose text starts with `label`, scrolls it into view (`inline: 'nearest'`) and sends a real `mousePressed`/`mouseReleased` at its centre, then waits 400 ms. Its body:

```js
await c.navigate('http://127.0.0.1:8796/');
await c.waitFor(`!!document.querySelector('nav button[aria-label="Incoming"]')`);
await c.evaluate(`document.querySelector('nav button[aria-label="Incoming"]').click()`);
await pressTab('Lit Watch');
await c.waitFor(`document.querySelectorAll('[data-pane-active] [data-card]').length > 2`);
await c.key('o', 'KeyO', 79); await c.sleep(300);
console.log('held:', await saved());
await pressTab('Calendar');
const a = await saved();
console.log(`no reload, a press into the Calendar pane: saved ${a}: ${a === '[]' ? 'PASS' : 'FAIL'}`);
ok &&= a === '[]';
await pressTab('Lit Watch');
await c.key('o', 'KeyO', 79); await c.sleep(300);
console.log('held again:', await saved());
await c.reload();
const marked = await c.waitFor(`!!document.querySelector('[data-cursor]')`, 8000);
console.log(`after the reload: saved ${await saved()}, mark ${marked ? 'drawn' : 'not drawn'}`);
await pressTab('Calendar');
const b = await saved();
console.log(`after the reload, a press into the Calendar pane: saved ${b}: ${b === '[]' ? 'PASS' : 'FAIL'}`);
ok &&= b === '[]';
// then: GREEN when ok, else RED, exit 0 or 1
```

`red3.mjs` (the keys move the held cursor after a reload, on a two-pane page). It uses the same helpers. Its body presses Lit Watch, waits for rows, presses Calendar, presses Lit Watch, then presses `o` twice and asserts the second `o` moved the radar cursor (`no reload: ... PASS`). Then it reloads, waits for the mark, presses `o` once, and asserts the saved radar cursor changed (`after the reload, o gives ...: PASS`).

`filter.mjs` (a held cursor whose drawn row a search hides is cleared, without and after a reload, on the Projects board). It presses `o`, then types `zzqqxx-no-such-card` into `[data-pane] input[type=search]` with `Input.insertText`, waits 1.5 s and asserts the saved layout holds no cursor. It clears the search (select, Backspace, blur), presses `o` again, reloads, waits for the mark, and repeats the search assertion.

Runs after the fix, the scratch copy at main plus the fix above. The only change made after `npm run test:quick` is the reconcile comment's first line ("leaves out" in place of "no longer draws"); prettier and eslint ran after that change.

```
$ HOME=$tmp/home npm run test:quick          # from tools/oculus of the scratch copy
test:quick: 1 changed file(s), from git since HEAD
test:quick: 10 test file(s), 10 essential
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      eslint (5.2 s)
ok      svelte-kit sync (9.8 s)
ok      svelte-check (7.7 s): 1791325964810 COMPLETED 400 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.6 s): Duration  11.32s (transform 12.74s, setup 0ms, import 16.14s, tests 1.42s, environment 2ms)
test:quick: 22.2 s (limit 45.0 s); every command passed
$ npx prettier --check src/lib/shell/keys/workbench-keys.svelte.ts && npx eslint src/lib/shell/keys/workbench-keys.svelte.ts && echo lint-ok
All matched files use Prettier code style!
lint-ok
$ LC_ALL=C grep -n '[^ -~]' src/lib/shell/keys/workbench-keys.svelte.ts; echo "ascii grep exit $?"
ascii grep exit 1
$ wc -l src/lib/shell/keys/workbench-keys.svelte.ts
     511
```

The red command, three runs, then the original unshrunk case (two presses):

```
== red.mjs Focus 1, run 1
page Focus: cursor held on eeg-saad-challenge@769c2eed-...; before reload {"drawn":["eeg-saad-challenge@769c2eed-..."],"saved":["eeg-saad-challenge@769c2eed-..."],"views":["769c2eed-... is focus"],"rows":55}
after reload {"drawn":["eeg-saad-challenge@769c2eed-..."],"saved":["eeg-saad-challenge@769c2eed-..."],"views":["769c2eed-... is focus"],"rows":55}
part 1, the held cursor kept in the saved instance state after the reload: PASS
part 2, the held row marked data-cursor in its pane after the reload: PASS
GREEN
exit 0
== run 2: the same, instance 89097473-..., GREEN, exit 0
== run 3: the same, instance 07bb55e6-..., GREEN, exit 0
== original unshrunk case: red.mjs Focus 2
page Focus: cursor held on sandpile-operator@066a95ab-...; before reload {... "rows":55}
after reload {"drawn":["sandpile-operator@066a95ab-..."],"saved":["sandpile-operator@066a95ab-..."], ...}
part 1 ...: PASS
part 2 ...: PASS
GREEN
exit 0
```

Part B and the R6 rule:

```
== red2.mjs
held: ["focus:eeg-saad-challenge"] ["eeg-saad-challenge"]
a second press into the pane, no reload: saved ["focus:eeg-saad-challenge"]: PASS
after the reload: saved ["focus:eeg-saad-challenge"], drawn ["eeg-saad-challenge"]
the first press into the pane after the reload: saved ["focus:eeg-saad-challenge"], drawn ["eeg-saad-challenge"]: PASS
GREEN
== panechange.mjs
held: ["radar:Personalized Federated Learning for Tensor Regression#469"]
no reload, a press into the Calendar pane: saved []: PASS
held again: ["radar:Personalized Federated Learning for Tensor Regression#469"]
after the reload: saved ["radar:Personalized Federated Learning for Tensor Regression#469"], mark drawn
after the reload, a press into the Calendar pane: saved []: PASS
GREEN
== red3.mjs
no reload: o holds ["radar:Personalized Federated Learning for Tensor Regression#469"], o again gives ["radar:The Cost of Binarizing Survival Outcomes in Clinical Prognostic Modeling"]: PASS
after the reload: saved ["radar:The Cost of Binarizing Survival Outcomes in Clinical Prognostic Modeling"], mark drawn
after the reload, o gives ["radar:A reproducible and extensible framework for benchmarking competing risks survival models"]: PASS
GREEN
== filter.mjs
held: ["projects:sandpile-operator"] ["sandpile-operator"]
before a reload, search hides the held row: saved [], drawn [], rows 0
before a reload: the cursor of a hidden row is cleared: PASS
after the reload: ["projects:sandpile-operator"] ["sandpile-operator"]
after a reload, search hides the held row: saved [], drawn [], rows 0
after a reload: the cursor of a hidden row is cleared: PASS
GREEN
```

**Every view that reads `cardCursor`.** `grep -rn 'cardCursor' src` lists 17 view components plus the shell: `views/feeds/inbox/Inbox.svelte:67`, `feeds/radar/Radar.svelte:55`, `system/gallery/Gallery.svelte:48`, `feeds/literature/Literature.svelte:70`, `feeds/leads/Leads.svelte:83`, `academic/present/Present.svelte:130`, `feeds/linkedin/Linkedin.svelte:66`, `system/machine/usage/Usage.svelte:55`, `boards/personal/Personal.svelte:64`, `boards/projects/Projects.svelte:85` (the projects, coauthor and archive views), `boards/focus/Focus.svelte:68`, `boards/project/Project.svelte:66`, `boards/collection/Collection.svelte:125` (funding, events, joint-work and the other collection views), `sources/venues/Venues.svelte:64`, `sources/data/Data.svelte:61`, `structure/domains/Domains.svelte:48`, `structure/pillars/Pillars.svelte:55`.

`./views.sh $tmp`, the view of the instance holding the cursor read from the saved layout:

| View | Tree without the fix (main's head) | Tree with the fix |
|---|---|---|
| focus | RED (part 1 FAIL, part 2 FAIL) | GREEN |
| projects | RED | GREEN |
| coauthor (Projects.svelte) | RED | GREEN |
| archive (Projects.svelte) | RED | GREEN |
| personal | RED | GREEN |
| usage | GREEN | GREEN |
| project | GREEN | GREEN |
| radar (Lit Watch) | RED | GREEN |
| leads | RED | GREEN |
| linkedin (synthetic posts) | RED | GREEN |
| literature (a live query) | RED | GREEN |
| funding (Collection.svelte) | RED | GREEN |
| events (Collection.svelte) | RED | GREEN |
| joint-work (Collection.svelte) | RED | GREEN |
| pillars | RED | GREEN |
| domains | RED | GREEN |
| venues | RED | GREEN |
| data | RED | GREEN |
| present (overview grid) | RED | GREEN |
| gallery | GREEN | GREEN |
| inbox | not run: `ERROR no rows drawn` | not run: `ERROR no rows drawn` |

Why some views are green without the fix, and what is not run:

- **Usage and Project.** These two sat in a pane that is not the page's active main pane. Without the fix, `syncCards` observes only `focusedPaneElement()`, so no reconcile ran on their pane after the reload. That reading comes from the code and probe 8's log of what `syncCards` observes; their own runs were not probed.
- **Gallery.** Why it is green without the fix is not verified. Its three tiles may already be drawn at the first reconcile, but no probe showed it.
- **Inbox.** Its rows come from the `inbox` channel, which needs a mail account (`mail publish: unconfigured` in the dev log), and none exists in the scratch copy. The fix holding there is not verified by a run. The Inbox draws its rows through the same `ui/frame/Card.svelte` (`data-card={id}`, `data-cursor={cursor || undefined}`, :69-70, via `InboxCard.svelte:146`), so the shell path the fix changes is the one every other row above goes through. The look on Axel's TEST page, where the account exists, is the run that settles it.

No test reaches it: not applicable. No test is written: the rules file's test rule allows none here, since no `agents/guarded.md` entry covers the card cursor (a new entry is Axel's ruling, `spec.md:57`), and the behaviour needs a DOM, which `spec.md:65` leaves to the look.

## Outside this part

These go to the session; none of them was changed.

- **The Settings view has Z446's Audit defect.** Its editor cards carry `data-card={at}` (`views/system/workbench/editors/Cards.svelte:123`), and no Settings file reads `cardCursor`: the grep lists no file under `views/system/workbench`. So `o`, `k` and the other cursor keys hold a cursor no row draws there. In the scratch copy the System page's Settings pane drew 181 such cards, the first `data-card="0"`. Under Z468 this is folded into an existing step or raised to Axel; that is the session's call.
- **Main moved during the run** from fb7f076f to f2567dcd. `git diff --stat fb7f076f HEAD -- tools/oculus/src tools/oculus/tests` printed nothing, so the fix applies as written.

## Cleanup

```
$ grep -rn 'DIAG-7c3e' $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests; echo "grep of the tag over the tree the probes ran in: exit $?"
grep of the tag over the tree the probes ran in: exit 1
$ kill 86022 85940; lsof -nP -iTCP:8796 -sTCP:LISTEN; echo "listeners on 8796 after the stop: exit $?"
listeners on 8796 after the stop: exit 1
$ ps -axo pid,command | grep -v grep | grep -c 'diagnose.s3oGQR'
0
$ git worktree remove --force "$tmp/tree" && echo removed      # from the main checkout
removed
$ rm -rf "$tmp"; ls -d "$tmp"
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.s3oGQR: No such file or directory
$ git worktree list | grep -c diagnose
0
```

- The scratch copy's `local.yml`, the synthetic LinkedIn posts, the scratch `HOME` and the Chrome profiles were inside `$tmp` and are gone with it.
- No credential or `.env` file was copied.
- This run's scripts in the session scratchpad (`cdp.mjs`, `red.mjs`, `red2.mjs`, `red3.mjs`, `panechange.mjs`, `filter.mjs`, `views.sh`, and the throwaway `explore*.mjs`, `tabs.mjs`, `dbg*.mjs`) were removed. Their sources are above.
- No file of the main checkout was changed by this run: `git status --short` in the main checkout printed nothing at the end. The untracked `D23c.md` of the start was committed by the session in the meantime (`f2567dcd`).
- Carried by the brief as its check: `red.mjs` (Focus, and every view through `views.sh`), `red2.mjs`, `panechange.mjs`, `red3.mjs` and `filter.mjs`, against a dev server of the step's worktree, or as the look on TEST.

# Diagnosis: Proof 1 of D33, the entryAt / GONE guard and VirtualRows on a shrinking list

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. None of the outputs below held a secret. A diagnosis of the same step later is appended below under its own heading at the level of the title above.

Diagnosis agent: aecfa0b2710e743e8, claude-opus-5-5, 288,280 tokens, 92 tool uses, 21.3 min.

Answers to the questions in the brief, in order:

1. **Does the stale read happen?** Yes. `ui/tree/list/VirtualRows.svelte` asks the caller for keys and item bodies at indexes past the end of a list that has shrunk. It happens only when the list is written from inside a user `$effect`. The same shrink written outside an effect reads nothing past the end. A typed filter is written outside an effect: `Search.svelte:79` `oninput`, then `patch`, then `setInstanceState`. So the refuter's typed-filter scenario does not trigger it. The effect path is the language client. Its diagnostics are written from inside an editor's effect, as the comment in `documents.svelte.ts` `setDiagnostics` says and as the calls at `client.ts:312`, `:464-468` and `:525-526` show. That path is known by reading only; it was not run.
2. **What is the cause?** The window the keyed each iterates is a `$state` (`windowed`) written only by a `$effect.pre` (`configure`) and by `onChange`. When the caller's list changes inside a user `$effect`, Svelte re-runs the dependent block effects at once (`eager_block_effects`, `batch.js:1108-1170`, marked at `sources.js:400`). Those are the each and the `{#if}` blocks inside item bodies, and they run before the `$effect.pre` has rewritten the window for the new count.
3. **Which other callers are hit?** All four. Each reads by direct index and throws `TypeError` on the same past-end read:
   - `Changes.svelte:234` and `:243`
   - `Graph.svelte:425` and `:432`
   - `Console.svelte:164-166`
   - `Tree.svelte:308` and `:314`

   Whether each caller's list is in fact written from inside an effect in the app was not verified per caller. The fix in VirtualRows covers every caller either way.
4. **Can the guard's `''` key raise `each_key_duplicate`?** Yes, once two or more past-end indexes are keyed in one pass: the shrink from 20 to 3 raised `Svelte error: each_key_duplicate`. With exactly one past-end index (20 to 9) the guard hides the read and nothing is thrown.
5. **The fix.** The window is a `$derived` of the current inputs in VirtualRows, which ends the cause for every caller. The guard in `problem-rows.ts` is removed and `Problems.svelte` reads `entries[at]` directly. The test and the red command are below. Adding the test to the suite needs a ruling, as "No test reaches it" says.

## Symptom

From `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/D33-refuter.md`, section "2. Proof", finding 1, its failure scenario, word for word:

- Failure scenario: a filter typed that cuts the list from twenty rows to ten. If VirtualRows' each re-keys its stale window with the new `key`, ten stale indexes all answer `''` and the each block throws `each_key_duplicate`. If only the item bodies re-run, the guard hides the defect in the Problems view while staging the last files of a Changes group can hit the same past-end read.

What the builder's report (`agents/reviews/D33-report.md`) says about the error it saw: line 81 says the last code change was "the `entryAt` guard in `views/sources/search/problem-rows.ts` and `Problems.svelte`". Line 205 says: "A list that shrinks asks the Problems tree for the row at an index past the end once before it drops that row; `entryAt` answers it with an empty row that is never drawn." The report quotes no error text and names no page run that showed it. Line 5 notes that page run `n23` "closed x.py before pressing, which removed the rows".

## Where the probes run

The scratch copy was `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LniAti/tree`, a detached worktree at `1439a44ec` made from the main checkout. It was built in these steps:
- The step's diff was taken with `git diff --binary 1439a44ec` from inside `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D33`, saved to `$tmp/step.diff` and applied with `git apply --allow-empty`.
- The 8 `??` files from `git status --porcelain --untracked-files=all` were copied over.
- `tools/oculus/node_modules` was a symlink to the D33 worktree's `node_modules`, used read-only and unlinked before the cleanup.

The scratch tree's `git diff --binary 1439a44ec | shasum` matched the step's: `75b83a8c5f01cbd8e0ea4c6226e43d386ef95487`.

The paths redirected under `$TMPDIR`: none. No command touched the home folder, the installed skills or the pinned checkout. No page, browser, server or port was used.

Taken before the copy was made, from inside the step's worktree:

```
$ git status --short
 M tools/oculus/DESIGN.md
 M tools/oculus/HELP.md
 M tools/oculus/config/layout.yml
 M tools/oculus/config/text/app.yml
 M tools/oculus/config/text/statusbar.yml
 M tools/oculus/config/text/views/academic/latex.yml
 M tools/oculus/config/text/views/sources/files.yml
 M tools/oculus/config/text/views/sources/search.yml
 M tools/oculus/config/text/views/system/audit.yml
 M tools/oculus/docs/diagrams/channels.dot
 M tools/oculus/docs/diagrams/channels.svg
 M tools/oculus/docs/diagrams/layer-server.dot
 M tools/oculus/docs/diagrams/layer-server.svg
 M tools/oculus/docs/diagrams/layer-shell.dot
 M tools/oculus/docs/diagrams/layer-shell.svg
 M tools/oculus/docs/diagrams/layer-state.dot
 M tools/oculus/docs/diagrams/layer-state.svg
 M tools/oculus/docs/diagrams/layer-views.dot
 M tools/oculus/docs/diagrams/layer-views.svg
 M tools/oculus/docs/diagrams/layers.dot
 M tools/oculus/docs/diagrams/layers.svg
 M tools/oculus/docs/files-and-search.md
 M tools/oculus/docs/views.md
 M tools/oculus/docs/window.md
 M tools/oculus/package-lock.json
 M tools/oculus/package.json
 M tools/oculus/src/lib/data/model/index.ts
 M tools/oculus/src/lib/data/model/model-sessions.ts
 M tools/oculus/src/lib/server/content/audit/projects.ts
 M tools/oculus/src/lib/server/content/audit/publications.ts
 M tools/oculus/src/lib/server/content/audit/rules.ts
 M tools/oculus/src/lib/server/content/audit/scan.ts
 M tools/oculus/src/lib/shell/Workbench.svelte
 M tools/oculus/src/lib/shell/keys/key-dom.ts
 M tools/oculus/src/lib/shell/keys/keys.ts
 M tools/oculus/src/lib/shell/keys/workbench-keys.svelte.ts
 M tools/oculus/src/lib/shell/panes/strip/strip-tab.ts
 M tools/oculus/src/lib/shell/status/StatusBar.svelte
 M tools/oculus/src/lib/shell/status/status-items.ts
 M tools/oculus/src/lib/state/client/context.ts
 M tools/oculus/src/lib/state/sessions/latex/builds.ts
 M tools/oculus/src/lib/state/sessions/latex/latex-state.ts
 M tools/oculus/src/lib/state/sessions/latex/latex.svelte.ts
 M tools/oculus/src/lib/state/sessions/source/draft.ts
 M tools/oculus/src/lib/state/sessions/source/source.svelte.ts
 M tools/oculus/src/lib/state/sessions/terminal/commands.svelte.ts
 M tools/oculus/src/lib/state/sources/explorer/rows/decorations.ts
 M tools/oculus/src/lib/state/system/audit.ts
 M tools/oculus/src/lib/state/system/machine/lsp/documents.svelte.ts
 M tools/oculus/src/lib/state/workbench/navigation/pages.ts
 M tools/oculus/src/lib/state/workbench/navigation/registry.ts
 M tools/oculus/src/lib/state/workbench/navigation/status.ts
 M tools/oculus/src/lib/state/workbench/rail-badges.svelte.ts
 M tools/oculus/src/lib/ui/controls/editor/chords.ts
 M tools/oculus/src/lib/ui/controls/editor/commands.ts
 M tools/oculus/src/lib/ui/controls/editor/kit/lsp/client.ts
 M tools/oculus/src/lib/ui/controls/editor/kit/lsp/hosts.ts
 M tools/oculus/src/lib/ui/controls/editor/kit/lsp/services.ts
 M tools/oculus/src/lib/ui/controls/editor/types.ts
 M tools/oculus/src/lib/ui/controls/tool-button.ts
 M tools/oculus/src/lib/ui/tabs/TabFace.svelte
 M tools/oculus/src/lib/ui/tabs/tab-strip.ts
 M tools/oculus/src/lib/views/academic/latex/Latex.svelte
 D tools/oculus/src/lib/views/academic/latex/Problems.svelte
 M tools/oculus/src/lib/views/boards/focus/lanes/LaneCard.svelte
 M tools/oculus/src/lib/views/shared/explorer/RootedTree.svelte
 M tools/oculus/src/lib/views/shared/explorer/rooted-tree.svelte.ts
 M tools/oculus/src/lib/views/shared/explorer/tree/FileRow.svelte
 M tools/oculus/src/lib/views/shared/explorer/tree/Tree.svelte
 M tools/oculus/src/lib/views/shared/latex/Main.svelte
 D tools/oculus/src/lib/views/shared/latex/Problems.svelte
 M tools/oculus/src/lib/views/shared/latex/places.ts
 M tools/oculus/src/lib/views/shared/links/source-file.ts
 M tools/oculus/src/lib/views/sources/files/sections/OpenEditors.svelte
 M tools/oculus/src/lib/views/sources/source/Editor.svelte
 M tools/oculus/src/lib/views/sources/source/Source.svelte
 M tools/oculus/src/lib/views/sources/source/SourceBody.svelte
 M tools/oculus/src/lib/views/sources/source/language/extension.ts
 M tools/oculus/src/lib/views/sources/source/language/lsp.ts
 M tools/oculus/src/lib/views/sources/source/language/tab-language.svelte.ts
 M tools/oculus/src/lib/views/sources/source/status/tab-state.ts
 M tools/oculus/src/lib/views/system/audit/Audit.svelte
 M tools/oculus/src/lib/views/system/workbench/editors/Cards.svelte
 M tools/oculus/src/lib/views/system/workbench/editors/Editor.svelte
 M tools/oculus/src/lib/views/system/workbench/editors/Rollup.svelte
 M tools/oculus/src/routes/+page.svelte
?? tools/oculus/.scratch/migration/agents/reviews/D33-report.md
?? tools/oculus/src/lib/state/sessions/source/place.ts
?? tools/oculus/src/lib/state/system/problem-sources.ts
?? tools/oculus/src/lib/state/system/problems.svelte.ts
?? tools/oculus/src/lib/views/sources/search/Problems.svelte
?? tools/oculus/src/lib/views/sources/search/problem-rows.ts
?? tools/oculus/src/lib/views/sources/source/language/command-marks.svelte.ts
?? tools/oculus/tests/views/shared/explorer/root-drag.test.ts
$ git diff --binary 1439a44ec | shasum
75b83a8c5f01cbd8e0ea4c6226e43d386ef95487  -
```

After the run, the same commands from inside the step's worktree printed `75b83a8c5f01cbd8e0ea4c6226e43d386ef95487  -` and 94 status lines, the same count. The scratch tree's status had one more line, `?? tools/oculus/node_modules`, which was the symlink. The step's worktree was not changed.

## Red command

The project's vitest client project (`vite.config.ts`, `tests/ui/frame/client-runtime.ts`) runs Svelte's client runtime with no DOM, and no DOM library is installed. So the red command mounts VirtualRows on a small document written for it, `tests/ui/tree/list/mini-dom.diag.ts`. That document gives nodes and a parser for the template markup the compiler emits. Its layout is fixed: the `data-scroll` box is 100 px high and every other element 20 px, so the window draws rows 0 to 9.

The red command has three parts:
- The harness `tests/ui/tree/list/Shrinking.svelte` reads items by index, as the callers do. It records every key and every item-body read at an index the list no longer holds.
- The rows are written from `$effect.pre` ("derived") or from `$effect` ("effect").
- The key and body are read directly ("direct") or through a guard that answers `''` as `problem-rows.ts` does ("guard").

The command, from `tools/oculus` in the scratch copy:

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run tests/ui/tree/list/shrink.client.test.ts --silent=false --reporter=verbose
```

Runs, with the output of each quoted (each run was filtered with `grep -E "DIAG-.*(key reads|body reads|thrown)|✓|×|Tests  "`; the three were identical):

```
== run 1
DIAG-7c41 derived/direct past-end key reads: []
DIAG-7c41 derived/direct past-end body reads: []
DIAG-7c41 derived/direct thrown: none
DIAG-7c41 effect/direct past-end key reads: [3]
DIAG-7c41 effect/direct past-end body reads: []
DIAG-7c41 effect/direct thrown: TypeError: Cannot read properties of undefined (reading 'id')
DIAG-7c41 effect/guard past-end key reads: [3,3,4,4,5,5,6,6,7,7,8,8,9,9,3,4]
DIAG-7c41 effect/guard past-end body reads: [3]
DIAG-7c41 effect/guard thrown: Svelte error: each_key_duplicate
 ✓ |client| tests/ui/tree/list/shrink.client.test.ts > shrinks from 20 to 3, rows written 'derived', read 'direct' 12ms
 × |client| tests/ui/tree/list/shrink.client.test.ts > shrinks from 20 to 3, rows written 'effect', read 'direct' 10ms
 × |client| tests/ui/tree/list/shrink.client.test.ts > shrinks from 20 to 3, rows written 'effect', read 'guard' 4ms
      Tests  2 failed | 1 passed (3)
== run 2
(identical lines to run 1; derived/direct 11ms, effect/direct 10ms, effect/guard 4ms)
      Tests  2 failed | 1 passed (3)
== run 3
(identical lines to run 1; derived/direct 11ms, effect/direct 10ms, effect/guard 4ms)
      Tests  2 failed | 1 passed (3)
```

How to read the parts:
- The "effect/direct" row is the symptom for the four callers that index directly: the key read past the end throws `TypeError`.
- The "effect/guard" row is the symptom for the Problems view with the guard: ten stale indexes become seven `''` keys and `each_key_duplicate` is thrown.
- The "derived/direct" row is the control: the same shrink, written outside a user effect, reads nothing past the end.

Runs after the tightening: the red command runs in about 1 s (`Duration 908ms` to `1.63s` across the runs). It uses no network, no timer wait and no file outside the scratch copy. The tightening made two changes. The item body became `{@const row = rowAt(at)}{#if row.id !== ''}...{/if}`, a block effect as in Changes, Problems, Console and Tree. A log line naming each past-end key read was added. The three runs above are after the tightening.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The write from inside a user effect, replaced by a write from `$effect.pre` (the "derived" row) | green: `derived/direct past-end key reads: []`, `thrown: none` | put back (needed) |
| The shrink target: 20 to 10, so no drawn index (0 to 9) is past the new end | green: `effect/direct past-end key reads: []`, `effect/guard ... thrown: none` | put back (an index past the new end must be drawn) |
| The shrink target cut to one past-end index: 20 to 9 | red: `effect/direct past-end key reads: [9]`, `TypeError ... (reading 'id')`; `effect/guard past-end key reads: [9,9,9]`, `body reads: [9]`, `thrown: none` | kept as a variant. One past-end index is enough for the stale read, but `each_key_duplicate` needs two or more. |
| The list's starting length: 20 cut to 11 | red: `effect/direct past-end key reads: [3]`, `TypeError`; `effect/guard ... thrown: Svelte error: each_key_duplicate` | cut (not needed; 11 is enough) |
| The scroll box: `data-scroll` removed, so `box` stays null and `drawn` is `firstWindow(count)`, derived from `count` | green: `effect/direct past-end key reads: []`, `effect/guard past-end key reads: []` | put back (needed) |

The shrunk case, as it stands, has four parts, each needed for the red:
- a VirtualRows that has found its scroll box, so `drawn` is the `windowed` state;
- a list written from inside a user `$effect`;
- a shrink that leaves a drawn index at or past the new length;
- a key or body that reads the caller's list by that index.

## Hypotheses

1. If the cause is that the each iterates `windowed`, a `$state` only the `$effect.pre` (`configure`) and `onChange` write, then deriving the window in a `$derived` from the current `count`, `key`, `size`, `margin` and `kept` turns the red command green. Without the change, a write inside a user `$effect` makes Svelte re-run the each and the item-body blocks eagerly, before that `$effect.pre` runs. Falsified by: the red command still red with the window derived.
2. If the eager re-run comes only from the each's `key` call reading the caller's list in a tracked context, then calling `key` untracked in the each turns the red command green. Falsified by: past-end key or body reads with `key` untracked.
3. If the virtualizer hands `configure` or `onChange` a window with indexes at or past the count it was set to (its memoised range stale after `setOptions`), then the past-end read follows a window built that way. Falsified by: log lines showing every window `configure` and `onChange` built held only indexes below its count, and the past-end key read coming before any `configure` for the new count.
4. If `onChange` writes `windowed` from a stale virtualizer state between the caller's write and the each's run, then an `onChange` line appears between the shrink and the past-end read. Falsified by: no `onChange` line between them.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 3 and 4 (one logging probe at the boundary between the virtualizer and the each) | In `src/lib/ui/tree/list/VirtualRows.svelte`, `onChange`: `+ console.log('DIAG-7c41 onChange, count', virtualizer.options.count, 'window', virtualizer.getVirtualItems().map((one) => one.index).join(','));` and after `configure`'s `windowed = rowWindow(...)`: `+ console.log('DIAG-7c41 configure, count', rows, 'window', windowed.rows.map((one) => one.index).join(','));` | `-t "effect.*direct"`: `DIAG-7c41 onChange, count 0 window ` / `DIAG-7c41 configure, count 0 window ` / `DIAG-7c41 configure, count 20 window 0,1,2,3,4,5,6,7,8,9` / `DIAG-7c41 key asked past the end 3 of 3`. No `configure, count 3` and no `onChange` before the past-end read. | 3 falsified (every window held indexes below its count). 4 falsified (no `onChange` between the shrink and the read). |
| 1 (logging, the call stack at the past-end key read; the change undone above was put back first) | In the harness's past-end branch of `key`: `console.log('DIAG-7c41 key asked past the end', at, 'of', list.length, <the stack lines under svelte/src, VirtualRows or Shrinking>)` | `Object.key (Shrinking.svelte:38)`, `VirtualRows.svelte:239` (the each's key), `svelte/src/internal/client/dom/blocks/each.js:304`, `update_reaction (runtime.js:258)`, `update_effect (runtime.js:486)`, `flush_queued_effects (reactivity/batch.js:1163)`, `Batch.#process (reactivity/batch.js:444)`, `Batch.flush (reactivity/batch.js:677)`. `batch.js:1163` is the `update_effect(e)` of the `eager_block_effects` loop. `batch.js:444` is `flush_queued_effects(effects)`, the user-effect pass. | still standing: the each is run eagerly from inside the user-effect pass |
| 1 | The window derived: the diff under "Fix" below, the `VirtualRows.svelte` part (`windowed` and the `$effect.pre` removed, `moved` counter, `drawn = $derived.by(...)` calling `configure` and `rowWindow`) | `derived/direct`, `effect/direct` and `effect/guard`: `past-end key reads: []`, `past-end body reads: []`, `thrown: none`, each `drawn after: "   row 0 row 1 row 2 "`; `Tests  3 passed (3)` | still standing. Green with the change; red without it (the three runs above). |
| 2 | `-{#each drawn.rows as row, at (key(row.index))}` / `+{#each drawn.rows as row, at (untrack(() => key(row.index)))}` in `VirtualRows.svelte` | `effect/direct past-end key reads: []`, `past-end body reads: [3]`, `thrown: TypeError: Cannot read properties of undefined (reading 'id')`; `effect/guard past-end body reads: [3,4,5,6,7,8,9]`; `Tests  2 failed \| 1 passed (3)` | falsified: the item-body `{#if}` blocks are eager reactions of the same write and read the stale indexes |

Each probe's change was undone before the next. `VirtualRows.svelte` was copied back from a saved copy of the original, and `git diff --stat -- tools/oculus/src/lib/ui/tree/list/VirtualRows.svelte` printed nothing after each undo. The harness logging was part of the red command and was removed at the cleanup.

## Cause

Hypothesis 1, shown by the probe that derives the window: the red command is green with that change and red without it. Probe 1's log and stack show the order of events:
- `VirtualRows.svelte:79` keeps the drawn window in `windowed`, a `$state` written only by `configure` (in a `$effect.pre`, `:134-142` of the step's file) and by the virtualizer's `onChange`.
- When a caller's list changes inside a user `$effect`, Svelte 5.57.1 marks every block effect that depends on the written state as eager (`sources.js:400`). It runs those effects at once, ancestors first, inside `flush_queued_effects` (`batch.js:1140-1166`).
- The each over `drawn.rows` (keyed by `key(row.index)`, `:239`) is such a block, and so is every `{#if}` inside an item body. Both run before the `$effect.pre` has set the virtualizer to the new count and rewritten `windowed`.
- They therefore ask the caller for the key and the body of the old window's indexes against the shrunk list.

The read is real for the key and for the body. It hits every caller that reads by index:
- `Changes.svelte:234` and `:243`
- `Graph.svelte:425` and `:432`
- `Console.svelte:164-166`
- `Tree.svelte:308` and `:314`

Each throws `TypeError` when its list shrinks inside an effect while a drawn row is past the new end. The guard in `problem-rows.ts:129-156` answers that read with one key `''`, which hides the read when exactly one index is past the end. With two or more past-end indexes it raises `each_key_duplicate`.

A list written outside a user effect does not show it. That covers a typed filter, which is written from an input event at `Search.svelte:79`. In that case the batch traversal runs the `$effect.pre` before the each, in tree order.

## Fix and test

Test, run on the tree without the fix. That tree is the step's four files copied back from the step's worktree, with `cmp` reporting each "same as step". The test is the final form below:

```
$ npx vitest run tests/ui/tree/list/virtual-rows.client.test.ts
 ❯ |client| tests/ui/tree/list/virtual-rows.client.test.ts (1 test | 1 failed) 18ms
   × asks for no row past the end when a list of 20 shrinks to 3 inside an effect 18ms
 FAIL  |client| tests/ui/tree/list/virtual-rows.client.test.ts > asks for no row past the end when a list of 20 shrinks to 3 inside an effect
AssertionError: expected { …(3) } to deeply equal { thrown: '', …(2) }
- Expected
+ Received
  {
    "drawn": [
      "row 0",
      "row 1",
      "row 2",
+     "row 3",
+     "row 4",
+     "row 5",
+     "row 6",
+     "row 7",
+     "row 8",
+     "row 9",
    ],
    "past": {
      "body": [],
-     "key": [],
+     "key": [
+       3,
+     ],
    },
-   "thrown": "",
+   "thrown": "TypeError: Cannot read properties of undefined (reading 'id')
+
+ 	in <unknown>
+ 	in VirtualRows.svelte
+ 	in ShrinkingRows.svelte
+ 	in undefined
+ ",
  }
 ❯ tests/ui/tree/list/virtual-rows.client.test.ts:39:73
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Fix, as a diff against the step's worktree (`diff -u` of the step's file and the fixed file):

```
--- a/tools/oculus/src/lib/ui/tree/list/VirtualRows.svelte
+++ b/tools/oculus/src/lib/ui/tree/list/VirtualRows.svelte
@@ -75,8 +75,10 @@
     let size = $state(0);
     /** The list's offset in its scroll box, in px. */
     let margin = $state(0);
-    /** The window the virtualizer drew last, read again each time it says the window changed. */
-    let windowed: RowWindow = $state(firstWindow(0));
+    /** Counts the virtualizer's word that its window moved, so the window is read again. */
+    let moved = $state(0);
+    /** The window read last, handed back to `rowWindow` so an unchanged window keeps its value. */
+    let held: RowWindow = firstWindow(0);
     /** A row a key moved to that is not drawn yet, focused once it is. */
     let pending = $state('');
 
@@ -90,15 +92,25 @@
         scrollToFn: elementScroll,
         onChange: () => {
             place();
-            windowed = rowWindow(
-                virtualizer,
-                untrack(() => windowed)
-            );
+            moved += 1;
         }
     });
 
-    /** The rows drawn: the first ones until the list has found its scroll box, then the window. */
-    const drawn = $derived(box === null ? firstWindow(count) : windowed);
+    /**
+     * The rows drawn: the first ones until the list has found its scroll box, then the window the
+     * virtualizer gives for the list as it is now. The window is read here rather than written by
+     * an effect, so whatever reads the rows (the each below, run by Svelte ahead of this
+     * component's effects when the caller's list changes inside an effect of its own) never gets a
+     * window of a list that has since shrunk.
+     */
+    const drawn = $derived.by(() => {
+        if (box === null) return firstWindow(count);
+        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the read is the dependency
+        moved;
+        configure(count, size, margin, key, kept);
+        held = rowWindow(virtualizer, held);
+        return held;
+    });
     /** How many rows are not drawn, held after the first window at the tokens' row height. */
     const rest = $derived(count - drawn.rows.length);
     /** The items kept drawn: the caller's, and those holding the rows the tree keeps. */
@@ -107,13 +119,13 @@
         ...(nav?.kept() ?? []).map((id) => owns?.(id) ?? -1).filter((index) => index >= 0)
     ]);
 
-    /** Hand the virtualizer the list as it is now, and read the window it gives. */
+    /** Hand the virtualizer the list as it is now. */
     function configure(
         rows: number,
         height: number,
         offset: number,
         keyOf: (index: number) => string,
-        held: readonly number[]
+        keptRows: readonly number[]
     ): void {
         virtualizer.setOptions({
             ...virtualizer.options,
@@ -121,24 +133,10 @@
             getItemKey: keyOf,
             estimateSize: () => height,
             scrollMargin: offset,
-            rangeExtractor: (range: Range) => keptRange(range, held)
+            rangeExtractor: (range: Range) => keptRange(range, keptRows)
         });
-        windowed = rowWindow(
-            virtualizer,
-            untrack(() => windowed)
-        );
     }
 
-    $effect.pre(() => {
-        if (box === null) return;
-        const rows = count;
-        const height = size;
-        const offset = margin;
-        const keyOf = key;
-        const held = kept;
-        untrack(() => configure(rows, height, offset, keyOf, held));
-    });
-
     /** Read the list's offset in its scroll box again, which moves when anything above it does. */
     function place(): void {
         if (box === null || top === undefined) return;
--- a/tools/oculus/src/lib/ui/tree/list/virtual.ts
+++ b/tools/oculus/src/lib/ui/tree/list/virtual.ts
@@ -34,9 +34,10 @@
  * so each gap is measured from the list's top or from the end of the row drawn before it.
  *
  * Handed the window the list holds, it gives that same window back when nothing in it moved, so
- * the list writes nothing and the rows drawn from it are not run again. A row whose effect makes
- * the list configure itself again (the open commit's files, whose rows the Graph's kept items are
- * counted from) would otherwise be run again by the window it caused, and again, without end.
+ * the list's window keeps its value and the rows drawn from it are not run again. A row whose
+ * effect makes the list read its window again (the open commit's files, whose rows the Graph's
+ * kept items are counted from) would otherwise be run again by the window it caused, and again,
+ * without end.
  */
 export function rowWindow<S extends Element | Window, I extends Element>(
     virtualizer: Virtualizer<S, I>,
--- a/tools/oculus/src/lib/views/sources/search/problem-rows.ts
+++ b/tools/oculus/src/lib/views/sources/search/problem-rows.ts
@@ -126,35 +126,6 @@
     | { kind: 'file'; id: string; file: ProblemFile; open: boolean }
     | { kind: 'row'; id: string; parent: string; file: ProblemFile; row: Problem };
 
-/**
- * The line drawn for an index past the end of the list. A list that shrinks asks for the rows it
- * drew, at their old indexes, once more before it drops them; this line answers that ask and is
- * never shown.
- */
-const GONE: Entry = {
-    kind: 'row',
-    id: '',
-    parent: '',
-    file: { key: '', root: '', path: '', rows: [], counts: { errors: 0, warnings: 0, infos: 0 } },
-    row: {
-        root: '',
-        path: '',
-        owner: '',
-        severity: 'info',
-        line: 1,
-        column: 0,
-        endLine: 0,
-        endColumn: 0,
-        message: '',
-        source: ''
-    }
-};
-
-/** The line at an index of the tree, or the line for an index past the end of the list. */
-export function entryAt(entries: readonly Entry[], at: number): Entry {
-    return entries.at(at) ?? GONE;
-}
-
 /** The id of one problem row of the tree. */
 function rowId(file: ProblemFile, at: number): string {
     return `${file.key}#${String(at)}`;
--- a/tools/oculus/src/lib/views/sources/search/Problems.svelte
+++ b/tools/oculus/src/lib/views/sources/search/Problems.svelte
@@ -60,7 +60,6 @@
     import {
         copyText,
         entriesOf,
-        entryAt,
         fileFolder,
         fileName,
         filterFiles,
@@ -287,20 +286,20 @@
                     <ul class="entries" role="none">
                         <VirtualRows
                             count={entries.length}
-                            key={(at: number) => entryAt(entries, at).id}
+                            key={(at: number) => entries[at].id}
                             {nav}
                             owns={(id: string) => places.get(id) ?? -1}
                             label={(id: string) => {
                                 const at = places.get(id);
                                 if (at === undefined) return undefined;
-                                const entry = entryAt(entries, at);
+                                const entry = entries[at];
                                 return entry.kind === 'file'
                                     ? fileName(entry.file)
                                     : entry.row.message;
                             }}
                         >
                             {#snippet item(at: number, measure: Attachment<HTMLElement>)}
-                                {@const entry = entryAt(entries, at)}
+                                {@const entry = entries[at]}
                                 {#if entry.kind === 'file'}
                                     <li
                                         role="none"
```

The test's source as written. The scratch copy is gone, so all three files are quoted whole for the round. They are `tools/oculus/tests/ui/tree/list/virtual-rows.client.test.ts`, `tools/oculus/tests/ui/tree/list/ShrinkingRows.svelte` and `tools/oculus/tests/ui/tree/list/mini-dom.ts`:

```ts
// tools/oculus/tests/ui/tree/list/virtual-rows.client.test.ts
// Layer 3, primitive tests. ui/tree/list/VirtualRows.svelte over a list that shrinks while rows
// past its new end are drawn, the list written from inside an effect, mounted on the document of
// tests/ui/tree/list/mini-dom.ts: the list asks its caller for no key and no item body at an index
// past the end, throws nothing, and draws the rows left.
//
// It does not cover scrolling or measuring, which the look does.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, expect, it, onTestFinished, vi } from 'vitest';
import { cell } from '../../frame/rooted.svelte.ts';
import { documentGlobals } from './mini-dom.ts';
import ShrinkingRows from './ShrinkingRows.svelte';

const rowsOf = (count: number) =>
    Array.from({ length: count }, (_, at) => ({ id: `r${String(at)}`, name: `row ${String(at)}` }));

afterEach(() => {
    vi.unstubAllGlobals();
});

it('asks for no row past the end when a list of 20 shrinks to 3 inside an effect', () => {
    const { globals, body } = documentGlobals();
    for (const [name, value] of Object.entries(globals)) vi.stubGlobal(name, value);
    const rows = cell(rowsOf(20));
    const past = { key: [] as number[], body: [] as number[] };
    const list = mount(ShrinkingRows, { target: body, props: { rows: () => rows.get(), past } });
    onTestFinished(() => {
        void unmount(list);
    });
    flushSync();
    expect(body.textContent.match(/row \d+/g)).toHaveLength(10);
    let thrown = '';
    try {
        rows.set(rowsOf(3));
        flushSync();
    } catch (error) {
        thrown = String(error);
    }
    expect({ thrown, past, drawn: body.textContent.match(/row \d+/g) }).toEqual({
        thrown: '',
        past: { key: [], body: [] },
        drawn: ['row 0', 'row 1', 'row 2']
    });
});
```

```svelte
<!-- tools/oculus/tests/ui/tree/list/ShrinkingRows.svelte -->
<script lang="ts">
    // A caller of ui/tree/list/VirtualRows.svelte for the case in virtual-rows.client.test.ts. It
    // reads its items by index, as the Changes, Graph, Console, Tree and Problems views do, and
    // takes its list in from an effect, as a view does whose store a language client writes from
    // inside an editor's effect. Every index it is asked for that the list no longer holds is
    // written down, for the key and for an item's body apart.

    import type { Attachment } from 'svelte/attachments';
    import VirtualRows from '../../../../src/lib/ui/tree/list/VirtualRows.svelte';

    type Row = { id: string; name: string };
    type Props = {
        rows: () => Row[];
        past: { key: number[]; body: number[] };
    };

    let { rows, past }: Props = $props();

    let list: Row[] = $state.raw([]);
    $effect(() => {
        list = rows();
    });

    function key(at: number): string {
        if (at >= list.length) past.key.push(at);
        return list[at].id;
    }

    function rowAt(at: number): Row {
        if (at >= list.length) past.body.push(at);
        return list[at];
    }
</script>

<ul data-scroll>
    <VirtualRows count={list.length} {key} {item} />
</ul>

{#snippet item(at: number, measure: Attachment<HTMLElement>)}
    {@const row = rowAt(at)}
    {#if row.id !== ''}
        <li {@attach measure}>{row.name}</li>
    {/if}
{/snippet}
```

(The first line of the Svelte block above is a label for this record and is not in the file.)

```ts
// tools/oculus/tests/ui/tree/list/mini-dom.ts
// Layer 4, test helper. The smallest document Svelte's client runtime and @tanstack/virtual-core
// need to mount ui/tree/list/VirtualRows.svelte in the client project, which has no DOM: nodes, a
// parser for the template markup the Svelte compiler emits, and a fixed layout in which an element
// marked `data-scroll` (the scroll box) is BOX px high and every other element ROW px high, all at
// the top of the page. A case hands `documentGlobals()` to `vi.stubGlobal` and unstubs them after.

export const ROW = 20;
export const BOX = 100;

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'wbr']);

class MiniNode {
    static ELEMENT_NODE = 1;
    static TEXT_NODE = 3;
    static COMMENT_NODE = 8;
    static DOCUMENT_FRAGMENT_NODE = 11;
    nodeType = 0;
    nodeName = '';
    parentNode: MiniNode | null = null;
    childNodes: MiniNode[] = [];
    get ownerDocument(): unknown {
        return doc;
    }
    get firstChild(): MiniNode | null {
        return this.childNodes[0] ?? null;
    }
    get lastChild(): MiniNode | null {
        return this.childNodes.at(-1) ?? null;
    }
    get nextSibling(): MiniNode | null {
        const parent = this.parentNode;
        if (parent === null) return null;
        return parent.childNodes[parent.childNodes.indexOf(this) + 1] ?? null;
    }
    get previousSibling(): MiniNode | null {
        const parent = this.parentNode;
        if (parent === null) return null;
        const at = parent.childNodes.indexOf(this);
        return at > 0 ? parent.childNodes[at - 1] : null;
    }
    get parentElement(): MiniElement | null {
        return this.parentNode instanceof MiniElement ? this.parentNode : null;
    }
    get isConnected(): boolean {
        return (this as MiniNode) === doc.body || (this.parentNode?.isConnected ?? false);
    }
    get textContent(): string {
        return this.childNodes.map((child) => child.textContent).join('');
    }
    set textContent(value: string) {
        for (const child of [...this.childNodes]) child.parentNode = null;
        this.childNodes = [];
        if (value !== '') this.appendChild(new MiniText(value));
    }
    insertBefore(node: MiniNode, ref: MiniNode | null): MiniNode {
        const moved = node.nodeType === 11 ? [...node.childNodes] : [node];
        for (const one of moved) {
            one.parentNode?.removeChild(one);
            const at = ref === null ? this.childNodes.length : this.childNodes.indexOf(ref);
            if (at < 0) throw new Error('insertBefore: the reference is not a child');
            this.childNodes.splice(at, 0, one);
            one.parentNode = this;
        }
        return node;
    }
    appendChild(node: MiniNode): MiniNode {
        return this.insertBefore(node, null);
    }
    removeChild(node: MiniNode): MiniNode {
        const at = this.childNodes.indexOf(node);
        if (at < 0) throw new Error('removeChild: not a child');
        this.childNodes.splice(at, 1);
        node.parentNode = null;
        return node;
    }
    remove(): void {
        this.parentNode?.removeChild(this);
    }
    before(...nodes: (MiniNode | string)[]): void {
        const parent = this.parentNode;
        if (parent === null) return;
        for (const node of nodes) parent.insertBefore(asNode(node), this);
    }
    after(...nodes: (MiniNode | string)[]): void {
        const parent = this.parentNode;
        if (parent === null) return;
        const next = this.nextSibling;
        for (const node of nodes) parent.insertBefore(asNode(node), next);
    }
    append(...nodes: (MiniNode | string)[]): void {
        for (const node of nodes) this.appendChild(asNode(node));
    }
    replaceWith(...nodes: (MiniNode | string)[]): void {
        this.before(...nodes);
        this.remove();
    }
    contains(node: MiniNode | null): boolean {
        for (let at = node; at !== null; at = at.parentNode) if (at === this) return true;
        return false;
    }
    cloneNode(deep = false): MiniNode {
        const copy = this.shallow();
        if (deep) for (const child of this.childNodes) copy.appendChild(child.cloneNode(true));
        return copy;
    }
    shallow(): MiniNode {
        return new MiniFragment();
    }
    addEventListener(): void {
        // No event reaches a node of this document.
    }
    removeEventListener(): void {
        // No event reaches a node of this document.
    }
    dispatchEvent(): boolean {
        return true;
    }
}

function asNode(node: MiniNode | string): MiniNode {
    return typeof node === 'string' ? new MiniText(node) : node;
}

class MiniCharacterData extends MiniNode {
    data: string;
    constructor(data: string) {
        super();
        this.data = data;
    }
    get nodeValue(): string {
        return this.data;
    }
    set nodeValue(value: string) {
        this.data = value;
    }
    override get textContent(): string {
        return this.data;
    }
    override set textContent(value: string) {
        this.data = value;
    }
}

class MiniText extends MiniCharacterData {
    override nodeType = 3;
    override nodeName = '#text';
    override shallow(): MiniNode {
        return new MiniText(this.data);
    }
}

class MiniComment extends MiniCharacterData {
    override nodeType = 8;
    override nodeName = '#comment';
    override shallow(): MiniNode {
        return new MiniComment(this.data);
    }
}

class MiniFragment extends MiniNode {
    override nodeType = 11;
    override nodeName = '#document-fragment';
}

class MiniStyle {
    props = new Map<string, string>();
    setProperty(name: string, value: string): void {
        this.props.set(name, value);
    }
    removeProperty(name: string): void {
        this.props.delete(name);
    }
    getPropertyValue(name: string): string {
        return this.props.get(name) ?? '';
    }
    get cssText(): string {
        return [...this.props].map(([name, value]) => `${name}: ${value};`).join(' ');
    }
    set cssText(value: string) {
        this.props.clear();
        for (const part of value.split(';')) {
            const [name, ...rest] = part.split(':');
            if (name.trim() !== '') this.props.set(name.trim(), rest.join(':').trim());
        }
    }
}

class MiniElement extends MiniNode {
    override nodeType = 1;
    localName: string;
    namespaceURI = 'http://www.w3.org/1999/xhtml';
    attributes = new Map<string, string>();
    style = new MiniStyle();
    scrollTop = 0;
    scrollLeft = 0;
    constructor(tag: string) {
        super();
        this.localName = tag.toLowerCase();
        this.nodeName = tag.toUpperCase();
    }
    get tagName(): string {
        return this.nodeName;
    }
    getAttribute(name: string): string | null {
        return this.attributes.get(name) ?? null;
    }
    setAttribute(name: string, value: string | number | boolean): void {
        this.attributes.set(name, String(value));
    }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
    }
    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }
    get className(): string {
        return this.getAttribute('class') ?? '';
    }
    set className(value: string) {
        this.setAttribute('class', value);
    }
    get classList(): {
        add: (n: string) => void;
        remove: (n: string) => void;
        toggle: (n: string, on?: boolean) => void;
        contains: (n: string) => boolean;
    } {
        const names = (): string[] => this.className.split(/\s+/).filter((n) => n !== '');
        const write = (list: string[]): void => this.setAttribute('class', list.join(' '));
        return {
            add: (n) => write([...new Set([...names(), n])]),
            remove: (n) => write(names().filter((one) => one !== n)),
            toggle: (n, on) =>
                (on ?? !names().includes(n))
                    ? write([...new Set([...names(), n])])
                    : write(names().filter((one) => one !== n)),
            contains: (n) => names().includes(n)
        };
    }
    get dataset(): Record<string, string> {
        return new Proxy(
            {},
            {
                get: (_, key: string) => this.getAttribute(`data-${key}`) ?? undefined,
                set: (_, key: string, value: string) => {
                    this.setAttribute(`data-${key}`, value);
                    return true;
                }
            }
        );
    }
    /** The element or its nearest ancestor matching `[name]` or a tag name. */
    closest(selector: string): MiniElement | null {
        const attribute = /^\[([\w-]+)\]$/.exec(selector)?.at(1);
        const matches =
            attribute === undefined ? this.localName === selector : this.hasAttribute(attribute);
        return matches ? this : (this.parentElement?.closest(selector) ?? null);
    }
    get offsetHeight(): number {
        return this.hasAttribute('data-scroll') ? BOX : ROW;
    }
    readonly offsetWidth = 200;
    getBoundingClientRect(): {
        top: number;
        left: number;
        bottom: number;
        right: number;
        width: number;
        height: number;
        x: number;
        y: number;
    } {
        const height = this.offsetHeight;
        return { top: 0, left: 0, bottom: height, right: 200, width: 200, height, x: 0, y: 0 };
    }
    focus(): void {
        // Focus moves nothing in this document.
    }
    override shallow(): MiniNode {
        const copy = make(this.localName);
        for (const [name, value] of this.attributes) copy.setAttribute(name, value);
        return copy;
    }
}

class MiniHTMLElement extends MiniElement {}

class MiniTemplate extends MiniHTMLElement {
    content: MiniNode = new MiniFragment();
    set innerHTML(html: string) {
        this.content = parse(html);
    }
    override shallow(): MiniNode {
        const copy = new MiniTemplate('template');
        copy.content = this.content.cloneNode(true);
        return copy;
    }
}

function make(tag: string): MiniElement {
    return tag.toLowerCase() === 'template' ? new MiniTemplate(tag) : new MiniHTMLElement(tag);
}

function decode(text: string): string {
    return text
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&');
}

/** Parse the markup the Svelte compiler emits for a template: elements, text and comments. */
function parse(html: string): MiniFragment {
    const root = new MiniFragment();
    const open: MiniNode[] = [root];
    let at = 0;
    while (at < html.length) {
        const top = open[open.length - 1];
        if (html.startsWith('<!--', at)) {
            const end = html.indexOf('-->', at + 4);
            top.appendChild(new MiniComment(html.slice(at + 4, end)));
            at = end + 3;
        } else if (html.startsWith('</', at)) {
            at = html.indexOf('>', at) + 1;
            open.pop();
        } else if (html[at] === '<') {
            const tag = /^<([a-zA-Z][\w-]*)/.exec(html.slice(at))?.at(1);
            if (tag === undefined) throw new Error(`no tag at ${String(at)} of ${html}`);
            at += tag.length + 1;
            const element = make(tag);
            for (;;) {
                const rest = html.slice(at);
                const close = /^\s*(\/?)>/.exec(rest);
                if (close !== null) {
                    at += close[0].length;
                    top.appendChild(element);
                    if (close[1] !== '/' && !VOID.has(tag.toLowerCase())) open.push(element);
                    break;
                }
                const attribute = /^\s*([^\s=/>]+)(?:="([^"]*)")?/.exec(rest);
                if (attribute === null) throw new Error(`no attribute at ${String(at)} of ${html}`);
                element.setAttribute(attribute[1], decode(attribute.at(2) ?? ''));
                at += attribute[0].length;
            }
        } else {
            const end = html.indexOf('<', at);
            const text = html.slice(at, end < 0 ? html.length : end);
            top.appendChild(new MiniText(decode(text)));
            at += text.length;
        }
    }
    return root;
}

/** An observer that never reports, since nothing in this document changes size. */
class MiniResizeObserver {
    observe(): void {
        // Nothing is resized.
    }
    unobserve(): void {
        // Nothing is resized.
    }
    disconnect(): void {
        // Nothing is resized.
    }
}

const doc = {
    body: new MiniHTMLElement('body'),
    activeElement: null as MiniElement | null,
    defaultView: undefined as unknown,
    createElement: (tag: string) => make(tag),
    createElementNS: (_: string, tag: string) => make(tag),
    createTextNode: (value: string) => new MiniText(value),
    createComment: (value: string) => new MiniComment(value),
    createDocumentFragment: () => new MiniFragment(),
    importNode: (node: MiniNode, deep?: boolean) => node.cloneNode(deep),
    addEventListener: () => undefined,
    removeEventListener: () => undefined
};

const win = {
    document: doc,
    ResizeObserver: MiniResizeObserver,
    onscrollend: null,
    setTimeout: (run: () => void, ms?: number) => setTimeout(run, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    requestAnimationFrame: (run: () => void) => setTimeout(run, 0),
    cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    getComputedStyle: () => ({ direction: 'ltr', getPropertyValue: () => '' }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined
};
doc.defaultView = win;

/** The globals Svelte and the virtualizer read, and the body a case mounts into. */
export function documentGlobals(): { globals: Record<string, unknown>; body: HTMLElement } {
    doc.body.textContent = '';
    return {
        body: doc.body as unknown as HTMLElement,
        globals: {
            window: win,
            document: doc,
            navigator: { userAgent: 'mini-dom' },
            Node: MiniNode,
            Element: MiniElement,
            HTMLElement: MiniHTMLElement,
            HTMLTemplateElement: MiniTemplate,
            Text: MiniText,
            Comment: MiniComment,
            DocumentFragment: MiniFragment,
            ResizeObserver: MiniResizeObserver,
            requestAnimationFrame: win.requestAnimationFrame,
            cancelAnimationFrame: win.cancelAnimationFrame,
            getComputedStyle: win.getComputedStyle
        }
    };
}
```

Runs after the fix:

```
$ npx vitest run tests/ui/tree/list/virtual-rows.client.test.ts
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  977ms (transform 381ms, setup 0ms, import 860ms, tests 11ms, environment 13ms)

$ npx vitest run tests/ui/tree/list/shrink.client.test.ts --silent=false --reporter=verbose      (the red command)
DIAG-7c41 derived/direct past-end key reads: []
DIAG-7c41 derived/direct past-end body reads: []
DIAG-7c41 derived/direct thrown: none
DIAG-7c41 effect/direct past-end key reads: []
DIAG-7c41 effect/direct past-end body reads: []
DIAG-7c41 effect/direct thrown: none
DIAG-7c41 effect/guard past-end key reads: []
DIAG-7c41 effect/guard past-end body reads: []
DIAG-7c41 effect/guard thrown: none
 ✓ |client| ... shrinks from 20 to 3, rows written 'derived', read 'direct' 11ms
 ✓ |client| ... shrinks from 20 to 3, rows written 'effect', read 'direct' 2ms
 ✓ |client| ... shrinks from 20 to 3, rows written 'effect', read 'guard' 2ms
      Tests  3 passed (3)

The original, unshrunk case is the red command as first built, with its three rows above (20 to 3, the guard row included), plus the cut variants:
$ DIAG_TO=9 npx vitest run tests/ui/tree/list/shrink.client.test.ts --reporter=verbose
 ✓ ... shrinks from 20 to 9, rows written 'derived', read 'direct' 11ms
 ✓ ... shrinks from 20 to 9, rows written 'effect', read 'direct' 2ms
 ✓ ... shrinks from 20 to 9, rows written 'effect', read 'guard' 2ms
      Tests  3 passed (3)
$ DIAG_FROM=11 npx vitest run tests/ui/tree/list/shrink.client.test.ts --reporter=verbose
 ✓ ... shrinks from 11 to 3, rows written 'derived', read 'direct' 11ms
 ✓ ... shrinks from 11 to 3, rows written 'effect', read 'direct' 2ms
 ✓ ... shrinks from 11 to 3, rows written 'effect', read 'guard' 2ms
      Tests  3 passed (3)
```

Checks run on the fixed scratch tree:
- `npx prettier --check` over the four fixed files and the three test files: "All matched files use Prettier code style!"
- `npx eslint` over the same files: exit 0. `ShrinkingRows.svelte` is outside the eslint configuration, as the other test-side components are.
- `npx svelte-check --tsconfig ./tsconfig.json --output machine`: `COMPLETED 3408 FILES 1 ERRORS`. The one error was in the diagnosis-only `shrink.client.test.ts`, deleted at the cleanup. No error was in `src/` or in the three test files.
- `npx vitest run tests/checks/source/comment-width.test.ts`: the only line reported was `tests/ui/tree/list/Shrinking.svelte:14`, a diagnosis-only file deleted at the cleanup.
- `grep -rl "VirtualRows|list/virtual|problem-rows|entryAt" tests` found no existing test of these files.

What these runs do not cover, for the round and the look:
- Scrolling, measuring, a text-scale change, `reveal` with focus, the kept rows of TreeView and the Graph's opened commit. In the old code, the Graph's opened commit led `configure` to run again (the loop `virtual.ts` `rowWindow` describes). Under the fix, `drawn` keeps its value when the window is unchanged.
- The mini document reports no sizes after mount and runs no ResizeObserver.
- No page was run. The look at landing settles the Explorer tree, Changes, Graph with a commit opened, the Debug Console and Problems: scroll each, close a file whose language-server rows fill the Problems list, and check that no row goes missing or stays stale.

The round has to settle three points:
- The fix writes `src/lib/ui/tree/list/VirtualRows.svelte` and `src/lib/ui/tree/list/virtual.ts`. Neither is in the brief's "Paths this step writes" (`agents/briefs/D33.md:149-211`; `awk 'NR>=149 && NR<=230' agents/briefs/D33.md | grep -c "ui/tree"` printed 0). The test adds `tests/ui/tree/list/`, which does not exist on main (`ls tools/oculus/tests/ui/tree` gives "No such file or directory").
- The derived calls `virtualizer.setOptions` while it is evaluated. That changes the virtualizer's options and writes no Svelte state. `getVirtualItems` only updates `maybeNotify`'s deps and calls no `onChange` (`@tanstack/virtual-core/dist/esm/index.js:808-817`), so no state is written inside the derived. The red runs and the checks above raised no `state_unsafe_mutation`.
- The tag `DIAG-7c41` was not unique to this diagnosis. The committed record `agents/reviews/O30-diagnosis.md` already uses it (lines 397, 401 and 509), so the cleanup grep below lists that file. No line this diagnosis added is left.

No test reaches it: not applicable. The test above reaches the defect as it occurs. It cannot join the suite without a ruling, for two reasons:
- spec.md's rule on tests says: "A test exists only as the test of one entry of `agents/guarded.md`" and "A step that needs a new entry stops and asks Axel for it". `agents/guarded.md` has no entry covering VirtualRows (`grep -n -i "virtual|VirtualRows|tree/list|Problems|problem-rows" agents/guarded.md` printed nothing).
- spec.md also says "An effect's timing ... is tested in a file named `*.client.test.ts`, which runs in Svelte's client runtime with no DOM ... every other behaviour that needs a DOM stays with the look". The test needs the 420-line test-only document helper `mini-dom.ts` to mount the component.

This is for the session to raise as an open item. The options are:
- (a) Add a guarded.md entry for VirtualRows' window with these three files. A list that throws on a shrink stops updating that view, which is a failure that costs something.
- (b) Write no test, and rest the fix on this record's red command and the look. Under the rule on the lazy option, (b) is the lazy one.

No test is written: not applicable.

## Cleanup

```
$ rm -f tests/ui/tree/list/shrink.client.test.ts tests/ui/tree/list/Shrinking.svelte tests/ui/tree/list/mini-dom.diag.ts
$ grep -rln "DIAG-7c41" $D/tree --exclude-dir=node_modules --exclude=local.yml
/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LniAti/tree/tools/oculus/.scratch/migration/agents/reviews/O30-diagnosis.md
$ git log --oneline -1 -- tools/oculus/.scratch/migration/agents/reviews/O30-diagnosis.md
ef4fb22b3 Point the plan files at the rewritten commit hashes
$ git status --short -- tools/oculus/.scratch/migration/agents/reviews/O30-diagnosis.md
(nothing: the file is the committed base text, not a line this diagnosis added)
$ grep -rn "DIAG-7c41" $D/tree/tools/oculus/src $D/tree/tools/oculus/tests; echo "src/tests grep exit $?"
src/tests grep exit 1
$ unlink $D/tree/tools/oculus/node_modules
$ (from /Users/axelfaes/workspace/research-hub) git worktree remove --force "$D/tree"; echo "remove exit $?"
remove exit 0
$ rm -rf "$D"; ls -d "$D"
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LniAti: No such file or directory
$ git worktree list | grep -c diagnose
0
$ (from the step's worktree) git diff --binary 1439a44ec | shasum; git status --short | wc -l
75b83a8c5f01cbd8e0ea4c6226e43d386ef95487  -
      94
```

`D` is `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LniAti`.
- The scratch copy, its saved files and the probe diffs are gone.
- No credential or `.env` file was copied.
- The D33 worktree's `node_modules` is intact: 385 entries listed after the unlink.
- No command is left running: every command ran in the foreground, and no background command, watch or tmux session was started.
- The red command is carried by the round as its check. Its source and the hand-over test are quoted above, because the scratch copy is removed.
