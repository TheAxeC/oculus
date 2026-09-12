# Review of Q4b (codex:gpt-5.6-sol, read-only, 2026-09-12)

The reviewer's report over the first diff, verbatim.

1. Acceptance items not met

- Item 1: ordinary chip words remain `--fs-xs`, not `--fs-sm`. The Programs tier chip is a body chip at src/lib/views/programs/LineCard.svelte:91, but its size comes from src/lib/ui/Chip.svelte:61.
- Item 4, Pillars portion: the tone comes from the first member project's type, not from the pillar, at src/lib/views/programs/LineCard.svelte:55-63.

2. Spec rules broken

none

3. Tests missing

- Generic chips at `--fs-sm` and chips inside meta rows at `--fs-xs` are not tested. tests/views/type-scale.test.ts:26-44 checks only selected view-local rules and never inspects Chip or the Card meta context. Add both cases there.
- One-pixel smaller/larger behavior, reset to the configured default, live `grid.options.fontSize` updates, fit/resize, and the next mount are untested. tests/views/sessions.test.ts:553-568 only checks server-rendered labels and compact classes. Add browser or mocked component coverage for src/lib/views/sessions/Terminal.svelte:141-145,189-195,254-263.
- The disclosure glyph and its rotation when open are untested. tests/views/crosslinks.test.ts:18-24 covers only the closed markup; tests/browser/funding.spec.ts:50-53 checks only `aria-expanded`. Add an open-class and marker assertion.
- Card and panel surfaces being different in every theme is untested. tests/ui/colours.test.ts:451-457 checks only that `--card` exists. Add `--card !== --panel` for every resolved theme.
- Pillar tone stability for mixed member types is untested. tests/views/programs.test.ts:71-76 changes the sole relevant member's type. Add the same mixed members in opposite orders.

4. Defects shown

- Input: one pillar with member types `[active, published]` produces orange, while the same members as `[published, active]` produce green. The first member alone selects the tone at src/lib/views/programs/LineCard.svelte:56-63; `active` falls back to orange while `published` resolves to green from config/vocab.yml:77,247-256. The same pillar therefore changes colour when project order changes.
- Input: the fixture's `1 strong` tier chip at src/lib/views/programs/LineCard.svelte:91-94 renders at `--fs-xs` through src/lib/ui/Chip.svelte:61, although it is a body chip and the brief requires `--fs-sm`.

5. Anything else worth attention

- The brief's "pillar's arch_color" is under-specified: Program has no colour or archive-status field at src/lib/data/model-entities.ts:335-345, while `arch_color` is keyed by project outcomes at config/vocab.yml:247-256. A stable pillar-tone rule or a configured pillar colour is required.
- Venues gains a new visible intro at src/lib/views/Venues.svelte:84, although the brief names the existing intro and feed-meta views at .scratch/migration/agents/briefs/Q4b.md:15.
- tests/ui/colours.test.ts:6 still says five surface pairs, while the surface list contains six at tests/ui/colours.test.ts:48.

## Second review, over the repaired diff (codex:gpt-5.6-sol, read-only, 2026-09-12)

The reviewer's report over the repaired diff, verbatim; the tie-break defect and the test-only prop were fixed at landing, the pillar tone rule is recorded for Axel.

1. Acceptance items not met

- Item 1: disclosure counters inherit `--fs-sm`; counters must use `--fs-xs`. `src/lib/ui/Disclosure.svelte:17`, `src/lib/ui/Disclosure.svelte:35`.
- Item 4: Pillars use the majority project type through `type_color`, not the pillar's `arch_color`. `src/lib/views/programs/LineCard.svelte:55`, `src/lib/views/programs/LineCard.svelte:62`, `src/lib/views/programs/LineCard.svelte:76`, `config/vocab.yml:247`.

2. Spec rules broken

- The majority-type selection, configured-map tie break, and dormant-grey fallback are user-visible design decisions absent from the brief and were baked into the implementation. `.scratch/migration/agents/spec.md:17`, `src/lib/views/programs/LineCard.svelte:55`, `tests/views/programs.test.ts:93`.
- Head comments, primitives, one element per line, catalog strings, colour tokens, boundaries, file size, hardcoded config values, and ASCII: none.

3. Tests missing

- Disclosure counter sizing at `--fs-xs`. The type-scale test checks the disclosure's general chip size nowhere. `tests/views/type-scale.test.ts:48`.
- One-pixel terminal stepping, reset to the configured default, live `grid.options.fontSize` changes, refit and resize, and the next mount. The sessions test checks only labels and compact classes. `tests/views/sessions.test.ts:553`, `src/lib/views/sessions/Terminal.svelte:141`, `src/lib/views/sessions/Terminal.svelte:189`, `src/lib/views/sessions/Terminal.svelte:254`.
- Pillar tone from `arch_color`. The tests instead establish the unapproved majority-type rule. `tests/views/programs.test.ts:93`, `tests/views/programs.test.ts:100`, `config/vocab.yml:247`.

4. Defects shown

- Input: `{ count: 1, label: "manuscript" }`. The count inherits `--fs-sm` from the disclosure instead of the required counter size `--fs-xs`. `src/lib/ui/Disclosure.svelte:17`, `src/lib/ui/Disclosure.svelte:35`.
- Input: `type_order: [manuscript, active]`, unchanged `type_color`, and a pillar containing one manuscript and one active project. The tie still selects active because ranking uses `Object.keys(type_color)` instead of `type_order`, producing orange rather than teal. `src/lib/views/programs/LineCard.svelte:62`, `src/lib/views/programs/LineCard.svelte:67`, `config/vocab.yml:77`, `config/vocab.yml:80`.

5. Anything else worth the orchestrator's attention

- Prior ordinary-chip sizing issue and its missing test: met. `src/lib/ui/Chip.svelte:61`, `src/lib/ui/Card.svelte:147`, `tests/views/type-scale.test.ts:48`.
- Prior first-member order defect and stability-test request: met, but by the unapproved majority-type rule. `src/lib/views/programs/LineCard.svelte:68`, `tests/views/programs.test.ts:93`.
- Prior terminal behavior-test request: not met. `tests/views/sessions.test.ts:553`.
- Prior disclosure glyph and rotation-test request: met. `src/lib/ui/Disclosure.svelte:49`, `tests/views/crosslinks.test.ts:27`.
- Prior card-versus-panel surface-test request: met. `tests/ui/colours.test.ts:460`.
- Prior `arch_color` ambiguity remains: `Program` has no colour or archive-status field, while `arch_color` contains archive outcomes. `src/lib/data/model-entities.ts:335`, `config/vocab.yml:247`.
- Prior extra Venues intro remains. `src/lib/views/Venues.svelte:84`.
- Prior stale surface-count comment is corrected. `tests/ui/colours.test.ts:3`, `tests/ui/colours.test.ts:6`.
