# D67 landing

Position: oculus/migration, step D67 (`~/.oculus` bookmarked: a bookmark of a root's top). Next: D63 (apps in the shell), building; then D64, Q72, O33.

## Open items

None.

## Check of Steps 1

The builder a5bdbb53b40134897 and both reviewers (a11a9c46a17c44a11, acdd14ebdba111a0a) had completed before the cherry-pick; the only agents running at the commit are D63's builder (ad834ceece00db11d) and none of D67's.

## NOT DONE

- The real entry, case 11: the root `oculus-state` over `~/.oculus` in Axel's workspace and the bookmark `~/.oculus` in the hub's `.oculus/bookmarks.yml` are added at D63's landing, which closes the private folders to apps (Z817), and looked at there.

## What landed

D67's whole range from base c8b4da890 and the fixes at landing, 33 paths, +300 -141 against main, the ledger left out, in the commit "Land D67, a bookmark of a root's top":

- A bookmark entry with a `root` and no `path` names that root's top; the Files view's Bookmarks section and the rail's Bookmarks menu draw it as the root's folder, a press selects and opens the root's row, and the root's row carries the star and Add or Remove Bookmark.
- `placeOf` in `state/sources/explorer/view/reveal.ts` is the one rule for a place's text.
- The undo of adding a root's bookmark takes it out again; the records of a rename undo in any order (`ChangeRecord.was`, `renamedEntry` in `server/edit/writes/undo.ts`).
- `.gitignore` and `tools/oculus/.gitignore` read `node_modules`, so a worktree's `node_modules` link is never staged (open item 55).
- The diagrams `layers`, `writes` and `layer-server` regenerated.

## What was found

- At landing, `tests/server/machine/lsp/adapters/markdown-created.test.ts` timed out on main with and without D67. `agents/reviews/D67-diagnosis.md`: the cherry-pick had replaced main's real `tools/oculus/node_modules` with the worktree's link, and node's permission model refuses the Markdown and YAML servers their scripts through a link. Open item 55, ruled (a) by Axel: main's `node_modules` a real copy of the same install again, the `.gitignore` pattern fixed, and the code fix for a linked `node_modules` (`server/machine/lsp/servers.ts`) folded into O33.

## Verification on main, from `tools/oculus`

```
$ npm run test:landing
test:landing: 6 commands, from /Users/axelfaes/workspace/research-hub/tools/oculus
test:landing: 441.0 s; every command passed
```

No A/B (no `bench:`).

## The look

On a scratch oculus at main's head with the step applied (port 8796, HOME under the scratchpad): the star on the hub root's row and its press writing the entry with no `path` line, the section's row with the folder glyph, the root's menu with Remove Bookmark, the rail menu's row and title, a missing entry disabled with its new title, a press from the rail and from the section opening the root's row from a scrolled sub-folder and with the root collapsed, the second press removing the entry. Not looked at: the real `~/.oculus` entry (at D63's landing), the dark theme.

## Agents

- Builder a5bdbb53b40134897 (claude-sonnet-5-5): 303,674 tokens, 96 tool uses, 16.7 min; round 1: 139,189 tokens, 58 tool uses, 23.1 min.
- Brief check a47181bc2fd7feaf6 (claude-opus-5-5): 192,390 tokens, 86 tool uses, 9.0 min.
- Reviewer a11a9c46a17c44a11 (claude-opus-5-5): 235,203 tokens, 84 tool uses, 21.0 min.
- Reviewer over round 1 acdd14ebdba111a0a (claude-opus-5-5): 244,556 tokens, 87 tool uses, 15.4 min.
- Diagnosis ae9dcf77a17c614d7 (claude-opus-5-5): 237,400 tokens, 82 tool uses, 32.0 min.

The first report did not pass its bar (one repair round). Fixes at landing: 7 (Spec 1, Behaviour 1, Proof 1, Standards 1 to 3 of the run over round 1, the stale diagrams).
