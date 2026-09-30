# Diagnosis: Close pane on a pane of two tabs leaves the pane after Confirm

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

This record was opened by the orchestrating session and handed, under Axel's ruling Z108 (b), to a diagnosis agent that finished it. The session's own observations are kept under "What the orchestrating session observed" below; every other section is the agent's.

## Symptom

"Seen twice: the pane menu's "Close pane" on a pane holding the diff and the source of `tools/figures/gen_figures.py`, then Confirm on "Close this pane and the 2 tabs in it?", left the pane and both tabs; the same item on a pane of one tab, which asks nothing, closed it at once." (Z98, state file closed log.)

## Where the probes run

- The scratch copy: `$TMPDIR/diagnose.0WBiXW/tree`, a detached worktree of main at `1c95c890`, nothing applied, `tools/oculus/node_modules` a symlink to the main checkout's. Paths redirected under `$TMPDIR`: none (no probe touches the home folder, the installed skills or the pinned checkout).
- The TEST page in Chrome, tab 812136209 on `http://localhost:8790/`, for the red command in the page and for two probes made by patching the page at run time (the running server serves the main checkout, so a change in the scratch copy cannot reach the page). Every in-page addition carried the tag DIAG-7c1e and was removed by reloading.

What changed on TEST's layout: each run of the red command closed the History and Slides tabs of TEST's middle pane (path `[1]`), and the class check below activated the Deposit tab of the right pane. Before the first run TEST's saved layout was copied to `sessionStorage` under `DIAG-7c1e.saved`; before each run, and at the end, it was written back to `localStorage` and the tab reloaded, and the copy was removed. After the last reload TEST is the page on screen with its panes as they were at the start (9 tabs, active `6da5bf`; 2 tabs, active `81a353`; 32 tabs, active `9fa7c7`), no key holding `DIAG` is left in either storage, and `HTMLElement.prototype.focus` and `Storage.prototype.setItem` are native again. One effect the restore cannot undo: closing a tab clears what the ui store keeps under its instance id (`forgetTabs`, `layout/instances.ts:272-275`), so whatever the ui store held for the History tab `c3e097...` and the Slides tab `81a353...` of TEST is gone. No other page was touched.

### What the orchestrating session observed

The case: a pane on TEST holding History and Slides (Slides active), its pane menu, "Close pane", then Confirm. Seen red three times in a row: the pane closes and comes back. Two layout writes follow the Confirm, recorded by a wrapper around `Storage.prototype.setItem`:

1. The first write holds TEST's tree without the pane (no `slides` in it). Stack: `savePages (layout.svelte.ts)` <- `apply` <- `closePane (layout/instances.ts)` <- `PaneView.svelte` (the `askAndClose` callback) <- `confirmed (PaneView.svelte)` <- `Confirm.svelte:93` (the yes button's click).
2. The second write holds TEST's tree with the pane back, `history,slides` at the same place. Stack: `savePages` <- `apply` <- `change (layout.svelte.ts)` <- `activateInstance (layout/instances.ts)` <- `entered (PaneView.svelte, onfocusin)` <- `focusQuietly (ui/frame/quiet-focus.ts:16)` <- `Modal.svelte:164` (the dialog giving focus back when it is torn down) <- `execute_effect_teardown` <- `destroy_effect` ... <- `pause_effect` <- `BranchManager.ensure` <- `update_branch` <- `Batch.flush`.

Blocking that focusin in the page with a capture listener kept the pane closed. A unit probe on a scratch copy (`closePane([0])`, then `activateInstance('b')`) stayed green; it ran in the repository's node environment, which loads Svelte's server build, where no effect and no teardown runs, so it could not reach the read the second write came from.

## Red command

