# Q56, the Files view asks again after a read that failed, and the bookmarks file is watched

Everything in the brief is done.

Three checks of the node suite are red for want of hub data and not for anything this step did: `tests/integrity.test.ts`, `tests/server/entry-edit.test.ts` and `tests/server/yaml-edit.test.ts` read the real hub, and the worktree carries no `registries/`, `projects/` or `feeds/` (`ls -d /Users/axelfaes/workspace/research-hub/.agents/worktrees/q56/{projects,registries,feeds}` prints three "No such file or directory"; the failure is `ENOENT ... worktrees/q56/registries/venues.yml` and `expected 0 to be greater than 50`). They are read-only probes, so they are reported and not repaired.

## DONE

| Deliverable | Command | Output |
| --- | --- | --- |
| A failed read holds no round and is asked again | `npx vitest run tests/state/fs.test.ts` | 58 passed; five new cases over the retry, the storm guard and the disk round |
| The reader can ask, in the section's row style | `npx playwright test tests/browser/files.spec.ts -g "asked again by its own control"` | 1 passed |
| The same for bookmarks, notes and workspaces, the workspaces section gaining its sentence | `npx vitest run tests/views/files.test.ts` | 41 passed; three new cases |
| The line goes when a later read succeeds | in the same state and browser cases (`error: ''` after the retry, `toHaveCount(0)` on the sentence) | passed |
| The bookmarks file watched, reaching an open page | `npx vitest run tests/server/watch/bookmarks.test.ts`; `npx playwright test tests/browser/files.spec.ts -g "reaches a second page"` | 4 passed; 1 passed |
| The watcher built and closed once by the context | `npx vitest run tests/server/context.test.ts` | 4 passed |
| Node suite | `npx vitest run --reporter=dot` | `Test Files 3 failed | 257 passed (260)`, `Tests 3 failed | 4370 passed (4373)`; the 3 are the hub probes above |
| Types | `npm run check` | `COMPLETED 1247 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Build | `npm run build` | built, `build/handler.js` written |
| Format | `npm run format:check` | `All matched files use Prettier code style!` |
| Lint | `npm run lint` | no output |
| ASCII gate | the brief's `LC_ALL=C perl -ne ...` over `src tests bin config` | printed nothing |
| Catalog parses | `python3 -c "import yaml; yaml.safe_load(open('config/text/views/files.yml'))"` | `yaml ok` |
| Browser | `npm run build && npx playwright test tests/browser/files.spec.ts tests/browser/files-forms.spec.ts tests/browser/show-in-files.spec.ts` | `48 passed (1.6m)` |

## The retry shape, and why

Built: the control on the failed line, plus an ask on the mount of `views/files/Sections.svelte`, which is the reader coming back to the file browser (a pane mounts only the tab it shows). No interval.

The store is built on rounds, not on a clock: a request is scheduled from a getter when the round moved, and nothing in it polls. An interval would put a second scheduler inside it and would need a cadence, which is a config key, and `config/behavior.yml` is another step's file this step may not write. The mount is an occasion the store already reacts to, it costs three requests only on a page that has a failed read (a read that answered holds its round and asks nothing), and it is what the reader expects when switching back to a view.

What makes it safe to hold no round: the round a read failed in is remembered per key (`failed` in `state/fs.svelte.ts`), so the ask of that round is made once instead of once a render; a retry clears it, and a later round asks on its own.

## The new catalog keys (decisions the orchestrator may reverse)

- `files.read_again: read again` (the control's name, drawn as the `refresh` glyph)
- `files.read_again_bookmarks: Read the bookmarks again`
- `files.read_again_notes: Read the notes again`
- `files.read_again_workspaces: Read the workspaces again`
- `files.workspaces_failed: 'The workspaces could not be read: {0}'`

## The reverts, run

`node bin/revert-check.mjs tests/state/fs.test.ts tests/views/files.test.ts tests/server/watch/bookmarks.test.ts tests/server/context.test.ts tests/size.test.ts tests/duplication.test.ts` -> `31 reverts, 0 unproven, 91 unchecked`, including:

```
red  tests/state/fs.test.ts :: asks the bookmarks again when the reader asks, without a write to move the round (revert src/lib/state/fs.svelte.ts:717)
red  tests/state/fs.test.ts :: asks the notes again when the reader asks, and the line goes when the read lands (revert src/lib/state/fs.svelte.ts:770)
red  tests/state/fs.test.ts :: asks the workspaces again when the reader asks, and the line goes when the read lands (revert src/lib/state/fs.svelte.ts:576)
red  tests/state/fs.test.ts :: asks once for the round a read failed in, however many times the view draws it (revert src/lib/state/fs.svelte.ts:424)
red  tests/state/fs.test.ts :: asks the bookmarks again when the watcher says the file changed, and for no other write (revert src/lib/state/fs.svelte.ts:463)
red  tests/views/files.test.ts :: says why the workspaces could not be read, with the control that reads them again (revert src/lib/views/files/Workspaces.svelte:80)
red  tests/views/files.test.ts :: draws no workspace row at all over a read that failed, not even the configured roots (revert src/lib/views/files/Workspaces.svelte:46)
red  tests/views/files.test.ts :: carries the control that reads it again on the line that says a read failed (revert src/lib/views/files/Failed.svelte:27)
red  tests/server/context.test.ts :: builds and closes each process-owned object once and carries its token (revert src/lib/server/context.ts:295)
red  tests/server/context.test.ts :: keeps session rescan signals inside their owning context (revert src/lib/server/context.ts:211)
```

`node bin/revert-check.mjs tests/server/watch/bookmarks.test.ts` -> `4 reverts, 0 unproven, 0 unchecked` (all four red, at `bookmarks.ts:71`, `:86`, `:76`, `:84`).

`node bin/revert-check.mjs tests/browser/files.spec.ts` -> `2 reverts, 0 unproven, 23 unchecked`:
```
red  a bookmarks read that failed is asked again by its own control, without a reload (revert src/lib/state/fs.svelte.ts:717)
red  a bookmark written by one page reaches a second page that wrote nothing (revert src/lib/server/watch/bookmarks.ts:86)
```

`node bin/revert-check.mjs tests/browser/files-forms.spec.ts` -> `6 reverts, 0 unproven, 9 unchecked`.

Two repairs inside those files, both caused by this step's edits or found by them, both now proven: the six directives of `files-forms.spec.ts` and two of `fs.test.ts` sat above their prose comment rather than directly above the `it(`/`test(`, so the checker read them against the case above and reported them GREEN or unproven; they now sit on the line under the prose and each reddens its own case. Line numbers moved by this step's edits were carried over in `files-forms.spec.ts` (three), `files.test.ts` (three) and `size.test.ts` (one).

## Doc text (not edited here, per the brief)

`HELP.md`, the `files` row (line 86), after "...then the Bookmarks, Notes and Workspaces sections.":

> A section whose read failed says why in one row in place of its list, with a control beside it that reads it again; the line goes as soon as a read lands, and all three are read again whenever the view is opened. The bookmarks file is watched, so a bookmark added or taken away outside oculus reaches an open page without a write from it.

`DESIGN.md`, the "Watchers" paragraph (line 156), one sentence at its end:

> Bookmarks watches the folder of `~/.oculus/bookmarks.yml` for that one name and publishes on the `files` channel, so a bookmark written outside oculus reaches an open page.

`DESIGN.md`, a decision line after the 2026-09-18 one:

> - 2026-09-18, a failed read of the Files view's three lists, and the bookmarks file watched. A read of the workspaces, the bookmarks or the notes that ends in an error holds no round in `state/fs.svelte.ts`: the answer writes the round and the failure writes only the round it failed in, so the next ask reads again and the sentence goes as soon as a read lands. That failed round is what keeps a page whose endpoint is down to one request a round rather than one a render, and it is cleared by the control on the failed line (`views/files/Failed.svelte`, the `files.read_again` control drawn where every row of the tree carries its controls) and by `views/files/Sections.svelte` mounting, which is the reader coming back to the view. The workspaces section gains the failure sentence the other two had (`files.workspaces_failed`) and draws no row at all over a read that failed, the configured roots included, since a list nothing answered for says nothing about what the machine holds. `server/watch/bookmarks.ts` watches the folder of `~/.oculus/bookmarks.yml`, making it when the machine has none, and publishes `{ root: '', bookmarks: true }` on the `files` channel for each burst of writes to that one name; the page's bookmarks round is the shared round plus the version of the last such message, so a bookmark added by hand or by another page reaches an open page without a write from it, and a write under a watched root re-reads no bookmarks. Package Q56.

## Before and after, for the look on the TEST page

Open a Files tab. To put the three reads in the failed state, switch Chrome's DevTools to Offline and switch the tab away and back (or open a second Files tab), which asks all three; go back Online before looking. The sentences carry the same wording as the sighting ("The bookmarks could not be read: Failed to fetch").

- **Bookmarks section.** Before: one row in the error hue saying why, nothing beside it, and the row stayed until the page was reloaded. After: the same row, with a `read again` control at its right edge (transparent until the row is hovered or holds the focus, as every other row control in this tree is); pressing it reads again and the row goes, the list drawing under the head.
- **Notes section.** The same, with "The notes could not be read: ...".
- **Workspaces section.** Before: nothing at all was said; the section drew "Configured roots" with a count of 1, as though the machine's workspaces had been read. After: one row in the error hue, "The workspaces could not be read: ...", with the `read again` control, and no workspace row under it, the count 0. The paragraph above the tree still says "The roots could not be read: ..."; the control reads for both, since it is one read.
- **Coming back to the view.** With the network back, switching to another tab and back to the Files tab clears the three sentences without any press.
- **A bookmark changed on disk.** With a page open, edit `~/.oculus/bookmarks.yml` by hand (or add a bookmark on a second page): within about half a second the rail's bookmark buttons and the Files view's Bookmarks list follow, with no write and no reload on the watching page.

## Files changed (line counts as they now stand; (new) marks a file this step adds)

Source: `src/lib/state/fs.svelte.ts` 948 | `src/lib/state/context.ts` 230 | `src/lib/data/model-sessions.ts` 497 | `src/lib/server/context.ts` 328 | `src/lib/server/watch/bookmarks.ts` 100 (new) | `src/lib/views/Files.svelte` 566 | `src/lib/views/files/Sections.svelte` 103 (new) | `src/lib/views/files/Failed.svelte` 35 (new) | `src/lib/views/files/Bookmarks.svelte` 131 | `src/lib/views/files/Notes.svelte` 142 | `src/lib/views/files/Workspaces.svelte` 112 | `config/text/views/files.yml` 96.

Tests and lists: `tests/state/fs.test.ts` 984 | `tests/views/files.test.ts` 960 | `tests/browser/files.spec.ts` 933 | `tests/browser/files-forms.spec.ts` 621 | `tests/server/watch/bookmarks.test.ts` 162 (new) | `tests/server/watch/probe.ts` 34 (new) | `tests/server/watch/git.test.ts` 699 | `tests/server/watch/sessions.test.ts` 464 | `tests/watch/portfolio.test.ts` 857 | `tests/server/context.test.ts` 306 | `tests/views/type-scale.test.ts` 245 | `tests/size.test.ts` 151 | `tests/allow-duplication.txt` 753 | `bin/size-allow.txt` 19.

## Decisions the brief did not name, each reversible

1. **The wire shape.** `FilesPayload` gains an optional `bookmarks`, and the bookmark message is `{ root: '', bookmarks: true }` on the existing `files` channel rather than a channel of its own. That channel already means "something the file browser reads changed on disk", the page already subscribes to it, and a new channel would have to be added to the connect list in `src/routes/+page.svelte`, which is outside this step's paths. The page reads the payload rather than the version alone, so a write under a watched root does not re-read the bookmarks.
2. **The bookmarks round.** `createFs` takes the entities store as a third argument, and the bookmarks round is `clock.round + <version of the last bookmark message>`, the shape `refresh(root, version)` already has for a root. The version is remembered in the store so a later message about a root cannot take the round back. This widened the path list by `src/lib/state/context.ts` (the one call) and `src/lib/data/model-sessions.ts` (the type).
3. **The watcher makes `~/.oculus` when the machine has none**, since a handle cannot be opened on a folder that is not there and the first bookmark would then reach no other page until a restart. An empty directory is all it makes; the file stays the first bookmark's to write.
4. **Its debounce is 500 ms**, the session watcher's window rather than the portfolio's 200, so a page writing several bookmarks in a row costs one read on every other page instead of one per write.
5. **The workspaces section draws no row at all over a failed read**, not even the configured-roots row, and its count is 0.
6. **The control appears on hover**, like every other row control in this tree (DESIGN.md's Files decision). Making it always visible would need a change under `src/lib/ui/` or a `:global` rule that `tests/allow-styling.ts` records as a coupling; the brief excludes both.
7. **Two components were split out of the Files view**: `files/Failed.svelte` (the failed row with its control, one place rather than three identical blocks, which `tests/duplication.test.ts` refuses) and `files/Sections.svelte` (the three sections, which read the three answers and own the retries). `views/Files.svelte` is 566 lines, under the 587 it is recorded at in `bin/size-allow.txt`; growing that number is the loosening the standard forbids, so the file was split instead.
8. **`tests/server/watch/probe.ts`** holds `recording`, `sleep` and `until` for the watcher tests, and the three existing copies in `watch/git.test.ts`, `watch/sessions.test.ts` and `watch/portfolio.test.ts` were folded into it; three entries of `tests/allow-duplication.txt` that named those pairs are gone, since the pairs no longer share.

## Problems, limitations and sharp edges

- **`src/lib/state/fs.svelte.ts` is 948 lines**, 52 under the hard 1000 line, and is newly recorded in `bin/size-allow.txt` along with `tests/state/fs.test.ts` 984, `tests/views/files.test.ts` 960 and `tests/browser/files.spec.ts` 933. Recording a file that crosses the line is what that list is for, but the store is now close enough that the next step touching it should split it: the three whole-file reads (workspaces, bookmarks, notes, with their round, their failed round and their retry) are one concern, and the listing, text and kind reads are another.
- **The watch adds one bookmarks read per open page per burst of writes to the file**, including the page that made the write, which has already re-read on its own answer. That is one small GET, 500 ms after the burst.
- **A run of the three browser specs together failed 11 cases once**, while the other two steps' suites were running on this machine (`48 passed` took 6.6 minutes that time). Re-run with nothing else in flight it is `48 passed (1.6m)` and `48 passed (2.1m)`, and `tests/browser/files-forms.spec.ts` alone is `15 passed`. The failures were assertion timeouts on a bookmark appearing or going, not errors, and they did not come back in three later runs; I could not reproduce them under a quiet machine, so I cannot rule out that heavy load plus the extra read is what pushed those 5-second waits over.
- **A bookmark write is not atomic**: `src/lib/server/writes/entries.ts:46` uses `writeFileSync` in place, so a reader during that write could in principle see a truncated file, which `readBookmarks` reads as no bookmarks. The 500 ms debounce puts the re-read well after a synchronous write, so this needs the server process to stall mid-write to bite. Not changed here; it is the write path's, not the watcher's.
- **After a server restart the channel's version starts again at 1**, and `state/entities.svelte.ts` drops a message whose version is below the one held, so a page that stays open across a restart follows the bookmarks file again only once the new server's `files` version passes the old one. This is the channel's existing rule, which `state/docs.svelte.ts` and `state/files.svelte.ts` already live under, not something this step adds.
- **The listing and file-text reads still hold their round on a failure.** The brief names the three whole-file reads, and those are what this step changed; a folder whose listing failed is still re-read by closing and opening it.
- **Likely cherry-pick conflicts**: `bin/size-allow.txt` and `tests/views/type-scale.test.ts` are tree-wide lists that any step adding a file has to touch, and both were listed as modified on main when this step was dispatched.
- **`tests/server/hpc/ssh.test.ts`, `tests/duplication.test.ts`, `tests/scratch.test.ts`, `tests/bin/claude-usage.test.ts`, `tests/server/deposit.test.ts`, `tests/server/git-write.test.ts`, `tests/shell/workbench.test.ts` and `tests/server/writes.test.ts` each failed once under concurrent load** and passed when re-run alone (`npx vitest run <file> --reporter=dot`); the final whole-suite run above has none of them red.

