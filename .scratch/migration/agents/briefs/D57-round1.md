# D57, repair round 1

The refuter's report is `agents/reviews/D57-refuter.md`. Each finding below carries its ruling. Work in `.agents/worktrees/D57` only, under the brief `agents/briefs/D57.md` and `agents/spec.md`; no git command of any kind, read-only ones included (`git status`, `git ls-files` and `git -C` among them); no scratch folder or link inside the worktree (scratch work goes under `$TMPDIR`). The tree as you handed it back is copied read-only at `.agents/worktrees/D57-round0/tools/oculus` for the review of this round.

1. The first pane of a New page (Behaviour 1). The behaviour stays as built: the root pane of a page made by New page carries no mark and stays when its last tab is closed. `docs/window.md:41` says so: after the sentence that ends "a tool view included." add, word for word, "The first pane of a page made by New page stays the same way." The report's table of host- or user-visible changes gains the row of the reviewer's probe P1, before and after: a New page whose Status tab is closed after a file was opened beside it kept only the file's pane before; after, the Status pane stays as an empty documents pane beside the file's pane.

2. The report. Rewrite the report whole and hand it back as your final message; the first line states what is done after this round. Name no git command as run.

Not sent: the reviewer's points under "Declined to judge", taken at the look on landing.

After the last change run `npm run diagrams`, then the verify list of the brief's "Verify before you report" once; a failed command in a file you changed is fixed and rerun alone, then the list runs once more. Never run the whole unit suite. Never start Electron, the app or a dev server, and install nothing; never touch ports 8787 or 8790; never print, open, grep or hash `tools/oculus/config/local.yml` (`--exclude=local.yml` on every grep over `config/`); never open the hub's `secrets` folder or `~/.oculus`; never use `pkill -f`; tmux only with `-L` or `-S`. The report states the number of full-list runs and quotes the outputs.
