Everything in the brief is done, with one figure of verify 3 short of its bound: for the usage fold of the planted store of 5 KB records the longest hold of the server's thread went from a median of 7 ms to 1.6 ms, which is not a tenth, because the base fold yields every 64 KB and the monitor's readings of a thread that does nothing but wait lie between 1 and 2 ms (the five after readings are 1.2 to 2.1 ms, the thread active 0.8 to 2.1 ms in each); the sessions scan (73.5 ms to 1.7 ms) and the usage fold of the store of 24 MB records (20 ms to 1.8 ms) are under a tenth, and the thread's active time in the 5 KB fold went from a median of 416.3 ms to 1.2 ms.

## Open items of the state file

`sed -n 175,188p .scratch/migration/orchestrator-state.md`: the section holds no item. Its text is:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run, on the unchanged tree

The case-run programs are in the appendix, with the planted stores of `plant.ts` and the page of `page.ts`. Each was run with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch` and `TMUX` unset. No case showed a rule of the brief wrong. The programs of cases 1 to 33 were adapted where the changed types ask (the worker in place of the probe, the count of `send-keys` processes in place of the way taken); the appendix holds them as they run on the changed tree, and `page.ts` and the first run on the unchanged tree read the same payloads.

Cases 1 to 9, `node .agents/scratch/cases-sessions.ts`:

```
case 1 first payload equals sessions() as objects: true
case 1 and as JSON text: true
case 1 hook, live state, terminals: ["notification","working",1]
case 8 tools in one payload: ["claude","codex"]
case 2 scans after three events in one scan: 1
case 3 publishes and onChange of rescans that read the same: [2,2]
case 4 the record carries the hook recorded during the scan: null
case 5 publishes after close in a scan: 0
case 6: no worker on this tree
case 7 after the Stop: ["idle","stop"]
case 7 publishes of the re-checks in between: 0
case 7 after the rescan: ["working","stop","told",1]
case 7b published by a re-check, messages: [0,0]
case 7b published by the rescan, messages: [1,1]
case 9 a cache that does not parse: records, and the cache after: [4,4]
case 9 the cache file written by a rescan that changed no entry: true
case 9 a cache that cannot be written: records, files beside it: [4,["cache.json","sessions.json"]]
stderr lines in all: []
threads started: 0
```

Cases 10 to 19, `node .agents/scratch/cases-channel.ts` (case 12 "base against the last sent" is "whole", since no message is a difference):

```
case 10 first message whole, bytes, records: [true,4188877,40,52235]
case 10 one record changed, its lastActivity alone moving the tree: {"equal":true,"messages":1,"bytes":4188875,"keys":["records","workspaces"],"records":40,"kept":0}
case 11 one added: {"equal":true,"messages":1,"bytes":4194971,"keys":["records","workspaces"],"records":41,"kept":0}
case 11 one removed: {"equal":true,"messages":1,"bytes":4090259,"keys":["records","workspaces"],"records":40,"kept":0}
case 11 one moved to another area: {"equal":true,"messages":1,"bytes":4090699,"keys":["records","workspaces"],"records":40,"kept":0}
case 11 one renamed by the overrides: {"equal":true,"messages":1,"bytes":4090704,"keys":["records","workspaces"],"records":40,"kept":0}
case 11 the order changed: {"equal":true,"messages":1,"bytes":4090704,"keys":["records","workspaces"],"records":40,"kept":0}
case 12 messages while behind, after, records in it, base against the last sent, equal: [0,1,40,"whole",true]
case 13 asked, payload kept: [0,true]
case 13 whole taken: [true,["records","workspaces"]]
case 13 a whole payload that fails the shape: asked: [0,true]
case 14 whole from the restarted server, versions: [true,1]
case 14 and the next after it: [true,2]
case 15 terminals: ["[{\"id\":\"t1\",\"name\":\"one\"}]",true,4090733]
case 15 terminals: ["[{\"id\":\"t1\",\"name\":\"two\"}]",true,4090733]
case 15 terminals: ["null",true,4090694]
case 16 two of one id: [["/projects/hub3/s0.jsonl","/projects/hub0/s0.jsonl"],true]
case 17 bytes, keys, records, the tree copy has the hook, equal: [4096136,["records","workspaces"],41,"notification",true]
case 18 roots of a publish before the subscribe: ["/r1"]
case 18 roots after the next publish: ["/r1","/r2"]
case 18 texts of a sessions message made with no page subscribed: 2
case 19 a channel with none: ["{\"channel\":\"other\",\"version\":1,\"payload\":{\"a\":1}}","{\"channel\":\"other\",\"version\":2,\"payload\":{\"a\":2}}"]
```

Case 13's second message before the answer and the shape that fails are read on this tree as a whole payload that always applies, so both rows are false as "asked": 0. The programs print no line for a difference on a tree that has none.

Cases 20 to 26, `node .agents/scratch/cases-keys.ts`, on a private tmux server:

```
case 22 keys before and after the client attached: 0123456789abcdefghij
case 20, 21 ten keys in a row, the ways they went, ms: ["KLMNOPQRST","run,run,run,run,run,run,run,run,run,run",256]
case 20 with none attached: ["xyz","run"]
case 24 the bytes in order, pieces of inputArgs: [true,3,3]
by-hand panes: 2
case 25 id of the pane: h80062p3-claude
case 25 the pane, the other pane, the way: ["hand","","run"]
UNCAUGHT: write after end
case 23 a key written in the turn close is called: ["rejected: write after end",0]
UNCAUGHT: write EPIPE
case 23 a key written after the process died, before its exit is handled: ["rejected: write EPIPE",0]
case 23 exits with a key written and not answered: ["rejected: the control client exited",0]
case 23 a client that never answers: stderr, ms of the first key, ways: [[],119,"run,run"]
case 23 and what the pane got: z12
case 26 a socket without the token: ["pty: input on pty:a1b2c3-shell from a socket without the write token","pty: no scrollback for oculus-a1b2c5-shell: the control client exited","pty: no cursor for oculus-a1b2c5-shell, the whole capture is sent: the control client exited"]
```

The `UNCAUGHT` lines are the program's `uncaughtException` listener: on the unchanged tree a write to an ended client is an `error` event of `child.stdin` nobody hears, which ends a server. Case 26 "a stream terminal" is by reading: `channel.ts` reaches a stream by its own path, which no line of the diff touches.

Cases 27 to 33, `node .agents/scratch/cases-usage.ts`:

```
case 27 rows equal a whole read: true
case 27 bytes: first, appended, second: [360,446,806]
case 27 a third with nothing new: [0]
case 28 shrank: [true,359,359]
case 28 same inode and size, mtime moved: [true,7,359,359]
case 28 a new inode at the same size and mtime: [false,7]
case 28 one added: [false,2]
case 28 one gone: [true,1]
case 29 rows equal a whole read, model and total carried: [true,"gpt-x",25,423,160]
case 30 cut then completed: [25,40,true,583,160]
case 31 rows, then a day later, bytes read then: [2,1,0]
case 33 one store, both labels: [1,["one + two"]]
a record holding U+2028 is counted (input 6 counted, 1 dropped): 1
case 33 published rows are the class's: true
case 33 a worker that dies: no worker on this tree
case 33 publishes after a close during a fold: 1
stderr lines in all: []
```

Case 32 is `npx vitest run tests/server/sessions/usage-sessions.test.ts`; it was not run apart on the unchanged tree, the file is unchanged in the diff, and it passes in the run of verify 2 (`tests/server/sessions`).

Cases 34 to 49 on the unchanged tree, by reading it:

| Case | Reading on the unchanged tree |
|---|---|
| 34 | not met: `Slide.svelte` starts the search at mount and at every ask (`layOutSlide`), and keeps nothing. |
| 35 | not met: no slide is laid out but the drawn one (and the presenter's next). |
| 36 | met by there being no preparation. |
| 37 | met by the search at every ask: `document.fonts` `loadingdone`, image load and error, class change of the body, resize. |
| 38 | as now, the look. |
| 39 | as now, `failed` is set by a failed image. |
| 40 | met by there being nothing prepared; two decks with one key share nothing kept. |
| 41 to 43 | not met: the line has no fold and no group; `focus.ts` `FoldKey` has no `emails`. |
| 44 | not met for the rows; `InboxCard` held the name and age rules itself. |
| 45 | the line opens the Inbox by `openView('inbox')`; there is no thread row. |
| 46 | not met: no fold. |
| 47 | the rows follow the publish as any ticker row; no group. |
| 48 | `foldsShape` reads `closed` alone. |
| 49 | not met: the row key is `${at}:${row.id}` and `whole(row)` is the label and tail without the detail. |

A case the brief's own rules get wrong: none.

### After the change

Cases 1 to 9:

```
case 1 first payload equals sessions() as objects: true
case 1 and as JSON text: true
case 1 hook, live state, terminals: ["notification","working",1]
case 8 tools in one payload: ["claude","codex"]
case 2 scans after three events in one scan: 1
case 3 publishes and onChange of rescans that read the same: [0,0]
case 4 the record carries the hook recorded during the scan: notification
case 5 publishes after close in a scan: 0
case 6 stderr lines, payload standing: [["sessions watch: rescan failed: the worker thread ended"],true]
case 6 new workers, publishes, onChange after it: [1,0,0]
case 6 records kept as objects, of: [3,4]
case 7 after the Stop: ["idle","stop"]
case 7 publishes of the re-checks in between: 0
case 7 after the rescan: ["working","stop","told",1]
case 7b published by a re-check, messages: [0,0]
case 7b published by the rescan, messages: [1,1]
case 9 a cache that does not parse: records, and the cache after: [4,4]
case 9 the cache file written by a rescan that changed no entry: false
case 9 a cache that cannot be written: records, files beside it: [4,["cache.json","sessions.json"]]
stderr lines in all: ["sessions watch: rescan failed: the worker thread ended"]
threads started: 9
```

Cases 10 to 19:

```
case 10 first message whole, bytes, records: [true,4188877,40,52235]
case 10 one record changed, its lastActivity alone moving the tree: {"equal":true,"messages":1,"bytes":72863,"keys":["base","order","records","placed"],"records":1,"kept":39}
case 10 the same record changed again, its lastActivity alone moving, every placement as it was: {"equal":true,"messages":1,"bytes":57222,"keys":["base","order","records"],"records":1,"kept":39}
case 11 one added: {"equal":true,"messages":1,"bytes":24065,"keys":["base","order","records","placed"],"records":1,"kept":40}
case 11 one removed: {"equal":true,"messages":1,"bytes":20629,"keys":["base","order","records","placed"],"records":0,"kept":40}
case 11 one moved to another area: {"equal":true,"messages":1,"bytes":21027,"keys":["base","order","records","placed"],"records":0,"kept":40}
case 11 one renamed by the overrides: {"equal":true,"messages":1,"bytes":21032,"keys":["base","order","records","placed"],"records":0,"kept":40}
case 11 the order changed: {"equal":true,"messages":1,"bytes":4988,"keys":["base","order","records"],"records":0,"kept":40}
case 12: 
case 12 messages while behind, after, records in it, base against the last sent, equal: [0,1,3,true,true]
case 13 asked, payload kept: [1,true]
case 13 whole taken: [true,["records","workspaces"]]
case 13 a whole payload that fails the shape: asked: [1,true]
case 14 whole from the restarted server, versions: [true,1]
case 14 and the next after it: [true,2]
case 15 terminals: ["[{\"id\":\"t1\",\"name\":\"one\"}]",true,5027]
case 15 terminals: ["[{\"id\":\"t1\",\"name\":\"two\"}]",true,5027]
case 15 terminals: ["null",true,4090694]
case 16 two of one id: [["/projects/hub3/s0.jsonl","/projects/hub0/s0.jsonl"],true]
case 17 bytes, keys, records, the tree copy has the hook, equal: [57412,["base","order","records"],1,"notification",true]
case 18 roots of a publish before the subscribe: ["/r1"]
case 18 roots after the next publish: ["/r1","/r2"]
case 18 texts of a sessions message made with no page subscribed: 0
case 19 a channel with none: ["{\"channel\":\"other\",\"version\":1,\"payload\":{\"a\":1}}","{\"channel\":\"other\",\"version\":2,\"payload\":{\"a\":2}}"]
stderr lines in all: ["(node:15984) ExperimentalWarning: stripTypeScriptTypes is an experimental feature and might change at any time\n(Use `node --trace-warnings ...` to show where the warning was created)","git watch: reading the settings failed: depthOf is not a function"]
```

`git watch: reading the settings failed` comes from the program, which gives `watchGit` no options. Case 10's first line appends to the file of the session and moves its `lastActivity` past the others', so `group.ts` sorts it and its area to the front and `placed` goes with it; its second line moves the same record again, the order of the tree standing, and carries no tree.

Cases 20 to 26 (a key written to a never-answering client is one stderr line after 5000 ms, is not sent again, and the next key goes on to the same client, whose stub drops what it is given; the "z" in the pane is the key of the program's own client that the tmux server took once it ran again):

```
case 22 keys before and after the client attached: 0123456789abcdefghij
case 20, 21 ten keys in a row, send-keys processes, ms: ["KLMNOPQRST",0,13]
case 20 with none attached, send-keys processes: ["xyz",1]
case 24 the bytes in order, pieces of inputArgs: [true,3,3]
by-hand panes: 2
case 25 id of the pane: h17192p3-claude
case 25 the pane, the other pane, send-keys processes: ["hand","",0]
case 23 a key written in the turn close is called: ["rejected: write after end",0]
case 23 a key written after the process died, before its exit is handled: ["rejected: write EPIPE",0]
case 23 exits with a key written and not answered: ["rejected: the control client exited",0]
case 23 a client that never answers: stderr, ms of the first key: [["pty: input to a1b2c5-shell failed: the control client did not reply in 5000 ms","pty: input to a1b2c5-shell failed: the control client did not reply in 5000 ms"],5001]
case 23 and what the pane got: z
case 26 a socket without the token: ["pty: input on pty:a1b2c3-shell from a socket without the write token","pty: no scrollback for oculus-a1b2c5-shell: the control client exited","pty: no cursor for oculus-a1b2c5-shell, the whole capture is sent: the control client exited"]
stderr lines in all: ["pty: input to a1b2c5-shell failed: the control client did not reply in 5000 ms","pty: input to a1b2c5-shell failed: the control client did not reply in 5000 ms","pty: input on pty:a1b2c3-shell from a socket without the write token","pty: no scrollback for oculus-a1b2c5-shell: the control client exited","pty: no cursor for oculus-a1b2c5-shell, the whole capture is sent: the control client exited"]
error connecting to /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O188/.agents/scratch/k-AUoh29/s (No such file or directory)
```

The line `error connecting to ...` is the program's own `kill-server` of the private socket, whose server had ended.

Cases 27 to 33:

```
case 27 rows equal a whole read: true
case 27 bytes: first, appended, second: [360,446,446]
case 27 a third with nothing new: [0]
case 28 shrank: [true,359,359]
case 28 same inode and size, mtime moved: [true,7,359,359]
case 28 a new inode at the same size and mtime: [true,9]
case 28 one added: [true,2]
case 28 one gone: [true,1]
case 29 rows equal a whole read, model and total carried: [true,"gpt-x",25,160,160]
case 30 cut then completed: [25,40,true,160,160]
case 31 rows, then a day later, bytes read then: [2,1,0]
case 33 one store, both labels: [1,["one + two"]]
a record holding U+2028 is counted (input 6 counted, 1 dropped): 6
case 33 published rows are the class's: true
case 33 a worker that dies: stderr, publishes: [["usage watch: cannot rebuild: the worker thread ended"],0]
case 33 the next change folds in a new one: [2,15]
case 33 publishes after a close during a fold: 0
stderr lines in all: ["usage watch: cannot rebuild: the worker thread ended"]
```

The held worker (the rules of one running and one waiting, failure, death and `close`, written once for both), `node .agents/scratch/cases-held.ts`:

```
a file event while a re-check waits, and a re-check while a rescan waits: ["start recheck","answered recheck","start rescan","answered rescan"]
a throw, a death, the next: [["start rescan","failed rescan: asked to","start rescan","failed rescan: the worker thread ended","start clock","answered clock"],"workers 2"]
close in the middle: ["start rescan"]
the worker ended: true
a running worker does not keep the process up: exit after 0 ms, ["start rescan"]
```

Cases 34 to 40, `npx vitest run --config .agents/scratch/em/vc.ts --root . --reporter=verbose --silent=false present.run` (a scratch jsdom harness that mounts `Framed` with the real client and measures of its own, so that a factor tried is a line; cases 38 (the filter, the Overview, the presenter screen, the audience window, the print page) and the main-thread times of case 35 are the look's):

```
case 35 the shown slide is searched: ["b@1.25","b@0.75","b@1","b@0.875","b@0.8125","b@0.78125","b@0.796875","b@0.8046875","b@0.796875"] ["b fit 0.796875"]
  an idle turn: []
  an idle turn: ["c@1.25 ahead"]
  an idle turn: ["c@0.75 ahead"]
  an idle turn: ["c@1 ahead"]
