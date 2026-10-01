# S3b, repair round 1

The refuter's report is `agents/reviews/S3b-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command of any kind (spec.md, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/S3b`. Your paths are the brief's, widened by this round where a ruling names a file. Rewrite your report `tools/oculus/.scratch/migration/agents/reviews/S3b-report.md` for the whole step after the round, with a "Repair round 1" section that names each finding below, what changed, and the test that fails without the change (quoted from a run on the code before this round's change, in the test's final form).

Two premises of the brief were wrong, the orchestrator's, not yours: rail's record key is `'rail'` (`rail.ts:28`, `:115`), and the audit mute records nothing (`audit-mute.ts:90`, `writes.ts:548-552`). Rulings 6 and 7 correct the sentences built on them.

## Spec

1. Spec 1, the findings readers (`config-key.ts:104-114`, `:201-208`). No catch around the finders: a finder that throws on the merged config after the edit refuses the write with its own message, as a reader of `READERS` does, whether or not it threw before; a finder that threw before the edit and gives findings after it compares nothing against an empty "before" (the findings it gives after are compared with none, so only a finder that ran on both sides is compared). One comment above the two arrays says they are one list in two shapes (readers that throw, readers that give findings) and why. A test where a finder throws after the edit (for example a `docs:` path in the scratch engine that `statSync` cannot read, chmod 000 on its folder) and the write is refused with that message.
2. Spec 2, `READERS` holds only readers a config value can make throw. Remove `vocabCatalog`, `glyphCatalog`, `iconCatalog`, `catalogOf` and `glyphNames`, which cannot throw. Keep `iconSet` only if a config value (an icon name the map points at that has no file) makes it throw; then its comment names that value, and a test writes such a value and is refused; otherwise remove it too. The comments at `config-key.ts:11-17` and `:75-80` say what the list holds, true to it. Judgment call 7 of the report is rewritten.
3. Spec 4, the read-back comparison (`config-key.ts:186-193`). Replace the JSON copy with a recursive copy of maps and arrays that keeps every scalar as it is (`Infinity`, `NaN`, `-0` included) and shares no object, so an alias-shared map is still caught. Tests: a file holding `a: .inf`, `a: .nan` and `a: -0` beside the written key: written; the alias-of-map case still refused as not_kept.
4. Spec 3, `tests/routes/edit/write.test.ts:727-736`: the config-key body tests build their target with `engine` set to a scratch engine (`configTarget()`), never `engineDir()`.

## Proof

5. Proof 1 and 2, the diagram check. Remove the two `plain(...)` calls and the `plain` import from `config-key.ts:61`, `:314-315`: they do nothing, and the record is written as `rail` and `deck` write theirs. End the cause in the diagram tool: `utils/diagrams/writes.mjs` parts every pair of arrows that run along each other in the write diagram, the pairs between other modules' arrows included (the four the reviewer quoted: `feeds.ts` to file on disk along `feeds.ts->json.ts` and along `feeds.ts->entries.ts`, `config-key.ts->json.ts` along `deck.ts->json.ts`, `entries.ts->changes.ts` along `manifest.ts->changes.ts`), by the parting the tool already applies to pairs that leave one module. If the tool draws a dotted arrow for a local variable that shadows an import, it stops doing so (a local is no call to the import); keep the local named `scalar`. `utils/diagrams/writes.mjs` and `tests/checks/diagrams/` join your paths. `npx vitest run tests/checks/diagrams` passes with the calls removed; quote its failure before the tool's change, with the calls removed.

## Standards

6. Standards 1, `changes.ts:67-71`: the `ChangeRecord.key` doc says `rail` for the rail list and the config file's name for a setting.
7. Standards 2, `HELP.md:256`: the audit mute is not among the recorded writes; say instead that muting an audit finding is not recorded, beside the source tab and scratch note sentence.
8. `yaml-edit.ts:107`: `Written` is not exported, since nothing outside the file imports it.

## Behaviour

9. Behaviour 1: the report's user-visible table states that an absent or non-string `usage_refresh_model` now stops the server with "usage_refresh_model must not be empty" where it stopped with a `TypeError` before.
10. Behaviour 2: an undo whose writer throws reading or writing its file (a `config-key` or a `rail` change, the file made read-only) answers `500 { error: 'unwritable' }`, as the write path does, through one catch in the undo route path (`undo.ts` or `writes.ts:519`). A test for each of the two kinds. `rail.ts`, `undo.ts` and `tests/routes/edit/undo.test.ts` are in your paths for it.

## Verify before you report

From the worktree's `tools/oculus`: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams`, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, `checks: 7 commands passed`, its lines quoted; and the brief's verify items 3 to 5, with `tests/checks/diagrams` added to item 3's run.
