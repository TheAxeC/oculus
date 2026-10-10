# D61 landing: the Workbenches view and the status bar's repository

Position: the oculus migration plan; D61, the Workbenches view and the status bar's repository, landed. In flight: D60 (repositories read as projects of the hub), on its repair round. Next: D60's review over round 1 and its landing; D62 (apps: the host and the bridge) after Axel rules on open item 46; then D63, D64, Q72 and O33.

## Open items

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Open item 46 (2026-10-10), D62, a step that does not converge: fifteen choices the rulings do not name, found while writing D62's brief and by its brief check (`agents/reviews/D62-brief-check.md`). The draft brief is kept in the session scratchpad and is written again from it with the ruling; nothing else of D62 exists. Each choice has its options, the pros and cons of each, one recommendation and the lazy option named. Reply `Ruled: (1) a, (2) b, ...`.
  - (1) Where an app's per-workspace enable and disable state is kept. Ruling 45 (1) says "with the saved workspace", but the default workspace has no machine-local record: its folders are the tracked hub file `.oculus/config/sources.yml` (`roots.ts:1-14`), while a named workspace is in the untracked `<hub>/.oculus/workspaces.json` (`fs.ts:194-196`).
    - (a) Everything in `~/.oculus/apps.json`: `{ version: 1, disabled: [<view id>], workspaces: { "<workspace name, or default>": { disabled: [<view id>], enabled: [<view id>] } } }`. Pros: one machine-local file and one code path for every workspace; never a tracked file; matches VS Code, which keeps workspace-disabled extensions in its per-workspace machine storage, never in the `.code-workspace` file. Cons: renaming or deleting a named workspace must carry or drop its entry, which the workspace rename and delete acts must do; the state does not travel with a copied `workspaces.json`.
    - (b) A named workspace's state inside its `workspaces.json` entry, the default workspace's in `~/.oculus/apps.json`. Pros: follows the ruling's words for named workspaces; rename and delete carry the state with no extra code. Cons: two stores and two code paths for one setting; `workspaces.json` writes go through `/api/fs`, which this step would then also change.
    - (c) The default workspace's state in `sources.yml`, a named one's in `workspaces.json`. Pros: follows the ruling's words for both. Cons: a per-machine reader setting lands in a tracked file, so disabling an app makes a git change in the hub and carries to every other machine.
    - Recommendation: (a), for the one code path and because enable state is a reader's machine-local choice. Lazy option: (a) is also the cheapest; it is recommended on its merits, the rename and delete handling included.
  - (2) How Add app from folder chooses a folder where oculus's folder picker answers `unsupported` (the browser on Linux or Windows without the desktop app; `picker.ts:27`, `picker.ts:159`; the Files view's line is "The folder panel is available on macOS only.").
    - (a) The picker only, and the refusal line elsewhere, as Add Folder to Workspace does today. Pros: one way in, the same as the Files view. Cons: the action does not work in the browser off macOS.
    - (b) The picker, plus Add as App on a folder's right-click menu in the Files view, working on every platform for any folder of a shown root. Pros: works everywhere; matches VS Code's Install from VSIX on the Explorer's right-click; no new chooser to build. Cons: a folder outside every shown root needs the picker or adding its root first; touches the Files view's row menu.
    - (c) The picker, plus an in-page folder chooser that browses the whole disk through the server. Pros: works everywhere for any folder. Cons: a new component and a new server listing of folders outside the roots, a surface G2 exists to keep closed.
    - Recommendation: (b). Lazy option: (a).
  - (3) What a damaged `~/.oculus/apps.json` (one that does not parse) means.
    - (a) Fail closed: every app reads as disabled, a finding names the file, and Enable or Disable is refused with the reason until the file is put right. Pros: a disabled app's host never starts because of a damaged file; the approvals file already fails this way (`approvals.ts:288`, a file that does not read approves nothing). Cons: every app stops at once until the reader fixes or removes the file.
    - (b) Fail open: every app reads as enabled, with the same finding. Pros: apps keep working. Cons: an app the reader disabled, perhaps for a reason, runs its host again.
    - Recommendation: (a). Lazy option: neither costs more than the other.
  - (4) What an app's host may import. The approval hash covers the recorded files only (`record.ts:3-5`: links and dot-led files are left out), so a host can `import` a file outside them (`../x.js`, a link, a dot-led file, a `node_modules` above the folder) and run code the reader never approved; for a root app a `git pull` can change that file with no new question.
    - (a) The runner installs a Node module hook that refuses any `file:` import outside the app's recorded files; `node:` built-ins are allowed, and a host ships its own packages inside its folder, where they are recorded and approved. Pros: "the reader approved its exact files" holds. Cons: a host cannot import a package installed elsewhere; a large `node_modules` counts toward `apps.max_files` and `max_mb`, so a host bundles its packages.
    - (b) No hook: the documents say the approval covers the recorded files and a host that imports others runs them unapproved. Pros: any package resolves. Cons: unapproved code runs with the reader's rights, and a pull changes it silently.
    - Recommendation: (a). Lazy option: (b).
  - (5) The refusal word for a host that is not running and cannot start, a host request in flight when the host stops, and a dependency that cannot start. The existing `failed:0` means "no answer" (`docs/apps.md:219`).
    - (a) Reuse `failed:0`. Pros: no new word. Cons: an app cannot tell a stopped host from a lost connection.
    - (b) A new word, `host_down`. Pros: an app can tell the reader its host stopped and offer Restart. Cons: a tenth word in the refusal table.
    - Recommendation: (b). Lazy option: (a).
  - (6) How the new calls are rate-limited. `writes_per_min` and `opens_per_min` are per frame (`config/behavior.yml:304`, `:306`).
    - (a) A host's store updates count under `writes_per_min` per host; `commands.run` counts under `opens_per_min` per frame; `sendToPage` is unlimited; the two key sentences and their Settings help say "per frame or host" and "calls of open or commands.run". Pros: no new key; a flood of store writes cannot bloat the change log. Cons: two key meanings widen; a host's flood of `sendToPage` is not bounded.
    - (b) As (a), plus `sendToPage` counted under a new key `messages_per_min` per host (default 600). Pros: every channel a host has to a frame is bounded. Cons: a new config key.
    - (c) No limit on a host at all, since it can write files natively. Pros: nothing to build. Cons: the change log and the page are open to a flood.
    - Recommendation: (b). Lazy option: (c).
  - (7) The answer shapes of `oculus.fs`.
    - (a) VS Code's `workspace.fs`: `readFile` a `Uint8Array`, `readDirectory` `[name, type]` pairs, `stat` `{ type, ctime, mtime, size }`, `type` the `FileType` numbers (1 file, 2 folder, 64 added for a link). Pros: code written for VS Code ports unchanged. Cons: numbers in place of words.
    - (b) oculus's own words: `{ name, kind: 'file' | 'folder' | 'link' }` and `{ kind, modified, size }`. Pros: readable. Cons: a second shape for app authors who know VS Code's.
    - Recommendation: (a). Lazy option: neither costs more.
  - (8) A dependency disabled, revoked or removed while an app that depends on it runs.
    - (a) As VS Code does: Disable or Remove of a dependency asks first, naming the apps that depend on it, and on yes those are disabled too and their hosts stop; a revoke stops them with a line saying why. Pros: no host runs with a missing dependency. Cons: one more question.
    - (b) The dependents keep running and their `apps.get` calls reject with the word (5) rules. Pros: nothing else stops. Cons: each dependent must handle a dependency that vanished.
    - Recommendation: (a). Lazy option: (b).
  - (9) Remove when the keyring is not available (no Secret Service on Linux, or a locked store).
    - (a) Remove refuses, saying the secrets cannot be deleted. Pros: no secret is left behind. Cons: an app cannot be removed on such a machine.
    - (b) Remove goes ahead, and its question says the app's secrets could not be counted or deleted. Pros: removal always works; on a machine with no store the app could hold no secrets anyway. Cons: secrets stored while the keyring worked stay in it.
    - Recommendation: (b). Lazy option: (b) is also cheaper; recommended because a refusal blocks the reader for secrets that in most cases do not exist, and the question tells them.
  - (10) The keyring service of an app's secrets. Ruling 40 says `oculus-app:<app id>`; a root app's id holds its root key (`apps.ts:23-25`), so renaming that root key orphans the secrets.
    - (a) `oculus-app:<view id>`; a renamed root key leaves the old secrets and the app asks again. Pros: the id oculus uses everywhere. Cons: orphaned entries on a rename.
    - (b) `oculus-app:<app name>@<the root's real folder>`. Pros: survives a root key rename. Cons: moving the folder orphans them instead; a long service name.
    - Recommendation: (a). Lazy option: neither costs more.
  - (11) The host's limits: kept output (1000 lines and 256 KB), stop times (`deactivate` 5 s, then SIGTERM, then SIGKILL 2 s later), the `workspaceContains` walk (10,000 entries per root) and `readDirectory` (10,000 entries).
    - (a) Constants in the code, named in the documents. Pros: no new keys. Cons: a reader cannot change them.
    - (b) Keys in the `apps:` block of `config/behavior.yml`: `host_output_kb`, `host_stop_seconds`, `scan_entries`, with the values above as defaults. Pros: changeable in Settings like the other app limits. Cons: three new keys.
    - Recommendation: (b), since every other app limit is a key. Lazy option: (a).
  - (12) Test entries. The tests D62 needs have no `agents/guarded.md` entry: the host's lifecycle (it runs only from approved, enabled, unchanged files and ends with them and with the server) and secret values never leaving the keyring; and `~/.oculus/apps.json` and Remove are not in G31's and G10's texts.
    - (a) Two new entries, "an app's host runs only from its approved, enabled, unchanged files, and stops when they change, when the app is disabled, revoked or removed, and when the server ends" and "a secret's value never leaves the keyring: no log, change record, channel, file or report holds it"; G31's list gains `~/.oculus/apps.json` and G10's units gain Remove. Pros: the security-critical behaviours are held by tests. Cons: more tests to keep.
    - (b) No new entry: those cases are checked by quoted runs at the build and never again. Pros: fewer tests. Cons: a later step can break host isolation or leak a secret with nothing failing.
    - Recommendation: (a). Lazy option: (b).
  - (13) Which channel carries the host rows and their output to the Processes view. `processes` is already closed to every app (`CLOSED_CHANNELS`, `apps.ts:84`).
    - (a) A new channel `app-hosts`, closed to every app and listed in docs/apps.md's closed channels. Pros: up to 256 KB of output per host never rides the process table's refresh; the hosts' changes push on their own. Cons: one more channel.
    - (b) The rows and their output added to the `processes` payload. Pros: no new channel; the view reads one channel. Cons: every process table refresh carries every host's output.
    - Recommendation: (a). Lazy option: (b).
  - (14) Three manifest rules: `activation` without `host` refuses the app; a dependency that is missing, refused, disabled or unapproved leaves the depending app offered, with its host waiting; `files` on a root app refuses the app.
    - (a) As written. Pros: a mistake in `app.yml` shows at once; a missing dependency shows as a waiting host, as VS Code shows one. Cons: none found.
    - (b) Ignore `activation` without `host` and `files` on a root app, with a finding but no refusal. Pros: more forgiving. Cons: an author believes a key works that does nothing.
    - Recommendation: (a). Lazy option: neither costs more.
  - (15) What Add app from folder copies, and what a removed app's tabs show.
    - (a) Copy the files and folders, leaving out links and dot-led names, as the approval hash does; a removed app's open tabs stay and draw the unknown view, as for a removed folder today. Pros: what is copied is what is approved; the tabs behave as they already do. Cons: an app that needs a dot-led file cannot be added this way.
    - (b) Copy everything, links resolved; a removed app's tabs close. Pros: an exact copy. Cons: copies files no approval covers; closing tabs loses their place.
    - Recommendation: (a). Lazy option: neither costs more.