case 35 idle turns in all: 20 ["c@0.875 ahead","c@0.9375 ahead","c@0.96875 ahead","c@0.953125 ahead","c@0.9453125 ahead","c@0.9375 ahead","a@1.25 ahead","a@0.75 ahead","a@1 ahead","a@1.125 ahead","a@1.1875 ahead","a@1.15625 ahead","a@1.140625 ahead","a@1.1328125 ahead","a@1.125 ahead"] ["b fit 0.796875","c ahead fit 0.9375","a ahead fit 1.125"] idle left 0
case 40 the box of the prepared slides: true true marked to scroll in it: 0 in the whole page: 1 findings 0
case 40 the first marked box of the pane is the shown frame: b function
case 35 the next slide shown, factors tried: [] ["c fit 0.9375"]
case 34 shown again, factors tried: [] ["b fit 0.796875"]
case 35 the one before shown: [] ["a fit 1.125"]
case 36 preparing, four turns in: ["b2@1.25 ahead","b2@0.75 ahead","b2@1 ahead"]
case 36 a key meanwhile: shown at once ["c2 fit 1.125"] ["c2@1.25","c2@0.75","c2@1","c2@1.125","c2@1.1875","c2@1.15625","c2@1.140625","c2@1.1328125","c2@1.125"] turns left of the dropped work 1
case 36 two turns on, prepared for the new slide: ["b2@1.25 ahead"]
case 38 a deck of one slide: [] ["a fit 1.125"] 0
 <check mark> |em| .agents/scratch/em/present.run.ts > 34, 35, 36, 38 509ms
case 35 a fresh search draws c fit 0.9375 a kept layout draws c fit 0.9375 tried []
 <check mark> |em| .agents/scratch/em/present.run.ts > 34 and 35 against a fresh search 105ms
case 37 a text size change: true
case 37 another theme, a slide kept under the one left: true
case 37 a font loaded: ["c@1.25","c@0.75","c@1","c@0.875","c@0.9375","c@0.96875","c@0.953125","c@0.9453125","c@0.9375"]
case 37 a changed slide file: true
case 40 a slide of one key in two decks, back on the first: []
 <check mark> |em| .agents/scratch/em/present.run.ts > 37, 40 217ms
case 37 an image not loaded: kept {"slide":"[{\"key\":\"p\",\"kind\":\"image\",\"title\":\"p\",\"heading\":\"p\",\"src\":\"late.png\",\"alt\":\"alt p\",\"source\":{\"path\":\"a.md\",\"line\":1}},null,\"hub\"]","probe":[0.02,0.02],"page":"[\"\",\"\",0,0]","images":"[[],[\"waiting\"]]","loaded":"waiting"}
case 37 it loads late: searched again true [[],["640 480"]]
case 39 the neighbour prepared: [0] missing figure: alt q
case 39 shown: missing figure: alt q factors tried []
 <check mark> |em| .agents/scratch/em/present.run.ts > 37, 39 images 48ms
      Tests  4 passed (4)
```

Case 36's "turns left of the dropped work 1" is the first turn of the preparation of the new slide. Case 37's first line is a text size change, read from the probe. Case 40: the box of the prepared slides is `inert` and `aria-hidden`, holds no place marked to scroll, and the page's only marked place is the shown frame. Cmd+F is by reading: `visibility: hidden` text is not found by a browser's page search.

Cases 41 to 45, 47 to 49, `npx vitest run --config .agents/scratch/em/vc.ts --root . --reporter=verbose --silent=false emails.run`:

```
case 41 folded at the start: ["|fold|5 emails to reply / act on"] Unfold 5 emails to reply / act on expanded=false
case 41 unfolded: ["|fold|5 emails to reply / act on","heading under||To reply","under||Name r1 Subject r1 1d","under||Name r2 Subject r2 1d","heading under||To action / do","under||Name a1 Subject a1 1d","heading under||Unsorted","under||Name u1 Subject u1 1d","under||Name u2 Subject u2 1d"] Fold 5 emails to reply / act on expanded=true {"opened":["emails"]}
case 41 folded again: 1 {"opened":[]}
 <check mark> |em| .agents/scratch/em/emails.run.ts > 41 258ms
case 42: ["|fold|2 emails to reply / act on","heading under||Unsorted","under||Name u1 Subject u1 1d","under||Name u2 Subject u2 1d"]
case 43: [] 0 
case 44: ["|fold|7 emails to reply / act on","heading under||To reply","under||Name a 1d","under||bare@x.org Subject b 1d","under||Name c Subject c","under||Name d xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 1d","under||Name e <b>bold</b> see https://example.org/a *md* 1d","under||only subject 1d","under||(thread) 1d"] b elements: 0 links: 0
case 44 html of the subject:  4
 <check mark> |em| .agents/scratch/em/emails.run.ts > 42, 43 99ms
 <check mark> |em| .agents/scratch/em/emails.run.ts > 44 52ms
case 45 press on a thread, the Inbox tab state: {"reveal":{"hub":"google","key":"a1"},"search":""} google:a1 null
case 45 with it open, searched, the reply section folded: true {"search":"","folded":["reply"],"drafts":["google:r1"],"reveal":{"hub":"google","key":"r2"}}
case 45 the line itself: {"search":"","folded":["reply"],"drafts":["google:r1"],"reveal":{"hub":"google","key":"r2"}}
case 47 one gone: ["|fold|4 emails to reply / act on","heading under||To reply","under||Name r2 Subject r2 1d","heading under||To action / do","under||Name a1 Subject a1 1d","heading under||Unsorted","under||Name u1 Subject u1 1d","under||Name u2 Subject u2 1d"]
case 47 the last gone: [] {"opened":["emails"]}
case 48 {"opened":"emails"} rows 1 after a press {"opened":["emails"]}
case 48 {"opened":[1,null]} rows 1 after a press {"opened":["emails"]}
case 48 {"closed":["emails"]} rows 1 after a press {"closed":["emails"],"opened":["emails"]}
case 48 {"closed":["emails","tasks"],"opened":["emails"]} rows 9 after a press {"closed":["emails","tasks"],"opened":[]}
case 48 {"opened":{"emails":true}} rows 1 after a press {"opened":["emails"]}
case 48 null rows 1 after a press {"opened":["emails"]}
 <check mark> |em| .agents/scratch/em/emails.run.ts > 45 43ms
 <check mark> |em| .agents/scratch/em/emails.run.ts > 47 41ms
 <check mark> |em| .agents/scratch/em/emails.run.ts > 48 110ms
case 49 the keyboard after a row above left: true Name r2 Subject r2 1d
case 49 the keyboard after a row above joined: true Name r2 Subject r2 1d
case 49 hover words of a cut row: Name r2 Subject r2 1d
 <check mark> |em| .agents/scratch/em/emails.run.ts > 49 76ms
      Tests  7 passed (7)
```

Case 46 is the tab state that every fold of Focus uses (`setInstanceState`), which a reload and a move to another group keep and another tab does not hold; the look shows it.

## DONE / NOT DONE

| Item | Status | Check |
|---|---|---|
| 1 sessions scan in a worker | DONE | cases 1 to 9, held worker; verify 2 and 3 |
| 2 the channel sends what changed | DONE | cases 10 to 19 |
| 3 keys through the control client | DONE | cases 20 to 26 |
| 4 usage fold appended, in a worker | DONE | cases 27 to 33 |
| 5 kept layouts | DONE | cases 34, 35, 37, 40 |
| 6 neighbours prepared while idle | DONE | cases 35, 36, 38 in part, 39, 40; the rest of 38 the look |
| 7 the emails unfold | DONE | cases 41 to 45, 47 to 49; 46 the look |
| verify 1 | DONE | below |
| verify 2 | DONE | below |
| verify 3 | DONE, one figure short of its bound (the first line) | below |
| verify 4 | DONE | below |
| verify 5 | DONE | below |

Verify 1. `npm run diagrams` exits 0. `npm run test:quick`, `TMPDIR` unset, on the final tree, its exit 0 and its lines:

```
test:quick: 69 changed file(s), from git since HEAD
test:quick: 358 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (14.3 s)
ok      svelte-check (78.1 s): 1795381800014 COMPLETED 593 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (199.8 s): Duration  181.79s (transform 149.32s, setup 0ms, import 273.50s, tests 369.00s, environment 7ms)
ok      vitest (279.9 s): Duration  262.57s (transform 303.65s, setup 0ms, import 521.04s, tests 466.95s, environment 8.53s)
ok      vitest slow (341.1 s): Duration  323.97s (transform 36.14s, setup 0ms, import 218.38s, tests 1060.70s, environment 25ms)
test:quick: 344.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

The character-set check, `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' $(git diff --name-only --diff-filter=AM) $(git ls-files -o --exclude-standard)`, printed nothing and `echo "ascii exit $?"` gave `ascii exit 0`.

Verify 2. `npx vitest run tests/server/sessions tests/server/machine/pty tests/server/machine/runs/schedules tests/server/root tests/server/git`:

```
 Test Files  44 passed (44)
      Tests  378 passed (378)
```

Guarded tests. The entries whose Code line names a file of the diff, or a folder that holds one (G28, G32, G35, G40, G46, G51, G52, G78, G81, G82, G87, G90, G91, G109, G117, G146, G148, G152), have their test files named in `guarded.md`; G51 and G52 name none yet. `npx vitest run` over those files and `tests/views/sources/source/*.client.test.ts`: 71 files, 892 tests passed and 1 failed, `hub-portfolio.test.ts` "finds the page of an entry of the one hub that holds it and writes that hub's file (C6)", `Error: Test timed out in 5000ms.`; that file run alone: `Tests  16 passed (16)`. The timeout is the plain run's 5000 ms at a load of 13; the 20000 ms of the `vitest slow` project, which `test:quick` uses, passed it.

Verify 3. The measurement program (`measure.ts`, appendix; `node .agents/scratch/measure.ts`, private tmux server, planted stores). Before, on the unchanged tree:

```
load average: ["8.1","7.8","8.8"]
idle, ms: 22.6
the thread held during one scan, ms (seven; median): [[93.6,73.5,73.8,64.5,60.1,92.7,69.3],73.5]
cache file bytes: 3677699
bytes of the whole sessions payload: 4063677
bytes of the message for one changed record (median of seven): 4063669
bytes of that record: 50669
the thread held during one usage fold, an append to the transcript of 60 MB of 5 KB records, ms (five; median): [[8,5.5,286.8,7,2.8],7]
   the thread active during it, ms; the fold took with the waits of the monitor, ms: [[370.7,416.3,651.4,577.7,189.5],[621,930,1560,1424,437]]
the thread held during one usage fold, an append to the transcript of three 24 MB records, ms (five; median): [[15.9,23.3,17.2,20,23.8],20]
   the thread active during it, ms; the fold took with the waits of the monitor, ms: [[171.9,281.8,293.6,162.2,189.5],[412,653,860,370,409]]
bytes the first fold read, appended, the second fold read: [137763517,229,62665354]
key to echo, quiet, ms: {"median":"33.2","max":"79.0","count":40}
key to echo while scans and folds run, ms: {"median":"31.7","max":"272.8","count":80}
load average: ["12.3","8.8","9.1"]
```

After, on the final tree:

```
load average: ["13.0","12.5","14.8"]
idle, ms: 44.8
the thread held during one scan, ms (seven; median): [[1.3,1.7,1.9,2.6,2,1.6,1.6],1.7]
cache file bytes: 3677805
bytes of the whole sessions payload: 4063677
bytes of the message for one changed record (median of seven): 71378
bytes of that record: 50669
the thread held during one usage fold, an append to the transcript of 60 MB of 5 KB records, ms (five; median): [[2.1,1.2,1.2,1.6,1.9],1.6]
   the thread active during it, ms; the fold took with the waits of the monitor, ms: [[1.2,0.9,0.8,1,2.1],[109,103,102,102,106]]
the thread held during one usage fold, an append to the transcript of three 24 MB records, ms (five; median): [[1.2,1.8,1.8,1.9,1.3],1.8]
   the thread active during it, ms; the fold took with the waits of the monitor, ms: [[0.8,0.9,1.5,1.6,0.9],[104,102,106,109,103]]
bytes the first fold read, appended, the second fold read: [137763529,229,229]
key to echo, quiet, ms: {"median":"0.3","max":"1.1","count":40}
key to echo while scans and folds run, ms: {"median":"0.4","max":"4.6","count":80}
load average: ["12.1","12.3","14.7"]
```

| Figure | Before | After |
|---|---|---|
| longest hold in one scan, median of seven | 73.5 ms | 1.7 ms |
| longest hold in one fold, 5 KB records, median of five | 7 ms | 1.6 ms |
| longest hold in one fold, 24 MB records, median of five | 20 ms | 1.8 ms |
| thread active in the fold of 5 KB records, median | 416.3 ms | 1.2 ms |
| thread active in the fold of 24 MB records, median | 189.5 ms | 0.9 ms |
| key to echo, quiet, median and maximum | 33.2 / 79.0 ms | 0.3 / 1.1 ms |
| key to echo while scans and folds run, median and maximum | 31.7 / 272.8 ms | 0.4 / 4.6 ms |
| message for one changed record (record 50669 bytes) | 4063669 bytes | 71378 bytes |
| bytes the second fold reads for 229 appended | 62665354 | 229 |

Verify 4. `sh utils/unused-exports.sh` against the base list, `diff`:

```
1c1
< Unused exports (225)
---
> Unused exports (226)
87c87
< src/lib/server/machine/pty/tmux.ts: TMUX, TIMEOUT_MS, socketArgs, isTmuxCommand, quote, commandLine, decodeOutput, createParser, INPUT_MOST
---
> src/lib/server/machine/pty/tmux.ts: TMUX, socketArgs, isTmuxCommand, quote, commandLine, decodeOutput, createParser, INPUT_MOST
90c90
< src/lib/server/machine/usage/transcripts.ts: USAGE_DAYS
---
> src/lib/server/machine/usage/transcripts.ts: USAGE_DAYS, UsageTranscriptFold
109a110
> src/lib/server/sessions/stores/changes.ts: createScanner
227c228
< Unused exported types (107)
---
> Unused exported types (108)
269a271
> src/lib/server/machine/threads/held.ts: ToWorker
```

The step adds `UsageTranscriptFold`, `createScanner` and `ToWorker`: each has an importer in the tree (`fold-worker.ts`, `scan-worker.ts`, `serve.ts`) that knip does not reach, since a worker file is started by its path. `TIMEOUT_MS` left the list, as `panes/driver.ts` imports it.

Verify 5. No test was added or changed but the recorders named in the brief: `tests/fixtures/doubles.ts` (before: no line; after: `        type: () => Promise.resolve(),`), `tests/server/machine/pty/agent-pane.test.ts` (before: no line; after: `                    type: () => Promise.resolve(),`), `tests/server/machine/pty/channel.test.ts` (before: no line; after: `            async type(_id: string, args: string[]): Promise<void> {`, `                await this.run(args);`, `            },`).

Also run: `npx tsc --noEmit -p tsconfig.json` (exit 0), `npx prettier --check` on the changed files of `src` and `tests` (all matched), `sh utils/folder-check.sh` (printed nothing, exit 0). The history-word grep over the added and changed comment lines (`before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`) gave 13 hits, each judged to be the order of things in a run, never an earlier state of the code:

```
78:+// A last line with no newline is a record still being written and waits for the next fold. The
168:+// A message of a channel that sends differences (shapes/differences.ts) is made whole here, before
217:+ * once for the page and before any slide is drawn, and its count has moved when a slide hears of a
260:+    // snippet, drawn before the row's glyph in a box as high as the row, and whether those rows are
283:+     * leaves out of the list while it is closed; the row's fold control is drawn before its glyph.
293:+    // Once its slide has been laid out, the pane lays out the slide after it and the one before it
395:+    // out the slide after it and the one before it while it is idle, unseen (screen/Ahead.svelte).
460:+/** What one scan found: the path of every record in order, and what differs from the one before. */   [changes.ts]
499:+    // show and then the one before it, each in a Stage of the shown slide's frame size that nobody   [Ahead.svelte]
508:+    // meanwhile is answered between two of them. A slide is mounted once the one listed before it   [Ahead.svelte]
574:+// dropped before its turn runs nothing, and a queue left with no job holds no frame.   [layout-turns.ts]
632:+ * before the slide is laid out again: a resize of the frame moves it by rounding alone, and a text   [search.svelte.ts]
687:+            // with no placed figure whose content still runs past the foot, the cap is lowered   [search.svelte.ts]
```

