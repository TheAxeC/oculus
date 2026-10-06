NOT DONE: (1) Verify item 8 for the five new test files. They were written after their modules, so no run exists "with the module present and the behaviour missing"; one taken now would be a scratch copy with code removed, which the standing rules ban. Each new test file, run against the handed tree, stops at import because its module does not exist there (output below), which item 8 says does not count. The changed existing tests were run on the handed tree and the rows that fail there are listed below. (2) Nothing was seen in a browser: the cases that need a DOM (S16's tray controls, S30 to S33 interactions, the z-order of the delete confirmation over the tray, Escape order) are quoted from a server render of the real components and are left to the look. Everything else in items 0 to 13 and every other case is done and quoted below.

The verify list (`checks.sh` over `test:quick`) ran 5 times, each ending `exit 0`; the last run was made after the last edit of any file under `src`, `tests`, `config`, `HELP.md`, `DESIGN.md` and `README.md`. `tests/checks`, which the quick list does not cover, ran 4 times alone; the last run is quoted below.

## Open items of the state file

Copied from `tools/oculus/.scratch/migration/orchestrator-state.md` at the moment of writing (`sed -n '/^## Open items/,/^## Booked/p'`, last line dropped). The section holds a heading, an intro sentence and no entry.

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run

The handed tree is the scratch copy `$SP/a3/handed` (main's head with `A3-backed-out.patch` applied, copied before any change; `$SP` is the session scratchpad, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`). The brief's C1 to C36 number the cases C1 to C24, C26 to C31 and C34 to C36; the brief has no C25, C32 or C33. The engine cases ran through the patch's per-task engine with `$SP/a3/vp/first-engine.probe.ts` (vitest, `-c $SP/a3/vp/vitest.config.ts`, `TZ=Europe/Brussels`, fake clock, recording tmux, scratch files). C1 and C36 ran with `$SP/a3/probes/c1-c36.mts` on a scratch tmux server under `TMUX_TMPDIR=/private/tmp/claude-502/a3b` with the stub `claude` of the look (quoted whole below). C27 ran as a server render of the handed `UpdateTray.svelte` (`$SP/a3/vp/first-tray.svelte-probe.ts`, `-c $SP/a3/vp/vitest.svelte.config.mjs`). S3, S4, S35 to S38 and S42 ran as `$SP/a3/probes/first-yaml.cjs` over the `yaml` library the new reader uses; S34 and S52 ran as `$SP/a3/probes/first-misc.mts` and as the handed `config.test.ts` and `local.test.ts` with the changed rows (`$SP/a3/first-tests/config-local.out`).

On the handed tree every S case about `schedules.yml` shows that the file is not read:


```
approvals
commands
hpc
lines.ts
processes
pty
seeds
tasks
usage
--- grep -rln "schedules[.]yml" src config tests (handed tree):
grep exit 1
```

### Engine cases C2 to C35 on the handed tree (every line begins with its case id)

```
C2 06:59 next=Tue Sep 29 2026 07:00:00 (2026-09-29T05:00:00.000Z) starts=0
C2 07:00 starts=1 runs={schedule due=07:00 started terminal=0f91a9-claude} next=Wed Sep 30 2026 07:00:00 (2026-09-30T05:00:00.000Z)
C3 no pattern: next=null job-armed(timers)=1 record exists=false
C4 "nonsense": litwatch next=null pattern="nonsense"; scout (other entry) next=set; stderr=["schedule: litwatch: the pattern nonsense was not read: CronPattern: invalid configuration format ('nonsense'), exactly five, six, or seven space separated parts are required."]
C4 "61 * * * *": litwatch next=null pattern="61 * * * *"; scout (other entry) next=set; stderr=["schedule: litwatch: the pattern 61 * * * * was not read: CronPattern: Invalid value for minute: 61"]
C4 "* * * * * *": litwatch next=null pattern="* * * * * *"; scout (other entry) next=set; stderr=["schedule: litwatch: the pattern * * * * * * was not read: CronPattern: mode '5-part' requires exactly 5 parts, but pattern '* * * * * *' has 6 parts."]
C4 "*/0 * * * *": litwatch next=null pattern="*/0 * * * *"; scout (other entry) next=set; stderr=["schedule: litwatch: the pattern */0 * * * * was not read: CronPattern: Syntax error, illegal stepping: 0"]
C5 0 0 31 2 *: next=null starts=0 stderr=[]
C5 0 0 31 4,6,9,11 *: next=null starts=0 stderr=["schedule: litwatch: the pattern 0 0 31 4,6,9,11 * was not read: Maximum call stack size exceeded"]
C5 0 0 29 2 *: next=Tue Feb 29 2028 00:00:00 GMT+0100 (Central European Standard Time) starts=0 stderr=[]
C6 "@hourly": next=Tue Sep 29 2026 07:00:00 stderr=[]
C6 "@daily": next=Wed Sep 30 2026 00:00:00 stderr=[]
C6 "@weekly": next=Sun Oct 04 2026 00:00:00 stderr=[]
C6 "@monthly": next=Thu Oct 01 2026 00:00:00 stderr=[]
C6 "@yearly": next=Fri Jan 01 2027 00:00:00 stderr=[]
C6 "0 7 * * MON": next=Mon Oct 05 2026 07:00:00 stderr=[]
C6 " 0 7 * * * ": next=Tue Sep 29 2026 07:00:00 stderr=[]
C7 down 06:50-07:30, handled prior day: starts=1 runs={catch-up due=07:00 started terminal=cd4513-claude}
C8 down three days: starts=1 runs={catch-up due=07:00 started terminal=14764b-claude}
C9 restart 07:30, handled 07:00 today: starts=0 runs=0
C10 entry first read 09:12, pattern matched 07:00: starts=0 runs=0
C11 edit 07:00->08:00 at 06:30 (config push set()): started at 07:00=0, by 08:01=1; next after edit=Tue Sep 29 2026 08:00:00 (2026-09-29T06:00:00.000Z); since before=2026-09-29T04:30:00.000Z after=2026-09-29T04:30:00.200Z
C11 pattern removed at 06:59:50: starts after 07:00=0 next=null stored pattern=""
C11 pattern edited while the decision waits for the first sessions payload: starts=0 runs=
C12 earlier busy: starts=0 kills=0 run0={schedule due=07:00 skipped terminal=aabbcc-claude}
C12 earlier waiting: starts=0 kills=0 run0={schedule due=07:00 skipped terminal=aabbcc-claude}
C12 earlier no session matched: starts=0 kills=0 run0={schedule due=07:00 skipped terminal=aabbcc-claude}
C13 earlier terminal left the list: starts=1 run0={schedule due=07:00 started terminal=ba3120-claude}
C14 two tasks due the same minute: starts=2 litwatch runs=1 scout runs=1
C15 press while the scheduled run works: terminals started=2 (press answered a terminal true); record runs now: {hand due=null started terminal=cf814c-claude} {schedule due=07:00 started terminal=40a502-claude}
C16 skipPermissions=false: ["'/opt/Claude CLI/claude' '/research-cockpit litwatch'"] | skipPermissions=true: ["'/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch'"] | prompt entry: no such entry kind on the handed tree (startUpdateTask takes only the four task kinds)
C17 30 2 * * * from 2026-03-28T23:30:00+01:00 for 52 h: starts=3 dues=2026-03-29T01:30:00.000Z (local Sun Mar 29 2026 03:30:00) ; 2026-03-30T00:30:00.000Z (local Mon Mar 30 2026 02:30:00) ; 2026-03-31T00:30:00.000Z (local Tue Mar 31 2026 02:30:00)
C17 30 2 * * * from 2026-10-24T22:30:00+02:00 for 52 h: starts=2 dues=2026-10-25T00:30:00.000Z (local Sun Oct 25 2026 02:30:00) ; 2026-10-26T01:30:00.000Z (local Mon Oct 26 2026 02:30:00)
C17 0 * * * * from 2026-10-25T00:30:00+02:00 for 4 h: starts=3 dues=2026-10-24T23:00:00.000Z (local Sun Oct 25 2026 01:00:00) ; 2026-10-25T00:00:00.000Z (local Sun Oct 25 2026 02:00:00) ; 2026-10-25T02:00:00.000Z (local Sun Oct 25 2026 03:00:00)
C18 asleep 06:00-09:00 over 0 7 * * *: starts=1 runs={schedule due=07:00 started terminal=e7dd00-claude}
C18 asleep 06:00-09:00 over 0 8 * * *: starts=1 runs={schedule due=08:00 started terminal=7624da-claude}
C19 @yearly on 2026-10-05: longest timer asked=30000 ms; starts before 2027-01-01T00:00 local=1, after=1 runs=2026-12-31T23:00:00.000Z
C20 record missing: after the first read of a pattern the file exists=true mode=600
C20 {: starts=0 file unchanged=true payload.error="RECORD-UNREAD" stderr lines=1: ["schedule record: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/run/e-fZttpr/schedule.json is not JSON; no scheduled run starts while it does not read"]
C20 {"litwatch": 5}: starts=0 file unchanged=true payload.error="RECORD-UNREAD" stderr lines=1: ["schedule record: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/run/e-dp7o5a/schedule.json holds a litwatch entry of the wrong shape; no scheduled run starts while it does not read"]
C20 tray press with the record unread: started a terminal
C21 record folder read-only at the due time (07:00): starts=0, stderr lines=1 ["schedule: litwatch 2026-09-29T05:00:00.000Z: Error: EACCES: permission denied, open '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/run/e-A6wyfL/schedule.json.lock'"]; next due time (08:00) after the folder is writable: starts=1
C22 two watchers, one record, one due time: starts=1 runs=1
C23 start refused with terminal-failed: runs after 07:00 {schedule due=07:00 failed terminal=null}; after 08:00 {schedule due=08:00 failed terminal=null} {schedule due=07:00 failed terminal=null} (a failed run carries no why field on the handed tree)
C24 close() with a job armed: timers left=0 starts=0
C24 close() while a decision awaits the process table: timers left=0 non-list tmux calls=0 runs=1
C28 lock 120 s old: starts=1 lock left=false stderr=["schedule record: took over /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/run/e-3pDqBg/schedule.json.lock, which was 120000 ms old"]
C28 lock younger than 60 s that outlasts the 2000 ms wait: starts=0 stderr=["schedule: litwatch 2026-09-29T05:00:00.000Z: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/run/e-A95ShX/schedule.json.lock stays taken"]
C29 a due time while the same schedule's start is awaited: starts called=1 runs={schedule due=08:00 skipped terminal=null} {schedule due=07:00 started terminal=null}
C30 catch-up before the first sessions payload, earlier busy: started while waiting=0; after the payload starts=0 kills=[] run0={catch-up due=07:00 skipped terminal=aabbcc-claude}
C30 catch-up before the first sessions payload, earlier idle: started while waiting=0; after the payload starts=1 kills=["oculus-aabbcc-claude"] run0={catch-up due=07:00 started terminal=0e9718-claude}
C31 @hourly over 24 h, each run going idle: starts=24 kills=23 most terminals open at once=1
C31 due while idle: kill-session at call 0 (["kill-session","-t","oculus-aabbcc-claude"]), new-session at call 1
C34 key with no task beside the tasks' keys after a write: {"keep":"me","n":[1,2,3]}; in the payload tasks: ["litwatch","scout","linkedin","inbox"]; litwatch runs after the 21st=20
C35 no schedules.yml is read on the handed tree; the only change path is the config push set(): next Tue Sep 29 2026 07:00:00 (2026-09-29T05:00:00.000Z) -> Tue Sep 29 2026 09:00:00 (2026-09-29T07:00:00.000Z)
```

### C1 and C36 on the handed tree

```
C1 pane_pid=11471 listed pid=11471 printed $$=11471 ppid(printed)=11470 ppid(pane)=11470
C1 pane pid equals printed pid: true; pane pid is the parent of the printed pid: false
C36 start: terminal c6c217-claude pane pid 11620; pane shows: STUB ARGS: [/research-cockpit litwatch] | STUB PID=11620 | STUB STATUS=busy
C36 scan while the stub reports busy: [{"pid":11620,"liveStatus":"busy"},{"pid":null,"liveStatus":null}] listed terminals [{"id":"c6c217-claude","pid":11620}]
C36 one-run rule, earlier run busy: started=[] newest run {"trigger":"catch-up","outcome":"skipped","terminal":"c6c217-claude"} still listed: true
C36 scan after the stub went idle: [{"pid":11620,"liveStatus":"idle"},{"pid":null,"liveStatus":null}]
C36 one-run rule, earlier run idle: started=["a6e356-claude"] newest run {"trigger":"catch-up","outcome":"started","terminal":"a6e356-claude"} still listed: false
C36 scratch tmux server killed
```

### C27 on the handed tree

```
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus
C27 handed tray before any schedule message:
    | Update tasks
    | Close
    | Lit Watch
    | new-paper radar (web | minutes) Unavailable
    | Scout
    | academic openings (web | minutes) Unavailable
    | LinkedIn
    | draft a post from _linkedin/ Unavailable
    | Inbox
    | Gmail triage over the private mailbox Unavailable Gmail triage over the private mailbox
    | Chat
    | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
.
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  00:09:28
   Duration  16.90s (transform 8.74s, setup 0ms, import 16.73s, tests 16ms, environment 0ms)
```

### S34 and S52 on the handed tree

```
S34 handed behaviorFindings {"chat":{"skip_permissions":true}} -> [{"key":"chat.skip_permissions","message":"chat.skip_permissions is not read; the key is tasks.skip_permissions"}] | taskSkipPermissions = false
S34 handed behaviorFindings {"tasks":{"skip_permissions":true}} -> [] | taskSkipPermissions = true
S52 checkLocal("schedules: 3") = null
S52 readLocalText keys schedules and schedule_record: config.schedules = undefined config.scheduleRecord = undefined problems = []
S52 rebuiltBy(["schedules"]) = {"portfolio":false,"sessions":false,"usageRefresh":false,"usage":false,"git":false,"autofetch":false,"bookmarks":false}  rebuiltBy(["scheduleRecord"]) = {"portfolio":false,"sessions":false,"usageRefresh":false,"usage":false,"git":false,"autofetch":false,"bookmarks":false}
```

The handed `config.test.ts` and `local.test.ts` with the rows this step changes (S34, S52):

```
     x answers "schedules: 3" with the sentence it would throw 4ms
     x names the key that replaced a retired one, against behavior.yml: chat.skip_permissions 7ms
     x names the key that replaced a retired one, against behavior.yml: tasks.skip_permissions 2ms
     x words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files 17ms
------- Failed Tests 4 -------
 FAIL  |unit| tests/checks/config/config.test.ts > behaviorFindings > names the key that replaced a retired one, against behavior.yml: chat.skip_permissions
 FAIL  |unit| tests/checks/config/config.test.ts > behaviorFindings > names the key that replaced a retired one, against behavior.yml: tasks.skip_permissions
 FAIL  |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
 FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "schedules: 3" with the sentence it would throw
 Test Files  2 failed (2)
      Tests  4 failed | 48 passed (52)
```

### S3, S4, S35 to S38, S42 on the handed tree (the library's reading)

```
S3 (editor, newline) "- name: [\n" -> BAD_INDENT@line2 (not read)
S3 (no final newline) "- name: [" -> BAD_INDENT@line1 (not read)
S42a duplicate name "- name: a\n  name: b\n" -> DUPLICATE_KEY@line2 (not read)
S42b unquoted */5 "- name: a\n  when: */5 * * * *\n" -> UNEXPECTED_TOKEN@line2,UNEXPECTED_TOKEN@line2,UNEXPECTED_TOKEN@line2,UNEXPECTED_TOKEN@line2 (not read)
S42c unquoted * * "- name: a\n  when: * * * * *\n" -> BAD_ALIAS@line2,UNEXPECTED_TOKEN@line2,UNEXPECTED_TOKEN@line2,UNEXPECTED_TOKEN@line2,UNEXPECTED_TOKEN@line2 (not read)
S4 map "a: 1\n" -> ok {"a":1}
S4 string "just text\n" -> ok "just text"
S37 name 2026 "- name: 2026\n" -> ok [{"name":2026}]
S37 name [a] "- name: [a]\n" -> ok [{"name":["a"]}]
S38 - just text / - null "- just text\n- null\n" -> ok ["just text",null]
S36 when null / empty "- name: a\n  when:\n- name: b\n  when: \"\"\n" -> ok [{"name":"a","when":null},{"name":"b","when":""}]
S35 proto "- name: __proto__\n  when: \"0 7 * * *\"\n- name: constructor\n" -> ok [{"name":"__proto__","when":"0 7 * * *"},{"name":"constructor"}]
ranges [ [ 2, 76, 76 ], [ 78, 113, 113 ] ]
comments-only contents null null
null file toJS null
```

### Case by case

Each row reads the output above against the brief's expected result for that case (brief lines 344 to 376).

| Case | Handed tree |
| --- | --- |
| C1 | The pane pid equals the printed `$$`; it is not the parent. One of the two, as the brief expects. |
| C2, C6 to C10, C12 to C14, C17 to C19, C22, C24, C28 to C31 | The printed result is the brief's expected result. |
| C3 | `next=null`, no record file before the Run now, as the brief expects. The line prints `job-armed(timers)=1` and does not say whether that one timer is the 30 s look; not verified on the handed tree. |
| C4 | No job for each of the four patterns and the other entry has a `next`, as the brief expects. The reason is one stderr line per pattern; the handed payload carries no `when-unreadable` problem (the brief expects one). |
| C5 | `0 0 31 2 *` gives `next=null` with an empty stderr; `0 0 31 4,6,9,11 *` gives `next=null` with the stderr line "Maximum call stack size exceeded"; `0 0 29 2 *` gives next 2028-02-29. The brief expects the problem `when-never` for the first two, and neither has one. |
| C11 | The change comes through the config push `set()`, the only change path on the handed tree; `next` and `since` move as the brief expects. There is no Edit route to try. |
| C15 | The press started a second terminal and the record holds `{hand due=null started ...}`: a hand press is recorded as a run. The brief expects nothing recorded. |
| C16 | The task argv equals the press's with and without the flag, as the brief expects. A prompt entry does not exist on the handed tree. |
| C20 | A missing record is created at the first read of a pattern with mode 600. An unreadable or wrong-shaped record: no start, file unchanged, one stderr line, `payload.error="RECORD-UNREAD"` (the brief expects the payload's `unread` to hold `record`); a tray press starts a terminal. |
| C21 | No start at the due time, one stderr line; the next due time (08:00) starts once the folder is writable. As the brief expects. |
| C23 | A refused start is recorded `failed` and the next due time tries again; the run carries no `why` field. The brief expects `why: { word: 'terminal-failed' }`. |
| C26 | By reading; see the C26 section. |
| C27 | The handed tray has no Schedules section and no `No schedule` text on a row. The brief expects `No schedule` on each row. |
| C34 | The key with no schedule is kept as a value (`{"keep":"me","n":[1,2,3]}`) and is not in the payload's `tasks`; the 21st run leaves 20 kept. Byte-for-byte equality of the file was not compared on the handed tree. |
| C35 | There is no `schedules.yml` on the handed tree; the only change is the config push `set()`, which moves `next` from 07:00 to 09:00. |
| C36 | The scan's pid equals the pane pid; busy is read as working and the earlier terminal is kept (`skipped`); idle is read as idle and a new terminal starts. As the brief expects. |
| S1, S2, S5 to S22, S24 to S33, S39 to S41, S43 to S51 | The handed tree has no reader of `schedules.yml`, no route and no store: the `ls` and the grep at the top of this section. These cases have no handed result to quote. |
| S3, S4, S35 to S38, S42 | The `yaml` library's reading is in the block above; the reader built in this step is what turns those errors into `unread`. |
| S23 | Checked by reading, see the readings below. |
| S34 | `chat.skip_permissions: true` gives the finding "the key is tasks.skip_permissions"; `tasks.skip_permissions: true` gives no finding and `taskSkipPermissions` is true. |
| S52 | `checkLocal("schedules: 3")` is null: `local.yml` has no `schedules` key on the handed tree. |

No case in the brief had a rule I found wrong when compared with the final runs below.


## The cases, final run

Every case below ran on the final tree. A case kept as a test is named with its test; every other case ran through a probe kept in the scratchpad `$SP/a3/final/` and quoted in the last section. Each output line begins with its case id. The probes:

- `engine.probe.ts` and `engine2.probe.ts` (vitest, `TZ=Europe/Brussels npx vitest run -c $SP/a3/final/vitest.config.ts engine engine2`): the real `watchSchedules` over the real `runEntry`, a recording tmux, a fake clock, scratch files. C2 to C24, C28 to C31, C34, S6, S15, S26, S51.
- `entries.probe.ts` (same command, `entries`): the real `readSchedules`, the real route `handleSchedules` and the real watcher over scratch files. S1 to S22, S24 to S26, S28, S35 to S51.
- `store.svelte-probe.ts` (`-c $SP/a3/final/vitest.svelte.config.mjs store`): the real `createSchedule` and a server render of the real `UpdateTray`, `ScheduleList` and `ScheduleDialog`. S1, S3, S10, S16, S27 to S32, C27.
- `tmux.mts` (`node $SP/a3/final/tmux.mts`): a scratch tmux server under `TMUX_TMPDIR=/private/tmp/claude-502/a3b`, the stub `claude`, the real `startUpdateTask`, `runEntry`, `watchSchedules` and the sessions scan. C1, C20 (the press), C35, C36.
- `misc.mts` (`node $SP/a3/final/misc.mts`): a scratch copy of `config/` without `local.yml`, scratch `local.yml` text and a scratch `HOME`. S34, S52.

Kept tests, by file: `watch.test.ts` (rows of due times that start one run each, a restart, a second watcher over one record), `run.test.ts` (11 rows: the argument vectors of a task, an unattended task, a prompt, an unattended prompt, a dash-led prompt and a saved command, and the refusals `needs-approval`, `command-unknown`, `folder-missing`, `folder-not-served`, `prompt-control`), `record.test.ts` (a write over an unreadable record is refused and the file left), `file.test.ts` (a write over an unreadable schedules file is refused: an editor's half line, a map, a string), `schedules.test.ts` (403 for each of the five actions with a wrong or empty token, nothing written), the rows of `config.test.ts` and `local.test.ts` for S34 and S52, and the unchanged rows of `terminal-actions.test.ts` and `commands/run.test.ts`. S23 and C26 are checked by reading (below). The look: C27 and S16, S30 to S33 as DOM, see "The look".

### Engine cases (`engine.out`)


```
C2 06:59 next=Tue Sep 29 2026 07:00:00 starts=0
C2 07:00 starts=1 runs={schedule due=07:00 started terminal=c2ae22-claude} next=Wed Sep 30 2026 07:00:00
C3 no when: next=null timers=1 (the 30 s look only) entry.when="" record exists=false
C3 after Run now: {"terminal":"33769a-claude"} record exists=true runs={hand due=null started terminal=33769a-claude}
C4 "nonsense": problem={"word":"when-unreadable","names":["nonsense"]} next=null; other entry next=set problem=null; stderr=[]
C4 "61 * * * *": problem={"word":"when-unreadable","names":["61 * * * *"]} next=null; other entry next=set problem=null; stderr=[]
C4 "* * * * * *": problem={"word":"when-unreadable","names":["* * * * * *"]} next=null; other entry next=set problem=null; stderr=[]
C4 "*/0 * * * *": problem={"word":"when-unreadable","names":["*/0 * * * *"]} next=null; other entry next=set problem=null; stderr=[]
C5 0 0 31 2 *: problem={"word":"when-never","names":["0 0 31 2 *"]} next=null starts=0 stderr=[]
C5 0 0 31 4,6,9,11 *: problem={"word":"when-never","names":["0 0 31 4,6,9,11 *"]} next=null starts=0 stderr=[]
C5 0 0 29 2 *: problem=null next=Tue Feb 29 2028 00:00:00 starts=0 stderr=[]
C6 "@hourly": problem=null next=Tue Sep 29 2026 07:00:00 stderr=[]
C6 "@daily": problem=null next=Wed Sep 30 2026 00:00:00 stderr=[]
C6 "@weekly": problem=null next=Sun Oct 04 2026 00:00:00 stderr=[]
C6 "@monthly": problem=null next=Thu Oct 01 2026 00:00:00 stderr=[]
C6 "@yearly": problem=null next=Fri Jan 01 2027 00:00:00 stderr=[]
C6 "0 7 * * MON": problem=null next=Mon Oct 05 2026 07:00:00 stderr=[]
C6 " 0 7 * * * ": problem=null next=Tue Sep 29 2026 07:00:00 stderr=[]
C7 down 06:50-07:30, handled the day before: starts=1 runs={catch-up due=07:00 started terminal=5a5749-claude}
C8 down three days: starts=1 runs={catch-up due=07:00 started terminal=f70e39-claude}
C9 restart 07:30, handled 07:00 of that day: starts=0 runs=0
C10 entry first read at 09:12 whose pattern matched 07:00: starts=0 runs=0
C11 edit 07:00 to 08:00 at 06:30: starts by 07:31=0, by 08:31=1; next after edit=Tue Sep 29 2026 08:00:00; since before=2026-09-29T04:30:00.000Z after=2026-09-29T04:30:00.200Z; pattern stored="0 8 * * *"
C11 when removed at 06:59:50: starts after 07:00=0 next=null stored pattern=""
C11 when edited while a decision waits for the first sessions payload: starts=0 runs=
C11 when removed while the start is awaited: start called=1; after the start answers (refused terminal-failed) the run in progress is settled: runs={schedule due=07:00 failed terminal=null why={"word":"terminal-failed","names":[]}} job stopped: next=null
C12 earlier busy: starts=0 kills=0 run0={schedule due=07:00 skipped terminal=aabbcc-claude}
C12 earlier waiting: starts=0 kills=0 run0={schedule due=07:00 skipped terminal=aabbcc-claude}
C12 earlier no session matched: starts=0 kills=0 run0={schedule due=07:00 skipped terminal=aabbcc-claude}
C13 earlier terminal left the list: starts=1 run0={schedule due=07:00 started terminal=be055b-claude}
C14 two schedules due the same minute: starts=2 Weekly radar runs=1 Scout daily runs=1
C15 press of Lit Watch while a schedule's run of litwatch is working: terminals started=2 (press answered a terminal, a new one: true); record runs unchanged by the press: true ({schedule due=07:00 started terminal=0d74ee-claude})
C16 task false: ["'/opt/Claude CLI/claude' '/research-cockpit litwatch'"] | task true: ["'/opt/Claude CLI/claude' '--dangerously-skip-permissions' '/research-cockpit litwatch'"] | prompt false: ["/opt/Claude CLI/claude","--","P1"] | prompt true: ["/opt/Claude CLI/claude","--dangerously-skip-permissions","--","P1"]
C17 30 2 * * * from 2026-03-28T23:30:00+01:00 for 52 h: starts=3 dues=2026-03-29T01:30:00.000Z (local Sun Mar 29 2026 03:30:00) ; 2026-03-30T00:30:00.000Z (local Mon Mar 30 2026 02:30:00) ; 2026-03-31T00:30:00.000Z (local Tue Mar 31 2026 02:30:00)
C17 30 2 * * * from 2026-10-24T22:30:00+02:00 for 52 h: starts=2 dues=2026-10-25T00:30:00.000Z (local Sun Oct 25 2026 02:30:00) ; 2026-10-26T01:30:00.000Z (local Mon Oct 26 2026 02:30:00)
C17 0 * * * * from 2026-10-25T00:30:00+02:00 for 4 h: starts=3 dues=2026-10-24T23:00:00.000Z (local Sun Oct 25 2026 01:00:00) ; 2026-10-25T00:00:00.000Z (local Sun Oct 25 2026 02:00:00) ; 2026-10-25T02:00:00.000Z (local Sun Oct 25 2026 03:00:00)
C18 asleep 06:00-09:00 over 0 7 * * *: starts=1 runs={schedule due=07:00 started terminal=321ab9-claude}
C18 asleep 06:00-09:00 over 0 8 * * *: starts=1 runs={schedule due=08:00 started terminal=4690da-claude}
C19 @yearly on 2026-10-05: longest timer asked=30000 ms; starts before 2027-01-01T00:00 local=1, after=1 runs=2026-12-31T23:00:00.000Z
C20 record missing: after the first read of a pattern the file exists=true mode=600
C20 {: starts=0 file unchanged=true unread=[{"file":"record","line":null}] Run now={"refused":"record-unread","names":[]} stderr lines=1: ["schedule record: <dir>/schedule.json is not JSON; no scheduled run starts while it does not read"]
C20 {"Weekly radar": 5}: starts=0 file unchanged=true unread=[{"file":"record","line":null}] Run now={"refused":"record-unread","names":[]} stderr lines=1: ["schedule record: <dir>/schedule.json holds an entry of Weekly radar of the wrong shape; no scheduled run starts while it does not read"]
C21 scratch folder read-only at the due time (07:00): starts=0, stderr lines=1 ["schedule: Weekly radar 2026-09-29T05:00:00.000Z: Error: EACCES: permission denied, open '<dir>/schedule.json.lock'"]; next due time (08:00) after the folder is writable: starts=1
C22 two watchers over one record and one schedules.yml, one due time: starts=1 runs=1
C23 start refused with terminal-failed: runs after 07:00 {schedule due=07:00 failed terminal=null why={"word":"terminal-failed","names":[]}}; after 08:00 {schedule due=08:00 failed terminal=null why={"word":"terminal-failed","names":[]}} {schedule due=07:00 failed terminal=null why={"word":"terminal-failed","names":[]}}
C24 close() with a job armed: timers left=0 starts=0
C24 close() while a decision awaits the process table: timers left=0 non-list tmux calls=0 runs=1
C24 close() with a start awaited: start called=1 new-session calls=0 timers left=0
C28 lock 120 s old: starts=1 lock left=false stderr=["schedule record: took over <dir>/schedule.json.lock, which was 120000 ms old"]
C28 lock younger than 60 s that outlasts the 2000 ms wait: starts=0 stderr=["schedule: Weekly radar 2026-09-29T05:00:00.000Z: <dir>/schedule.json.lock stays taken"]
C29 a due time while the same schedule's start is awaited: start called=1 runs={schedule due=08:00 skipped terminal=null} {schedule due=07:00 started terminal=null}
C30 catch-up before the first sessions payload, earlier busy: started while waiting=0; after the payload starts=0 kills=[] run0={catch-up due=07:00 skipped terminal=aabbcc-claude}
C30 catch-up before the first sessions payload, earlier idle: started while waiting=0; after the payload starts=1 kills=["oculus-aabbcc-claude"] run0={catch-up due=07:00 started terminal=667207-claude}
C31 @hourly over 24 h, each run going idle: starts=24 kills=23 most terminals open at once=1
C31 task due while idle/ended: kill-session at call 0 (["kill-session","-t","oculus-aabbcc-claude"]), new-session at call 1, no confirmation prompt
C31 command due while idle/ended: kill-session at call 0 (["kill-session","-t","oculus-aabbcc-claude"]), new-session at call 1, no confirmation prompt
C34 key with no schedule beside the schedules' keys after a write: {"pattern":"","since":"2026-08-20T06:00:00.000Z","handled":null,"runs":[]} (before {"pattern":"","since":"2026-08-20T06:00:00.000Z","handled":null,"runs":[]}); in the payload rows: ["Weekly radar"]; Weekly radar runs after the 21st=20
```

### Engine cases, second part (`engine2.out`)

```
S15 paused entry at its 07:00 due time: starts=0 runs=0 next=null
S15 Resume at 08:00 after the missed 07:00: starts=0 (no catch-up); since after Resume=2026-09-29T06:00:10.200Z (clock 2026-09-29T06:00:10.400Z); handled=null; record file existed before the Resume=false; next=2026-09-30T05:00:00.000Z
S6 command deleted between the decision and the start: new-session calls=0 runs={schedule due=07:00 failed terminal=null why={"word":"command-unknown","names":["sync"]}}
S26 row before the due time: problem=null
S26 at its due time (the chain holds a file command nobody approved): new-session calls=0 runs={schedule due=07:00 failed terminal=null why={"word":"needs-approval","names":["sync"]}}
S51 row before: problem=null next set=true
S51 root no longer served at the 07:00 due time (no file change in between): new-session calls=0 runs=; row now: problem={"word":"folder-not-served","names":["<repo>"]}
```

### Files, entries and the route (`entries.out`)

```
S1 schedules.yml missing: {"ok":true,"rows":[],"commandsUnread":false} file exists=false
S1 watcher over a missing file: rows=0 unread=[] file exists after start=false
S2 empty file: rows=0; first save -> 200 {"ok":true}; file now="- name: Weekly radar\n  runs: { task: litwatch }\n  when: \"0 7 * * 1\"\n"
S2 comments only: rows=0; first save -> 200 {"ok":true}; file now="# my schedules\n# second line\n- name: Weekly radar\n  runs: { task: litwatch }\n  when: \"0 7 * * 1\"\n"
S2 null: rows=0; first save -> 200 {"ok":true}; file now="- name: Weekly radar\n  runs: { task: litwatch }\n  when: \"0 7 * * 1\"\n"
S3 unparseable (- name: [): unread=[{"file":"schedules","line":2}] save/delete/pause/resume=409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} Run now={"refused":"schedules-unread","names":[]} file unchanged=true
S4 top-level map: unread=[{"file":"schedules","line":null}] save/delete/pause/resume=409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} Run now={"refused":"schedules-unread","names":[]} file unchanged=true
S4 top-level string: unread=[{"file":"schedules","line":null}] save/delete/pause/resume=409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} Run now={"refused":"schedules-unread","names":[]} file unchanged=true
S42 name: twice in one entry: unread=[{"file":"schedules","line":2}] save/delete/pause/resume=409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} Run now={"refused":"schedules-unread","names":[]} file unchanged=true
S42 unquoted when: */5 * * * *: unread=[{"file":"schedules","line":3}] save/delete/pause/resume=409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} | 409 {"error":"schedules-unread","names":[]} Run now={"refused":"schedules-unread","names":[]} file unchanged=true
S5 runs task radar: [0] name="A" entry=set problem=update-task-unknown["radar","litwatch, scout, linkedin, inbox"] ; [1] name="B" entry=set problem=none
S8 prompt folders: [0] name="a" entry=set problem=folder-empty[] ; [1] name="b" entry=set problem=folder-empty[] ; [2] name="c" entry=set problem=folder-wrong["projects/x"] ; [3] name="d" entry=set problem=folder-missing["/no/such/dir"] ; [4] name="e" entry=set problem=none ; [5] name="f" entry=set problem=none
S9 prompts: [0] name="a" entry=set problem=prompt-empty[] ; [1] name="b" entry=set problem=prompt-empty[] ; [2] name="c" entry=set problem=prompt-too-long["100000"] ; [3] name="d" entry=set problem=prompt-control[] ; [4] name="e" entry=set problem=none ; [5] name="f" entry=set problem=none
S10 names clash: [0] name="Weekly radar" entry=set problem=name-twice["Weekly radar"] ; [1] name="weekly RADAR" entry=set problem=name-twice["weekly RADAR"]
S11 names: [0] name="" entry=set problem=name-missing[] ; [1] name="" entry=set problem=name-missing[] ; [2] name="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" entry=set problem=name-wrong["xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"] ; [3] name="a\u0001b" entry=set problem=name-wrong["a\u0001b"]
S12 runs shapes: [0] name="a" entry=null problem=runs-wrong[] ; [1] name="b" entry=null problem=runs-wrong[] ; [2] name="c" entry=null problem=runs-wrong[]
S13 unknown keys: [0] name="a" entry=set problem=key-unknown["at"] ; [1] name="b" entry=set problem=key-unknown["folder"]
S14 flags: [0] name="a" entry=set problem=flag-wrong["paused"] ; [1] name="b" entry=set problem=flag-wrong["unattended"] ; [2] name="c" entry=set problem=unattended-command[]
S36 when values: [0] name="a" entry=set problem=none ; [1] name="b" entry=set problem=none ; [2] name="c" entry=set problem=when-unreadable["5"] ; [3] name="d" entry=set problem=when-unreadable["[0, 7]"]
S37 name types: [0] name="2026" entry=set problem=none ; [1] name="" entry=null problem=name-wrong["[a]"] ; [2] name="" entry=null problem=name-wrong["{ a: 1 }"]
S38 non-map entries: [0] name="" entry=null problem=entry-wrong[] ; [1] name="" entry=null problem=entry-wrong[] ; [2] name="ok" entry=set problem=none
S39 folder empty: [0] name="a" entry=set problem=folder-empty[] ; [1] name="b" entry=set problem=folder-empty[] ; [2] name="c" entry=set problem=folder-empty[] ; [3] name="d" entry=set problem=folder-empty[]
S40 unattended false on a command: [0] name="a" entry=set problem=none
S48 a name of exactly 80: [0] name="yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" entry=set problem=none
S49 prompt folders served: [0] name="a" entry=set problem=none ; [1] name="b" entry=set problem=none ; [2] name="c" entry=set problem=folder-wrong["projects"]
S50 prompt folders not served: [0] name="a" entry=set problem=folder-not-served["~/"] ; [1] name="b" entry=set problem=folder-not-served["/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/final-run/w-sd1UE6/outside"]
S6 before: command row problem=null next=true
S6 after commands.json lost the command: problem={"word":"command-missing","names":["sync","/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/final-run/w-d6f4xG/repo"]} next=null
S7 commands.json not JSON: command row problem={"word":"commands-unread","names":[]}; task row problem=null next set=true; prompt row problem=null next set=true; unread=[{"file":"commands","line":null}]; commands list=[]
S41 commands.json missing: command row problem={"word":"command-missing","names":["sync","/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/final-run/w-cKErCW/repo"]}; task row next set=true; unread=[]; commands list=[]
S18 rename: 200 {"ok":true}; file="# my schedules  \n- name: Renamed radar\n  runs: { task: litwatch }\n  when: \"0 7 * * 1\"\n- name: Other\n  runs: { task: scout }\n"; record keys=["Renamed radar"] moved entry handled=2026-10-05T05:00:00.000Z runs=2
S19 new schedule under a held record name: 200 {"ok":true}; record entry now={"pattern":"0 7 * * *","since":"2026-10-05T23:45:44.164Z","handled":null,"runs":[]} (dropped before the save)
S21 hour: 200 file="- name: P\n  runs: { task: litwatch }\n  when: \"0 * * * *\"\n" reads back when="0 * * * *"
S21 day: 200 file="- name: P\n  runs: { task: litwatch }\n  when: \"0 7 * * *\"\n" reads back when="0 7 * * *"
S21 week: 200 file="- name: P\n  runs: { task: litwatch }\n  when: \"30 8 * * 1,3,5\"\n" reads back when="30 8 * * 1,3,5"
S21 custom: 200 file="- name: P\n  runs: { task: litwatch }\n  when: \"0 */5 * * *\"\n" reads back when="0 */5 * * *"
S28 Off writes no when: 200 file tail="  when: \"0 */5 * * *\"\n- name: Off one\n  runs: { task: litwatch }\n"
S22 200 file="- name: \"a: b # c\"\n  runs: { prompt: \"line one\\nline # two\", folder: hub }\n  when: \"0 7 * * *\"\n" read back name="a: b # c" prompt="line one\nline # two"
S24 wrong token: 403 {"error":"the write token is missing or stale"}; empty token: 403 {"error":"the write token is missing or stale"}; file unchanged=true
S25 stale at: save 409 {"error":"entry-changed","names":[]} ; delete 409 {"error":"entry-changed","names":[]}; file unchanged=true
S26 command with ${file}: 400 {"error":"no-file","names":["${file}"]}; command depending on an unapproved file command: 200 {"ok":true} (commands.json unchanged by saves=n/a)
S43 record unread: save/rename/delete=409 {"error":"record-unread","names":[]} | 409 {"error":"record-unread","names":[]} | 409 {"error":"record-unread","names":[]}; pause (not a record write)=200 {"ok":true}; record unchanged=true; schedules.yml after those three (before the pause)... see pause
S43 schedules.yml unchanged by save, rename and delete: changed only by the pause
S46 {"action":"nonsense"} -> 400 {"error":"action must be save, delete, pause, resume or run, with the fields that action takes"} ; [] -> 400 {"error":"action must be save, delete, pause, resume or run, with the fields that action takes"} ; "x" -> 400 {"error":"action must be save, delete, pause, resume or run, with the fields that action takes"} ; null -> 400 {"error":"action must be save, delete, pause, resume or run, with the fields that action takes"} ; {} -> 400 {"error":"action must be save, delete, pause, resume or run, with the fields that action takes"} ; {"action":"save"} -> 400 {"error":"action must be save, delete, pause, resume or run, with the fields that action takes"} ; {"act
S47 pause of a paused entry: 200 {"ok":true}; resume of one not paused: 200 {"ok":true}; file unchanged=true; change-log lines added=0
S10 rename B onto held name A: 400 {"error":"name-twice","names":["a"]}
S44 Run now on a name no entry holds: 409 {"error":"entry-changed","names":[]} new-session calls added=0 runs recorded under that name=0 ([])
S20 trailing comment after two spaces, save of Other: 200; list read back: Weekly radar 0 7 * * 1, Other 0 10 * * *, Third; record has Other=true; diff of the two texts:
        7c7
        <   when: "0 9 * * *"
        ---
        >   when: "0 10 * * *"
S20 trailing comment after two spaces, delete of Other: 200; list read back: Weekly radar 0 7 * * 1, Third; record has Other=false; diff of the two texts:
        5,7d4
        < - name: Other
        <   runs: { task: scout }
        <   when: "0 9 * * *"
S20 trailing comment after two spaces, pause of Other: 200; list read back: Weekly radar 0 7 * * 1, Other(paused) 0 9 * * *, Third; record has Other=true; diff of the two texts:
        7a8
        >   paused: true
S20 trailing comment after two spaces, resume of Other: 200; list read back: Weekly radar 0 7 * * 1, Other 0 9 * * *, Third; record has Other=true; diff of the two texts:
        8d7
        <   paused: true
S20 flow map without inner spaces, save of Other: 200; list read back: Weekly radar 0 7 * * 1, Other 0 10 * * *, Third; record has Other=true; diff of the two texts:
        5,6c5,6
        <   runs: {task: scout}
        <   when: "0 9 * * *"
        ---
        >   runs: { task: scout }
        >   when: "0 10 * * *"
S20 flow map without inner spaces, delete of Other: 200; list read back: Weekly radar 0 7 * * 1, Third; record has Other=false; diff of the two texts:
        4,6d3
        < - name: Other
        <   runs: {task: scout}
        <   when: "0 9 * * *"
S20 flow map without inner spaces, pause of Other: 200; list read back: Weekly radar 0 7 * * 1, Other(paused) 0 9 * * *, Third; record has Other=true; diff of the two texts:
        5c5
        <   runs: {task: scout}
        ---
        >   runs: { task: scout }
        6a7
        >   paused: true
S20 flow map without inner spaces, resume of Other: 200; list read back: Weekly radar 0 7 * * 1, Other 0 9 * * *, Third; record has Other=true; diff of the two texts:
        7d6
        <   paused: true
S20 entries indented by 4 spaces, save of Other: 200; list read back: Weekly radar 0 7 * * 1, Other 0 10 * * *, Third; record has Other=true; diff of the two texts:
        6c6
        <       when: "0 9 * * *"
        ---
        >       when: "0 10 * * *"
S20 entries indented by 4 spaces, delete of Other: 200; list read back: Weekly radar 0 7 * * 1, Third; record has Other=false; diff of the two texts:
        4,6d3
        <     - name: Other
        <       runs: { task: scout }
        <       when: "0 9 * * *"
S20 entries indented by 4 spaces, pause of Other: 200; list read back: Weekly radar 0 7 * * 1, Other(paused) 0 9 * * *, Third; record has Other=true; diff of the two texts:
        6a7
        >       paused: true
S20 entries indented by 4 spaces, resume of Other: 200; list read back: Weekly radar 0 7 * * 1, Other 0 9 * * *, Third; record has Other=true; diff of the two texts:
        7d6
        <       paused: true
S20 4-space list, delete of Weekly radar (position 0): 200; list read back: Other, Third; diff:
        1,3d0
        <     - name: Weekly radar
        <       runs: { task: litwatch }
        <       when: "0 7 * * 1"
S20 4-space list, delete of Other (position 1): 200; list read back: Weekly radar, Third; diff:
        4,6d3
        <     - name: Other
        <       runs: { task: scout }
        <       when: "0 9 * * *"
S20 4-space list, delete of Third (position 2): 200; list read back: Weekly radar, Other; diff:
        7,8d6
        <     - name: Third
        <       runs: { task: inbox }
S20 2-space list with comments, delete of Weekly radar (position 0): 200; list read back: Other, Third; diff:
        2,4d1
        < - name: Weekly radar  # why
        <   runs: { task: litwatch }   # which
        <   when: "0 7 * * 1"  # monday
S20 2-space list with comments, delete of Other (position 1): 200; list read back: Weekly radar, Third; diff:
        5,7d4
        < - name: Other
        <   runs: { task: scout }
        <   when: "0 9 * * *"
S20 2-space list with comments, delete of Third (position 2): 200; list read back: Weekly radar, Other; diff:
        8,9d7
        < - name: Third
        <   runs: { task: inbox }
S20 delete of a schedule whose run is going: Run now {"terminal":"f9c247-claude"}; delete 200 {"ok":true}; kill-session calls=0; new-session calls=1; record entry dropped=true; rows in the payload=0
S16 Run now while the earlier run is working: {"skipped":"aabbcc-claude"} new-session=0 newest run={"trigger":"hand","due":null,"at":"2026-10-05T23:45:46.436Z","outcome":"skipped","terminal":"aabbcc-claude"}
S16 Run now while idle: {"terminal":"59cd02-claude"} kill-session at call 0, new-session at call 1
S45 two Run now presses in a row (both issued before either settles): {"terminal":"56f29b-claude"} / {"skipped":null} new-session=1 runs={hand due=null skipped terminal=null} {hand due=null started terminal=56f29b-claude}
S45 a third press after the first started (its terminal is not listed yet as working): {"terminal":"69c0ce-claude"}
S17 Run now on an entry with a problem: {"refused":"when-unreadable","names":["nonsense"]}
S17 Run now while the record does not read: {"refused":"record-unread","names":[]}
S15 paused entry: next=null paused=true runs=0 record exists=false; Run now while paused: {"terminal":"a3a647-claude"}
S35 three schedules named __proto__, constructor and toString each run once from Run now: record keys=["__proto__","constructor","toString"] runs per key=[1,1,1]; raw file keys=["__proto__","constructor","toString"]
S35 Edit renaming constructor: 200 {"ok":true} record keys=["__proto__","toString","ctor renamed"]; clash among the three: [null,null,null]
S49 in root: {"terminal":"f12eaf-claude"} cwd=<repo> ; hub: {"terminal":"aa7724-claude"} cwd=<hub> ; project: {"terminal":"e31fcd-claude"} cwd=<hub>/projects/p1 ; outside: {"refused":"folder-not-served","names":["<outside>"]} nothing started ; home: {"refused":"folder-not-served","names":["~/"]} nothing started
S51 root no longer served when the run starts (watcher not reloaded): Run now={"refused":"folder-not-served","names":["<repo>"]} new-session=0; after the next read the row shows: {"word":"folder-not-served","names":["<repo>"]}
```

### Store and rendered tray (`store.out`)

```
S27 Monday 2026-10-05 12:00, two schedules: Next: Tue 10-06 09:00 (Daily radar)
S27 Daily radar paused: Next: Wed 10-07 07:00 (Weekly radar)
S27 Daily radar holding a problem: Next: Wed 10-07 07:00 (Weekly radar)
S27 two equal next runs: Next: Tue 10-06 09:00 (First)
S27 no schedule for the task: No schedule | scout: Next: Tue 10-06 09:00 (Other)
S28 Every hour: pattern posted="0 * * * *"; check=[]; preview="Next runs: Mon 10-05 13:00, Mon 10-05 14:00, Mon 10-05 15:00"
S28 Every day at 07:00: pattern posted="0 7 * * *"; check=[]; preview="Next runs: Tue 10-06 07:00, Wed 10-07 07:00, Thu 10-08 07:00"
S28 Weekly Mon, Wed, Fri at 08:30: pattern posted="30 8 * * 1,3,5"; check=[]; preview="Next runs: Wed 10-07 08:30, Fri 10-09 08:30, Mon 10-12 08:30"
S28 Weekly with no day: pattern posted=none (refused); check=["Choose at least one day."]; preview="Choose at least one day."
S28 Every day at 7:5: pattern posted=none (refused); check=["The time must be HH:MM, such as 07:00."]; preview="The time must be HH:MM, such as 07:00."
S28 Every day at 25:00: pattern posted=none (refused); check=["The time must be HH:MM, such as 07:00."]; preview="The time must be HH:MM, such as 07:00."
S28 Every day at 07:60: pattern posted=none (refused); check=["The time must be HH:MM, such as 07:00."]; preview="The time must be HH:MM, such as 07:00."
S28 Custom 61 * * * *: pattern posted=none (refused); check=["The pattern 61 * * * * does not read: a cron pattern has five fields, such as 0 7 * * 1, or is a nickname such as @daily."]; preview="The pattern 61 * * * * does not read: a cron pattern has five fields, such as 0 7 * * 1, or is a nickname such as @daily."
S28 Custom 0 0 31 2 *: pattern posted=none (refused); check=["The pattern 0 0 31 2 * never comes due."]; preview="The pattern 0 0 31 2 * never comes due."
S28 Off: pattern posted=""; check=[]; preview=""
S29 0 7 * * 1: opens week, time 07:00, days Mon, pattern "0 7 * * 1"; whenOf direct={"when":"week","time":"07:00","days":[true,false,false,false,false,false,false],"pattern":"0 7 * * 1"}
S29 0 * * * *: opens hour, time 07:00, days -, pattern "0 * * * *"; whenOf direct={"when":"hour","time":"07:00","days":[false,false,false,false,false,false,false],"pattern":"0 * * * *"}
S29 @daily: opens custom, time 07:00, days -, pattern "@daily"; whenOf direct={"when":"custom","time":"07:00","days":[false,false,false,false,false,false,false],"pattern":"@daily"}
S29 0 7 * * MON: opens custom, time 07:00, days -, pattern "0 7 * * MON"; whenOf direct={"when":"custom","time":"07:00","days":[false,false,false,false,false,false,false],"pattern":"0 7 * * MON"}
S29 00 7 * * *: opens custom, time 07:00, days -, pattern "00 7 * * *"; whenOf direct={"when":"custom","time":"07:00","days":[false,false,false,false,false,false,false],"pattern":"00 7 * * *"}
S29 0 7 * * 1-5: opens custom, time 07:00, days -, pattern "0 7 * * 1-5"; whenOf direct={"when":"custom","time":"07:00","days":[false,false,false,false,false,false,false],"pattern":"0 7 * * 1-5"}
S31 Schedule... on Lit Watch opens: kind=task task=litwatch name="Lit Watch" unattended=false; check while a schedule holds that name=["Two schedules are named Lit Watch; neither runs until one is renamed."]
S31 after the name changes: check=[]
S32 Schedule... on a saved command opens: kind=command commandKey=["/r/repo","sync"] name="sync" commands()=[{"id":"[\"/r/repo\",\"sync\"]","label":"sync (repo)"}] check=[]
S32 Save: {"ok":true,"terminal":null,"skipped":""} dialog after=closed posted={"url":"/api/schedules","body":{"action":"save","at":null,"was":null,"entry":{"name":"sync","runs":{"command":"sync","folder":"/r/repo"},"when":"","paused":false,"unattended":false}}}
S10 server refusal said in words: {"ok":false,"error":"Two schedules are named Weekly radar; neither runs until one is renamed."}; dialog stays open=true
S10 rename of B onto a held name: check=["Two schedules are named weekly RADAR; neither runs until one is renamed."]
C27 tray before any schedule message:
C27     | Update tasks
C27     | Close
C27     | Schedules Add schedule
C27     | Tasks Lit Watch
C27     | new-paper radar (web | minutes) Unavailable No schedule Schedule...
C27     | Scout
C27     | academic openings (web | minutes) Unavailable No schedule Schedule...
C27     | LinkedIn
C27     | draft a post from _linkedin/ Unavailable No schedule Schedule...
C27     | Inbox
C27     | Gmail triage over the private mailbox Unavailable No schedule Schedule...
C27     | Gmail triage over the private mailbox
C27     | Chat
C27     | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
S16 tray with four rows (running-task row with a run, paused, problem, Off):
S16     | Update tasks
S16     | Close
S16     | Schedules Add schedule
S16     | Weekly radar Lit Watch 0 7 * * 3
S16     | Next: Wed 10-07 07:00 07:00 scheduled started
S16     | Edit
S16     | Pause
S16     | Run now
S16     | Delete
S16     | Daily radar Lit Watch 0 9 * * * Paused
S16     | Edit
S16     | Resume
S16     | Run now
S16     | Delete
S16     | Broken Scout nonsense
S16     | The pattern nonsense does not read: a cron pattern has five fields, such as 0 7 * * 1, or is a nickname such as @daily.
S16     | Edit
S16     | Pause
S16     | Run now
S16     | Delete
S16     | Hand only Inbox Off: it runs only from Run now
S16     | Edit
S16     | Pause
S16     | Run now
S16     | Delete
S16     | Tasks Lit Watch
S16     | new-paper radar (web | minutes) Unavailable Next: Wed 10-07 07:00 (Weekly radar) Schedule...
S16     | Scout
S16     | academic openings (web | minutes) Unavailable No schedule Schedule...
S16     | LinkedIn
S16     | draft a post from _linkedin/ Unavailable No schedule Schedule...
S16     | Inbox
S16     | Gmail triage over the private mailbox Unavailable No schedule Schedule...
S16     | Gmail triage over the private mailbox
S16     | Chat
S16     | Ask about the portfolio, e.g. "what's blocked?", "summarise a project". Runs on your Claude Code / Max plan; I remember this conversation.
S1 tray with a schedules file that reads and holds no entry:
S1     | Update tasks
S1     | Close
S1     | Schedules Add schedule
S1     | No schedules yet.
S1     | Tasks Lit Watch
S3 tray with all three files unread:
S3     | Update tasks
S3     | Close
S3     | Schedules Add schedule
S3     | ~/.oculus/schedules.yml does not read at line 2, so no schedule runs and oculus writes nothing to it.
S3     | The run record ~/.oculus/schedule.json does not read, so no schedule runs; the file is left as it is.
S3     | The saved commands file ~/.oculus/commands.json does not read, so no command schedule runs.
S3     | Tasks Lit Watch
S3     | new-paper radar (web | minutes) Unavailable No schedule Schedule...
S30 Add schedule on a task, defaults: checkboxes ["<input type=\"checkbox\">"]
S30 Runs Saved command: checkboxes []
S30 Runs Prompt: checkboxes ["<input type=\"checkbox\">"]
S30 unattended on, the note: ["Run unattended A run starts with --dangerously-skip-permissions: the agent edits files and runs commands with nobody asked."]
S30 unattended off, lines mentioning it: ["Run unattended Cancel"]
S31 dialog from Schedule... on Lit Watch, text: ["Update tasks","Schedules Add schedule","Tasks Lit Watch","Ask about the portfolio, e.g. \"what's blocked?\", \"summarise a project\". Runs on your Claude Code / Max plan; I remember this conversation.","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom"]
S31 dialog controls: ["<input type=\"text\" value=\"Lit Watch\" aria-label=\"Name\">","<select aria-label=\"Runs\">","<option value=\"task\" selected=\"\">","<select aria-label=\"Task\">","<option value=\"litwatch\" selected=\"\">","<select aria-label=\"When\">","<option value=\"off\" selected=\"\">","<input type=\"checkbox\">"]
S32 dialog from the command bar: controls ["<input type=\"text\" value=\"sync\" aria-label=\"Name\">","<select aria-label=\"Runs\">","<option value=\"command\" selected=\"\">","<select aria-label=\"Command\">","<option value=\"[&quot;/r/repo&quot;,&quot;sync&quot;]\" selected=\"\">","<select aria-label=\"When\">","<option value=\"off\" selected=\"\">"]; the tray text is drawn with it: true
S28 dialog When/kind Every hour: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom","Next runs: Mon 10-05 13:00, Mon 10-05 14:00, Mon 10-05 15:00","Run unattended Cancel","Save"]; checkboxes drawn=1; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">"]
S28 dialog When/kind Every day: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom","Time","Next runs: Tue 10-06 07:00, Wed 10-07 07:00, Thu 10-08 07:00","Run unattended Cancel","Save"]; checkboxes drawn=1; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">","<input type=\"text\" value=\"07:00\" aria-label=\"Time\">"]
S28 dialog When/kind Weekly Mon Wed Fri: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom","Time","Days Mon Tue Wed Thu Fri Sat Sun","Next runs: Wed 10-07 08:30, Fri 10-09 08:30, Mon 10-12 08:30","Run unattended Cancel","Save"]; checkboxes drawn=8; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">","<input type=\"text\" value=\"08:30\" aria-label=\"Time\">"]
S28 dialog When/kind Weekly no day: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom","Time","Days Mon Tue Wed Thu Fri Sat Sun","Choose at least one day.","Run unattended Cancel","Save"]; checkboxes drawn=8; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">","<input type=\"text\" value=\"07:00\" aria-label=\"Time\">"]
S28 dialog When/kind Custom 61 * * * *: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom","Cron pattern","The pattern 61 * * * * does not read: a cron pattern has five fields, such as 0 7 * * 1, or is a nickname such as @daily.","Run unattended Cancel","Save"]; checkboxes drawn=1; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">","<input type=\"text\" value=\"61 * * * *\" aria-label=\"Cron pattern\">"]
S28 dialog When/kind Custom 0 0 31 2 *: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Task Lit WatchScoutLinkedInInbox","When OffEvery hourEvery dayWeeklyCustom","Cron pattern","The pattern 0 0 31 2 * never comes due.","Run unattended Cancel","Save"]; checkboxes drawn=1; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">","<input type=\"text\" value=\"0 0 31 2 *\" aria-label=\"Cron pattern\">"]
S28 dialog When/kind Prompt: lines ["Tasks Lit Watch","Add schedule Name","Runs Update taskSaved commandPrompt","Prompt Summarise","Folder","When OffEvery hourEvery dayWeeklyCustom","Run unattended Cancel","Save"]; checkboxes drawn=1; text inputs/areas ["<input type=\"text\" value=\"x\" aria-label=\"Name\">","<textarea aria-label=\"Prompt\">"]
```

### Scratch tmux server (`tmux.out`)

```
C1 pane_pid=59462 printed $$=59462 ppid(printed)=59461; pane pid equals the printed pid: true; pane pid is the parent of the printed pid: false
C20 tray press with a schedule record that does not read (the press takes no record): started e28538-claude; record file untouched: true
C36 start: terminal e28538-claude pane pid 59693; pane shows: STUB ARGS: [/research-cockpit litwatch] | STUB PID=59693 | STUB STATUS=busy
C36 scan while the stub reports busy: [{"pid":59693,"liveStatus":"busy"}]; listed terminal pid [{"id":"e28538-claude","pid":59693}]; scan pid equals the pane pid: true
C36 one-run rule, earlier run busy: newest run {"trigger":"catch-up","outcome":"skipped","terminal":"e28538-claude"}; earlier terminal still listed: true; terminals now ["e28538-claude"]
C36 scan after the stub went idle: [{"pid":59693,"liveStatus":"idle"}]
C36 one-run rule, earlier run idle: newest run {"trigger":"catch-up","outcome":"started","terminal":"a68b09-claude"}; earlier terminal still listed: false; terminals now ["a68b09-claude"]
C35 rename of an editor's copy over schedules.yml while the watcher runs (real timers, no restart): next before=2026-10-05T23:47:00.000Z after=2026-10-06T01:30:00.000Z; moved after 35 ms; row pattern now "30 3 * * *"
scratch tmux server killed
```

### Config and local.yml (`misc.out`)

```
S34 behavior.yml scratch copy with skip_permissions under [chat]: findings [{"key":"chat.skip_permissions","message":"chat.skip_permissions is not read; a schedule in the update tray runs unattended through its Run unattended choice"}]
S34 behavior.yml scratch copy with skip_permissions under [tasks]: findings [{"key":"tasks.skip_permissions","message":"tasks.skip_permissions is not read; a schedule in the update tray runs unattended through its Run unattended choice"}]
S34 behavior.yml scratch copy with skip_permissions under [chat, tasks]: findings [{"key":"chat.skip_permissions","message":"chat.skip_permissions is not read; a schedule in the update tray runs unattended through its Run unattended choice"},{"key":"tasks.skip_permissions","message":"tasks.skip_permissions is not read; a schedule in the update tray runs unattended through its Run unattended choice"}]
S34 behavior.yml scratch copy with skip_permissions under []: findings []
S52 absent keys, scratch HOME: schedules path <HOME>/.oculus/schedules.yml; record path <HOME>/.oculus/schedule.json
S52 scratch local.yml text: config.schedules="<SP>/final-run/x/schedules.yml" config.scheduleRecord="<SP>/final-run/x/schedule.json" problems=[]
S52 rebuiltBy(['schedules']).schedules=true; rebuiltBy(['scheduleRecord']).schedules=true; rebuiltBy(['hub']).schedules=false
S52 checkLocal('schedules: 3')="local.yml: schedules must be a path"; the read of that text: config.schedules=undefined problems=[{"key":"schedules","kind":"value","words":"a path","sentence":"schedules must be a path"}]
S52 'schedule_record: [a]': checkLocal="local.yml: schedule_record must be a path" config.scheduleRecord=undefined
```

### Readings

- S23: `planEdit` in `src/lib/server/machine/schedules/file.ts` parses the new text again and compares it with `expected(list, edit, entry)` by `isDeepStrictEqual` (:418); on a mismatch it returns `refused(409, 'entry-changed')` (:419) and the route never reaches `commitText`. No probe makes the serializer misbehave.
- S47: `planEdit` answers `{ ok: true, text: null, ... }` (:412) when the entry already has the asked flag; `write()` in `routes.ts` returns `null` for `planned.text === null` (:162) before any record call, and `handleSchedules` answers `OK()` without `reload()` or `logChanges` (:210). The probe line S47 shows the file unchanged and no added change-log line.


### C26

Every new test injects `run` (the recording tmux `tmux()` of `tests/routes/sessions/terminal-fixture.ts`), `claudeBin` (`CLAUDE = '/stub/claude'`, a path that is never run) and the three files' paths (the scratch folder's `schedules.yml`, `schedule.json` and `commands.json`), and none reads `local.yml` or calls `homedir()`:

- `tests/server/machine/schedules/schedules-fixture.ts`: `CLAUDE = '/stub/claude'` (:23); `watcherOver` (:90) hands `watchSchedules` `files: w.files` (:98), `claudeBin: CLAUDE` (:105), an `approvalsFor` beside the scratch commands file (:108) and `stop: (terminal) => stopTerminal(terminal, { run: driver.run })` (:110).
- `watch.test.ts` builds each watcher through `watcherOver(w, hub, driver, table)` (:122), with `driver: tmux()` (:118).
- `run.test.ts:137` `const driver = tmux()`; `:139-146` `runEntry(..., { run: driver.run, hub: w.hub, claudeBin: CLAUDE, rootsFor: () => roots, commands: w.files.commands, approvalsFor: () => join(scratchDir('oculus-approvals-'), 'approvals.json') })`.
- `record.test.ts:30` and `file.test.ts:35` run over `scratchDir` files; neither starts a process.
- `tests/routes/machine/schedules.test.ts` hands `handleSchedules` scratch `files`, a `vi.fn()` watcher and `rootsFor`; it starts nothing.

The greps of verify item 7:


```
tests/server/machine/schedules/run.test.ts:46:            words: [`'${CLAUDE}' '/research-cockpit litwatch'`],
tests/server/machine/schedules/run.test.ts:55:            words: [`'${CLAUDE}' '--dangerously-skip-permissions' '/research-cockpit litwatch'`],
tests/data/sources/feeds.test.ts:43:    - "2026-09-02 (local /research-cockpit scout): an older pass"
tests/data/sources/feeds.test.ts:44:    - "2026-09-09 (local /research-cockpit scout): the newest pass"
tests/data/sources/feeds.test.ts:45:    - "2026-09-10 (local /research-cockpit litwatch): a different task, not a run of this feed"
tests/routes/sessions/terminal-actions.test.ts:79:                `'/opt/Claude CLI/claude' '/research-cockpit ${kind}'`
```

```
grep -nE "spawn|execFile|tmux|claude|local\.yml|homedir\(\)|~/\.oculus" tests/server/machine/schedules/*.ts tests/routes/machine/schedules.test.ts
tests/server/machine/schedules/file.test.ts:2:// case runs over a scratch folder, so nothing reaches ~/.oculus. What this does not cover: the
tests/server/machine/schedules/record.test.ts:2:// written over. Every case runs over a scratch folder, so nothing reaches ~/.oculus. What this does
tests/server/machine/schedules/record.test.ts:38:                await settleRun(file, 'Weekly radar', RUN, { terminal: 'aabbcc-claude' }),
tests/server/machine/schedules/run.test.ts:2:// recording tmux double, a stub path as the Claude program, scratch folders and a scratch
tests/server/machine/schedules/run.test.ts:4:// words a start that cannot happen is refused with. No case reaches tmux or `claude`, reads
tests/server/machine/schedules/run.test.ts:5:// `local.yml` or the home folder; the paths are the ones the scratch world holds. What this does
tests/server/machine/schedules/run.test.ts:6:// not cover: the session a real `claude` starts, and a chain the reader approved.
tests/server/machine/schedules/run.test.ts:14:import { lineOf, tmux } from '../../../routes/sessions/terminal-fixture.ts';
tests/server/machine/schedules/run.test.ts:34:    /** The answer and, for a start, what tmux was told. */
tests/server/machine/schedules/run.test.ts:137:            const driver = tmux();
tests/server/machine/schedules/run.test.ts:142:                claudeBin: CLAUDE,
tests/server/machine/schedules/schedules-fixture.ts:4:// watcher built over the real start with a recording tmux. Nothing here reads `local.yml`, the
tests/server/machine/schedules/schedules-fixture.ts:5:// machine's home folder or a real `claude`; the only paths are the ones the folder holds.
tests/server/machine/schedules/schedules-fixture.ts:19:import { type tmux } from '../../../routes/sessions/terminal-fixture.ts';
tests/server/machine/schedules/schedules-fixture.ts:22:/** The stand-in `claude` every run is started with: a path, never run. */
tests/server/machine/schedules/schedules-fixture.ts:23:export const CLAUDE = '/stub/claude';
tests/server/machine/schedules/schedules-fixture.ts:89:/** A watcher over the world's files and the real start, with the recording tmux handed in. */
tests/server/machine/schedules/schedules-fixture.ts:93:    driver: ReturnType<typeof tmux>,
tests/server/machine/schedules/schedules-fixture.ts:105:                claudeBin: CLAUDE,
tests/server/machine/schedules/watch.test.ts:1:// Layer 4, server test. The schedules over the real start (schedules/run.ts), a recording tmux
tests/server/machine/schedules/watch.test.ts:3:// case reaches tmux or `claude`: every watcher is handed the recording tmux as its runner, a stub
tests/server/machine/schedules/watch.test.ts:5:// `local.yml` or the home folder. Every clock is set a week before the real day or earlier, so a
tests/server/machine/schedules/watch.test.ts:8:// repeated hour, the page's reading of the payload, and the tmux of a real machine.
tests/server/machine/schedules/watch.test.ts:15:import { tmux } from '../../../routes/sessions/terminal-fixture.ts';
tests/server/machine/schedules/watch.test.ts:28:    task: 'aabbcc-claude',
tests/server/machine/schedules/watch.test.ts:93:function started(driver: ReturnType<typeof tmux>): string[][] {
tests/server/machine/schedules/watch.test.ts:115:function daily(kind: Kind): { w: World; hub: Hub; driver: ReturnType<typeof tmux> } {
tests/server/machine/schedules/watch.test.ts:118:    return { w, hub: new Hub(), driver: tmux() };
tests/server/machine/schedules/watch.test.ts:121:function watch(w: World, hub: Hub, driver: ReturnType<typeof tmux>, table?: () => Promise<[]>) {
tests/server/machine/schedules/watch.test.ts:135:    /** What the run record and tmux hold after the due time. */
```

Judgment of the hits: the `research-cockpit` hits are argv assertions whose runner is the recording tmux (`run.test.ts:46,55`, `terminal-actions.test.ts:79`) and the feed fixture text of `feeds.test.ts`. The `tmux` hits are the imports, the declarations and the comments of the recording double. The `claude` hits are the stub path `/stub/claude`, the terminal id `aabbcc-claude` and comments. The `local.yml` and `~/.oculus` hits are comments stating that the tests read none of them, and there is no `homedir()` hit. No hit runs a real tool.


## DONE / NOT DONE

| Item | Status | Check |
| --- | --- | --- |
| 0 The worktree and the patch's files | DONE | The `diff -rq` list below; `ls src/lib/server/machine/tasks tests/server/machine/tasks` fails |
| 1 The file `schedules.yml` | DONE | `entries.out` S1 to S22, S24, S25, S35 to S51; `file.test.ts` |
| 2 One rule for an entry and for a pattern | DONE | `entries.out` S5 to S14, S36 to S40, S48; `engine.out` C4 to C6 |
| 3 The run record | DONE | `engine.out` C7 to C10, C20 to C22, C28, C34; `record.test.ts` |
| 4 The watcher | DONE | `engine.out` C2 to C31; `tmux.out` C35; `watch.test.ts` |
| 5 Starting what a schedule runs | DONE | `engine.out` C16; `run.test.ts`; `tmux.out` C36 |
| 6 The types | DONE | `npx svelte-check` 0 errors (in the verify list) |
| 7 The route and the context | DONE | `entries.out` S24, S25, S43 to S47; `schedules.test.ts`; `tmux.out` C35 |
| 8 The words | DONE | the keys test of `tests/checks` passes; `store.out` and the rendered tray show the sentences |
| 9 `tasks.skip_permissions` leaves | DONE | `misc.out` S34; `config.test.ts` |
| 10 The client store | DONE | `store.out` S10, S27 to S32 |
| 11 The tray and the dialog | DONE except the DOM behaviours of the look | `store.out` rendered tray and dialog |
| 12 The boundary table | DONE | `tests/checks/tree/boundaries.test.ts` passes |
| 13 The text | DONE | HELP.md and DESIGN.md hunks below; ASCII gate empty |
| 14 E4's closed channel | not this step's | |
| Verify item 8, the five new tests on the handed tree | NOT DONE | see the first line |
| The look's DOM cases | NOT DONE here | see "The look" |

### Verify lines

Verify item 1, the last full run (`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, from `tools/oculus`, right after `npm run diagrams` which exited 0). The number of runs is 5. The last run, whole:


```
$ npm run test:quick

> oculus@0.0.1 test:quick
> node tests/tiers/quick.mjs

test:quick: 73 changed file(s), from git since HEAD
test:quick: 83 test file(s), 10 essential
        tests/data/sources/config/local.test.ts: changed
        tests/routes/machine/schedules.test.ts: changed
        tests/server/machine/schedules/file.test.ts: changed
        tests/server/machine/schedules/record.test.ts: changed
        tests/server/machine/schedules/run.test.ts: changed
        tests/server/machine/schedules/watch.test.ts: changed
        tests/data/snapshot/normalise.test.ts: imports at depth 1
        tests/data/snapshot/resources.test.ts: imports at depth 1
        tests/data/sources/docs.test.ts: imports at depth 1
        tests/data/sources/feeds.test.ts: imports at depth 1
        tests/data/sources/manifests.test.ts: imports at depth 1
        tests/data/sources/personal.test.ts: imports at depth 1
        tests/routes/git/deposit.test.ts: imports at depth 1
        tests/routes/machine/hpc.test.ts: imports at depth 1
        tests/routes/sessions/compose.test.ts: imports at depth 1
        tests/routes/sessions/terminal-actions.test.ts: imports at depth 1
        tests/routes/sessions/terminal-edit.test.ts: imports at depth 1
        tests/routes/sessions/terminal.test.ts: imports at depth 1
        tests/server/accounts/connect/oauth.test.ts: imports at depth 1
        tests/server/accounts/mail/routes.test.ts: imports at depth 1
        tests/server/edit/feeds.test.ts: imports at depth 1
        tests/server/machine/commands/placeholders.test.ts: imports at depth 1
        tests/server/machine/commands/run.test.ts: imports at depth 1
        tests/server/machine/hpc/submit.test.ts: imports at depth 1
        tests/server/machine/pty/channel.test.ts: imports at depth 1
        tests/server/machine/usage/refresh.test.ts: imports at depth 1
        tests/server/root/hooks-server.test.ts: imports at depth 1
        tests/state/client/terminal/terminal-close.test.ts: imports at depth 1
        tests/state/feeds/literature-merge.test.ts: imports at depth 1
        tests/state/forms/form-drafts.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 1
        tests/data/helpers/files/nesting.test.ts: imports at depth 2
        tests/data/snapshot/cluster-folder.test.ts: imports at depth 2
        tests/data/sources/agents-catalog.test.ts: imports at depth 2
        tests/data/sources/career.test.ts: imports at depth 2
        tests/data/sources/collections.test.ts: imports at depth 2
        tests/data/sources/config/catalog/options.test.ts: imports at depth 2
        tests/data/sources/config/languages.test.ts: imports at depth 2
        tests/data/sources/config/rail.test.ts: imports at depth 2
        tests/data/sources/config/settings.test.ts: imports at depth 2
        tests/data/sources/present.test.ts: imports at depth 2
        tests/data/sources/registries.test.ts: imports at depth 2
        tests/routes/docs/literature.test.ts: imports at depth 2
        tests/routes/docs/memories.test.ts: imports at depth 2
        tests/routes/edit/audit-mute.test.ts: imports at depth 2
        tests/routes/edit/rail.test.ts: imports at depth 2
        tests/routes/edit/roots.test.ts: imports at depth 2
        tests/routes/edit/undo/undo.test.ts: imports at depth 2
        tests/routes/files/file-undo.test.ts: imports at depth 2
        tests/routes/files/file.test.ts: imports at depth 2
        tests/routes/files/fs.test.ts: imports at depth 2
        tests/routes/files/history.test.ts: imports at depth 2
        tests/routes/files/project-files.test.ts: imports at depth 2
        tests/routes/files/search.test.ts: imports at depth 2
        tests/routes/files/source.test.ts: imports at depth 2
        tests/routes/machine/commands.test.ts: imports at depth 2
        tests/routes/replace/ops-replace.test.ts: imports at depth 2
        tests/routes/sessions/latex.test.ts: imports at depth 2
        tests/server/accounts/connect/accounts.test.ts: imports at depth 2
        tests/server/core/changes.test.ts: imports at depth 2
        tests/server/core/git-failure.test.ts: imports at depth 2
        tests/server/edit/config-key.test.ts: imports at depth 2
        tests/server/edit/writes-collection.test.ts: imports at depth 2
        tests/server/files/search.test.ts: imports at depth 2
        tests/server/machine/approvals/approvals.test.ts: imports at depth 2
        tests/server/machine/pty/sessions.test.ts: imports at depth 2
        tests/server/sessions/transcripts.test.ts: imports at depth 2
        tests/state/sessions/source.test.ts: imports at depth 2
        tests/state/sources/repositories/diff/comment-draft.client.test.ts: imports at depth 2
        tests/state/workbench/layout/saved/layout-unread.test.ts: imports at depth 2
        tests/state/workbench/navigation/pages.test.ts: imports at depth 2
        tests/views/shared/explorer/opening.client.test.ts: imports at depth 2
        tests/views/sources/bar-actions.test.ts: imports at depth 2
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/config/config.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/tree/boundaries.test.ts: changed, run by npm run test:checks or test:slow
ok      ASCII gate (0.3 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.9 s)
ok      vitest (24.9 s): Duration  21.28s (transform 57.71s, setup 0ms, import 70.21s, tests 10.79s, environment 330ms)
ok      svelte-check (24.9 s): 1791243863063 COMPLETED 376 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (27.5 s)
test:quick: 27.9 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```

Verify item 2 (`npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/checks/config/config.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/checks/tree/boundaries.test.ts tests/data/sources/config/local.test.ts`, exit 0):


```
 Test Files  10 passed (10)
      Tests  87 passed (87)
   Start at  01:45:28
   Duration  5.11s (transform 2.78s, setup 0ms, import 12.04s, tests 4.41s, environment 2ms)

verify2 exit 0
```

`tests/checks`, which the quick list does not cover (`npx vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0 --reporter=dot`, exit 0, last run after the last change):


```
      Tests  227 passed | 3 skipped (230)
   Start at  01:44:35
   Duration  50.28s (transform 14.08s, setup 0ms, import 46.40s, tests 84.68s, environment 3ms)

exit 0
```

Verify item 3, the ASCII gate of `spec.md:97` as written (`find ... bin` names a folder that does not exist in this tree, so find prints its error to /dev/null), and the `grep` form over the two documents and this report:


```
perl exit 0
grep exit 1 (1 is no match)
```

The same `grep` over this report is run after it is written; its result is the last line of this report.

Verify item 4, `sh utils/unused-exports.sh` from `tools/oculus` (the base copy printed to `unused-base.txt`, the final tree to `unused-now.txt`):


```
base:  378 lines
final: 378 lines
diff exit 0
```

Verify item 5, `wc -l` of every file written (docs/diagrams excluded; `config/catalogs/options.yml` is YAML, the 880 rule is for source files) and the folders a file was added to:

```
     197 config/behavior.yml
    1280 config/catalogs/options.yml
     163 config/text/app.yml
     180 config/text/findings.yml
     199 config/text/views/system/workbench.yml
     439 DESIGN.md
     352 HELP.md
    7475 package-lock.json
      98 package.json
      36 README.md
      31 src/lib/data/helpers/run/cron.ts
     209 src/lib/data/helpers/run/schedules.ts
      14 src/lib/data/helpers/run/tasks.ts
     558 src/lib/data/model/index.ts
     141 src/lib/data/model/model-processes.ts
     298 src/lib/data/sources/config/catalogs.ts
     549 src/lib/data/sources/config/local.ts
      28 src/lib/server/machine/commands/list.ts
     212 src/lib/server/machine/commands/run.ts
     170 src/lib/server/machine/commands/saved.ts
     277 src/lib/server/machine/pty/compose.ts
     656 src/lib/server/machine/pty/routes.ts
     447 src/lib/server/machine/schedules/file.ts
     329 src/lib/server/machine/schedules/record.ts
     223 src/lib/server/machine/schedules/routes.ts
      86 src/lib/server/machine/schedules/run.ts
      71 src/lib/server/machine/schedules/task.ts
     709 src/lib/server/machine/schedules/watch.ts
     204 src/lib/server/machine/seeds/task-seed.ts
      94 src/lib/server/machine/seeds/task-start.ts
     813 src/lib/server/root/context.ts
     155 src/lib/server/root/watch/local.ts
     245 src/lib/shell/rail/ScheduleDialog.svelte
     221 src/lib/shell/rail/ScheduleList.svelte
     262 src/lib/shell/rail/UpdateTray.svelte
     509 src/lib/state/client/context.ts
     110 src/lib/state/client/entities.svelte.ts
     134 src/lib/state/client/payloads.ts
     830 src/lib/state/sessions/terminals.svelte.ts
     325 src/lib/state/shared/stores/shapes.ts
     136 src/lib/state/shared/words/format.ts
      80 src/lib/state/system/machine/schedule-when.ts
      80 src/lib/state/system/machine/schedule-words.ts
     553 src/lib/state/system/machine/schedule.svelte.ts
     141 src/lib/ui/controls/Confirm.svelte
     177 src/lib/views/shared/sessions/CommandBar.svelte
     139 src/lib/views/shared/sessions/commands.ts
     222 src/routes/+page.svelte
      33 src/routes/api/(machine)/schedules/+server.ts
      42 src/routes/api/(sessions)/terminal/+server.ts
     552 tests/checks/config/config-folder.test.ts
     591 tests/checks/config/config.test.ts
     663 tests/checks/tree/boundaries.test.ts
     176 tests/data/sources/config/local.test.ts
      63 tests/routes/machine/schedules.test.ts
      57 tests/server/machine/schedules/file.test.ts
      48 tests/server/machine/schedules/record.test.ts
     164 tests/server/machine/schedules/run.test.ts
     114 tests/server/machine/schedules/schedules-fixture.ts
     346 tests/server/machine/schedules/watch.test.ts
     131 tests/server/root/context-fixture.ts
```

```
       6 src/lib/server/machine/schedules
       5 tests/server/machine/schedules
       4 src/lib/data/helpers/run
      10 src/lib/state/system/machine
       8 src/lib/shell/rail
       3 tests/routes/machine
       1 src/routes/api/(machine)/schedules
       4 src/routes/api/(machine)
       7 tests/server/machine
       9 src/lib/server/machine
ls: src/lib/server/machine/tasks: No such file or directory
ls: tests/server/machine/tasks: No such file or directory
ls exit 1
```

The largest source files written are `config/catalogs/options.yml` at 1280 lines (YAML, the 880 rule is for source files), `src/lib/state/sessions/terminals.svelte.ts` at 830, `src/lib/server/root/context.ts` at 813 and `src/lib/server/machine/schedules/watch.ts` at 709; the largest component is `UpdateTray.svelte` at 262 lines (limit 520). The folder counts above are the `ls | wc -l` of each folder.

Verify item 6, the grep of `spec.md:66` (`grep -rnw --exclude=local.yml -e <name> src tests config HELP.md DESIGN.md README.md`), hits per name, from `wc -l` of each saved grep:


```
TaskKind 0
taskSkipPermissions 0
taskSkipsPermissions 0
skip_confirm 0
taskSchedules 0
cron_never 0
form_cron 0
machine/tasks 0
isTask 3
startTask 7
taskCommand 3
TASKS 18
UPDATE_TASKS 18
startUpdateTask 7
skip_permissions 8
scheduleRecord 6
heldAt 6
schedule.json 10
schedules.yml 19
```

The names that retired (`TaskKind`, `taskSkipPermissions`, `taskSkipsPermissions`, `skip_confirm`, `taskSchedules`, `cron_never`, `form_cron`, `machine/tasks`) have no hit. The names that remain, each judged from its lines:

- `isTask` (3 hits): the terminal grid's own callback `isTask: () => boolean` in `grid-links.ts` and `TerminalGrid.svelte`, unrelated to the update tasks.
- `startTask` (7): the tray's call of the terminals store, the store's own method, and the server's local `startTask` in `pty/routes.ts` that the terminal action calls.
- `taskCommand` (3): the function in `schedules/task.ts` and the DESIGN.md sentence naming it.
- `TASKS` (18): constants named `TASKS` in the boards' code and in tests for the `tasks.yml` collection, unrelated to the update tasks.
- `skip_permissions` (8): the `behaviorFindings` comment and code in `catalogs.ts`, the two `config.test.ts` rows, and the DESIGN.md and HELP.md sentences that say the keys are not read.
- `scheduleRecord` (6): `local.ts`, `watch/local.ts`, `context.ts:407` and the schedules route.
- `heldAt` (6): two unrelated functions, in `draft.ts` and `settings.ts`.

The raw lines of the names that remain are in the scratchpad `g-*.txt` files beside the probes.


Verify item 9, the new and changed sentences of `HELP.md` and `DESIGN.md`. No rule on list items or sentence length is written in `spec.md`, in the brief or in a check; the hub `CLAUDE.md` asks for "short plain sentences" in Ward voice. Sentence lengths, by a rough splitter at `. ` before a capital (`python3`, words per sentence), of the base document and of the lines the step changed:


```
HELP.md base: sentences 887 p90 59 max 283 | changed lines: 5 sentences 51 p90 47 max 138
DESIGN.md base: sentences 1500 p90 72 max 504 | changed lines: 7 sentences 74 p90 67 max 157
```

Sentences of more than 55 words that the step wrote or changed (not present in the base document), with their length and the start of each:


```
HELP.md:269 87 words: | `behavior.yml` | Thresholds, horizons and cadences: read limits, the `refresh_stale_days
HELP.md:284 138 words: `literature`, a map of the Literature search's keys, `wos_key` (Web of Science), `scopus_k
DESIGN.md:138 67 words: It is a list of maps with a `name`, a `runs` that holds exactly one of `task`, `command` (
DESIGN.md:138 66 words: The run record (`~/.oculus/schedule.json`, the `schedule_record` key, mode 0600, written b
DESIGN.md:138 64 words: The earlier run is the terminal of the newest run in the record that has one; it is workin
DESIGN.md:156 85 words: A placeholder's value (`${file}`, `${selectedText}` and the others) is never written into 
DESIGN.md:415 58 words: `taskCommand` in `server/machine/schedules/task.ts` builds `<claude> '/research-cockpit <k
DESIGN.md:415 61 words: The only way a run starts with `--dangerously-skip-permissions` is a schedule's Run unatte
```

Reading of that list: `HELP.md:269` and `HELP.md:284` are table rows of settings, each with one clause changed (the first loses its clause about the update tasks' `tasks.skip_permissions`, the second gains the keys `schedules` and `schedule_record`). `DESIGN.md:138` is the new Schedules paragraph (its sentences are the three of 64 to 67 words, under the base's 90th percentile above). `DESIGN.md:156` is the **Processes.** paragraph; a word diff of that line against the base shows two changes: the base's first sentence now ends at "naming the process." followed by the sentence on the exception, and the added sentence on a schedule's entry. The long sentences listed for it are the base's own. `DESIGN.md:415` is the update-task bullet. No sentence the step wrote on `HELP.md:25` exceeds 55 words. No list item rule exists to read against.


Verify item 10, the history-words grep over the lines the step added or changed in each written file, against the base copy (`diff` lines starting `>`, then the lines holding a comment marker, `it(`, `describe(` or `it.each`, and one of `before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`):


34 hits, quoted:

```
DESIGN.md: **Schedules.** A schedule is an entry of `~/.oculus/schedules.yml` (the `schedules` key of `local.yml` names another file). It is a list of maps with a `name`, a `runs` that holds exactly o
DESIGN.md: **Processes.** A process oculus starts from text the reader did not write into oculus's own configuration (a command in a repository's `.oculus/commands.yml`, a debug launch, an agent seede
src/lib/data/helpers/run/cron.ts: // refuse a pattern, and the server's watcher reads it before it arms a timer, so the three answer
src/lib/data/helpers/run/schedules.ts: // the update tray's dialog, which checks an entry before it sends it, and by the server, which
src/lib/data/model/model-processes.ts:      * The id of the terminal the run started; for a skipped run, of the earlier run that was still
src/lib/data/model/model-processes.ts:      * working; null for a run still being started and for a failed one.
src/lib/server/machine/schedules/file.ts: // flow style becomes a block list by the library's own output. The text is parsed again before
src/lib/server/machine/schedules/record.ts:     /** When that pattern was first read: no due time before it is caught up. */
src/lib/server/machine/schedules/record.ts:  * time from before it. A schedule with no pattern and no entry writes nothing.
src/lib/server/machine/schedules/record.ts:  * time to tell two of them apart; only a run still waiting for its terminal is settled.
src/lib/server/machine/schedules/routes.ts: // write while the run record does not read is refused before the schedules file is touched, and a
src/lib/server/machine/schedules/watch.ts: // the entry starts what it runs (schedules/run.ts), unless its earlier run is still working. The
src/lib/server/machine/schedules/watch.ts: // handled per schedule, and a decision writes it under the record's lock before anything starts, so
src/lib/server/machine/schedules/watch.ts: // next start; the ones before it start nothing. A pattern first read, changed, removed, paused or
src/lib/server/machine/schedules/watch.ts: // resumed never catches up a due time from before it. Croner's timer skips a due time that falls
src/lib/server/machine/schedules/watch.ts: // waiting for the next day, and never before that time.
src/lib/server/machine/schedules/watch.ts:  * How many due times before a moment `dueAt` looks through: the due times of a minute pattern that
src/lib/server/machine/schedules/watch.ts:  * The newest due time of a job at or before `now` found by walking croner's forward runs from a
src/lib/server/machine/schedules/watch.ts:  * moment before `now`, the span widening until a run falls inside it, or undefined when it has
src/lib/server/machine/schedules/watch.ts:  * The last run of a job at or before `end`, from `run`, a run at or before it. No run lies after
src/lib/server/machine/schedules/watch.ts:  * `upper` and at or before `end`; each turn either moves to a run past the middle of what is left
src/lib/server/machine/schedules/watch.ts:  * The newest due time of a job at or before `now`, or undefined when it has none. Croner answers
src/lib/server/machine/schedules/watch.ts:  * "before" in whole seconds, so a `now` inside the second of a due time still sees the one before
src/lib/server/machine/schedules/watch.ts:     /** Read through a call, so a check before an await never stands in for the one after it. */
src/lib/server/machine/schedules/watch.ts:     /** A run as the claim keeps it before the start answers. */
src/lib/server/machine/schedules/watch.ts:      * jump from 02:00 to 03:00) while its pattern still answers 03:30 for that day; a due time
src/lib/state/client/entities.svelte.ts:         /** The latest read of the schedules file, or null before the first one. */
src/lib/state/system/machine/schedule.svelte.ts:     /** The terminal the run started or found going, while the page still lists it. */
src/lib/state/system/machine/schedule.svelte.ts:     /** The entries of the file, in its order; none before the first payload. */
tests/checks/tree/boundaries.test.ts: // before it sends, and the server reads the file and runs the timer by the same rule, so the two
tests/server/machine/schedules/watch.test.ts: // `local.yml` or the home folder. Every clock is set a week before the real day or earlier, so a
tests/server/machine/schedules/watch.test.ts: /** The real day, read before any test installs the fake clock. */
tests/server/machine/schedules/watch.test.ts: /** A local time seven days before the real day, `days` days after it. */
tests/server/machine/schedules/watch.test.ts: /** A row for a due time that falls at 07:00 of the day the watcher starts just before. */
```

Judgment: every hit uses `before` or `still` for an order of events in the behaviour described (a check before an await, a run still working, a due time from before a change, a read before the first payload) or for a position (`just before`); none compares the code with an earlier state of it. The grep for a package id or a date (`\b[ZOQDAET][0-9]{1,3}\b`, `20dd-dd-dd`) over the same added lines hits only the two fixture timestamps in `record.test.ts:` (`due: '2026-10-06T05:00:00.000Z'`, `at: '2026-10-06T05:00:00.412Z'`), which are test data.


### Verify item 8, the preserved and the changed tests on both trees

G35's rows, `tests/routes/sessions/terminal-actions.test.ts` and `tests/server/machine/commands/run.test.ts`, with their assertions unchanged, pass on the handed tree, on main's copy and on the final tree:


```
handed tree:

 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  01:05:52
   Duration  2.43s (transform 1.30s, setup 0ms, import 4.44s, tests 213ms, environment 0ms)

the base copy (`$SP/a3/base`):

 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  01:02:00
   Duration  2.85s (transform 1.70s, setup 0ms, import 5.27s, tests 183ms, environment 0ms)

final tree:

 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  01:02:06
   Duration  4.08s (transform 2.14s, setup 0ms, import 7.02s, tests 734ms, environment 1ms)
```

The four existing test files this step changes, each run with its final text against the handed tree's source (`$SP/a3/handed2`, a copy of the handed tree with those four files replaced). The rows that fail there are the behaviours the step changes:

```
=== handed tree + changed tests/checks/config/config.test.ts
     x names the key that replaced a retired one, against behavior.yml: chat.skip_permissions 5ms
     x names the key that replaced a retired one, against behavior.yml: tasks.skip_permissions 2ms
     x words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files 17ms
------- Failed Tests 3 -------
 FAIL  |unit| tests/checks/config/config.test.ts > behaviorFindings > names the key that replaced a retired one, against behavior.yml: chat.skip_permissions
AssertionError: expected [ { ...(3) } ] to deeply equal [ { ...(3) } ]
 FAIL  |unit| tests/checks/config/config.test.ts > behaviorFindings > names the key that replaced a retired one, against behavior.yml: tasks.skip_permissions
AssertionError: expected [] to deeply equal [ { ...(3) } ]
 FAIL  |unit| tests/checks/config/config.test.ts > settingFindings > words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files
AssertionError: expected [ 'calendar.days_ahead', ...(38) ] to deeply equal [ 'calendar.days_ahead', ...(35) ]
 Test Files  1 failed (1)
      Tests  3 failed | 28 passed (31)
=== handed tree + changed tests/data/sources/config/local.test.ts
     x answers "schedules: 3" with the sentence it would throw 3ms
------- Failed Tests 1 -------
 FAIL  |unit| tests/data/sources/config/local.test.ts > checkLocal > answers "schedules: 3" with the sentence it would throw
AssertionError: expected null to be 'local.yml: schedules must be a path' // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed | 20 passed (21)
=== handed tree + changed tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
=== handed tree + changed tests/checks/config/config-folder.test.ts
     x holds exactly the expected top-level keys, and no more 62ms
     x reads each file on its own and finds its own keys there and nowhere else 4ms
------- Failed Tests 2 -------
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more
AssertionError: expected [ 'agents', 'arch_color', ...(105) ] to deeply equal [ 'agents', 'arch_color', ...(104) ]
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > reads each file on its own and finds its own keys there and nowhere else
AssertionError: expected [ 'audit_ignore', 'calendar', ...(32) ] to deeply equal [ 'audit_ignore', 'calendar', ...(31) ]
 Test Files  1 failed (1)
      Tests  2 failed | 18 passed (20)
```

`boundaries.test.ts` passes on the handed tree with its final text (11 tests) and on the final tree. Its edit adds rows for modules that exist only on the final tree; why the handed tree does not fail on them was not investigated.

The five new test files (`watch.test.ts`, `run.test.ts`, `record.test.ts`, `file.test.ts`, `schedules.test.ts`) run against the handed tree (`$SP/a3/handed2`, the handed tree with the five files copied in):


```
 FAIL  |unit| tests/routes/machine/schedules.test.ts [ tests/routes/machine/schedules.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/schedules/routes.ts' imported from $SP/a3/handed2/tests/routes/machine/schedules.test.ts
 FAIL  |unit| tests/server/machine/schedules/file.test.ts [ tests/server/machine/schedules/file.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/schedules/file.ts' imported from $SP/a3/handed2/tests/server/machine/schedules/file.test.ts
 FAIL  |unit| tests/server/machine/schedules/record.test.ts [ tests/server/machine/schedules/record.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/schedules/record.ts' imported from $SP/a3/handed2/tests/server/machine/schedules/record.test.ts
 FAIL  |unit| tests/server/machine/schedules/run.test.ts [ tests/server/machine/schedules/run.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/schedules/run.ts' imported from $SP/a3/handed2/tests/server/machine/schedules/run.test.ts
 FAIL  |unit| tests/server/machine/schedules/watch.test.ts [ tests/server/machine/schedules/watch.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/schedules/record.ts' imported from $SP/a3/handed2/tests/server/machine/schedules/watch.test.ts
 Test Files  5 failed (5)
      Tests  no tests
```

No run with the module present and the behaviour missing was taken (the first line).


## The look's stub, quoted whole

`$SP/a3/stub/claude` (run under C1 and C36). Use: `STUB_ACCOUNT=<scratch folder>` for its registry and transcript, `STUB_BUSY_SECONDS=<n>` for how long it reports busy, or a file `stub-status` in the account folder holding `busy` or `idle`; the scratch oculus is started with `claude_bin` of its `local.yml` set to this path.

```
#!/bin/bash
# Stand-in for the real claude, for the A3 probes and the look. It prints its arguments and its pid,
# writes the registry entry and the transcript a Claude session writes into its account folder
# (STUB_ACCOUNT, default $HOME/.claude-stub), reports busy for STUB_BUSY_SECONDS (default 8) and
# then idle, and exits when it reads the line `quit`. A file `stub-status` in the account folder
# that holds busy or idle overrides the timer.
ACCOUNT="${STUB_ACCOUNT:-$HOME/.claude-stub}"
BUSY="${STUB_BUSY_SECONDS:-8}"
printf 'STUB ARGS:'
for arg in "$@"; do printf ' [%s]' "$arg"; done
printf '\nSTUB PID=%s\n' "$$"
ID="$(printf '%08x-0000-4000-8000-%012x' "$$" "$(date +%s)")"
SLUG="$(printf '%s' "$PWD" | tr '/' '-')"
mkdir -p "$ACCOUNT/sessions" "$ACCOUNT/projects/$SLUG"
START_MS=$(( $(date +%s) * 1000 ))
REGISTRY="$ACCOUNT/sessions/$$.json"
TRANSCRIPT="$ACCOUNT/projects/$SLUG/$ID.jsonl"
write_registry() {
    printf '{"pid":%s,"sessionId":"%s","cwd":"%s","startedAt":%s,"kind":"interactive","entrypoint":"cli","status":"%s","name":"stub"}\n' \
        "$$" "$ID" "$PWD" "$START_MS" "$1" > "$REGISTRY.tmp"
    mv "$REGISTRY.tmp" "$REGISTRY"
}
trap 'rm -f "$REGISTRY"' EXIT
NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
printf '{"type":"user","sessionId":"%s","cwd":"%s","timestamp":"%s","version":"stub","entrypoint":"cli","origin":{"kind":"human"},"message":{"role":"user","content":"%s"}}\n' \
    "$ID" "$PWD" "$NOW" "$*" > "$TRANSCRIPT"
LAST=""
BEGAN=$SECONDS
while :; do
    if [ -f "$ACCOUNT/stub-status" ]; then
        STATUS="$(cat "$ACCOUNT/stub-status")"
    elif [ $(( SECONDS - BEGAN )) -lt "$BUSY" ]; then
        STATUS=busy
    else
        STATUS=idle
    fi
    if [ "$STATUS" != "$LAST" ]; then
        write_registry "$STATUS"
        printf 'STUB STATUS=%s\n' "$STATUS"
        LAST="$STATUS"
    fi
    if read -r -t 1 LINE; then
        [ "$LINE" = "quit" ] && exit 0
    fi
done
```

## The look

What a server render of the real components shows is in `store.out` (the tray with four rows, the empty file, the three unread lines, the dialog per When choice, the checkboxes per kind). What needs a DOM and a pointer:

1. The delete confirmation over the tray. `Confirm.svelte` takes a `level` and the tray passes `level="sheet"`. The z-order comes from `ui/frame/Modal.svelte`'s CSS (dialog 60, tray 65, palette 70, sheet 70) and was not seen on screen. To see: Update tray, a row, Delete: the Confirm stands above the tray with focus on Yes.
2. Escape order (S33): the schedule dialog takes the first Escape and the tray stays; the second closes the tray.
3. S16's controls: a run line whose terminal is listed opens that terminal and closes the tray; Run now while idle shows the new terminal and closes the tray.
4. S32 in the browser: Schedule... on a saved command's button and in the overflow's Manage submenu opens the tray with the dialog over it, Runs Saved command, the command chosen, the name the command's; after Save the dialog closes and the row is in the list.
5. The tray's height: `.tray` gained `max-height: 100%; overflow: auto`, so a long list scrolls inside the tray. To see: seven or more schedules in a short window.

## Edits to existing assertions

From `diff -u` against the base copy (`$SP/a3/base`). `config.test.ts` and `boundaries.test.ts` are the brief's two; `config-folder.test.ts` is a third, outside the write list, because `behavior.yml` no longer holds the `tasks` key; `local.test.ts` gains one table row (listed in the brief); `context-fixture.ts` gains the inert `schedules` field (listed).


```diff
######## tests/checks/config/config.test.ts
@@ -372,22 +372,22 @@
      */
     const WORDS = { text: loadConfig(engineDir()).config.text };
 
-    it('names the key that replaced a retired one, against behavior.yml', () => {
+    it.each([
+        ['chat.skip_permissions', { chat: { skip_permissions: true } }],
+        ['tasks.skip_permissions', { tasks: { skip_permissions: true } }]
+    ])('names the key that replaced a retired one, against behavior.yml: %s', (key, retired) => {
         const engine = scratch();
-        expect(behaviorFindings(engine, { ...WORDS, chat: { skip_permissions: true } })).toEqual([
+        expect(behaviorFindings(engine, { ...WORDS, ...retired })).toEqual([
             {
                 file: join(engine, 'config', 'behavior.yml'),
-                key: 'chat.skip_permissions',
-                message: 'chat.skip_permissions is not read; the key is tasks.skip_permissions'
+                key,
+                message: `${key} is not read; a schedule in the update tray runs unattended through its Run unattended choice`
             }
         ]);
     });
 
     it('says nothing about a configuration whose keys are all under their own names', () => {
         const engine = scratch();
-        expect(behaviorFindings(engine, { ...WORDS, tasks: { skip_permissions: true } })).toEqual(
-            []
-        );
         expect(behaviorFindings(engine, { ...WORDS, chat: { model: 'opus' } })).toEqual([]);
         expect(behaviorFindings(engine, { ...WORDS, chat: 'opus' })).toEqual([]);
         expect(behaviorFindings(engine, loadConfig(engineDir()).config)).toEqual([]);
######## tests/checks/tree/boundaries.test.ts
@@ -55,8 +55,11 @@
 // `data/helpers/files/nesting`, the reader of the `patterns:` map of file-nesting.yml and the rule
 // that nests a folder's names: the server words its findings from it and the Files view nests the
 // rows it draws through it, so the two cannot disagree about which patterns were dropped;
-// `data/helpers/run/tasks`, the server building an update task's argv from the `tasks:` block and
-// the update tray asking that block whether the task it is about to start runs unattended;
+// `data/helpers/run/tasks`, the server starting an update task and the tray listing the four;
+// `data/helpers/run/schedules` and `data/helpers/run/cron`, the rule for one entry of the schedules
+// file and the runs a cron pattern has: the schedule dialog checks an entry and previews a pattern
+// before it sends, and the server reads the file and runs the timer by the same rule, so the two
+// cannot disagree on what runs;
 // `data/helpers/run/marker`, the line a project command's chain prints before each command, which
 // the server writes into the chain's line and the page reads the task's output by;
 // `data/helpers/editor`, the order that resolves a tab's editor options (`resolveEditor`) and their
@@ -166,6 +169,8 @@
         'data/prose/latex',
         'data/helpers/files/nesting',
         'data/helpers/run/tasks',
+        'data/helpers/run/schedules',
+        'data/helpers/run/cron',
         'data/helpers/run/marker',
         'data/helpers/editor',
         'data/helpers/search/**',
@@ -337,7 +342,9 @@
  * pane in focus for the cursor through `search`, the default build and test keys in shell/keys run
  * a project command through `commands`, CommandAsk.svelte and CommandForm.svelte in shell/commands
  * draw the question and the form `commands` holds, and the tab menu reveals a file and opens it in
- * a program through `writes` and offers Open in Program from the programs `selectors` reads.
+ * a program through `writes` and offers Open in Program from the programs `selectors` reads, and
+ * the update tray and its schedule list and dialog read and write the schedules through
+ * `schedule`.
  */
 const SHELL_STORES = [
     'commands',
@@ -354,7 +361,8 @@
     'notices',
     'registry',
     'writes',
-    'selectors'
+    'selectors',
+    'schedule'
 ];
 
 /**
######## tests/checks/config/config-folder.test.ts
@@ -139,7 +139,6 @@
             'file_index',
             'slurm',
             'chat',
-            'tasks',
             'editor',
             'latex',
             'writes',
######## tests/data/sources/config/local.test.ts
@@ -62,6 +62,7 @@
             'local.yml: accounts[1].label duplicates a Claude label or reduced label: a-b'
         ],
         ['hub: 3\nport: x', 'local.yml: hub must be a path'],
+        ['schedules: 3', 'local.yml: schedules must be a path'],
         ['port: x', 'local.yml: port must be an integer'],
         ["hpc_host: ''", 'local.yml: hpc_host must be a non-empty string'],
         [
######## tests/server/root/context-fixture.ts
@@ -89,6 +89,11 @@
             close: noop
         },
         token: ROUTE_TOKEN,
+        schedules: {
+            reload: noop,
+            runNow: () => Promise.resolve({ refused: 'record-unread', names: [] }),
+            close: noop
+        },
         host: hostInfo(local.port),
         local,
         engine: overrides.engine ?? '/fixture/engine',
```

## Files

`diff -rq $SP/a3/base tools/oculus` (excluding `node_modules`, `.svelte-kit`, `.vite`, `build`, `coverage`), with `wc -l` of the written files above. Paths outside the brief's "Paths this step writes" are marked.


```
Only in .: .scratch
Files BASE/DESIGN.md and ./DESIGN.md differ
Files BASE/HELP.md and ./HELP.md differ
Files BASE/README.md and ./README.md differ   <- OUTSIDE THE LIST: line 11 states the same `claude_bin` fact as options.yml and HELP.md:284
Files BASE/config/behavior.yml and ./config/behavior.yml differ
Files BASE/config/catalogs/options.yml and ./config/catalogs/options.yml differ
Files BASE/config/text/app.yml and ./config/text/app.yml differ
Files BASE/config/text/findings.yml and ./config/text/findings.yml differ
Files BASE/config/text/ui.yml and ./config/text/ui.yml differ   <- OUTSIDE THE LIST: `ui.answer_unreachable`, the sentence `unreachableAnswer()` says, beside `ui.answer_refused` and `ui.answer_unreadable`
Files BASE/config/text/views/shared/commands.yml and ./config/text/views/shared/commands.yml differ   <- OUTSIDE THE LIST: `unreachable` is removed, `ui.answer_unreachable` says it
Files BASE/config/text/views/system/workbench.yml and ./config/text/views/system/workbench.yml differ
Files BASE/docs/diagrams/channels.dot and ./docs/diagrams/channels.dot differ
Files BASE/docs/diagrams/channels.svg and ./docs/diagrams/channels.svg differ
Files BASE/docs/diagrams/layer-data.dot and ./docs/diagrams/layer-data.dot differ
Files BASE/docs/diagrams/layer-data.svg and ./docs/diagrams/layer-data.svg differ
Files BASE/docs/diagrams/layer-server.dot and ./docs/diagrams/layer-server.dot differ
Files BASE/docs/diagrams/layer-server.svg and ./docs/diagrams/layer-server.svg differ
Files BASE/docs/diagrams/layer-shell.dot and ./docs/diagrams/layer-shell.dot differ
Files BASE/docs/diagrams/layer-shell.svg and ./docs/diagrams/layer-shell.svg differ
Files BASE/docs/diagrams/layer-state.dot and ./docs/diagrams/layer-state.dot differ
Files BASE/docs/diagrams/layer-state.svg and ./docs/diagrams/layer-state.svg differ
Files BASE/docs/diagrams/layers.dot and ./docs/diagrams/layers.dot differ
Files BASE/docs/diagrams/layers.svg and ./docs/diagrams/layers.svg differ
Files BASE/package-lock.json and ./package-lock.json differ
Files BASE/package.json and ./package.json differ
Only in ./src/lib/data/helpers/run: cron.ts
Only in ./src/lib/data/helpers/run: schedules.ts
Files BASE/src/lib/data/helpers/run/tasks.ts and ./src/lib/data/helpers/run/tasks.ts differ
Files BASE/src/lib/data/model/index.ts and ./src/lib/data/model/index.ts differ
Files BASE/src/lib/data/model/model-processes.ts and ./src/lib/data/model/model-processes.ts differ
Files BASE/src/lib/data/sources/config/catalogs.ts and ./src/lib/data/sources/config/catalogs.ts differ
Files BASE/src/lib/data/sources/config/local.ts and ./src/lib/data/sources/config/local.ts differ
Files BASE/src/lib/server/machine/commands/list.ts and ./src/lib/server/machine/commands/list.ts differ   <- OUTSIDE THE LIST: `listCommands(repo, savedFile)` takes the saved-commands file so the route chain check reads the file the watcher reads (default unchanged)
Files BASE/src/lib/server/machine/commands/run.ts and ./src/lib/server/machine/commands/run.ts differ
Files BASE/src/lib/server/machine/commands/saved.ts and ./src/lib/server/machine/commands/saved.ts differ
Files BASE/src/lib/server/machine/pty/compose.ts and ./src/lib/server/machine/pty/compose.ts differ
Files BASE/src/lib/server/machine/pty/routes.ts and ./src/lib/server/machine/pty/routes.ts differ
Only in ./src/lib/server/machine: schedules
Files BASE/src/lib/server/machine/seeds/task-seed.ts and ./src/lib/server/machine/seeds/task-seed.ts differ
Files BASE/src/lib/server/machine/seeds/task-start.ts and ./src/lib/server/machine/seeds/task-start.ts differ
Files BASE/src/lib/server/root/context.ts and ./src/lib/server/root/context.ts differ
Files BASE/src/lib/server/root/watch/local.ts and ./src/lib/server/root/watch/local.ts differ
Only in ./src/lib/shell/rail: ScheduleDialog.svelte
Only in ./src/lib/shell/rail: ScheduleList.svelte
Files BASE/src/lib/shell/rail/UpdateTray.svelte and ./src/lib/shell/rail/UpdateTray.svelte differ
Files BASE/src/lib/state/client/context.ts and ./src/lib/state/client/context.ts differ
Files BASE/src/lib/state/client/entities.svelte.ts and ./src/lib/state/client/entities.svelte.ts differ
Files BASE/src/lib/state/client/payloads.ts and ./src/lib/state/client/payloads.ts differ
Files BASE/src/lib/state/client/writes.svelte.ts and ./src/lib/state/client/writes.svelte.ts differ   <- OUTSIDE THE LIST: `postCommand` answers the HTTP status as `Posted.status` (0 when no answer came), which `failedAnswer` needs to word a refusal or an unreadable answer by its status
Files BASE/src/lib/state/sessions/terminal/commands.svelte.ts and ./src/lib/state/sessions/terminal/commands.svelte.ts differ   <- OUTSIDE THE LIST: reads `unreachableAnswer()` in place of its own key `commands.unreachable`, so the sentence exists once
Files BASE/src/lib/state/sessions/terminals.svelte.ts and ./src/lib/state/sessions/terminals.svelte.ts differ
Files BASE/src/lib/state/shared/answers/answers.ts and ./src/lib/state/shared/answers/answers.ts differ   <- OUTSIDE THE LIST: `unreachableAnswer()` is the one sentence for a request that got no answer, read by the schedule store and the command bar store
Files BASE/src/lib/state/shared/stores/shapes.ts and ./src/lib/state/shared/stores/shapes.ts differ   <- OUTSIDE THE LIST: the `Posted` type gains `status`
Files BASE/src/lib/state/shared/words/format.ts and ./src/lib/state/shared/words/format.ts differ
Only in ./src/lib/state/system/machine: schedule-when.ts
Only in ./src/lib/state/system/machine: schedule-words.ts   <- OUTSIDE THE LIST (new): the sentence for each schedule word, kept apart so `schedule.svelte.ts` stays under 880 lines and the key gate reads literal keys
Only in ./src/lib/state/system/machine: schedule.svelte.ts
Files BASE/src/lib/ui/controls/Confirm.svelte and ./src/lib/ui/controls/Confirm.svelte differ   <- OUTSIDE THE LIST: the tray delete confirmation must stand above the tray, and a `Confirm` is drawn at the dialog level (60), under the tray ground (65); the optional `level` prop passes `sheet`
Files BASE/src/lib/views/shared/sessions/CommandBar.svelte and ./src/lib/views/shared/sessions/CommandBar.svelte differ
Files BASE/src/lib/views/shared/sessions/commands.ts and ./src/lib/views/shared/sessions/commands.ts differ
Files BASE/src/routes/+page.svelte and ./src/routes/+page.svelte differ
Only in ./src/routes/api/(machine): schedules
Files BASE/src/routes/api/(sessions)/terminal/+server.ts and ./src/routes/api/(sessions)/terminal/+server.ts differ
Files BASE/tests/checks/config/config-folder.test.ts and ./tests/checks/config/config-folder.test.ts differ   <- OUTSIDE THE LIST: the expected top-level keys of `behavior.yml` no longer include `tasks`
Files BASE/tests/checks/config/config.test.ts and ./tests/checks/config/config.test.ts differ
Files BASE/tests/checks/tree/boundaries.test.ts and ./tests/checks/tree/boundaries.test.ts differ
Files BASE/tests/data/sources/config/local.test.ts and ./tests/data/sources/config/local.test.ts differ
Only in ./tests/routes/machine: schedules.test.ts
Only in ./tests/server/machine: schedules
Files BASE/tests/server/root/context-fixture.ts and ./tests/server/root/context-fixture.ts differ

Files inside the new folders (diff -rq lists the folder; `wc -l`):
```
     682 src/lib/server/machine/schedules/file.ts
     339 src/lib/server/machine/schedules/record.ts
     267 src/lib/server/machine/schedules/routes.ts
      86 src/lib/server/machine/schedules/run.ts
      71 src/lib/server/machine/schedules/task.ts
     734 src/lib/server/machine/schedules/watch.ts
      89 tests/server/machine/schedules/file.test.ts
      82 tests/server/machine/schedules/record.test.ts
     164 tests/server/machine/schedules/run.test.ts
     114 tests/server/machine/schedules/schedules-fixture.ts
     386 tests/server/machine/schedules/watch.test.ts
      33 src/routes/api/(machine)/schedules/+server.ts
    3047 total
```

Files in the new folders that the brief's write list does not name: `tests/server/machine/schedules/schedules-fixture.ts` (the shared scratch world of the five tests, a helper) and `src/lib/state/system/machine/schedule-words.ts` (the sentences of the schedule words, kept apart so `schedule.svelte.ts` stays at 553 lines and the key gate reads literal keys). Edits outside the line ranges the list gives: `config/catalogs/options.yml:1239-1241` (the `claude_bin` description names the prompts of schedules) and `README.md:11`, the same fact.


Paths from the brief's list that are unchanged by this step: `config/text/server.yml`, `settings.ts`, `catalog/*`, `config-fit.ts`, `live-settings.ts`, `pollers.ts`, `fields.ts`, `messages.ts`, `settings.test.ts`, `wrong-settings.ts`, `terminal-actions.test.ts`, `terminal-fixture.ts` (main's bytes; absent from the `diff -rq` list above). `package.json` and `package-lock.json` differ from the base by the `croner` 10.0.1 dependency (a `diff` shows one added line in `package.json` and the `node_modules/croner` entry in the lockfile). Item 14's paths are not touched.


## Head comments and doc paragraphs touched

A head comment is compared with the base copy's by `diff` of the first 30 lines, and each unchanged one was read against what the step changed in its file.

Rewritten: `UpdateTray.svelte` (Schedules and Tasks sections, the permission paragraph), `CommandBar.svelte` (Edit, Schedule... and Delete), `tasks.ts`, `model-processes.ts`, `commands/run.ts`, `format.ts` (names `ahead`), `commands.ts`, `pty/routes.ts` (its first 30 lines differ from the base by two lines, the update-task action) and the comment of the terminal route's `+server.ts` (:27-29, the request's own read of the disk). New files, each with a head comment written for what the file does: `cron.ts`, `schedules.ts`, `file.ts`, `record.ts`, `routes.ts`, `run.ts`, `task.ts`, `watch.ts`, `ScheduleDialog.svelte`, `ScheduleList.svelte`, `schedule-when.ts`, `schedule-words.ts`, `schedule.svelte.ts`, the schedules `+server.ts` and the five test files.

Still true (head unchanged, read against the change): `data/model/index.ts`, `catalogs.ts` (names "a retired behavior key", which the two keys still are), `local.ts`, `list.ts`, `saved.ts`, `compose.ts`, `task-seed.ts`, `task-start.ts`, server `context.ts`, `watch/local.ts`, client `context.ts`, `entities.svelte.ts`, `payloads.ts`, `terminals.svelte.ts`, `shapes.ts`, `Confirm.svelte` (the `level` prop has its own doc comment), `+page.svelte`, and the test files `config.test.ts`, `config-folder.test.ts`, `boundaries.test.ts`, `local.test.ts`, `context-fixture.ts`.

Documents (a `diff` of each against the base copy lists the changed lines): `HELP.md` lines 25 (the update tray, rewritten), 191 (a saved command's menu), 269 and 284 (the `behavior.yml` row and the `local.yml` keys, the latter also naming the prompts of schedules under `claude_bin`) and 294; `DESIGN.md` lines 114 (the `schedule` channel), 138 (the new **Schedules.** paragraph), 156 (**Processes.**), and the lines the `diff` lists after them for the objects built again, the `local.yml` key list and the update-task bullet at 415; `README.md:11` (`claude_bin` also names the prompts of schedules; outside the write list because it states the same fact as `options.yml` and `HELP.md:284`); `config/catalogs/options.yml` (`schedules`, `schedule_record`, `claude_bin`, and the retired `tasks:` block).


`diff $SP/a3/base/HELP.md HELP.md | grep -E "^[0-9]"`:

```
25c25
191c191
269c269
284c284
294c294
```

`diff $SP/a3/base/DESIGN.md DESIGN.md | grep -E "^[0-9]"`:

```
114c114
137a138
153c154
155c156
176c177
247c248
414c415
```

`diff $SP/a3/base/README.md README.md | grep -E "^[0-9]"`:

```
11c11
```

## Judgment calls the brief left open

1. `preview` takes the draft, not a pattern (the brief writes `preview(pattern)`): the pattern comes from `patternOf(draft)` in the state layer, which the shell cannot import, and the preview must also show the refusal of a time or a day set (`schedule.svelte.ts:451`).
2. The store has members the brief does not list: `none`, `taskLabel`, `kinds`, `tasks`, `whens`, `dayNames`, `choose` and `pickCommand`. They give the components their words and choices so the shell imports nothing from `state/system`.
3. Catalog keys beyond the brief's: `app.schedules.refused` (a refusal with no known word), `unreachable` and `unreadable` (a post that did not arrive, an answer that could not be read), and one `problem_<word>` per schedule word (24 keys in `config/text/app.yml`).
4. `schedule-words.ts` is its own module with a literal `switch` over the words (24 `case`s), because the key gate reads a computed key only through its prefix table; `schedule.svelte.ts` is 553 lines.
5. `entry-wrong`'s `{0}` is filled by the store with the row's position plus one (`schedule.svelte.ts:285`, `schedule-words.ts:67`; S38).
6. A command whose chain needs approval is saved and refused at the start with `needs-approval` (S26), not refused at save.
7. A delete removes the indent in front of the `-` with the item, so a list indented by four spaces stays readable after a delete (S20).
8. `checkSave` reads the file and compares the position and name before the disk checks, so a stale position answers `entry-changed` (409) whatever the entry holds (S25).
9. `listCommands(repo, savedFile = savedPath())` takes the saved-commands file as a second parameter, so the route's chain check reads the file the watcher reads.
10. `Confirm.svelte` gets an optional `level` (default `dialog`) and the tray's `.tray` gets `max-height: 100%; overflow: auto` (`UpdateTray.svelte:205-206`).
11. The dialog opens with When Off (the look's item 2), Time `07:00` ready for when a time choice is made, and Run unattended off.
12. `CONFLICTS` in `routes.ts:66` is an array, not a module-level `Set` (the module-level state ban).
13. The new modules export only what another file uses (verify item 4).
14. The tests' shared scratch world is `schedules-fixture.ts`, a helper in the tests folder.
15. `claude_bin` is documented as also starting the prompts of schedules (`options.yml`, `HELP.md:284`, `README.md:11`).

## Host- or user-visible changes, before and after, for the look

- The Update tray. Before: four task rows (last date, Inbox note) and Chat; a press asked a confirmation when `tasks.skip_permissions` was true. After: a heading, a Schedules section (Add schedule, the unread lines or "No schedules yet." or the rows) and a Tasks section whose rows show the last date, `Next: <day> <time> (<schedule>)` or `No schedule`, and Schedule...; a press starts the task with the permission prompts in the terminal. The rendered text is in `store.out` S16, S1 and S3.
- A row. After: name, what it runs, the pattern or `Off: it runs only from Run now`, `Paused`, the problem sentence, `Next:`, the five latest runs, Edit, Pause or Resume, Run now, Delete.
- The dialog (new): Name, Runs, Task, Command, Prompt, Folder, When with Time, Days and Cron pattern, the next three runs or the refusal sentence, Run unattended with its note, Save, Cancel; opens with When Off (`store.out` S28, S30, S31).
- The command bar. Before: a saved command's menu held Edit and Delete. After: Edit, Schedule... and Delete, in the overflow's Manage submenu too; Schedule... opens the tray with the dialog over it.
- The Findings view. Before: `chat.skip_permissions` said the key was `tasks.skip_permissions`, and `tasks.skip_permissions` had no finding. After: each of the two gets one finding saying the key is not read and that a schedule runs unattended through Run unattended (`misc.out` S34).
- `local.yml` gains `schedules` and `schedule_record`; absent they are `~/.oculus/schedules.yml` and `~/.oculus/schedule.json` (`misc.out` S52).
- `schedules.yml` and `schedule.json` are new files under `~/.oculus`. A file oculus creates is mode 0600 (`FILE_MODE = 0o600` in `file.ts:55` and `record.ts:26`, passed as the new-file mode to `writeTextAtomic`); a file the reader made keeps its mode, since `writeTextAtomic` (`core/json.ts:71-72`) applies that mode only to a file that does not exist.
- A scheduled run with Run unattended is the only start that carries `--dangerously-skip-permissions` (`engine.out` C16).

## Anything in the brief that was wrong or impossible

- The list "Paths this step writes" lacks five paths the step needs: `Confirm.svelte`, `config-folder.test.ts`, `commands/list.ts`, `schedule-words.ts` and `schedules-fixture.ts`; `README.md` is a sixth (the file table marks them).
- Verify item 1 says to run the list from the root of the worktree; the command needs `tools/oculus` and was run from there.
- The ASCII gate of `spec.md` names a `bin` folder that this tree does not have; `find` prints its error to /dev/null and the gate prints nothing.
- Verify item 8 asks for a run "with the module present and the behaviour missing" for the new tests; that is possible only in the order the brief names (tests first), not afterwards (the first line).
- `test:quick` reports its selection by running git itself (`72 changed file(s), from git since HEAD`); the builder ran no git command. Its first run printed `test:quick: 45.7 s (limit 45.0 s); every command passed` and exited 0.
- The line numbers of DESIGN.md in item 13 shift by one after the new paragraph is inserted.


## The probes

Kept in `$SP/a3/final/`, not in the tree.


### vitest.config.ts

```
export default ({
    root: '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus',
    server: { fs: { strict: false } },
    test: {
        include: ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/final/**/*.probe.ts'],
        environment: 'node',
        testTimeout: 400000,
        hookTimeout: 400000,
        fileParallelism: false,
        expect: { requireAssertions: false }
    }
});
```

### vitest.svelte.config.mjs

```
import { sveltekit } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/@sveltejs/kit/src/exports/vite/index.js';
export default {
    root: '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus',
    plugins: [sveltekit({ compilerOptions: { runes: ({ filename }) => (filename.split(/[/\\\\]/).includes('node_modules') ? undefined : true) } })],
    server: { fs: { strict: false } },
    test: {
        include: ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/final/**/*.svelte-probe.ts'],
        environment: 'node',
        testTimeout: 60000,
        expect: { requireAssertions: false },
        css: { include: [/seti-ui\/.*\.less/] }
    }
};
```

### lib.ts

```
// Shared rig of the final probes: a scratch world, the real watcher over the real runEntry with a
// recording tmux, a stub claude path and a fake clock. Nothing here reads local.yml or the home folder.
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { vi } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js';
import { Hub } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/core/channels.ts';
import { loadRecord } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/record.ts';
import { runEntry } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/run.ts';
import { watchSchedules } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/watch.ts';
import { stopTerminal } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/pty/sessions.ts';
import { tmux } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/tests/routes/sessions/terminal-fixture.ts';

export const WT = '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus';
export const SP = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3';
export const RUN = join(SP, 'final-run');
mkdirSync(RUN, { recursive: true });
export const CLAUDE = '/opt/Claude CLI/claude';
export const NAME = 'Weekly radar';
export const EARLIER = 'aabbcc-claude';
export const TODAY = new Date();
export function local(days: number, hour: number, minute = 0, second = 0): Date {
    const day = new Date(TODAY);
    day.setDate(day.getDate() - 7 + days);
    day.setHours(hour, minute, second, 0);
    return day;
}
export const iso = (d: Date) => d.toISOString();
export const hhmm = (s: string | null) => (s === null ? 'null' : new Date(s).toString().replace(/ GMT.*/, ''));
export const sha = (f: string) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 10);

export type Entry = { name: string; runs: Record<string, unknown>; when?: string | null; paused?: unknown; unattended?: unknown };
export const E = (when: string | null | undefined, extra: Partial<Entry> = {}, name = NAME): Entry => ({ name, runs: { task: 'litwatch' }, ...(when === undefined ? {} : { when }), ...extra });

export type Rig = ReturnType<typeof rig>;
export function rig(over: { run?: (a: string[]) => Promise<string>; start?: (entry: unknown, size: unknown) => Promise<unknown>; roots?: () => string[]; saved?: object | string | null } = {}) {
    const dir = realpathSync(mkdtempSync(join(RUN, 'w-')));
    const hubDir = join(dir, 'hub');
    mkdirSync(hubDir);
    const repo = join(dir, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    const files = { schedules: join(dir, 'schedules.yml'), record: join(dir, 'schedule.json'), commands: join(dir, 'commands.json') };
    if (over.saved !== null) writeFileSync(files.commands, typeof over.saved === 'string' ? over.saved : JSON.stringify(over.saved ?? { [repo]: [{ name: 'sync', run: 'echo synced' }] }));
    const driver = tmux();
    const hub = new Hub();
    const runner = over.run ?? driver.run;
    const roots = over.roots ?? (() => [repo]);
    const starts: string[] = [];
    const open: { close(): void; reload(): void; runNow(n: string): Promise<unknown> }[] = [];
    const watch = (entries: Entry[] | string | null, theHub: Hub = hub) => {
        if (entries !== null) writeFileSync(files.schedules, typeof entries === 'string' ? entries : JSON.stringify(entries));
        const w = watchSchedules(theHub, {
            files,
            rootsFor: roots,
            local: () => ({ hub: hubDir }),
            run: (entry: any, size: any) => {
                starts.push(entry.name);
                if (over.start) return over.start(entry, size) as never;
                return runEntry(entry, size, { run: (a: string[]) => runner(a), hub: hubDir, claudeBin: CLAUDE, rootsFor: roots, commands: files.commands, approvalsFor: () => join(dir, 'approvals.json') });
            },
            stop: (terminal: string) => stopTerminal(terminal, { run: (a: string[]) => runner(a) }),
            table: () => Promise.resolve([]),
            refresh: () => undefined
        });
        open.push(w);
        return w;
    };
    const set = (w: { reload(): void }, entries: Entry[] | string) => {
        writeFileSync(files.schedules, typeof entries === 'string' ? entries : JSON.stringify(entries));
        w.reload();
    };
    const payload = (theHub: Hub = hub) => theHub.latest('schedule')?.payload as { schedules: { at: number; name: string; entry: any; problem: { word: string; names: string[] } | null; next: string | null; runs: any[] }[]; commands: any[]; folders: string[]; unread: { file: string; line: number | null }[] } | undefined;
    const row = (name = NAME, theHub: Hub = hub) => payload(theHub)?.schedules.find((r) => r.name === name);
    const sessions = (terminals: { id: string; pid: number; task?: boolean; exit?: number | null }[], records: { pid: number | null; liveStatus: string | null }[], theHub: Hub = hub) => theHub.publish('sessions', { records, workspaces: [], terminals });
    const created = () => driver.calls.filter((a) => a.includes('new-session')).length;
    const killed = () => driver.calls.filter((a) => a[0] === 'kill-session').map((a) => a[2]);
    const runs = (name = NAME): Record<string, any>[] => {
        const l = loadRecord(files.record);
        return l.ok ? (l.logs.get(name)?.runs ?? []) : [];
    };
    const closeAll = () => { for (const w of open.splice(0)) w.close(); };
    return { dir, hubDir, repo, files, driver, hub, starts, watch, set, payload, row, sessions, created, killed, runs, closeAll };
}
export const settle = async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(200);
};
export function plant(record: string, entry: { handled: Date | null; runs?: object[]; since?: Date; pattern?: string }, name = NAME) {
    writeFileSync(record, JSON.stringify({ [name]: { pattern: entry.pattern ?? '0 7 * * *', since: iso(entry.since ?? local(-5, 8)), handled: entry.handled ? iso(entry.handled) : null, runs: entry.runs ?? [] } }));
}
export const earlierRun = (due: Date) => ({ trigger: 'schedule', due: iso(due), at: iso(due), outcome: 'started', terminal: EARLIER });
export const short = (r: Record<string, any> | undefined) => (r === undefined ? 'none' : `{${r.trigger} due=${r.due === null ? 'null' : new Date(r.due as string).toTimeString().slice(0, 5)} ${r.outcome} terminal=${r.terminal}${r.why ? ' why=' + JSON.stringify(r.why) : ''}}`);

export function reporter(file: string) {
    const lines: string[] = [];
    return {
        say: (c: string, text: string) => {
            lines.push(`${c} ${text}`);
            process.stdout.write(`${c} ${text}\n`);
        },
        flush: () => writeFileSync(join(SP, 'final', file), lines.join('\n') + '\n')
    };
}
export { Hub, loadRecord, tmux, runEntry, watchSchedules, stopTerminal };
```

### engine.probe.ts

```
// Final run of the engine cases C2-C24, C28-C31, C34 over schedules.yml, the real runEntry and a recording tmux.
import { chmodSync, existsSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, it, vi } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js';
import { EARLIER, E, Hub, NAME, TODAY, earlierRun, hhmm, iso, loadRecord, local, plant, reporter, rig, settle, sha, short, tmux } from './lib.ts';
import { TerminalRefused } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/pty/refusal.ts';

const { say, flush } = reporter('engine.out');
afterAll(flush);
let errs: string[] = [];
let current: ReturnType<typeof rig>[] = [];
const mk = (over: Parameters<typeof rig>[0] = {}) => {
    const r = rig(over);
    current.push(r);
    return r;
};
beforeEach(() => {
    vi.useFakeTimers({ now: local(0, 6, 59, 50) });
    errs = [];
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
        errs.push(a.map(String).join(' '));
    });
});
afterEach(() => {
    for (const r of current.splice(0)) r.closeAll();
    vi.useRealTimers();
    vi.restoreAllMocks();
});
const nextOf = (r: ReturnType<typeof rig>, name = NAME) => hhmm(r.row(name)?.next ?? null);

