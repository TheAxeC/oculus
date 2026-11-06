# O160 brief check

Brief check of O160 (`.scratch/migration/agents/briefs/O160.md`), oculus main at ffbc6b110 (`git log --oneline -1` printed `ffbc6b110 Record O158's review over round 1 and its gate`). No file changed; the only git commands run were `git log -1`, `git grep` and `git status --short`.

## Names

The step adds props and state to `Head.svelte`, `Cluster.svelte` and `Log.svelte`. It renames nothing.

- `git grep -n "Cluster.svelte\|hpc/Head\|hpc/Log\|from './Head.svelte'\|from './Log.svelte'" -- src` finds:
  - `Cluster.svelte:19,22`, which import Head and Log.
  - `Hpc.svelte:23,31,63`, the only place that renders Cluster.
  - `Literature.svelte:49`, which imports its own `./Head.svelte` from the literature folder. That is a different file and is not affected.
- `git grep -n "hpc/Cluster\|hpc/Head\|hpc/Log\|Head.svelte\|Log.svelte" -- tests` prints nothing.
- `git grep -n -i "refresh now\|refresh_now" -- . ':!.scratch'` hits outside the write list:
  - `config/text/views/system/machine/hpc.yml:107` (`refresh_now: Refresh now`). Its words stay the same (decision 3), so it stays true.
  - `docs/HELP.md:359`, the Inbox bullet: "Refresh now, here and on the Calendar, turns its glyph until that refresh answers." It stays true, but it now covers only two of the views that turn.
  - `docs/HELP.md:363`, the Live HPC bullet. It already says of Submit "Its glyph turns while the plan is prepared". It says nothing about Refresh now or the tail turning. It does not become false, but see C-1.
- `Hpc.svelte:23` ("each with its own head, status and refresh") stays true.

C-1. Place: "Paths this step writes" and "What to build" item 5. `spec.md:72` says "A step writes what a user does into `docs/HELP.md` as short bullets". The step changes what a user sees on Live HPC, but the brief does not write `docs/HELP.md`, and item 5 covers head comments only. Change that closes it: add `docs/HELP.md` to the write list, and add an item saying the Live HPC bullet (`docs/HELP.md:363`) gets one sentence. The sentence: Refresh now, in the head and in the error box, and the log's tail turn their glyph from the press until that request answers. Optionally widen `:359` to name Live HPC beside the Inbox and the Calendar.

## The step line

Line 1707, part by part:

- "the Refresh now control of a cluster's head (`Head.svelte:95`) ... carry the refresh glyph and turn it while the refresh runs, from the press until its answer": item 1.
- "the refresh in its error box (`Cluster.svelte:109`)": item 2.
- "the log box's refresh (`Log.svelte:41`)": item 3.
- "as `ConnectorHead.svelte:86` does for the Inbox and the Calendar": item 1 matches the look. The mechanism departs from it: item 4 and decision 2 put the state in the section, while the precedent puts it in the store. See C-2.
- "built by a builder agent": the brief's Report and Verify sections are written for a builder.
- "(ruling Live HPC refresh)": what is on the tree, first bullet. `plan.md:3603` reads `- Live HPC refresh (2026-11-06): Axel: "Live HPC => Refresh now => does not have any animation to show it is doing anything"; step O160 (the user).`

No part of the step line is without an item.

`grep -n "^## Goal" .scratch/migration/plan.md` prints nothing. The plan has no Goal section; the closest thing is its preamble (`plan.md:3`, "Execution ledger for `tools/oculus/DESIGN.md`"). The goal of this step is therefore read from the ruling: a press of Refresh now shows that the refresh is running.

C-2. Place: decision 2, item 4, and item 1's "as `ConnectorHead.svelte:86` does".
- The precedent's head comment (`ConnectorHead.svelte:6-9`) says: "Which presses wait is the view's store's, never this head's own state, so every view of one connector turns together, a view opened while a press waits turns until the answer, and one connector's press never turns the other's glyph."
- The sibling refresh in the same float does the same with a per-key store. `usage-refresh.svelte.ts:4-7` holds "the accounts whose refresh the reader pressed, from each press until that press's own answer", and `Usage.svelte:216` reads `turning={refreshing(account.label)}`.
- With the state in the section, closing the Live HPC tab and reopening it while a press waits shows no turning, even though the request is still pending. The view is `unique: true` (`Hpc.svelte:12`), so this is the only way the case arises.
- Change that closes it: put the pressed count per resource in `src/lib/state/system/machine/hpc/hpc.svelte.ts`, as `refresh(resource)` and `refreshing(resource)` the way usage-refresh does. Add that file to the write list, and rewrite decision 2 accordingly.
- `grep -n "usage-refresh\|hpc.svelte\|inbox.svelte\|calendar.svelte" .scratch/migration/agents/guarded.md` prints nothing, so no store test is owed.
- If the orchestrator keeps the section state instead, decision 2 should say that it departs from the precedent's stated design and name the reopened-tab case.
- Note on which option is lazy: the section state is the cheaper one. The store form also keys C4 and C5 per cluster.