The `still` of `transcripts.ts` is "a record still being written", of `search.svelte.ts` "whose content still runs past the foot"; `before` is "drawn before the row's glyph", "before it is", "before any slide is drawn", "before anything else of the page sees it", "the one before it" (a slide), "dropped before its turn". No test title was changed.

## Files

Lines, `git diff --numstat` (added, deleted) and the size of each new file:

```
306  304  docs/diagrams/channels.dot
856  844  docs/diagrams/channels.svg
4  4  docs/diagrams/layer-server.dot
4  4  docs/diagrams/layer-server.svg
1  1  docs/diagrams/layer-state.dot
1  1  docs/diagrams/layer-state.svg
4  4  docs/diagrams/layer-views.dot
4  4  docs/diagrams/layer-views.svg
5  5  docs/diagrams/layers.dot
5  5  docs/diagrams/layers.svg
3  1  src/lib/data/model/index.ts
85  0  src/lib/data/model/model-sessions.ts
94  10  src/lib/server/core/channels.ts
8  7  src/lib/server/machine/pty/channel.ts
26  0  src/lib/server/machine/pty/panes/driver.ts
22  8  src/lib/server/machine/pty/tmux.ts
9  14  src/lib/server/machine/runs/schedules/watch.ts
82  51  src/lib/server/machine/usage/transcripts.ts
38  53  src/lib/server/machine/usage/watch.ts
27  40  src/lib/server/root/watch/git.ts
89  81  src/lib/server/root/watch/sessions.ts
19  3  src/lib/server/sessions/cache.ts
10  18  src/lib/server/sessions/group.ts
6  4  src/lib/server/sessions/stores/transcripts.ts
27  11  src/lib/state/boards/focus.ts
1  1  src/lib/state/client/shapes/payloads.ts
40  5  src/lib/state/client/socket.svelte.ts
24  8  src/lib/state/feeds/inbox.ts
90  32  src/lib/state/life/present.svelte.ts
67  4  src/lib/state/life/present.ts
27  4  src/lib/ui/display/ticker/Ticker.svelte
29  21  src/lib/ui/display/ticker/reveal.svelte.ts
23  2  src/lib/ui/display/ticker/ticker-rows.ts
5  5  src/lib/views/academic/present/Panel.svelte
14  1  src/lib/views/academic/present/Present.svelte
39  342  src/lib/views/academic/present/Slide.svelte
6  6  src/lib/views/academic/present/arrange/Overview.svelte
7  7  src/lib/views/academic/present/arrange/Tile.svelte
1  1  src/lib/views/academic/present/parts/Equation.svelte
8  8  src/lib/views/academic/present/parts/Plain.svelte
2  2  src/lib/views/academic/present/parts/project/Project.svelte
6  2  src/lib/views/academic/present/presenter/Presenter.svelte
45  13  src/lib/views/academic/present/screen/Framed.svelte
8  2  src/lib/views/academic/present/screen/Stage.svelte
0  95  src/lib/views/academic/present/screen/drawn-slide.ts
3  3  src/lib/views/academic/present/screen/formula.ts
8  2  src/lib/views/academic/present/screen/keys.ts
0  94  src/lib/views/academic/present/screen/layout-turns.ts
0  303  src/lib/views/academic/present/screen/slide-layout.ts
82  9  src/lib/views/boards/focus/CommandCenter.svelte
13  3  src/lib/views/boards/focus/CommandCenterView.svelte
5  1  src/lib/views/boards/focus/Focus.svelte
5  12  src/lib/views/feeds/inbox/InboxCard.svelte
41  13  src/lib/views/system/status/Gallery.svelte
24  3  src/routes/present/show/+page.svelte
1  0  tests/fixtures/doubles.ts
1  0  tests/server/machine/pty/agent-pane.test.ts
3  0  tests/server/machine/pty/channel.test.ts
140 0 src/lib/server/machine/threads/held.ts
10 0 src/lib/server/machine/threads/scan-worker.ts
34 0 src/lib/server/machine/threads/serve.ts
16 0 src/lib/server/machine/usage/fold-worker.ts
193 0 src/lib/server/sessions/stores/changes.ts
73 0 src/lib/state/client/shapes/differences.ts
110 0 src/lib/views/academic/present/screen/Ahead.svelte
116 0 src/lib/views/academic/present/screen/layout/drawn-slide.ts
105 0 src/lib/views/academic/present/screen/layout/layout-turns.ts
482 0 src/lib/views/academic/present/screen/layout/search.svelte.ts
285 0 src/lib/views/academic/present/screen/layout/slide-layout.ts
```

Moved by `mv` (deleted above, new below): `slide-layout.ts`, `drawn-slide.ts` and `layout-turns.ts` into `src/lib/views/academic/present/screen/layout/`; the search of `Slide.svelte` is there in the new `search.svelte.ts`. The diagrams `channels`, `layer-server`, `layer-state`, `layer-views` and `layers` are what `npm run diagrams` writes; `tests/checks/diagrams` is in the `test:quick` run. The channel diagram gains one node for a read it cannot name, `? src/lib/state/client/socket.svelte.ts`, beside the ten such edges of HEAD for a channel held in a variable.

Not listed in the brief's paths and not changed: `src/lib/ui/controls/heads/FoldControl.svelte`.

Scripts that wrote a file: none of the step's source files. The scratch programs were written by heredoc, and a Python one-off changed `present.run.ts`. This report's output blocks were filled from the scratch files by a Python one-off over markers in the text, which changed only this report.

## Judgment calls

- The held worker and its `serve` end are `src/lib/server/machine/threads/`, one shape for both; `comments.ts` is not reused: its per-request timeouts, aborts and many concurrent requests do not fit one running and one waiting. Each owner gives the worker file and the rule that joins two kinds.
- `close` posts the word to end instead of terminating the thread: a thread stopped in a file write leaves the write's temporary file. A server process that ends in the middle of the worker's cache write can leave a temporary `<cache>.<digits>` beside the cache; the cache file stays whole.
- The first `sessions` publish comes after the `onChange` listeners are registered, so it tells them: one more usage rebuild is queued at start.
- `createScanner`'s comparison of records is by text in the worker; the server compares by identity, except for the first whole answer of a new worker, where the content is compared to keep objects.
- A layout kept from a small frame (a tile, the next preview) is put on in the pane, as its inputs are fractions of the frame.
- The neighbours of `Ahead.svelte` stay mounted until the switch, so their images stay loaded.
- The deck's hub is part of a kept layout's `slide` input, since the stage words are drawn in it.
- A slide whose images are not decoded is searched at mount and put on at the image's load.
- `keepTab` skips controls inside an `inert` box, so the prepared slides hold no Tab stop.
- Under the line the headings and the thread rows are both set in; the heading rows are plain text.
- The fold control keeps its 22px size, centred in an 18px row box, the control drawn by a snippet of the caller.
- A long subject cuts the age tail off with the name; the hover words hold the whole line.
- A row of the Ticker is keyed by its id when it is unique and by place and id when it is not, and the keyboard's and the opened row are held by the key: an open row follows its row.
- The Gallery's Ticker sample has a fourth row that folds three chips, put back by the section's Reset.
- `threadAge` returns words (`''` for an unreadable age) and `threadName` is beside it; the two are read by `InboxCard` and the command center. `inbox.ts` no more re-exports `ageOf`, which nothing imports from it.
- `probe`, `codexProbe` and the usage watcher's `fold?` option are gone from the watchers' options; `sessions()` keeps its probes.
- No key was added to `config/text`: every word is one that exists.

## Host- and user-visible changes

| What | Before | After |
|---|---|---|
| `sessions` message after the first | the whole payload | `{ base, order, records, placed?, terminals? }` (decision 1) |
| `sessions` message for an unchanged rescan | published, listeners told | none |
| A rescan that read the same | publishes each time | publishes nothing |
| `sessions` at a page that lacks the base | not applicable | not applied; one ask for the whole payload until it comes |
| First `sessions` publish | during the watcher's start, synchronous | when the first scan answered |
| Cache file `sessions.json` | rewritten by every scan | written only when a scan changed an entry, atomically |
| A key of a terminal | a `tmux send-keys` process | `send-keys` on the control client while one is attached, else a process; a reply is awaited at most 5000 ms |
| A key written to a dead control client | ended the server by an unhandled `error` event | that command's failure and one stderr line (`pty: input to <id> failed: <reason>`) |
| A hook recorded while a scan runs | absent from the record published (case 4: `null`) | on the published record |
| A worker that dies | no worker | one line `sessions watch: rescan failed: the worker thread ended`, the payload stands, the next request starts another |
| Usage rows | a record holding U+2028 or a lone CR was dropped; the whole file read again | counted; only appended bytes read |
| A transcript line with no newline at its end | counted at once | counted when its newline comes |
| Present, a slide shown again or after a pause | searched | kept layout put on, no factor tried |
| Present, the neighbours | not drawn | drawn unseen and inert while the page is idle |
| Present, Tab in the presenter screen | every focusable control | not those in an inert box |
| Needs attention, the line of emails | a line | a fold control before it, closed at the start; open: the threads in three groups |
| Focus tab state | `closed` | `closed` and `opened` |
| Hover words of a cut row | label and tail | label, detail and tail |
| Inbox card | name and age rules of its own | read from `state/feeds/inbox.ts`, same words |

In flight, closed and superseded: a scan or a fold in flight is joined by one that waits; a `close` in the middle publishes nothing; a worker that dies fails what ran; a difference not yet sent is merged into the newest; the prepared slide a switch supersedes is dropped; a layout in search is ended by the slide's removal. Ids and keys checked: two records with one id in two stores are kept apart by path; an empty deck and a slide key the deck does not hold draw nothing prepared; a duplicated Ticker id falls back to place and id.

## Sentences made false

- `src/lib/ui/controls/heads/FoldControl.svelte:2-5`, "primitive of the headings beside it (GroupHead.svelte and FoldHead.svelte) ... so both headings name and draw it alike": also drawn by `CommandCenterView.svelte` and the Gallery's ticker. Not in the path list, so not edited.
- `docs/HELP.md:103` ("the feed lines: what the Lit Watch, Inbox and Scout feeds say needs doing") is true as it stands and does not mention the fold; whether the Help says it is a choice of the orchestrator. No sentence of `docs/data-map.md` or `docs/decks.md` was found false (`grep` over `docs` and `README.md` for the scan, `send-keys`, the usage fold, the laying out of slides and the folds).
- Rewritten, as each became true: the head comments of `channels.ts`, `watch/sessions.ts`, `watch/git.ts`, `usage/watch.ts`, `usage/transcripts.ts`, `socket.svelte.ts`, `Slide.svelte`, `Present.svelte`, `Framed.svelte`, `present/show/+page.svelte`, `inbox.ts`, `Focus.svelte`, `CommandCenter.svelte`, `Ticker.svelte`, `reveal.svelte.ts`, `Gallery.svelte`. The head comment of `pty/panes/driver.ts` is still true.

## Anything in the brief that was wrong or impossible

- "The one after at most a tenth of the one before" cannot hold for the fold of 5 KB records: the base fold yields between 64 KB chunks (median 7 ms) and the monitor's readings of a waiting thread lie between 1 and 2 ms, so a tenth of 7 ms is under what the instrument reads. The `idle` line of each run is one reading at the start, on a machine busy with another build (22.6 and 44.8 ms), and is no floor. It holds for the 24 MB records (20 to 1.8) and the scan.
- "each output piped through the filter the rules file names": `spec.md` names no filter (`grep -n -i filter .scratch/migration/agents/spec.md` finds nothing); the outputs are as printed, with the check mark of vitest written `<check mark>`.
- `docs/diagrams/layers.dot` and `.svg` are the only diagrams the paths name; `npm run diagrams` also rewrites `channels`, `layer-server`, `layer-state` and `layer-views`, and the diagrams test compares them.

## Runs of the verify list

`npm run test:quick` ran twice: the first on the tree with three comment lines over the hundredth column (`tests/checks/source/comment-width.test.ts`: `tmux.ts:431`, `ticker-rows.ts:38`, `CommandCenter.svelte:28`), the other failures of which were timeouts of tests under a machine load of 17 to 27 from another build; the second, on the final tree, passed. Verify 2 ran twice (both 44 files, 378 tests), the unused-exports comparison and the character-set check on the final tree. No whole-suite command (`npm test`, `test:landing`) was run.

## Appendix: the case-run programs

### `.agents/scratch/plant.ts`