describe('final run, engine', () => {
    it('C2', async () => {
        vi.setSystemTime(local(0, 6, 59, 0));
        const r = mk();
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await settle();
        say('C2', `06:59 next=${nextOf(r)} starts=${r.created()}`);
        await vi.advanceTimersByTimeAsync(61_000);
        say('C2', `07:00 starts=${r.created()} runs=${r.runs().map(short).join(' ')} next=${nextOf(r)}`);
    });
    it('C3', async () => {
        const r = mk();
        r.sessions([], []);
        const w = r.watch([E(undefined)]);
        await settle();
        const row = r.row()!;
        say('C3', `no when: next=${row.next} timers=${vi.getTimerCount()} (the 30 s look only) entry.when=${JSON.stringify(row.entry.when)} record exists=${existsSync(r.files.record)}`);
        const answer = await w.runNow(NAME);
        say('C3', `after Run now: ${JSON.stringify(answer)} record exists=${existsSync(r.files.record)} runs=${r.runs().map(short).join(' ')}`);
    });
    it('C4', async () => {
        for (const p of ['nonsense', '61 * * * *', '* * * * * *', '*/0 * * * *']) {
            const r = mk();
            errs.length = 0;
            r.sessions([], []);
            r.watch([E(p), E('0 7 * * *', {}, 'Other')]);
            await settle();
            const row = r.row()!;
            say('C4', `${JSON.stringify(p)}: problem=${JSON.stringify(row.problem)} next=${row.next}; other entry next=${r.row('Other')!.next ? 'set' : 'null'} problem=${JSON.stringify(r.row('Other')!.problem)}; stderr=${JSON.stringify(errs)}`);
            r.closeAll();
        }
    });
    it('C5', async () => {
        for (const p of ['0 0 31 2 *', '0 0 31 4,6,9,11 *', '0 0 29 2 *']) {
            const r = mk();
            errs.length = 0;
            r.sessions([], []);
            r.watch([E(p)]);
            await settle();
            await vi.advanceTimersByTimeAsync(60_000);
            const row = r.row()!;
            say('C5', `${p}: problem=${JSON.stringify(row.problem)} next=${row.next === null ? 'null' : hhmm(row.next)} starts=${r.created()} stderr=${JSON.stringify(errs)}`);
            r.closeAll();
        }
    });
    it('C6', async () => {
        for (const p of ['@hourly', '@daily', '@weekly', '@monthly', '@yearly', '0 7 * * MON', ' 0 7 * * * ']) {
            const r = mk();
            errs.length = 0;
            r.sessions([], []);
            r.watch([E(p)]);
            await settle();
            const row = r.row()!;
            say('C6', `${JSON.stringify(p)}: problem=${JSON.stringify(row.problem)} next=${row.next === null ? 'null' : hhmm(row.next)} stderr=${JSON.stringify(errs)}`);
            r.closeAll();
        }
    });
    it('C7 C8 C9 C10', async () => {
        vi.setSystemTime(local(0, 7, 30));
        let r = mk();
        plant(r.files.record, { handled: local(-1, 7) });
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await settle();
        say('C7', `down 06:50-07:30, handled the day before: starts=${r.created()} runs=${r.runs().map(short).join(' ')}`);
        vi.setSystemTime(local(3, 9));
        r = mk();
        plant(r.files.record, { handled: local(0, 7) });
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await settle();
        say('C8', `down three days: starts=${r.created()} runs=${r.runs().map(short).join(' ')}`);
        vi.setSystemTime(local(0, 7, 30));
        r = mk();
        plant(r.files.record, { handled: local(0, 7) });
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await settle();
        say('C9', `restart 07:30, handled 07:00 of that day: starts=${r.created()} runs=${r.runs().length}`);
        vi.setSystemTime(local(0, 9, 12));
        r = mk();
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await settle();
        await vi.advanceTimersByTimeAsync(60_000);
        say('C10', `entry first read at 09:12 whose pattern matched 07:00: starts=${r.created()} runs=${r.runs().length}`);
    });
    it('C11', async () => {
        vi.setSystemTime(local(0, 6, 30));
        let r = mk();
        r.sessions([], []);
        let w = r.watch([E('0 7 * * *')]);
        await settle();
        const l0 = loadRecord(r.files.record);
        r.set(w, [E('0 8 * * *')]);
        await settle();
        const next1 = nextOf(r);
        const l1 = loadRecord(r.files.record);
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        const at0700 = r.created();
        await vi.advanceTimersByTimeAsync(60 * 60_000);
        say('C11', `edit 07:00 to 08:00 at 06:30: starts by 07:31=${at0700}, by 08:31=${r.created()}; next after edit=${next1}; since before=${l0.ok ? l0.logs.get(NAME)?.since : '?'} after=${l1.ok ? l1.logs.get(NAME)?.since : '?'}; pattern stored=${l1.ok ? JSON.stringify(l1.logs.get(NAME)?.pattern) : '?'}`);
        vi.setSystemTime(local(0, 6, 59, 50));
        r = mk();
        r.sessions([], []);
        w = r.watch([E('0 7 * * *')]);
        await settle();
        r.set(w, [E(undefined)]);
        await settle();
        await vi.advanceTimersByTimeAsync(120_000);
        say('C11', `when removed at 06:59:50: starts after 07:00=${r.created()} next=${r.row()!.next} stored pattern=${JSON.stringify((loadRecord(r.files.record) as any).logs?.get(NAME)?.pattern)}`);
        vi.setSystemTime(local(0, 6, 59, 50));
        r = mk();
        w = r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        r.set(w, [E('0 9 * * *')]);
        await settle();
        r.sessions([], []);
        await vi.advanceTimersByTimeAsync(5_000);
        say('C11', `when edited while a decision waits for the first sessions payload: starts=${r.created()} runs=${r.runs().map(short).join(' ')}`);
        // a run in progress goes on when the when is removed
        vi.setSystemTime(local(0, 6, 59, 50));
        r = mk();
        let release: (v: unknown) => void = () => undefined;
        const gate = new Promise((res) => (release = res));
        r = mk({ start: () => gate });
        r.sessions([], []);
        w = r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        const startedBefore = r.starts.length;
        r.set(w, [E(undefined)]);
        await settle();
        const { runEntry: real } = await import('./lib.ts');
        void real;
        release({ refused: 'terminal-failed', names: [] });
        await settle();
        say('C11', `when removed while the start is awaited: start called=${startedBefore}; after the start answers (refused terminal-failed) the run in progress is settled: runs=${r.runs().map(short).join(' ')} job stopped: next=${r.row()!.next}`);
    });
    it('C12 C13', async () => {
        for (const [name, recs] of [['busy', [{ pid: 4300, liveStatus: 'busy' }]], ['waiting', [{ pid: 4300, liveStatus: 'waiting' }]], ['no session matched', []]] as const) {
            vi.setSystemTime(local(0, 6, 59, 50));
            const r = mk();
            plant(r.files.record, { handled: local(-1, 7), runs: [earlierRun(local(-1, 7))] });
            r.sessions([{ id: EARLIER, pid: 4300 }], [...recs]);
            r.watch([E('0 7 * * *')]);
            await vi.advanceTimersByTimeAsync(20_000);
            say('C12', `earlier ${name}: starts=${r.created()} kills=${r.killed().length} run0=${short(r.runs()[0])}`);
            r.closeAll();
        }
        vi.setSystemTime(local(0, 6, 59, 50));
        const r = mk();
        plant(r.files.record, { handled: local(-1, 7), runs: [earlierRun(local(-1, 7))] });
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        say('C13', `earlier terminal left the list: starts=${r.created()} run0=${short(r.runs()[0])}`);
    });
    it('C14', async () => {
        const r = mk();
        r.sessions([], []);
        r.watch([E('0 7 * * *'), E('0 7 * * *', { runs: { task: 'scout' } }, 'Scout daily')]);
        await vi.advanceTimersByTimeAsync(20_000);
        say('C14', `two schedules due the same minute: starts=${r.created()} Weekly radar runs=${r.runs().length} Scout daily runs=${r.runs('Scout daily').length}`);
    });
    it('C15', async () => {
        const { startUpdateTask } = await import('/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/task.ts');
        const r = mk();
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        const first = r.runs()[0].terminal as string;
        r.sessions([{ id: first, pid: 4300 }], [{ pid: 4300, liveStatus: 'busy' }]);
        const before = JSON.stringify(r.runs());
        const pressed = await startUpdateTask('litwatch', false, { run: r.driver.run, hub: r.hubDir, claudeBin: '/c', size: { cols: 80, rows: 24 } });
        say('C15', `press of Lit Watch while a schedule's run of litwatch is working: terminals started=${r.created()} (press answered ${'terminal' in pressed ? 'a terminal, a new one: ' + (pressed.terminal.id !== first) : JSON.stringify(pressed)}); record runs unchanged by the press: ${JSON.stringify(r.runs()) === before} (${r.runs().map(short).join(' ')})`);
    });
    it('C16', async () => {
        const out: string[] = [];
        const { runEntry } = await import('./lib.ts');
        const { lineOf } = await import('/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/tests/routes/sessions/terminal-fixture.ts');
        const r = mk();
        for (const [label, runs, unattended] of [['task false', { task: 'litwatch' }, false], ['task true', { task: 'litwatch' }, true], ['prompt false', { prompt: 'P1', folder: 'hub' }, false], ['prompt true', { prompt: 'P1', folder: 'hub' }, true]] as const) {
            const driver = tmux();
            await runEntry({ name: NAME, runs, when: '', paused: false, unattended } as never, { cols: 80, rows: 24 }, { run: driver.run, hub: r.hubDir, claudeBin: '/opt/Claude CLI/claude', rootsFor: () => [r.repo], commands: r.files.commands, approvalsFor: () => r.dir + '/ap.json' });
            const start = driver.calls.find((a) => a.includes('new-session'))!;
            out.push(`${label}: ${JSON.stringify(lineOf(start))}`);
        }
        say('C16', out.join(' | '));
    });
    it('C17', async () => {
        for (const [pattern, from, hours] of [['30 2 * * *', '2026-03-28T23:30:00+01:00', 52], ['30 2 * * *', '2026-10-24T22:30:00+02:00', 52], ['0 * * * *', '2026-10-25T00:30:00+02:00', 4]] as const) {
            vi.setSystemTime(new Date(from));
            const r = mk();
            r.sessions([], []);
            r.watch([E(pattern)]);
            await settle();
            for (let m = 0; m < hours * 60; m += 1) await vi.advanceTimersByTimeAsync(60_000);
            say('C17', `${pattern} from ${from} for ${hours} h: starts=${r.created()} dues=${r.runs().map((x) => String(x.due)).reverse().map((d) => d + ' (local ' + new Date(d).toString().replace(/ GMT.*/, '') + ')').join(' ; ')}`);
            r.closeAll();
        }
    });
    it('C18', async () => {
        for (const p of ['0 7 * * *', '0 8 * * *']) {
            vi.setSystemTime(local(0, 5, 59, 50));
            const r = mk();
            r.sessions([], []);
            r.watch([E(p)]);
            await settle();
            vi.setSystemTime(local(0, 9, 0, 0));
            await vi.advanceTimersByTimeAsync(31_000);
            say('C18', `asleep 06:00-09:00 over ${p}: starts=${r.created()} runs=${r.runs().map(short).join(' ')}`);
            r.closeAll();
        }
    });
    it('C19', async () => {
        vi.setSystemTime(new Date('2026-10-05T12:00:00+02:00'));
        const delays: number[] = [];
        const orig = globalThis.setTimeout;
        const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number, ...a: unknown[]) => {
            delays.push(Number(ms ?? 0));
            return (orig as any)(fn, ms, ...a);
        }) as never);
        const r = mk();
        r.sessions([], []);
        r.watch([E('@yearly')]);
        await settle();
        vi.setSystemTime(new Date('2026-12-31T23:59:30+01:00'));
        await vi.advanceTimersByTimeAsync(31_000);
        const before = r.created();
        await vi.advanceTimersByTimeAsync(40_000);
        spy.mockRestore();
        say('C19', `@yearly on 2026-10-05: longest timer asked=${Math.max(...delays)} ms; starts before 2027-01-01T00:00 local=${before}, after=${r.created()} runs=${r.runs().map((x) => String(x.due)).join(',')}`);
    });
    it('C20', async () => {
        let r = mk();
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await settle();
        say('C20', `record missing: after the first read of a pattern the file exists=${existsSync(r.files.record)}${existsSync(r.files.record) ? ' mode=' + (statSync(r.files.record).mode & 0o777).toString(8) : ''}`);
        for (const held of ['{', `{"${NAME}": 5}`]) {
            vi.setSystemTime(local(0, 6, 59, 50));
            r = mk();
            writeFileSync(r.files.record, held);
            const before = sha(r.files.record);
            errs.length = 0;
            r.sessions([], []);
            const w = r.watch([E('0 7 * * *')]);
            await vi.advanceTimersByTimeAsync(20_000);
            const answer = await w.runNow(NAME);
            say('C20', `${held}: starts=${r.created()} file unchanged=${sha(r.files.record) === before} unread=${JSON.stringify(r.payload()?.unread)} Run now=${JSON.stringify(answer)} stderr lines=${errs.length}: ${JSON.stringify(errs.slice(0, 1).map((e) => e.replace(/\/private\S*\//, '<dir>/')))}`);
            r.closeAll();
        }
    });
    it('C21', async () => {
        const r = mk();
        r.sessions([], []);
        writeFileSync(r.files.schedules, JSON.stringify([E('0 * * * *')]));
        chmodSync(r.dir, 0o555);
        r.watch(null);
        await settle();
        await vi.advanceTimersByTimeAsync(5 * 60_000);
        const afterFirst = r.created();
        const firstErrs = errs.length;
        chmodSync(r.dir, 0o755);
        await vi.advanceTimersByTimeAsync(60 * 60_000);
        say('C21', `scratch folder read-only at the due time (07:00): starts=${afterFirst}, stderr lines=${firstErrs} ${JSON.stringify(errs.slice(0, 1).map((e) => e.replace(/\/private\S*\//, '<dir>/')))}; next due time (08:00) after the folder is writable: starts=${r.created()}`);
    });
    it('C22', async () => {
        const r = mk();
        const second = new Hub();
        r.sessions([], []);
        r.sessions([], [], second);
        r.watch([E('0 7 * * *')]);
        r.watch([E('0 7 * * *')], second);
        await vi.advanceTimersByTimeAsync(20_000);
        await settle();
        say('C22', `two watchers over one record and one schedules.yml, one due time: starts=${r.created()} runs=${r.runs().length}`);
    });
    it('C23', async () => {
        const failing = tmux();
        const run = (a: string[]) => (a.includes('new-session') ? Promise.reject(new TerminalRefused('terminal-failed')) : failing.run(a));
        const r = mk({ run });
        r.sessions([], []);
        r.watch([E('0 * * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        const first = r.runs().map(short);
        await vi.advanceTimersByTimeAsync(3_600_000);
        say('C23', `start refused with terminal-failed: runs after 07:00 ${first.join(' ')}; after 08:00 ${r.runs().map(short).join(' ')}`);
    });
    it('C24', async () => {
        let r = mk();
        r.sessions([], []);
        const w = r.watch([E('0 7 * * *')]);
        await settle();
        w.close();
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        say('C24', `close() with a job armed: timers left=${vi.getTimerCount()} starts=${r.created()}`);
        vi.setSystemTime(local(0, 6, 59, 50));
        let answer: (v: []) => void = () => undefined;
        const gate = new Promise<[]>((resolve) => (answer = resolve));
        r = mk();
        plant(r.files.record, { handled: local(-1, 7), runs: [earlierRun(local(-1, 7))] });
        r.sessions([{ id: EARLIER, pid: 4300 }], [{ pid: 4301, liveStatus: 'idle' }]);
        const { watchSchedules, runEntry, stopTerminal } = await import('./lib.ts');
        const w2 = watchSchedules(r.hub, { files: r.files, rootsFor: () => [r.repo], local: () => ({ hub: r.hubDir }), run: (e: any, s: any) => runEntry(e, s, { run: r.driver.run, hub: r.hubDir, claudeBin: '/c', rootsFor: () => [r.repo], commands: r.files.commands, approvalsFor: () => r.dir + '/ap.json' }), stop: (t: string) => stopTerminal(t, { run: r.driver.run }), table: () => gate, refresh: () => undefined });
        writeFileSync(r.files.schedules, JSON.stringify([E('0 7 * * *')]));
        w2.reload();
        await vi.advanceTimersByTimeAsync(20_000);
        w2.close();
        answer([]);
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        say('C24', `close() while a decision awaits the process table: timers left=${vi.getTimerCount()} non-list tmux calls=${r.driver.calls.filter((a) => a[0] !== 'list-sessions').length} runs=${r.runs().length}`);
        // a start already awaited
        vi.setSystemTime(local(0, 6, 59, 50));
        let release: (v: unknown) => void = () => undefined;
        r = mk({ start: () => new Promise((res) => (release = res)) });
        r.sessions([], []);
        const w3 = r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        w3.close();
        release({ refused: 'terminal-failed', names: [] });
        await vi.advanceTimersByTimeAsync(24 * 3_600_000);
        say('C24', `close() with a start awaited: start called=${r.starts.length} new-session calls=${r.created()} timers left=${vi.getTimerCount()}`);
    });
    it('C28', async () => {
        let r = mk();
        r.sessions([], []);
        writeFileSync(`${r.files.record}.lock`, '');
        const old = new Date(Date.now() - 120_000);
        utimesSync(`${r.files.record}.lock`, old, old);
        errs.length = 0;
        r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        say('C28', `lock 120 s old: starts=${r.created()} lock left=${existsSync(`${r.files.record}.lock`)} stderr=${JSON.stringify(errs.filter((e) => e.includes('took over')).map((e) => e.replace(/\/private\S*\//, '<dir>/')))}`);
        r.closeAll();
        vi.setSystemTime(local(0, 6, 59, 50));
        r = mk();
        r.sessions([], []);
        writeFileSync(`${r.files.record}.lock`, '');
        const now = new Date(Date.now());
        utimesSync(`${r.files.record}.lock`, now, now);
        errs.length = 0;
        r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        await vi.advanceTimersByTimeAsync(10_000);
        say('C28', `lock younger than 60 s that outlasts the 2000 ms wait: starts=${r.created()} stderr=${JSON.stringify(errs.slice(0, 3).map((e) => e.replace(/\/private\S*\//, '<dir>/')))}`);
    });
    it('C29', async () => {
        const hang = new Promise<never>(() => undefined);
        const r = mk({ start: () => hang });
        r.sessions([], []);
        r.watch([E('0 * * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        await vi.advanceTimersByTimeAsync(3_600_000);
        say('C29', `a due time while the same schedule's start is awaited: start called=${r.starts.length} runs=${r.runs().map(short).join(' ')}`);
    });
    it('C30', async () => {
        for (const status of ['busy', 'idle']) {
            vi.setSystemTime(local(0, 7, 30));
            const r = mk();
            plant(r.files.record, { handled: local(-1, 7), runs: [earlierRun(local(-1, 7))] });
            r.watch([E('0 7 * * *')]);
            await settle();
            const waiting = r.created();
            r.sessions([{ id: EARLIER, pid: 4300 }], [{ pid: 4300, liveStatus: status }]);
            await settle();
            say('C30', `catch-up before the first sessions payload, earlier ${status}: started while waiting=${waiting}; after the payload starts=${r.created()} kills=${JSON.stringify(r.killed())} run0=${short(r.runs()[0])}`);
            r.closeAll();
        }
    });
    it('C31', async () => {
        vi.setSystemTime(local(0, 6, 59, 50));
        const r = mk();
        r.sessions([], []);
        r.watch([E('@hourly')]);
        let maxOpen = 0;
        const open = new Set<string>();
        for (let hour = 0; hour < 24; hour += 1) {
            const last = r.runs().find((x) => x.terminal !== null);
            if (last) r.sessions([{ id: last.terminal as string, pid: 5000 + hour }], [{ pid: 5000 + hour, liveStatus: 'idle' }]);
            await vi.advanceTimersByTimeAsync(3_600_000);
        }
        for (const call of r.driver.calls) {
            if (call.includes('new-session')) {
                open.add(call[call.indexOf('-s') + 1]);
                maxOpen = Math.max(maxOpen, open.size);
            }
            if (call[0] === 'kill-session') open.delete(call[2]);
        }
        say('C31', `@hourly over 24 h, each run going idle: starts=${r.created()} kills=${r.killed().length} most terminals open at once=${maxOpen}`);
        r.closeAll();
        for (const kind of ['task', 'command']) {
            vi.setSystemTime(local(0, 6, 59, 50));
            const s = mk();
            const runs = kind === 'task' ? { task: 'litwatch' } : { command: 'sync', folder: s.repo };
            plant(s.files.record, { handled: local(-1, 7), runs: [earlierRun(local(-1, 7))] });
            s.sessions([{ id: EARLIER, pid: 4300, ...(kind === 'command' ? { task: true, exit: 0 } : {}) }], [{ pid: 4300, liveStatus: 'idle' }]);
            s.watch([E('0 7 * * *', { runs })]);
            await vi.advanceTimersByTimeAsync(20_000);
            const k = s.driver.calls.findIndex((a) => a[0] === 'kill-session');
            const n = s.driver.calls.findIndex((a) => a.includes('new-session'));
            say('C31', `${kind} due while idle/ended: kill-session at call ${k} (${JSON.stringify(s.driver.calls[k])}), new-session at call ${n}, no confirmation prompt`);
            s.closeAll();
        }
    });
    it('C34', async () => {
        const r = mk();
        const runs = Array.from({ length: 20 }, (_, i) => ({ trigger: 'schedule', due: iso(local(-30 + i, 7)), at: iso(local(-30 + i, 7)), outcome: 'started', terminal: `t${i}` }));
        writeFileSync(r.files.record, JSON.stringify({ [NAME]: { pattern: '0 7 * * *', since: iso(local(-40, 8)), handled: iso(local(-1, 7)), runs }, 'No such schedule': { keep: 'me', n: [1, 2, 3] } }, null, 4) + '\n');
        // the record's own shape check: a value of a key no schedule holds must also read; give it the shape
        writeFileSync(r.files.record, JSON.stringify({ [NAME]: { pattern: '0 7 * * *', since: iso(local(-40, 8)), handled: iso(local(-1, 7)), runs }, 'No such schedule': { pattern: '', since: iso(local(-40, 8)), handled: null, runs: [] } }, null, 4) + '\n');
        const stray = JSON.stringify(JSON.parse(readFileSync(r.files.record, 'utf8'))['No such schedule']);
        r.sessions([], []);
        r.watch([E('0 7 * * *')]);
        await vi.advanceTimersByTimeAsync(20_000);
        const whole = JSON.parse(readFileSync(r.files.record, 'utf8'));
        say('C34', `key with no schedule beside the schedules' keys after a write: ${JSON.stringify(whole['No such schedule'])} (before ${stray}); in the payload rows: ${JSON.stringify(r.payload()!.schedules.map((x) => x.name))}; ${NAME} runs after the 21st=${whole[NAME].runs.length}`);
    });
});
```

### engine2.probe.ts

```
// Final run of S15 (paused at a due time, Resume), S6 (command gone before the start), S26 (a chain that needs
// approval at its due time) and S51 (a root no longer served at the due time), over the real runEntry.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, it, vi } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js';
import { CLAUDE, E, NAME, local, loadRecord, reporter, rig, runEntry, settle, short } from './lib.ts';

const { say, flush } = reporter('engine2.out');
afterAll(flush);
let current: ReturnType<typeof rig>[] = [];
beforeEach(() => {
    vi.useFakeTimers({ now: local(0, 6, 59, 50) });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
    for (const r of current.splice(0)) r.closeAll();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('final run, engine, second part', () => {
    it('S15', async () => {
        const r = rig();
        current.push(r);
        r.sessions([], []);
        const w = r.watch([E('0 7 * * *', { paused: true })]);
        await settle();
        await vi.advanceTimersByTimeAsync(20_000);
        say('S15', `paused entry at its 07:00 due time: starts=${r.created()} runs=${r.runs().length} next=${r.row()!.next}`);
        await vi.advanceTimersByTimeAsync(3_600_000);
        const existsRecordBefore = existsSync(r.files.record);
        r.set(w, [E('0 7 * * *')]);
        await settle();
        const afterResume = loadRecord(r.files.record);
        await vi.advanceTimersByTimeAsync(60_000);
        say('S15', `Resume at 08:00 after the missed 07:00: starts=${r.created()} (no catch-up); since after Resume=${afterResume.ok ? (afterResume.logs.get(NAME)?.since ?? 'none') : '?'} (clock ${new Date(Date.now() - 60_000).toISOString()}); handled=${afterResume.ok ? afterResume.logs.get(NAME)?.handled : '?'}; record file existed before the Resume=${existsRecordBefore}; next=${r.row()!.next}`);
    });
    it('S6', async () => {
        let r: ReturnType<typeof rig>;
        r = rig({
            start: async (entry) => {
                writeFileSync(r.files.commands, JSON.stringify({}));
                return runEntry(entry as never, { cols: 80, rows: 24 }, { run: r.driver.run, hub: r.hubDir, claudeBin: CLAUDE, rootsFor: () => [r.repo], commands: r.files.commands, approvalsFor: () => join(r.dir, 'ap.json') });
            }
        });
        current.push(r);
        r.sessions([], []);
        r.watch([E('0 7 * * *', { runs: { command: 'sync', folder: r.repo } })]);
        await vi.advanceTimersByTimeAsync(20_000);
        say('S6', `command deleted between the decision and the start: new-session calls=${r.created()} runs=${r.runs().map(short).join(' ')}`);
    });
    it('S26', async () => {
        const r = rig({ saved: null });
        current.push(r);
        mkdirSync(join(r.repo, '.oculus'), { recursive: true });
        writeFileSync(join(r.repo, '.oculus', 'commands.yml'), 'commands:\n  - name: build\n    run: echo built\n');
        writeFileSync(r.files.commands, JSON.stringify({ [r.repo]: [{ name: 'sync', run: 'echo synced', depends_on: ['build'] }] }));
        r.sessions([], []);
        r.watch([E('0 7 * * *', { runs: { command: 'sync', folder: r.repo } })]);
        say('S26', `row before the due time: problem=${JSON.stringify(r.row()!.problem)}`);
        await vi.advanceTimersByTimeAsync(20_000);
        say('S26', `at its due time (the chain holds a file command nobody approved): new-session calls=${r.created()} runs=${r.runs().map(short).join(' ')}`);
    });
    it('S51', async () => {
        const roots = { value: [''] };
        const r = rig({ roots: () => roots.value });
        current.push(r);
        roots.value = [r.repo];
        r.sessions([], []);
        r.watch([E('0 7 * * *', { runs: { prompt: 'hello', folder: r.repo } })]);
        say('S51', `row before: problem=${JSON.stringify(r.row()!.problem)} next set=${r.row()!.next !== null}`);
        roots.value = [];
        await vi.advanceTimersByTimeAsync(20_000);
        say('S51', `root no longer served at the 07:00 due time (no file change in between): new-session calls=${r.created()} runs=${r.runs().map(short).join(' ').replace(/\/private\S*?\/repo/g, '<repo>')}; row now: problem=${JSON.stringify(r.row()!.problem).replace(/\/private\S*?\/repo/g, '<repo>')}`);
        void existsSync;
    });
});
```

### entries.probe.ts

```
// Final run of the file, entry and route cases (S1-S14, S18-S26, S35-S50, S52 parts) over scratch files.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, describe, it } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js';
import { E, NAME, RUN, WT, reporter, rig, sha, short as runShort, tmux, type Entry, type Rig } from './lib.ts';
import { readSchedules } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/file.ts';
import { handleSchedules } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/routes.ts';
import { loadRecord } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/machine/schedules/record.ts';
import { fsWrites } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/server/core/json.ts';
import { pagePost } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/tests/fixtures/doubles.ts';
import { lineOf } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/tests/routes/sessions/terminal-fixture.ts';

const { say, flush } = reporter('entries.out');
afterAll(flush);
const made: Rig[] = [];
const mk = (over: Parameters<typeof rig>[0] = {}) => {
    const r = rig(over);
    made.push(r);
    return r;
};
afterEach(() => {
    for (const r of made.splice(0)) r.closeAll();
});
const TOKEN = 'the token';
const HOME = realpathSync(mkdtempSync(join(RUN, 'home-')));
process.env.HOME = HOME;
mkdirSync(join(HOME, 'workspace'), { recursive: true });

/** The rows of a file text, one line each. */
function rowsOf(r: Rig, text: string, label: string, c: string, roots?: string[]): void {
    writeFileSync(r.files.schedules, text);
    const read = readSchedules(r.files.schedules, { hub: r.hubDir, roots: roots ?? [r.repo], commands: r.files.commands });
    if (!read.ok) {
        say(c, `${label}: unread line=${read.line}`);
        return;
    }
    say(c, `${label}: ${read.rows.map((x) => `[${x.at}] name=${JSON.stringify(x.name)} entry=${x.entry === null ? 'null' : 'set'} problem=${x.problem === null ? 'none' : x.problem.word + JSON.stringify(x.problem.names).replace(/\/private\S*?\/(hub|repo)/g, '<$1>')}`).join(' ; ')}`);
}
const y = (s: string) => s.replace(/^\n/, '');
function api(r: Rig, watcher: ReturnType<Rig['watch']>) {
    const log = { file: join(r.dir, 'changes.jsonl'), keep: 100, writes: fsWrites() };
    const call = async (body: unknown, token = TOKEN) => {
        const res = await handleSchedules(pagePost('http://127.0.0.1:8791/api/schedules', body, token), TOKEN, { files: () => r.files, rootsFor: () => [r.repo], hubFor: () => r.hubDir, writes: log.writes, changes: log, schedules: watcher as never });
        return { status: res.status, body: (await res.json()) as Record<string, any> };
    };
    const changes = () => (existsSync(log.file) ? readFileSync(log.file, 'utf8').trim().split('\n').filter(Boolean).length : 0);
    return { call, changes };
}
const short = (x: { status: number; body: Record<string, any> }) => `${x.status} ${JSON.stringify(x.body).replace(/\/private\S*?\/(hub|repo)/g, '<$1>')}`;

describe('final run, entries and route', () => {
    it('S1 S2 S3 S4', async () => {
        const r = mk();
        r.sessions([], []);
        say('S1', `schedules.yml missing: ${JSON.stringify(readSchedules(r.files.schedules, { hub: r.hubDir, roots: [r.repo], commands: r.files.commands }))} file exists=${existsSync(r.files.schedules)}`);
        const w = r.watch(null);
        say('S1', `watcher over a missing file: rows=${r.payload()?.schedules.length} unread=${JSON.stringify(r.payload()?.unread)} file exists after start=${existsSync(r.files.schedules)}`);
        const a = api(r, w);
        for (const [label, text] of [['empty file', ''], ['comments only', '# my schedules\n# second line\n'], ['null', 'null\n']] as const) {
            writeFileSync(r.files.schedules, text);
            const read = readSchedules(r.files.schedules, { hub: r.hubDir, roots: [r.repo], commands: r.files.commands });
            const saved = await a.call({ action: 'save', at: null, was: null, entry: E('0 7 * * 1') });
            say('S2', `${label}: rows=${read.ok ? read.rows.length : 'unread'}; first save -> ${short(saved)}; file now=${JSON.stringify(readFileSync(r.files.schedules, 'utf8'))}`);
        }
        for (const [c, label, text] of [['S3', 'unparseable (- name: [)', '- name: [\n'], ['S4', 'top-level map', 'name: Weekly radar\nwhen: "0 7 * * 1"\n'], ['S4', 'top-level string', '"Weekly radar"\n'], ['S42', 'name: twice in one entry', '- name: A\n  name: B\n  runs: { task: litwatch }\n'], ['S42', 'unquoted when: */5 * * * *', '- name: A\n  runs: { task: litwatch }\n  when: */5 * * * *\n']] as const) {
            writeFileSync(r.files.schedules, text);
            w.reload();
            const before = sha(r.files.schedules);
            const outs = [
                await a.call({ action: 'save', at: null, was: null, entry: E('0 7 * * 1') }),
                await a.call({ action: 'delete', at: 0, name: 'A' }),
                await a.call({ action: 'pause', at: 0, name: 'A' }),
                await a.call({ action: 'resume', at: 0, name: 'A' })
            ];
            const run = await w.runNow('A');
            say(c, `${label}: unread=${JSON.stringify(r.payload()?.unread)} save/delete/pause/resume=${outs.map(short).join(' | ')} Run now=${JSON.stringify(run)} file unchanged=${sha(r.files.schedules) === before}`);
        }
    });
    it('S5 S8 S9 S10 S11 S12 S13 S14 S36 S37 S38 S39 S40 S48', async () => {
        const r = mk();
        const long81 = 'x'.repeat(81);
        const w80 = 'y'.repeat(80);
        mkdirSync(join(r.hubDir, 'projects', 'x'), { recursive: true });
        const outside = join(r.dir, 'outside');
        mkdirSync(outside);
        const roots = [r.repo, join(HOME, 'workspace')];
        const cases: [string, string, string][] = [
            ['S5', 'runs task radar', '- name: A\n  runs: { task: radar }\n  when: "0 7 * * *"\n- name: B\n  runs: { task: scout }\n  when: "0 7 * * *"\n'],
            ['S8', 'prompt folders', `- { name: a, runs: { prompt: p, folder: "" } }\n- { name: b, runs: { prompt: p } }\n- { name: c, runs: { prompt: p, folder: projects/x } }\n- { name: d, runs: { prompt: p, folder: /no/such/dir } }\n- { name: e, runs: { prompt: p, folder: hub } }\n- { name: f, runs: { prompt: p, folder: "~/workspace" } }\n`],
            ['S9', 'prompts', `- { name: a, runs: { prompt: "", folder: hub } }\n- { name: b, runs: { prompt: "   ", folder: hub } }\n- { name: c, runs: { prompt: ${JSON.stringify('z'.repeat(100001))}, folder: hub } }\n- { name: d, runs: { prompt: ${JSON.stringify('a\u0007b')}, folder: hub } }\n- { name: e, runs: { prompt: ${JSON.stringify('a\tb\nc "q" $(rm -rf /) ; echo')}, folder: hub } }\n- { name: f, runs: { prompt: "-p x", folder: hub } }\n`],
            ['S10', 'names clash', '- { name: Weekly radar, runs: { task: litwatch } }\n- { name: " weekly RADAR ", runs: { task: scout } }\n'],
            ['S11', 'names', `- { runs: { task: litwatch } }\n- { name: "", runs: { task: litwatch } }\n- { name: ${long81}, runs: { task: litwatch } }\n- { name: ${JSON.stringify('a\u0001b')}, runs: { task: litwatch } }\n`],
            ['S12', 'runs shapes', '- { name: a, runs: { task: litwatch, prompt: x } }\n- { name: b, runs: {} }\n- { name: c, runs: litwatch }\n'],
            ['S13', 'unknown keys', '- { name: a, at: 7, runs: { task: litwatch } }\n- { name: b, runs: { task: litwatch, folder: hub } }\n'],
            ['S14', 'flags', `- { name: a, paused: "yes", runs: { task: litwatch } }\n- { name: b, unattended: 1, runs: { task: litwatch } }\n- { name: c, unattended: true, runs: { command: sync, folder: ${JSON.stringify(r.repo)} } }\n`],
            ['S36', 'when values', '- { name: a, when: "", runs: { task: litwatch } }\n- { name: b, when: , runs: { task: litwatch } }\n- { name: c, when: 5, runs: { task: litwatch } }\n- { name: d, when: [0, 7], runs: { task: litwatch } }\n'],
            ['S37', 'name types', '- { name: 2026, runs: { task: litwatch } }\n- { name: [a], runs: { task: litwatch } }\n- { name: { a: 1 }, runs: { task: litwatch } }\n'],
            ['S38', 'non-map entries', '- just text\n- null\n- { name: ok, runs: { task: litwatch }, when: "0 7 * * *" }\n'],
            ['S39', 'folder empty', `- { name: a, runs: { command: sync } }\n- { name: b, runs: { command: sync, folder: "" } }\n- { name: c, runs: { command: sync, folder: ~ } }\n- { name: d, runs: { prompt: p, folder: ~ } }\n`],
            ['S40', 'unattended false on a command', `- { name: a, unattended: false, runs: { command: sync, folder: ${JSON.stringify(r.repo)} }, when: "0 7 * * *" }\n`],
            ['S48', 'a name of exactly 80', `- { name: ${w80}, runs: { task: litwatch } }\n`],
            ['S49', 'prompt folders served', `- { name: a, runs: { prompt: p, folder: ${JSON.stringify(r.repo)} } }\n- { name: b, runs: { prompt: p, folder: hub } }\n- { name: c, runs: { prompt: p, folder: projects } }\n`],
            ['S50', 'prompt folders not served', `- { name: a, runs: { prompt: p, folder: "~/" } }\n- { name: b, runs: { prompt: p, folder: ${JSON.stringify(outside)} } }\n`]
        ];
        mkdirSync(join(r.hubDir, 'projects'), { recursive: true });
        for (const [c, label, text] of cases) rowsOf(r, text, label, c, roots);
        const readAfter = readSchedules(r.files.schedules, { hub: r.hubDir, roots, commands: r.files.commands });
        void readAfter;
    });
    it('S5-run S6 S7 S41 S26-due', async () => {
        const { vi } = await import('/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js');
        void vi;
        // S6: a saved command scheduled, then deleted from its command bar
        let r = mk();
        r.sessions([], []);
        const cmd = (folder: string) => E('0 7 * * *', { runs: { command: 'sync', folder } });
        let w = r.watch([cmd(r.repo), E('0 7 * * *', {}, 'Task one')]);
        say('S6', `before: command row problem=${JSON.stringify(r.row()!.problem)} next=${r.row()!.next !== null}`);
        writeFileSync(r.files.commands, JSON.stringify({ [r.repo]: [] }));
        w.reload();
        say('S6', `after commands.json lost the command: problem=${JSON.stringify(r.row()!.problem)} next=${r.row()!.next}`);
        // S7 commands.json not JSON
        r = mk({ saved: 'not json' });
        r.sessions([], []);
        w = r.watch([cmd(r.repo), E('0 7 * * *', {}, 'Task one'), E('0 7 * * *', { runs: { prompt: 'p', folder: 'hub' } }, 'Prompt one')]);
        say('S7', `commands.json not JSON: command row problem=${JSON.stringify(r.row()!.problem)}; task row problem=${JSON.stringify(r.row('Task one')!.problem)} next set=${r.row('Task one')!.next !== null}; prompt row problem=${JSON.stringify(r.row('Prompt one')!.problem)} next set=${r.row('Prompt one')!.next !== null}; unread=${JSON.stringify(r.payload()!.unread)}; commands list=${JSON.stringify(r.payload()!.commands)}`);
        // S41 commands.json missing
        r = mk({ saved: null });
        r.sessions([], []);
        w = r.watch([cmd(r.repo), E('0 7 * * *', {}, 'Task one')]);
        say('S41', `commands.json missing: command row problem=${JSON.stringify(r.row()!.problem)}; task row next set=${r.row('Task one')!.next !== null}; unread=${JSON.stringify(r.payload()!.unread)}; commands list=${JSON.stringify(r.payload()!.commands)}`);
    });
    it('S18 S19 S21 S22 S24 S25 S26 S43 S46 S47', async () => {
        const r = mk();
        r.sessions([], []);
        const w = r.watch('# my schedules  \n- name: Weekly radar  # keep this\n  runs: { task: litwatch }\n  when: "0 7 * * 1"\n- name: Other\n  runs: { task: scout }\n');
        const a = api(r, w);
        const rec = () => { const l = loadRecord(r.files.record); return l.ok ? JSON.stringify([...l.logs.keys()]) : 'unread'; };
        // plant a record entry for Weekly radar with a run and handled
        writeFileSync(r.files.record, JSON.stringify({ 'Weekly radar': { pattern: '0 7 * * 1', since: '2026-09-01T00:00:00.000Z', handled: '2026-09-28T05:00:00.000Z', runs: [{ trigger: 'schedule', due: '2026-09-28T05:00:00.000Z', at: '2026-09-28T05:00:01.000Z', outcome: 'started', terminal: 'k1' }] } }));
        // S18 rename through Edit
        const rn = await a.call({ action: 'save', at: 0, was: 'Weekly radar', entry: { ...E('0 7 * * 1'), name: 'Renamed radar' } });
        const l = loadRecord(r.files.record);
        say('S18', `rename: ${short(rn)}; file=${JSON.stringify(readFileSync(r.files.schedules, 'utf8'))}; record keys=${rec()} moved entry handled=${l.ok ? l.logs.get('Renamed radar')?.handled : '?'} runs=${l.ok ? l.logs.get('Renamed radar')?.runs.length : '?'}`);
        // S19 a new schedule under a name the record still holds
        writeFileSync(r.files.record, JSON.stringify({ 'Stale name': { pattern: '0 7 * * *', since: '2026-09-01T00:00:00.000Z', handled: '2026-09-28T05:00:00.000Z', runs: [] } }));
        const nw = await a.call({ action: 'save', at: null, was: null, entry: E('0 7 * * *', {}, 'Stale name') });
        const l2 = loadRecord(r.files.record);
        say('S19', `new schedule under a held record name: ${short(nw)}; record entry now=${l2.ok ? JSON.stringify(l2.logs.get('Stale name') ?? null) : '?'} (dropped before the save)`);
        // S21 presets
        const presets: [string, string][] = [['hour', '0 * * * *'], ['day', '0 7 * * *'], ['week', '30 8 * * 1,3,5'], ['custom', '0 */5 * * *']];
        for (const [label, pattern] of presets) {
            writeFileSync(r.files.schedules, '');
            const s = await a.call({ action: 'save', at: null, was: null, entry: E(pattern, {}, 'P') });
            const text = readFileSync(r.files.schedules, 'utf8');
            const read = readSchedules(r.files.schedules, { hub: r.hubDir, roots: [r.repo], commands: r.files.commands });
            say('S21', `${label}: ${s.status} file=${JSON.stringify(text)} reads back when=${read.ok ? JSON.stringify(read.rows[0].entry?.when) : 'unread'}`);
        }
        const off = await a.call({ action: 'save', at: null, was: null, entry: { name: 'Off one', runs: { task: 'litwatch' }, when: '' } });
        say('S28', `Off writes no when: ${off.status} file tail=${JSON.stringify(readFileSync(r.files.schedules, 'utf8').split('\n').slice(-4).join('\n'))}`);
        // S22
        writeFileSync(r.files.schedules, '');
        const nasty = await a.call({ action: 'save', at: null, was: null, entry: { name: 'a: b # c', runs: { prompt: 'line one\nline # two', folder: 'hub' }, when: '0 7 * * *' } });
        const read22 = readSchedules(r.files.schedules, { hub: r.hubDir, roots: [r.repo], commands: r.files.commands });
        say('S22', `${nasty.status} file=${JSON.stringify(readFileSync(r.files.schedules, 'utf8'))} read back name=${read22.ok ? JSON.stringify(read22.rows[0].name) : '?'} prompt=${read22.ok ? JSON.stringify((read22.rows[0].entry!.runs as any).prompt) : '?'}`);
        // S24
        writeFileSync(r.files.schedules, '- name: A\n  runs: { task: litwatch }\n');
        const b24 = sha(r.files.schedules);
        const no = await a.call({ action: 'delete', at: 0, name: 'A' }, 'wrong');
        const none = await a.call({ action: 'delete', at: 0, name: 'A' }, '');
        say('S24', `wrong token: ${short(no)}; empty token: ${short(none)}; file unchanged=${sha(r.files.schedules) === b24}`);
        // S25 stale at
        writeFileSync(r.files.schedules, '- name: First\n  runs: { task: litwatch }\n- name: A\n  runs: { task: scout }\n');
        w.reload();
        const b25 = sha(r.files.schedules);
        const stale = await a.call({ action: 'save', at: 0, was: 'A', entry: E('0 9 * * *', {}, 'A') });
        const staleDel = await a.call({ action: 'delete', at: 0, name: 'A' });
        say('S25', `stale at: save ${short(stale)} ; delete ${short(staleDel)}; file unchanged=${sha(r.files.schedules) === b25}`);
        // S26
        const b26 = sha(r.files.commands);
        mkdirSync(join(r.repo, '.oculus'), { recursive: true });
        writeFileSync(join(r.repo, '.oculus', 'commands.yml'), 'commands:\n  - name: build\n    run: echo built\n');
        writeFileSync(r.files.commands, JSON.stringify({ [r.repo]: [{ name: 'sync', run: 'echo synced' }, { name: 'openfile', run: 'cat ${file}' }, { name: 'chain', run: 'echo chain', depends_on: ['build'] }] }));
        writeFileSync(r.files.schedules, '');
        const withFile = await a.call({ action: 'save', at: null, was: null, entry: E('0 7 * * *', { runs: { command: 'openfile', folder: r.repo } }, 'F') });
        const chain = await a.call({ action: 'save', at: null, was: null, entry: E('0 7 * * *', { runs: { command: 'chain', folder: r.repo } }, 'C') });
        say('S26', `command with ${'${file}'}: ${short(withFile)}; command depending on an unapproved file command: ${short(chain)} (commands.json unchanged by saves=${sha(r.files.commands) !== b26 ? 'n/a' : 'yes'})`);
        // S43 record unread
        writeFileSync(r.files.schedules, '- name: A\n  runs: { task: litwatch }\n');
        w.reload();
        writeFileSync(r.files.record, '{');
        const bs = sha(r.files.schedules);
        const br = sha(r.files.record);
        const o43 = [await a.call({ action: 'save', at: null, was: null, entry: E('0 7 * * *', {}, 'N') }), await a.call({ action: 'save', at: 0, was: 'A', entry: E('0 7 * * *', {}, 'Renamed') }), await a.call({ action: 'delete', at: 0, name: 'A' })];
        const pz = await a.call({ action: 'pause', at: 0, name: 'A' });
        say('S43', `record unread: save/rename/delete=${o43.map(short).join(' | ')}; pause (not a record write)=${short(pz)}; record unchanged=${sha(r.files.record) === br}; schedules.yml after those three (before the pause)... see pause`);
        say('S43', `schedules.yml unchanged by save, rename and delete: ${(() => { const t = readFileSync(r.files.schedules, 'utf8'); return t.includes('paused') ? 'changed only by the pause' : sha(r.files.schedules) === bs; })()}`);
        // S46
        writeFileSync(r.files.record, '{}');
        writeFileSync(r.files.schedules, '- name: A\n  runs: { task: litwatch }\n');
        const bb = sha(r.files.schedules);
        const o46: string[] = [];
        for (const body of [{ action: 'nonsense' }, [], 'x', null, {}, { action: 'save' }, { action: 'delete', at: -1, name: 'A' }]) o46.push(`${JSON.stringify(body)} -> ${short(await a.call(body))}`);
        say('S46', `${o46.join(' ; ')}; file unchanged=${sha(r.files.schedules) === bb}`);
        // S47
        writeFileSync(r.files.schedules, '- name: A\n  runs: { task: litwatch }\n  paused: true\n- name: B\n  runs: { task: scout }\n');
        w.reload();
        writeFileSync(r.files.record, '{}');
        const b47 = sha(r.files.schedules);
        const c0 = a.changes();
        const p1 = await a.call({ action: 'pause', at: 0, name: 'A' });
        const p2 = await a.call({ action: 'resume', at: 1, name: 'B' });
        say('S47', `pause of a paused entry: ${short(p1)}; resume of one not paused: ${short(p2)}; file unchanged=${sha(r.files.schedules) === b47}; change-log lines added=${a.changes() - c0}`);
        // S10 rename onto a held name
        writeFileSync(r.files.schedules, '- name: A\n  runs: { task: litwatch }\n- name: B\n  runs: { task: scout }\n');
        w.reload();
        const dup = await a.call({ action: 'save', at: 1, was: 'B', entry: E('0 7 * * *', { runs: { task: 'scout' } }, ' a ') });
        say('S10', `rename B onto held name A: ${short(dup)}`);
        // S44
        writeFileSync(r.files.schedules, '- name: A\n  runs: { task: litwatch }\n');
        w.reload();
        const c44 = r.created();
        const rec44 = JSON.stringify(r.runs('Gone'));
        const r44 = await a.call({ action: 'run', name: 'Gone' });
        say('S44', `Run now on a name no entry holds: ${short(r44)} new-session calls added=${r.created() - c44} runs recorded under that name=${r.runs('Gone').length} (${rec44})`);
    });
    it('S20', async () => {
        const base = [
            ['trailing comment after two spaces', '# header  \n- name: Weekly radar  # why\n  runs: { task: litwatch }   # which\n  when: "0 7 * * 1"  # monday\n- name: Other\n  runs: { task: scout }\n  when: "0 9 * * *"\n- name: Third\n  runs: { task: inbox }\n'],
            ['flow map without inner spaces', '- name: Weekly radar\n  runs: {task: litwatch}\n  when: "0 7 * * 1"\n- name: Other\n  runs: {task: scout}\n  when: "0 9 * * *"\n- name: Third\n  runs: {task: inbox}\n'],
            ['entries indented by 4 spaces', 'x: 1\n'.slice(0, 0) + '    - name: Weekly radar\n      runs: { task: litwatch }\n      when: "0 7 * * 1"\n    - name: Other\n      runs: { task: scout }\n      when: "0 9 * * *"\n    - name: Third\n      runs: { task: inbox }\n']
        ] as const;
        for (const [label, text] of base) {
            for (const kind of ['save', 'delete', 'pause', 'resume']) {
                const r = mk();
                r.sessions([], []);
                const w = r.watch(text);
                const a = api(r, w);
                writeFileSync(r.files.record, JSON.stringify({ Other: { pattern: '0 9 * * *', since: '2026-09-01T00:00:00.000Z', handled: null, runs: [] } }));
                const targetName = 'Other';
                const body = kind === 'save' ? { action: 'save', at: 1, was: 'Other', entry: E('0 10 * * *', { runs: { task: 'scout' } }, 'Other') } : { action: kind, at: 1, name: targetName };
                if (kind === 'resume') {
                    // resume needs a paused entry: pause first (a separate write)
                    await a.call({ action: 'pause', at: 1, name: targetName });
                }
                const before = readFileSync(r.files.schedules, 'utf8');
                const answer = await a.call(body);
                const after = readFileSync(r.files.schedules, 'utf8');
                writeFileSync(join(r.dir, 'before.txt'), before);
                writeFileSync(join(r.dir, 'after.txt'), after);
                let diff = '';
                try { execFileSync('diff', [join(r.dir, 'before.txt'), join(r.dir, 'after.txt')]); } catch (e) { diff = (e as { stdout: Buffer }).stdout.toString(); }
                const read = readSchedules(r.files.schedules, { hub: r.hubDir, roots: [r.repo], commands: r.files.commands });
                const names = read.ok ? read.rows.map((x) => `${x.name}${x.entry?.paused ? '(paused)' : ''}${x.entry?.when ? ' ' + x.entry.when : ''}`).join(', ') : 'unread';
                const rec = loadRecord(r.files.record);
                say('S20', `${label}, ${kind} of Other: ${answer.status}; list read back: ${names}; record has Other=${rec.ok && rec.logs.has('Other')}; diff of the two texts:\n${diff.trimEnd().split('\n').map((l) => '        ' + l).join('\n')}`);
                r.closeAll();
            }
        }
    });
    it('S20-ends', async () => {
        const four = '    - name: Weekly radar\n      runs: { task: litwatch }\n      when: "0 7 * * 1"\n    - name: Other\n      runs: { task: scout }\n      when: "0 9 * * *"\n    - name: Third\n      runs: { task: inbox }\n';
        const two = '# header  \n- name: Weekly radar  # why\n  runs: { task: litwatch }   # which\n  when: "0 7 * * 1"  # monday\n- name: Other\n  runs: { task: scout }\n  when: "0 9 * * *"\n- name: Third\n  runs: { task: inbox }\n';
        for (const [label, text] of [['4-space list', four], ['2-space list with comments', two]] as const) {
            for (const [at, name] of [[0, 'Weekly radar'], [1, 'Other'], [2, 'Third']] as const) {
                const r = mk();
                r.sessions([], []);
                const w = r.watch(text);
                const a = api(r, w);
                const answer = await a.call({ action: 'delete', at, name });
                const after = readFileSync(r.files.schedules, 'utf8');
                writeFileSync(join(r.dir, 'before.txt'), text);
                writeFileSync(join(r.dir, 'after.txt'), after);
                let diff = '';
                try { execFileSync('diff', [join(r.dir, 'before.txt'), join(r.dir, 'after.txt')]); } catch (e) { diff = (e as { stdout: Buffer }).stdout.toString(); }
                const read = readSchedules(r.files.schedules, { hub: r.hubDir, roots: [r.repo], commands: r.files.commands });
                say('S20', `${label}, delete of ${name} (position ${at}): ${answer.status}; list read back: ${read.ok ? read.rows.map((x) => x.name).join(', ') : 'unread'}; diff:\n${diff.trimEnd().split('\n').map((l) => '        ' + l).join('\n')}`);
                r.closeAll();
            }
        }
    });
    it('S20-run', async () => {
        const r = mk();
        r.sessions([{ id: 'aabbcc-claude', pid: 4300 }], [{ pid: 4300, liveStatus: 'busy' }]);
        const w = r.watch([E('0 7 * * *')]);
        const a = api(r, w);
        const first = await w.runNow(NAME);
        const started = r.created();
        const del = await a.call({ action: 'delete', at: 0, name: NAME });
        const l = loadRecord(r.files.record);
        say('S20', `delete of a schedule whose run is going: Run now ${JSON.stringify(first)}; delete ${short(del)}; kill-session calls=${r.killed().length}; new-session calls=${started}; record entry dropped=${l.ok && !l.logs.has(NAME)}; rows in the payload=${r.payload()!.schedules.length}`);
    });
    it('S35 S45 S15 S16 S17 S49 S50 S51', async () => {
        const { vi } = await import('/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js');
        void vi;
        // S16, S45, S17 with Run now on real timers; the earlier terminal listed busy/idle
        let r = mk();
        r.sessions([{ id: 'aabbcc-claude', pid: 4300 }], [{ pid: 4300, liveStatus: 'busy' }]);
        writeFileSync(r.files.record, JSON.stringify({ [NAME]: { pattern: '', since: '2026-09-01T00:00:00.000Z', handled: null, runs: [{ trigger: 'hand', due: null, at: '2026-09-28T05:00:01.000Z', outcome: 'started', terminal: 'aabbcc-claude' }] } }));
        let w = r.watch([E('0 7 * * *')]);
        const busy = await w.runNow(NAME);
        say('S16', `Run now while the earlier run is working: ${JSON.stringify(busy)} new-session=${r.created()} newest run=${JSON.stringify(r.runs()[0])}`);
        r.sessions([{ id: 'aabbcc-claude', pid: 4300 }], [{ pid: 4300, liveStatus: 'idle' }]);
        const idle = await w.runNow(NAME);
        const k = r.driver.calls.findIndex((c) => c[0] === 'kill-session');
        const n = r.driver.calls.findIndex((c) => c.includes('new-session'));
        say('S16', `Run now while idle: ${JSON.stringify(idle)} kill-session at call ${k}, new-session at call ${n}`);
        // S45 two presses in a row on an idle schedule
        r = mk();
        r.sessions([], []);
        w = r.watch([E(undefined)]);
        const [p1, p2] = await Promise.all([w.runNow(NAME), w.runNow(NAME)]);
        say('S45', `two Run now presses in a row (both issued before either settles): ${JSON.stringify(p1)} / ${JSON.stringify(p2)} new-session=${r.created()} runs=${r.runs().map(runShort).join(' ')}`);
        const p3 = await w.runNow(NAME);
        say('S45', `a third press after the first started (its terminal is not listed yet as working): ${JSON.stringify(p3)}`);
        // S17
        r = mk();
        r.sessions([], []);
        w = r.watch([E('nonsense')]);
        say('S17', `Run now on an entry with a problem: ${JSON.stringify(await w.runNow(NAME))}`);
        writeFileSync(r.files.record, '{');
        w.reload();
        r.set(w, [E('0 7 * * *')]);
        say('S17', `Run now while the record does not read: ${JSON.stringify(await w.runNow(NAME))}`);
        // S15 paused
        r = mk();
        r.sessions([], []);
        w = r.watch([E('0 7 * * *', { paused: true })]);
        const row = r.row()!;
        say('S15', `paused entry: next=${row.next} paused=${row.entry.paused} runs=${row.runs.length} record exists=${existsSync(r.files.record)}; Run now while paused: ${JSON.stringify(await w.runNow(NAME))}`);
        // S35 proto names
        r = mk();
        r.sessions([], []);
        const names = ['__proto__', 'constructor', 'toString'];
        w = r.watch(names.map((n) => E(undefined, {}, n)));
        for (const n of names) await w.runNow(n);
        const text = readFileSync(r.files.record, 'utf8');
        const parsed = loadRecord(r.files.record);
        say('S35', `three schedules named __proto__, constructor and toString each run once from Run now: record keys=${parsed.ok ? JSON.stringify([...parsed.logs.keys()]) : 'unread'} runs per key=${parsed.ok ? JSON.stringify([...parsed.logs.values()].map((l) => l.runs.length)) : '?'}; raw file keys=${JSON.stringify(Object.keys(JSON.parse(text)))}`);
        // rename constructor
        const a = api(r, w);
        const rn = await a.call({ action: 'save', at: 1, was: 'constructor', entry: E(undefined, {}, 'ctor renamed') });
        const p2r = loadRecord(r.files.record);
        say('S35', `Edit renaming constructor: ${short(rn)} record keys=${p2r.ok ? JSON.stringify([...p2r.logs.keys()]) : '?'}; clash among the three: ${JSON.stringify(r.payload()!.schedules.map((x) => x.problem?.word ?? null))}`);
        // S49/S50/S51 starts
        const sub = join(r.hubDir, 'projects', 'p1');
        mkdirSync(sub, { recursive: true });
        const outside = join(r.dir, 'outside');
        mkdirSync(outside);
        const roots = { value: [r.repo] };
        r = mk({ roots: () => roots.value });
        r.sessions([], []);
        const mkdirSub = join(r.hubDir, 'projects', 'p1');
        mkdirSync(mkdirSub, { recursive: true });
        const outside2 = join(r.dir, 'outside');
        mkdirSync(outside2);
        roots.value = [r.repo];
        const prompt = (folder: string, name: string) => E(undefined, { runs: { prompt: 'hello', folder } }, name);
        w = r.watch([prompt(r.repo, 'in root'), prompt('hub', 'hub'), prompt(mkdirSub, 'project'), prompt(outside2, 'outside'), prompt('~/', 'home')]);
        const results: string[] = [];
        for (const n of ['in root', 'hub', 'project', 'outside', 'home']) {
            const before = r.created();
            const answer = await w.runNow(n);
            const start = r.driver.calls.filter((c) => c.includes('new-session'))[before];
            results.push(`${n}: ${JSON.stringify(answer).replace(/\/private\S*?\/(hub|repo|outside)/g, '<$1>')}${start ? ' cwd=' + start[start.indexOf('-c') + 1].replace(/\/private\S*?\/(hub|repo|outside)/g, '<$1>') : ' nothing started'}`);
        }
        say('S49', results.join(' ; '));
        // S51: a root no longer served at the due time
        const { vi: v2 } = await import('/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js');
        void v2;
        r = mk({ roots: () => roots.value });
        r.sessions([], []);
        roots.value = [r.repo];
        w = r.watch([prompt(r.repo, 'in root')]);
        roots.value = [];
        const gone = await w.runNow('in root');
        say('S51', `root no longer served when the run starts (watcher not reloaded): Run now=${JSON.stringify(gone).replace(/\/private\S*?\/(hub|repo)/g, '<$1>')} new-session=${r.created()}; after the next read the row shows: ${(() => { w.reload(); return JSON.stringify(r.row('in root')!.problem).replace(/\/private\S*?\/(hub|repo)/g, '<$1>'); })()}`);
    });
});
```

### store.svelte-probe.ts

```
// Final run of the store cases S27, S28, S29, S31, S32 (store half) and S10 (dialog half), and the
// tray text for C27, over the real createSchedule.
import { writeFileSync } from 'node:fs';
import { afterAll, describe, it, vi } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/node_modules/vitest/dist/index.js';
import { render } from 'svelte/server';
import '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/tests/shell/rail/rail-fixture.ts';
import { clientContext, emptyClient } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/tests/fixtures/client.ts';
import UpdateTray from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/shell/rail/UpdateTray.svelte';
import { createSchedule } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/state/system/machine/schedule.svelte.ts';
import { cronRuns } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/data/helpers/run/cron.ts';
import { patternOf, whenOf } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus/src/lib/state/system/machine/schedule-when.ts';

const lines: string[] = [];
const say = (c: string, s: string) => { lines.push(`${c} ${s}`); process.stdout.write(`${c} ${s}\n`); };
afterAll(() => writeFileSync('/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3/final/store.out', lines.join('\n') + '\n'));
const text = (html: string) => html.replace(/<\/(div|li|p|header|h2|button)>/g, '$&\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/[ \t]+/g, ' ').split('\n').map((l) => l.trim()).filter((l) => l !== '');

type Row = { at: number; name: string; entry: any; problem: any; next: string | null; runs: any[] };
const row = (at: number, name: string, when: string, task: string, over: Partial<Row> = {}): Row => {
    const next = cronRuns(when, 1, new Date());
    return { at, name, entry: { name, runs: { task }, when, paused: false, unattended: false }, problem: null, next: next.ok ? next.runs[0].toISOString() : null, runs: [], ...over };
};
function store(rows: Row[], posts: { url: string; body: any }[] = [], answer: any = { ok: true, failed: null, body: { ok: true } }) {
    let payload: any = { schedules: rows, commands: [{ folder: '/r/repo', name: 'sync' }], folders: ['/h', '/r/repo'], unread: [] };
    const s = createSchedule({ schedule: () => payload } as never, { terminalById: () => null, writes: { postCommand: async (url: string, body: unknown) => { posts.push({ url, body }); return answer; } } as never });
    return { s, set: (p: any) => { payload = p; } };
}

describe('final run, store', () => {
    it('S27', () => {
        vi.useFakeTimers({ now: new Date(2026, 9, 5, 12, 0, 0) });
        const weekly = row(0, 'Weekly radar', '0 7 * * 3', 'litwatch');
        const daily = row(1, 'Daily radar', '0 9 * * *', 'litwatch');
        let { s } = store([weekly, daily]);
        say('S27', `Monday 2026-10-05 12:00, two schedules: ${s.nextOfTask('litwatch')}`);
        ({ s } = store([weekly, { ...daily, entry: { ...daily.entry, paused: true }, next: null }]));
        say('S27', `Daily radar paused: ${s.nextOfTask('litwatch')}`);
        ({ s } = store([weekly, { ...daily, problem: { word: 'when-unreadable', names: ['x'] }, next: null }]));
        say('S27', `Daily radar holding a problem: ${s.nextOfTask('litwatch')}`);
        const tie = row(1, 'Second', '0 9 * * *', 'litwatch');
        ({ s } = store([row(0, 'First', '0 9 * * *', 'litwatch'), tie]));
        say('S27', `two equal next runs: ${s.nextOfTask('litwatch')}`);
        ({ s } = store([row(0, 'Other', '0 9 * * *', 'scout')]));
        say('S27', `no schedule for the task: ${s.nextOfTask('litwatch')} | scout: ${s.nextOfTask('scout')}`);
        vi.useRealTimers();
    });
    it('S28', () => {
        vi.useFakeTimers({ now: new Date(2026, 9, 5, 12, 0, 0) });
        const posts: { url: string; body: any }[] = [];
        const { s } = store([], posts);
        const draftWith = (patch: object) => { s.openDialog({ task: 'litwatch', name: 'X' }); s.edit(patch as never); return s.dialog()!; };
        const tryIt = async (label: string, patch: object) => {
            const d = draftWith(patch);
            const problems = s.check(d);
            const prev = s.preview(d);
            const before = posts.length;
            if (problems.length === 0) await s.save(d);
            say('S28', `${label}: pattern posted=${posts.length > before ? JSON.stringify(posts[posts.length - 1].body.entry.when) : 'none (refused)'}; check=${JSON.stringify(problems)}; preview=${JSON.stringify(prev)}`);
        };
        return (async () => {
            await tryIt('Every hour', { when: 'hour' });
            await tryIt('Every day at 07:00', { when: 'day', time: '07:00' });
            await tryIt('Weekly Mon, Wed, Fri at 08:30', { when: 'week', time: '08:30', days: [true, false, true, false, true, false, false] });
            await tryIt('Weekly with no day', { when: 'week', time: '08:30', days: [false, false, false, false, false, false, false] });
            for (const time of ['7:5', '25:00', '07:60']) await tryIt(`Every day at ${time}`, { when: 'day', time });
            await tryIt('Custom 61 * * * *', { when: 'custom', pattern: '61 * * * *' });
            await tryIt('Custom 0 0 31 2 *', { when: 'custom', pattern: '0 0 31 2 *' });
            await tryIt('Off', { when: 'off' });
            vi.useRealTimers();
        })();
    });
    it('S29', () => {
        for (const p of ['0 7 * * 1', '0 * * * *', '@daily', '0 7 * * MON', '00 7 * * *', '0 7 * * 1-5']) {
            const { s } = store([row(0, 'A', p, 'litwatch')]);
            s.openDialog({ at: 0 });
            const d = s.dialog()!;
            say('S29', `${p}: opens ${d.when}, time ${d.time}, days ${d.days.map((x: boolean, i: number) => (x ? s.dayNames()[i] : null)).filter(Boolean).join('/') || '-'}, pattern ${JSON.stringify(d.pattern)}; whenOf direct=${JSON.stringify(whenOf(p))}`);
        }
        void patternOf;
    });
    it('S31 S32 S10 S18', async () => {
        const posts: { url: string; body: any }[] = [];
        const { s, set } = store([row(0, 'Lit Watch', '0 7 * * *', 'litwatch')], posts);
        s.openDialog({ task: 'litwatch', name: 'Lit Watch' });
        const d = s.dialog()!;
        say('S31', `Schedule... on Lit Watch opens: kind=${d.kind} task=${d.task} name=${JSON.stringify(d.name)} unattended=${d.unattended}; check while a schedule holds that name=${JSON.stringify(s.check(d))}`);
        s.edit({ name: 'Lit Watch 2' });
        say('S31', `after the name changes: check=${JSON.stringify(s.check(s.dialog()!))}`);
        s.closeDialog();
        s.openDialog({ command: 'sync', folder: '/r/repo', name: 'sync' });
        const c = s.dialog()!;
        say('S32', `Schedule... on a saved command opens: kind=${c.kind} commandKey=${c.commandKey} name=${JSON.stringify(c.name)} commands()=${JSON.stringify(s.commands())} check=${JSON.stringify(s.check(c))}`);
        const saved = await s.save(c);
        say('S32', `Save: ${JSON.stringify(saved)} dialog after=${s.dialog() === null ? 'closed' : 'open'} posted=${JSON.stringify(posts[posts.length - 1])}`);
        s.openDialog({ task: 'scout', name: 'Weekly radar' });
        s.edit({ unattended: true });
        const refused = store([], [], { ok: false, failed: null, body: { error: 'name-twice', names: ['Weekly radar'] } });
        refused.s.openDialog({ task: 'scout', name: 'Weekly radar' });
        const r = await refused.s.save(refused.s.dialog()!);
        say('S10', `server refusal said in words: ${JSON.stringify(r)}; dialog stays open=${refused.s.dialog() !== null}`);
        const clash = store([row(0, 'Weekly radar', '0 7 * * *', 'litwatch'), row(1, 'B', '0 7 * * *', 'scout')]);
        clash.s.openDialog({ at: 1 });
        clash.s.edit({ name: ' weekly RADAR ' });
        say('S10', `rename of B onto a held name: check=${JSON.stringify(clash.s.check(clash.s.dialog()!))}`);
        void set;
    });
    it('C27', () => {
        const client = emptyClient();
        say('C27', 'tray before any schedule message:');
        for (const l of text(render(UpdateTray, { props: { open: true, onclose: () => undefined }, context: clientContext(client) }).body)) say('C27', '    | ' + l);
    });
});

const controls = (html: string) =>
    [...html.matchAll(/<(input|select|textarea|option)\b([^>]*)>/g)]
        .map((m) => `<${m[1]}${[...m[2].matchAll(/\b(type|value|checked|selected|aria-label|disabled)(?:="([^"]*)")?/g)].map((a) => ' ' + a[1] + (a[2] !== undefined ? '=' + JSON.stringify(a[2]) : '')).join('')}>`);

function payloadFor(rows: Row[], extra: object = {}) {
    return { schedules: rows, commands: [{ folder: '/r/repo', name: 'sync' }], folders: ['/h', '/r/repo'], unread: [], ...extra };
}

describe('final run, tray text (server render of UpdateTray, ScheduleList and ScheduleDialog)', () => {
    it('S3 S16 S27 list', () => {
        vi.useFakeTimers({ now: new Date(2026, 9, 5, 12, 0, 0), toFake: ['Date'] });
        const client = emptyClient();
        const ok = row(0, 'Weekly radar', '0 7 * * 3', 'litwatch', { runs: [{ trigger: 'schedule', due: new Date(2026, 9, 5, 7).toISOString(), at: new Date(2026, 9, 5, 7).toISOString(), outcome: 'started', terminal: 'zz' }] });
        const paused = row(1, 'Daily radar', '0 9 * * *', 'litwatch', { next: null, entry: { name: 'Daily radar', runs: { task: 'litwatch' }, when: '0 9 * * *', paused: true, unattended: false } });
        const bad = row(2, 'Broken', 'nonsense', 'scout', { next: null, problem: { word: 'when-unreadable', names: ['nonsense'] } });
        const off = row(3, 'Hand only', '', 'inbox', { next: null, entry: { name: 'Hand only', runs: { task: 'inbox' }, when: '', paused: false, unattended: false } });
        client.entities.receive({ channel: 'schedule', version: 1, payload: payloadFor([ok, paused, bad, off]) } as never);
        say('S16', 'tray with four rows (running-task row with a run, paused, problem, Off):');
        for (const l of text(render(UpdateTray, { props: { open: true, onclose: () => undefined }, context: clientContext(client) }).body)) say('S16', '    | ' + l);
        const none = emptyClient();
        none.entities.receive({ channel: 'schedule', version: 1, payload: payloadFor([]) } as never);
        say('S1', 'tray with a schedules file that reads and holds no entry:');
        for (const l of text(render(UpdateTray, { props: { open: true, onclose: () => undefined }, context: clientContext(none) }).body).slice(0, 5)) say('S1', '    | ' + l);
        const unread = emptyClient();
        unread.entities.receive({ channel: 'schedule', version: 1, payload: payloadFor([], { unread: [{ file: 'schedules', line: 2 }, { file: 'record', line: null }, { file: 'commands', line: null }] }) } as never);
        say('S3', 'tray with all three files unread:');
        for (const l of text(render(UpdateTray, { props: { open: true, onclose: () => undefined }, context: clientContext(unread) }).body).slice(0, 8)) say('S3', '    | ' + l);
        vi.useRealTimers();
    });
    it('S30 dialog', () => {
        const draw = (fill: object, patch: object = {}) => {
            const client = emptyClient();
            client.entities.receive({ channel: 'schedule', version: 1, payload: payloadFor([]) } as never);
            client.schedule.openDialog(fill as never);
            client.schedule.edit(patch as never);
            return render(UpdateTray, { props: { open: true, onclose: () => undefined }, context: clientContext(client) }).body;
        };
        const checkboxOf = (html: string) => controls(html).filter((c) => c.startsWith('<input type="checkbox"'));
        say('S30', `Add schedule on a task, defaults: checkboxes ${JSON.stringify(checkboxOf(draw({ task: 'litwatch', name: 'Lit Watch' })))}`);
        say('S30', `Runs Saved command: checkboxes ${JSON.stringify(checkboxOf(draw({ command: 'sync', folder: '/r/repo', name: 'sync' })))}`);
        say('S30', `Runs Prompt: checkboxes ${JSON.stringify(checkboxOf(draw({ task: 'litwatch' }, { kind: 'prompt' })))}`);
        const on = text(draw({ task: 'litwatch', name: 'x' }, { unattended: true }));
        say('S30', `unattended on, the note: ${JSON.stringify(on.filter((l) => /unattended|permission/i.test(l)))}`);
        const off = text(draw({ task: 'litwatch', name: 'x' }));
        say('S30', `unattended off, lines mentioning it: ${JSON.stringify(off.filter((l) => /unattended|permission/i.test(l)))}`);
        const html = draw({ task: 'litwatch', name: 'Lit Watch' });
        say('S31', `dialog from Schedule... on Lit Watch, text: ${JSON.stringify(text(html).filter((l) => /Add schedule|Runs|Task|Name|When|Every|Update task|Lit Watch/.test(l)).slice(0, 14))}`);
        say('S31', `dialog controls: ${JSON.stringify(controls(html).filter((c) => !c.startsWith('<option') || c.includes('selected')))}`);
        const cmd = draw({ command: 'sync', folder: '/r/repo', name: 'sync' });
        say('S32', `dialog from the command bar: controls ${JSON.stringify(controls(cmd).filter((c) => !c.startsWith('<option') || c.includes('selected')))}; the tray text is drawn with it: ${text(cmd).includes('Update tasks')}`);
    });
    it('dialog fields by choice', () => {
        vi.useFakeTimers({ now: new Date(2026, 9, 5, 12, 0, 0), toFake: ['Date'] });
        const draw = (patch: object) => {
            const client = emptyClient();
            client.entities.receive({ channel: 'schedule', version: 1, payload: payloadFor([]) } as never);
            client.schedule.openDialog({ task: 'litwatch', name: 'x' } as never);
            client.schedule.edit(patch as never);
            return render(UpdateTray, { props: { open: true, onclose: () => undefined }, context: clientContext(client) }).body;
        };
        const fields = (html: string) => text(html).filter((l) => /^(Add schedule|Runs|Task|Command|Prompt|Folder|When|Time|Days|Cron pattern|Pattern|Next runs|The |Choose|Run unattended|Save)/.test(l));
        const checks = (html: string) => controls(html).filter((c) => c.startsWith('<input type="checkbox"')).length;
        for (const [label, patch] of [['Every hour', { when: 'hour' }], ['Every day', { when: 'day' }], ['Weekly Mon Wed Fri', { when: 'week', time: '08:30', days: [true, false, true, false, true, false, false] }], ['Weekly no day', { when: 'week' }], ['Custom 61 * * * *', { when: 'custom', pattern: '61 * * * *' }], ['Custom 0 0 31 2 *', { when: 'custom', pattern: '0 0 31 2 *' }], ['Prompt', { kind: 'prompt', prompt: 'Summarise', folder: 'hub' }]] as const) {
            const html = draw(patch);
            say('S28', `dialog When/kind ${label}: lines ${JSON.stringify(fields(html))}; checkboxes drawn=${checks(html)}; text inputs/areas ${JSON.stringify(controls(html).filter((c) => /^<(input type="text"|textarea)/.test(c)))}`);
        }
        vi.useRealTimers();
    });
});
```

### tmux.mts

```
// Final C1, C20 (tray press), C36 and C35: a scratch tmux server under its own TMUX_TMPDIR, the stub claude,
// the real startUpdateTask, runEntry, watchSchedules, scan and the one-run rule.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
const WT = '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus';
const SP = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3';
const TMPDIR = '/private/tmp/claude-502/a3b';
mkdirSync(TMPDIR, { recursive: true });
const socket = `${TMPDIR}/tmux-final.sock`;
process.env.TMUX_TMPDIR = TMPDIR;
const RUNDIR = `${SP}/final-run/tmux`;
rmSync(RUNDIR, { recursive: true, force: true });
mkdirSync(RUNDIR, { recursive: true });
process.env.STUB_ACCOUNT = `${RUNDIR}/account`;
process.env.STUB_BUSY_SECONDS = '6';
mkdirSync(process.env.STUB_ACCOUNT, { recursive: true });
const { startTerminal, stopTerminal, listTerminals, newId } = await import(`${WT}/src/lib/server/machine/pty/sessions.ts`);
const { run } = await import(`${WT}/src/lib/server/machine/pty/tmux.ts`);
const { startUpdateTask } = await import(`${WT}/src/lib/server/machine/schedules/task.ts`);
const { runEntry } = await import(`${WT}/src/lib/server/machine/schedules/run.ts`);
const { watchSchedules } = await import(`${WT}/src/lib/server/machine/schedules/watch.ts`);
const { loadRecord } = await import(`${WT}/src/lib/server/machine/schedules/record.ts`);
const { Hub } = await import(`${WT}/src/lib/server/core/channels.ts`);
const { sessions } = await import(`${WT}/src/lib/server/sessions/index.ts`);
const opts = { socket };
const out: string[] = [];
const say = (s: string) => { out.push(s); console.log(s); };
const ps = (pid: number) => execFileSync('ps', ['-o', 'ppid=', '-p', String(pid)]).toString().trim();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STUB = `${SP}/stub/claude`;
const q = (s: string) => `'${s}'`;
const ACC = process.env.STUB_ACCOUNT!;
const scanOpts = { stores: [`${ACC}/projects`], registries: [`${ACC}/sessions`], cachePath: `${RUNDIR}/cache.json`, overridesPath: `${RUNDIR}/overrides.json` };
const payloadNow = async () => sessions({ ...scanOpts, terminals: await listTerminals(opts) });

{
    const id = newId('claude');
    const t = await startTerminal({ id, kind: 'claude', cwd: RUNDIR, cols: 80, rows: 24, name: 'task litwatch' }, { ...opts, command: `${q(STUB)} ${q('/research-cockpit litwatch')}` });
    await wait(1500);
    const text = await run(['capture-pane', '-p', '-t', `oculus-${id}`], opts);
    const printed = Number(/STUB PID=(\d+)/.exec(text)?.[1]);
    say(`C1 pane_pid=${t.pid} printed $$=${printed} ppid(printed)=${ps(printed)}; pane pid equals the printed pid: ${t.pid === printed}; pane pid is the parent of the printed pid: ${Number(ps(printed)) === t.pid}`);
    await stopTerminal(id, opts);
}

// C20: a tray press while the record does not read
writeFileSync(`${RUNDIR}/record-bad.json`, '{');
const press = await startUpdateTask('litwatch', false, { ...opts, hub: RUNDIR, claudeBin: STUB, size: { cols: 80, rows: 24 } });
say(`C20 tray press with a schedule record that does not read (the press takes no record): ${'terminal' in press ? 'started ' + press.terminal.id : JSON.stringify(press)}; record file untouched: ${readFileSync(`${RUNDIR}/record-bad.json`, 'utf8') === '{'}`);
const t1 = 'terminal' in press ? press.terminal : null;
if (t1 === null) throw new Error('no terminal');
await wait(2000);
say(`C36 start: terminal ${t1.id} pane pid ${t1.pid}; pane shows: ${(await run(['capture-pane', '-p', '-t', `oculus-${t1.id}`], opts)).split('\n').filter(Boolean).join(' | ')}`);
let p = await payloadNow();
say(`C36 scan while the stub reports busy: ${JSON.stringify(p.records.filter((r: any) => r.pid !== null).map((r: any) => ({ pid: r.pid, liveStatus: r.liveStatus })))}; listed terminal pid ${JSON.stringify((await listTerminals(opts)).map((x: any) => ({ id: x.id, pid: x.pid })))}; scan pid equals the pane pid: ${p.records.some((r: any) => r.pid === t1.pid)}`);

const entryText = '- name: Weekly radar\n  runs: { task: litwatch }\n  when: "* * * * *"\n';
const oneRun = async (label: string, payload: any) => {
    const dir = `${RUNDIR}/${label}`;
    mkdirSync(dir, { recursive: true });
    const files = { schedules: `${dir}/schedules.yml`, record: `${dir}/schedule.json`, commands: `${dir}/commands.json` };
    writeFileSync(files.schedules, entryText);
    writeFileSync(files.commands, '{}');
    const day = 86_400_000;
    writeFileSync(files.record, JSON.stringify({ 'Weekly radar': { pattern: '* * * * *', since: new Date(Date.now() - 2 * day).toISOString(), handled: new Date(Date.now() - day).toISOString(), runs: [{ trigger: 'schedule', due: new Date(Date.now() - day).toISOString(), at: new Date(Date.now() - day).toISOString(), outcome: 'started', terminal: t1.id }] } }));
    const hub = new Hub();
    hub.publish('sessions', payload);
    const w = watchSchedules(hub, {
        files, rootsFor: () => [], local: () => ({ hub: RUNDIR }),
        run: (entry: any, size: any) => runEntry(entry, size, { ...opts, hub: RUNDIR, claudeBin: STUB, rootsFor: () => [], commands: files.commands, approvalsFor: () => `${dir}/approvals.json` }),
        stop: (id: string) => stopTerminal(id, opts),
        table: () => Promise.resolve([]), refresh: () => undefined
    });
    await wait(1500);
    const l = loadRecord(files.record);
    const r0 = l.ok ? (l.logs as any).get('Weekly radar').runs[0] : null;
    say(`C36 one-run rule, earlier run ${label}: newest run ${JSON.stringify(r0 && { trigger: r0.trigger, outcome: r0.outcome, terminal: r0.terminal })}; earlier terminal still listed: ${(await listTerminals(opts)).some((x: any) => x.id === t1.id)}; terminals now ${JSON.stringify((await listTerminals(opts)).map((x: any) => x.id))}`);
    return { w, files, hub, dir };
};
const busy = await oneRun('busy', p);
busy.w.close();
await wait(7000);
p = await payloadNow();
say(`C36 scan after the stub went idle: ${JSON.stringify(p.records.filter((r: any) => r.pid !== null).map((r: any) => ({ pid: r.pid, liveStatus: r.liveStatus })))}`);
const idle = await oneRun('idle', p);

// C35 on the idle watcher: rename an editor's copy over schedules.yml, a changed when moves next
const nextOf = () => (idle.hub.latest('schedule')?.payload as any).schedules[0].next;
const before = nextOf();
writeFileSync(`${idle.dir}/schedules.yml.tmp`, '- name: Weekly radar\n  runs: { task: litwatch }\n  when: "30 3 * * *"\n');
const t0 = Date.now();
renameSync(`${idle.dir}/schedules.yml.tmp`, idle.files.schedules);
let after = nextOf();
while (after === before && Date.now() - t0 < 5000) { await wait(20); after = nextOf(); }
say(`C35 rename of an editor's copy over schedules.yml while the watcher runs (real timers, no restart): next before=${before} after=${after}; moved after ${Date.now() - t0} ms; row pattern now ${JSON.stringify((idle.hub.latest('schedule')?.payload as any).schedules[0].entry.when)}`);
idle.w.close();
for (const t of await listTerminals(opts)) await stopTerminal(t.id, opts).catch(() => undefined);
await run(['kill-server'], opts).catch(() => undefined);
say('scratch tmux server killed');
writeFileSync(`${SP}/final/tmux.out`, out.join('\n') + '\n');
```

### misc.mts

```
// Final S34 and S52 over a scratch copy of config/ (no local.yml) and scratch local.yml text.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const WT = '/Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus';
const SP = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/a3';
const { parse, stringify } = await import(`${WT}/node_modules/yaml/dist/index.js`);
const engine = `${SP}/engines/final`;
const { loadConfig } = await import(`${WT}/src/lib/data/sources/config.ts`);
const { behaviorFindings } = await import(`${WT}/src/lib/data/sources/config/catalogs.ts`);
const { checkLocal, readLocalText } = await import(`${WT}/src/lib/data/sources/config/local.ts`);
const { rebuiltBy } = await import(`${WT}/src/lib/server/root/watch/local.ts`);
const { defaultSchedulesPath } = await import(`${WT}/src/lib/server/machine/schedules/file.ts`);
const { defaultRecordPath } = await import(`${WT}/src/lib/server/machine/schedules/record.ts`);
const out: string[] = [];
const say = (s: string) => { out.push(s); console.log(s); };
const file = join(engine, 'config', 'behavior.yml');
const original = readFileSync(file, 'utf8');
const base = parse(original) ?? {};
for (const keys of [['chat'], ['tasks'], ['chat', 'tasks'], []]) {
    const doc = structuredClone(base);
    for (const k of keys) doc[k] = { ...(doc[k] ?? {}), skip_permissions: true };
    writeFileSync(file, stringify(doc));
    const loaded = loadConfig(engine);
    const found = behaviorFindings(engine, loaded.config as never);
    say(`S34 behavior.yml scratch copy with skip_permissions under [${keys.join(', ')}]: findings ${JSON.stringify(found.map((f: any) => ({ key: f.key, message: f.message })))}`);
}
writeFileSync(file, original);
const home = mkdtempSync(`${SP}/final-run/home-`);
process.env.HOME = home;
say(`S52 absent keys, scratch HOME: schedules path ${defaultSchedulesPath().replace(home, '<HOME>')}; record path ${defaultRecordPath().replace(home, '<HOME>')}`);
const read = readLocalText(`hub: ${SP}/final-run/hub\nschedules: ${SP}/final-run/x/schedules.yml\nschedule_record: ${SP}/final-run/x/schedule.json\n`, '/engine');
say(`S52 scratch local.yml text: config.schedules=${JSON.stringify((read.config as any).schedules?.replace(SP, '<SP>'))} config.scheduleRecord=${JSON.stringify((read.config as any).scheduleRecord?.replace(SP, '<SP>'))} problems=${JSON.stringify(read.problems)}`);
say(`S52 rebuiltBy(['schedules']).schedules=${rebuiltBy(['schedules' as never]).schedules}; rebuiltBy(['scheduleRecord']).schedules=${rebuiltBy(['scheduleRecord' as never]).schedules}; rebuiltBy(['hub']).schedules=${rebuiltBy(['hub' as never]).schedules}`);
const bad = readLocalText(`schedules: 3\n`, '/engine');
say(`S52 checkLocal('schedules: 3')=${JSON.stringify(checkLocal('schedules: 3'))}; the read of that text: config.schedules=${JSON.stringify((bad.config as any).schedules)} problems=${JSON.stringify(bad.problems)}`);
const bad2 = readLocalText(`schedule_record: [a]\n`, '/engine');
say(`S52 'schedule_record: [a]': checkLocal=${JSON.stringify(checkLocal('schedule_record: [a]'))} config.scheduleRecord=${JSON.stringify((bad2.config as any).scheduleRecord)}`);
writeFileSync(`${SP}/final/misc.out`, out.join('\n') + '\n');
```

ASCII gate over this report: `LC_ALL=C grep -n '[^ -~]' A3-report.md` printed nothing, exit 1 (1 is no match), run before this line was added.

# Repair round 1

Not done: nothing. Every item of `A3-rebuild-round1.md` is done; the rows are below, each with the command or run that shows it. Open decisions for the orchestrator are listed after the rows.

## DONE / NOT DONE

| Item | State | Command or run |
|---|---|---|
| 1 Spec 1, Pause, Resume and Save edit the entry's node | DONE | `file.ts` `changesOf`, `patchedText`, `changedNode`, `drafted`, `planEdit` (:376, :447, :504, :576, :614). Probe `pair.probe.ts` over the five reviewer lines, Pause then Resume, byte-equal after the pair on all five (output below). Probe `save.probe.ts` for a save that changes `when`, clears `when`, turns `unattended` off, sets `paused` with a changed `runs`, and renames (output below). The re-parse check compares the raw list read back with the raw list asked for (`planEdit`, `isDeepStrictEqual(holds, plan.asked)`). A row whose entry reads with a problem keeps Pause and Resume: `ScheduleList.svelte:104` shows them for `row.readable` (entry not null), and `drafted` changes only the `paused` key. |
| 2 Proof 2, route rows in G31's table | DONE | `tests/server/machine/schedules/file.test.ts`, 'refuses an edit over a schedules file it cannot read, leaving it': 5 edits over 3 unread texts through `handleSchedules`, each 409 `{ error: 'schedules-unread', names: [] }` with the file byte-equal after and no `reload`. Run below. |
| 3 Standards 2 and Z610, DESIGN.md and HELP.md | DONE | `DESIGN.md:138` (save and delete refuse with `schedules-unread` or `record-unread`, pause and resume with `schedules-unread`, before they write; the node edit; the commit order; 500 `schedules-unwritten`; the `server-stopped` run), `HELP.md:25` (the dialog, Pause and Resume keep every other key, its order and every comment). `grep -n 'schedules-unwritten\|server-stopped' DESIGN.md` and `grep -n 'every other key, its order' HELP.md` find them. |
| 4 Standards 3, `failedAnswer` | DONE | `schedule.svelte.ts` `send` words an unread answer by `unreadableAnswer(posted.status)`, an unanswered request by `unreachableAnswer()` and any refusal that is not a schedule or terminal word by `failedAnswer(posted, posted.body)`. `Posted` gains `status` (`shapes.ts`, `writes.svelte.ts`). `app.schedules.unreachable`, `unreadable` and `refused` are gone from `config/text/app.yml`; `grep -rn "app.schedules.\(refused\|unreachable\|unreadable\)'" src tests` finds nothing. The route's commit failure answers `{ error: 'schedules-unwritten', names: [] }` with 500, never the system's message (`routes.ts:165-169`); the system's reason goes to the server log. |
| 5 Standards 1, the title | DONE | `tests/checks/config/config.test.ts:379`. Old: `names the key that replaced a retired one, against behavior.yml: %s`. New: `says a retired key is not read and names the Run unattended choice, against behavior.yml: %s`. |
| 6 Behaviour 1, commit first | DONE | `routes.ts:165-183`: `commitText` runs first and `dropRecord` or `renameRecord` run after it succeeded. Probe `commit.probe.ts` (the schedules file's folder read-only, a save that renames `Weekly radar` to `Daily radar`): `status=500 body={"error":"schedules-unwritten","names":[]}`, `schedules.yml unchanged=true`, `record unchanged=true`. |
| 7 Behaviour 2, server closes after the claim | DONE | `watch.ts:491-505`: a close between `claimDue` and the launch settles that run `failed` with `why: { word: 'server-stopped' }`. Probe `stop.probe.ts` (output below). |
| 8 Proof 4, S51 reaches the due-time refusal | DONE | Probe `s51.probe.ts`, run four times with the same refusal each time (the last run is quoted below): the run is recorded `failed` with `why: { word: 'folder-not-served' }` and runEntry was asked once. |
| 9 Proof 5, file modes | DONE | The report's sentence in 'Host- or user-visible changes' now reads as the item words it (`grep -n 'A file oculus creates is mode 0600' A3-report.md`). |
| 10 Proof 3, diagnosed | DONE | No code changed. Verify item 2 was run as the item words it (below), and the tree checks ran inside `npm run test:checks`. |

## Runs

### Item 1, Pause then Resume on the five lines (`pair.probe.ts`)

```
## task: radar
--- before
- name: Weekly radar
  runs: { task: radar }
  when: "0 7 * * 1"
--- after Pause
- name: Weekly radar
  runs: { task: radar }
  when: "0 7 * * 1"
  paused: true
--- after Resume
- name: Weekly radar
  runs: { task: radar }
  when: "0 7 * * 1"
byte-equal after the pair: true

## unknown key at
--- before
- name: Weekly radar
  runs: { task: litwatch }
  at: 7
  when: "0 7 * * 1"
--- after Pause
- name: Weekly radar
  runs: { task: litwatch }
  at: 7
  when: "0 7 * * 1"
  paused: true
--- after Resume
- name: Weekly radar
  runs: { task: litwatch }
  at: 7
  when: "0 7 * * 1"
byte-equal after the pair: true

## when: 5
--- before
- name: Weekly radar
  runs: { task: litwatch }
  when: 5
--- after Pause
- name: Weekly radar
  runs: { task: litwatch }
  when: 5
  paused: true
--- after Resume
- name: Weekly radar
  runs: { task: litwatch }
  when: 5
byte-equal after the pair: true

## unattended: 1
--- before
- name: Weekly radar
  runs: { task: litwatch }
  unattended: 1
  when: "0 7 * * 1"
--- after Pause
- name: Weekly radar
  runs: { task: litwatch }
  unattended: 1
  when: "0 7 * * 1"
  paused: true
--- after Resume
- name: Weekly radar
  runs: { task: litwatch }
  unattended: 1
  when: "0 7 * * 1"
byte-equal after the pair: true

## order and comment
--- before
# top
- when: "0 7 * * 1"  # weekly
  name: Weekly radar
  # the task
  runs: {task: litwatch}

- name: Other
  runs: { task: litwatch }
--- after Pause
# top
- when: "0 7 * * 1"  # weekly
  name: Weekly radar
  # the task
  runs: {task: litwatch}
  paused: true

- name: Other
  runs: { task: litwatch }
--- after Resume
# top
- when: "0 7 * * 1"  # weekly
  name: Weekly radar
  # the task
  runs: {task: litwatch}

- name: Other
  runs: { task: litwatch }
byte-equal after the pair: true
```

### Item 1, saves (`save.probe.ts`, file `# top` / `- name: Weekly radar # n` with `at: 7`, comments on `name`, `runs` and `when`)

```
## when changed
# top
- name: Weekly radar # n
  runs: { task: litwatch }   # r
  at: 7
  when: "0 8 * * 1"  # w
  unattended: true
- name: Other
  runs: {task: litwatch}

## when cleared
# top
- name: Weekly radar # n
  runs: { task: litwatch }   # r
  at: 7
  unattended: true
- name: Other
  runs: {task: litwatch}

## unattended off
# top
- name: Weekly radar # n
  runs: { task: litwatch }   # r
  at: 7
  when: "0 7 * * 1"  # w
- name: Other
  runs: {task: litwatch}

## paused on + runs changed
# top
- name: Weekly radar # n
  runs: { task: scout }   # r
  at: 7
  when: "0 7 * * 1"  # w
  unattended: true
  paused: true
- name: Other
  runs: {task: litwatch}

## name changed
# top
- name: Radar 2 # n
  runs: { task: litwatch }   # r
  at: 7
  when: "0 7 * * 1"  # w
  unattended: true
- name: Other
  runs: {task: litwatch}
```

### Item 2, G31's table (`npx vitest run tests/server/machine/schedules/file.test.ts --reporter=verbose`)

```
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus
 * |unit| tests/server/machine/schedules/file.test.ts > the schedules file > refuses an edit over a schedules file it cannot read, leaving it 34ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:12:45
   Duration  878ms (transform 215ms, setup 0ms, import 757ms, tests 37ms, environment 0ms)
```

### Item 6, a commit that fails (`commit.probe.ts`)

```
status=500 body={"error":"schedules-unwritten","names":[]}
schedules.yml unchanged=true
record unchanged=true
```

### Item 7, the server closes right after the claim (`stop.probe.ts`)

```
stop the server closed right after the 07:00 claim was written: starts asked=0 new-session calls=0 runs={schedule due=07:00 failed terminal=null why={"word":"server-stopped","names":[]}}
stop record file: {"Weekly radar":{"pattern":"0 7 * * *","since":"2026-09-29T04:59:50.000Z","handled":"2026-09-29T05:00:00.000Z","runs":[{"trigger":"schedule","due":"2026-09-29T05:00:00.000Z","at":"2026-09-29T05:00:00.000Z","outcome":"failed","terminal":null,"why":{"word":"server-stopped","names":[]}}]}}
```

### Item 8, S51 (`s51.probe.ts`; the schedules file lives in a folder of its own and is written 1.5 s before the watcher starts, so no event of the file reloads it before the due time)

```
S51 row before: problem=null next set=true
S51 at 06:59:59, root no longer served: row problem=null (the file was not read again) runs=0
S51 at 07:00:10: new-session calls=0; starts asked of runEntry=1; runs={schedule due=07:00 failed terminal=null why={"word":"folder-not-served","names":["<repo>"]}}
S51 record file: {"Weekly radar":{"pattern":"0 7 * * *","since":"2026-09-29T04:59:50.000Z","handled":"2026-09-29T05:00:00.000Z","runs":[{"trigger":"schedule","due":"2026-09-29T05:00:00.000Z","at":"2026-09-29T05:00:00.000Z","outcome":"failed","terminal":null,"why":{"word":"folder-not-served","names":["<repo>"]}}]}}
S51 row now: runs=[{"outcome":"failed","why":{"word":"folder-not-served","names":["<repo>"]}}] problem=null
```

The row at 06:59:59 shows `problem=null`: the file was not read again after the root left the served set. The due-time refusal is `runEntry`'s `folder-not-served`, recorded in the record file shown. This probe covers the refusal of one prompt entry; it does not cover a command or a task entry at a due time.

## Tests added or changed

- `tests/server/machine/schedules/file.test.ts`: 'refuses a write over a schedules file it cannot read, leaving it' is now 'refuses an edit over a schedules file it cannot read, leaving it' and gains the route rows of item 2 (the title is the one the round brief names).
- `tests/checks/config/config.test.ts`: the `behaviorFindings` it.each title of item 5.
- No other test added or changed.

## Decisions the round made that the brief did not name

- Two words join `SCHEDULE_WORDS` (`data/model/model-processes.ts`): `schedules-unwritten` (the route's 500 for a schedules file that could not be written, sentence `app.schedules.problem_schedules_unwritten`) and `server-stopped` (a run claimed while the server closed, sentence `app.schedules.problem_server_stopped`). They are user-visible vocabulary, so the orchestrator rules on them.
- A request that got no answer is said by a new shared sentence `ui.answer_unreachable` through `unreachableAnswer()` in `state/shared/answers/answers.ts`, since `failedAnswer` needs a status and an unanswered request has none. `Posted.status` is 0 for it. The other callers of `postCommand` keep their own sentences.
- A failed run with no recorded reason reads `failed` (`app.schedules.outcome_failed_bare`), and a word this build has no sentence for is shown as the word itself, in a row's problem and in a run's reason.
- When the schedules file was committed and the record change after it then failed, the route reloads the watcher, writes the change-log line and answers 409 `record-unread`; the file keeps the change. The record was checked readable before the write, so this is reached only by a record that went unreadable in between.
- A save whose entry equals the entry as the page read it changes no byte and answers `{ ok: true }` without writing.

## Verify lines

`checks.sh` over `orchestrator-state.md` (`checks.log`):

```
$ npm run test:quick
test:quick: 42.0 s (limit 45.0 s); every command passed
checks: 1 commands passed
exit 0
```

`npm run test:checks` (`test-checks.log`; `npm run diagrams` was run first because `schedule.svelte.ts` now imports `answers.ts`, which changes `docs/diagrams/layer-state.*`):

```
 Test Files  15 passed | 1 skipped (16)
      Tests  227 passed | 3 skipped (230)
   Duration  49.71s (transform 15.96s, setup 0ms, import 48.70s, tests 84.01s, environment 3ms)
```

Verify item 2 as the round brief words it, `npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts tests/routes/sessions/terminal-actions.test.ts tests/server/machine/commands/run.test.ts tests/data/sources/config/local.test.ts` (`verify2.log`):

```
 Test Files  8 passed (8)
      Tests  45 passed (45)
```

Also run once after the last change: `npx svelte-check --threshold error` (0 errors, 0 warnings), `npx eslint .` (no output), `npx prettier --check src tests config` (all files formatted), `sh utils/unused-exports.sh | wc -l` (378, the baseline), `npx tsc --noEmit -p .` (only the two `CardAction` lines of `task-card.ts` and `card.ts`, which `svelte-check` does not report).

What these do not cover: the tray's DOM (the look is the orchestrator's at landing), a due time of a command or a task entry whose folder or command is gone (S6 and S26 were run before this round), and a close of the server at any point other than between the claim and the launch.

# Repair round 2

Not done: nothing. Every item of `A3-round2.md` is done. The rows are below, each with the command or run that shows it; the decisions the round took that the brief did not name follow them. One correction to round 1 is in the last section.

## DONE / NOT DONE

| Item | State | Command or run |
|---|---|---|
| 1 Behaviour 1, G46: a close during the earlier terminal's stop | DONE | `watch.ts` `launch` checks `stopped()` after the stop of the earlier idle terminal, settles the run `failed` with `server-stopped` through `settleStopped` (shared with the claim-to-launch window) and answers `{ refused: 'server-stopped' }` without asking for the run. Row in `watch.test.ts` (below): failing run on the tree as round 1 left it, passing run after. |
| 2 Spec 1, an alias entry | DONE | `file.ts` `changedEntry` builds the rendered text only inside a `try`; `planEdit` refuses `entry-unwritable` (409, names the entry) when no text holds. Probe `records.probe.ts`, 'an alias entry' (below): the Pause and the Save of B write, Pause then Resume is byte-equal with `&r` intact; deleting the anchor holder A is refused `entry-unwritable`. |
| 3 Z613, a field that carries a problem | DONE | `unchosenKeys` (`data/helpers/run/schedules.ts`) names the keys whose value does not read; the row carries them as `unchosen`; the dialog opens the task Select and the Run unattended box with no value chosen and `check(draft)` asks; `changesOf` (`file.ts`) writes a key that is `unchosen` whatever it was sent as. Probe `unchosen.svelte-probe.ts` over the real store and the real route (below). |
| 4 Z614, the record's lock across the commit | DONE | `moveRecord` (`record.ts`) holds the lock across `commit`; `routes.ts` `write` commits inside it for a rename, a new entry and a delete. A held lock answers 409 `record-locked`, a record that does not read 409 `record-unread`, both before anything is written; a failed commit 500 `schedules-unwritten` with the record as it was; a record that cannot be written 500 `record-unwritten`. `grep -n "'record-unread'" routes.ts` finds one use, before the plan (`:195`), and the `RECORD_WORDS` table (`:160-162`) for the reasons `moveRecord` answers. Row under G31 in `record.test.ts` (below); probes S19 and the held lock through the route (below). |
| 5 Z616, a reason this version does not name | DONE | `schedule.svelte.ts:251` and `:270` say `app.schedules.outcome_failed_unknown` (`config/text/app.yml:62`); `grep -rn outcome_failed_unknown src config` finds those three lines and no raw word is shown. |
| 6 Behaviour 4, CRLF | DONE | `file.ts` `inLineEnds` ends every line of the text a write gives in `\r\n` when all lines of the file do; probe `records.probe.ts`, 'a CRLF file' (below): Pause, Resume, a Save adding a key and a new entry leave no bare `\n`. |
| 7 Standards 1, G31's title | DONE | `file.test.ts:41` reads 'refuses a write over a schedules file it cannot read, leaving it' (`grep -n "it('refuses" tests/server/machine/schedules/*.test.ts`). |
| 8 Standards 2, one sentence under one key | DONE | `commands.svelte.ts:317` and `:389` read `unreachableAnswer()`; `config/text/views/shared/commands.yml` no longer holds `unreachable` (`grep -rn "commands.unreachable" src tests config DESIGN.md HELP.md` finds none); DESIGN.md's "Untyped input" names `ui.answer_unreachable` beside `ui.answer_refused` and `ui.answer_unreadable`. |
| 9 Standards 3 and the flow map | DONE | The report's "Files" section is regenerated from `diff -rq` with a reason on each path outside the write list, `writes.svelte.ts`, `answers.ts`, `ui.yml`, `shapes.ts`, `commands.svelte.ts` and `commands.yml` among them. A flow-map entry (`{name: A, ...}`) comes back with the library's spacing (`{ name: A, ... }`), its keys, order and values kept, as `file.ts:18-20` says. |
| 10 The words in the docs | DONE | `DESIGN.md:138` names `schedules-unwritten`, `entry-unwritable`, `record-locked`, `record-unread` and `record-unwritten` with each sentence, and the `server-stopped` run line; `HELP.md:25` gives each sentence to a reader, without the machine word, and the unchosen task and flag. |

## Tests added or changed

- `tests/server/machine/schedules/watch.test.ts`, G46's table 'starts a schedule once per due time': a scenario closes the watcher while the earlier idle terminal's stop is pending and asserts no run is asked, no timer is left and the record reads `failed` with `server-stopped`. Its run on the tree as round 1 left it (the test written first, then the fix):

```
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/A3/tools/oculus
 * |unit| tests/server/machine/schedules/watch.test.ts (1 test | 1 failed) 668ms
     * starts a schedule once per due time 649ms
******* Failed Tests 1 *******
 FAIL  |unit| tests/server/machine/schedules/watch.test.ts > watchSchedules > starts a schedule once per due time
AssertionError: stop pending: expected [ Array(1) ] to have a length of +0 but got 1
- Expected
+ Received
- 0
+ 1
 * tests/server/machine/schedules/watch.test.ts:377:56
    375|         await vi.advanceTimersByTimeAsync(24 * 3_600_000);
    376|         expect(vi.getTimerCount(), 'stop pending').toBe(0);
    377|         expect(started(ending.driver), 'stop pending').toHaveLength(0);
       |                                                        ^
    378|         expect(runsOf(ending.w)[0], 'stop pending').toMatchObject({
    379|             trigger: 'schedule',
************************[1/1]*
 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:30:39
   Duration  2.81s (transform 641ms, setup 0ms, import 2.05s, tests 668ms, environment 0ms)
```

- `tests/server/machine/schedules/record.test.ts`, G31's record: 'refuses a rename or a drop while the lock is held, committing nothing' is new and tagged `slow` (two real waits of the record's 2 s lock time); 'refuses a write over a schedule record it cannot read, leaving it' now calls `moveRecord` in place of `renameRecord` and `dropRecord` and asserts the commit callback was never called. The new row has no failing run on the earlier tree: it tests `moveRecord`, which did not exist there.
- `tests/server/machine/schedules/file.test.ts`: the title is G31's ruled title again (item 7); no row changed.
- No other test. Items 2, 3, 5, 6 and 8 have no guarded entry; the runs below show them.

## Runs

### Item 2, an alias entry (`records.probe.ts`, 'an alias entry'; file `- name: A / runs: &r { task: litwatch } / ...` and `- name: B / runs: *r / ...`)

```
alias Pause of B (runs: *r): writes:
- name: A
  runs: &r { task: litwatch }
  when: "0 7 * * 1"
- name: B
  runs: *r
  when: "0 8 * * 1"
  paused: true

alias Save of B changing when: writes:
- name: A
  runs: &r { task: litwatch }
  when: "0 7 * * 1"
- name: B
  runs: *r
  when: "0 9 * * 1"

alias Pause then Resume of B: file byte-equal=true, anchor kept=true
alias Save of B changing runs: writes:
- name: A
  runs: &r { task: litwatch }
  when: "0 7 * * 1"
- name: B
  runs: { task: scout }
  when: "0 8 * * 1"

alias Delete of A (the anchor holder): refused 409 entry-unwritable ["A"]
```

A Save of B that changes `runs` writes `runs: { task: scout }` on B, so B no longer aliases A's map; A's anchor is intact. A change the file's bytes cannot carry and the library cannot render alone is refused as `entry-unwritable`.

### Item 3, a task and a flag that do not read (`unchosen.svelte-probe.ts`, real `createSchedule`, real `handleSchedules`, scratch file)

```
file before:
- name: Weekly radar
  runs: { task: litwach }
  when: "0 7 * * 1"
- name: Daily scout
  runs: { task: scout }
  unattended: 1
  when: "0 9 * * *"

rows: [{"name":"Weekly radar","problem":"update-task-unknown","unchosen":["task"]},{"name":"Daily scout","problem":"flag-wrong","unchosen":["unattended"]}]
row 0 opened: task="" unattended=false
row 0 Save with no task chosen: check=["Choose a task."]
row 0 task chosen: check=[]
row 0 save: {"ok":true,"terminal":null,"skipped":""}
row 1 opened: task="scout" unattended=null
row 1 Save with no choice for Run unattended: check=["Choose whether it runs unattended."]
row 1 Run unattended chosen Off: check=[]
row 1 save: {"ok":true,"terminal":null,"skipped":""}
file after:
- name: Weekly radar
  runs: { task: litwatch }
  when: "0 7 * * 1"
- name: Daily scout
  runs: { task: scout }
  when: "0 9 * * *"

rows after: [{"name":"Weekly radar","unchosen":[]},{"name":"Daily scout","unchosen":[]}]
row 1 chosen On: {"ok":true,"terminal":null,"skipped":""}
file after (On):
- name: Daily scout
  runs: { task: scout }
  unattended: true
  when: "0 9 * * *"
```

Row 0 (`task: litwach`) and row 1 (`unattended: 1`) each open with no value chosen, Save asks for one, and the file line is `task: litwach` before and `task: litwatch` after for row 0, and `unattended: 1` before and no `unattended` key after (Off chosen) or `unattended: true` (On chosen, shown from the original file) for row 1; every other line of both entries keeps its bytes.

### Item 4, S19 and a held lock (`records.probe.ts`)

```
S19 a new entry 'Stale name' (0 7 * * *) saved at 07:30 over a record entry handled yesterday: 200 {"ok":true}; run starts=0; runs=none; record entry={"pattern":"0 7 * * *","since":"<now>","handled":null,"runs":[]}
lock the record's lock held: rename-save 409 {"error":"record-locked","names":[]}; delete 409 {"error":"record-locked","names":[]}; waited 4 s over both; schedules.yml byte-equal=true; record byte-equal=true; lock still held=true
```

The first line is S19: the new entry's record entry has `handled: null`, so no catch-up started (`run starts=0`). The second line is the route over a held lock: both writes answer 409 `record-locked`, `schedules.yml` and the record are byte-equal after, and the lock file is still there.

### Item 6, a CRLF file (`records.probe.ts`, 'a CRLF file')

```
crlf after Pause: bare LF=false; "# top\r\n- name: A\r\n  runs: { task: litwatch }\r\n  when: \"0 7 * * 1\"\r\n  paused: true\r\n- name: B\r\n  runs: { task: scout }\r\n"
crlf after Resume: bare LF=false; byte-equal to the start=true
crlf after a Save adding unattended: bare LF=false; "# top\r\n- name: A\r\n  runs: { task: litwatch }\r\n  when: \"0 7 * * 1\"\r\n- name: B\r\n  runs: { task: scout }\r\n  unattended: true\r\n"
crlf after a new entry: bare LF=false; "# top\r\n- name: A\r\n  runs: { task: litwatch }\r\n  when: \"0 7 * * 1\"\r\n- name: B\r\n  runs: { task: scout }\r\n  unattended: true\r\n- name: C\r\n  runs: { task: inbox }\r\n  when: \"0 6 * * *\"\r\n"
```

## Decisions the round took that the brief did not name

- `record-unwritten` is a new `SCHEDULE_WORDS` word, 500, sentence "The run record could not be written; check ~/.oculus/schedule.json and try again." (`app.schedules.problem_record_unwritten`). It answers a record that could not be written: the record's folder or lock file could not be created (refused before the commit, `record.ts:121-126` and `:178-182`) or the record write failed after the commit (`:198`). The orchestrator rules on it; the alternative is to reuse `record-unread`, whose sentence says a different thing.
- `ScheduleRow` gains `unchosen` (`UnchosenKey[]`, `data/model/model-processes.ts`), a field of the `schedule` channel's rows. The dialog needs it because `row.problem` names only the first problem of an entry.
- The dialog's task Select gets an empty choice with the words "Choose a task." and the Run unattended box a third state with the words "not chosen", each only for an entry whose value does not read (`app.schedules.refused_task`, `refused_unattended`, `unattended_unset`).
- `dropRecord` and `renameRecord` are replaced by `moveRecord`, whose commit callback runs inside the lock; nothing else called them.
- A line count: `file.ts` is 682 lines, `watch.ts` 734, under the 880 limit.

## Correction to round 1

The round 1 report said a record change that failed after the commit "is reached only by a record that went unreadable in between". It was also reached by a lock that stayed taken and by a record that could not be written, and it answered `record-unread` for all three. Round 2 ends the path: a lock or a record that does not read refuses before the commit, and no answer is `record-unread` after it.

## Verify lines

`checks.sh` over `orchestrator-state.md` (`checks.log`):

```
test:quick: 79 changed file(s), from git since HEAD
test:quick: 83 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.8 s)
ok      eslint (7.5 s)
ok      svelte-check (6.5 s): 1791254729260 COMPLETED 376 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (13.4 s): Duration  10.09s (transform 15.27s, setup 0ms, import 26.20s, tests 12.18s, environment 93ms)
test:quick: 14.0 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

`npm run test:checks` (`npm run diagrams` was run first: the state layer's imports changed, so `docs/diagrams/layer-state.*` and the layer files moved):

```
 Test Files  15 passed | 1 skipped (16)
      Tests  227 passed | 3 skipped (230)
```

`npx vitest run tests/server/machine/schedules tests/routes/machine/schedules.test.ts --reporter=verbose`:

```
(pass) |unit| tests/server/machine/schedules/file.test.ts > the schedules file > refuses a write over a schedules file it cannot read, leaving it 48ms
(pass) |unit| tests/routes/machine/schedules.test.ts > POST /api/schedules > refuses a request without the write token 14ms
(pass) |unit| tests/server/machine/schedules/run.test.ts > runEntry > starts what a schedule runs, or refuses it with its word 76ms
(pass) |unit| tests/server/machine/schedules/watch.test.ts > watchSchedules > starts a schedule once per due time 816ms
(pass) |unit| tests/server/machine/schedules/record.test.ts > the run record > refuses a write over a schedule record it cannot read, leaving it 19ms
(pass) |unit| tests/server/machine/schedules/record.test.ts > the run record > refuses a rename or a drop while the lock is held, committing nothing 4253ms
Test Files  5 passed (5)
Tests  6 passed (6)
```

Also after the last change: `npx tsc --noEmit -p .` (only the two `CardAction` lines), `npx eslint src tests` (no output), `npx prettier --check src tests config DESIGN.md HELP.md` (all formatted), `sh utils/unused-exports.sh | wc -l` (378, the baseline), the ASCII gate over `src tests config DESIGN.md HELP.md README.md` (no hit outside `config/present.yml`, which this step did not touch).

What these do not cover: the dialog's DOM (the three-state box and the empty task choice are drawn, not rendered here; the look is the orchestrator's), a lock that goes stale during a save, and a record whose write fails after the commit (answered by reading `routes.ts`, no run).

