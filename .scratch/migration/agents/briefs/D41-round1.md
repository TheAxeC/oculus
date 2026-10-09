# D41, repair round 1

The refuter's report is `agents/reviews/D41-refuter.md`. Each finding below carries its ruling. Work in `.agents/worktrees/D41` only, under the brief `agents/briefs/D41.md` and `agents/spec.md`; no git command of any kind, read-only ones included (`git status`, `git ls-files` and `git -C` among them); no scratch folder or link inside the worktree (scratch work goes under `$TMPDIR`). The tree as you handed it back is copied read-only at `.agents/worktrees/D41-round0/tools/oculus` for the review of this round. The paths below widen the brief's path list for this round.

1. Every root's edits to one file (Spec 1, Behaviour 2). `held/requests/links.ts` merges the answers of all the roots asked per file, not per root: every edit of every root to a file is kept, an edit identical to another (same range, same new text) is kept once, and when two roots' edits to one file overlap with different text, that file is left out of the preview and the preview's warning line says so, word for word, as a new key `source.md_links_overlap` in `config/text/views/sources/source.yml`: "Two served folders rewrite the same text of {0} differently; it is left as it is." ({0} the file's path under its root). Quote a probe run of the reviewer's scenario (`docs/a.md` holding a link into `guide/` and a hub-rooted backtick of the same file, `guide/` moved) before and after: after, both are rewritten.

2. The warning's words (Standards 1). `link-rewrite.ts` never puts an engine string into a sentence. `links.ts` answers a code for each failure, and each code has its own sentence, word for word, replacing `source.md_links_unanswered`:
   - `md_links_unsent`: "Links in Markdown files under {0} were not checked: the Markdown server could not be asked."
   - `md_links_no_answer`: "Links in Markdown files under {0} were not checked: the Markdown server did not answer."
   - `md_links_no_place`: "Links in Markdown files under {0} were not checked: the move names no place under a served folder."
   {0} is the root's key. The report's table of visible changes lists the three.

3. One table of notice sentences (Standards 2). The sentences of `LspEditNotice` are written once: the table moves from `views/sources/source/language/notice-words.ts` to a module under `src/lib/state/system/machine/refactor/` (or beside `state/system/machine/lsp/edits.ts`, whichever folder has room under the folder rule), and both `link-rewrite.ts` and the views import it; `REFUSALS` goes.

4. The server told of Markdown files changed on disk (Behaviour 1). While a Markdown server runs for a root, a change on disk to a `.md` file under that root (created, changed, deleted, by any writer) is sent to it as `workspace/didChangeWatchedFiles` with the matching change type, through the root's existing watch (`RootWatch`), as VS Code's client sends `**/*.md` events. A file open in a tab is not sent twice (the open-document notices cover it). Quote a probe run: the server asked for a link rewrite once, a `.md` file then edited on disk, a second rewrite: the second's edits sit at the new text's offsets; and a `.md` file deleted after the first ask no longer refuses the second rewrite.

5. Save of an unserved tab (Behaviour 3). `performSave` in `source.svelte.ts` refuses a tab whose `disk` is `unserved` before any request, as it refuses a read-only one, and the save line says the unserved note's sentence; Cmd+S and the palette's Save reach that refusal. Quote a probe run of each, before and after.

6. A restored tab answered while the workspaces load (Behaviour 4). A 404 for a tab whose root's served state is not known yet is held until the served roots are known, and then read as `unserved` or `cannot_open`; when the effect at `source.svelte.ts:247` sets `unserved`, it clears a `cannot_open` it finds for that tab. Quote a probe run of the order (404 first, served list after), before and after.

7. A large Markdown file (Behaviour 5). `adapters/markdown/requests.ts` stats the file and refuses it over `TEXT_LIMIT` before reading it, as `links.ts` `diskText` does.

8. Pulled diagnostics only for a server that pulls. `held/held.ts:413-415`: `workspace/diagnostic/refresh` asks again only when `this.entry.pulls === true`, as every other call of `#pulls` does; a server that pushes its diagnostics and also sends a refresh gets `null` and nothing is pulled. No test; quote a probe run with a stub entry without `pulls` before and after.

9. A test waits on a signal (Standards 3). `tests/server/machine/lsp/lifetime.test.ts:397` and `:410` wait on a promise the test's own stub resolves when the read is asked, never on a count of turns; quote the file's run.

10. The report (Proof 1, Standards 4). Rewrite the report whole and hand it back as your final message; the first line states what is done after this round. Remove the claim that case 10 is wrong (line 17 resolves to an existing folder and is unmarked; line 16 is the marked one) and quote the counts as your rerun prints them. Name no git command as run.

Not sent: G36's Code line gaining `held/requests/links.ts` (Spec 2), which the orchestrator writes into `agents/guarded.md` at landing with G2, G3 and G36's Doc text; the reviewer's points under "Declined to judge", taken at the look on landing.

Run the scoped tests while working. After the last change run `npm run diagrams`, then the verify list of the brief's "Verify before you report" once, plus the scoped files of the brief; a failed command in a file you changed is fixed and rerun alone, then the list runs once more. Never run the whole unit suite. Never start Electron, the app or a dev server, and install nothing; never touch ports 8787 or 8790; never print, open, grep or hash `tools/oculus/config/local.yml` (`--exclude=local.yml` on every grep over `config/`); never open the hub's `secrets` folder or `~/.oculus`; never use `pkill -f`; tmux only with `-L` or `-S`. The report states the number of full-list runs and quotes the outputs.
