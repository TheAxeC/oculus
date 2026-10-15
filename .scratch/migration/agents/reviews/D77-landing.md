# D77 landing

Position: oculus migration, step D77 (the Sessions view and the title bar, with part 9 the rail pages, part 10 the Repositories change groups and part 11 the graph), landed; queued next: Q72 (the architecture re-read), then O33. The orchestrator stops after this landing at Axel's word ("Please continue until the step is landed").

## Open items

None.

## Not done

- The look did not reach the Sessions page's parts (Pin across hubs, an agent row opening its transcript, the composer's New worktree with an unlisted folder, the Session details text size, the Transcript view without flicker), since a look never presses the Sessions rail; nor the window buttons off macOS, which need the app on Windows or Linux. Booked in `agents/reviews/owed-looks.md` under "To take". Each is held by the builder's rows and runs and the reviewers' verdicts (met).
- A rail page's tab for a collection the hub does not list draws "Unknown view: <key>" (seen on the Literature page of a scratch hub with no `literature` collection). Main's Incoming page named `literature` the same way before D77, so the defect predates this step; it is folded into O33 (`plan.md`, O33, Z468), whose part (5) makes hubs that list only some collections.

## The check of Steps 1

ListAgents showed no agent of D77 running before the worktree's changes were committed (wip commit 8cd58767b).

## What landed

186 paths, +5,723 -1,754 against main (the ledger left out), from base abe5c9651: the transcript flicker ended at its diagnosed cause; the commit message's account key `commit_message_account`; the composer's New worktree, keeping an unlisted folder and the worktree it made; Pin across every hub; an agent row opening the agent's own transcript; the window strip as VS Code's title bar in its own tokens (Z897), with opaque colours sent to the window buttons off macOS; the Session details at `--fs-sm`; the Literature page, Registries, Tasks and Memories on Academic Life; the Repositories view's indented groups, the count before the row menu, right-click on a selection and the status read record by record with no output cap; the graph's commits once and its names in VS Code's graph colours.

## What was found, and the fixes at landing

The review over round 1 raised eleven findings and declined one point; all are closed at landing (`agents/reviews/D77-refuter.md`, Closed):

- Spec 1: a closed tab's home is now checked by the sibling tabs its pane kept (`closed.ts`, `reopen.svelte.ts`); the reviewer's three-pane scenario reopens the tab in the focused pane.
- Proof 1: a row that reads records cut across three-byte chunks (`git-failure.test.ts`).
- Proofs 2 and 3: replaced by the landing's own runs and measurements below.
- Standards 1 to 3: DESIGN.md:748's path, DESIGN.md:139 and run.ts's two call sites, git-write.ts's comment rewrapped.
- Standards 4: the record-by-record rows tagged slow, the Cancel row aborting on the first record.
- Standards 5: guarded.md's Test lines for G13, G33, G41, G47 and G79 (Z899).
- Behaviour 1: Stage All of Untracked reads folder entries (`--untracked-files=normal`), its add has no time limit and stops on Cancel (Z898). Measured through the code on scratch repositories: 200,000 files in one new folder (35,000,000 bytes of `-uall` output) staged in 21,393 ms; 30,000 loose files in the root staged in 10,650 ms. Loose files in one folder remain one pathspec each; the add is not limited in time.
- The declined `#rrggbbaa` point: `strip-colours.ts` paints the strip over the page's background and the window's fill and sends opaque `#rrggbb`, so no alpha byte reaches Electron.

Further fixes at landing: the hub's `docs/DATA-MAP.md` page table and the head comment of `tasks/tasks.yml` brought to the new page names; two comment lines of `closed.ts` rewrapped to 100 columns (red in `comment-width.test.ts`); `lsp-edit.test.ts`, `writing-fix.test.ts` and `latex-approvals.test.ts` tagged slow after a 5 s timeout under the full suite's load, each passing alone (11, 10 and 19 passed). Thirteen fixes in all.

## The look

On a scratch oculus on port 8796 over the gate, with a scratch home and two scratch hubs; Axel's server on 8790 was not touched.

- The rail: thirteen buttons, Registries eighth, Literature ninth.
- vscode-red: the strip `#770000` with `#cccccc` words and no line, as VS Code's Red theme draws its title bar; the graph colours `#59a4f9`, `#b180d7` and `#ea5c00`.
- nord over the wallpaper: the strip translucent (alpha 0.76), and the colours sent to the window buttons opaque (`#383e4d` and `#eceff4`).
- Repositories:
  - Staged, Changed and Untracked are indented under Changes, and the change count sits before the row menu.
  - Two untracked files selected with Shift and right-clicked to Stage Changes were both staged.
  - Stage All on Untracked staged the 13 untracked files, the new folder's included, and left the changed files unstaged.
- Graph: Outgoing Changes holds the changed file, each commit appears once, `master` is blue and `origin/main` purple.
- Literature: Literature search and Lit Watch on the left; the right pane read "Unknown view: literature" on this hub (see Not done).
- Academic Life runs from Funding to Tasks, with Memories last. Registries runs from Venues to Resources.
- A tab closed in the Explorer page's right pane, then the Registries page opened, then Go Back twice: the tab reopened in its right pane.

## Verification

In the gate worktree at main's head with the step and every fix at landing, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (1.3 s)
ok      npm run format:check (32.0 s): All matched files use Prettier code style!
ok      npm run lint (74.3 s)
ok      npm test (227.1 s)
ok      npm run check, then npm run build, then npm run test:slow (421.1 s)
ok      npm run test:checks (467.3 s)
test:landing: 467.3 s; every command passed
```

The staged tree on main equals the gate's: `git diff --cached HEAD --binary -- . ':!tools/oculus/.scratch' | shasum` prints 62487f277e92 on both. The verify list was not changed. Axel's Contents block in `docs/palette.md` is untouched.

## Agents

- Builder a8345a31acc9caff4 (claude-opus-5-5):
  - first run: 208,864 tokens, 159 tool uses, 21.8 min;
  - resumed run (round 0 and parts 9 to 11): 344,995 tokens, 880 tool uses, 234.1 min;
  - round 1: 110,977 tokens, 336 tool uses, 117.5 min.
  - Its first report did not pass its bar.
- Brief check a54a1d685d11d12dd (claude-opus-5-5): 299,890 tokens, 105 tool uses, 15.2 min.
- Reviewer a24c5c9f54be2a471 (claude-opus-5-5): 259,610 tokens, 159 tool uses, 31.2 min; 12 findings (Spec 1, Proof 3, Standards 5, Behaviour 3).
- Reviewer over round 1 a71d02f07696002c8 (claude-opus-5-5): 124,724 tokens, 129 tool uses, 27.8 min; 11 findings (Spec 1, Proof 3, Standards 6, Behaviour 1), all closed at landing.
- Diagnosis aa071f530aa99f740 (claude-opus-5-5), part (1), `agents/reviews/D77-diagnosis.md`: the cause found.

## Next

The orchestrator stops here at Axel's word. On his go: `/spec` Q72, then O33.
