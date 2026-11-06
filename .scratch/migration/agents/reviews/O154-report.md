# O154 report: the project board's filter on the Present view

Everything in the brief and in repair round 1 is done.

## Open items of the state file

Verbatim from `.scratch/migration/orchestrator-state.md:169-173`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## Repair round 1

The round brief (`agents/briefs/O154-round-1.md`) gives one ruling, on the review's Spec 1 finding (`agents/reviews/O154-refuter.md`).

| Ruling | State | Check |
| --- | --- | --- |
| 1. List `wrap.py` and `short.py`, every run with its input and output, and every comment paragraph shaped by that output; read each paragraph against the rules file's comment rules; fix any that breaks them | DONE | The section "Programs" below. Each listed paragraph was read in the worktree and compared line by line with the output its run printed (the transcript's tool results). Every one is filled to 100 columns, with no line ending short inside a sentence, and says what and why with no history. None needed a fix, so this round changed no file of the step. `git diff --stat` still prints `22 files changed, 371 insertions(+), 484 deletions(-)`, as before the round. |

Closed in the round brief, not sent: the edits at `docs/decks.md:131` and `docs/HELP.md:334` stand.

In this round I wrote no program and made no file edit outside this report.

## Programs

Both programs ran in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/wrap/`, which is now removed. The sources and runs below are copied from my transcript (`/Users/axelfaes/.claude/projects/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/subagents/agent-acf1b0553e05d698a.jsonl`, the Bash tool calls and their results). Neither program wrote a file. Each printed text, and I put that text into the files with Edit.

`wrap.py`, written at 10:36:36 UTC:

```python
# Prints a paragraph wrapped greedily at 100 columns under a comment prefix; writes nothing.
import sys, textwrap
prefix = sys.argv[1]
text = sys.stdin.read().split()
print('\n'.join(textwrap.wrap(' '.join(text), width=100, initial_indent=prefix, subsequent_indent=prefix, break_long_words=False, break_on_hyphens=False)))
```

`short.py`, written at 10:47:31 UTC:

```python
# Prints comment lines that end short: the next line of the same paragraph has a first word that fits.
import re, sys
for path in sys.argv[1:]:
    lines = open(path).read().split('\n')
    for i in range(len(lines) - 1):
        a, b = lines[i], lines[i + 1]
        ma = re.match(r'^(\s*(?://|\*)\s?)(.*)$', a)
        mb = re.match(r'^(\s*(?://|\*)\s?)(.*)$', b)
        if not ma or not mb or ma.group(1) != mb.group(1):
            continue
        if not ma.group(2).strip() or not mb.group(2).strip() or mb.group(2).startswith(('-', '`-')):
            continue
        first = mb.group(2).split()[0]
        if len(a) + 1 + len(first) <= 100:
            print(f'{path}:{i+1}: {a.strip()[:70]}')
```

Every run, in order. The input to `wrap.py` is always the paragraph's text as I wrote it, given on stdin, and its printed lines are the paragraph as it now stands at the place named. "Equal" means the lines in the worktree today match the printed lines one for one; I compared them by reading.

1. 10:36:36, `wrap.py '    // '`. Input: the Projects.svelte head paragraph "The header holds New project, Cards and List ...". It printed 16 lines, equal to `src/lib/views/boards/projects/Projects.svelte:55-70`. The same command then went on to an `echo ======` that zsh refused (`(eval):11: ===== not found`), so the second wrap in that command never ran.
2. 10:36:53, `wrap.py '    // '`. Input: the Projects.svelte paragraph "It joins nothing and counts nothing itself: ...". It printed 10 lines, equal to `Projects.svelte:88-97`.
3. 10:39:44, `wrap.py '    // '`. Input: the Bar.svelte head comment "Layer 3, Present partial. The toolbar of the Present pane: ...". It printed 10 lines, equal to `src/lib/views/academic/present/Bar.svelte:2-11`.
4. 10:40:08, `wrap.py '    // '`. Input: the Present.svelte paragraph "A deck whose groups hold project decks draws the Projects board's filter ...". It printed 6 lines, equal to `src/lib/views/academic/present/Present.svelte:31-36`.
5. 10:40:55, `wrap.py ' * '`. Input: the `projectGroups` doc "The groups of a layout, in its order: ...". It printed 4 lines, equal to `src/lib/state/boards/collection/bar.ts:311-314`. In the same command, `sed -n 359,392p` of bar.ts printed the `projectFilter` and `projectKeeps` code, which I then removed with Edit.
6. 10:41:16, `wrap.py '// '`. Input: the map-bar.ts paragraph "The Stage group lists every stage a project is at, ...". It printed 9 lines, equal to `src/lib/state/boards/structure/map-bar.ts:8-16`. The only difference from the base copy is at the end, where the base's last two lines became line 16.
7. 10:41:35, `wrap.py '    // '` twice. Inputs: the FilterBar.svelte head paragraph "Layer 3, shared view partial ... Line 1 of their bar: ..." and the SliceLine.svelte head paragraph "... Line 2 of their bar: ...". It printed 13 lines each, equal to `src/lib/views/shared/forms/bar/FilterBar.svelte:2-14` and `src/lib/views/shared/forms/bar/SliceLine.svelte:2-14`.
8. 10:42:30, `wrap.py '// '`. Input: the present.svelte.ts paragraph "What is held here is where decks are: ...". It printed 12 lines, which are `src/lib/state/life/present.svelte.ts:4-15`. They are equal except one word: line 9 says "the projects the filter shows" where the output said "keeps". I changed that word afterwards with Edit; both words have five letters, so the line breaks did not move.
9. 10:47:31, `short.py` over the 12 changed source files. It printed 40 lines naming a file and a line number:
   - `filter-menu.ts:12, :15, :215, :218`, `filter.svelte.ts:17, :18`, and `present.ts:9, :10, :15, :182, :412`. These are lines in paragraphs of mine, and I rewrapped those paragraphs in runs 10 and 11.
   - `filter-menu.ts:18, :94`, `present.ts:206, :659, :670, :671`, `present.svelte.ts:39, :70, :127, :169, :202`, `collection/bar.ts:2, :5, :16, :22, :103, :332, :364, :556`, `map-bar.ts:2`, `Projects.svelte:72`, `Present.svelte:55, :56, :58, :250`, and `FilterBar.svelte:16, :17, :18, :117`. These are base lines that no hunk of `git diff -U0` touches, and I left them as they are.
10. 10:47:50, `wrap.py` six times, with a small shell function in the same command calling it.
    - Inputs, in order, with the output now at:
      - the filter-menu.ts head paragraph "The whole filter of a project board's bar ..." (`//`): `src/lib/state/boards/board/filter-menu.ts:11-16`;
      - the `boardFilter` doc (` * `): `filter-menu.ts:211-219`;
      - the `shownKeys` doc (` * `): `src/lib/state/life/present.ts:182-185`;
      - the `leftDeck` doc (` * `): `present.ts:410-413`;
      - the present.ts paragraph "What is here is the pane's own state ..." (`//`): `present.ts:6-11`;
      - the present.ts paragraph "A pane's filter is the Projects board's filter ..." (`//`): `present.ts:13-18`.
    - Each printed paragraph is equal to the lines named.