```
// Case-run helper: planted Claude and Codex stores below .agents/scratch, and a page's end of a channel.
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { createRequire, syncBuiltinESMExports } from 'node:module';

export const HERE = import.meta.dirname;
export function dirOf(name: string): string {
    const dir = mkdtempSync(join(HERE, `${name}-`));
    if (!resolve(dir).startsWith(resolve(HERE) + sep)) throw new Error('outside');
    process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
    return dir;
}
export const at = (seconds = 0): string => new Date(Date.now() + seconds * 1000).toISOString();
export function user(cwd: string, text = 'hello', stamp = at()): string {
    return JSON.stringify({ type: 'user', timestamp: stamp, cwd, origin: { kind: 'human' }, message: { role: 'user', content: text } }) + '\n';
}
export function said(text = 'hi', tokens = 1, stamp = at(), file?: string, model = 'claude-test'): string {
    const content: unknown[] = [{ type: 'text', text }];
    if (file !== undefined) content.push({ type: 'tool_use', id: 't' + Math.random(), name: 'Edit', input: { file_path: file } });
    return JSON.stringify({ type: 'assistant', timestamp: stamp, message: { role: 'assistant', model, content, stop_reason: 'end_turn', usage: { input_tokens: tokens, output_tokens: 1 } } }) + '\n';
}
export function transcript(cwd: string, files = 3): string {
    let out = user(cwd);
    for (let i = 0; i < files; i += 1) out += said(`step ${i}`, 10, at(-600 + i), `${cwd}/src/folder-${i % 7}/file-number-${i}.ts`);
    return out;
}
export function put(path: string, text: string): string {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    return path;
}
export function rollout(store: string, id: string, lines: unknown[]): string {
    const path = join(store, '2026', '11', '22', `rollout-2026-11-22T10-00-00-${id}.jsonl`);
    return put(path, lines.map((one) => JSON.stringify(one) + '\n').join(''));
}
export const turnContext = (model: string) => ({ type: 'turn_context', timestamp: at(), payload: { model, cwd: '/ws' } });
export const tokens = (input: number, output: number) => ({ type: 'event_msg', timestamp: at(), payload: { type: 'token_count', info: { total_token_usage: { input_tokens: input, output_tokens: output } } } });
export { appendFileSync, utimesSync, join };
export const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
export async function until(test: () => boolean, ms = 8000): Promise<boolean> {
    const end = Date.now() + ms;
    while (!test()) {
        if (Date.now() > end) return false;
        await wait(10);
    }
    return true;
}
export function show(name: string, value: unknown): void {
    console.log(`${name}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
}
/** Every Worker a program starts, caught before the module under test imports it. */
export const workers: import('node:worker_threads').Worker[] = [];
export function catchWorkers(): void {
    const threads = createRequire(import.meta.url)('node:worker_threads') as { Worker: new (...a: never[]) => object };
    const Real = threads.Worker;
    threads.Worker = class extends (Real as unknown as new (...a: unknown[]) => object) {
        constructor(...a: unknown[]) {
            super(...a);
            workers.push(this as unknown as import('node:worker_threads').Worker);
        }
    } as never;
    syncBuiltinESMExports();
}
export function catchErrors(): string[] {
    const lines: string[] = [];
    console.error = (...a: unknown[]) => void lines.push(a.map(String).join(' '));
    return lines;
}
```

### `.agents/scratch/page.ts`

```
// Case-run helper: the page's state modules (.svelte.ts) loaded by node, and a page on a fake socket.
import { readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { compileModule } from 'svelte/compiler';

const LIB = join(import.meta.dirname, '../../src/lib');
registerHooks({
    resolve(name, context, next) {
        if (name.startsWith('$lib/')) {
            const path = join(LIB, name.slice(5));
            return next(pathToFileURL(path.endsWith('.ts') ? path : `${path}.ts`).href, context);
        }
        return next(name, context);
    },
    load(url, context, next) {
        if (!url.endsWith('.svelte.ts')) return next(url, context);
        const file = fileURLToPath(url);
        const code = stripTypeScriptTypes(readFileSync(file, 'utf8'));
        return {
            format: 'module',
            shortCircuit: true,
            source: compileModule(code, { filename: file, generate: 'client', dev: false }).js.code
        };
    }
});

type Listener = (event: unknown) => void;
export class FakeWebSocket {
    static OPEN = 1;
    static made: FakeWebSocket[] = [];
    readyState = 1;
    sent: string[] = [];
    heard = new Map<string, Listener[]>();
    constructor(_url: string) {
        FakeWebSocket.made.push(this);
    }
    addEventListener(name: string, fn: Listener): void {
        this.heard.set(name, [...(this.heard.get(name) ?? []), fn]);
    }
    emit(name: string, event: unknown = {}): void {
        for (const fn of this.heard.get(name) ?? []) fn(event);
    }
    onsent: (text: string) => void = () => {};
    send(text: string): void {
        this.sent.push(text);
        this.onsent(text);
    }
    close(): void {
        this.readyState = 3;
        this.emit('close');
    }
}
Object.assign(globalThis, { WebSocket: FakeWebSocket, location: { host: 'x', href: 'http://x/' } });

export async function page(): Promise<{ entities: any; socket: any; ws: () => FakeWebSocket }> {
    const { createEntities } = await import('../../src/lib/state/client/entities.svelte.ts');
    const { createSocket } = await import('../../src/lib/state/client/socket.svelte.ts');
    const entities = createEntities();
    const writes = { writeToken: () => 't', onToken: () => {}, renewToken: () => Promise.resolve() };
    const socket = createSocket(entities, writes as never);
    return { entities, socket, ws: () => FakeWebSocket.made.at(-1)! };
}
```

### `.agents/scratch/sessions-base.ts`

```
// Layer 2, server. The `sessions` channel: scan the session stores at start, then rescan and
// publish whenever one changes. It watches, for every account the
// `accounts` of the hubs' `.oculus/local.yml` files name, `<dir>/projects` (transcripts) and
// `<dir>/sessions` (the registry) of each Claude account and `<dir>/sessions` (the rollouts) of
// each Codex account, every folder once by its real path (sessions/folders.ts).
//
// One debounce over every handle, lodash's `debounce` with a quiet (DEBOUNCE) and a maximum wait
// (MAX_WAIT). A transcript is appended to as a session works, so a change there is an ordinary
// .jsonl write, and a working session writes more often than the quiet, which every write restarts;
// the maximum wait is what still publishes a terminal started, renamed or ended, and the session's
// own records, while it works. A registry file appears when a session starts, changes when it goes
// from busy to idle, and vanishes when it ends; a rollout appends under YYYY/MM/DD, and a new day
// makes a new folder, which the recursive watch on the store's root sees. One more is a file no
// session writes: the overrides file, which is api/write's, and without it a dismissal or a pin
// made on one page would not reach another until a transcript happened to change. The byte-offset
// cache in sessions/cache.ts is what makes the rescan cost the appended bytes rather than the
// whole store, and the watch keeps the latest record stamp of each subagent's transcript
// (sessions/stores/stamps.ts), so such a file is read again only when its size or time moved.
//
// The 15 s liveness re-check covers the changes to the payload no file event announces. A process
// can die without its registry file changing, and a Codex rollout is live only while a codex
// process runs and the file is fresh (sessions/stores/codex.ts, codexLive), so a session goes from
// live to ended with nothing written anywhere. The re-check therefore rescans on a timer and
// publishes only when the set of live ids or one of their states changed, so a quiet machine sees
// no traffic on the channel.
//
// The slow clock beside it is a full rescan every few minutes whatever the events said. A write
// that lands while a watch is being opened is announced to nobody, and a re-check that sees the
// same live ids in the same states publishes nothing for it, so without the clock those bytes wait
// for the next write.

import { watch } from 'node:fs';
import { basename, dirname } from 'node:path';
import type { FSWatcher } from 'node:fs';
import { debounce as debounced } from 'lodash-es';
import type { SessionRecord, SessionsPayload, Terminal } from '../../../data/model/index.ts';
import type { Hub } from '../../core/channels.ts';
import { sessions } from '../../sessions/index.ts';
import type { CodexProbe } from '../../sessions/stores/codex.ts';
import { distinctFolders } from '../../sessions/folders.ts';
import type { Probe } from '../../sessions/registry.ts';
import { defaultOverridesPath } from '../../sessions/overrides.ts';
import type { ProjectFolder } from '../../sessions/group.ts';
import type { HookStore } from '../../sessions/stores/hooks.ts';
import { createStamps } from '../../sessions/stores/stamps.ts';
import type { Watcher } from './portfolio/portfolio.ts';

/** Milliseconds of quiet after the last file event before one rescan runs. */
export const DEBOUNCE = 500;
/**
 * Milliseconds the first event of a burst waits at most for its rescan, however often events keep
 * coming. A session that is working appends to its transcript many times a second and each append
 * restarts the quiet, so without a maximum wait neither a terminal started, renamed or ended nor
 * the session's own records would be published for as long as it works. Twice the quiet keeps a
 * burst that ends within one quiet to one rescan, and writes that never stop cost about one rescan
 * a second.
 */
export const MAX_WAIT = 2 * DEBOUNCE;
/** Milliseconds between two liveness re-checks. */
export const LIVENESS = 15000;
/**
 * Milliseconds between two full rescans that run whether or not a file event came. fs.watch can
 * miss a write that lands in the moment a watch is being opened, and a store whose only change was
 * that write would then stay unread until the next one: the liveness re-check publishes nothing for
 * it, since a session that was already live with the same state has the same signature. Five
 * minutes is slow enough to cost nothing on a quiet machine and short enough that a missed event is
 * not what a page shows for the rest of the day.
 */
export const RESCAN = 300000;
export const WINDOW_DAYS = 2;
export const MAX_SESSIONS = 40;

/**
 * What the watcher needs of server/machine/pty/channel.ts's Terminals: the list, null until tmux
 * has answered once, and when it changed.
 */
export type TerminalSource = {
    list(): Terminal[] | null;
    onChange: (listener: () => void) => () => void;
};

export type SessionsWatchOptions = {
    /**
     * The Claude Code transcript folders, `<dir>/projects` of every Claude account
     * (sessions/folders.ts's sessionFolders); none read when absent.
     */
    stores?: string[];
    /** The Codex CLI rollout folders, `<dir>/sessions` of every Codex account. */
    codexStores?: string[];
    /** Claude Code's session registries, `<dir>/sessions` of every Claude account. */
    registries?: string[];
    /** The byte-offset cache file; `defaultCachePath()` when absent. */
    cache?: string;
    /** The per-session overrides file; `defaultOverridesPath()` when absent. */
    overrides?: string;
    /**
     * The folders a workspace is looked for under, the machine's `sessions_roots`; none when it is
     * absent.
     */
    roots?: readonly string[];
    /**
     * Every project folder with its title, read again at every rescan. It is a function rather than
     * a list so the watcher follows the portfolio's latest snapshot without importing the portfolio
     * watcher: the two meet on the hub, not on each other.
     */
    projectFolders?: () => ProjectFolder[];
    windowDays?: number;
    maxSessions?: number;
    debounce?: number;
    /** Milliseconds between liveness re-checks; 0 turns the re-check off. */
    liveness?: number;
    /** Milliseconds between full rescans that no event asked for; 0 turns the clock off. */
    rescanEvery?: number;
    /**
     * The tmux terminals. The list is read here at every rescan and the watcher republishes
     * whenever the source says it moved, so a terminal started anywhere appears on the page without
     * the page asking. When this option is absent (a process with no terminals), and while the
     * source has read no list yet, the payload carries no `terminals` field at all.
     */
    terminals?: TerminalSource;
    /** The request hook store owned by ServerContext. */
    hooks?: HookStore;
    /** What the Claude liveness check asks of the system; stubbed by every test. */
    probe?: Probe;
    /** What the Codex liveness check asks of the system; stubbed by every test. */
    codexProbe?: CodexProbe;
};

export type SessionsWatcher = Watcher & {
    /** Subscribe to completed rescans owned by this watcher. */
    onChange: (listener: () => void) => () => void;
};

/** What the liveness re-check compares: every live session's id and the state it is in. */
export function liveSignature(records: SessionRecord[]): string {
    const parts: string[] = [];
    for (const record of records) {
        if (!record.live) continue;
        parts.push(`${record.id}:${record.state}:${record.liveStatus ?? ''}`);
    }
    return parts.sort().join('|');
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watch every account's session stores and registry, and publish on the `sessions` channel. A
 * rescan that throws is written to stderr and the previous payload stands. A store that cannot be
 * watched (it does not exist on this machine, say) is said once on stderr and the others are
 * watched anyway.
 */
export function watchSessions(hub: Hub, options: SessionsWatchOptions = {}): SessionsWatcher {
    const debounce = options.debounce ?? DEBOUNCE;
    const liveness = options.liveness ?? LIVENESS;
    const rescanEvery = options.rescanEvery ?? RESCAN;
    const handles: FSWatcher[] = [];
    const changeListeners = new Set<() => void>();
    let ticker: ReturnType<typeof setInterval> | null = null;
    let clock: ReturnType<typeof setInterval> | null = null;
    let signature: string | null = null;
    let closed = false;
    const stamps = createStamps();

    const read = (): SessionsPayload =>
        sessions({
            stores: options.stores,
            codexStores: options.codexStores,
            registries: options.registries,
            cachePath: options.cache,
            overridesPath: options.overrides,
            roots: options.roots,
            projectFolders: options.projectFolders?.() ?? [],
            windowDays: options.windowDays ?? WINDOW_DAYS,
            maxSessions: options.maxSessions ?? MAX_SESSIONS,
            probe: options.probe,
            codexProbe: options.codexProbe,
            hooks: options.hooks,
            stamps,
            terminals: options.terminals === undefined ? null : options.terminals.list()
        });

    const publish = (payload: SessionsPayload): void => {
        signature = liveSignature(payload.records);
        hub.publish('sessions', payload);
    };

    const rescan = (): void => {
        try {
            publish(read());
            for (const listener of changeListeners) listener();
        } catch (error) {
            console.error(`sessions watch: rescan failed: ${reason(error)}`);
        }
    };

    /**
     * The slow clock's full rescan: read both stores again whatever the events said, and publish
     * only when what was read is not what stands on the channel, so a quiet machine sees no
     * traffic.
     */
    const sweep = (): void => {
        try {
            const payload = read();
            const standing = hub.latest('sessions')?.payload;
            if (standing !== undefined && JSON.stringify(standing) === JSON.stringify(payload)) {
                return;
            }
            publish(payload);
            for (const listener of changeListeners) listener();
        } catch (error) {
            console.error(`sessions watch: rescan failed: ${reason(error)}`);
        }
    };

    /** A rescan whose result is published only when a session started, ended or changed state. */
    const recheck = (): void => {
        try {
            const payload = read();
            if (liveSignature(payload.records) === signature) return;
            publish(payload);
        } catch (error) {
            console.error(`sessions watch: liveness re-check failed: ${reason(error)}`);
        }
    };

    const queued = debounced(
        () => {
            rescan();
        },
        debounce,
        { maxWait: MAX_WAIT }
    );

    const queue = (): void => {
        if (closed) return;
        queued();
    };

    const open = (dir: string | undefined): void => {
        if (dir === undefined || dir === '') return;
        try {
            handles.push(watch(dir, { recursive: true }, () => queue()));
        } catch (error) {
            console.error(`sessions watch: cannot watch ${dir}: ${reason(error)}`);
        }
    };

    /**
     * The overrides file, watched through its own directory: fs.watch on a file that is replaced
     * by a rename, which is how server/core/json.ts writes it, stops seeing the new inode. One
     * watch per directory, not recursive, firing only for the names asked for, because the
     * transcript cache sits beside it in ~/.oculus and every scan rewrites it, so watching the
     * directory as a whole would make each scan cause the next one.
     */
    const openFiles = (files: string[]): void => {
        const names = new Map<string, Set<string>>();
        for (const file of files) {
            const folder = dirname(file);
            const held = names.get(folder) ?? new Set<string>();
            held.add(basename(file));
            names.set(folder, held);
        }
        for (const [folder, wanted] of names) {
            try {
                handles.push(
                    watch(folder, { recursive: false }, (_event, changed) => {
                        if (changed !== null && wanted.has(changed)) queue();
                    })
                );
            } catch (error) {
                console.error(`sessions watch: cannot watch ${folder}: ${reason(error)}`);
            }
        }
    };

    rescan();
    // A terminal starting, stopping or being renamed is a change to the payload and nothing under
    // the stores moved, so this handle is what carries it to every open page.
    const offTerminals = options.terminals?.onChange(() => queue()) ?? null;
    // Every account's folders, each once by its real path, so two accounts sharing a folder through
    // a symlink do not make one write announce itself twice.
    for (const folder of distinctFolders([
        ...(options.stores ?? []),
        ...(options.registries ?? []),
        ...(options.codexStores ?? [])
    ])) {
        open(folder);
    }
    // A dismissal or a pin is written by something other than a session, so nothing under the
    // stores changes and only this handle carries the write to every open page. The default path is
    // resolved at the call, so a process whose home directory differs sees its own.
    openFiles([options.overrides ?? defaultOverridesPath()]);
    if (liveness > 0) {
        ticker = setInterval(recheck, liveness);
        // The re-check must not be the reason a process stays up.
        if (typeof ticker === 'object' && typeof ticker.unref === 'function') ticker.unref();
    }
    if (rescanEvery > 0) {
        clock = setInterval(() => {
            if (!closed) sweep();
        }, rescanEvery);
        if (typeof clock === 'object' && typeof clock.unref === 'function') clock.unref();
    }

    return {
        onChange(listener: () => void): () => void {
            changeListeners.add(listener);
            return () => changeListeners.delete(listener);
        },
        close(): void {
            closed = true;
            if (offTerminals !== null) offTerminals();
            queued.cancel();
            if (ticker !== null) clearInterval(ticker);
            ticker = null;
            if (clock !== null) clearInterval(clock);
            clock = null;
            for (const handle of handles) handle.close();
            handles.length = 0;
            changeListeners.clear();
        }
    };
}
```

### `.agents/scratch/cases-sessions.ts`

```
// Cases 1 to 9 of O188, through watchSessions and the Hub alone.
import { chmodSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import * as P from './plant.ts';
P.catchWorkers();
const errors = P.catchErrors();
const { Hub } = await import('../../src/lib/server/core/channels.ts');
const { watchSessions } = await import('../../src/lib/server/root/watch/sessions.ts');
const { sessions } = await import('../../src/lib/server/sessions/index.ts');
const { HookStore, patchPayload } = await import('../../src/lib/server/sessions/stores/hooks.ts');
type Any = any;

function world(name: string, count = 3) {
    const dir = P.dirOf(name);
    const store = P.join(dir, 'claude', 'projects');
    for (let i = 0; i < count; i += 1) P.put(P.join(store, 'hub', `s${i}.jsonl`), P.transcript(P.join(dir, 'ws', `p${i}`)));
    const codex = P.join(dir, 'codex', 'sessions');
    P.rollout(codex, '0000-c', [P.turnContext('gpt-x'), P.tokens(10, 2)]);
    const registry = P.put(P.join(dir, 'claude', 'sessions', 'x', 'keep'), '');
    void registry;
    const registries = P.join(dir, 'claude', 'sessions');
    P.put(P.join(registries, `${process.pid}.json`), JSON.stringify({ sessionId: 's0', pid: process.pid, status: 'busy', name: 'n', kind: 'k', entrypoint: 'cli', cwd: dir, startedAt: 1, procStart: '' }));
    let scans = 0;
    const listeners = new Set<() => void>();
    let terminals: Any[] | null = [{ id: 't1', name: 'one' }];
    const hooks = new HookStore();
    const options: Any = {
        stores: [store], codexStores: [codex], registries: [registries],
        cache: P.join(dir, 'state', 'cache.json'), overrides: P.join(dir, 'state', 'sessions.json'),
        roots: [P.join(dir, 'ws')], projectFolders: () => { scans += 1; return []; },
        windowDays: 0, debounce: 30, liveness: 0, rescanEvery: 0, hooks,
        terminals: { list: () => terminals, onChange: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); } }
    };
    P.put(options.overrides, '{"sessions":{}}');
    const hub = new Hub();
    let published = 0;
    const real = hub.publish.bind(hub);
    hub.publish = (c: string, p: unknown) => { if (c === 'sessions') published += 1; return real(c, p); };
    let told = 0;
    const start = (more: Any = {}) => {
        const watcher = watchSessions(hub, { ...options, ...more });
        watcher.onChange(() => { told += 1; });
        return watcher;
    };
    const direct = () => sessions({ stores: [store], codexStores: [codex], registries: [registries], cachePath: P.join(dir, 'state', 'cache-direct.json'), overridesPath: options.overrides, roots: options.roots, projectFolders: [], windowDays: 0, maxSessions: 40, hooks, terminals });
    return { dir, store, codex, hub, hooks, options, start, direct, registries,
        get scans() { return scans; }, get published() { return published; }, get told() { return told; },
        payload: () => hub.latest('sessions')?.payload as Any,
        file: (i: number) => P.join(store, 'hub', `s${i}.jsonl`),
        tell: () => { for (const l of listeners) l(); },
        set terminals(v: Any) { terminals = v; } };
}
const noTime = (p: Any) => JSON.parse(JSON.stringify(p));

{
    const w = world('c1');
    w.hooks.record({ session: 's0', event: 'notification', at: P.at() });
    const watcher = w.start();
    await P.until(() => w.payload() !== undefined);
    const key = (o: Any) => JSON.stringify(o);
    P.show('case 1 first payload equals sessions() as objects', isDeepStrictEqual(w.payload(), w.direct()));
    P.show('case 1 and as JSON text', key(w.payload()) === key(w.direct()));
    P.show('case 1 hook, live state, terminals', [w.payload().records.find((r: Any) => r.id === 's0').hook?.event, w.payload().records.find((r: Any) => r.id === 's0').state, w.payload().terminals.length]);
    P.show('case 8 tools in one payload', [...new Set(w.payload().records.map((r: Any) => r.tool))].sort());
    await P.wait(700);
    const before = w.scans;
    const beforePublished = w.published;
    const beforeTold = w.told;
    for (let i = 0; i < 2; i += 1) { w.tell(); await P.wait(5); }
    await P.until(() => w.scans > before); // a scan runs (it has run already where it holds the thread)
    const during = w.scans;
    for (let i = 0; i < 3; i += 1) { w.tell(); await P.wait(3); }
    await P.wait(1500);
    P.show('case 2 scans after three events in one scan', w.scans - during);
    P.show('case 3 publishes and onChange of rescans that read the same', [w.published - beforePublished, w.told - beforeTold]);
    watcher.close();
}
{
    const w = world('c4');
    const watcher = w.start();
    await P.until(() => w.payload() !== undefined);
    await P.wait(600);
    const scans = w.scans;
    P.appendFileSync(w.file(1), P.said('more'));
    await P.until(() => w.scans > scans);
    w.hooks.record({ session: 's1', event: 'notification', at: P.at() });
    const published = w.published;
    await P.until(() => w.published > published, 1500);
    P.show('case 4 the record carries the hook recorded during the scan', w.payload().records.find((r: Any) => r.id === 's1').hook?.event ?? null);
    watcher.close();
}
{
    const w = world('c5');
    const watcher = w.start();
    await P.until(() => w.payload() !== undefined);
    await P.wait(600);
    const scans = w.scans;
    P.appendFileSync(w.file(1), P.said('more'));
    await P.until(() => w.scans > scans);
    watcher.close();
    const published = w.published;
    await P.wait(1200);
    P.show('case 5 publishes after close in a scan', w.published - published);
}
{
    const w = world('c6');
    const watcher = w.start();
    await P.until(() => w.payload() !== undefined);
    await P.wait(700);
    const held = w.payload();
    const seen = errors.length;
    const scans = w.scans;
    const worker = P.workers.at(-1);
    w.tell();
    await P.until(() => w.scans > scans);
    if (worker === undefined) P.show('case 6', 'no worker on this tree');
    else {
        const told = w.told;
        const published = w.published;
        await worker.terminate();
        await P.wait(100);
        P.show('case 6 stderr lines, payload standing', [errors.slice(seen), w.payload() === held]);
        const started = P.workers.length;
        w.tell();
        await P.until(() => w.scans > scans + 1);
        await P.wait(800);
        P.show('case 6 new workers, publishes, onChange after it', [P.workers.length - started, w.published - published, w.told - told]);
        P.appendFileSync(w.file(1), P.said('again'));
        await P.until(() => w.published > published);
        const now = w.payload();
        P.show('case 6 records kept as objects, of', [now.records.filter((r: Any) => held.records.includes(r)).length, now.records.length]);
    }
    watcher.close();
}
{
    const w = world('c7');
    const watcher = w.start({ liveness: 200 });
    await P.until(() => w.payload() !== undefined);
    await P.wait(600);
    const event: Any = { session: 's0', event: 'stop', at: P.at() };
    w.hooks.record(event);
    w.hub.publish('sessions', patchPayload(w.payload(), event));
    const s0 = () => w.payload().records.find((r: Any) => r.id === 's0');
    const published = w.published;
    P.show('case 7 after the Stop', [s0().state, s0().hook?.event]);
    await P.wait(700);
    P.show('case 7 publishes of the re-checks in between', w.published - published);
    const told = w.told;
    w.tell();
    await P.until(() => w.published > published, 2000);
    P.show('case 7 after the rescan', [s0().state, s0().hook?.event, 'told', w.told - told]);
    watcher.close();
}
{
    const w = world('c7b');
    const watcher = w.start({ liveness: 250, debounce: 1500 });
    await P.until(() => w.payload() !== undefined);
    await P.wait(300);
    const published = w.published;
    const scans = w.scans;
    const s1 = () => w.payload().records.find((r: Any) => r.id === 's1').messages;
    const was = s1();
    P.appendFileSync(w.file(1), P.said('more'));
    await P.until(() => w.scans >= scans + 2, 900);
    P.show('case 7b published by a re-check, messages', [w.published - published, s1() - was]);
    await P.until(() => w.published > published, 4000);
    P.show('case 7b published by the rescan, messages', [w.published - published, s1() - was]);
    watcher.close();
}
{
    const w = world('c9');
    P.put(w.options.cache, 'not json');
    const watcher = w.start();
    await P.until(() => w.payload() !== undefined);
    P.show('case 9 a cache that does not parse: records, and the cache after', [w.payload().records.length, Object.keys(JSON.parse(readFileSync(w.options.cache, 'utf8')).entries).length]);
    const stamp = statSync(w.options.cache).mtimeMs;
    await P.wait(700);
    w.tell();
    await P.wait(900);
    P.show('case 9 the cache file written by a rescan that changed no entry', statSync(w.options.cache).mtimeMs !== stamp);
    watcher.close();
    const v = world('c9b');
    P.put(v.options.cache, '{}');
    chmodSync(v.options.cache, 0o444);
    const second = v.start();
    await P.until(() => v.payload() !== undefined);
    P.show('case 9 a cache that cannot be written: records, files beside it', [v.payload().records.length, readdirSync(P.join(v.dir, 'state')).sort()]);
    second.close();
}
void noTime;
P.show('stderr lines in all', errors);
P.show('threads started', P.workers.length);
```

### `.agents/scratch/cases-channel.ts`

```
// Cases 10 to 19 of O188: the Hub, the page's socket and entities, and the server's own readers.
import { existsSync } from 'node:fs';
import * as P from './plant.ts';
import { page } from './page.ts';
const errors = P.catchErrors();
const { Hub } = await import('../../src/lib/server/core/channels.ts');
const { sessions } = await import('../../src/lib/server/sessions/index.ts');
const { patchPayload } = await import('../../src/lib/server/sessions/stores/hooks.ts');
type Any = any;
const changes = P.join(P.HERE, '../../src/lib/server/sessions/stores/changes.ts');
const difference: Any = existsSync(changes) ? ((await import(changes)) as Any).sessionsDifference : null;

const dir = P.dirOf('channel');
const store = P.join(dir, 'projects');
const COUNT = 40;
for (let i = 0; i < COUNT; i += 1) {
    const path = P.put(P.join(store, `hub${i % 4}`, `s${i}.jsonl`), P.transcript(P.join(dir, 'ws', `p${i % 6}`), 130));
    P.utimesSync(path, Date.now() / 1000 - i, Date.now() / 1000 - i);
}
let terminals: Any = undefined;
const overrides = P.put(P.join(dir, 'sessions.json'), '{"sessions":{}}');
const scan = (): Any =>
    sessions({ stores: [store], cachePath: P.join(dir, 'cache.json'), overridesPath: overrides, roots: [P.join(dir, 'ws')], windowDays: 0, maxSessions: 100, probe: { running: () => false, starts: () => new Map() }, terminals: terminals === undefined ? null : terminals });
/** A payload whose records are the held objects where their text is the same, as the server keeps them. */
let held = new Map<string, Any>();
const publish = (hub: Any, payload: Any): void => {
    const records = payload.records.map((r: Any) => {
        const was = held.get(r.path);
        return was !== undefined && JSON.stringify(was) === JSON.stringify(r) ? was : r;
    });
    held = new Map(records.map((r: Any) => [r.path, r]));
    hub.publish('sessions', { ...payload, records });
};

function serve(hub: Any, ws: Any) {
    const sizes: number[] = [];
    const texts: string[] = [];
    let gate: Promise<void> | null = null;
    let open = (): void => {};
    const sink: Any = {
        send: async (text: string) => {
            sizes.push(Buffer.byteLength(text));
            texts.push(text);
            ws.emit('message', { data: text });
            if (gate !== null) await gate;
        },
        close: () => {}
    };
    let asks = 0;
    let answer = true;
    ws.onsent = (text: string) => {
        const got = JSON.parse(text);
        if (got.type !== 'subscribe' || !got.channels.includes('sessions')) return;
        asks += 1;
        if (answer) hub.subscribe(sink, ['sessions']);
    };
    return { sizes, texts, sink, get asks() { return asks; }, set answer(v: boolean) { answer = v; },
        hold: () => { gate = new Promise((r) => (open = r)); },
        release: () => { gate = null; open(); } };
}
const text = (v: Any): string => JSON.stringify(v);
const equal = (hub: Any, p: Any): boolean => text(p.entities.sessions()) === text(hub.latest('sessions').payload);
const tick = () => P.wait(5);

const hub: Any = new Hub();
difference && hub.difference('sessions', difference);
publish(hub, scan());
const one = await page();
one.socket.connect(['sessions']);
const link = serve(hub, one.ws());
one.ws().emit('open');
await tick();
P.show('case 10 first message whole, bytes, records', [equal(hub, one), link.sizes[0], one.entities.sessions().records.length, Math.round(Buffer.byteLength(text(hub.latest('sessions').payload.records[0])))]);
const file = (i: number) => P.join(store, `hub${i % 4}`, `s${i}.jsonl`);
const step = async (name: string) => {
    const was = new Map(one.entities.sessions().records.map((r: Any) => [r.path, r]));
    const count = link.sizes.length;
    publish(hub, scan());
    await tick();
    const last = JSON.parse(link.texts.at(-1)!).payload;
    const kept = one.entities.sessions().records.filter((r: Any) => was.get(r.path) === r).length;
    P.show(name, { equal: equal(hub, one), messages: link.sizes.length - count, bytes: link.sizes.at(-1), keys: Object.keys(last), records: last.records.length, kept });
};
P.appendFileSync(file(0), P.said('moved', 1, P.at(30)));
await step('case 10 one record changed, its lastActivity alone moving the tree');
P.appendFileSync(file(0), P.said('moved', 1, P.at(60)));
await step('case 10 the same record changed again, its lastActivity alone moving, every placement as it was');
P.put(P.join(store, 'hub0', 'new.jsonl'), P.transcript(P.join(dir, 'ws', 'p1'), 5));
await step('case 11 one added');
const fs = await import('node:fs');
fs.rmSync(file(39));
await step('case 11 one removed');
P.put(overrides, text({ sessions: { s5: { area: P.join(dir, 'ws', 'elsewhere') } } }));
await step('case 11 one moved to another area');
P.put(overrides, text({ sessions: { s5: { area: P.join(dir, 'ws', 'elsewhere') }, s6: { title: 'my own name', top: true } } }));
await step('case 11 one renamed by the overrides');
P.utimesSync(file(20), Date.now() / 1000 + 50, Date.now() / 1000 + 50);
await step('case 11 the order changed');
P.show('case 12', '');
link.hold();
P.appendFileSync(file(1), P.said('a'));
publish(hub, scan());
await tick();
const before = link.sizes.length;
for (const i of [2, 3, 4]) { P.appendFileSync(file(i), P.said('b')); publish(hub, scan()); }
await tick();
const during = link.sizes.length - before;
link.release();
await tick();
const last12 = JSON.parse(link.texts.at(-1)!);
P.show('case 12 messages while behind, after, records in it, base against the last sent, equal', [during, link.sizes.length - before, last12.payload.records.length, last12.payload.base === undefined ? 'whole' : last12.payload.base === JSON.parse(link.texts.at(-2)!).version, equal(hub, one)]);
// 13
const asks = link.asks;
link.answer = false;
const holding = one.entities.sessions();
for (const base of [900, 901]) one.ws().emit('message', { data: text({ channel: 'sessions', version: base + 1, payload: { base, order: [], records: [] } }) });
P.show('case 13 asked, payload kept', [link.asks - asks, one.entities.sessions() === holding]);
link.answer = true;
hub.subscribe(link.sink, ['sessions']);
await tick();
P.show('case 13 whole taken', [equal(hub, one), Object.keys(JSON.parse(link.texts.at(-1)!).payload)]);
const asks2 = link.asks;
one.ws().emit('message', { data: text({ channel: 'sessions', version: 2000, payload: { base: 1999, order: [], records: [] } }) });
one.ws().emit('message', { data: text({ channel: 'sessions', version: 2001, payload: { records: 'no', workspaces: [] } }) });
one.ws().emit('message', { data: text({ channel: 'sessions', version: 2002, payload: { base: 1999, order: [], records: [] } }) });
await tick();
P.show('case 13 a whole payload that fails the shape: asked', [link.asks - asks2, equal(hub, one)]);
// 14
const hub2: Any = new Hub();
difference && hub2.difference('sessions', difference);
publish(hub2, scan());
one.ws().close();
await P.wait(300);
const link2 = serve(hub2, one.ws());
one.ws().emit('open');
await tick();
P.show('case 14 whole from the restarted server, versions', [equal(hub2, one), hub2.version('sessions')]);
P.appendFileSync(file(7), P.said('c'));
publish(hub2, scan());
await tick();
P.show('case 14 and the next after it', [equal(hub2, one), link2.sizes.length]);
// 15
for (const list of [[{ id: 't1', name: 'one' }], [{ id: 't1', name: 'two' }], undefined]) {
    terminals = list;
    publish(hub2, scan());
    await tick();
    P.show('case 15 terminals', [text(one.entities.sessions().terminals ?? null), equal(hub2, one), link2.sizes.at(-1)]);
}
// 16
P.put(P.join(store, 'hub3', 's0.jsonl'), P.transcript(P.join(dir, 'ws', 'p3'), 4));
publish(hub2, scan());
await tick();
P.show('case 16 two of one id', [one.entities.sessions().records.filter((r: Any) => r.id === 's0').map((r: Any) => r.path.slice(dir.length)), equal(hub2, one)]);
// 17
const event: Any = { session: 's8', event: 'notification', at: P.at() };
const previous = hub2.latest('sessions').payload;
hub2.publish('sessions', patchPayload(previous, event));
await tick();
const m17 = JSON.parse(link2.texts.at(-1)!).payload;
const tree = one.entities.sessions().workspaces.flatMap((w: Any) => w.areas.flatMap((a: Any) => a.sessions)).find((s: Any) => s.id === 's8');
P.show('case 17 bytes, keys, records, the tree copy has the hook, equal', [link2.sizes.at(-1), Object.keys(m17), m17.records.length, tree.hook?.event, equal(hub2, one)]);
// 18
const { watchGit } = await import('../../src/lib/server/root/watch/git.ts');
const gitHub: Any = new Hub();
difference && gitHub.difference('sessions', difference);
const repo = (name: string) => { P.put(P.join(dir, name, '.git', 'HEAD'), 'ref: refs/heads/main\n'); return P.join(dir, name); };
const payloadFor = (roots: string[]): Any => ({ records: [], workspaces: roots.map((key) => ({ key, name: key, lastActivity: null, areas: [] })) });
gitHub.publish('sessions', payloadFor([repo('r1')]));
let made = 0;
const real = JSON.stringify;
(JSON as Any).stringify = (...a: Any[]) => { if (a[0]?.channel === 'sessions') made += 1; return (real as Any)(...a); };
const git = watchGit(gitHub, { throttle: 50 } as Any);
await P.until(() => Object.keys(gitHub.latest('git')?.payload ?? {}).length === 1, 4000);
const roots = () => Object.keys(gitHub.latest('git')?.payload ?? {}).map((r) => r.slice(dir.length));
P.show('case 18 roots of a publish before the subscribe', roots());
gitHub.publish('sessions', payloadFor([P.join(dir, 'r1'), repo('r2')]));
await P.until(() => roots().length === 2, 4000);
P.show('case 18 roots after the next publish', roots());
P.show('case 18 texts of a sessions message made with no page subscribed', made);
git.close();
(JSON as Any).stringify = real;
// 19
const plain: Any = new Hub();
const got: string[] = [];
plain.subscribe({ send: async (t: string) => void got.push(t), close: () => {} }, ['other']);
plain.publish('other', { a: 1 });
await tick();
plain.publish('other', { a: 2 });
await tick();
P.show('case 19 a channel with none', got);
P.show('stderr lines in all', errors);
process.exit(0);
```

### `.agents/scratch/cases-held.ts`

```
// The held worker: one running, one waiting, joined kinds, failure, death, close.
import * as P from './plant.ts';
P.catchWorkers();
const { HeldWorker } = await import('../../src/lib/server/machine/threads/held.ts');
const log: string[] = [];
let text = 'x';
const make = () => new HeldWorker<string, { text: string; ms: number }, string>({
    file: P.join(P.HERE, 'slow-worker.ts'),
    request: (kind) => { log.push(`start ${kind}`); return { text: text === 'x' ? kind : text, ms: 60 }; },
    join: (a, b) => { const order = ['recheck', 'clock', 'rescan']; return order.indexOf(b) > order.indexOf(a) ? b : a; },
    answered: (answer, kind) => void log.push(`answered ${kind}`),
    failed: (why, kind) => void log.push(`failed ${kind}: ${why}`)
});
const keep = setInterval(() => {}, 1000);
let held = make();
void held.ask('recheck');
void held.ask('recheck');
const second = held.ask('rescan');
void held.ask('recheck');
await second;
P.show('a file event while a re-check waits, and a re-check while a rescan waits', log.splice(0));
text = 'throw';
await held.ask('rescan');
text = 'die';
await held.ask('rescan');
text = 'x';
await held.ask('clock');
P.show('a throw, a death, the next', [log.splice(0), `workers ${P.workers.length}`]);
void held.ask('rescan');
void held.ask('recheck');
await P.wait(5);
held.close();
await held.ask('rescan');
await P.wait(300);
P.show('close in the middle', log.splice(0));
const worker = P.workers.at(-1)!;
P.show('the worker ended', worker.threadId === -1);
clearInterval(keep);
held = make();
void held.ask('rescan');
const start = performance.now();
process.on('exit', () => console.log(`a running worker does not keep the process up: exit after ${Math.round(performance.now() - start)} ms, ${JSON.stringify(log)}`));
```

### `.agents/scratch/slow-worker.ts`

```
import { serve } from '../../src/lib/server/machine/threads/serve.ts';
serve(async (ask: { text: string; ms: number }) => {
    if (ask.text === 'die') process.exit(3);
    if (ask.text === 'throw') throw new Error('asked to');
    await new Promise((r) => setTimeout(r, ask.ms));
    return ask.text;
});
```

### `.agents/scratch/cases-keys.ts`

```
// Cases 20 to 26 of O188, on a private tmux server whose socket is in a folder of this program's own.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import * as P from './plant.ts';
const errors = P.catchErrors();
const { Hub } = await import('../../src/lib/server/core/channels.ts');
const { Terminals, ptyChannel } = await import('../../src/lib/server/machine/pty/channel.ts');
const { tmuxDriver } = await import('../../src/lib/server/machine/pty/panes/driver.ts');
const { inputArgs } = await import('../../src/lib/server/machine/pty/sessions.ts');
const { control } = await import('../../src/lib/server/machine/pty/tmux.ts');
type Any = any;
const dir = P.dirOf('k');
const socket = P.join(dir, 's');
const tmux = (...args: string[]): string => execFileSync('tmux', ['-u', '-S', socket, ...args], { encoding: 'utf8' });
const stop = (): void => { try { tmux('kill-server'); } catch {} };
process.on('exit', stop);
process.on('uncaughtException', (error) => { console.log(`UNCAUGHT: ${error.message}`); });
const out = (id: string) => P.join(dir, `${id}.out`);
const start = (id: string): void => {
    tmux('-f', '/dev/null', 'new-session', '-d', '-x', '80', '-y', '24', '-s', `oculus-${id}`, `stty raw -echo; exec cat > '${out(id)}'`);
};
const read = (id: string): Buffer => (existsSync(out(id)) ? readFileSync(out(id)) : Buffer.alloc(0));
const IDS = ['a1b2c3-shell', 'a1b2c4-shell', 'a1b2c5-shell'];
for (const id of IDS) start(id);
await P.wait(300);

/** A tmux that notes every `send-keys` process: a key with no process went by the control client. */
const LOG = P.join(dir, 'log');
const logged = P.join(dir, 'tmux-log');
writeFileSync(LOG, '');
writeFileSync(logged, `#!/bin/sh\nfor a in "$@"; do if [ "$a" = "send-keys" ]; then echo process >> '${LOG}'; fi; done\nexec tmux "$@"\n`);
chmodSync(logged, 0o755);
const ways = { get length() { return readFileSync(LOG, 'utf8').split('\n').length - 1; } };
const hub = new Hub();
const driver: Any = tmuxDriver({ socket, binary: logged });
const held = new Terminals(hub, { driver, poll: 0, table: (() => []) as Any } as Any);
held.gate(() => true);
const sink: Any = { send: () => Promise.resolve(), close: () => {} };
const say = (id: string, bytes: Buffer, from = sink): boolean => held.inbound(from, JSON.stringify({ type: 'input', channel: ptyChannel(id), bytes: bytes.toString('base64') }));
const [A, B, C] = IDS;
// 22: keys sent in the turn of the subscribe, before the client is attached, then more.
hub.subscribe(sink, [ptyChannel(A)], false);
held.subscribed(sink, [ptyChannel(A)]);
for (const key of '0123456789') say(A, Buffer.from(key));
await P.wait(400);
for (const key of 'abcdefghij') say(A, Buffer.from(key));
await P.until(() => read(A).length >= 20);
await P.wait(200);
P.show('case 22 keys before and after the client attached', read(A).toString());
// 20, 21
const psBefore = ways.length;
const t = performance.now();
for (const key of 'KLMNOPQRST') say(A, Buffer.from(key));
await P.until(() => read(A).length >= 30);
P.show('case 20, 21 ten keys in a row, send-keys processes, ms', [read(A).toString().slice(20), ways.length - psBefore, Math.round(performance.now() - t)]);
// 20 without a client: a terminal typed into through type(), nothing attached.
const none = ways.length;
await held.type(B, Buffer.from('xyz'));
await P.until(() => read(B).length >= 3);
P.show('case 20 with none attached, send-keys processes', [read(B).toString(), ways.length - none]);
// 24
const paste = Buffer.concat([Buffer.from('\x1b[200~'), Buffer.from('p'.repeat(1988) + '<e acute>'), Buffer.from('\x1b[201~')]);
const mouse = Buffer.from('\x1b[<0;10;20M');
const was = read(A).length;
say(A, Buffer.from('q'.repeat(2000)));
say(A, paste);
say(A, mouse);
const want = Buffer.concat([Buffer.from('q'.repeat(2000)), paste, mouse]);
await P.until(() => read(A).length >= was + want.length);
P.show('case 24 the bytes in order, pieces of inputArgs', [read(A).subarray(was).equals(want), inputArgs(A, Buffer.from('q'.repeat(2000))).length, inputArgs(A, paste).length]);
// 25: a by-hand pane of a session oculus did not start, beside another pane.
tmux('new-session', '-d', '-x', '80', '-y', '24', '-s', 'mine', `stty raw -echo; exec cat > '${out('hand')}'`);
tmux('split-window', '-t', 'mine', `stty raw -echo; exec cat > '${out('other')}'`);
await P.wait(200);
const [pane] = tmux('list-panes', '-t', 'mine', '-F', '#{pane_id} #{pid}').trim().split('\n');
P.show('by-hand panes', tmux('list-panes', '-t', 'mine', '-F', '#{pane_id}').trim().split('\n').length);
const session = tmux('display-message', '-p', '-t', 'mine', '#{session_id}').trim();
const { byHandPane } = await import('../../src/lib/data/model/index.ts');
const server = tmux('display-message', '-p', '-t', 'mine', '#{pid} #{start_time}').trim().split(' ');
const candidates = [`h${server[0]}p${pane.split(' ')[0].slice(1)}-claude`];
const handId = candidates.find((one) => byHandPane(one) !== null) ?? null;
P.show('case 25 id of the pane', handId);
if (handId !== null) {
    const second: Any = tmuxDriver({ socket, binary: logged });
    const hw = ways.length;
    second.attached([handId], new Map([[handId, session]]));
    await P.wait(400);
    const args = inputArgs(handId, Buffer.from('hand'))[0];
    if (second.type !== undefined) await second.type(handId, args);
    else await second.run(args);
    await P.until(() => read('hand').length >= 4);
    P.show('case 25 the pane, the other pane, send-keys processes', [read('hand').toString(), read('other').toString(), ways.length - hw]);
    second.close();
}
// 23: the client exits, dies, is closed, never answers.
const drive = async (name: string, act: (client: Any, args: string[]) => Promise<unknown>) => {
    const seen = errors.length;
    const client: Any = control(`oculus-${C}`, { output: () => {}, event: () => {}, exit: () => {} }, { socket });
    await client.ready();
    let said = 'resolved';
    try {
        await act(client, inputArgs(C, Buffer.from('z'))[0]);
    } catch (error) {
        said = `rejected: ${(error as Error).message}`;
    }
    P.show(`case 23 ${name}`, [said, errors.length - seen]);
    try { client.close(); } catch {}
    await P.wait(100);
};
await drive('a key written in the turn close is called', (client, args) => {
    const sent = client.command(args);
    client.close();
    return sent;
});
await drive('a key written after the process died, before its exit is handled', (client, args) => {
    const pid = tmux('list-clients', '-F', '#{client_pid} #{session_name}').trim().split('\n').find((l) => l.endsWith(C))!.split(' ')[0];
    execFileSync('/bin/kill', ['-9', pid]);
    execFileSync('/bin/sleep', ['0.2']);
    return client.command(args);
});
await drive('exits with a key written and not answered', (client, args) => {
    const pid = tmux('list-clients', '-F', '#{client_pid} #{session_name}').trim().split('\n').find((l) => l.endsWith(C))!.split(' ')[0];
    const server = tmux('display-message', '-p', '#{pid}').trim();
    execFileSync('/bin/kill', ['-STOP', server]);
    const sent = client.command(args);
    setTimeout(() => execFileSync('/bin/kill', ['-9', pid]), 100);
    setTimeout(() => execFileSync('/bin/kill', ['-CONT', server]), 400);
    return sent;
});
// 23 through the driver: a client that never answers is a stub that attaches and then is silent.
const stub = P.join(dir, 'stub');
writeFileSync(stub, `#!/bin/sh\nfor a in "$@"; do if [ "$a" = "-C" ]; then printf '%%begin 1 1 0\\n%%end 1 1 0\\n'; exec cat > /dev/null; fi; done\nexec tmux "$@"\n`);
chmodSync(stub, 0o755);
{
    const silent: Any = tmuxDriver({ socket, binary: stub });
    const quiet = new Terminals(new Hub(), { driver: silent, poll: 0, table: (() => []) as Any } as Any);
    quiet.gate(() => true);
    quiet.subscribed(sink, [ptyChannel(C)]);
    await P.wait(300);
    silent.attached([C], new Map());
    await P.wait(300);
    const seen = errors.length;
    const start2 = performance.now();
    await quiet.type(C, Buffer.from('1'));
    const ms = performance.now() - start2;
    await quiet.type(C, Buffer.from('2'));
    P.show('case 23 a client that never answers: stderr, ms of the first key', [errors.slice(seen), Math.round(ms)]);
    P.show('case 23 and what the pane got', read(C).toString());
    quiet.close();
}
// 26
const other: Any = { send: () => Promise.resolve(), close: () => {} };
held.gate((one) => one === sink);
const seen26 = errors.length;
say(A, Buffer.from('NO'), other);
await P.wait(200);
P.show('case 26 a socket without the token', errors.slice(seen26));
held.close();
P.show('stderr lines in all', errors);
stop();
process.exit(0);
```

### `.agents/scratch/cases-usage.ts`

```
// Cases 27 to 33 of O188.
import { closeSync, openSync, renameSync, rmSync, statSync, symlinkSync, writeSync, mkdirSync, writeFileSync } from 'node:fs';
import * as P from './plant.ts';
P.catchWorkers();
const errors = P.catchErrors();
const { UsageTranscriptFold } = await import('../../src/lib/server/machine/usage/transcripts.ts');
const { watchUsage } = await import('../../src/lib/server/machine/usage/watch.ts');
const { Hub } = await import('../../src/lib/server/core/channels.ts');
type Any = any;
const whole = async (accounts: Any, now?: number) => (await new UsageTranscriptFold().fold(accounts, now)).rows;
const same = (a: Any, b: Any) => JSON.stringify(a) === JSON.stringify(b);
const dir = P.dirOf('usage');
const acc = (name: string, label = name, tool = 'claude'): Any => ({ tool, dir: P.join(dir, name), label });
{
    const a = [acc('a')];
    const file = P.put(P.join(dir, 'a/projects/hub/one.jsonl'), P.user('/ws') + P.said('x', 10));
    const fold = new UsageTranscriptFold();
    const first = await fold.fold(a);
    const more = P.said('y', 20) + P.said('z', 5, P.at(), undefined, 'claude-other');
    P.appendFileSync(file, more);
    const second = await fold.fold(a);
    P.show('case 27 rows equal a whole read', same(second.rows, await whole(a)));
    P.show('case 27 bytes: first, appended, second', [first.readBytes, Buffer.byteLength(more), second.readBytes]);
    P.show('case 27 a third with nothing new', [(await fold.fold(a)).readBytes]);
    // 28
    P.put(file, P.user('/ws') + P.said('x', 3));
    let got = await fold.fold(a);
    P.show('case 28 shrank', [same(got.rows, await whole(a)), got.readBytes, statSync(file).size]);
    const size = statSync(file).size;
    const inPlace = P.user('/ws') + P.said('x', 7);
    const handle = openSync(file, 'r+'); writeSync(handle, inPlace.padEnd(size).slice(0, size)); closeSync(handle);
    P.utimesSync(file, Date.now() / 1000 + 2, Date.now() / 1000 + 2);
    got = await fold.fold(a);
    P.show('case 28 same inode and size, mtime moved', [same(got.rows, await whole(a)), got.rows[0]?.input, got.readBytes, size]);
    const other = P.put(P.join(dir, 'other.jsonl'), (P.user('/ws') + P.said('x', 9)).padEnd(size).slice(0, size));
    const mtime = statSync(file).mtimeMs / 1000;
    P.utimesSync(other, mtime, mtime);
    renameSync(other, file);
    got = await fold.fold(a);
    P.show('case 28 a new inode at the same size and mtime', [same(got.rows, await whole(a)), got.rows[0]?.input]);
    P.put(P.join(dir, 'a/projects/hub/two.jsonl'), P.said('t', 100));
    got = await fold.fold(a);
    P.show('case 28 one added', [same(got.rows, await whole(a)), got.files]);
    rmSync(file);
    got = await fold.fold(a);
    P.show('case 28 one gone', [same(got.rows, await whole(a)), got.files]);
}
{
    const c = [acc('c', 'c', 'codex')];
    const file = P.rollout(P.join(dir, 'c/sessions'), 'r1', [P.turnContext('gpt-x'), P.tokens(10, 2)]);
    const fold = new UsageTranscriptFold();
    await fold.fold(c);
    const more = JSON.stringify(P.tokens(25, 6)) + '\n';
    P.appendFileSync(file, more);
    const got = await fold.fold(c);
    P.show('case 29 rows equal a whole read, model and total carried', [same(got.rows, await whole(c)), got.rows[0].model, got.rows[0].input, got.readBytes, Buffer.byteLength(more)]);
    const cut = JSON.stringify(P.tokens(40, 9)) + '\n';
    P.appendFileSync(file, cut.slice(0, 30));
    const half = await fold.fold(c);
    P.appendFileSync(file, cut.slice(30));
    const full = await fold.fold(c);
    P.show('case 30 cut then completed', [half.rows[0].input, full.rows[0].input, same(full.rows, await whole(c)), full.readBytes, Buffer.byteLength(cut)]);
}
{
    const d = [acc('d')];
    P.put(P.join(dir, 'd/projects/hub/one.jsonl'), P.said('old', 10, new Date(Date.now() - 6 * 86400e3).toISOString()) + P.said('new', 20));
    const fold = new UsageTranscriptFold();
    const now = Date.now();
    const first = await fold.fold(d, now);
    const next = await fold.fold(d, now + 86400e3);
    P.show('case 31 rows, then a day later, bytes read then', [first.rows.length, next.rows.length, next.readBytes]);
}
{
    mkdirSync(P.join(dir, 'e2'), { recursive: true });
    P.put(P.join(dir, 'e/projects/hub/one.jsonl'), P.said('x', 10));
    symlinkSync(P.join(dir, 'e/projects'), P.join(dir, 'e2/projects'));
    const got = await new UsageTranscriptFold().fold([acc('e', 'one'), acc('e2', 'two')]);
    P.show('case 33 one store, both labels', [got.files, got.rows.map((r: Any) => r.account)]);
    P.put(P.join(dir, 'sep/projects/hub/one.jsonl'), P.said('a<U+2028>b', 5) + P.said('plain', 1));
    P.show('a record holding U+2028 is counted (input 6 counted, 1 dropped)', (await whole([acc('sep')]))[0].input);
}
{
    const hub = new Hub();
    let change: () => void = () => {};
    let published = 0;
    const real = hub.publish.bind(hub);
    hub.publish = (ch: string, p: unknown) => { published += 1; return real(ch, p); };
    P.put(P.join(dir, 'w/projects/hub/one.jsonl'), P.said('x', 10));
    const accounts = [acc('w')];
    const options: Any = { accounts, tiers: {}, usageRoot: P.join(dir, 'root'), debounce: 20, interval: 3600e3, onSessionsChange: (l: () => void) => { change = l; return () => {}; } };
    const watcher = watchUsage(hub, options);
    await P.until(() => published > 0);
    P.show('case 33 published rows are the class\'s', same((hub.latest('usage')!.payload as Any).days, await whole(accounts)));
    await P.wait(300);
    const worker = P.workers.at(-1);
    if (worker === undefined) P.show('case 33 a worker that dies', 'no worker on this tree');
    else {
        const standing = published;
        const seen = errors.length;
        const run = watcher.refresh();
        await worker.terminate();
        await run;
        P.show('case 33 a worker that dies: stderr, publishes', [errors.slice(seen), published - standing]);
        P.appendFileSync(P.join(dir, 'w/projects/hub/one.jsonl'), P.said('y', 5));
        change();
        await P.until(() => published > standing);
        P.show('case 33 the next change folds in a new one', [P.workers.length, (hub.latest('usage')!.payload as Any).days[0].input]);
    }
    await P.wait(200);
    const standing = published;
    P.appendFileSync(P.join(dir, 'w/projects/hub/one.jsonl'), P.said('z'.repeat(5e6), 5));
    void watcher.refresh();
    await P.wait(1);
    watcher.close();
    await P.wait(1500);
    P.show('case 33 publishes after a close during a fold', published - standing);
}
P.show('stderr lines in all', errors);
```

### `.agents/scratch/measure.ts`

```
// Verify 3 of O188, on planted stores: how long the server's thread is held, the time from a key to
// its echo, the bytes of a sessions message and the bytes the second usage fold reads.
import { execFileSync } from 'node:child_process';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { loadavg } from 'node:os';
import { statSync } from 'node:fs';
import * as P from './plant.ts';
const { Hub } = await import('../../src/lib/server/core/channels.ts');
const { watchSessions } = await import('../../src/lib/server/root/watch/sessions.ts');
const { watchUsage } = await import('../../src/lib/server/machine/usage/watch.ts');
const { UsageTranscriptFold } = await import('../../src/lib/server/machine/usage/transcripts.ts');
const { Terminals, ptyChannel } = await import('../../src/lib/server/machine/pty/channel.ts');
const { tmuxDriver } = await import('../../src/lib/server/machine/pty/panes/driver.ts');
type Any = any;
const dir = P.dirOf('m');
const store = P.join(dir, 'claude', 'projects');
const file = (i: number): string => P.join(store, `hub${i % 4}`, `s${i}.jsonl`);
for (let i = 0; i < 40; i += 1) P.put(file(i), P.transcript(P.join(dir, 'ws', `p${i % 6}`), 130));
// The usage store: the forty of the scan, four hundred small ones and one transcript of 60 MB.
for (let i = 0; i < 400; i += 1) P.put(P.join(store, `many${i % 20}`, 'subagents', `u${i}.jsonl`), P.transcript(dir, 4));
const big = P.put(P.join(store, 'hub0', 'big', 'subagents', 'big.jsonl'), '');
let block = '';
for (let i = 0; i < 200; i += 1) block += P.said('x'.repeat(5000), 10);
for (let i = 0; i < 60; i += 1) P.appendFileSync(big, block);
// Three records of 24 MB in a transcript of their own, as a tool result with images is one long line.
const wide = P.put(P.join(store, 'hub0', 'wide', 'subagents', 'wide.jsonl'), '');
for (let i = 0; i < 3; i += 1) P.appendFileSync(wide, P.said('y'.repeat(24e6), 10));
let active = 0;

P.show('load average', loadavg().map((n) => n.toFixed(1)));
async function heldDuring(work: () => Promise<unknown>): Promise<number> {
    const delay = monitorEventLoopDelay({ resolution: 1 });
    await P.wait(50);
    delay.enable();
    await P.wait(20);
    delay.reset();
    const used = performance.eventLoopUtilization();
    await work();
    active = Math.round(performance.eventLoopUtilization(used).active * 10) / 10;
    await P.wait(20);
    delay.disable();
    return Math.round(delay.max / 1e5) / 10;
}
const median = (list: number[]): number => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
P.show('idle, ms', await heldDuring(() => P.wait(300)));

const hub: Any = new Hub();
let published = 0;
const real = hub.publish.bind(hub);
hub.publish = (c: string, p: unknown) => { if (c === 'sessions') published += 1; return real(c, p); };
const texts: string[] = [];
hub.subscribe({ send: async (text: string) => void texts.push(text), close: () => {} }, ['sessions']);
const watcher = watchSessions(hub, {
    stores: [store], codexStores: [], registries: [], cache: P.join(dir, 'state', 'cache.json'), overrides: P.put(P.join(dir, 'state', 'sessions.json'), '{"sessions":{}}'),
    roots: [P.join(dir, 'ws')], projectFolders: () => [], windowDays: 0, debounce: 20, liveness: 0, rescanEvery: 0
} as Any);
await P.until(() => published > 0);
await P.wait(1500);
const scans: number[] = [];
for (let i = 0; i < 7; i += 1) {
    const standing = published;
    scans.push(await heldDuring(async () => {
        P.appendFileSync(file(i), P.said('more', 1, P.at(i)));
        await P.until(() => published > standing);
    }));
}
P.show('the thread held during one scan, ms (seven; median)', [scans, median(scans)]);
P.show('cache file bytes', statSync(P.join(dir, 'state', 'cache.json')).size);
P.show('bytes of the whole sessions payload', Buffer.byteLength(texts[0]));
P.show('bytes of the message for one changed record (median of seven)', median(texts.slice(-7).map((t) => Buffer.byteLength(t))));
P.show('bytes of that record', Buffer.byteLength(JSON.stringify(hub.latest('sessions').payload.records[0])));

const accounts: Any = [{ tool: 'claude', dir: P.join(dir, 'claude'), label: 'a' }];
let folds = 0;
hub.publish = (c: string, p: unknown) => { if (c === 'usage') folds += 1; if (c === 'sessions') published += 1; return real(c, p); };
const usage = watchUsage(hub, { accounts, tiers: {}, usageRoot: P.join(dir, 'root'), interval: 3600e3, debounce: 20 });
await P.until(() => folds > 0, 60000);
await P.wait(300);
for (const [name, path] of [['an append to the transcript of 60 MB of 5 KB records', big], ['an append to the transcript of three 24 MB records', wide]]) {
    const held: number[] = [];
    const took: number[] = [];
    const busy: number[] = [];
    for (let i = 0; i < 5; i += 1) {
        P.appendFileSync(path, P.said('more', 1));
        const t = performance.now();
        held.push(await heldDuring(() => usage.refresh()));
        took.push(Math.round(performance.now() - t));
        busy.push(active);
    }
    P.show(`the thread held during one usage fold, ${name}, ms (five; median)`, [held, median(held)]);
    P.show('   the thread active during it, ms; the fold took with the waits of the monitor, ms', [busy, took]);
}
const fold = new UsageTranscriptFold();
const first = await fold.fold(accounts);
const more = P.said('appended', 1);
P.appendFileSync(big, more);
const second = await fold.fold(accounts);
P.show('bytes the first fold read, appended, the second fold read', [first.readBytes, Buffer.byteLength(more), second.readBytes]);

// Keys to echo while scans and folds run.
const socket = P.join(dir, 's');
const tmux = (...args: string[]): string => execFileSync('tmux', ['-u', '-S', socket, ...args], { encoding: 'utf8' });
const id = 'a1b2c3-shell';
tmux('-f', '/dev/null', 'new-session', '-d', '-x', '80', '-y', '24', '-s', `oculus-${id}`, 'stty raw -echo; exec cat');
const driver: Any = tmuxDriver({ socket });
const terminals: Any = new Terminals(hub, { driver, poll: 0, table: (() => []) as Any } as Any);
terminals.gate(() => true);
const sink: Any = { send: (text: string) => { const got = JSON.parse(text); if (got.channel === ptyChannel(id)) heard(Buffer.from(got.payload.bytes, 'base64').toString()); return Promise.resolve(); }, close: () => {} };
let waiting: ((ms: number) => void) | null = null;
let sentAt = 0;
let want = '';
const heard = (text: string): void => { if (waiting !== null && text.includes(want)) { const done = waiting; waiting = null; done(performance.now() - sentAt); } };
hub.subscribe(sink, [ptyChannel(id)], false);
terminals.subscribed(sink, [ptyChannel(id)]);
await P.wait(600);
const key = (n: number): Promise<number> => new Promise((resolve) => {
    want = String.fromCharCode(97 + (n % 26));
    waiting = resolve;
    sentAt = performance.now();
    terminals.inbound(sink, JSON.stringify({ type: 'input', channel: ptyChannel(id), bytes: Buffer.from(want).toString('base64') }));
});
const keys = async (count: number): Promise<number[]> => {
    const out: number[] = [];
    for (let i = 0; i < count; i += 1) { out.push(await key(i)); await P.wait(15 + (i % 7) * 5); }
    return out;
};
const line = (list: number[]): Any => ({ median: median(list).toFixed(1), max: Math.max(...list).toFixed(1), count: list.length });
P.show('key to echo, quiet, ms', line(await keys(40)));
let on = true;
const busy = (async () => {
    for (let i = 0; on; i += 1) {
        P.appendFileSync(file(i % 40), P.said('more', 1, P.at(i)));
        P.appendFileSync(big, P.said('more', 1));
        await usage.refresh();
        await P.wait(5);
    }
})();
P.show('key to echo while scans and folds run, ms', line(await keys(80)));
on = false;
await busy;
P.show('load average', loadavg().map((n) => n.toFixed(1)));
terminals.close();
watcher.close();
usage.close();
try { tmux('kill-server'); } catch {}
process.exit(0);
```

### `.agents/scratch/em/vc.ts`

```
import base from '../../../vite.config.ts';
export default async (env: never) => {
    const config = await (base as (env: never) => Promise<any>)(env);
    config.test.projects = [
        {
            extends: true,
            resolve: { conditions: ['browser'] },
            test: {
                name: 'em',
                environment: 'jsdom',
                include: ['.agents/scratch/em/*.run.ts'],
                server: { deps: { inline: [/svelte/] } }
            }
        }
    ];
    return config;
};
```

### `.agents/scratch/em/text.ts`

```
import { writeFileSync } from 'node:fs';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { textCatalog } from '../../../src/lib/data/sources/config/merge/text.ts';
writeFileSync(new URL('./text.json', import.meta.url), JSON.stringify(textCatalog(loadConfig(engineDir()).config)));
writeFileSync(new URL('./glyphs.json', import.meta.url), JSON.stringify(loadConfig(engineDir()).config.glyphs));
```

### `.agents/scratch/em/Outer.svelte`

```
<script lang="ts">
    import { setContext } from 'svelte';
    import { createClientState } from '$lib/state/client/context';
    import { STATE_KEY } from '$lib/state/client/use';
    import { TIP_KEY, createTipIds } from '$lib/ui/menu/tip-ids';
    import Wrap from './Wrap.svelte';
    let { onclient, snapshot, tab }: any = $props();
    const client = createClientState();
    setContext(STATE_KEY, client);
    setContext(TIP_KEY, createTipIds());
    // svelte-ignore state_referenced_locally
    onclient(client);
</script>
<Wrap {snapshot} {tab} />
```

### `.agents/scratch/em/Wrap.svelte`

```
<script lang="ts">
    import TooltipGroup from '$lib/ui/menu/TooltipGroup.svelte';
    import CommandCenter from '$lib/views/boards/focus/CommandCenter.svelte';
    import { foldOpen, foldToggled } from '$lib/state/boards/focus';
    let { snapshot, tab }: { snapshot: any; tab: { get: () => unknown; set: (next: unknown) => void } } = $props();
</script>
<TooltipGroup>
    <CommandCenter
        week={null}
        {snapshot}
        hidden={0}
        now={Date.parse('2026-11-20T12:00:00Z')}
        open={foldOpen(tab.get(), 'command')}
        ontoggle={() => tab.set(foldToggled(tab.get(), 'command'))}
        emailsOpen={foldOpen(tab.get(), 'emails')}
        onemails={() => tab.set(foldToggled(tab.get(), 'emails'))}
        onproject={() => undefined}
        onsaid={() => undefined}
    />
</TooltipGroup>
```

### `.agents/scratch/em/emails.run.ts`

```
import { flushSync, mount, unmount } from 'svelte';
import { expect, it, vi } from 'vitest';
import text from './text.json';
import glyphs from './glyphs.json';
import Outer from './Outer.svelte';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { parseInboxState } from '../../../src/lib/state/feeds/inbox.ts';
import { cell } from '../../../tests/ui/frame/rooted.svelte.ts';

setCatalog(text as Record<string, string>);
setGlyphs(glyphs as Record<string, string>);
Object.defineProperty(document, 'fonts', { value: new EventTarget() });
vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} });