## Check before the landing

The runner's agent listing (ListAgents) showed one subagent, a6dd13dec7398d216, D60's builder; none of D61's builder or reviewers was running.

## NOT DONE

Nothing of the brief.

## What landed

From base a35863cc6, 36 paths, +1898 -1006 against main.

1. The Workbenches view (`src/lib/views/system/workbench/Workbenches.svelte`), a unique view at order 10 of the System group with no chord. Open lists one row per open workbench, with its folder and the branch of the repository holding it. Closed lists one row per kept layout. A row resets or closes its workbench, Reopen opens a kept layout (with fresh tab ids when another page or float holds one of them), Forget drops it, and New workbench opens a served root's top or a picked folder.
2. The rail's Workbenches menu lists the open workbenches under its heading, then Manage Workbenches. The Reset layout list is gone (`shell/rail/workbench-reset.ts` deleted). With no workbench open, the menu holds the line that says so and Manage Workbenches, with no heading. Manage Workbenches shows the view a page or float already holds; otherwise it opens the view on the page on screen. When the page on screen is a workbench, it opens the view on the rail page of the System group, else the first page that is no workbench, else a new page.
3. The branch, sync and repository items follow `repoStatus` (`state/workbench/navigation/status.ts`): the repository of the active tab's file, else that of the workbench's folder, else the repository last chosen, else the hub's. The repository last chosen (`ui.statusRepository`) is kept while the git channel has not reported it, and dropped once no root of the current workspace holds it. The picker lists the readable repositories at or below a root of the current workspace (`listable`). The item's accessible name is "Repository {name}".

