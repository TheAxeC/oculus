# Brief check of O188 (read only, main at e3e50a421)

`git rev-parse --short HEAD` printed `e3e50a421`; `git status --short` showed the three plan files modified and `briefs/O188.md` untracked. Scratch files only under `scratchpad/bc/`. "User sees: no" means nobody using oculus would see the decision.

Ranking (judgment). P1, I1, I2 and I3 come first: a server that ends, a page that shows a wrong session, changes that are lost. Then I4, I5, I6, I7, I8, B1, B2, B3, N1.

## Names

Commands: `grep -rnE "TerminalDriver|watchSessions|UsageTranscriptFold|foldOpen|foldToggled|TickerRow|layOutSlide|[^a-zA-Z.]sessions\("` over src, tests, config, docs, README; `grep -rnE "['\"]sessions['\"]" src`; `grep -rnE "entities\.sessions|SessionsPayload|liveSignature|hub\.latest\(" src tests`; `grep -rnE "\.subscribe\(" src tests`; `grep -rn "FoldKey\|groupFold" src`; `grep -rnE "driver:|tmuxDriver\(" tests src`.

1. Server readers outside the list.
   - `sessionRecord(hub, id)` in `routes/api/(sessions)/terminal/+server.ts:18` and `transcript/+server.ts:12`. Not made false: `latest` stays whole. Before the first scan answers they answer null, where today the payload exists before the first request. Covered by "The first publish comes when the first scan answers".
   - `watchSessions` in `root/process/context/dependencies.ts:58,84,117`, `rebuild.ts:19,27,77`. Not false.
   - Tests that publish on `sessions` on a bare Hub: `tests/server/git/git-scan-depth.test.ts:165`, `schedules/waiting.test.ts:44,56`, `approval.test.ts:74`, `watch.test.ts:72,81,305,336`. Not false while a bare Hub registers no difference. `git-scan-depth:165` publishes with no `records` and before the subscribe, so an in-process reader must still be handed the latest at its subscribe.
2. In-process sinks outside the list: `machine/lsp/held/watch.ts:332`, `root/watch/apps.ts:456`, `root/live-settings.ts:319`, `files/fs/open-files.ts:146` (all `['config']`). Item 2 says "the Hub gives in-process readers the message itself". Read as all in-process readers it needs four files not on the list; read as two it leaves two ways to be an in-process reader. Smallest change: say which, and if all, add the four paths. User sees: no.
3. Page readers outside the list, all through `entities` or `afterReceive`, none false while `receive` is handed the whole payload: `state/system/machine/debug/debug.svelte.ts:282`; `state/sessions/terminals.svelte.ts:334,335,351,427,461`; `state/sessions/latex/latex.svelte.ts:285` (compares `message.version`); `state/sessions/terminal/commands.svelte.ts:362`; `state/workbench/navigation/notice-sources.ts:372` (`message.payload`); `rail-badges.svelte.ts:237`; `status.ts:245,505`; `state/client/selectors.svelte.ts:613,655,677`; `shell/status/StatusBar.svelte:352`; `views/system/status/Status.svelte:60`; `routes/+page.svelte:238,299`.
4. Apps: `state/system/apps/apps.svelte.ts:487-502` snapshots every kept message to each mounted frame and `:598` answers the held one; `data/helpers/files/apps/apps.ts:99` grants `sessions` as machine access; `docs/apps.md:442` states `{ records, workspaces, terminals? }`. All stay true. No app host or app shell reads the channel on the server (`grep "hub.latest\|'sessions'" src/lib/server/machine/apps` had no hit in the greps above).
5. `TerminalDriver` is built in `panes/driver.ts:75`, `tests/server/machine/pty/channel.test.ts:85`, `tests/server/machine/pty/agent-pane.test.ts:377` and `tests/fixtures/doubles.ts:73` (`idleDriver`, used by `context-fixture.ts:54` and `terminals-page.test.ts:54`). The list says "every other test that builds one", and `doubles.ts` is a fixture. Smallest change: name `agent-pane.test.ts` and `tests/fixtures/doubles.ts`. User sees: no.
6. `sessions()` callers: `root/watch/sessions.ts:167`, `tests/server/sessions/usage-sessions.test.ts:54,92`, `tests/data/real-hub.probe.ts:128,131`. See B3.
7. `TickerRow` outside the list: `views/boards/focus/rows.ts:25,102,104,341`, `Tasks.svelte:30,62,65,126`. `FoldKey` outside: `Band.svelte`, `lanes/Lanes.svelte`. Widening a type does not make them false.
8. `layOutSlide` only in `Slide.svelte`; `boundaries`, `layout-turns`, `drawn-slide` are imported by no test (`grep "present/(screen|Slide|...)" tests` gave only `html-sites.test.ts:39,41` for `parts/`), so moving `screen/` files needs no test change.
9. N1, the folder-count problem: `data/model/index.ts` is 872 lines (limit 880) and is not named beside `context.ts` and `git.ts`. Smallest change: name it. User sees: no.