const feeds = { leads: null, radar: null, scout: null, linkedin: null, byHub: [] };
const snapshot = { version: 1, entities: { projects: {}, venues: {}, datasets: {}, pillars: {}, domains: {}, funding: {}, people: {}, organisations: {}, resources: {}, collections: {}, feeds, career: null }, relations: {}, findings: [] };
const thread = (id: string, kind: string | undefined, over: object = {}) => ({
    id: `google:${id}`, account: 'google:a', provider: 'google', sender: `Name ${id} <${id}@x.org>`, replyTo: '', subject: `Subject ${id}`,
    received: '2026-11-19T10:00:00Z', snippet: '', messages: 1, triage: { triaged: false, ...(kind === undefined ? {} : { kind }) }, ...over
});
let version = 0;
function make(threads: unknown[], state: unknown = {}) {
    let client: any;
    const publish = (next: unknown[]) => client.entities.receive({ channel: 'inbox', version: ++version, payload: { status: 'live', accounts: [], threads: next, updated: '', pollMin: 5, retryMin: 5, notesRun: null } });
    const tab = cell(state);
    document.body.innerHTML = '';
    const view = mount(Outer, { target: document.body, props: { snapshot, tab, onclient: (made: unknown) => { client = made; client.layout.apply({ root: { kind: 'pane', tabs: [], active: '' } }); publish(threads); } } });
    flushSync();
    return { client, publish, tab, stop: () => unmount(view) };
}
const rows = () => [...document.querySelectorAll('ul.ticker > li')].map((li) => {
    const words = [...li.querySelectorAll('button.name, span.name, :scope > .detail, :scope > .tail')].map((one) => (one.textContent ?? '').replace(/\s+/g, ' ').trim()).join(' / ');
    return `${li.className.replace(/svelte-\S+/g, '').trim()}|${li.querySelector('.fold') === null ? '' : 'fold'}|${words}`;
});
const foldName = () => document.querySelector('.fold button')?.getAttribute('aria-label') + ' expanded=' + document.querySelector('.fold button')?.getAttribute('aria-expanded');
const press = (find: string) => { const one = [...document.querySelectorAll<HTMLElement>('button')].find((b) => (b.textContent ?? '').includes(find) || (b.getAttribute('aria-label') ?? '').includes(find)); one?.click(); flushSync(); };
const five = () => [thread('u1', undefined), thread('r1', 'reply'), thread('a1', 'action'), thread('r2', 'reply'), thread('u2', undefined), thread('i1', 'info'), thread('t1', 'reply', { triage: { triaged: true, kind: 'reply' } })];
const log = (...said: unknown[]) => console.log(said.map((one) => (typeof one === 'string' ? one : JSON.stringify(one))).join(' '));

