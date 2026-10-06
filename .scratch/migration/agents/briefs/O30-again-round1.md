# O30, repair round 1 of the brief prepared again

The review is the section "The brief prepared again after the back-out, refuted" of `agents/reviews/O30-refuter.md` (main checkout ledger); read it whole first. Every rule of `agents/briefs/O30.md` holds unchanged: the builder never starts the Electron app by any route, never imports, requires or runs `tests/tiers/landing.mjs` (its top level runs the whole landing list, the slow tests among them), runs no git command, and breaks no code to watch a test fail.

## The findings and their rulings

1. **Spec 1, `tests/server/desktop/start.test.ts` `printed()`.** The wait settles on the awaited text when a `[screen] dialog` line came before it in the same chunk, or when both were already in `lines` at the call, since `seen()` and `asked()` read presence and not order. Ruling: the wait settles only when the first line holding `text` comes before the first line opening `[screen] dialog`, and fails at once when a dialog line comes first, at the call and on each chunk; the head comment states the rule by order. The cases 18.1 to 18.4 still give their results, and a run with `'[screen] dialog\n<text>\n'` in one write, and one with both lines printed before the call, now reject. Each is run on a verbatim copy of the changed `printed()` in a scratch module under `$TMPDIR`, quoted, and removed after.
2. **Spec 2, the report.** Item 18 asks for the lines that show a dialog's message is printed before the recorder's line. Ruling: the report quotes them, read with `sed -n`: `src/desktop/dialogs.ts` where the message is logged and where `dialog.showMessageBox` is called, `src/desktop/app.ts` where `print` writes a non-error line with `console.log` and where it is handed to the dialogs, and `tests/server/desktop/app-harness.ts` where the recorder writes `[screen] dialog` with `process.stdout.write`; and says both reach the one stream in that order.
3. **Spec 3, the report.** The `unused-exports.sh` lines for `parent.ts` (`parentOf`, `askParentToPick`, `ParentPort`) are "not investigated". Ruling: the report states the cause with the commands that show it: the tool's entry is `package.json`'s `main` and it does not read `src/server.ts`, which imports the three (`grep -n` of each name in `src/server.ts`).
4. **Standards 1, the report.** Ruling: the report quotes the history-word grep `agents/spec.md` "What every package obeys" names over the comment lines and test titles this preparation added or changed, each hit judged, and the grep of the renamed `last` field (`\.last\b`, `last:`, `started.last`, `built.last`) across `src`, `tests`, `config` (`--exclude=local.yml`), `HELP.md`, `DESIGN.md` and `README.md`.
5. **Standards 2, comment wrapping.** `start.test.ts`'s `printed()` comment and `landing.mjs`'s head comment are rewrapped as whole paragraphs at 100 columns, so no line inside a sentence ends short (`start.test.ts:167`, `landing.mjs:11`).

## Paths this round writes

- `tools/oculus/tests/server/desktop/start.test.ts`
- `tools/oculus/tests/tiers/landing.mjs` (its head comment only)
- `tools/oculus/.scratch/migration/agents/reviews/O30-report.md` (in the worktree's ledger copy: a section "Repair round 1" appended)

## Verify before you report

From the worktree's `tools/oculus`, after the last change: `npx prettier --check` and `npx eslint` over the two files, `LC_ALL=C grep -n '[^ -~]'` over them, `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts`, then once `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`. Quote each. `pgrep -fl 'Electron|src/server.ts'` prints nothing of this round's at hand-back.
