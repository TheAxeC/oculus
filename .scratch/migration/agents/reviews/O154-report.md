# O154 report: handed back before any code change

NOT done: nothing of "What to build" (items 1 to 7) is built and no source file is changed. Case C13 contradicts the brief's own rules (C2, items 1 and 2: the same `hubList(roots(), primary())` argument and "the Hub group by the board's rule"), so the step is handed back at the first run, before any code change, as the brief's "Cases" section and `spec.md:7` require. The orchestrator's ruling on C13 is needed before the build.

## Open items of the state file

Verbatim from `.scratch/migration/orchestrator-state.md:169-173`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## The case the brief's rules get wrong: C13

- The case: "C13. Two hubs in the workspace: the Hub group is drawn as the board draws it for projects of one hub, listing the deck's hub alone; a project of the second hub with the same key as a member is never a member."
- The rule it breaks: C2 requires the hubs argument to be the same in both call sites, `hubList(roots(), primary())` (`Projects.svelte:173`: `const hubs = $derived(hubList(roots(), primary()));`), and items 1 and 2 require "the Hub group by the board's rule". The board's rule lists every hub of `hubs`, whether or not a project of the board is of it: `facets.ts:298-303` (`if (facet === 'hub') { const values = hubs.map((hub) => ({ value: hub, label: hub, count: counts.get(hub) ?? 0 }));`) and the doc comment of `facets` (`facets.ts:270-272`: "lists the hubs of `hubs` (their names, in the workspace's order, empty with one hub) whether or not a project of the board is of it"). `PickMenu.svelte` draws a choice of count 0 like any other (`grep -n "count" src/lib/views/shared/forms/bar/PickMenu.svelte` shows only the drawn count at `:115` and comments, no filter on 0).
- The result: the board's chain over three member projects of hub `hub`, with `hubs = ['hub', 'hub2']`, draws the Hub group with both hubs, the second at 0 (case-run below): `C13 hub group: [["hub",2],["hub2",0]]`. A board whose projects are all of one hub draws the same. So "listing the deck's hub alone" holds only if the Present view hands the function `[deck.hub]` (or filters the group), which breaks C2's identical argument and items 1 and 2; and C2 held as written makes C13's "alone" false.
- The second half of C13 (a project of the second hub with the same key is never a member) is consistent with item 4 and is built by matching `rootOf(item.project) === deck.hub` before the function is called: `C13 member ids: ["a","b","c"]` in the run, the second hub's `hub2:a` left out.
- Options for the ruling:
  - (a) C13 reads: "the Hub group is drawn as the board draws it, listing every hub of the workspace, the deck's hub with its count and the others at 0". It keeps C2 and items 1 and 2 exactly, and the Present bar is the board's bar with nothing of its own. Recommended (a judgment): it is what "exactly the same filter" (ruling Board filter on decks) asks.
  - (b) The Present view hands `[deck.hub]` as the hubs. The Hub group then lists one hub, which `hubList` itself refuses to list on the board ("a list of one hub could hide nothing worth asking for", `hubs.ts:61-66`), and C2 must be reworded to name a differing argument; it is a behaviour in which the Present filter differs from the board's, which item 6 says is gone.
  - Neither is the lazy option by cost; (b) is the one that adds a Present-only rule.

## The cases' first run

Every case was run or read on the unchanged tree (`git status --short` in the worktree printed nothing before and after the run). The runs that are programs are the case-run program below; the rest are readings, each with the file and line read.

