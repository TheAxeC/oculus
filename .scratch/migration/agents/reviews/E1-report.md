Everything in the brief is done.

## Open items (state file, verbatim)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z72, D23's language servers: four choices the brief check found that are Axel's (raised 2026-09-30 by D23's brief check, `agents/reviews/D23-brief-check.md`; the draft brief is kept in the session scratch and D23 is not dispatched). (1) The processes rule: DESIGN.md:148 and :305 say a process started from text the reader did not write runs in a visible pane and is stopped only behind a confirmation, and :305 says the rule binds every part of oculus that starts a process; a language server runs in the background, is ended when its last tab closes, and reads text a repository wrote (pyright runs the PATH `python3` in the root to learn its search paths, clangd reads `.clangd` and `compile_commands.json`; the brief check found clangd loads no plugin a `compile_flags.txt` names). Options: (a) DESIGN.md gains that language servers are oculus's own commands (pyright from its own `node_modules`, clangd from PATH without `--query-driver`), run in the background with their state on the status bar, and ended with their tab without a confirmation; (b) each server gets a visible entry and a confirmation before it starts and before it is stopped. Recommended (a): the rule's purpose is text the reader never approved being run, and neither server runs such text; (b) adds a question at every first Python or C++ tab. (a) is also the cheaper option; it is recommended for the reason given, not for the cost. (2) clangd's index: with a `compile_commands.json` in the root clangd writes `<root>/.cache/clangd/` and answers cross-file definition and references (brief-check probe: references over main.cpp, lib.cpp and lib.h); with only `compile_flags.txt` it answers within the open file (definition lands on the header's declaration). Options: (a) clangd's defaults, the `.cache/clangd` folder written into roots that have a compile database (cathedra and game-engine ignore `.cache/`, and so does the hub); (b) `--background-index=false`, nothing written, references only within open files. Recommended (a): it is what VS Code's clangd does and the only way references cross files. (b) is the lazy option: it leaves the references feature working on only the files that are open. (3) One server per root and language, read per page: two browser pages over one root run two servers (brief-check probe over the hub root: pyright peak 385 MB, 811 source files, a references answer over 142 files in 8.4 s). Options: (a) one per page, each page's socket owning its server; (b) one per root shared by every page, which needs the relay to arbitrate two clients' open documents. Recommended (a): a second page over the same root is rare, and sharing needs a document owner per file across pages. (b) costs more to build, and it buys nothing oculus uses today. (4) The features: Monaco's client turns on every feature the server offers (22, among them completion while typing, rename applying edits to open models only, quick fixes, inlay hints drawn into the text), beyond the four ruled (hover, go to definition, references, diagnostics). Options: (a) the four ruled, the relay stripping every other provider from the `initialize` answer and refusing other dynamic registrations; (b) everything both servers offer, as VS Code does, with rename and code actions built to write files no tab holds (a larger step). Recommended (a) now, (b) as its own step if Axel wants it: rename as the client does it edits only open models and would leave other files unrenamed, which is a defect, not a feature. (a) is the cheaper option, and it is recommended because it is the ruled scope. The brief check's other findings (pull diagnostics under the client's capabilities, registration order, URI forms and pyright's encoding, the `server` status id already taken, the read-only tab drawn without Monaco, and 27 missing cases) are fixed in the brief at the next /spec and need no ruling.

