# Q103 brief check (on main at 4c03e267a0ad89cfe48260fa13631e3db886294e)

Head from `git log -1 --format='%H %s'`, which printed `4c03e267... Send Q83's stop ruling`. The corrected Q103 step line the brief cites (plan.md:255) is in the main checkout's working tree only, not committed: `git show HEAD:tools/oculus/.scratch/migration/plan.md | sed -n 253,257p` prints the old text ("the cluster's capacity table (every GPU node) collapsible, its open state kept in the pane's instance state"), and `git diff --stat HEAD -- .../plan.md` prints `1 file changed, 1 insertion(+), 1 deletion(-)`. The builder never reads plan.md, so this does not block the build, but the booking must commit the corrected line.

plan.md has no `## Goal` heading; the goal is the opening paragraph, lines 1-4 (the migration ledger for DESIGN.md). The `## Rulings` section was read at lines 378-510. The rulings on this step are line 473 (Axel's terminal report names Q103 as his) and line 441 (the HPC Disk and Recent sizes). No ruling contradicts the brief.

## Names

Command: `git grep -n -E "capacity_summary|capacity_title|parseHpcState|HpcViewState|Cluster capacity|capacity \(sinfo\)|sinfo table" -- tools ':!tools/oculus/.scratch' docs README.md CLAUDE.md CONTEXT.md`

```
tools/cockpit/assets/js/cockpit/07-slurm.js:89: ... CK.t("slurm.capacity_summary", parts.length) ...
tools/cockpit/data/config/text.yml:183:      capacity_summary: "Cluster capacity (sinfo) - {0} rows"
tools/cockpit/dummy/data/config/text.yml:174:      capacity_summary: "Cluster capacity (sinfo) - {0} rows"
tools/oculus/config/text/views/system/hpc.yml:11:        capacity_summary: Cluster capacity (sinfo) - {0} rows
tools/oculus/src/lib/views/system/hpc/Capacity.svelte:40:        <summary>{t('hpc.capacity_summary', rows.length)}</summary>
tools/oculus/tests/views/system/hpc.test.ts:99:            'Cluster capacity (sinfo) - 3 rows',
```

- The three `tools/cockpit` hits are outside the paths. They belong to the cockpit's own `slurm.` group in its own catalog, so the change does not make them false.
- The other hits (hpc.yml:11, Capacity.svelte:40, hpc.test.ts:99) are inside the paths. hpc.test.ts:99 becomes false, and the brief's item 4 covers it.
- `parseHpcState`, `HpcViewState`, `capacity_title` and `capacity_title_one` have no hits: new names, no collision.
- `grep -rn "hpc_state\|HpcState\|hpcState" src tests` prints nothing.
- `grep -rn "onheld" src tests` hits only `tests/ui/menu/GroupContexts.svelte:9`, `tests/ui/menu/HeldContexts.svelte:6,10` and `tests/fixtures/client.ts:22`: a different prop on test components, no conflict.
- `grep -rn "<Capacity\|Capacity from" src tests` finds one caller, `Hpc.svelte:23,65`, inside the paths.
- The class `said` has no hit in `src/lib/views/system/hpc`; the other `.said` rules in the tree are local to their components.
- `grep -n -i -E "sinfo|capacity|unreachable|EduVPN|Live HPC" HELP.md DESIGN.md README.md docs` hits HELP.md:134 ("The cluster queue: what is running, what is pending and the quota."), HELP.md:220, HELP.md:233 and DESIGN.md:132 (the Live HPC poller paragraph). The change makes none of them false, and no doc quotes "Cluster capacity (sinfo)".
- The head comments stay true: Capacity.svelte:2-3 ("retaining the full source table"), :23-24 ("the capacity is the glance above it") and Hpc.svelte:19-20.

## The step line

The plan.md:255 line (working tree) has five parts:
- (A) The unreachable line at Hpc.svelte:62 in the view's type: item 1.
- (B) The ssh hint `<code>` in Head.svelte in the view's type: item 2.
- (C) The capacity section (the meters, the GPU partitions) collapsible as one section: item 3 (the outer `<details>` and its summary) and item 4 (the summary words).
- (D) Its open state kept in the pane's instance state: item 3 (`parseHpcState`, `onheld`, the `Hpc.svelte` wiring).
- (E) The sinfo table's open state kept the same way: item 3 (the `sinfo` key).

Item 5 (the tests) serves all five. No part of the line lacks an item.

Item 1 also restyles the fetching paragraph at line 60, which is not failure text. This widens the step past the line for the same defect. It is acceptable, but it is not on the line.

## Premises

Every command of the brief was rerun and its output compared.
- Hpc.svelte has 100 lines: `<p>{t('hpc.fetching')}</p>` at 60, `<p>{t('hpc.unreachable_msg')}</p>` at 62, and a `<style>` at 88-100 that styles `.hpc` and `footer`. `cat -n` agrees.
  - One error: the brief says the view reads the store through `useState()` "(line 30)". Line 30 is the import; the call is at lines 32-34.
  - The paragraph size claim holds. `src/routes/+layout.svelte:27-31` sets `:global(body) { font: var(--fs-xl) / 1.5 var(--font-ui) }`, and `Pane.svelte:103-110` `.body` sets no font-size, so the paragraphs are drawn at 15px with 1em margins.
- Head.svelte has 122 lines: the hint at 88, and `code { color: var(--c-red-txt); }` at 119-121. `cat -n` agrees.
  - "its smaller monospace size" is not verified; no browser was run.
  - The body's font-size is an absolute `calc(15px ...)`, and Chrome's shrinking of a bare `monospace` does not usually apply to an absolute size. The hint may therefore be drawn at 15px, larger than the 11.5px meta line.
  - The fix sets `--fs-sm` explicitly either way. The before/after note and the landing look should state the before size as measured, not as the brief assumes it.
- Capacity.svelte has 90 lines: the meters at 25-38, and `{#if rows.length}<details>` at 39-42 with no `open`. `cat -n` agrees.
- `grep -rn "setInstanceState" src/lib/views/system/hpc` prints nothing (rc=1), as stated.
- The held-state pattern checks out at every cited line:
  - Calendar.svelte: `ui: { instanceState, setInstanceState }` at 62-66, `held` at 73, `keepView` at 143-147.
  - calendar.ts: `parseCalendarState` at 106-110.
  - guards.ts: `isMap` at 16.
  - ui.svelte.ts: `setInstanceState` at 353-355, `clearInstanceState` at 358.
  - Calendar's `keepView` writes the parsed `next` alone and does not spread the held map.
- `grep -n "export function" src/lib/state/system/hpc.ts` prints exactly the five functions, at lines 12, 31, 34, 37 and 49. The file has 69 lines.
- hpc.yml has `capacity_summary` at 11, `fetching` at 39 and `unreachable_msg` at 64, as stated.
- tokens.css has `--font-mono` at 103, `--fs-sm` (11.5px) at 111 and `--fs-md` (12.5px) at 112, inside the cited range 102-116.
  - Focus.svelte:195-199 is `.said { margin: 0; font-size: var(--fs-md); color: var(--accent-txt, var(--accent)); }`: accent, not muted.
  - AccountList.svelte:146 is the hint `code`, and 192-205 hold the `.hint` fs-sm and `.said` rules.
  - The muted colour the brief picks is what most sibling `.said` rules use (Calendar:271, Inbox:228, History:248, Collection:384, Hooks:90 and others), so decision 5 stands; the Focus citation supports only the size.
- `grep -n hpc tests/views/whole/type-scale.test.ts` prints 72, 123 and 124 with exactly the quoted strings. It also prints 125-128 (Jobs, Log, Quota, Recent), which the step does not touch.
- hpc.test.ts line 21 is the instance, as stated.
  - The quoted `'Cluster capacity (sinfo) - 3 rows'` is at line **99**, not 98.
  - `grep -rln setInstanceState tests/views | grep -c .` prints 28 files, including `tests/views/personal/calendar.test.ts`, which sets held state at line 126 before `render`.
- Not mentioned: `guards.ts:20-23` already defines `fields(value)` (the value when it is a map, else `{}`). The brief's `heldMap` in item 3 is that helper written by hand. Under the spec's "a parser, a fold or a rule exists once and is reused", the brief should name `fields`.

## Cases and checks

- The fixture gives exactly one meter. `partitionMeters` (`hpc.ts:49-69`) groups by `row.partition`, and the three sinfo rows (hpc.test.ts:58-62) are all `partition: 'gpu'`: one meter named `gpu`, `gpu: true`. "Cluster capacity - 1 partition" is correct.
- The test client can hold instance state before a server render. `tests/fixtures/client.ts` builds a fresh `createClientState()`; `calendar.test.ts:126` calls `client.ui.setInstanceState(instance.id, held)` and then `render(...)`; ui.svelte.ts:12 says the store takes a plain object and touches no localStorage.
- `vite.config.ts:31` sets `environment: 'node'`, `grep -rl "jsdom\|happy-dom" package.json` prints nothing, and no test mounts a component. No case can fire `toggle` or call the `onheld` closure.
  - Case 4's second half ("a write through `onheld` from that held value keeps `label: 'x'`") cannot be a unit test while the merge sits inline in `Hpc.svelte`'s `onheld` closure.
  - For the same reason, verify item 4's revert "the spread of the held map removed" cannot turn any test red.
  - Case 12 is admitted as a reading. The spec says a behaviour that needs a DOM "is seen at the look on landing", and that an assertion over source text is an audit.
  - The fix is to move both decisions into pure functions in `hpc.ts`: `heldAfterToggle(held, key, open): HpcViewState | null`, null when `open` equals the held value, and `heldWrite(raw, next)` returning `{ ...fields(raw), ...next }`. Unit cases over these carry case 4's second half and case 12.
  - Case 12 as written contradicts verify item 4, which asks for a red revert for the spread.
- The spec says "Every control a reader presses is a `ui/` primitive", and a `<summary>` is pressed. The tree already has 8 raw `<details>`/`<summary>` (`grep -rn "<details" src`), no fold primitive exists under `ui/`, and decision 1 argues for the native element. The decision should say plainly that it is an exception to the primitive rule, since it adds a second pressable raw control to the view.
- `ui/frame/Empty.svelte` already draws a status line with `margin: 0`, the muted colour and `--fs-md`, plus a `body.rice` terminal form (mono, `--fs-xs`, a `# ` prefix). `File.svelte:173` uses it for a loading message, and 38 view files import it.
  - The brief hand-writes `.said` with the same three properties without weighing `Empty`, so the fetching and unreachable lines will not take the rice form.
  - Either the fetching line uses `Empty`, or the brief states why not. The unreachable line may stay `.said`, since rows remain under it and it is not "nothing here".
  - The spec's DRY principle bears on this.
- Spreading the raw held map "so any other key a later step keeps there survives" builds for a need no plan line names (the spec's YAGNI).
  - The tree writes `{ ...held, ...next }` over the parsed value: Inbox.svelte:94, Radar.svelte:74, Leads.svelte:106, Linkedin.svelte:92, Collection.svelte:140, Projects.svelte:124, Present.svelte:66.
  - No other writer puts keys into the ui instance record for a view. The shell's card cursor (`workbench-keys.svelte.ts:329`) writes the layout's `instance.state`, which is not `ui.instanceState`.
  - Harmless, but a decision that differs from the tree, and it should use `fields()`.

## The question

- The `parseHpcState` cases (1-4, first half) are pure and cannot pass without the defaults and the per-key fallback. They hold.
- The default-draw case (outer `open`, inner not, "1 partition") goes red when the `open` binding or the summary words are removed. It holds.
- The `{ capacity: false }` and `{ sinfo: true }` draws hold for reading held state into the markup. They cannot show that a toggle ever writes.
- **No listed check shows that a toggle writes.** Every case and every verify command passes with the `ontoggle` handlers left out, and the pane would then never keep its state, so "open state kept per pane" is unproven by the suite.
  - The fix is the pure-function cases above, plus a landing look that closes the fold, switches tab and reloads, in both panes.
- The two-panes case holds: two renders with `hpc-one` and `hpc-two` on one client go red if the state is keyed by anything but `instance.id`.
- The `said` class cases (unreachable, starting) pass on the class alone, while the goal is the margin and the size.
  - After the step, type-scale line 72 pins only `--fs-md`. Nothing pins `margin: 0` or the colour, so a `.said` with only `font-size` passes every test and keeps the browser margin Axel reported.
  - The before/after note and the look must name the margin, and the case should say it is an audit plus the look.
- The hint case ("drawn in the `code` the head styles") passes on the unchanged tree, so it is an audit. Type-scale line 124, once it reads `.meta=fs-sm | code=fs-sm`, pins the size; nothing pins `font-family: var(--font-mono)`.
- The zero-partitions case holds for the guard.
- The step line as a whole: items 1 and 2 pass the suite with only the font-size set, and the margin and the family rest on the look alone. Item 3's write path passes with no handler. Item 4 cannot pass without the words. Item 5 is as above.

## Implied inputs

On `<details ontoggle>` looping:
- There is no loop. `node_modules/svelte/package.json` is 5.57.1 (package.json declares `^5.57.0`). `elements.d.ts:949-957` gives `HTMLDetailsAttributes` both `open` and `ontoggle?: ToggleEventHandler<HTMLDetailsElement>`, so `event.currentTarget.open` is typed.
- `toggle` is not in svelte's `DELEGATED_EVENTS` (`src/utils.js:110-134`), so the handler is attached to each `<details>` directly. `toggle` does not bubble, so the inner fold's event does not reach the outer handler.
- When `open` is set from held state (at mount, or when `<details open>` is parsed), a `toggle` fires with `currentTarget.open` equal to the held value, and the brief's equality guard writes nothing.
- After a user close writes `capacity: false`, svelte removes an attribute already absent: no state change, no second event.
- The guard is all that prevents a redundant write on every mount. It is load-bearing and has no red test (see The question).

Inputs the step implies that "Cases" does not cover, each with its expected result:
- `[]` held: `parseHpcState([])` gives `{ capacity: true, sinfo: false }`, since `isMap` rejects arrays. Missing.
- `{ capacity: null, sinfo: 'true' }` held: defaults for both keys. Missing; cases 3-4 cover only `'no'` and `1`.
- `{ capacity: false, sinfo: true }` held: the outer `<details>` has no `open`, the inner carries `open`, and the inner is in the markup inside the closed outer. Missing.
- An unreachable payload with no `hint`: the paragraph carries `class="said"` and no `<code>` is drawn. Missing.
- `status: 'error'`: `Hpc.svelte:61` (`data.status !== 'ok'`) draws the same `unreachable_msg` paragraph, which must carry `class="said"`. Missing, and the step line's "unreachable line" covers this state too.
- An unreachable payload with no sinfo rows but quota rows: `Hpc.svelte:64` still draws `Capacity`. Expected: an outer fold "Cluster capacity - 0 partitions" with no inner fold, under the failure line. Missing, and whether an empty fold is drawn at all is left open.
- One sinfo row: the inner summary reads "sinfo table - 1 rows". The brief gives the outer summary a singular form but not the key it rewrites. Missing; add `capacity_summary_one` or state the choice.
- A write through `onheld`, and a toggle equal to held: these need the pure functions under Cases and checks. Case 12 admits a reading, which contradicts verify item 4.
- `ontoggle` under `svelte/server`: event handlers are not emitted in SSR, so no unit case can fire the event. Case 12 says so.
- A starting payload with an empty sinfo: `Capacity` is not drawn (line 64), only the fetching paragraph shows. Covered implicitly; no case needed.

## Declined to judge

- The new catalog words use a spaced hyphen ("Cluster capacity - {0} partitions", "sinfo table - {0} rows"). The hub's CLAUDE.md writing rules ban a spaced hyphen standing in for a dash in authored YAML; spec.md, the only standards page, does not, and hpc.yml already uses the form (`unreachable_msg`, `recent_summary`). A possible clash between the hub rule and the catalog's convention, for the orchestrator or Axel.
- Whether the fetching line should use `ui/frame/Empty.svelte`: a design call; the evidence is above.

## Usage

147043 tokens, 55 tool uses, 6 min 56 s (415958 ms), from the agent's completion notice.

## Closed

Each finding is closed in the brief as rewritten before the preparation commit:
1. The corrected step line (plan.md:255): committed in the preparation commit.
2. `useState()` cited as imported at line 30 and called at lines 32-34.
3. The hint's before size: the brief now says the body is an absolute 15px, that Chrome may draw the hint at 15px, and that the before size is measured at the look.
4. The test line corrected to 99.
5. The `.said` citation: the muted colour is cited from Calendar:271, Inbox:228 and History:248, and Focus is named as sharing the size in the accent colour.
6. `fields()` and the spread of the raw held map: the spread is dropped. `onheld` writes the parsed `HpcViewState`, as the tree's other views do (decision 7), so no merge is left to prove.
7. The toggle guard: it is now the pure function `toggledHpcState(held, key, open)` in `hpc.ts`, with four unit cases and a named revert (the guard removed). The handler's wiring is a landing look: close the fold, switch tab, reload, in two panes.
8. The primitive rule: decision 1 states the `<details>` as an exception and why.
9. `Empty`: the fetching line uses `ui/frame/Empty.svelte`, and the unreachable line stays `.said` (decision 5).
10. Margin and family pinned by no test: item 5 and the hint case say so and name the look.
11. The missing inputs are added as cases: `[]`, `{ capacity: null, sinfo: 'true' }`, both keys held, no hint, `status: 'error'`, and one sinfo row with the new key `capacity_summary_one`.
12. No sinfo rows: no capacity fold is drawn (decision 6), and a case covers both the ok and the unreachable-with-quota payload.
13. The fetching line off the step line: item 1 says it is fixed with the unreachable line for the same defect.
14. The spaced hyphen: the new and changed words use parentheses (`Cluster capacity (N partitions)`, `sinfo table (N rows)`), which clash with neither rule.