11. 10:48:19, `wrap.py '// '`. Input: the filter.svelte.ts paragraph "The members are read from the deck's whole answer, ...". It printed 10 lines, equal to `src/lib/views/academic/present/acts/filter.svelte.ts:10-19`.
12. 10:48:28, `short.py` over filter-menu.ts, BoardBar.svelte, filter.svelte.ts and present.ts, with the base lines of run 9 filtered out by `grep -v`. It printed nothing.

The paragraphs whose wording or line breaks came from that output, as they stand in the worktree:

| Paragraph | Run | Read against the comment rules |
| --- | --- | --- |
| `src/lib/views/boards/projects/Projects.svelte:55-70` (head comment, item 7) | 1 | holds |
| `src/lib/views/boards/projects/Projects.svelte:88-97` (head comment, item 7) | 2 | holds |
| `src/lib/views/academic/present/Bar.svelte:2-11` (head comment, item 7) | 3 | holds |
| `src/lib/views/academic/present/Present.svelte:31-36` (head comment, item 7) | 4 | holds |
| `src/lib/state/boards/collection/bar.ts:311-314` (`projectGroups` doc) | 5 | holds |
| `src/lib/state/boards/structure/map-bar.ts:8-16` (head comment, item 7) | 6 | holds |
| `src/lib/views/shared/forms/bar/FilterBar.svelte:2-14` (head comment, item 7) | 7 | holds |
| `src/lib/views/shared/forms/bar/SliceLine.svelte:2-14` (head comment, item 7) | 7 | holds |
| `src/lib/state/life/present.svelte.ts:4-15` (head comment, item 7) | 8 | holds |
| `src/lib/state/boards/board/filter-menu.ts:11-16` (head comment, item 7) | 10 | holds |
| `src/lib/state/boards/board/filter-menu.ts:211-219` (`boardFilter` doc) | 10 | holds |
| `src/lib/state/life/present.ts:182-185` (`shownKeys` doc) | 10 | holds |
| `src/lib/state/life/present.ts:410-413` (`leftDeck` doc) | 10 | holds |
| `src/lib/state/life/present.ts:6-11` (head comment, item 7) | 10 | holds |
| `src/lib/state/life/present.ts:13-18` (head comment, item 7) | 10 | holds |
| `src/lib/views/academic/present/acts/filter.svelte.ts:10-19` (head comment, item 7) | 11 | holds |

How each was read:
- Width: `grep -n '^.\{101,\}$'` over the eleven files prints no comment line. The comment-width check of `test:quick` is green at the end of the round.
- No short line: each line was read with the first word of the line after it. In every case that word does not fit on the line, so no line ends short inside a paragraph. Where a line ends early, the next word is a long path or a code span: for example `Projects.svelte:96` before `views/boards/project/Project.svelte`, `Present.svelte:32` before `(acts/filter.svelte.ts):`, and `Bar.svelte:10` before `acts/filter.svelte.ts`.
- What and why: each paragraph says what its file holds or draws, and where it states a reason it is in the same sentence. Examples: filter-menu.ts:15-16 on why `boardFilter` lives there, and filter.svelte.ts:10-13 on why `keep` and `keepFor` give the same list.
- No history: none of them names an earlier form of the code, a step, a date or a reverted attempt. "a hub picked earlier narrows nothing" (`Projects.svelte:70`) and "stays as it was" (`present.ts:413`) each describe a saved value and how it behaves now.

No paragraph needed a fix, so the round made no edit to a source file.

The comment paragraphs of the step that are not in this table were written by hand with Edit, with no program output. They are: BoardBar.svelte's head comment and prop docs, filter.svelte.ts:1-8 and :21-25, and the other doc comments in present.ts, filter-menu.ts and filter.svelte.ts.

## The cases' first run

Every case was run or read on the unchanged tree (`git status --short` printed nothing before the run). The runs used the case-run program `base.test.ts`, quoted after this list and run with the `vitest.config.ts` quoted under the changed tree's program; the other cases were readings, each with its file and line.