- Z71, the rules file's sentence on steps in flight contradicts Z34 and the skill (raised 2026-09-30 by Q88b's brief check). `agents/spec.md:83` says several packages run at once only when "their briefs name disjoint paths and different views" and "a brief that lists a path another in-flight brief lists is not dispatched". Z34 (a) (ruled 2026-09-28) says a shared file is judged "by how simply they merge", the `plan-orchestration` skill's "Two steps in flight" says the same, and the loop has run on that reading since (`shared_paths:` in the dispatch entries of D13b, Q83, Q86c, Q103 and now Q102, `git log --oneline -S"shared_paths:" -- orchestrator-state.md`). Options: (a) `spec.md:83` rewritten to the skill's rule: steps run at once when merging their shared files at landing is simple, the orchestrator's judgment written in the later step's `shared_paths:`, a step waiting otherwise; (b) keep `spec.md:83` as written, so the loop runs only steps with disjoint paths and different views (D13c and Q102 share `config/text/ui.yml`, `ui.svelte.ts`, `DESIGN.md` and `HELP.md` and would not have run together). Recommended (a): it is what Z34 ruled and what the loop does, and under (b) about one step in three runs at a time. Keeping the stale sentence is the lazy option. Until Axel rules, the loop keeps the reading Z34 ruled.

## The cases' first reading (before the section was written)

Each case was read against the brief's rules before writing; none of the brief's rules gave a wrong answer, so nothing was handed back. The section's answer is in brackets.

1. Manifest names a channel oculus does not have: the app is refused when the folder is read (`findings.apps.channel_unknown`), so there is nothing to approve and no half-blind app. [Apps, "What refuses an app"]
2. `fetch('/api/write')` from the frame: the policy's `connect-src` stops it; if it reached the server it is cross-site with `Origin: null`, which `sameOrigin` refuses; a write would still lack the token.
3. Files change after approval: the hash differs, approval no longer holds, the frame is replaced by the approval panel (`apps.changed`).
4. No manifest: ignored without a finding. Manifest that does not parse or is not a map: finding, not an app.
5. Two manifests with one name: the folder carrying the name is the app, the other gets `name_not_folder`; neither wins by order.
6. `../../.ssh/id_ed25519`: fails the segment rule, then the recorded file list, then the real-path check.
7. Write needing a confirmation: `delete-entry` and `feed-delete` ask in a `Confirm` naming the app; the confirmation rule for git writes does not apply because no git route is open to apps.
8. Theme switched: the page reads the tokens one frame after the class changes and calls `onTheme`.
9. App removed with its tab open: `dropView` keeps the tab, drawn as `ui.unknown_view`.
10. Saved layout naming an app on a machine without it: the same unknown view.
11. Address opened directly: the `sandbox` directive makes it opaque; the key is also unknown to anyone but the page.
12. Files asked for before approval or after a change: 404 (approved, key and size/mtime record all checked).
13. Link inside the app folder: not in the recorded list, and the real-path check refuses it.
14. App named `focus` or `funding`: id is `app:focus`; empty or badly shaped name is `name_empty` or `name_shape`.
15. Layout naming an app, drawn before the socket list arrives: the list rides with the page data and is registered in the script body.
16. `undo`, `rail`, `pty:<id>`, `inbox`, `calendar`, `sessions`, `usage` in a manifest: refused when the folder is read.
17. HTML in a title: drawn as text everywhere (no `{@html}`).
18. Wallpaper on: the frame element paints nothing; the bridge sends `wall`.
19. Chord or right-click inside the frame: Control/Meta/Alt/Escape keydowns are forwarded through `key()`; a right-click opens the app's or the browser's own menu.
20. Tab moved to a floating pane, popped-out window or Electron: the frame element remounts and the bridge is made again for it.

## DONE / NOT DONE