- C1. Read: `Bar.svelte:123-130` draws `FilterBar` with `label`, `groups`, `line` and `ontoggle` only (no search, no toggles, no Mine only, no badges, no `SliceLine`); `filter.svelte.ts:164` hands `line: FILTER_GROUPS`, `present.ts:125` `[STAGE_FACET, 'status', 'tier', 'pillar', 'form']`. Run: `C1 base groups: ["stage","tier"]` (the fixture's members carry a stage and a tier the empty preset's words know). The base draws the O147 groups only, as the case says.
- C2. Run of the board's chain (`Projects.svelte:193-224`, call for call) over the deck's matched members and over a board of the same projects: `C2 members: {"mine":true,"heldFilters":{},"heldMine":true,"groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]}`, `C2 same projects as a board: ... equal true` (same line, `equal true` printed by the program), over the whole portfolio `"shown":["a","c","z"]`, `C2 stats over members: {"projects":3,"blocked":0,"dated":1,"waiting":0,"warnAt":4,"venues":[]}`. The case's rule holds for the chain; the function and the side-by-side reading do not exist on the base.
- C3. Read: `state.ts:99` and `:112` (`needle === '' || item.haystack.includes(needle)`); on the base the Present bar has no search (`Bar.svelte:124-129`). The case's rule is the board's.
- C4. Read: `state.ts:102-104` (stale by `isStale`, dated by `deadline`, waiting by `waiting.length`); none on the base Present bar.
- C5. Read: `state.ts:142-144` (`offersMine`), `:157` (`mine: true` by default), `FilterBar.svelte:158-166` (Mine only drawn while `named && onmine !== undefined`, disabled while `!mine`), `filter-menu.ts:159-160` (Role left out while `!named`). Run: `C5 base keptKeys with no pick: null` (the base never narrows by Mine only).
- C6. Read: `SliceLine.svelte:129-141` (a category's label picks or takes out its slices), `:164` (a slice by `withPick`), `:194-200` (Clear all writes `onfilters({})`, which leaves `search` and the toggles, since the board's `write` merges `{ ...held, ...next }`, `Projects.svelte:251-253`).
- C7. Read: `filter-menu.ts:271-274` (`shownWords`: "count_shown" while `shown < total`, else "count_one" or "count"); the members are board items, one per project.
- C8. Read: `present.ts:174-176` (`filterable`) and `filter.svelte.ts:153` (`bar` null for a deck with no group of project decks), `Bar.svelte:123` (no `FilterBar` then).
- C9. Read: `present.ts:478-487` (`leftDeck` sets `filters: {}`, keeps `facts`); `Present.svelte:217` and `:258` are the only writes of the pane besides `presentation.svelte.ts:68` (`grep -rn "setInstanceState\|restateInstance" src/lib/views/academic/present src/lib/state/life`), and none writes a file.
- C10. Read: `filter.svelte.ts:85-94` (`keepFor` reads the saved picks and the board items at the call), `presentation.svelte.ts:65` (the link's `keep` is `reads.keepFor(id, ref)`), `acts.svelte.ts:88-94` (the export takes the pane's own `keep`, refusing while it is undefined), `present.svelte.ts:629-633` and `:723-729` (the audience window told the list).
- C11. Read: `filter.svelte.ts:124-132` (the drawn answer: pending reads `last` only for the same deck, so a first open shows the loading answer). On the base a saved pick with no snapshot gives `undefined` (`:87`), which asks nothing.
- C12. Run: the board's parser over `{ filters: { stage: ['idea'], tier: ['research'], slice: ['gone/idea'] } }`: `C12 board chain: {"mine":true,"heldFilters":{"tier":["research"]},"heldMine":true,...}`: the stage pick and the stale slice dropped, the tier pick kept, Mine only on, nothing thrown. The base O147 parser: `C12 base O147 parse: {"stage":["idea"],"tier":["research"]}`.
- C13. Run: `C13 hub group: [["hub",2],["hub2",0]]`, `C13 member ids: ["a","b","c"]`. Wrong under the brief's rules, above.
- C14. Read: `Projects.svelte:189-235` is the chain the function of item 1 takes over; G124 (`guarded.md:186-188`) and G92 (`guarded.md:320-322`) name its tests, not run at the first run since no code changed.
- C15. Run on the base: the first grep prints 58 lines (`... | wc -l`), every one in a file of the write list (`present.ts`, `collection/bar.ts`, `Present.svelte`, `filter.svelte.ts`, `Bar.svelte`, `present.yml:89-90`, `docs/templates.md:1914`, `docs/HELP.md:331`, `docs/decks.md:377` and `:379`).
- C16. Read: `Present.svelte:141` (`held` is `parsePresentState(...)`), `:217` (`{ ...held, ...changes }`), `screen/box.ts:29` and its writes through `reads.write`, `presentation.svelte.ts:68`; every write goes through `parsePresentState`, so a field it does not hold is lost (`present.ts:147-156` holds only `slide`, `overview`, `recent`, `filters`, `facts`).
- C17. Read: `present.svelte.ts:716-729` (the presentation's effect root reads `link.keep()`), `filter.svelte.ts:92-94` (`keepFor` reads the saved state at the call, so it answers while the pane is not drawn).
- C18. Read: `filter.svelte.ts:87` (undefined while the snapshot is not read), `present.svelte.ts:277-294` (`exportKeep` waits `wait` ms and answers undefined), `routes/present/print/+page.svelte:100` (the 5 s wait, `KEEP_WAIT_MS`).
- C19. Read: `data/sources/deck/groups.ts:216-219` (`keptMembers`: undefined keeps every member; a kept list drops a member that is no project's deck).
- C20. Run: `C20 Mine only applies: true shown: []`, `C20 a pick no member carries, shown: []`; the kept list built from `shown` is `[]`. The slide rule is `filter.svelte.ts:136-144`.
- C21. Read: `present.svelte.ts:356-374` (one query per kept list, `keyOf`), `filter.svelte.ts:124-132` (the pane draws the answer of its current list, or the last one while pending).
- C22. Read: `Present.svelte:326-352` and `:356-377`: the bar is the `Pane`'s `bar` snippet and the keys are bound to the box `div` (`onkeydown={keys}`), so a key in the bar's field never reaches `screen/box.ts`.
- C23. Read: `present.svelte.ts:330-353` (a `files` message marks the held deck answers), `filter.svelte.ts:124-144`.
- C24. Read: `filter.svelte.ts:92-94` and `:101-106` (each pane's list from its own instance state), `acts/export.ts:118-150` (`answerPrint`: the print page is answered by the exporting pane's channel reply only).
- C25. Read: `state.ts:170` (`mine: z.boolean().catch(true)`) and `:157` (absent reads as on).
- C26. Read: `Projects.svelte:170-187` (the Awaiting tab's items and preset feed the same chain).

### The case-run program

Run from the worktree root, with Node 24.21.0 first on PATH: `CASE_FILE=<scratch>/base.test.ts npx vitest run --config <scratch>/vitest.config.ts`, where `<scratch>` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun`. It writes nothing; both files are removed after this report. Its last lines: `Test Files  1 passed (1)`, `Tests  5 passed (5)`.

`vitest.config.ts`:

```ts
import { svelte } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154/node_modules/@sveltejs/vite-plugin-svelte/src/index.js';

export default {
    root: '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154',
    plugins: [svelte()],
    test: {
        globals: true,
        environment: 'node',
        include: [process.env.CASE_FILE],
        reporters: ['verbose']
    }
};
```

`base.test.ts`:

```ts
// Case-run program, first run on the unchanged tree: the Projects board's chain (Projects.svelte
// lines 193-224, copied call for call) over the members of a deck, and the base Present filter
// (present.ts filterGroupsOf and keptKeys) over the same deck. It prints each case's result.
import {
    appliedFilters,
    applyFilters,
    facets,
    filterGroups,
    mapPreset,
    offersMine,
    parseBoardState,
    sliceGroups,
    type BoardItem
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154/src/lib/state/boards/board/index.ts';
import { stats } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154/src/lib/state/boards/board/stats.ts';
import {
    filterGroupsOf,
    keptKeys,
    parsePresentState
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154/src/lib/state/life/present.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154/src/lib/state/shared/words/text.ts';

// Every text key reads as itself, so no config file is read.
setCatalog(new Proxy({}, { get: (_t, key) => String(key) }) as Record<string, string>);

function item(key: string, root: string, over: Record<string, unknown> = {}): BoardItem {
    return {
        id: root === 'hub' ? key : `${root}:${key}`,
        project: { id: root === 'hub' ? key : `${root}:${key}`, root, chips: ['active'], form: 'paper', tier: 'research', stage: 'drafting' },
        tone: '',
        category: '',
        slice: '',
        venue: null,
        year: '2026',
        domain: null,
        pillars: [],
        funding: [],
        datasets: [],
        team: [],
        teamLine: '',
        chips: [],
        compute: [],
        reproduced: false,
        code: '',
        sessions: 'none',
        waiting: [],
        role: 'lead',
        lead: true,
        mine: true,
        haystack: key,
        ...over
    } as unknown as BoardItem;
}

const PORTFOLIO = [
    item('a', 'hub'),
    item('b', 'hub', { mine: false, role: '' , haystack: 'b beta' }),
    item('c', 'hub', { project: { id: 'c', root: 'hub', chips: ['blocked'], form: 'grant', tier: 'research', staleDays: 4, deadline: '2026-12-01' } }),
    item('z', 'hub'),
    item('a', 'hub2', { mine: false })
];
const MEMBERS = ['a', 'b', 'c'];
const DECK_HUB = 'hub';
const memberItems = PORTFOLIO.filter(
    (one) => (one.project.root ?? '') === DECK_HUB && MEMBERS.includes(one.project.id)
);
const preset = mapPreset({});

/** Projects.svelte lines 193-224, call for call. */
function chain(items: BoardItem[], named: boolean, hubs: string[], raw: unknown, lag: number) {
    const mineApplies = offersMine(items, named);
    const offered = facets(items, preset, named);
    const slices = sliceGroups(items, preset);
    const held = parseBoardState(raw, preset.labels, offered, slices.flatMap((g) => g.slices.map((s) => s.value)));
    const quick = { stale: held.stale, dated: held.dated, waiting: held.waiting, mine: mineApplies && held.mine, staleLag: lag };
    const filters = appliedFilters(held.filters, named, hubs);
    const counted = facets(items, preset, named, { filters, search: held.search, quick }, hubs);
    const groups = filterGroups(counted, held.filters, preset, named, hubs);
    const shown = applyFilters(items, filters, held.search, quick);
    return { held, mineApplies, slices, counted, groups, quick, shown };
}

const brief = (r: ReturnType<typeof chain>) => ({
    mine: r.mineApplies,
    heldFilters: r.held.filters,
    heldMine: r.held.mine,
    groups: r.groups.map((g) => `${g.id}:${g.items.map((i) => `${i.id}=${i.count}`).join(',')}`),
    shown: r.shown.map((one) => one.id)
});

test('C2 the board chain over the members equals the chain over a board of those projects', () => {
    const a = brief(chain(memberItems, true, [], {}, 1));
    const b = brief(chain([...memberItems], true, [], {}, 1));
    console.log('C2 members:', JSON.stringify(a));
    console.log('C2 same projects as a board:', JSON.stringify(b), 'equal', JSON.stringify(a) === JSON.stringify(b));
    console.log('C2 whole portfolio:', JSON.stringify(brief(chain(PORTFOLIO, true, [], {}, 1))));
    console.log('C2 stats over members:', JSON.stringify(stats(memberItems, {}, {}, () => ({}))));
});

test('C12 a saved O147 state and a stale slice', () => {
    const saved = { filters: { stage: ['idea'], tier: ['research'], slice: ['gone/idea'] } };
    const r = chain(memberItems, true, [], saved, 1);
    console.log('C12 board chain:', JSON.stringify(brief(r)));
    console.log('C12 base O147 parse:', JSON.stringify(parsePresentState(saved).filters));
});

test('C13 two hubs: the Hub group as the board draws it', () => {
    const r = chain(memberItems, true, ['hub', 'hub2'], {}, 1);
    console.log('C13 hub group:', JSON.stringify(r.groups.find((g) => g.id === 'hub')?.items.map((i) => [i.id, i.count])));
    console.log('C13 member ids:', JSON.stringify(memberItems.map((one) => one.id)));
});

test('C20 Mine only with no member the users', () => {
    const none = memberItems.map((one) => ({ ...one, mine: false, role: 'other' }) as BoardItem);
    const r = chain(none, true, [], {}, 1);
    console.log('C20 Mine only applies:', r.mineApplies, 'shown:', JSON.stringify(r.shown.map((o) => o.id)));
    const pick = chain(memberItems, true, [], { mine: false, filters: { form: ['nothing'] } }, 1);
    console.log('C20 a pick no member carries, shown:', JSON.stringify(pick.shown.map((o) => o.id)));
});

test('C5 and C7 on the base Present filter', () => {
    const deck = { hub: DECK_HUB, groups: [{ members: MEMBERS.map((projectId) => ({ projectId, kept: true, path: projectId })), candidates: [] }] };
    const groups = filterGroupsOf(deck as never, PORTFOLIO, {}, preset);
    console.log('C1 base groups:', JSON.stringify(groups.map((g) => g.id)));
    console.log('C5 base keptKeys with no pick:', JSON.stringify(keptKeys(PORTFOLIO, DECK_HUB, {}, preset)));
    console.log('C12 base keptKeys under the O147 state:', JSON.stringify(keptKeys(PORTFOLIO, DECK_HUB, parsePresentState({ filters: { stage: ['drafting'], tier: ['research'] } }).filters, preset)));
});
```

Its output, the stdout lines as printed:

```
C2 members: {"mine":true,"heldFilters":{},"heldMine":true,"groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]}
C2 same projects as a board: {"mine":true,"heldFilters":{},"heldMine":true,"groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]} equal true
C2 whole portfolio: {"mine":true,"heldFilters":{},"heldMine":true,"groups":["year:2026=3","tier:research=3","funding:__none__=3","compute:__none__=3","reproduced:0=3","code:__none__=3","sessions:none=3"],"shown":["a","c","z"]}
C2 stats over members: {"projects":3,"blocked":0,"dated":1,"waiting":0,"warnAt":4,"venues":[]}
C12 board chain: {"mine":true,"heldFilters":{"tier":["research"]},"heldMine":true,"groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]}
C12 base O147 parse: {"stage":["idea"],"tier":["research"]}
C13 hub group: [["hub",2],["hub2",0]]
C13 member ids: ["a","b","c"]
C20 Mine only applies: true shown: []
C20 a pick no member carries, shown: []
C1 base groups: ["stage","tier"]
C5 base keptKeys with no pick: null
C12 base keptKeys under the O147 state: ["a","b","z"]
```

The fixture's preset (`mapPreset({})`) holds no words, so the Form and Situation groups list no value (`orderValues` keeps only the values the words know); that is the fixture's, and the chain's rule is unaffected. The last line shows the base's `keptKeys` keeping a project of the deck's hub that is no member (`z`), which the server narrowing then ignores.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| First run of every case | DONE | The section above; `git status --short` printed nothing |
| Items 1 to 7 | NOT DONE | Handed back on C13; `git status --short` prints only the report |
| Verify 1 (`npm run diagrams && npm run docs:palette`, `npm run test:quick`) | NOT DONE | Not run: no code changed; the list was run 0 times |
| Verify 2 (the five test files) | NOT DONE | Not run: no code changed |
| Verify 3 (C15 grep) | NOT DONE | On the base it prints 58 lines, all in the write list |
| Verify 4 to 8 | NOT DONE | No file but this report changed |

No whole-suite command was run.

## Files

`git status --short` after writing this report: only `.scratch/migration/agents/reviews/O154-report.md`, the report, which is in the write list.

## Before and after, the side-by-side reading of C2, the comments and docs

None: no code changed. The intended build, for the orchestrator to weigh with the ruling: the pane reads the deck's members from the store's whole-deck answer (`deck(ref, null)`, which `asking` never drops, `present.svelte.ts:476`, and the query client never collects, `gcTime: Infinity`, `queries.svelte.ts:49`), so `keepFor` and the pane's own `keep` are one function of the instance state and that answer, and a pane opened on a narrowing state draws its loading state until the narrowed answer is in. A pane whose list is narrowed then reads two answers per push, the whole deck's and the narrowed one.

## Anything in the brief that was wrong or impossible

C13, as above. Every other premise checked held: `wc -l` gives Projects.svelte 487, filter-menu.ts 334, present.ts 812, Present.svelte 461, Bar.svelte 158, filter.svelte.ts 172; `ls src/lib/state/boards/board | wc -l` gives 10; `grep -rn "ProjectLayout\|projectFilter\|projectKeeps" src tests | grep -v collection/bar.ts` lists only `present.ts:128`, `:235`, `:251`; `ProjectLayout` is also used by the collection's own `sectionLayout` (`collection/bar.ts:111`), so it stays there; `deckHub` has no caller but `filter.svelte.ts:89`.
