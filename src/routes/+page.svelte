<script lang="ts">
    // The page of migration step 3's first half: two empty panes and the sash between them, with
    // O6's status block in the left one so the socket is still visible. Dragging the sash resizes
    // the panes and the sizes survive a reload, which is what O7 proves. O8 replaces this page with
    // the workbench and none of this markup survives.
    import { onMount } from 'svelte';
    import SplitView from '$lib/shell/SplitView.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { apply, layout, loadLayout } from '$lib/state/layout.svelte';
    import { resize, type Layout } from '$lib/state/layout';
    import { connect, disconnect, status } from '$lib/state/socket.svelte';
    import { t } from '$lib/state/text';

    const snapshot = $derived(portfolio());
    const tree = $derived(layout());

    function socketLabel(): string {
        const state = status();
        if (state === 'connecting') return t('app.socket_connecting');
        if (state === 'open') return t('app.socket_open');
        return t('app.socket_closed');
    }

    function count(kind: keyof NonNullable<typeof snapshot>['entities']): number {
        return snapshot === null ? 0 : Object.keys(snapshot.entities[kind]).length;
    }

    /** The arrangement a browser that has never held one starts from. */
    function start(): Layout {
        return {
            kind: 'split',
            dir: 'row',
            sizes: [0.6, 0.4],
            children: [
                { kind: 'pane', tabs: [], active: '' },
                { kind: 'pane', tabs: [], active: '' }
            ]
        };
    }

    function resized(path: number[], sizes: number[]): void {
        apply(resize(tree, path, sizes));
    }

    onMount(() => {
        connect(['portfolio', 'config']);
        if (!loadLayout()) apply(start());
        return () => disconnect();
    });
</script>

{#snippet pane(node: Layout, path: number[])}
    <div class="pane">
        {#if path[0] === 0}
            <h1>{t('app.title')}</h1>
            <p>{t('app.socket', socketLabel())}</p>
            {#if snapshot === null}
                <p>{t('app.waiting')}</p>
            {:else}
                <p>{t('app.version', snapshot.version)}</p>
                <ul>
                    <li>{t('app.projects', count('projects'))}</li>
                    <li>{t('app.venues', count('venues'))}</li>
                    <li>{t('app.datasets', count('datasets'))}</li>
                    <li>{t('app.programs', count('programs'))}</li>
                    <li>{t('app.domains', count('domains'))}</li>
                    <li>{t('app.funding', count('funding'))}</li>
                    <li>{t('app.collections', count('collections'))}</li>
                </ul>
            {/if}
        {:else}
            <p>{t('app.pane_path', `[${path.join(', ')}]`)}</p>
            <p>{t('app.tabs', node.kind === 'pane' ? node.tabs.length : 0)}</p>
        {/if}
    </div>
{/snippet}

<div class="workbench">
    <SplitView layout={tree} {pane} onresize={resized} />
</div>

<style>
    .workbench {
        height: 100vh;
        width: 100%;
    }

    .pane {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        border-radius: var(--radius);
        box-sizing: border-box;
    }
</style>