- C1. Read: base `Bar.svelte:123-130` drew `FilterBar` with `label`, `groups`, `line` and `ontoggle` only; `present.ts:125` `FILTER_GROUPS` = Stage, Status, Tier, Pillar, Form. Run: `C1 base groups: ["stage","tier"]`.
- C2. Run of the board chain (`Projects.svelte:193-224`, call for call) over the matched members and over a board of the same projects: `C2 same projects as a board: ... equal true`; `C2 stats over members: {"projects":3,"blocked":0,"dated":1,"waiting":0,"warnAt":4,"venues":[]}`.
- C3. Read: `state.ts:99`, `:112` (the haystack search); no search on the base Present bar.
- C4. Read: `state.ts:102-104`; no toggles on the base Present bar.
- C5. Read: `state.ts:142-144`, `:157`, `FilterBar.svelte:158-166`, `filter-menu.ts:159-160`. Run: `C5 base keptKeys with no pick: null`.
- C6. Read: `SliceLine.svelte:129-141`, `:164`, `:194-200`; `Projects.svelte:251-253`.
- C7. Read: `filter-menu.ts:271-274` (`shownWords`).
- C8. Read: `present.ts:174-176`, `filter.svelte.ts:153`, `Bar.svelte:123`.
- C9. Read: `present.ts:478-487` (`leftDeck` sets `filters: {}`); the pane's writes, from `grep -rn "setInstanceState\|restateInstance" src/lib/views/academic/present src/lib/state/life`, are `Present.svelte:217`, `:258` and `presentation.svelte.ts:68`.
- C10. Read: `filter.svelte.ts:85-94`, `presentation.svelte.ts:65`, `acts.svelte.ts:88-94`, `present.svelte.ts:629-633`, `:723-729`.
- C11. Read: `filter.svelte.ts:124-132`, `:87`.
- C12. Run: `C12 board chain: {"mine":true,"heldFilters":{"tier":["research"]},"heldMine":true,...}`; `C12 base O147 parse: {"stage":["idea"],"tier":["research"]}`.
- C13. Run: `C13 hub group: [["hub",2],["hub2",0]]`, `C13 member ids: ["a","b","c"]`. Handed back: "listing the deck's hub alone" contradicted C2 and items 1 and 2, because the board's rule lists every hub of `hubs` (`facets.ts:270-272`, `:298-303`).
  - The orchestrator's ruling (`.scratch/migration/agents/briefs/O154-cases.md`): option (a). C13 now reads: "Two hubs in the workspace: the Hub group is drawn by the board's rule, listing every hub of the workspace, the deck's hub with its count and the others at 0, as the board does; a project of the second hub with the same key as a member is never a member. Checked by reading." The Present view passes `hubList(roots(), primary())` as the Projects board does. The planned build (members from the store's whole-deck answer; `keepFor` and the pane's `keep` one function of the instance state and that answer) stands inside the brief.
