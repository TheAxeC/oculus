# Review of Q4a (codex:gpt-5.6-sol, read-only, 2026-09-12)

The reviewer's report over the first diff, verbatim.

1. Acceptance items not met

- Item 1: fetched Inbox entries count every untriaged record, including informational entries, instead of only actionable reply/action entries. `src/lib/state/rail-badges.ts:45-47`; the established summary filters kinds at `src/lib/data/sources/feeds.ts:78-80`.
- Item 1: Live HPC is not preserved "as it is." The badge no longer uses its explanatory title; the sole badge span has no title at `src/lib/shell/ActivityRail.svelte:205-207`, while the catalog entry remains at `config/text.yml:878`.
- Item 3: direct view and bookmark controls do not fill the rail column. `.control` is a row flex container at `src/lib/shell/ActivityRail.svelte:358-362`, while the emitted Tooltip root remains intrinsic-width `inline-flex` at `src/lib/ui/Tooltip.svelte:131-139`.

2. Spec rules broken

- Catalog strings: `Structure` is introduced as a literal at `config/layout.yml:21` and rendered directly at `src/lib/shell/ActivityRail.svelte:183-193`, contrary to `.scratch/migration/agents/spec.md:40`.
- Catalog glyphs: the visible LinkedIn mark is the literal `!` at `src/lib/state/rail-badges.svelte.ts:70-76`, contrary to `.scratch/migration/agents/spec.md:40`.
- Head comments: the new test module lacks the required layer and shaping rationale at `tests/state/rail-badges.test.ts:1`, contrary to `.scratch/migration/agents/spec.md:41`.
- Known-defect assertion: the Inbox test requires an untyped informational record to count as actionable at `tests/state/rail-badges.test.ts:38-41`, contrary to `.scratch/migration/agents/spec.md:48`.

3. Tests missing for named behaviour

- Clicking the Update tray ground closes it. `tests/shell/palette.test.ts:97-103` checks only markup and roles; the interaction belongs in that test file.
- Large-group openers carry the shared rail box and occupy the full column. The class test supplies a one-view group at `tests/shell/rail.test.ts:146-155`, so it never exercises the large-group branch at `src/lib/shell/ActivityRail.svelte:180-190`.
- Snapshot-summary versus fetched-feed selection is untested. `tests/state/rail-badges.test.ts:4-12` imports only pure helpers and never exercises `inboxBadge`, `leadsBadge`, or `linkedinBadge`; this belongs in `tests/state/rail-badges.test.ts` or a reactive companion.
- Active-application counting and every configured collection hook are not tested. `tests/views/registry.test.ts:216-226` checks only the Applications tone and only Funding among configured collection badges; the missing registration checks belong there, and the count belongs in `tests/state/rail-badges.test.ts`.

4. Defects shown with concrete inputs

- Input `[ { kind: 'info', triaged: false } ]` produces Inbox badge `1` through `src/lib/state/rail-badges.ts:45-47`; the established actionable result is `0` because informational entries are excluded at `src/lib/data/sources/feeds.ts:78-80`.
- Input snapshot `inbox.actionable = 2` followed by a failed fetched-feed response produces no badge: the failure replaces held entries with `[]` at `src/lib/state/feeds.svelte.ts:55-64`, and `inboxBadge` then ignores the snapshot because `peekFeed` is non-null at `src/lib/state/rail-badges.svelte.ts:41-47`.
- Input ActivityRail with one direct view produces a glyph-width control instead of a column-width control: `.control` creates a horizontal flex sizing context at `src/lib/shell/ActivityRail.svelte:195-208,358-362`, and Tooltip supplies an intrinsic-width wrapper at `src/lib/ui/Tooltip.svelte:131-139`.

5. Anything else worth attention

- The configuration comment still says the leads badge is on the Projects tab at `config/behavior.yml:53`, while the badge is registered on Position Leads at `src/routes/views.ts:56-63`.