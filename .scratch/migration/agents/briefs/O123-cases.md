# O123, cases ruled before the build

The builder's first run handed back five cases and two paths. Each ruling below replaces the brief's text where they differ.

1. **The heads inside the tree.** Option A. `GroupHead` takes an optional tree row (an id and `nav`), its strip spreads `nav.row`, and `FoldControl` takes tabindex -1 there. The strip, its stickiness and its look stay. The list is one Tab stop, arrows walk the heads, and Left and Right fold. Every other caller of `GroupHead` is unchanged. `src/lib/ui/controls/heads/GroupHead.svelte` and `FoldControl.svelte` join the write list. Option C, tabindex -1 alone, was the lazy option.

2. **Timeline.** A Timeline row has no press, and this step adds none. The case reads: the Details section's transcript control (`DetailsBody.svelte:155`) and an Agents row.

3. **Verify 3.** Its term `m Sessions` becomes `(^|[^a-z])m Sessions`, so that `target.ts:3` is not hit.

4. **A typed prompt.** Option A. The typed prompt moves to the tab's composer record as `draft`, so a press lands in the empty pinned tab and the prompt comes back at New. `Composer.svelte` and `composer/composer.ts` join the write list. Option C, accepting the loss, was the lazy option.

5. **A Session tab after a reload.** Option A. A registration field marks `session-detail` as opened for something, and `registerOpened` in `context.ts` reads it, so a document never lands beside the bottom pane and a catalogue press on Session does not cover the list. The `document: true` calls of item 6 go. `navigation/registry.ts` joins the write list. Option C, a stated limitation, was the lazy option.

6. **Paths.** `src/lib/state/workbench/layout/tabs/terminal-host.ts` joins the write list: `tabs()` carries `pinned`, `TerminalHost`'s `Omit` names the page-folder call, and `open` lands beside a Terminal tab the page holds, so that New, `n`, a resume and a terminal row land there while the guarded `pageTarget` rule stands. `context.ts` also wires the page folder. `startInTab` uses the page folder too. The terminal row's menu item opens through the Terminal tab's pane.

`reading-tab.test.ts` row 'opens one tab per session' changes to one tab, listed as `spec.md` asks.

The hub's `.oculus/config.yml` sets no `counts:`. `GroupHead.svelte` and `registry.ts` are also written by O124, on other lines; the orchestrator merges them at landing.
