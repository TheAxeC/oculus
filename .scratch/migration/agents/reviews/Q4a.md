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
## The reviewer again, after the repair round (2026-09-12)

First review repair status

- Acceptance 1, Inbox filtering: met. `src/lib/state/rail-badges.ts:45-55`
- Acceptance 1, Live HPC title: partly met. The title attribute is restored, but `pointer-events: none` prevents hovering it. `src/lib/shell/ActivityRail.svelte:218-220,392`
- Acceptance 3, full-width direct controls: met. `src/lib/shell/ActivityRail.svelte:376-380`; `src/lib/ui/Tooltip.svelte:140-149`; `src/lib/ui/ToolButton.svelte:120-129`
- Spec, Structure catalog string: not met. `config/layout.yml:21`; `src/lib/shell/ActivityRail.svelte:192,202`
- Spec, LinkedIn literal glyph: met. `src/lib/state/rail-badges.svelte.ts:77-83`
- Spec, test head comment: met. `tests/state/rail-badges.test.ts:1-2`
- Spec, known-defect Inbox assertion: met. `tests/state/rail-badges.test.ts:63-73`
- Test, tray-ground click: not met. `tests/shell/palette.test.ts:97-103`
- Test, large-group opener: met. `tests/shell/rail.test.ts:170-178`
- Test, snapshot/fetched-feed selection: met. `tests/state/rail-badges.test.ts:101-214`
- Test, applications and collection hooks: met. `tests/state/rail-badges.test.ts:120-172`; `tests/views/registry.test.ts:216-229`
- Concrete Inbox informational-record defect: met. `src/lib/state/rail-badges.ts:45-55`
- Concrete failed-fetch fallback defect: met. `src/lib/state/rail-badges.svelte.ts:25-27,47-53`; `tests/state/rail-badges.test.ts:200-214`
- Concrete direct-control width defect: met. `src/lib/shell/ActivityRail.svelte:376-380`; `src/lib/ui/Tooltip.svelte:140-149`
- Leads configuration comment: met. `config/behavior.yml:53`

1. Acceptance items not met

- Item 1: Live HPC is not preserved as it was because the restored title cannot receive pointer hover events. `src/lib/shell/ActivityRail.svelte:218-220,392`
- Item 1: a badge without `badgeTone`, including board and Live HPC badges, now uses a filled accent background instead of retaining the previous chip background with accent text. `.scratch/migration/agents/briefs/Q4a.md:7`; `src/lib/shell/ActivityRail.svelte:388-389`; `diff-2.patch:297-311`

2. Spec rules broken

- Catalog strings through `t()`: Structure remains a literal configuration label and is rendered directly. `config/layout.yml:21`; `src/lib/shell/ActivityRail.svelte:192,202`
- Catalog strings through `t()`: ordinary badge titles are assembled directly as `view-label + count`, and the test fixes the resulting English string instead of using a catalog template. `src/lib/shell/ActivityRail.svelte:143-145`; `tests/shell/rail.test.ts:152`

3. Tests missing for named behaviour

- Clicking the Update tray ground closes it. The tray test checks only rendered roles. This belongs in `tests/shell/palette.test.ts`. `tests/shell/palette.test.ts:97-103`
- Every foot control carries the common rail class. The rail test covers direct views, bookmarks and a group opener, but not search, update, theme, CRT, wallpaper, Unicode or dock. This belongs in `tests/shell/rail.test.ts`. `tests/shell/rail.test.ts:155-178`
- Projects, Archive and Coauthor badges return their board lengths. The registry test checks only that hooks exist. This belongs in `tests/state/rail-badges.test.ts`. `tests/views/registry.test.ts:208-214`
- Collection badges and their tones render inside an opened large-group menu, including zero suppression. The rail suite explicitly does not open menus. This belongs in a browser rail test. `tests/shell/rail.test.ts:9-10`; `src/lib/shell/ActivityRail.svelte:148-160`
- The Live HPC explanatory title is available on hover. The current test checks only the serialized attribute. This belongs in a browser rail test. `tests/shell/rail.test.ts:180-190`

4. Defects shown with concrete inputs

- Input: hover the visible Live HPC badge. Result: the badge cannot be the pointer target, so its `hpc.badge_title` title does not appear. `src/lib/shell/ActivityRail.svelte:218-220,392`
- Input: a registration with `badge: () => '3'` and no `badgeTone`. Result: the badge uses `var(--accent)` as its background instead of the previous `var(--chip)` background. `src/lib/shell/ActivityRail.svelte:388-389`; `diff-2.patch:297-311`

5. Anything else worth the orchestrator's attention

- `nav_live.label` is documented as the tooltip word but is discarded by `liveRule`; badge titles use the view label instead. `config/layout.yml:91-99`; `src/lib/state/rail-badges.ts:16-26`; `src/lib/shell/ActivityRail.svelte:143-145`
- Configured badge tones are accepted as arbitrary strings and interpolated into CSS token names without validation. `src/lib/state/rail-badges.ts:24-26`; `src/lib/state/rail-badges.svelte.ts:41-44`; `src/lib/shell/ActivityRail.svelte:168-174`