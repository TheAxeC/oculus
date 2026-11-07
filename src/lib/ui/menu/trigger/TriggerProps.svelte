<script lang="ts">
    // Layer 3, primitive. What a bits-ui trigger's `child` snippet draws when the element that is
    // the trigger is drawn outside the snippet: nothing. It hands every version of the trigger's
    // attributes and handlers to `take`, which spreads them on that element, so the element and
    // what it holds are drawn before bits-ui's part is built and stay in place when it is
    // (ui/menu/Tooltip.svelte, ui/menu/ContextMenu.svelte).

    type Props = {
        /** The attributes and handlers bits-ui gives the trigger. */
        props: Record<string, unknown>;
        /** Take them, each time they change. */
        take: (props: Record<string, unknown>) => void;
    };

    let { props, take }: Props = $props();

    $effect.pre(() => {
        take(props);
    });
</script>