## Premises

| Premise in the brief | Command | Result |
|---|---|---|
| Head.svelte:95 | `cat -n` | line 95 is `<ToolButton label={t('hpc.refresh_now')} onclick={onrefresh} />` inside `{#if !failed}` (94). Holds. |
| Cluster.svelte:109 | `cat -n` | line 109 is `<ToolButton small label={t('hpc.refresh_now')} onclick={refresh} />`. Holds. |
| Cluster.svelte:83-85 (`refresh`) | `cat -n` | Holds. |
| Cluster.svelte:89-95 (`showLog`) | `cat -n` | Holds. |
| Cluster.svelte:146 (tail passed to Log) | `cat -n` | `onrefresh={() => showLog(logId)}`. Holds. |
| Log.svelte:37-42 | Read | the element runs 37-42 with `onclick` at 41. Holds. |
| `hpc.tail: tail` at hpc.yml:116 | `sed -n 116p config/text/views/system/machine/hpc.yml` | `tail: tail`. Holds. |
| hpc.svelte.ts:72-80 (`command`) | `cat -n` | the function is 72-79; 80 is blank. Holds. |
| routes.ts:33-38 | `cat -n` | Holds. |
| route reaches the watcher's refresh | `cat -n "src/routes/api/(machine)/hpc/+server.ts"` | 30-32: `await server.hpc.watcher(resource)?.refresh()`. Holds. |
| poll.ts:575-581 (poller `refresh`) | `grep -n "const refresh = " src/lib/server/machine/hpc/poll.ts` | prints `573:`. The range is 573-581; see C-3. |
| request answers after the poll | `sed -n 441,505p poll.ts` | `poll()` catches every error and publishes before it returns (447, 457, 481, 501), so it never rejects. Holds. |
| ConnectorHead.svelte:86 | `sed -n 86p` | the quoted line. Holds. |
| Inbox.svelte:163, Calendar.svelte:200 | `git grep -n "refreshing"` | `Inbox.svelte:163`, `Calendar.svelte:200`. Holds. |
| glyphs.yml:7 | `sed -n 7p config/catalogs/glyphs.yml` | `  refresh: "(r)"`. Holds. |
| ToolButton.svelte:109 | `cat -n` | `<Glyph name={glyph} {turning} />`. Holds. |
| `waiting` blocks the press | `cat -n` ToolButton | 100-102: `if (!waiting) onclick(event)`. Holds. |
| guarded.md line 3 | `grep -n "Views have no entry" .scratch/migration/agents/guarded.md` | `3:...Views have no entry: the look on TEST covers them.` Holds. |
| test grep | `grep -rln "views/system/machine/hpc" tests` | `tests/checks/config/config-folder.test.ts`; its hit is line 355, `'views/system/machine/hpc.yml'`, a catalog list. Holds. |
| no ADR folder | `test -d docs/adr \|\| echo "no docs/adr"` | `no docs/adr`. Holds. |
| verify-list commands exist | `grep -n "every command passed" tests/tiers/quick.mjs` | `304:`. `ls utils/unused-exports.sh tests/checks/tree/size.test.ts` lists both. Holds. |
| size room | `wc -l` | Head 130, Cluster 178, Log 74, all far under 520. |

C-3. Place: "What is on the tree", fourth bullet, `poll.ts:575-581`. Change that closes it: `poll.ts:573-581`.

## Cases and checks

C-4. Place: case C4.
- `grep -n -A4 "^slurm:" ~/workspace/research-hub/.oculus/config.yml` prints `resource: [utwente]`, which is one cluster.
- The look on landing therefore cannot show "two clusters on screen, one pressed" against the hub.
- Change that closes it: name C4's proof. Either it is proved by reading only (the state is keyed per section or per resource), or the brief names how the look gets two sections, for example a scratch hub copy whose `slurm.resource` lists two keys.

