<script lang="ts">
    // Layer 3, primitive. The one group every tooltip of the page belongs to: bits-ui's Tooltip
    // Provider, which closes the bubble it has open when another of its tooltips opens, so one
    // bubble shows at a time. A tree row whose action carries its own words is where two would
    // otherwise show at once, the row's and the action's. src/routes/+layout.svelte wraps the page
    // in it, and ui/menu/Tooltip.svelte draws no provider of its own, so bits-ui refuses a tooltip
    // drawn outside the group.
    //
    // The settings are every tooltip's: the rest before a bubble opens, no grace period in which
    // the next one opens at once, a bubble that the pointer cannot move into, and no bubble for a
    // focus the pointer gave, since Tooltip.svelte answers the keyboard's focus itself.

    import { Tooltip } from 'bits-ui';
    import type { Snippet } from 'svelte';
    import { DELAY } from '$lib/ui/menu/tooltip-rules';

    let { children }: { children: Snippet } = $props();
</script>

<Tooltip.Provider
    delayDuration={DELAY}
    skipDelayDuration={0}
    disableHoverableContent
    ignoreNonKeyboardFocus
>
    {@render children()}
</Tooltip.Provider>