| Item | Command that proves it | Output |
|---|---|---|
| One section `## Apps added while oculus runs`, opening with the unbuilt-proposal sentence, between Hot reload and Relationship to the cockpit | `grep -n '^## Apps\|^## Relationship\|^## Hot reload' DESIGN.md` | 222 Hot reload, 234 Apps added while oculus runs, 313 Relationship to the cockpit |
| Every bullet of item 1 answered as rules | read against the brief; the section's paragraphs: where it lives, manifest, refusals, finding, first frame, view and catalogue, add/change/remove, serving, policy, frame, reads, state, writes, approval, what an app does not get, words | DONE |
| No other part of DESIGN.md changed | the only edit is the insertion of lines 234-312 (Python `str.replace` of the heading with section + heading, asserted unique) | DONE |
| ASCII only | `LC_ALL=C grep -n '[^ -~]' DESIGN.md` | prints nothing (grep exit 1) |
| No plan id, date or "this session" | `npx vitest run tests/checks/source/history.test.ts` | 3 passed |
| `npm run diagrams` | run right before the list | wrote docs/diagrams/*.dot and *.svg, no error |
| checks.sh | `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` | see below, exit 0 |

The lines checks.sh printed:

```
$ npm test
 Test Files  339 passed | 19 skipped (358)
      Tests  5149 passed | 557 skipped (5706)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
$ npm run build
$ npm run format:check

> oculus@0.0.1 format:check
> prettier --check .

$ npm run lint

> oculus@0.0.1 lint
> eslint .

$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## The section's line range

`tools/oculus/DESIGN.md` lines 234 to 312 (heading at 234, the blank line at 312 before `## Relationship to the cockpit` at 313). DESIGN.md is 402 lines. `## Decisions taken` and `## Still undecided, and not needed yet` are unchanged.

## Found wrong or added beyond the brief (stated plainly)

- The brief's policy alone leaves a hole: a script in a sandboxed frame can navigate its own frame to any address (`location = 'https://x/?' + data`); `sandbox` without `allow-top-navigation` does not stop that and CSP has no working `navigate-to`. The section closes it with a page CSP `frame-src 'self'` sent by `handle`; the page sends no CSP today (`grep -rn content-security-policy src` finds only `server/content/diagrams.ts`). That a parent's `frame-src` governs a frame's own later navigations is from the CSP specification and is not run in a browser here.
- The kind of an `undo` answer is the kind of the change it takes back (`writes.ts:511`, `answer(outcome, change.kind, ...)`), so an enforcement based on the recorded kind would let an app allowed `entry` send an undo. The section enforces on the parser branch that matched.
- The `host` write kind edits a person host's status in the hub (`writeHost`, `writes/subtasks.ts`), so it is open to apps, not machine configuration.
- An app that must not be readable by any page in the browser cannot rely on being outside `/api/` plus `Access-Control-Allow-Origin: *` alone; the section adds the per-app key in the address. Without the key, any website open in the browser could read an approved app's files.
- Penpal carries only an error's `name` and `message` across the bridge (`dist/penpal.mjs:15-29` of the packed 8.0.1), so refusals are one fixed word in the message.

## Not verified (no command run, stated as rules in the section)

- Every browser behaviour: CSP `sandbox` in a direct visit, `frame-src` on self-navigation, path-source matching of `script-src` in an opaque document, `Sec-Fetch-Site`/`Origin: null` values, module scripts needing `Access-Control-Allow-Origin` from an opaque origin.
- That a CSP does not govern WebRTC in current browsers, which would leave an approved hostile app one way to send data out; the section states that approval is what the rest rests on, and does not claim containment.
- That the registry redraws the catalogue and tabs for a registration made while the page runs: `registry.ts` holds a plain Map and `grep -rn "\.views()" src` finds only `routes/views.ts:59`; the section states the revision rule the build must add.
- That the layout loader and `arrangements` in `config/layout.yml` accept a view id containing a colon (`ViewId` is a string, `layout/model.ts:11`, no pattern was found; the build step checks).
- penpal's `timeout` option is read from `dist/penpal.d.ts:146`, its behaviour as a handshake timeout is not run.

## Choices for Axel's ruling

Each: the section's choice, the other options, pros and cons, the recommendation, and the lazy option where one exists.

1. Folder and key. Chosen: `apps_dir` in `local.yml`, default `~/.oculus/apps`. Options: (a) that; (b) a folder in the hub (`apps/`), shared by git and version-controlled but mixing machine code into the data repository; (c) under `config/`, tracked with oculus. Recommend (a): matches `calendar_dir` and `mail_dir`, and approval is per machine. Lazy: a hardcoded `~/.oculus/apps` with no key, which the config rule forbids.
2. Manifest name and keys. Chosen: `app.yml` with `name`, `title`, `description`, `glyph`, `bridge`, `entry`, `reads`, `writes`; unknown keys refuse the app. Options: `manifest.json` (parses without a YAML library in the frame); ignore unknown keys (older oculus runs newer apps); no `bridge` key. Recommend as chosen: YAML like every oculus file, and a refused unknown key keeps approval honest. Lazy: ignoring unknown keys.
3. View id namespace. Chosen: `app:<name>`. Options: `app/<name>`; bare name with a collision finding. Recommend `app:`: never meets a bare built-in or collection id and needs no collision rule. A bare name is the lazy option (no registry change) and makes an app named `focus` a finding.
4. The address and its relation to `/api/`. Chosen: `/apps/<name>/<key>/<path>`, outside `/api/`, the key an HMAC of the app's hash under a second server secret. Options: (a) chosen; (b) `/apps/<name>/<path>` with no key, any website can then read an approved app's files because of the `*` header; (c) under `/api/` and added to `UNGUARDED`, same exposure and it weakens the guard for a path family; (d) a separate origin (another port) per app, a real origin instead of an opaque one, with a server per app. Recommend (a). Lazy: (b).
5. `Access-Control-Allow-Origin`. Chosen: `*`. Options: `null` (admits only opaque documents, which includes every sandboxed page of any site, so it protects little more than `*`); an echo of the request's `Origin` (an opaque document sends `null`, so the echo is `null` again). Recommend `*` together with the key.
6. `sandbox` and the policy. Chosen: `allow-scripts` only, and a policy listing `default-src 'none'` with own-address sources, `data:` images and inline styles. Options: add `allow-forms`, `allow-modals`, `allow-popups` (convenient; popups would open documents that inherit no sandbox unless `allow-popups-to-escape-sandbox` is absent, and forms would need `form-action`); drop `'unsafe-inline'` for styles (stricter, breaks apps that set `style=`). Recommend as chosen; an app that needs a listed permission gets a manifest key in a later ruling. Lazy: `allow-same-origin`, which removes the walls.
7. Page CSP `frame-src 'self'`. New beyond the brief. Options: with (closes self-navigation); without (a hostile approved app can leave the frame by navigation). Recommend with. Lazy: without.
8. Channels open and closed. Chosen open: portfolio, feeds, files, git, hpc, audit, config. Closed: inbox, calendar, sessions, usage, `pty:<id>`. Options: all closed until named; all open except mail/calendar/terminal; `git`, `hpc`, `files` closed too (paths, job names, hosts). Recommend as chosen; `git` and `hpc` are the borderline pair. Lazy: everything open.
9. Write kinds. Chosen open: manifest, entry, subtask, subtask-add, host, new-entry, reorder, delete-entry, feed-field, feed-delete, lead-add, linkedin-idea, linkedin-post, deck, new-idea. Closed: undo, rail, audit-mute, session. Options: fewer open (only entry and new-entry); `deck` and `manifest` closed (deck rewrites a PRESENT.md, manifest rewrites `project.yml`, the hub's source of truth). Recommend as chosen since undo covers every open write. Lazy: all 19 open.
10. Title and glyph into the catalogue. Chosen: registration fields `words` and `glyphName`. Options: a catalog key taking the title as an argument (every draw site must learn arguments); writing each app into the text catalog at run time (mutates a build-time structure). Recommend the fields.
11. Instance state. Chosen: `getState`/`setState`, one JSON value up to 64 KB, in the tab's state. Options: apps keep none (opaque origin has no storage; every app then writes to the hub to remember anything); a `state` write kind. Recommend chosen. Lazy: no state.
12. Removed app's tabs. Chosen: stay as unknown views (`dropView`). Option: close them (`unregisterView`). Recommend stay: a removed folder is often a sync or a rename, and closing loses place and state. Closing is the cheaper option (no new registry method) and is the lazy one.
13. Approval scope. Chosen: keyed by the app's content, one live approval per app name. Options: per change of any file (the same); per name plus the manifest's reads and writes (a changed script with the same permissions runs unreviewed, but editing an app you are writing does not ask each save). Recommend content. Lazy: name plus permissions.
14. Approval file. Chosen: `approvals.json` (`approvals` key in `local.yml`), keys `<kind>:<sha256>`, kinds `app` and `command`, changed only through `POST /api/approve`. Options: one file per kind; a table in an existing file. Recommend the one file, written once for every user of the rule. `/api/approve` is a new user-visible route.
15. Bridge method names. Chosen: page side `read`, `getTheme`, `getState`, `setState`, `write`, `key`; app side `onChannel`, `onTheme`; shim `/apps/-/oculus.js` with `connect`. Options: a single `request(type, ...)` method; leaving penpal use to each app. Recommend chosen.
16. Write enforcement. Chosen: headers `x-oculus-app` and `x-oculus-write-kind`, the handler refuses when the matched branch differs; the change record carries the app name. Options: page-side check only (an app can declare an open kind with a body of a closed one). Recommend chosen. Lazy: the page-side check.
17. Confirmation. Chosen: `delete-entry` and `feed-delete` ask every time; the others are recorded and undoable. Options: every app write asks; none asks. Recommend chosen. Lazy: none.
18. Rate and size limits. Chosen: 30 writes a minute, 64 KB state, 500 files, 20 MB, 10 s handshake, as keys of `apps:` in `behavior.yml`. Options: none. Recommend the limits.
19. Catalogue group. Chosen: a new `apps` group, no chord, drawn only while it holds a view. Option: put them in `views`. Recommend chosen.
20. Keys forwarded. Chosen: Control/Meta/Alt combinations and Escape. Options: none (a reader must click out of the frame to use any chord); every key (steals typing). Recommend chosen.
21. "Reserved" names. Read as: the name pattern excludes every form the address scheme reserves (the `-` segment), so there is no separate list. Option: an explicit list. Recommend the pattern.
22. A folder without `app.yml`: ignored without a finding. Option: a finding. Recommend ignore (scratch folders); a finding is noisier.
23. A manifest asking for a closed or unknown item: refused at read. Option: refused at approval, or offered with the item denied. Recommend at read: an app written for other rules is refused with a sentence the reader can act on.
24. Client shim served by the server (`/apps/-/oculus.js`, `/apps/-/penpal.js`). Option: each app bundles its own penpal. Recommend the server's copy, one version, one place to fix.

## DESIGN.md sentences a built version would make false (for the build step's brief)

Line numbers are those of the file before this section; `:299` is now line 378.

- `:114` The socket: the channel list omits `apps` (and is already out of date for audit, calendar, config, feeds, files, inbox, portfolio, usage).
- `:116` Watchers: gains the apps watcher.
- `:146` Auth: "every request under `/api/`" no longer covers everything a browser can reach, since `/apps/` is served outside the guard; the paragraph gains the approve route, the write-kind headers and the page's `frame-src` policy.
- `:148` Processes: "the approval kept under `~/.oculus/`" names one file, `approvals.json`, used by commands and apps.
- `:158` Shell: "views register themselves in a registry keyed by `ViewId`" also holds a run-time registration and a `dropView` that closes no tab.
- `:160` Views: "one folder per view, `views/<group>/<name>/`" does not describe an app, which is drawn by one component for every app.
- Hot reload table and text (222-230): "Three kinds of change, three mechanisms, no restart" gains a fourth row, an app folder.
- `:299` (now 378): "A saved layout is the one place the old view id survives" is false once a removed app's id survives in open tabs.
- Also for the build step: `:87` and the `local.yml` key descriptions (`apps_dir`, `approvals`), `config/layout.yml`'s `nav_groups`, `glyphs.yml` and `icons.yml` (the `app` glyph), and `Registration` in `registry.ts:73-114`.