## Fixes at landing (4)

- `HELP.md:59`: the sentence on where Manage Workbenches opens the view gains the two fallbacks the code has (review over round 1, Standards 1).
- `status.ts`: the picker's rule is written once, as `listable`, which `repositoryChoices` and `chosenState` call. The file's head comment and DESIGN.md's status bar paragraph name it (Standards 2).
- `WorkbenchMenu.svelte`: the empty menu has no heading, as before the step (Behaviour 1).
- `WorkbenchMenu.svelte`: that comment is rewrapped within 100 columns. The first landing run of test:checks' comment-width check was red on it.

## Verification on main, from tools/oculus

```
$ npm run test:landing
ok      ASCII gate (0.8 s)
ok      npm run format:check (47.8 s): All matched files use Prettier code style!
ok      npm run lint (59.3 s)
ok      npm test (186.4 s)
ok      npm run check, then npm run build, then npm run test:slow (383.9 s)
FAILED  npm run test:checks (483.2 s): src/lib/shell/rail/WorkbenchMenu.svelte:72 (comment width)
$ npm run test:checks            (after the rewrap)
 Test Files  17 passed (17)
      Tests  271 passed (271)
```

The comment rewrap came after the first five commands passed and changes only a comment. Prettier was checked on the file again afterwards. No A/B: the configuration names no `bench:`.

