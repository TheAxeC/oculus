<script module lang="ts">
    // Layer 3, view registration. Status follows Pages in the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'status',
        label: 'views.status',
        glyph: 'views.status_glyph',
        group: 'views',
        order: 4,
        unique: true
    };
</script>

<script lang="ts">
    // Layer 3, view. What the page knows: whether the socket is up, which snapshot it is holding,
    // and how many of each entity that snapshot carries, then the Claude Code hooks block
    // (Hooks.svelte) and the Gallery of every primitive (Gallery.svelte). It is the view that says
    // whether the data layer underneath is alive.
    //
    // The Gallery is a group that starts closed, by the pane-state key `showGallery`, and its body
    // is mounted only while the group is open, so a closed Gallery draws none of its samples and
    // closing it takes them off the page. Its Reset stands in the group's heading, drawn only while
    // the group is open, and calls the mounted body.
    //
    // The view draws cards, so the pane asks for no tint, and over a wallpaper the sample cards
    // paint their own fill. What it draws outside them is read off a `Surface`: the facts and the
    // hooks. The Gallery stands outside that `Surface`, since a card inside one paints nothing
    // (ui/frame/Card.svelte), and its own sections carry their own surfaces.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { liveCount } from '$lib/state/sessions/folds';
    import { workspaceCount } from '$lib/state/sources/repositories/repositories';
    import { entityCount, type CountedKind } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { instanceFlag, withInstanceKey } from '$lib/state/workbench/layout/instance';
    import Gallery from './Gallery.svelte';
    import Hooks from './Hooks.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { git, portfolio, sessions },
        socket: { status },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** Whether the Gallery is open, in the pane's own state. */
    const showGallery = $derived(instanceFlag(instanceState(instance.id), 'showGallery'));

    /** The mounted Gallery, null while its group is closed. */
    let gallery: { reset: () => void } | null = $state(null);

    const snapshot = $derived(portfolio());
    // The two live channels are counted so the screen shows that both are arriving.
    const records = $derived(sessions()?.records ?? []);
    const live = $derived(liveCount(records));
    const workspaces = $derived(workspaceCount(git()));

    /** Open or close the Gallery, every other key of the pane's state kept. */
    function toggleGallery(): void {
        const state = instanceState(instance.id);
        setInstanceState(instance.id, withInstanceKey(state, 'showGallery', !showGallery));
    }

    function socketLabel(): string {
        const state = status();
        if (state === 'connecting') return t('app.socket_connecting');
        if (state === 'open') return t('app.socket_open');
        return t('app.socket_closed');
    }

    /**
     * The entity kinds the snapshot keys by id. `feeds` and `career` are summaries of one file
     * each rather than maps of entities, so they are not counted.
     */
    function count(kind: CountedKind): number {
        return entityCount(snapshot, kind);
    }

    /**
     * The page's own origin, which is the server that printed it: the hooks block posts back there.
     * The page renders in the browser alone (routes/+layout.ts sets ssr = false), so the empty
     * answer belongs to a render with no location and Hooks draws nothing for it.
     */
    function servedOrigin(): string {
        return typeof location === 'undefined' ? '' : location.origin;
    }
</script>

{#snippet galleryTools()}
    <ToolButton
        bare
        label={t('gallery.reset')}
        glyph={t('gallery.reset_glyph')}
        onclick={() => {
            gallery?.reset();
        }}
    />
{/snippet}

<Pane title={t('views.status')}>
    <div class="view" data-instance={instance.id}>
        <Surface>
            <p class="socket">{t('app.socket', socketLabel())}</p>
            {#if snapshot === null}
                <p>{t('app.waiting')}</p>
            {:else}
                <p>{t('app.version', snapshot.version)}</p>
                <ul>
                    <li>{t('app.projects', count('projects'))}</li>
                    <li>{t('app.venues', count('venues'))}</li>
                    <li>{t('app.datasets', count('datasets'))}</li>
                    <li>{t('app.pillars', count('pillars'))}</li>
                    <li>{t('app.domains', count('domains'))}</li>
                    <li>{t('app.funding', count('funding'))}</li>
                    <li>{t('app.collections', count('collections'))}</li>
                </ul>
            {/if}
            <p>{t('app.sessions', records.length, live)}</p>
            <p>{t('app.git', workspaces)}</p>
            <div class="hooks">
                <Hooks origin={servedOrigin()} />
            </div>
        </Surface>
        <div class="samples">
            <GroupHead
                data-section="gallery"
                label={t('gallery.title')}
                open={showGallery}
                ontoggle={toggleGallery}
                actions={showGallery ? galleryTools : undefined}
            >
                {#if showGallery}
                    <Gallery bind:this={gallery} {instance} />
                {/if}
            </GroupHead>
        </div>
    </div>
</Pane>

<style>
    .view {
        min-width: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    /* The facts are rows: one line of the tree's row height each. */
    .view > :global([data-surface]) > :global(p),
    li {
        display: flex;
        align-items: center;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        margin: 0;
    }

    .socket {
        color: var(--muted-txt, var(--muted));
    }

    ul {
        margin: 0;
        padding-left: 18px;
    }

    /* The hooks 16 px below the facts, and the Gallery 16 px below the hooks. */
    .hooks {
        margin-top: 16px;
    }

    .samples {
        margin-top: 16px;
    }
</style>