In the TEST page, after the setup `localStorage.setItem('oculus.layout.v1', sessionStorage.getItem('DIAG-7c1e.saved')); location.reload();`, this script (run through the Chrome tool's JavaScript call):

```js
const TEST = 'e0092727-56b0-4018-a006-3c0610c639da';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pane = document.querySelector(`[data-pane-path="1"][data-pane-page="${TEST}"]`);
const before = pane?.getAttribute('data-pane-active')?.slice(0, 6);
const opener = pane.querySelector('button[aria-label="Pane"]');
opener.focus();
opener.click();
await wait(200);
[...document.querySelectorAll('[role="menuitem"]')].find((e) => e.textContent.trim() === 'Close pane').click();
await wait(300);
const dialog = document.querySelector('[role="alertdialog"]');
const asked = dialog?.textContent.trim().split('  ')[0];
[...dialog.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Confirm').click();
await wait(500);
const saved = JSON.parse(localStorage.getItem('oculus.layout.v1')).pages.find((p) => p.id === TEST);
const inStore = JSON.stringify(saved.workbench).includes('81a353');
const inDom = [...document.querySelectorAll(`[data-pane-page="${TEST}"]`)].some((p) => p.getAttribute('data-pane-active')?.startsWith('81a353'));
`before: pane [1] active ${before}; asked: "${asked}"; store holds slides pane: ${inStore}; DOM draws slides pane: ${inDom}; ${inStore || inDom ? 'RED' : 'GREEN'}`;
```

It asserts both halves of the symptom: the saved layout still holds the pane, and the page still draws it.

Runs, each after the setup reload:

```
run 1: before: pane [1] active 81a353; asked: "Close this pane and the 2 tabs in it?"; store holds slides pane: true; DOM draws slides pane: true; RED
run 2: before: pane [1] active 81a353; asked: "Close this pane and the 2 tabs in it?"; store holds slides pane: true; DOM draws slides pane: true; RED
run 3: before: pane [1] active 81a353; asked: "Close this pane and the 2 tabs in it?"; store holds slides pane: true; DOM draws slides pane: true; RED
```

Tightening: the page command cannot take a change made in the scratch copy, so the same symptom was driven at the store on the scratch copy, where every probe below runs. The repository's node environment loads Svelte's server build, where no effect runs, so the store-level red command runs in Svelte's client runtime with no DOM: a scratch vitest config, `vitest.diag.config.ts`, is the repository's config with `resolve.conditions: ['browser']`, Svelte inlined (`test.server.deps.inline: [/svelte/]`) and a vitest environment whose `viteEnvironment` is `'client'` (`tests/diag/client-env.ts`). A harness `tests/diag/teardown.svelte.ts` stands for the dialog: an effect alive while a `$state` flag `asking` holds, whose teardown is the handler, and a `confirm(act)` that sets `asking = false` then calls `act`, as `confirmed()` in `PaneView.svelte:314-318` does. The red command `tests/diag/q106.test.ts` builds a page of `pane(['c'])` beside `pane(['a','b'], 'b')`, draws the dialog with PaneView's `entered()` (`touchPane(page)`, `activateInstance('b', page)`) as its teardown, answers it with `closePane([1], page)`, flushes, and prints and asserts that neither the store nor the saved layout holds `b`.

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run --config vitest.diag.config.ts tests/diag/q106.test.ts
```

Runs after the tightening (from `tools/oculus` in the scratch copy):

```
== run 1
DIAG-7c1e teardown ran
DIAG-7c1e store holds b: true; saved holds b: true
   × closes a pane of two tabs after Confirm 13ms
== run 2
DIAG-7c1e teardown ran
DIAG-7c1e store holds b: true; saved holds b: true
   × closes a pane of two tabs after Confirm 11ms
== run 3
DIAG-7c1e teardown ran
DIAG-7c1e store holds b: true; saved holds b: true
   × closes a pane of two tabs after Confirm 12ms
```

Each run takes about 3 seconds, needs no server, no DOM and no network, and writes to a fake storage only.

## No red command

Not applicable.

## Shrunk case

Cut on the store-level red command, one part per case, all in one file `tests/diag/q106-shrink.test.ts` so every cut runs (each case prints its result; vitest also reports each case failed for having no assertion, since the file prints rather than asserts):

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| none | `store holds b: true; saved holds b: true; RED` | |
| the teardown calls nothing | `store holds b: false; saved holds b: false; GREEN` | put back |
| `touchPane` from `entered` | `store holds b: true; saved holds b: true; RED` | cut |
| `activateInstance` from `entered` | `store holds b: false; saved holds b: false; GREEN` | put back |
| the page argument of `activateInstance` | `store holds b: true; saved holds b: true; RED` | cut |
| tab `a` (a pane of one tab) | `store holds b: true; saved holds b: true; RED` | cut |
| pane `c` (the closed pane is the root) | `store holds b: true; saved holds b: true; RED` | cut |
| the order of the handler (act first, dialog taken away after) | `store holds b: true; saved holds b: true; RED` | cut |

In the page, the cut of the dialog itself: History closed first, so the pane holds one tab and Close pane asks nothing. Result: `tabs before History,Slides; after closing History Slides; dialog asked: false; store holds slides pane: false; DOM draws slides pane: false; GREEN`. Put back: the dialog is what runs the handler from a teardown. The two tabs matter only because they make PaneView ask (`closeAsk`), which is why the one-tab case of the symptom closed at once.

The shrunk case, as it stands: one layout write in a click handler (the close), and in the flush that follows, an effect teardown that calls `activateInstance` on the same page. Each is needed for the red.

## Hypotheses

1. If a read of `$state` inside an effect teardown answers with the value from before the write made earlier in the same flush (Svelte 5.57.1: `execute_effect_teardown` sets `is_destroying_effect`, `reactivity/effects.js:445-461`; `get` returns `old_values` then, `runtime.js:659-660`; `internal_set` records the value from before the first write of the flush, `reactivity/sources.js:191-197`), then `entered` run from the Modal's cleanup reads `store.current` as it was before `closePane`, and `activateInstance` writes that tree back; running the handler after the teardown has finished turns the red command green. Falsified by: a log inside the teardown showing `layout(page)` already without `b`, or the red command staying red with the handler run after the teardown.
2. If `activateInstance` or `activate` puts a closed instance back (through `holding`, `attention.remembered` or the tree edit), then calling it in the teardown with a tab that was never closed (`c`, in the other pane) turns the red command green. Falsified by: the red command staying red with `activateInstance('c', page)`.
3. If the stale tree comes from Svelte's batches swapping in another batch's values for the whole flush (`Batch.apply`, `reactivity/batch.js:931-977`), then any read in that flush is stale, so running the same handler from the body of an effect in the same flush, in place of its teardown, still turns the red command red. Falsified by: the red command green with the handler run from the effect body in the same flush.

Not listed, already falsified by the shrink: the `page` passed to `entered` naming another page (the red stays with no page argument at all); the pane's own `active` or `activePane` being stale (the red stays with no `touchPane` and with an id that is not the pane's, probe 2); the two tabs (the red stays with one).

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 (logging) | in `q106.test.ts`, inside `entered` before its two calls: `+ process.stderr.write(`DIAG-7c1e teardown reads b in the tree: ${JSON.stringify(client.layout.layout(page)).includes('"b"')}; saved already holds b: ${(storage.held['oculus.layout.v1'] ?? '').includes('"b"')}\n`);` | `DIAG-7c1e teardown reads b in the tree: true; saved already holds b: false` then `DIAG-7c1e store holds b: true; saved holds b: true` | still standing: when the teardown runs, the close is already saved, and the store read still gives the tree with `b` |
| 1 (the change) | `- const dialog = question(entered);` `+ const dialog = question(() => queueMicrotask(entered));`, with the case made `async` and `+ await Promise.resolve();` after the second `flushSync()` so the assertions read after the deferred call | `DIAG-7c1e teardown ran` then `DIAG-7c1e store holds b: false; saved holds b: false`, `Tests  1 passed (1)` | still standing: green with the change, red without it (the runs above) |
| 2 | `- client.layout.activateInstance('b', page);` `+ client.layout.activateInstance('c', page);` | `DIAG-7c1e store holds b: true; saved holds b: true`, received tree `...{"kind":"pane","tabs":[{"id":"a",...},{"id":"b",...}],"active":"b"}` | falsified: activating a tab that was never closed brings the pane back as well |
| 3 | in `teardown.svelte.ts`: `- if (!asking) return;` `- return onTeardown;` `+ if (!asking) untrack(onTeardown); // DIAG-7c1e run in the body of the same flush, not the teardown` `+ return undefined;` (with `import { untrack } from 'svelte'`) | `DIAG-7c1e store holds b: false; saved holds b: false`, `Tests  1 passed (1)` | falsified: the same handler in the same flush reads the new tree when it runs in an effect body |

Each change was undone after its run; the red command was red again before the next probe.

Hypothesis 1's change checked in the page as well, by patching the page at run time (no source reaches the page from the scratch copy): just before Confirm, `HTMLElement.prototype.focus` was wrapped so that the first focus of a control marked `data-tip-quiet` (the mark `focusQuietly` sets) is given in a microtask, and only while the control is connected. The red command then printed `deferred Pane; after teardown connected: true; before: pane [1] active 81a353; asked: "Close this pane and the 2 tabs in it?"; store holds slides pane: false; DOM draws slides pane: false; GREEN`. The same wrapper with the fix's second rule (given only while `document.activeElement` is the body) printed `at microtask activeElement: body, control connected: true; ... store holds slides pane: false; DOM draws slides pane: false; GREEN`.

Class check, same page: the palette is the other Modal whose answer writes the layout. Focus in TEST's left pane, Cmd+K, then the palette row Deposit (a tab of the right pane, not active there). The layout writes recorded: `DIAG-7c1e write: pane[2] active 1d5808`, then `DIAG-7c1e write: pane[2] active 9fa7c7`; the page drew pane [2] with `pages` active. The palette's choice is undone by the same give-back. With the fix's rule patched in: `at microtask activeElement body; pane[2] drawn active 1d5808 (deposit); saved pane[2] active 1d5808; GREEN`.

## Cause

Hypothesis 1. `Modal.svelte:69-71` gives the focus back to the control that held it before the dialog, from the cleanup of an effect. A browser runs a control's focus handlers at once inside `focus()`, so PaneView's `entered` (`PaneView.svelte:139-142`, bound to `onfocusin`) runs inside that teardown. Svelte runs a teardown with `is_destroying_effect` set, and a read of `$state` there answers with the value from before the first write of the same flush (`runtime.js:659-660`, `reactivity/sources.js:191-197`): the read of `store.current` in `change` (`layout.svelte.ts:452-455`) gets the tree from before `closePane`, and `savePages` writes it back with the tab activated. The probe that shows it: the store-level red command is red with the handler run inside the teardown and green with the same handler queued to run after it (probe 1, the change); the log inside the teardown shows the close already saved while the store read still holds `b`; running it from an effect body in the same flush is green (probe 3), so the stale read is the teardown's and nothing else in the flush. Any write of the arrangement made by a focus handler at that moment undoes the answer, which is why the palette's choice of a tab is undone the same way.

## Fix and test

The fix moves the give-back out of the teardown: `quiet-focus.ts` gains `giveBackQuietly`, which gives the focus in a microtask, after the flush, while the control is on the page and nothing else holds the focus; `Modal.svelte`'s cleanup calls it. The second condition keeps what the synchronous give-back gave: a control that took the focus during that flush (a view the answer opened, focusing itself from an effect) ran after the teardown before, so it kept the focus, and a deferred give-back would otherwise take it from it.

The test cannot run in the repository's suite as it is: every test file runs in node against Svelte's server build (`vite.config.ts`, `environment: 'node'`), where no effect and no teardown runs. The test therefore brings a second vitest project, `client`, for files named `*.client.test.ts`: the environment `tests/ui/frame/client-runtime.ts` (no DOM, modules transformed as the browser's), Svelte inlined and resolved with the browser's conditions. The unit project keeps every other file. Checked with `npx vitest list --filesOnly --exclude 'tests/checks/**'` against HEAD's config: the same 370 files are collected, `tests/checks` stays out (0 of 29), and the one new file runs in the `client` project only. Two facts of vitest 4.1.11 decide how the projects are written, and the builder keeps both: a project with an `exclude` of its own does not receive the `--exclude 'tests/checks/**'` that `npm test` passes (listed that way, the 29 check files are collected), so the unit project leaves the client files out with a negated `include` pattern; and with `extends: true` a root `include` is merged into each project's list, so `include` sits in each project and not at the root.

The test file is `tests/ui/frame/give-back.client.test.ts` with the helper `tests/ui/frame/give-back.svelte.ts`, which is Modal's cleanup without a DOM (an effect alive while `drawn` holds, whose cleanup calls the real `giveBackQuietly`), and a stubbed `HTMLElement` and `document`. Its first case is the symptom: the menu opener's focus handler is PaneView's `entered`, the answer is `closePane([1], id)`. Its second is the palette's shape: the opener sits in another pane, the answer activates tab `a`.

Test, run on the tree without the fix (the tree with `giveBackQuietly` extracted into `quiet-focus.ts` with Modal's current synchronous body, so the test has a function to call; that extraction changes no behaviour):

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose
 × |client| ... > leaves a pane closed from its own menu closed, in memory and in storage 11ms
 × |client| ... > keeps the tab an answer activated in another pane active 2ms
 ✓ |client| ... > gives the focus back once the dialog is gone, while the control is on the page 0ms
 × |client| ... > leaves the focus with a control that took it before the dialog could give it back 1ms
 × |client| ... > gives no focus to a control taken off the page before it could 0ms
AssertionError: expected '{"kind":"split","dir":"row","sizes":[…' not to contain '"b"'
Received: "{"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"c","view":"projects","state":null}],"active":"c"},{"kind":"pane","tabs":[{"id":"a","view":"projects","state":null},{"id":"b","view":"projects","state":null}],"active":"b"}]}"
AssertionError: expected '{"kind":"split","dir":"row","sizes":[…' to contain '"active":"a"'
Received: "{"kind":"split","dir":"row","sizes":[0.5,0.5],"children":[{"kind":"pane","tabs":[{"id":"c","view":"projects","state":null}],"active":"c"},{"kind":"pane","tabs":[{"id":"a","view":"projects","state":null},{"id":"b","view":"projects","state":null}],"active":"b"}]}"
AssertionError: expected 1 to be +0 // Object.is equality
AssertionError: expected 1 to be +0 // Object.is equality
      Tests  4 failed | 1 passed (5)
```

The third case passes on both trees by design: it holds the give-back itself, which the fix must keep.

Fix (the whole change against `1c95c890`, from `tools/oculus`; the two new test files are quoted after it):

```diff
--- a/tools/oculus/src/lib/ui/frame/quiet-focus.ts
+++ b/tools/oculus/src/lib/ui/frame/quiet-focus.ts
@@ -21,6 +21,23 @@ export function focusQuietly(control: HTMLElement): void {
     control.removeAttribute(QUIET_FOCUS);
 }
 
+/**
+ * Give the focus back to the control that held it before a box was drawn, as a dialog does when it
+ * goes, while that control is still on the page and nothing else has taken the focus since the box
+ * went. It is given once the teardown that asks for it has finished: a focus runs the focus
+ * handlers of the control it lands on at once, and inside a teardown Svelte answers every read of
+ * state changed in the same flush with the value from before the change, so a handler run there
+ * that writes state writes back what the change replaced. A control that took the focus in that
+ * flush, as a view opened by the answer does, keeps it.
+ */
+export function giveBackQuietly(control: Element | null): void {
+    queueMicrotask(() => {
+        const held = document.activeElement;
+        if (held !== null && held !== document.body) return;
+        if (control instanceof HTMLElement && control.isConnected) focusQuietly(control);
+    });
+}
+
--- a/tools/oculus/src/lib/ui/frame/Modal.svelte
+++ b/tools/oculus/src/lib/ui/frame/Modal.svelte
@@ -22,7 +22,7 @@
-    import { focusFirstQuietly, focusQuietly } from '$lib/ui/frame/quiet-focus';
+    import { focusFirstQuietly, giveBackQuietly } from '$lib/ui/frame/quiet-focus';
@@ -66,9 +66,7 @@
     // No dependency, so the body runs once and the cleanup runs when the ground goes.
-    $effect(() => () => {
-        if (came instanceof HTMLElement && came.isConnected) focusQuietly(came);
-    });
+    $effect(() => () => giveBackQuietly(came));
--- a/tools/oculus/vite.config.ts
+++ b/tools/oculus/vite.config.ts
@@ -28,14 +28,37 @@ export default defineConfig({
     test: {
-        environment: 'node',
-        include: ['tests/**/*.test.ts'],
         // A file tagged slow (...)
         tags: [{ name: 'slow', description: 'Left out of npm test; npm run test:slow runs it.' }],
         expect: { requireAssertions: true },
+        // Two projects, each with its own files, so neither list is merged into the other's. A file
+        // named *.client.test.ts runs in Svelte's client runtime, where effects and their teardowns
+        // run (tests/ui/frame/client-runtime.ts), with Svelte inlined so it is resolved with the
+        // browser's conditions rather than loaded as Node loads its server build. Every other file
+        // runs in node against the server build, which renders a component to a string.
+        projects: [
+            {
+                extends: true,
+                test: {
+                    name: 'unit',
+                    environment: 'node',
+                    include: ['tests/**/*.test.ts', '!tests/**/*.client.test.ts']
+                }
+            },
+            {
+                extends: true,
+                resolve: { conditions: ['browser'] },
+                test: {
+                    name: 'client',
+                    environment: './tests/ui/frame/client-runtime.ts',
+                    include: ['tests/**/*.client.test.ts'],
+                    server: { deps: { inline: [/svelte/] } }
+                }
+            }
+        ],
--- a/tools/oculus/README.md (line 15, the verification commands)
-The verification commands are `npm test` (vitest, the tree checks and the files tagged slow left out), ...
+The verification commands are `npm test` (vitest, the tree checks and the files tagged slow left out; a file named `*.client.test.ts` runs in Svelte's client runtime, where effects and their teardowns run, and every other file against Svelte's server build), ...
--- a/tools/oculus/HELP.md (line 296, the checks)
-- `npm test` runs the unit suite over the data layer, the server, the stores, the shell and the views, leaving out the tree checks and the files tagged slow.
+- `npm test` runs the unit suite over the data layer, the server, the stores, the shell and the views, leaving out the tree checks and the files tagged slow. A file named `*.client.test.ts` runs in Svelte's client runtime with no DOM, which is where a case reaches an effect's teardown; every other file runs against Svelte's server build.
```

`tests/ui/frame/client-runtime.ts`:

```ts
// Layer 4, test helper. A vitest environment with no DOM whose modules are transformed as the
// browser's, so a case reaches Svelte's client runtime: $effect runs, flushSync flushes and a
// teardown runs as it does in the page. The node environment of the rest of the suite loads
// Svelte's server build, where no effect runs, so what happens inside a teardown is unreachable
// there. vite.config.ts gives this environment to every file named *.client.test.ts.

import type { Environment } from 'vitest/environments';

const clientRuntime: Environment = {
    name: 'client-runtime',
    viteEnvironment: 'client',
    setup: () => ({ teardown: () => undefined })
};

export default clientRuntime;
```

`tests/ui/frame/give-back.svelte.ts`:

```ts
// Layer 4, test helper. What a Modal does with the focus, without a DOM: while `drawn` holds, an
// effect stands whose cleanup gives the focus back to the control that held it, which is
// Modal.svelte's cleanup. Taking the dialog away is setting `drawn` false, which is what a caller's
// {#if} around its Modal does, and the cleanup runs in the flush that follows.

import { giveBackQuietly } from '../../../src/lib/ui/frame/quiet-focus.ts';

/** A dialog drawn over the page, opened while `came` held the focus. */
export function drawDialog(came: Element | null): { answer: (act: () => void) => void } {
    let drawn = $state(true);
    $effect.root(() => {
        $effect(() => {
            if (!drawn) return;
            return () => giveBackQuietly(came);
        });
    });
    return {
        /** A yes or a no: the dialog taken away, then what the answer does, in one handler. */
        answer(act) {
            drawn = false;
            act();
        }
    };
}
```

`tests/ui/frame/give-back.client.test.ts`:

```ts
// Layer 4, test. The focus a dialog gives back when it goes, run in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts): the cleanup of an effect is where the dialog gives it, and a
// browser runs the focus handlers of the control it lands on at once. Inside a teardown Svelte
// answers every read of state changed in the same flush with the value from before the change, so
// a handler run there that writes the arrangement writes the one from before the close. The cases
// here are the pane menu's Close pane answered yes, where the focus goes back to the menu opener of
// the pane just closed, and the palette answered by showing a tab in another pane, where it goes
// back to a control in the pane the reader was in; each control's focus handler activates its
// pane's tab, as PaneView.svelte's entered does.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { LAYOUT_KEY } from '../../../src/lib/state/workbench/layout.svelte.ts';
import { bench, fakeStorage, pane, split } from '../../state/workbench/layout/layout-fixture.ts';
import { drawDialog } from './give-back.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The control a dialog gives the focus back to: the page's element with only what that uses. */
class Control {
    isConnected = true;
    focused = 0;
    constructor(private readonly onfocus: () => void = () => undefined) {}
    setAttribute = (): void => undefined;
    removeAttribute = (): void => undefined;
    focus(): void {
        this.focused += 1;
        this.onfocus();
    }
}

/** The page's document with only what the give-back reads: the body and what holds the focus. */
const page: { body: object; activeElement: object | null } = { body: {}, activeElement: null };

beforeEach(() => {
    vi.stubGlobal('HTMLElement', Control);
    page.activeElement = page.body;
    vi.stubGlobal('document', page);
});
afterEach(() => vi.unstubAllGlobals());

/** A page of two panes, the second holding two tabs with `b` shown, saved to its own storage. */
function twoPanes() {
    const client = createClientState();
    const storage = fakeStorage();
    client.layout.loadLayout(storage);
    client.layout.apply(bench(split('row', [0.5, 0.5], [pane(['c']), pane(['a', 'b'], 'b')])));
    return { client, storage, id: client.layout.currentPage().id };
}

describe('the focus a dialog gives back', () => {
    it('leaves a pane closed from its own menu closed, in memory and in storage', async () => {
        const { client, storage, id } = twoPanes();
        // The pane's menu opener: its focus handler is the pane's entered().
        const opener = new Control(() => {
            client.layout.touchPane(id);
            client.layout.activateInstance('b', id);
        });
        const dialog = drawDialog(opener as unknown as Element);
        flushSync();
        dialog.answer(() => client.layout.closePane([1], id));
        flushSync();
        await Promise.resolve();
        expect(opener.focused).toBe(1);
        expect(JSON.stringify(client.layout.layout(id))).not.toContain('"b"');
        expect(storage.held[LAYOUT_KEY]).not.toContain('"b"');
    });

    it('keeps the tab an answer activated in another pane active', async () => {
        const { client, storage, id } = twoPanes();
        // The palette's shape: opened with the focus in the first pane, answered by showing tab a.
        const opener = new Control(() => {
            client.layout.touchPane(id);
            client.layout.activateInstance('c', id);
        });
        const dialog = drawDialog(opener as unknown as Element);
        flushSync();
        dialog.answer(() => client.layout.activateInstance('a', id));
        flushSync();
        await Promise.resolve();
        expect(opener.focused).toBe(1);
        expect(client.layout.activeInstance(id)?.id).toBe('c');
        expect(JSON.stringify(client.layout.layout(id))).toContain('"active":"a"');
        expect(storage.held[LAYOUT_KEY]).toContain('"active":"a"');
    });

    it('gives the focus back once the dialog is gone, while the control is on the page', async () => {
        const opener = new Control();
        const dialog = drawDialog(opener as unknown as Element);
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        await Promise.resolve();
        expect(opener.focused).toBe(1);
    });

    it('leaves the focus with a control that took it before the dialog could give it back', async () => {
        const opener = new Control();
        const dialog = drawDialog(opener as unknown as Element);
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        page.activeElement = new Control();
        await Promise.resolve();
        expect(opener.focused).toBe(0);
    });

    it('gives no focus to a control taken off the page before it could', async () => {
        const opener = new Control();
        const dialog = drawDialog(opener as unknown as Element);
        flushSync();
        dialog.answer(() => undefined);
        flushSync();
        opener.isConnected = false;
        await Promise.resolve();
        expect(opener.focused).toBe(0);
    });
});
```

Runs after the fix:

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run tests/ui/frame/give-back.client.test.ts --reporter=verbose   (three runs, each)
 ✓ |client| ... > leaves a pane closed from its own menu closed, in memory and in storage
 ✓ |client| ... > keeps the tab an answer activated in another pane active
 ✓ |client| ... > gives the focus back once the dialog is gone, while the control is on the page
 ✓ |client| ... > leaves the focus with a control that took it before the dialog could give it back
 ✓ |client| ... > gives no focus to a control taken off the page before it could
      Tests  5 passed (5)
```

The red command: the page cannot run the scratch copy's source (the running server serves the main checkout, and this agent may not start one), so the red command in the page was run with the fix's rule patched into the page at run time, quoted under "Probes": `... store holds slides pane: false; DOM draws slides pane: false; GREEN`. The store-level red command calls its handler directly and does not pass through `giveBackQuietly`; the test's first case is the same case through the real function, and it is green above.

The original, unshrunk case (a pane holding the diff and the source of `tools/figures/gen_figures.py`) was not run: it needs the fixed source served, and it differs from the red command only in which two views the pane holds, which the shrink shows the red does not depend on. It is the check for the look on landing, together with the red command above and the palette case under "Probes".

The whole scratch copy with the fix, from `tools/oculus` (the probe files moved out of `tests/` first):

```
npm test -- --reporter=dot                 Test Files  351 passed | 19 skipped (370); Tests  5352 passed | 559 skipped (5911); exit 0
npm run test:checks -- --reporter=dot      Test Files  27 passed | 2 skipped (29); Tests  365 passed | 9 skipped (374); exit 0
npm run check                              COMPLETED 2478 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS; exit 0
npm run format:check                       All matched files use Prettier code style!; exit 0
npm run build                              exit 0
npx eslint <the five changed source and test files>    no output
the spec's ASCII gate over src tests config             no output (the tree has no bin/)
```

No test reaches it: not applicable. No test is written: not applicable.

For the orchestrator, outside the fix:

- The test needs the second vitest project, a new shape of the suite: `spec.md` says the unit suite renders to a string and that a behaviour needing an effect is seen at the look on landing. The project keeps that true for every other file and adds one place where an effect's teardown is reachable. It is a decision the orchestrator may reverse; the other way is no test, with the page red command above as the round's check at the look.
- `menu-items.ts:129-133` gives the focus back from bits-ui's `onCloseAutoFocus`, which bits-ui calls from its focus scope's `unmount` (`bits/utilities/focus-scope/focus-scope.svelte.js:39-48`); that runs in a `watch` body when a menu closes, and from `onDestroyEffect`, a teardown, only when a menu is destroyed while open. The first path is an effect body, where reads are current (probe 3); the second was not reproduced and is not verified.
- With the fix, on Confirm the focus still lands on the closed pane's menu opener, which is on the page when the microtask runs (`after teardown connected: true`), and is then removed with the pane. That is where the synchronous give-back put it as well; where the keyboard should land after a pane close is not part of this defect.

## Cleanup

```
$ grep -rn --exclude-dir=node_modules --exclude=local.yml "DIAG-7c1e" $TMPDIR/diagnose.0WBiXW/tree/tools/oculus
grep exit 1
$ git worktree remove --force "$TMPDIR/diagnose.0WBiXW/tree" && rm -rf "$TMPDIR/diagnose.0WBiXW" && echo removed
removed
$ ls -d $TMPDIR/diagnose.0WBiXW
ls: .../diagnose.0WBiXW: No such file or directory
$ git worktree list | grep -c diagnose
0
```

The probe files (`tests/diag/`, `vitest.diag.config.ts`, `vitest.diag2.config.ts`) lived only in the scratch copy's folder and went with it; the in-page red command, the probe diffs and the extraction diff kept in the session scratchpad were deleted. No `.env` or credential file was copied. The TEST tab was reloaded after its saved layout was written back, as "Where the probes run" says; after the reload no `DIAG` key is in either storage and the patched prototypes are native. No terminal was opened and no process from the scratch copy is left (`ps -ax | grep -F diagnose.0WBiXW` counts 0).

The red command on the original case: carried by the round as its check at the look on landing, since the fixed source cannot be served from here.

Usage: diagnosis agent ae9452d42422c31ea, served claude-opus-5-5; 313,973 tokens, 144 tool uses, 27.5 min (from its completion notice).