C-5. Place: case C1, "stops when the new state is drawn".
- The press's promise ends when the route answers (`routes.ts:38`).
- The new state is drawn from the `hpc` channel, which is a different connection.
- When the watcher's settings change during the poll, `poll.ts:452` (`if (stopped() || began !== asking) return;`) returns without publishing. In that case the turning stops with no new state drawn.
- Change that closes it: C1 reads "the glyph turns at once and stops when the press's request answers, which the poller sends after it has published the poll's state (`poll.ts:441-505`)".

C-6. Place: item 4 ("the `waiting` prop of `ToolButton`, or no call, the builder's choice").
- The two choices look different:
  - `waiting` draws the control at `opacity: 0.5` with `pointer-events: none` and `aria-disabled` (`ToolButton.svelte:216-221`, `:100`).
  - No call leaves it looking like `ConnectorHead.svelte:86`, which sets no `waiting`.
- A user-visible shape is left to the builder (`spec.md:18`), and the look has no fixed expectation for C5.
- Change that closes it: the brief decides. The recommendation, a judgment: no second call and no `waiting`, so the control looks like the precedent's.

The other cases (C2, C3, C6, C7) agree with the rules file. All seven ask about the three files the step changes. C7 asks about the poll's cadence, but only as a check that the changed controls do not turn.

## The question

Could each check pass without the goal being reached?

- **Step line's check, and the look:** yes, in three conditions.
  - Under `prefers-reduced-motion: reduce`, Glyph turns nothing (`Glyph.svelte:88-91`).
  - Under a terminal palette, the glyph is the text `(r)` and only `svg` turns (`Glyph.svelte:78`, `:97-99`).
  - A press whose request answers in well under a second shows almost nothing.
  - The look must be taken in the default theme, with motion allowed, on a cluster whose poll takes long enough to see. C3 (a cluster that does not answer, waiting the ssh budget) is the dependable state. See "Declined to judge" for reduced motion.
- **Item 1:** no. It ties `turning` to the press's request and names the glyph.
- **Item 2:** no. Exactly one refresh control is on screen at a time: `failureWords` (`hpc.ts:127`) returns null for `ok` and `starting`, and the error box draws only for any other status (`Cluster.svelte:106`).
- **Item 3:** yes. "turning while `status === 'loading'`" holds in reading and still leaves the glyph turning forever or stopping early (C-7, C-8).
- **Item 4:** for the refresh, no, because of `try`/`finally`. Its duplicate guard does not reach the tail (C-8).
- **Item 5:** yes. A head comment can be right while `docs/HELP.md` stays silent (C-1).
- **C1:** passes on the wording issue of C-5 only.
- **C2, C3:** no.
- **C4:** cannot be seen at the look (C-4).
- **C5:** no, once C-6 is decided.
- **C6:** yes, see C-7 and C-8.
- **C7:** no.

## Implied inputs

C-7. Place: item 3 and case C6.
- `jobLog` (`hpc.svelte.ts:82-88`) awaits `command`, and `command` rejects when the fetch rejects or the answer is no JSON (`hpc.svelte.ts:73-78`).
- `showLog` (`Cluster.svelte:89-95`) has no `try`, so `logStatus` stays `'loading'`.
- Under item 3 the tail's glyph would then turn forever, which is the failure item 4 rules out for the refresh.
- Change that closes it: item 3 says `showLog` sets the status to `'error'` when `jobLog` rejects, using `try`/`catch` or `finally`, so the tail stops turning. Add case C6b, "the tail pressed while the request fails: the glyph stops and the box says Fetch failed". The path is in `Cluster.svelte`, already on the write list.

C-8. Place: item 3, item 4, case C6. `spec.md:73` asks for every asynchronous path in flight, after close, and superseded.
- `showLog` writes the answer of whichever request lands last into `logStatus` and `logOutput`.
- Superseded case: the reader opens job A's log, closes it or picks job B's log (or presses tail twice) before A answers. A's answer then sets B's status: B's glyph stops while B's request still runs, and B's box shows A's output.
- Item 4's guard against a second press covers the refresh only.
- Change that closes it: item 3 says an answer for a request superseded by a later `showLog` is dropped (check `logId === id` and a request counter before writing). A tail press while that log loads starts no second request. Add case C6c, "the log of job B opened while job A's log loads: B's glyph turns until B's answer, and B's box shows B's output".

