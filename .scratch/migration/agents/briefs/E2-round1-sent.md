# E2, repair round 1 (the one round)

The review is `agents/reviews/E2-refuter.md`. Each item below is a finding with its ruling: what to change, and nothing else. The rules of `agents/spec.md` and of the brief hold: your worktree only, no git command of any kind (`git status` included), no file of the ledger but your report. Every item is done in this round; a fix left for later is sent back. Line numbers are those of `DESIGN.md` in your worktree as it stands now.

## What to change

1. Two true sentences reworded (Spec 1). Put both back word for word as the base has them. Line 258 ends "since a key of a later version that was silently ignored would leave the reader approving something other than what runs." Line 315 reads "so the reader approves exactly what they were shown".

2. The closing sentence of the `open` paragraph (Spec 2). In line 313, take out "A target that is refused rejects `closed`." and put in its place: "A target that is none of the three forms rejects `closed`." The paragraph then gives one word to each case: `closed` for a view that is not listed, for a root the app may not name and for a target of no form; `missing` for what is not there; `rate` past the limit.

3. WebRTC and DNS prefetch (Spec 3). The ruling is that the build step measures them and the section states what was measured; closing is said only of the download link. The last sentence of line 323 becomes two: "Whether the policy also stops WebRTC and DNS prefetch is not claimed here: the build step measures both in Chrome, and this section then states the measurements. Whether a download link to an outside address sends a request from an app with no `connects` is not claimed either: the build step measures it in Chrome and closes it if it does."

4. The restart sentence of the keeping (Spec 4). In line 319, "it is ended by Revoke, by a change to `app.yml` and by the end of the server process, and after a restart the question is asked again" becomes "it is ended by Revoke, by a change to `app.yml` and by the end of the server process. After a restart the app is approved only by the entry the control wrote to `approvals.json`, so it runs while its files are as they were at that press and asks at the first change."

5. The view id in a JSON body (Spec 5, first point). In line 315, `view` carries the view id as it is: take out the parenthesis "(the root key percent-encoded, as in the header `x-oculus-app`)". In line 242, give the header its reason: "and the header `x-oculus-app` carries the view id with the root key percent-encoded as the address does, since a header value cannot carry every character a root key can".

6. The `open` limit's scope (Spec 5). In line 313, "`open` counts toward `apps.opens_per_min` (30)" becomes "At most `apps.opens_per_min` (30) calls of `open` pass per frame per minute, and the rest reject `rate`", in the form line 311 uses for writes; take out the now repeated "and rejects `rate` past it".

7. The nested repository (Proof 1). The `git` payload is keyed only by the roots' folders (`src/lib/server/root/watch/git.ts:188-214`, `src/lib/server/files/roots.ts:45-49`). In line 307, "and a repository below the root's folder has an entry of its own that is not the root app's" becomes "and a repository below the root's folder has no entry, unless its folder is itself a root shown in the file browser, whose entry belongs to that root". Correct the same claim in your report's section "Anything in the brief that was wrong or impossible".

8. `badgeMark` (Standards 1). The tree's `registry.ts:102` is `badgeMark?: string`. In line 276 say the change: "`badgeMark` (`state/workbench/navigation/registry.ts:102`), a catalog key in the tree, becomes a catalog key or a function of the badge client, as `badgeGlyph` is, so the hover words follow the mark".

9. "today" (Standards 2). In line 313, "open in the source tab as that tab shows such a file today (it says the file is binary, `state/sessions/source.svelte.ts:325-326`)" becomes "open in the source tab, which says the file is binary (`state/sessions/source.svelte.ts:325-326`)".

10. Two negation-contrasts (Standards 3). Line 260: "Two findings are about an apps folder and not an app, keyed `apps[<root key>/]`" becomes "Two findings are about a whole apps folder, keyed `apps[<root key>/]`". Line 315: "An entry is found by the app's real folder path and not by its name:" becomes "An entry is found by the app's real folder path, whatever its name:".

11. One name for the file browser (Standards 4). The rest of `DESIGN.md` and the section's own base sentences say "the file browser". Every "Files" that names that view in the section becomes "the file browser" ("a root shown in the file browser", "the order the file browser shows the roots", "the key the file browser gives the root", "a root that leaves the file browser"). The channel name `files`, `apps.read.files` and the code names stay as they are. After the change `grep -n "Files" DESIGN.md` inside the section finds only code names, which the report lists.

12. What History shows for a store write (Behaviour 1). After the sentence of line 311 that gives the record's fields, add: "A store write's record is the one change record that holds sizes where every other holds the two values, and History draws the two sizes for it." Lines 140 and 374 stay: they describe the built code. Your report names the second line as 360; it is 374.

13. The report's list "Shapes named in this step" gains a row for each shape the section states that the list does not carry, each with the alternative considered: a write of the value the store file already holds changes nothing and calls nothing; `setStore` rejects a value that is not JSON with no refusal word of its own, as `setState` does; a machine app may name any root shown in the file browser in `open({ file })`, the root `engine` included, so it can put `config/local.yml` in a source tab in front of the reader (alternative: every root but `engine`); `open` is limited per frame per minute; the Keep control also writes the content approval to `approvals.json`; the header carries the root key percent-encoded and the body's `view` carries it as it is; a target of no form rejects `closed`; History draws sizes for a store write; WebRTC and DNS prefetch are measured and stated, and only the download link is closed.

14. No change, ruled: the sentence of line 236 ("This section is a ruled and unbuilt proposal") and "is not claimed here" in line 323 stay (Standards 5). The brief asked for the first, and both tell the reader what the section does and does not hold.

15. The report states the end state, with a section "Repair round 1": each item above with DONE and the line that shows it, and the last lines of the final `checks.sh` run.

## Verify

From the worktree's `tools/oculus`: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams`, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, expecting `checks: 7 commands passed`; then `LC_ALL=C grep -n '[^ -~]' DESIGN.md`, expecting no output.