it('41', () => {
    const one = make(five());
    log('case 41 folded at the start:', rows(), foldName());
    press('Unfold 5');
    log('case 41 unfolded:', rows(), foldName(), one.tab.get());
    press('Fold 5');
    log('case 41 folded again:', rows().length, one.tab.get());
    one.stop(); expect(1).toBe(1);
});
it('42, 43', () => {
    const only = make([thread('u1', undefined), thread('u2', undefined)], { opened: ['emails'] });
    log('case 42:', rows()); only.stop();
    const none = make([thread('i1', 'info')], { opened: ['emails'] });
    log('case 43:', rows(), document.querySelectorAll('.fold').length, (document.body.textContent ?? '').trim()); none.stop();
    expect(1).toBe(1);
});
it('44', () => {
    const one = make([
        thread('a', 'reply', { subject: '' }), thread('b', 'reply', { sender: 'bare@x.org' }), thread('c', 'reply', { received: 'nonsense' }),
        thread('d', 'reply', { subject: 'x'.repeat(200) }), thread('e', 'reply', { subject: '<b>bold</b> see https://example.org/a *md*' }),
        thread('f', 'reply', { sender: '', subject: 'only subject' }), thread('g', 'reply', { sender: '', subject: '' })
    ], { opened: ['emails'] });
    log('case 44:', rows(), 'b elements:', document.querySelectorAll('ul.ticker b').length, 'links:', document.querySelectorAll('ul.ticker a').length);
    log('case 44 html of the subject:', document.querySelectorAll('ul.ticker .detail')[4]?.innerHTML ?? '', document.querySelectorAll('ul.ticker .detail').length);
    one.stop(); expect(1).toBe(1);
});
it('45', () => {
    const one = make(five(), { opened: ['emails'] });
    const { layout, ui } = one.client;
    press('Name a1');
    const inbox = JSON.parse(JSON.stringify(layout.state ? null : null));
    const id = layout.openView('inbox');
    log('case 45 press on a thread, the Inbox tab state:', ui.instanceState(id), parseInboxState(ui.instanceState(id)).reveal, inbox);
    ui.setInstanceState(id, { search: 'zzz', folded: ['reply'], drafts: ['google:r1'] });
    press('Name r2');
    log('case 45 with it open, searched, the reply section folded:', layout.openView('inbox') === id, ui.instanceState(id));
    press('emails to reply');
    log('case 45 the line itself:', ui.instanceState(id));
    one.stop(); expect(1).toBe(1);
});
it('47', () => {
    const one = make(five(), { opened: ['emails'] });
    one.publish(five().filter((t) => t.id !== 'google:r1')); flushSync();
    log('case 47 one gone:', rows());
    one.publish([]); flushSync();
    log('case 47 the last gone:', rows(), one.tab.get());
    one.stop(); expect(1).toBe(1);
});
it('48', () => {
    for (const state of [{ opened: 'emails' }, { opened: [1, null] }, { closed: ['emails'] }, { closed: ['emails', 'tasks'], opened: ['emails'] }, { opened: { emails: true } }, null]) {
        const one = make(five(), state);
        const drawn = rows().length;
        press(drawn > 1 ? 'Fold 5' : 'Unfold 5');
        log('case 48', state, 'rows', drawn, 'after a press', one.tab.get());
        one.stop();
    }
    expect(1).toBe(1);
});
it('49', () => {
    const one = make(five(), { opened: ['emails'] });
    const target = [...document.querySelectorAll<HTMLElement>('button.name')].find((b) => (b.textContent ?? '').includes('Name r2'));
    target?.focus();
    one.publish(five().filter((t) => t.id !== 'google:r1')); flushSync();
    log('case 49 the keyboard after a row above left:', document.activeElement === target, (document.activeElement?.textContent ?? '').replace(/\s+/g, ' ').trim());
    one.publish([thread('r0', 'reply'), ...five()]); flushSync();
    log('case 49 the keyboard after a row above joined:', document.activeElement === target, (document.activeElement?.textContent ?? '').replace(/\s+/g, ' ').trim());
    if (target !== undefined) {
        Object.defineProperty(target, 'scrollWidth', { value: 900, configurable: true });
        Object.defineProperty(target, 'clientWidth', { value: 100, configurable: true });
        target.closest('li')?.dispatchEvent(new Event('pointerenter'));
        flushSync();
        log('case 49 hover words of a cut row:', target.closest('li')?.getAttribute('title') ?? null);
    }
    one.stop(); expect(1).toBe(1);
});
```

### `.agents/scratch/em/Show.svelte`

```
<script lang="ts">
    import { setContext } from 'svelte';
    import { createClientState } from '$lib/state/client/context';
    import { STATE_KEY } from '$lib/state/client/use';
    import { TIP_KEY, createTipIds } from '$lib/ui/menu/tip-ids';
    import { createHtmlMemo, provideHtmlMemo } from '$lib/ui/html/html';
    import TooltipGroup from '$lib/ui/menu/TooltipGroup.svelte';
    import { neighbours, slideAt } from '$lib/state/life/present';
    import Framed from '$lib/views/academic/present/screen/Framed.svelte';
    let { onclient, deck, key }: any = $props();
    const client = createClientState();
    setContext(STATE_KEY, client);
    setContext(TIP_KEY, createTipIds());
    provideHtmlMemo(createHtmlMemo());
    // svelte-ignore state_referenced_locally
    onclient(client);
    const held = $derived(deck.get());
    const row = $derived(slideAt(held.slides, key.get()));
