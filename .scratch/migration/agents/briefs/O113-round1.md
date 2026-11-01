# O113, repair round 1

The rules of the brief and `agents/spec.md` hold. The paths widen by the files named here. No page, no breakage testing, no other agent. Update your report at the same path with each ruling's result, the same report shape, and the number of full-list runs.

1. Behaviour 1, `SessionList.svelte:241` and the reopen path. A repeat press on a session whose pinned Session tab is open wipes the tab's `closed` and `sections`, since `openOpened` replaces the tab's state. Change: `openView`'s options gain a `keep` flag, `true` meaning a tab already open takes the given fields over the state it holds (`{ ...held, ...state }`) in place of replacing it, in each reopen path of `src/lib/state/workbench/layout/open/opening.ts` that restates a found tab (lines 268, 358, 459, 495). A held state that is no map reads as empty through `instanceMap`. Pass it where a pinned Session tab is opened on a session: `SessionList.svelte:241`, `SessionList.svelte:338` and `context.ts:703` if that line opens `session-detail`, read each first. No other caller changes. Its doc comment says what it does. A test covers it, since the failure loses the reader's arrangement: a repeat open with `keep` holds `closed` and `sections` and a repeat open without it replaces; run it on the unchanged code first and quote the failure.
2. Behaviour 2, `TimelineTurns.svelte:79-81`. A session with no events leaves `shown` and `stuck` at the old session's values. Change: the zero test leaves the guard, so the id compare and `shown = id` run for every session, and only the write of `scrollTop` is held to `count > 0`.
3. Standards 1, `src/lib/state/client/selectors.svelte.ts:99-100`: the word "six" goes from the sentence, so it names no count of views. Name the file in the report.
4. Standards 2 is recorded, nothing to change: state in the report whether the width test was rerun alone between runs 1 and 2.

Paths added: `src/lib/state/workbench/layout/open/opening.ts`, the file that declares `openView`'s options, `src/lib/state/client/selectors.svelte.ts`, the `context.ts` of ruling 1 if changed, and the test file you add under `tests/state/workbench/`.

After the last change: `npm run diagrams && npm run docs:palette && npm run test:quick` over the changed files, once.