- C14. Read: `Projects.svelte:189-235`; G124 and G92 name its tests.
- C15. Run on the base: the first grep printed 58 lines, all in files of the write list.
- C16. Read: `Present.svelte:141`, `:217`, `screen/box.ts:29`, `presentation.svelte.ts:68`; base `present.ts:147-156` held only `slide`, `overview`, `recent`, `filters`, `facts`.
- C17. Read: `present.svelte.ts:716-729`, base `filter.svelte.ts:92-94`.
- C18. Read: base `filter.svelte.ts:87`, `present.svelte.ts:277-294`, `routes/present/print/+page.svelte:100`.
- C19. Read: `data/sources/deck/groups.ts:216-219`.
- C20. Run: `C20 Mine only applies: true shown: []`, `C20 a pick no member carries, shown: []`.
- C21. Read: `present.svelte.ts:356-374`, base `filter.svelte.ts:124-132`.
- C22. Read: `Present.svelte:326-352`, `:356-377` (the bar is the `Pane`'s `bar` snippet; the keys are bound to the box).
- C23. Read: `present.svelte.ts:330-353`, base `filter.svelte.ts:124-144`.
- C24. Read: base `filter.svelte.ts:92-106`, `acts/export.ts:118-150`.
- C25. Read: `state.ts:170` (`mine: z.boolean().catch(true)`).
- C26. Read: `Projects.svelte:170-187`.

`base.test.ts`, the first-run program:

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

It printed (stdout lines, as printed):

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

## The case-run program on the changed tree

Run from the worktree root with Node 24.21.0 first on PATH: `CASE_FILE=<scratch>/after.test.ts npx vitest run --config <scratch>/vitest.config.ts`. `<scratch>` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun`. It writes nothing. The folder with both programs (`base.test.ts` and `after.test.ts`) and the config is removed: `ls -d <scratch>` prints `No such file or directory`. A reviewer who runs them again writes the three files back from the text quoted here. The fixture preset `mapPreset({})` holds no words, so the Form and Situation groups list no value.

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

`after.test.ts`:

```ts
// Case-run program on the changed tree: the board's filter function over a deck's member projects
// and over a board of the same projects, the kept list, the Present state's parser and leftDeck.
// It prints each case's result.
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O154/src/lib';
const { boardFilter, mapPreset } = await import(`${W}/state/boards/board/index.ts`);
const { stats } = await import(`${W}/state/boards/board/stats.ts`);
const { leftDeck, memberItems, parsePresentState, shownKeys } = await import(`${W}/state/life/present.ts`);
const { setCatalog } = await import(`${W}/state/shared/words/text.ts`);

// Every text key reads as itself, so no config file is read.
setCatalog(new Proxy({}, { get: (_t, key) => String(key) }));

function item(key: string, root: string, over: Record<string, unknown> = {}) {
    const id = root === 'hub' ? key : `${root}:${key}`;
    return {
        id,
        project: { id, root, chips: ['active'], form: 'paper', tier: 'research', stage: 'drafting' },
        tone: '', category: '', slice: '', venue: null, year: '2026', domain: null,
        pillars: [], funding: [], datasets: [], team: [], teamLine: '', chips: [], compute: [],
        reproduced: false, code: '', sessions: 'none', waiting: [], role: 'lead', lead: true,
        mine: true, haystack: key, ...over
    };
}

const PORTFOLIO = [
    item('a', 'hub'),
    item('b', 'hub', { mine: false, role: '', haystack: 'b beta' }),
    item('c', 'hub', { project: { id: 'c', root: 'hub', chips: ['blocked'], form: 'grant', tier: 'research', staleDays: 4, deadline: '2026-12-01' } }),
    item('z', 'hub'),
    item('a', 'hub2', { mine: false })
];
const member = (projectId?: string, path = projectId ?? 'talk') => ({ projectId, path, kept: true });
const DECK = {
    hub: 'hub',
    groups: [
        { members: [member('a'), member('b'), member('talk-x', 'talk-x')].map((one, at) => (at === 2 ? { path: 'talk-x', kept: true } : one)), candidates: [] },
        { members: [member('c'), member('a')], candidates: [] },
        { members: [{ path: 'other', kept: true }], candidates: [] }
    ]
};
const preset = mapPreset({});
const members = memberItems(DECK, PORTFOLIO);
const words = (r: any) => ({
    mine: r.mine, named: r.named, heldFilters: r.held.filters, heldMine: r.held.mine, search: r.held.search,
    groups: r.groups.map((g: any) => `${g.id}:${g.items.map((i: any) => `${i.id}=${i.count}`).join(',')}`),
    shown: r.shown.map((one: any) => one.id)
});

test('C2 the function over the members and over a board of the same projects', () => {
    console.log('C2 members:', JSON.stringify(members.map((one: any) => one.id)));
    const deck = boardFilter(members, preset, true, [], {}, 1);
    const board = boardFilter(PORTFOLIO.filter((one) => ['a', 'b', 'c'].includes(one.id)), preset, true, [], {}, 1);
    console.log('C2 deck:', JSON.stringify(words(deck)));
    console.log('C2 board of the same projects equal:', JSON.stringify(words(deck)) === JSON.stringify(words(board)));
    console.log('C2 stats over members:', JSON.stringify(stats(members, {}, {}, () => ({}))));
    console.log('C2 kept list with Mine only on:', JSON.stringify(shownKeys(members, deck.shown)));
    const off = boardFilter(members, preset, true, [], { mine: false }, 1);
    console.log('C2 kept list with Mine only off:', JSON.stringify(shownKeys(members, off.shown)));
    const searched = boardFilter(members, preset, true, [], { mine: false, search: 'beta' }, 1);
    console.log('C3 search "beta":', JSON.stringify(shownKeys(members, searched.shown)));
    const stale = boardFilter(members, preset, true, [], { mine: false, stale: true }, 4);
    console.log('C4 stale toggle, lag 4:', JSON.stringify(shownKeys(members, stale.shown)));
    const unnamed = boardFilter(members, preset, false, [], {}, 1);
    console.log('C5 no person marked: mine', unnamed.mine, 'named', unnamed.named, 'kept', JSON.stringify(shownKeys(members, unnamed.shown)));
    const all = members.map((one: any) => ({ ...one, mine: true }));
    const allMine = boardFilter(all, preset, true, [], {}, 1);
    console.log('C5 every member the users: mine', allMine.mine, 'kept', JSON.stringify(shownKeys(all, allMine.shown)));
});

test('C12 a saved O147 state and a stale slice', () => {
    const saved = { slide: 's2', filters: { stage: ['idea'], tier: ['research'], slice: ['gone/idea'] } };
    console.log('C12 function:', JSON.stringify(words(boardFilter(members, preset, true, [], saved, 1))));
    console.log('C12 parsePresentState:', JSON.stringify(parsePresentState(saved)));
});

test('C13 two hubs', () => {
    const r = boardFilter(members, preset, true, ['hub', 'hub2'], {}, 1);
    console.log('C13 hub group:', JSON.stringify(r.groups.find((g: any) => g.id === 'hub')?.items.map((i: any) => [i.id, i.count])));
});

test('C20 nothing shown', () => {
    const none = members.map((one: any) => ({ ...one, mine: false, role: 'other' }));
    const r = boardFilter(none, preset, true, [], {}, 1);
    console.log('C20 Mine only, no member the users: kept', JSON.stringify(shownKeys(none, r.shown)), 'shown', r.shown.length, 'of', none.length);
    const pick = boardFilter(members, preset, true, [], { mine: false, filters: { tier: ['nothing'] } }, 1);
    console.log('C20 a pick no member carries: kept', JSON.stringify(shownKeys(members, pick.shown)), 'groups', JSON.stringify(words(pick).groups.filter((g: string) => g.startsWith('tier'))));
});

test('C9 leftDeck', () => {
    const held = { slide: 's2', overview: true, recent: [], facts: false, search: 'x', stale: true, dated: true, waiting: true, mine: false, filters: { tier: ['research'] } };
    console.log('C9 leftDeck:', JSON.stringify(leftDeck(held, { root: 'hub', path: 'one' }, { root: 'hub', path: 'two' })));
});
```

Its output after the last change, as printed:

```
C2 members: ["a","b","c"]
C2 deck: {"mine":true,"named":true,"heldFilters":{},"heldMine":true,"search":"","groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]}
C2 board of the same projects equal: true
C2 stats over members: {"projects":3,"blocked":0,"dated":1,"waiting":0,"warnAt":4,"venues":[]}
C2 kept list with Mine only on: ["a","c"]
C2 kept list with Mine only off: null
C3 search "beta": ["b"]
C4 stale toggle, lag 4: ["c"]
C5 no person marked: mine false named false kept null
C5 every member the users: mine false kept null
C12 function: {"mine":true,"named":true,"heldFilters":{"tier":["research"]},"heldMine":true,"search":"","groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]}
C12 parsePresentState: {"search":"","stale":false,"dated":false,"waiting":false,"mine":true,"filters":{"tier":["research"],"slice":["gone/idea"]},"slide":"s2","overview":false,"recent":[],"facts":true}
C13 hub group: [["hub",2],["hub2",0]]
C20 Mine only, no member the users: kept [] shown 0 of 3
C20 a pick no member carries: kept [] groups ["tier:research=3,nothing=0"]
C9 leftDeck: {"search":"","stale":false,"dated":false,"waiting":false,"mine":true,"filters":{},"slide":"","overview":false,"recent":[{"root":"hub","path":"one"}],"facts":false}
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

`C2 members` shows the member `talk-x` (no project) and the second hub's `hub2:a` left out, each project once although `a` is in two groups (C13, C19, C7). `C12 parsePresentState` keeps the stale slice in the pane's saved state, as `parseBoardState` with no slices keeps it on a board; the function drops it (`C12 function` `heldFilters` has no `slice`), and the bar's next write saves the dropped form, as the board's does.

## DONE / NOT DONE

| Item or case | State | Proof |
| --- | --- | --- |
| 1. One computation (`BoardFilter` and `boardFilter`, `filter-menu.ts:191-256`, exported in `index.ts`) | DONE | `Projects.svelte:176-179` reads it; case-run `C2 board of the same projects equal: true` |
| 2. One bar (`views/shared/forms/bar/BoardBar.svelte`) | DONE | `Projects.svelte:329`, `Bar.svelte:115-122`; `test:quick` at the end of the round, `ok      svelte-check (9.1 s): 1793964640272 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3. The pane's state (`PresentBar`, `parsePresentState`, `leftDeck`) | DONE | case-run `C12 parsePresentState: ...`, `C9 leftDeck: ...` |
| 4. The projects it runs over (`memberItems`) | DONE | case-run `C2 members: ["a","b","c"]` |
| 5. The kept list (`shownKeys`, `filter.svelte.ts` `worked`, `keepOf`, `keepFor`) | DONE | case-run `C2 kept list with Mine only on: ["a","c"]`, `... off: null`, `C20 ... kept []`; the store and window parts by reading (C10, C11, C17, C18, C21, C23, C24 below) |
| 6. What goes | DONE | C15 greps below print nothing |
| 7. Comments and docs | DONE | the list under "Head comments" below |
| C1, C3, C5, C6, C8, C11, C22 | DONE by reading; the look on landing is the proof of what is drawn | "Before and after" below |
| C2 | DONE | case-run lines above; side-by-side below |
| C4, C7, C9, C10, C16, C18, C19, C21, C23, C24, C25 | DONE by reading | "Cases on the changed tree" below |
| C12, C13, C20 | DONE | case-run lines above |
| C14, C26 | DONE | verify 2 below (G124 and G92 files green); the look on landing |
| C15 | DONE | verify 3 below |
| C17 | DONE by reading; the look on landing | below |
| Verify 1: `npm run diagrams && npm run docs:palette && npm run test:quick` | DONE, run once in the build and once at the end of repair round 1 | last line at the end of the round: `test:quick: 55.9 s; every command passed` |
| Verify 2: the five files | DONE | `Test Files  5 passed (5)`, `Tests  120 passed (120)` |
| Verify 3: C15 greps | DONE | first grep `c15a exit=1` with no output; second `c15b exit=1` with no output; the third prints `FilterBar.svelte:2` and `SliceLine.svelte:2` only, each true (both callers of the line, through BoardBar.svelte) |
| Verify 4: ASCII gate | DONE | the rules file's perl form over `$(find src tests bin config -type f ! -name local.yml)`, rerun after the verify list, printed nothing (`gate exit=0`; the tree has no `bin` folder, `find: bin: No such file or directory`); the same check over `git diff --name-only` and BoardBar.svelte printed nothing |
| Verify 5: `wc -l` | DONE | table below; every component at or under 520 |
| Verify 6: unused exports | DONE | no line added (below) |
| Verify 7: history words | DONE | below |
| Verify 8: prose | DONE | below |

The verify list at the end of repair round 1 (started 11:30:06 UTC), its `test:quick` lines as printed:

```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (2.5 s)
ok      svelte-check (9.1 s): 1793964640272 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (36.6 s): Duration  25.40s (transform 13.02s, setup 0ms, import 16.96s, tests 8.29s, environment 0ms)
ok      vitest (42.4 s): Duration  31.47s (transform 48.59s, setup 0ms, import 86.35s, tests 17.44s, environment 544ms)
ok      vitest checks (53.7 s): Duration  42.62s (transform 27.86s, setup 0ms, import 55.32s, tests 101.13s, environment 3ms)
test:quick: 55.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

What the green result does not cover is printed in its last lines: the tests that reach no changed file within the import depth, the build, and the lint of unchanged files. The plan's whole verify list runs at landing.

I ran the verify list twice in all:
- once in the build, after its last change (the last Edit, of `filter.svelte.ts`, at 10:48:25 UTC; the list at 10:48:49 UTC), ending `test:quick: 89.4 s; every command passed`;
- once at the end of repair round 1, with the output above. The round changed no file of the step.

I ran no whole-suite command. At the end of the round I also ran the rest of the verify list:
- verify 2, `npx vitest run --reporter=dot tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/imports/cycles.test.ts tests/data/sources/present.test.ts`, which printed `Test Files  5 passed (5)` and `Tests  120 passed (120)`;
- the three C15 greps (`c15a exit=1` and `c15b exit=1`, both with no output, and the third printing `FilterBar.svelte:2` and `SliceLine.svelte:2` only);
- the ASCII gate (`gate exit=0` and `touched exit=0`, both with no output);
- the unused-exports diff (the same three removed lines quoted under verify 6);
- `git diff --stat` (`22 files changed, 371 insertions(+), 484 deletions(-)`).

During the build, verify 2 also ran once between changes, with the same result. `npx svelte-check --tsconfig ./tsconfig.json --threshold error` ran once between changes: `COMPLETED 4614 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

The three test-side edits of `test:quick`'s import scan do not apply: the step adds and changes no test, so there is no failing line to quote. No assertion, allow list or predicate was edited.

Verify 6: `sh utils/unused-exports.sh` compared with `../O154-base/unused-exports.txt` gives only removed lines, no added line:

```
1c1
< Unused exports (226)
---
> Unused exports (225)
124,125c124
< src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, valueLabel, emptyBoardState, facetValues
< src/lib/state/boards/board/state.ts: emptyBoardState
---
> src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, valueLabel, facetValues
```

An earlier run showed `parseBoardState` (index.ts) and `QuickFilters` (index.ts types) as new lines. present.ts now imports `emptyBoardState`, `parseBoardState`, `BoardItem` and `BoardState` through the board facade `index.ts`. `QuickFilters` is taken out of `index.ts`'s type exports, since no importer reads it there (`grep -rn "parseBoardState\|QuickFilters" src tests`).

Verify 7: the history-word grep over the added and changed lines (`git diff -U0 -- src config docs` plus BoardBar.svelte, grepped for before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package lands, a package id and a date) with "was" and "now" added to the list, hits 12 lines:
- "before any filter" (decks.md "The filter", filter-menu.ts `BoardFilter.slices` and the `boardFilter` doc, filter.svelte.ts `PaneBar.stats`, Projects.svelte head comment, BoardBar.svelte head comment and `stats` prop) and "before that answer" (present.svelte.ts head comment). Each says which projects a count is taken over, or when a read happens; none describes earlier code.
- "stays as it was" (present.ts `leftDeck` doc: "The Project facts toggle is a setting of the pane and stays as it was."). It says the toggle keeps its value when the pane opens another deck; it does not describe earlier code.
- `now` and `previous` in filter.svelte.ts:165-170, variable names in code.
None is history.

Verify 8: I read every new and changed sentence against the prose rule. None has an em dash, a quip or a "not X but Y" construction. Each names the function and the file it describes.

## Files

`diff -rq ../O154-base/src src` and `diff -rq ../O154-base/config config` list the 13 changed source and config files and `Only in src/lib/views/shared/forms/bar: BoardBar.svelte`. The lines now are from `wc -l`, and the added and removed lines are from `git diff --numstat`:

| File | Lines now | Added, removed | In the write list |
| --- | --- | --- | --- |
| `src/lib/state/boards/board/filter-menu.ts` | 416 | +84 -2 | yes |
| `src/lib/state/boards/board/index.ts` | 85 | +3 -2 | yes |
| `src/lib/state/boards/collection/bar.ts` | 563 | +20 -56 | yes |
| `src/lib/state/boards/structure/map-bar.ts` | 251 | +3 -4 | yes |
| `src/lib/state/life/present.ts` | 749 | +60 -123 | yes |
| `src/lib/state/life/present.svelte.ts` | 756 | +6 -5 | yes |
| `src/lib/views/shared/forms/bar/BoardBar.svelte` | 103 | new | yes |
| `src/lib/views/shared/forms/bar/FilterBar.svelte` | 219 | +13 -15 | yes |
| `src/lib/views/shared/forms/bar/SliceLine.svelte` | 253 | +13 -13 | yes |
| `src/lib/views/boards/projects/Projects.svelte` | 387 | +30 -130 | yes |
| `src/lib/views/academic/present/acts/filter.svelte.ts` | 196 | +98 -74 | yes |
| `src/lib/views/academic/present/Bar.svelte` | 142 | +14 -30 | yes |
| `src/lib/views/academic/present/Present.svelte` | 462 | +6 -5 | yes |
| `config/text/views/academic/present.yml` | 158 | +0 -5 | yes |
| `docs/decks.md` | 431 | +6 -5 | the section "The filter" yes; `:131` no, reason below |
| `docs/HELP.md` | 641 | +2 -2 | `:331` yes; `:334` no, reason below |
| `docs/templates.md` | 1932 | +1 -1 | yes |
| `docs/diagrams/layer-state.dot`, `.svg` | 173, 855 | +1 -1 each | no: regenerated by `npm run diagrams`, the first command of the verify list |
| `docs/diagrams/layer-views.dot`, `.svg` | 179, 809 | +4 -4 each | no: the same |
| `docs/diagrams/layers.dot`, `.svg` | 101, 556 | +1 -1 each | no: the same |
| `.scratch/migration/agents/reviews/O154-report.md` | this file | new | yes |

In total, `git diff --stat` gives 22 files changed, 371 insertions(+), 484 deletions(-), plus the untracked BoardBar.svelte. Every component is at or under 520 lines (the largest is Present.svelte at 462), and every source file is under 880. `.scratch/migration/agents/briefs/O154-cases.md` is untracked in the worktree; it is the orchestrator's ruling, and I did not write it.

Outside the write list:
- `docs/decks.md:131` changed "A filter's picks then narrow" to "The filter's controls then narrow". Under the board's rules the search, the toggles and Mine only narrow too, so the old sentence was false. Item 7's last sentence covers such lines.
- `docs/HELP.md:334` changed "While the filter holds a pick" to "While the filter narrows the deck", for the same reason.

## Cases on the changed tree, by reading

- C4: the stale, deadline and waiting toggles of `BoardBar.svelte:49-71` write `stale`, `dated` and `waiting`. `boardFilter` hands them to `applyFilters` as `quick` (`filter-menu.ts:238-254`), and `shownKeys` narrows the deck (case-run `C4 stale toggle, lag 4: ["c"]`).
- C7: `SliceLine` gets `shown={filter.shown.length}`, `total={stats.projects}` and `words={shownWords}` (`BoardBar.svelte:99-101`). Both counts are over `memberItems`, which holds one item per project.
- C9: `leftDeck` (`present.ts`) spreads `barFields(emptyBoardState())`, giving `mine: true` and everything else empty (case-run `C9 leftDeck`). Every write of the pane's state is `setInstanceState`, and no control writes a file: the bar's `write` is `reads.write(barFields({ ...filter.held, ...next }))` into `Present.svelte`'s `write`.
- C10: `keepFor(instance, ref)` is `keepOf(worked(instance, ref))`, and the pane's `keep` is `keepOf(work)` with `work = worked(reads.instance(), ref)` (`filter.svelte.ts`). One function of the instance state and the store's whole-deck answer gives both. `presentation.svelte.ts:65` hands `keepFor` to the link, and `acts.svelte.ts:88-94` hands the pane's `keep` to the export. `export.ts`, `presentation.svelte.ts` and `present.svelte.ts` needed no code change.
- C16: `PresentState` holds the six bar fields, and `parsePresentState` reads them (`present.ts`). Every write of the pane's state keeps them: `Present.svelte:218` `{ ...held, ...changes }`, `screen/box.ts` through it, `presentation.svelte.ts:68` `{ ...parsePresentState(instanceState(id)), slide: key }`, the Overview's picks through `pick`, and the facts toggle through `write`.
- C18: `worked` answers `undefined` while the whole answer is loading or the snapshot is null, so `keepFor` gives `undefined`. The print page's wait and `present.print_unanswered` are unchanged (`routes/present/print/+page.svelte:101`). The export refuses while the pane's `keep` is undefined (`acts.svelte.ts:89`).
- C19: `memberItems` matches only members with a `projectId` that maps to a board item, so a deck that is no project's is not counted. The kept list is `null` while nothing narrows, which draws it, and under any narrowing the server's `keptMembers` drops it.
- C21: each kept list is its own query key (`present.svelte.ts:356-374`). The pane reads `deckOf(ref, keep)` for its current list only, and while that read is pending it draws `last`, so an earlier list's answer is never drawn over a later one.
- C23: a `files` message marks the held answers (`present.svelte.ts:330-353`). The whole answer is read again, so the members, `work`, `keep` and the shown count follow it. The effect on `keep` then sets `moving`, and the slide rule runs once the new answer is in.
- C24: each pane's `worked` reads its own `instanceState(instance)`. The print page is answered only by the exporting pane's channel reply (`acts/export.ts:118-150`).
- C25: `parseBoardState`'s `mine: z.boolean().catch(true)` (`state.ts:170`) reads a missing `mine` as on.

## Before and after, for the look on landing

- C1. View: Present, the portfolio deck (its groups hold project decks), with a person marked as the user (`self`).
  - Before: one line under the toolbar holding only the buttons Stage, Status, Tier, Pillar, Form.
  - After: the two lines the Projects board draws, in the board's texts:
    - line 1: the search box with the placeholder "board.search_default"'s words, the stale chip, "deadline n", "waiting n", Mine only, the group buttons of `LINE_FACETS` and More;
    - line 2: the slices by category, "m projects" or "n of m shown", and Clear all while a pick is held.
  - The toolbar no longer holds the "Filtered: ..." line or the Clear button.
- C3. Same view: type a word in the search. The shown count drops to the members whose haystack holds it, and the deck redraws with only those projects' decks.
- C5. Same view. Mine only is pressed on opening.
  - With a member that is not yours, the deck opens narrowed to your projects and those naming no one.
  - With every member yours, Mine only is drawn disabled (tip `board.mine_all`).
  - With no `self` marked, neither Mine only nor the Role group is drawn.
- C6. Same view. Press a slice chip, then a category's label on line 2: the deck narrows as on a board. Then press Clear all: every pick goes, while the search text and the toggles stay.
- C8. View: Present on a deck with no group of project decks (a talk, or a project's own deck). Before and after alike, nothing is drawn under the toolbar and no empty room is kept.
- C11. View: Present, reloaded on a deck whose saved state has Mine only on (the default) and a member that is not yours. "Reading the deck ..." (the loading state) shows until the narrowed answer is in; the whole deck is never drawn first. Before, the whole deck was drawn, since the base had no Mine only.
- C14 and C26. Views: every Projects board, and an Awaiting box's tab. The bar, its counts, the shown count and the cards are as on the base.
- C17. View: Present, presenting. Hide the pane's tab: the audience window keeps the deck the pane's controls narrow (its kept list comes from `keepFor` over the store's whole-deck answer).
- C22. View: Present. Type O, F, P, Space and the arrow keys in the bar's search box. They go into the field, and the deck neither moves nor opens the grid, full screen or the presenter screen.
- Decision 3, visible: a deck that O147 drew whole now opens narrowed where a member is not yours (C25).

## The side-by-side reading of C2

`Projects.svelte`:

```svelte
    const hubs = $derived(hubList(roots(), primary()));
    ...
    const items = $derived(board(preset));
    const lag = $derived(staleLag());
    /** The bar's filter over the board's projects, read from the saved state. */
    const filter = $derived(
        boardFilter(items, preset, selfNamed(), hubs, instanceState(instance.id), lag)
    );
    ...
    const strip = $derived(boardStats(items));
    ...
    <BoardBar {filter} stats={strip} placeholder={searchWords(preset)} {write} />
```

`acts/filter.svelte.ts` (`worked`) and `Bar.svelte`:

```ts
        const preset = mapPreset(configMap(), vocabOf);
        const members = memberItems(whole.deck, board(preset));
        const hubs = hubList(roots(), primary());
        const saved = instanceState(instance);
        const filter = boardFilter(members, preset, selfNamed(), hubs, saved, staleLag());
    ...
            stats: boardStats(members),
            placeholder: searchWords(preset),
            write: (next) => reads.write(barFields({ ...filter.held, ...next }))
```

```svelte
    <BoardBar
        filter={filter.filter}
        stats={filter.stats}
        placeholder={filter.placeholder}
        write={filter.write}
    />
```

The two call sites differ in two things:
- The items: the board's own items, or the board items of the Map's preset matched to the deck's members.
- The write sink: the board saves `storedState({ ...held, ...next }, ['more'])`; the pane saves the six bar fields beside its own.

The function's other arguments are the same calls: `selfNamed()`, `hubList(roots(), primary())`, `staleLag()`, and the raw `instanceState(<id>)`. So are the stats (`boardStats` of the same items) and the placeholder (`searchWords(preset)`). Every control, prop and text is BoardBar's own, so the toggles, Mine only (`onmine`), the badges and the slices line are drawn by the same code for both.

## Head comments, doc comments and docs paragraphs

Rewritten:
- `filter-menu.ts:11-16` (a new paragraph of the head comment `:1-19`)
- `present.ts:1-20`
- the doc of `PresentState`, and the new docs of `PresentBar`, `barFields` and `parsePresentState`
- `leftDeck`'s doc
- `filter.svelte.ts:1-25`
- `present.svelte.ts:6-15`
- `Present.svelte:31-36`
- `Bar.svelte:2-11`
- `Projects.svelte:55-71` and `:88-97`
- `FilterBar.svelte:2-14`
- `SliceLine.svelte:2-14`
- `collection/bar.ts`: head comment (`:31-34` gone), the `ProjectLayout` doc, the `projectRules` doc and the `projectGroups` doc
- `map-bar.ts:14-16` and `:40`
- `docs/decks.md` "The filter" and `:131`
- `docs/HELP.md:331` and `:334`
- `docs/templates.md:1914`

True as they stand:
- `present.svelte.ts:33-36` (the link) and `:68-72` (`Keep`)
- `acts/presentation.svelte.ts:1-8`
- `acts/export.ts:9-17`
- `acts/live.svelte.ts:6`
- `acts/acts.svelte.ts:24`
- `arrange/Overview.svelte:20-23`
- `arrange/Group.svelte:4`
- `routes/present/show/+page.svelte:20-21`
- `routes/present/print/+page.svelte:13-16`
- `server/content/deck/endpoint.ts:7`
- `data/sources/deck/read.ts:25-30`
- `data/sources/deck/groups.ts:10-15`
- `screen/box.ts:1-9`

The anchor `#the-filter` keeps its heading, so `docs/decks.md:131`'s link stands.

## Judgment calls the brief did not cover, each reversible

1. Names: `boardFilter` and `BoardFilter` (filter-menu.ts); the component `BoardBar.svelte`; `memberItems`, `shownKeys`, `barFields` and `PresentBar` (present.ts); `PaneBar` (filter.svelte.ts).
2. `BoardFilter` carries `named` beside the brief's fields, so the component draws Mine only and the Role group from the answer alone.
3. `searchWords(preset)` is a new export holding the placeholder rule `preset.search === '' ? t('board.search_default') : preset.search`, which both callers pass, so the rule is written once.
4. `parsePresentState` reads the bar fields with `parseBoardState(value)` (no offered facets or slices), so a key outside `FACETS` (the Map's `stage`) is dropped at the next write of any field. The slice and compute values are checked against the members by `boardFilter`.
5. The slide rule of item 5 runs on every change of the kept list, whatever caused it (a control, a change of `present.yml`, the first resolution of the list when a pane opens). When the slide on screen is not in the new answer and is not the empty key, the pane writes its first slide. On open, this can write the first slide's key into a pane whose saved slide the narrowed deck does not hold; the base wrote nothing on open.
6. A whole-deck answer that failed, or that names nothing, gives the kept list `null`, so the pane draws that answer's error or empty state instead of a loading state that never ends.
7. In `collection/bar.ts`, `ProjectLayout.category` is now `string` and the `null` branches are gone, since only the Projects section's layout is left and it always draws Category.
8. present.ts imports the board's state functions through the facade `index.ts`.

## Limitations, sharp edges and helper programs

- A pane whose kept list narrows reads two answers per push: the whole deck's answer (for the members) and the narrowed one. This doubles the deck route's reads for such a pane. Not measured.
- The members come from the deck's whole answer, which `asking` never drops and the query client never collects (`gcTime: Infinity`, `queries.svelte.ts:49`). A page that opened many decks keeps every whole answer, as it did before for the whole decks it read. A narrowed pane now always reads its deck's whole answer.
- While a hidden tab's whole answer is marked stale, `keepFor` reads the held, stale members (a hidden tab's reads ask nothing) until the tab is shown or the presentation's effect reads again outside a tab scope. Not exercised.
- In the build I ran two programs without approval, `wrap.py` and `short.py`. The rules file allows only case-run programs without approval, so this is a breach. It is closed under the standing ruling "Unapproved builder scripts" and recorded at landing. Every run, and every paragraph shaped by the output, is listed under "Programs" above.
- The step adds no test (decision 6). G124's and G92's tests ran green (verify 2), and no G124 unit's behaviour changed.

## Anything in the brief that was wrong or impossible

C13, handed back and ruled (above). Nothing else.