</script>
<TooltipGroup>
    {#if row !== null}
        <Framed {row} deck={held} facts={true} around={neighbours(held.slides, key.get())} />
    {/if}
</TooltipGroup>
```

### `.agents/scratch/em/present.run.ts`

```
import { flushSync, mount, unmount } from 'svelte';
import { expect, it, vi } from 'vitest';
import text from './text.json';
import glyphs from './glyphs.json';
import Show from './Show.svelte';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { scrollContainer } from '../../../src/lib/shell/keys/key-dom.ts';
import { cell } from '../../../tests/ui/frame/rooted.svelte.ts';

setCatalog(text as Record<string, string>);
setGlyphs(glyphs as Record<string, string>);
const fonts = new EventTarget();
Object.defineProperty(document, 'fonts', { value: fonts });
const observers = new Set<() => void>();
vi.stubGlobal('ResizeObserver', class { run: () => void; constructor(run: (entries: never[]) => void) { this.run = () => run([]); observers.add(this.run); } observe() {} disconnect() { observers.delete(this.run); } unobserve() {} });
const idle: (() => void)[] = [];
const idleSet = new Map<number, () => void>();
let idleNext = 1;
(window as any).requestIdleCallback = (run: () => void) => { idleSet.set(idleNext, run); return idleNext++; };
(window as any).cancelIdleCallback = (id: number) => idleSet.delete(id);
const step = () => { const first = [...idleSet][0]; if (first === undefined) return false; idleSet.delete(first[0]); first[1](); flushSync(); return true; };

let textSize = 1;
let tried: string[] = [];
const heights: Record<string, number> = {};
const rect = (width: number, height: number) => ({ width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON: () => null }) as DOMRect;
HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.hasAttribute('data-frame')) return rect(1000, 562.5);
    if (this.classList.contains('probe')) return rect(20 * textSize, 20 * textSize);
    if (this.classList.contains('content')) {
        const key = this.closest<HTMLElement>('[data-slide-key]')?.dataset.slideKey ?? '';
        const fit = Number(this.style.getPropertyValue('--slide-fit'));
        const said = `${key}@${fit}${this.closest('.ahead') === null ? '' : ' ahead'}`;
        if (tried.at(-1) !== said) tried.push(said);
        return rect(800, (heights[key] ?? 500) * fit * textSize);
    }
    return rect(0, 0);
};
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { get: () => 1000 });
const texts = (key: string, body = key) => ({ key, kind: 'text', title: key, body, source: { path: 'a.md', line: 1 } });
const deckOf = (slides: unknown[], path = 'deck') => ({ root: 'hub', hub: 'hub', path, name: path, title: path, state: 'read', slides, order: [], groups: [], tagTones: {}, keys: null, projects: {}, findings: [] });
const settle = async () => { for (let at = 0; at < 5; at += 1) { await Promise.resolve(); flushSync(); } };
const take = () => { const was = tried; tried = []; return was; };
const drawn = () => [...document.querySelectorAll<HTMLElement>('.slide[data-slide-key]')].map((one) => `${one.dataset.slideKey}${one.closest('.ahead') === null ? '' : ' ahead'} fit ${one.querySelector<HTMLElement>('.content')?.style.getPropertyValue('--slide-fit')}`);
const log = (...said: unknown[]) => console.log(said.map((one) => (typeof one === 'string' ? one : JSON.stringify(one))).join(' '));

