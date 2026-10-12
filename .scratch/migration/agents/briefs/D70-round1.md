# D70, repair round 1

The review is `agents/reviews/D70-refuter.md` in the main checkout (/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/D70-refuter.md); read it whole. Each finding below is ruled; do exactly what the ruling says, in the same worktree, under the brief and spec.md as before. The paths this round writes are the brief's, and `tools/oculus/tests/routes/hubs/machine-answer.test.ts`, `tools/oculus/tests/state/system/settings/machine-section.test.ts`, `tools/oculus/tests/server/files/ops.test.ts` and a test file for the save key check where item 3 says.

1. Spec 1, `hubs` leaves out a hub whose rows were all dropped. `hubs` of a joined list (`accounts`, `calendars`, `mail`) names every hub whose `local.yml` sets the key, whether or not any of its rows is in force (a repeated label, a row that does not read), in the order of the workspace's hubs. The "Set in" line and the Edit controls of `Item.svelte` follow from it, so in case 10 the `calendars` row says "Set in a, b." and offers an Edit control for each file. Take the set from the read of each hub's file (what `readMachine` or the joined read already knows of each file), never from parsing the value text.

2. Spec 1b and the literature masking test. Open item 63 asks Axel whether the literature keys stay masked; if he keeps (b), G3's text gains the sentence that the workspaces answer of `GET /api/fs` never carries the value of a literature key. Write that test now as if he does: one row in `tests/routes/hubs/machine-answer.test.ts` that plants a value for each of the six literature keys in the primary's scratch `local.yml` and asserts that none of the six values is anywhere in the answer's text, and that `literature.mailto`'s value is. It is filed under G3 at landing. The wiring of `machineValues` in that test then has this row as its reason; keep it. Run the row on the unchanged base first where it can run (it cannot compile there if `machineValues` does not exist; then say so) and quote its failure or its compile refusal, then its pass after the change.

3. Proof 1, the save and create key check has no test. G3's text says "a source-tab save of one is refused while a key in it does not read", and no test row checks it. Add one table row (or a `it.each` of both) in the test file that holds the source save route's tests (`handleSource`), named for the check: a source-tab save of a hub's `.oculus/local.yml` with `port: abc` is refused with the sentence naming `port` and the file is unchanged, and a create of `.oculus/local.yml` with `port: abc` in a hub that has none is refused and nothing is created. This behaviour is preserved, so quote its passing run on the base copy where it can run there and after the change. Correct the report's "Rows that stay" accordingly.

4. Proof 2, the report says `replace` through the hub root answers `outside`. It does not: correct judgment 11 to say `lsp-edit` and `writing-fix` answer `outside` through the hub root and `replace` writes the file.

5. Proof 3. Run the two changed assertions (`hub-secrets.test.ts` 'is withheld from the library rules ...' and the `markdown-requests.test.ts` `readDirectory` row) on the base copy where they can run, and quote the result in the report.

6. Standards 1, comment width. Rewrap as whole paragraphs at 100 columns every comment the step edited, the six lines `comment-width.test.ts` names (`options.ts:198`, `local.ts:137`, `git-index.ts:395`, `machine-values.ts:2`, `fs-transport.ts:46`, `markdown-requests.test.ts:4`) and the short line of `machine-section.test.ts:3`. Run `npx vitest run tests/checks/source/comment-width.test.ts` and quote it passing.

7. Standards 2, `local.ts:137-138` is false. Rewrite it to what is true: the Settings answer of `GET /api/fs` never carries a literature key's value (masked in `machine-values.ts`); the file itself is an ordinary file of the workspace, so a source tab that opens it receives its text, keys included; no log holds a value.

8. Standards 3. Rewrite the head comment paragraph of `src/lib/server/files/workspace/machine-file.ts` to name only the modules that now ask it (the source tab's key check, an app's reach, `saveBytes`, the config checks), and `tests/server/files/ops.test.ts:3-4` to what `ops-paste.test.ts` now holds. Grep every remaining "guard", "protected", "never changes" and "machine file" sentence in comments and docs and fix each one the step made false.

9. Standards 4, `NO_MACHINE`. Freeze it deeply (`Object.freeze` on the object and on each member) or build it per call, as spec.md's principle says; choose the one that keeps the zod `.catch` and the `??` fallbacks typed.

10. Standards 5, the report. Give every changed file with its line count, and for each new id or key (`values`, `hubs`, `MASKED_KEYS`, the catalog's `control`, `whole`, `fields` on the `local.yml` entries) the statement spec.md asks: not empty, not duplicated, not colliding with a configured or reserved key.

11. Behaviour 1 and 2. Add to the report's "Visible changes": the `lsp_edit_readonly` notice with its before and after and where it shows (a language-server edit over a read-only tab), and `GET /api/oculus-config/local.yml` and the config listing, which now answer oculus's own `config/local.yml` (404 and left out before).

Then run the brief's "Verify before you report" once more as spec.md:25 says, plus `npx vitest run tests/checks/source` and the slow files you touched, and append a section "Repair round 1" to your report at the same path, one row per numbered ruling above with the change and the evidence, and the full-list run count.

## Sent after Axel's ruling on open item 63, (a): the literature keys are not masked

- Remove `MASKED_KEYS` and the masking from `machine-values.ts`, so every literature key with a value in force shows it in the Settings rows.
- Ruling 2 above (the masking test) is withdrawn; `machine-answer.test.ts` gets no masking row.
- Ruling 7's comment says the Settings view shows the literature values, the file opens in a source tab like any file, and no log holds a value.
- Rewrite every sentence that says a literature value is never shown: the `options.yml` header and the six literature help lines, the HELP.md Settings and `local.yml` bullets, DESIGN.md's `local.yml` bullet, and the comments in `fs.ts`, `rows.ts`, `fs-transport.ts` and `machine-values.ts`. HELP's sentence on the Literature search sending keys in a header or parameter stays, since that route is unchanged.
