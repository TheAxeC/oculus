<script lang="ts">
    // The page's one tooltip group drawn around a component that hands back every context it is
    // given, for tests/fixtures/client.ts: bits-ui keeps the group's context under a key of its
    // own, so a test reaches it by drawing the group, as the page's layout does.

    import TooltipGroup from '../../../src/lib/ui/menu/TooltipGroup.svelte';
    import HeldContexts from './HeldContexts.svelte';

    let { onheld }: { onheld: (contexts: Map<unknown, unknown>) => void } = $props();
</script>

<TooltipGroup>
    <HeldContexts {onheld} />
</TooltipGroup>
