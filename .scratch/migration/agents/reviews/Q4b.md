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