# Q70 landing

## Open items, verbatim from the state file

None.

Booked list: 3, carried for O32 (its skill half, waiting on the Ordo release that carries plan 2.B), Q71 (the architecture made sound, now also the file-poll helper's folder and the page load's import of the server context) and Q72 (its re-read before the release).

## NOT DONE

- Item 2's three git watcher cases: the cause is shown by a probe (fseventsd delivers events for writes made before a watch opened: 7 such events in 10 rounds, rerun by the reviewer) and by cases that hand the watcher those events, but no load run made the base fail and the fix pass: at loads where fseventsd delivers, both sides passed; where it delivered nothing, both failed.
- Item 4's start over five seconds was not reproduced in 60 loaded starts; the server-side cause found under load is fixed, and what remains before the page reads up is the browser's own start time on a loaded machine.
- The page's `seedConfig` call in `+page.svelte` has no case of its own (the node cases stand behind the socket's side, and the page load's hand-on is proven).
- Axel's dev server keeps its old server code until it restarts: the mail poll, the git watcher's rule and the request's single config read reach it then. The bookmark fix is page code and was seen working there.

## What landed

Q70, cherry-picked from `.agents/worktrees/Q70` at base `759efa1e` by `tools/oculus/.scratch/migration/land.sh Q70 759efa1e <runs> --no-browser` (+2,108 -1,317 over 22 files), then fixed at landing (+142 -93 over 12 files), the browser suite run by hand.

- The mail poller polls its notes file every 500 ms on a clock, through `server/watch/file-poll.ts`, which the git watcher's workspaces poll uses too; a write made while a watch would be arming is no longer lost.
- The git watcher drops an event whose path (the path itself, not a link's target) or nearest remaining folder last changed before the newest read of its root that answered began; a failed read hides nothing.
- A bookmark written into the bookmarks file by hand reaches an open page: the page hears every `files` message.
- A request reads the configuration at most once, and an API route not at all; under load the socket's wait to open fell from about 300 ms to about 15 ms in the builder's paired runs.
- A starting page keeps the configuration it was built from over an older push the hub replays, the read riding in the page data only then.
- After a reconnect, every channel takes the first message the server sends whatever its number, so a page open across a server restart follows the new server at once. Before this, it ignored every channel's messages until their numbers passed the old server's, which was a defect on main before this step.

## What was found

The first review found the event rule dropping a symlink made inside a root (shown on a real watch: base 3 of 3, fix 0 of 3), a failed read counted as a read, the stale config of a starting page left as a limitation, and a lost diagram edge; the round closed each. The run over the round found the seed's bound kept across a server restart, 88 KB of page data on every load for a case that needs it only after a config edit, and proof gaps; each is fixed at landing, and fixing the first found the older defect of the entities store after a restart. The file-poll helper's folder and the page load's import of `server/core/context.ts` are booked in Q71. Every finding is under the Closed heading of `agents/reviews/Q70-refuter.md`.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 301 passed (301); Tests 4768 passed (4768)
npm run check                       COMPLETED 1374 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
LC_ALL=C grep -rna '[^ -~]' src tests bin | wc -l    0
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run diagrams                    layers gains routes -> server/core and server/accounts -> server/watch; channels and writes unchanged
npx playwright test                 386 passed (6.2m)
node bin/revert-check.mjs           entities 1 / 0 unproven; client config-seed 4 / 0; routes config-seed 3 / 0; page 2 / 0; git.test 2 / 0; git-events 7 / 0; git-workspaces 11 / 0
curl /__data.json on the served build (tests/browser/helpers/serve.ts)    181340 bytes (the reviewer's base: 181311)
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
ListAgents                          no subagent listed
```

## The look

On Axel's dev server, after one reload: a bookmark written into `~/.oculus/bookmarks.yml` at 05:05:01 was in the open page's Bookmarks menu at 05:05:21 without another reload; the probe entry was then taken out, the file back to its ten entries. The other changes draw nothing new: the mail poll, the watcher's rule, the request's config read and the reconnect are behaviour under the view. Page and theme left on References and vscode-dark-modern.

## What is next

Q71: the architecture made sound and kept sound, through /spec.

## The look owed, done 2026-09-28

On the TEST page of Axel's Chrome on 8790, light theme.

- Help carries the sentence that the server polls the file every half second.
- A bookmark appended by hand to `~/.oculus/bookmarks.yml` appeared in the open page's Bookmarks without a reload; the file was then put back from a copy (`cmp` identical, 40 lines) and the bookmark left the page.
- After a reload the page came back on TEST with its rail. The time the configuration seed takes was not measured.
- Nothing found.