## The step line

The step line carries no check, and `plan.md` has no Goal section (`grep -n '^## ' plan.md` printed Steps, Could run in parallel, Rulings, Agents, Blocked). I used ruling 763's words ("The terminal is slow while sessions work") as the goal.

| Part of the line | Item |
|---|---|
| rescan in a worker thread, `ps` off the thread | 1 |
| channel sends only changed records | 2, decision 1 |
| keys over the attached control client | 3 |
| usage fold reads appended bytes, off the thread | 4 |
| layout kept and used on every surface | 5 |
| slides before and after laid out while idle | 6 |
| emails unfold by `>`, groups, folded at the start, fold the tab's, the presses | 7 |
| one step, built by a builder | whole brief |

No part is without a requirement. The line says "every surface that draws the slide"; item 5 leaves the print page out, which is a departure from the line's words, stated in the brief.

## Premises

Reproduced (commands `wc -l`, `git ls-files | cut | sort -u | wc -l` per folder, `grep -n`, `sed -n`): `watch/sessions.ts` 325, `channels.ts` 282, usage `transcripts.ts` 209, `Slide.svelte` 516, `CommandCenter.svelte` 284, `CommandCenterView.svelte` 278, `focus.ts` 799, `context.ts` 878, `git.ts` 838; folder counts sessions 10, watch 10, core 10, model 10, client 10, life 10, usage 5, transcripts 3, stores 7, screen 9, ticker 4; `registry.ts:59`, `codex.ts:392`, `hooks.ts:160`, `stores/hooks.ts:107`, `schedules/watch.ts:285`, `sessions.ts:206`, `git.ts:766,820`, `pollers.ts:216`, `channel.ts:707`, `Present.svelte:429`, `Presenter.svelte:119,131`, `Tile.svelte:146`, show page `:279`, `inbox.ts:105`, `Inbox.svelte:133,182,183`, `CommandCenter.svelte:223-231`, `focus.ts:773-799`, `InboxCard.svelte:100-113`, `inbox.yml:42-45`, Ticker users CommandCenterView, Tasks, Gallery. A worker importing both TypeScript modules under Node v24.21.0 answered `[ 'projectFolders,sessions', 'USAGE_DAYS,UsageTranscriptFold' ]`. The cache file is 3,707,876 bytes, 176 entries, none over 256 MiB, so the dropped cache of a changed `readerDigest` costs one re-read and turns no session `truncated`.

Not rerun: the 130/526-1551 ms rescan, the 988,819 byte payload, the tmux timings (996 bytes, 17.6 ms, 1471 ms), the 446 files / 7.33 GB / 21.5 s fold, the 59 of 68 samples, 0.3 s, 11-20 ms, the Electron run, the 35-382 ms slide switches, the message sizes of decision 1.

Findings:

P1. `pty/tmux.ts:388,447` (`grep -n stdin tmux.ts` prints only these two, and no `'error'` listener). Missing premise: `control` writes to `child.stdin` with a callback and no `error` listener. Scratch program `bc/epipe.mjs` under v24.21.0: a write to a child that closed its stdin, and a write after `stdin.end()`, each printed the callback's code (`EPIPE`, `ERR_STREAM_WRITE_AFTER_END`), then `throw er; // Unhandled 'error' event`, process exit code 1. Today only pane reads take this path; item 3 puts every key on it. Scenario: tmux dies or the client is dropped (`drop` then the queued `flush`) while a key is typed; the key's write fails before `exit` is handled and the oculus server ends, every page with it. Smallest change to item 3: "a write to a control client that has ended is that command's failure and never an error event that ends the server", and case 23 gains "written after the client's process died and before its exit is handled, and in the turn `close` is called: the server runs on". User sees: no choice.

P2. "The guarded entries whose code the step touches are G35 and G90, G78 and the entry of background.ts (G87)". The Code lines of `guarded.md` also name files of the write list in G1 and G8 (usage, sessions), G28 (`channel.ts`), G31, G40, G84, G148 (files of `sessions/`), G46, G91 and G152 (`schedules/watch.ts`), G81 and G109 (`git.ts`), G82 (`payloads.ts`), G36, G61 and G135 (`context.ts`) (an awk over `guarded.md`, entry by path). Which of them the diff really reaches depends on the build. Smallest change: "every entry whose Code line names a file the step changes; among them ...". User sees: no.