C-9. Place: Cases.
- A Head press on a healthy cluster whose poll then fails is a real path: `poll()` publishes the failure before it resolves (`poll.ts:457`, `:501`).
- The Head then hides its control (`Head.svelte:94`) and the error box's control appears (`Cluster.svelte:106-111`) while the request still runs.
- Item 2 covers it ("pressing either control turns the one on screen"), but no case names it, so the look does not check it.
- Change that closes it: add C8, "Refresh now in the head pressed on a cluster whose poll then fails: the error box's refresh appears turning and stops when the request answers".

C-10. Place: case C6, "with `live` false the control stays disabled and does not turn".
- The case does not say what happens when `live` turns false while a tail load is in flight. The control is then disabled and `status === 'loading'` at the same time.
- Change that closes it: C6 says which, either "a load in flight keeps turning until its answer though the control is disabled", or that the turning stops.

Inputs checked and found to need no case:
- **A cluster section removed or re-keyed during a refresh.** `Hpc.svelte:62` keys sections by `one.resource`, so the section unmounts. Under section state, its late `finally` writes to a destroyed component, which does no harm. A request for a key that is gone answers at once (`+server.ts:31`, `watcher(resource)?.refresh()`).
- **The refresh-all path.** `git grep -n "action: 'refresh'" -- src tests` shows no HPC client call without a resource. The only hits are `Cluster.svelte:84` and the Inbox and Calendar stores.
- **The Recover view and other callers.** `Recover.svelte:59` reads `hpc.clusters` only. `git grep` finds no other renderer of Cluster, Head or Log.
- **Other refresh controls in the HPC folder.** `git grep -n "ToolButton\b" -- src/lib/views/system/machine/hpc` lists only cancel, log, login-stop and close besides the three, so the step misses none.

## ADRs

`test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`. `ls docs` lists apps.md, data-map.md, decks.md, diagrams, HELP.md, licenses, palette.md, templates.md and third-party.md. Confirmed: there is no ADR folder.

## Dictated text

None. `grep -n '`<' .scratch/migration/agents/briefs/O160.md` finds lines 11, 12, 13 and 15. Each quotes an existing line of the tree (Head:95, Cluster:109, Log:37-42, ConnectorHead:86), and each quote matches the file. The brief dictates no new code, comment or catalog text: item 5 states what the comments say, and decision 3 keeps the existing words. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

- **Reduced motion and the terminal palette.** A reader with `prefers-reduced-motion: reduce`, or in a terminal palette, sees nothing turn (`Glyph.svelte:77-91`, `:97-99`). The ruling asks for an animation, and the precedent behaves the same, so whether this step owes those readers a non-motion sign is the orchestrator's or Axel's to decide.
- **No sign for a screen reader.** The turning glyph is `aria-hidden` (`Glyph.svelte:47`), so a screen reader hears no sign that the refresh is running. The precedent is the same; not judged.

Usage: ab29e1d416fa5d19e, claude-opus-5-5, 138617 tokens, 40 tool uses, 5.7 min

## Closed

- C-1: `docs/HELP.md` lines 363 (Live HPC) and 359 (Inbox) added to the paths; new item 6 gives the Live HPC bullet a sentence on the three controls turning, and widens 359's "here and on the Calendar" only if it then reads wrong. No overlap: O158 writes `docs/HELP.md` lines 341-347, O159 and O151 none.
- C-2: decision 2 and item 4 rewritten: the state lives in the HPC store (`hpc.svelte.ts`), `refresh(resource)` and `refreshing(resource)` by the pressed count per resource as `usage-refresh.svelte.ts` does, so a reopened tab turns while a press waits; `hpc.svelte.ts` added to the paths; case C9 added for the reopened tab. The section state was the lazy option.
- C-3: `poll.ts:573-581`.
- C-4: C4 proved by reading the per-resource key; the hub lists one cluster, so the look shows one.
- C-5: C1 reworded to stop when the press's request answers, which the poller sends after it has published.
- C-6: decided: no second request and no `waiting`, so the control looks as the precedent's; C5 says so.
- C-7, C-8: item 3 rewritten: `showLog` sets `'error'` when `jobLog` rejects, an answer superseded by a later `showLog` is dropped, a tail press while that log loads starts no second request; cases C6b and C6c added.
- C-9: case C8 added.
- C-10: C6 says a load in flight keeps turning until its answer though the control is disabled.
- Declined (reduced motion, screen reader): decision 4 keeps the precedent's behaviour (`Glyph.svelte` turns nothing under reduced motion and the glyph is `aria-hidden`), so the look is taken in the default theme with motion allowed.
