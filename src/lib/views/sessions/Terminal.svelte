<script lang="ts">
    // Layer 3, view. The pane the terminal will be. DESIGN.md's migration order puts tmux, the pty
    // channel and xterm.js at step 6; until then this holds the place the arrangement gives it and
    // says so, so the layout the other five views sit in is the layout they will keep.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();
</script>

<Pane title={t('sessions.view_terminal')}>
    <div class="terminal" data-instance={instance.id}>
        <Empty message={t('sessions.centre_pending')} glyph={t('sessions.empty_glyph')} />
    </div>
</Pane>

<style>
    .terminal {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
</style>