P3. Decision 1's worked example. `group.ts` `ordered` sets `area.lastActivity` and `workspace.lastActivity` to the newest of their sessions, so every record of a working session that is written changes the tree, and `placed` goes with almost every real message. "About 26 KB" leaves out the tree; the order alone is about 4.4 KB (40 x 111 bytes). My estimate for the usual message is 45 KB or more. Case 10's "no tree when the tree is as it was" does not happen for the case the step exists for. Smallest change: `placed` leaves out `lastActivity`, which both ends compute from the sessions as `newest` does; or the figure is corrected. User sees: no (wire only; the orchestrator's ruling "O188 wire shape").

P4. "Stores hold one id" is fine; `patchPayload` (`stores/hooks.ts`) makes every workspace and area object new, so "what is sent is found by identity" would call the tree changed at every hook, against "a hook gives one record". Smallest change: say the tree is compared by its placements and not by identity. User sees: no.

## Cases and checks

No case contradicts `agents/spec.md`. Two ask about a place the step does not change: the write-token half of case 26 (`inbound`, not `#input`) and case 14's version rule of `entities.svelte.ts` (`reconnected`), which is a fair regression case if the step edits `receive`. Case 6 needs a handle on the thread: nothing in the brief gives a case-run program one, so it can only be read, unless the held worker takes a worker file as `HeldComments` does. Smallest change: say so.

Cannot be built as written, or not without a choice the brief does not give:

B1. Where the held worker lives. Item 4 wants it written once for `root/watch` and `machine/usage`. `server/core` is full (10 items) and only `channels.ts` of it is on the list; `server/sessions` and `root/watch` are full. Left on the list are `sessions/stores/` (7), `machine/usage/` (5) and `server/transcripts/` (3), and the boundary test's row for `server/transcripts` is `['server/transcripts/**', 'data/**']`. None is the concern of a generic held worker. Smallest change: name the place, for example `src/lib/server/core/files/` or a new folder of `core` with the move that makes room, and add it to the list. User sees: no.

B2. The join of records and placements is needed twice: on the server, to build `latest` with hooks from the worker's answer, and on the page, to apply a difference. Spec: a rule exists once. The page may import only what `layer-rows.ts` names: `data/model` is the facade, `data/helpers` and `data/shapes` are full at 10, and `layer-rows.ts` is not on the list. The only home on the list is a function in `data/model/model-sessions.ts` (785 lines), exported through `index.ts` (872); `model-collections.ts` is a precedent for functions there. Smallest change: say so. User sees: no.

B3. `probe`/`codexProbe` of `watchSessions` and case 7. `grep watchSessions tests` prints only `inert-context.ts:42` (`watchSessions: () => inert()`); no test gives the watcher a probe. The in-process path would be code with no caller, which `spec.md` (YAGNI) refuses, and case 7 tests nothing in use. Smallest change: drop the two options from `SessionsWatchOptions`, the paragraph and case 7. Then `sessions()` has only test callers (`knip --production` will list it) while G78's test must stay unchanged: say that the worker calls `sessions()`, or that the line is expected. User sees: no.

B4. Item 5 holds the kept layouts in the Present store (`state/life/present.svelte.ts`), but the kept values' types `Layout` and `Box` are in `views/academic/present/screen/slide-layout.ts`, which the `state` row of `layer-rows.ts` may not import. `state/life` is full. Smallest change: the store holds them opaquely (a map of `unknown` behind a typed reader in the view), or the types move to `state/life/present.ts` (739 lines), which must join the list. User sees: no.

B5. `screen/` has one free place (9 of 10), `views/academic/present/` none (10). The moved layout module takes it, and the idle stage component and its scheduler need more. Smallest change: say the layout modules move into a folder of `screen/` (the importers are all inside `present/`; no test imports them). User sees: no.

B6. `Ticker.svelte`'s head comment: "this folder imports nothing of ui/controls". `FoldControl` is in `ui/controls/heads/` and draws `ToolButton`. Smallest change: the control is drawn by a snippet the caller gives, as `marked` is, or the comment is rewritten and the cycle check holds. User sees: no.

B7. The key and list the emails' fold is saved under is a key of a saved record, which `spec.md` says the brief names. Item 7 and decision 7 name neither, and case 48 depends on it. Smallest change: name it (for example `opened: ['emails']` beside `closed`, so a hand-written `closed: ['emails']` changes nothing). User sees: a saved key, so name it here.

## The question

"Could it pass without the goal being reached?"

Step line: it has no check, so there is nothing to hold it to. Verify 3 prints times and bytes before and after with no bar, so any figure passes; it measures no key. Smallest change: one measured case, keys typed and echoed while a scan and a usage fold run, before and after, and "the server's thread is held by no scan and no fold". User sees: no.

Items: 1 yes, cases 1-9 pass with the scan in-process (case 7 asks for it), only verify 3 shows the thread. 2 yes, cases 11, 12, 14, 15, 16 and 18 pass with whole payloads; case 10 and 17 do not. 3 no, case 20 is direct; no latency case. 4 yes for "off the thread": cases 27-33 all run on the class in-process, and no case runs a fold through `watchUsage`, closes it mid-fold, or loses its worker. 5 yes, see case 34. 6 yes, see case 35. 7 no.

Cases: 1 yes (equal payloads say nothing of the thread). 2 no. 3 yes (a text comparison on the server thread passes). 4 no. 5 no. 6 yes (a new worker that republishes everything passes, I3). 7 yes (B3). 8, 9 yes (as now). 10 yes (a record change that leaves `lastActivity`, P3). 11, 12 yes (whole payloads). 13 no. 14 yes (as now). 15, 16 yes. 17 no. 18 yes (text parsed is fine); smallest change "and no JSON text of the message is made while no page is subscribed". 19 yes (regression). 20 no. 21 yes (holds today). 22, 23 no. 24, 25 yes (regressions). 26 yes. 27 no on the bytes (`readBytes` is the class's own count). 28 no, see I4. 29, 30 no. 31 yes (already filtered today). 32, 33 yes (regressions). 34 no, but it has no page and is only read. 35 yes: a search gives the same factor, boxes and room, so the look passes on the unchanged tree; smallest change: the look records the main-thread time of the slide switches before and after, as the premise did. 36 partly. 37, 38, 39 yes (as now). 40 yes (passes when nothing is prepared; pair it with 35's measure). 41 no. 42 no. 43 yes. 44 no. 45 no. 46 no. 47 no. 48 no, once B7 names the key.

## Implied inputs

I1. A `Stop` hook, then a scan that changed nothing. `patchRecord` sets `state: 'idle'` on the published record until "the next rescan reads the transcript's own tail". With a worker that answers only records changed since its last answer, and a server that keeps the other objects, the record stays `idle` though the scan says `working`. Expected: a file-event rescan publishes the scan's state with the hook on it, as now; the 15 s re-check, whose signature the hook publish does not move, publishes nothing, as now. Smallest change: item 1 says the server keeps the records as scanned apart from what it published, and "changed nothing" compares with what stands on the channel; add the case. User sees: no choice.

I2. A record that changed in a re-check whose signature is the same (`recheck` publishes nothing then), followed by a rescan with nothing new. The worker has already answered that record as changed, so the rescan looks unchanged and the change is never published. Expected: the rescan publishes it. Add the case. User sees: no choice.

I3. A worker restarted after a death, with nothing changed. It holds no earlier answer and answers every record. Expected: no publish and no `onChange`, and the record objects kept. Add to case 6. User sees: no choice.

I4. A transcript rewritten in place: same inode, same or larger size, new content. Item 4 starts from zero only when the file shrank or its inode changed, yet case 28 expects "one replaced at the same size" to equal a whole read, and today any mtime change reads it whole. With the same inode and size, the rule reads nothing and keeps the old rows. Smallest change: also from zero when the mtime moved and no byte was appended; say the same-inode rewrite that grew is not seen, if it is accepted. User sees: usage totals; the default is fine.

I5. A file event while a re-check waits, or the reverse. "A request while one waits joins it" does not say whose rule holds. Today a rescan publishes and tells listeners, a re-check publishes only on a moved signature and tells nobody. Expected: a joined request takes the stronger one. Smallest change: one sentence. User sees: no.

I6. A control client that never answers (tmux stopped): `run` has `TIMEOUT_MS` 5000, `command` has none, and `#chain` awaits it, so every later key, resize and `#attach` of that terminal waits, and the keys are typed into whatever the pane shows when tmux goes on. Expected: one stderr line after the same 5 s, the piece not sent again, the next key goes on. User sees: no choice.

I7. A slide's layout inputs. (a) `fitFormulas` writes each formula's `fontSize` on the drawn element and is part of what the search leaves; item 5's list ("the factor, the room, the layout, the boxes, the failed figures and the depth") has no formulas, so a slide shown from a kept layout draws unfitted formulas on the audience screen. Expected: fitted when the layout is put on. (b) What a slide draws also comes from the theme and the catalog: a rice theme changes a chip's padding (`Chip.svelte:270-272`), `domainLabel` and `t('present.col_*')` come from the config, not from the row (`Summary.svelte`, `Project.svelte:170`). Today a slide shown again searches anew, so a theme or vocabulary change that does not move the probe is picked up; kept, it draws the old one, against case 37. Smallest change: the theme's body class, the text scale and the configuration's generation join the inputs. (c) The key: `tallKey` (`present.svelte.ts:439`) is root, path and slide key; "one entry per slide key" alone lets two decks with one key replace each other. Smallest change: use the deck's root and path with it. User sees: no choice.

I8. A slide whose figures' images are not complete at the first layout. That layout has other inputs, so it "searches and replaces the kept layout", and the second, after the load, searches again: a slide with figures is not helped. Expected: a layout made with fewer images loaded does not replace one made with all of them loaded. Smallest change: one sentence in item 5. User sees: no.

I9. A neighbour whose preparation loads a font (a formula's): `document.fonts` `loadingdone` runs `askLayout` in every mounted Slide, the shown one included. Expected: the shown slide is laid out with the same result and the switch of a slide stays smooth; say whether this counts as the same inputs. User sees: no.

I10. The scroll keys. `scrollContainer` (`shell/keys/key-dom.ts:86-87`) takes the first `[data-scroll]` inside the pane's, and Stage's frame has it. A prepared Stage earlier in the document takes the scroll keys of a too-tall slide. Expected: the shown slide scrolls. Add to case 40. User sees: no choice.

I11. Two differences in a row whose base the page does not hold: today's `subscribe(['sessions'], true)` per message asks twice for 989 KB. Expected: one ask until the whole payload arrives. Add to case 13. A whole payload that fails the page's shape leaves it asking at every message. User sees: no.

I12. An unfinished fold or scan and a `close`: `watchUsage.build` checks `closed` only before the fold, so a publish follows `close` today. Covered by "nothing is published after it" in item 4's last line, but with no case. A watcher rebuilt on a changed `accounts` key (`local.ts` BUILT_FROM) closes one worker and starts another, with two writers of one cache file for a moment: expected one whole, atomic file. Add one case for each. User sees: no.

I13. Line endings. Today's fold reads by `readline`, which splits on U+2028 (a scratch program printed `lines 2` for one JSON line that holds it) and drops such a record; `foldFrom` keeps it. Usage totals can rise. Smallest change: say "a whole read" means the new reader and list the change. User sees: usage totals, a correction.

I14. A thread row's name cut by the column: the hover words (`reveal.svelte.ts` `whole`) are label and tail, so a 200-character subject (case 44) is not in them. Expected: the subject is in the cut row's hover words. User sees: yes, a tooltip; the default is enough.

I15. A row added or removed while a later row has the keyboard: the list is keyed `${at}:${row.id}` (`Ticker.svelte`), so every row after the change is made again and loses the focus. Case 47 says only that the rows follow. Expected: focus stays on the same thread, or the brief says it goes. User sees: yes, small.

## ADRs

Confirmed none: `ls docs/adr` printed "No such file or directory", `docs` holds apps.md, data-map.md, decks.md, diagrams, HELP.md, licenses, palette.md, templates.md, third-party.md; `grep -n "standards\|adr\|libraries" .agents/plan.yaml` prints `standards` (line 6) and `libraries` (line 12) and no `adr`. Line 5 of the brief still says to read "the ADRs this brief names"; it names none.

## Dictated text

None for a file of the product. The wire field names of decision 1 are a shape, not text. The report's first line, "Everything in the brief is done", matches `spec.md` "Report".

## Declined to judge

- The timings and byte figures listed under Premises: told not to rerun.
- Whether `requestIdleCallback`, `visibility: hidden` and `inert` keep a prepared slide out of Cmd+F in Chrome and Electron: needs a page.
- Whether an image of a prepared neighbour is complete at once when the slide is shown: needs a page; I8 stands on the rule as written.
- Whether `npm run test:quick` and the vitest line of Verify 2 pass: not run.
- Which of the G entries in P2 the diff reaches: depends on the build.

## Usage

Agent afa29be52347a316a, claude-opus-5-5, 370820 tokens, 75 tool uses, 537.3 s.

## Closed

- N1 and Names 1 to 8: `index.ts`'s 872 lines named; `doubles.ts` and `agent-pane.test.ts` named in the paths; the in-process readers are the two of `sessions`, the four `config` sinks left as they are, since a brief check never widens a step.
- P1: item 3 and case 23. P2: the guarded entries by their Code lines. P3: `lastActivity` left out of `placed`, the figure corrected, case 10. P4: the tree compared by its placements.
- B1: `src/lib/server/machine/threads/`. B2: one function in `model-sessions.ts`. B3: the two options leave the watcher, case 7 replaced. B4: the types move to `state/life/present.ts`. B5: a folder of `screen/`. B6: a snippet the caller gives. B7: `opened: ['emails']`.
- The question: verify 3 has a bar and a key measure; cases 18, 33 and 35 say what they prove.
- I1, I2, I3, I5: item 1 and cases 6 and 7. I4: item 4 and case 28. I6: item 3 and case 23. I7, I8, I9: item 5 and cases 35 and 40. I10: item 6 and case 40. I11: item 2 and case 13. I12: items 1 and 4, case 33. I13: item 4. I14, I15: item 7 and case 49.
- B7, I14, I15 and I13 need a choice a reader sees; ruled as open item 767 by the orchestrator under automode.
- Dictated text: none, before and after these changes.
