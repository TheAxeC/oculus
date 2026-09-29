<script lang="ts">
    // A tooltip under the page's own layout for tests/ui/menu/tooltip.test.ts, as every control of
    // the page is drawn: whatever the layout wraps its children in is what the tooltip is under.

    import Layout from '../../../src/routes/+layout.svelte';
    import Tooltip from '../../../src/lib/ui/menu/Tooltip.svelte';
</script>

<Layout>
    <Tooltip text="Put it back">
        <button type="button">Go</button>
    </Tooltip>
</Layout>