async function make(first: unknown, at: string) {
    let client: any;
    const deck = cell<any>(first);
    const key = cell(at);
    document.body.innerHTML = '';
    document.body.className = '';
    idleSet.clear();
    const view = mount(Show, { target: document.body, props: { deck, key, onclient: (made: unknown) => (client = made) } });
    flushSync();
    await settle();
    return { client: () => client, deck, key, stop: () => unmount(view) };
}
Object.assign(heights, { a: 500, b: 700, c: 600, d: 400 });
const four = () => [texts('a'), texts('b'), texts('c'), texts('d')];

it('34, 35, 36, 38', async () => {
    const one = await make(deckOf(four()), 'b');
    log('case 35 the shown slide is searched:', take(), drawn());
    let steps = 0;
    while (step()) { steps += 1; if (steps <= 4) log('  an idle turn:', take()); }
    log('case 35 idle turns in all:', steps, take(), drawn(), 'idle left', idleSet.size);
    const ahead = document.querySelector('.ahead');
    log('case 40 the box of the prepared slides:', ahead?.hasAttribute('inert') ?? null, ahead?.getAttribute('aria-hidden') ?? null, 'marked to scroll in it:', ahead?.querySelectorAll('[data-scroll]').length ?? null, 'in the whole page:', document.querySelectorAll('[data-scroll]').length, 'findings', one.client().present.findings().length);
    log('case 40 the first marked box of the pane is the shown frame:', document.querySelector('[data-scroll]')?.querySelector<HTMLElement>('.slide')?.dataset.slideKey ?? null, typeof scrollContainer);
    one.key.set('c'); flushSync(); await settle();
    log('case 35 the next slide shown, factors tried:', take(), drawn());
    one.key.set('b'); flushSync(); await settle();
    log('case 34 shown again, factors tried:', take(), drawn());
    one.key.set('a'); flushSync(); await settle();
    log('case 35 the one before shown:', take(), drawn());
    one.deck.set(deckOf([texts('a'), texts('b2'), texts('c2')])); flushSync(); await settle(); take();
    step(); step(); step(); step();
    log('case 36 preparing, four turns in:', take());
    one.key.set('c2'); flushSync(); await settle();
    log('case 36 a key meanwhile: shown at once', drawn(), take(), 'turns left of the dropped work', idleSet.size);
    step(); step();
    log('case 36 two turns on, prepared for the new slide:', take());
    one.deck.set(deckOf([texts('a')])); one.key.set('a'); flushSync(); await settle();
    while (step());
    log('case 38 a deck of one slide:', take(), drawn(), document.querySelectorAll('.ahead').length);
    await one.stop(); expect(1).toBe(1);
});
it('34 and 35 against a fresh search', async () => {
    const fresh = await make(deckOf(four()), 'c');
    const found = drawn()[0];
    await fresh.stop(); take();
    const one = await make(deckOf(four()), 'b');
    while (step());
    take();
    one.key.set('c'); flushSync(); await settle();
    log('case 35 a fresh search draws', found, 'a kept layout draws', drawn()[0], 'tried', take());
    await one.stop(); expect(1).toBe(1);
});
it('37, 40', async () => {
    const one = await make(deckOf(four()), 'b');
    while (step());
    take();
    textSize = 1.2; for (const run of [...observers]) run(); flushSync(); await settle();
    log('case 37 a text size change:', take().filter((said) => !said.includes('ahead')).length > 0);
    while (step()); take();
    textSize = 1;  for (const run of [...observers]) run(); flushSync(); await settle(); while (step()); take();
    document.body.className = 'rice'; one.key.set('c'); flushSync(); await settle();
    log('case 37 another theme, a slide kept under the one left:', take().length > 0);
    while (step()); take();
    fonts.dispatchEvent(new Event('loadingdone')); flushSync(); await settle();
    log('case 37 a font loaded:', take().filter((said) => !said.includes('ahead')));
    while (step()); take();
    one.deck.set(deckOf([texts('a'), texts('b'), texts('c', 'other words'), texts('d')])); flushSync(); await settle();
    log('case 37 a changed slide file:', take().filter((said) => !said.includes('ahead')).length > 0);
    one.deck.set(deckOf(four())); flushSync(); await settle(); while (step()); take();
    one.deck.set(deckOf([texts('a'), texts('b'), texts('c', 'of another deck'), texts('d')], 'other')); flushSync(); await settle(); while (step()); take();
    one.deck.set(deckOf(four())); flushSync(); await settle();
    log('case 40 a slide of one key in two decks, back on the first:', take());
    await one.stop(); expect(1).toBe(1);
});
it('37, 39 images', async () => {
    const states = new Map<string, [boolean, number, number]>();
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { configurable: true, get(this: HTMLImageElement) { return states.get(this.getAttribute('src') ?? '')?.[0] ?? false; } });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get(this: HTMLImageElement) { return states.get(this.getAttribute('src') ?? '')?.[1] ?? 0; } });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', { configurable: true, get(this: HTMLImageElement) { return states.get(this.getAttribute('src') ?? '')?.[2] ?? 0; } });
    const picture = (key: string, src: string) => ({ key, kind: 'image', title: key, heading: key, src, alt: `alt ${key}`, source: { path: 'a.md', line: 1 } });
    const one = await make(deckOf([texts('a'), picture('p', 'late.png'), picture('q', 'broken.png')]), 'p');
    log('case 37 an image not loaded: kept', one.client().present.layouts.of(deckOf([]), 'p')?.from ?? null);
    take();
    states.set('late.png', [true, 640, 480]);
    document.querySelector('img[src="late.png"]')?.dispatchEvent(new Event('load')); flushSync(); await settle();
    log('case 37 it loads late: searched again', take().length > 0, one.client().present.layouts.of(deckOf([]), 'p')?.from.images ?? null);
    while (step());
    states.set('broken.png', [true, 0, 0]);
    document.querySelector('.ahead img[src="broken.png"]')?.dispatchEvent(new Event('error')); flushSync(); while (step());
    log('case 39 the neighbour prepared:', one.client().present.layouts.of(deckOf([]), 'q')?.failed ?? null, document.querySelector('.ahead .gap')?.textContent ?? null);
    take();
    one.key.set('q'); flushSync(); await settle();
    log('case 39 shown:', document.querySelector('.slide:not(.ahead *) .gap')?.textContent ?? null, 'factors tried', take());
    await one.stop(); expect(1).toBe(1);
});
```

`em/text.json` and `em/glyphs.json` are the catalogs of `config/text` and `config/catalogs/glyphs.yml` as `em/text.ts` writes them.