## The look

Taken on a scratch oculus from the gate (port 8796, the gate as the hub, main's staged diff applied, staged hash 0a10f069), with the browser's saved state for that origin cleared first. The step changes no theme.

- The empty rail menu: "No workbench is open", a rule, Manage Workbenches, no heading.
- Manage Workbenches from Focus opened the view on Focus, with Open and Closed empty.
- New workbench listed the served roots and Open Folder... . Choosing hub opened a workbench with Files, Search and Repositories.
- The rail menu then showed the heading Workbenches, the row hub with its close mark, a rule and Manage Workbenches.
- Manage Workbenches from the workbench showed the view on Focus, which already held it. Its row reads `hub hub 0ee9a5cc9`.
- The repository item read `gate`, with the accessible name "Repository gate". Its picker listed `gate`; the other roots resolve under the scratch HOME, where they do not exist.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|---|
| a59e2f194e5e771bc | builder | claude-sonnet-5-5 | 324,989 + round 1 129,524 | 236 + 58 | 85.4 + 21.1 min |
| a29257cca60a58268 | brief check | claude-opus-5-5 | 207,035 | 76 | 8.0 min |
| a86856c9cda9069e5 | reviewer | claude-opus-5-5 | 266,968 | 81 | 15.2 min |
| ace7fca6430f15a2c | reviewer over round 1 | claude-opus-5-5 | 196,355 | 52 | 11.0 min |

The first report did not pass its bar: there was one repair round. The builder ran two git commands against the no-git rule (`git -C . status`, and `git rm -q` with no path); neither changed anything.

## Next

D60's review over round 1 and its landing; /spec D62 after Axel rules on open item 46; then D63, D64, Q72 and O33.
