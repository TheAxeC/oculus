<script module lang="ts">
    // Layer 3, view registration. The Notes Graph is in the Explorer's group (decision 8) and is
    // placed on no page's arrangement: it opens from the catalogue, the palette and the Graph
    // control of the Files view's Notes section.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'notes-graph',
        label: 'views.notes_graph',
        glyph: 'views.notes_graph_glyph',
        group: 'explorer',
        order: 4
    };
</script>

<script lang="ts">
    // Layer 3, view. The notes of every hub as a graph: every note a node labelled by its name,
    // every `[[link]]` that finds another note an edge with an arrow at the note it names, a link
    // to no note drawing none (state/boards/structure/note-graph.ts's noteGraph). A press on
    // a node opens the note in a source tab. The bar's menu shows one hub's notes, or every hub's;
    // the choice is kept in the instance's state, and a choice naming a hub the workspace no
    // longer has shows every hub.
    //
    // The graph is the Map's drawing (views/shared/graph/Graph.svelte): placed by Graphviz's neato
    // from a seed the node set gives, settled by the same forces, dragged, panned and zoomed the
    // same way. It is read from the notes as the page holds them (fs.svelte.ts's `notes`), so a
    // note made, saved, renamed, moved or removed, by the page or by another program, redraws it
    // as the notes are read again: a new note is placed beside the notes it links to and every
    // other note keeps its place, and another hub's notes, which share no note with those drawn,
    // are laid out anew.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import Graph from '$lib/views/shared/graph/Graph.svelte';
    import { openSourceFile } from '$lib/views/shared/links/source-file';
    import { layoutSeed, type PointNode } from '$lib/state/boards/structure/graph';
    import { graphHubs, nodePlace, noteGraph } from '$lib/state/boards/structure/note-graph';
    import { notePath } from '$lib/state/sources/explorer/notes/note-tree';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { notes, retryNotes },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const hubs = $derived(notes().hubs);
    const offered = $derived(graphHubs(hubs));
    /** The hub the menu names, '' for every hub; one the workspace no longer has is every hub. */
    const held = $derived(instanceText(instanceState(instance.id), 'hub'));
    const shown = $derived(offered.includes(held) ? held : '');
    const graph = $derived(noteGraph(hubs, shown === '' ? null : shown));
    const seed = $derived(layoutSeed(graph.nodes));

    // A read of the notes that failed holds nothing, so the view asks again when it is drawn.
    $effect(() => retryNotes());

    /** Keep the hub the menu names with the instance. */
    function pick(hub: string): void {
        setInstanceState(instance.id, { hub });
    }

    /** Open the note a node stands for. */
    function open(node: PointNode): void {
        const place = nodePlace(node);
        openSourceFile(client, { root: place.root, path: notePath(place.path) });
    }
</script>

{#snippet bar()}
    <Toolbar label={t('notes.graph_bar')}>
        <Select
            value={shown}
            label={t('notes.graph_hub')}
            empty={t('notes.graph_all')}
            choices={offered.map((hub) => ({ id: hub, label: hub }))}
            onchange={pick}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.notes_graph')} {bar}>
    <div class="graph" data-instance={instance.id}>
        {#if graph.nodes.length === 0}
            <Empty message={t('notes.graph_empty')} glyph={t('notes.graph_glyph')} />
        {:else}
            <Graph
                {graph}
                instanceId={instance.id}
                {seed}
                label={t('views.notes_graph')}
                onopen={open}
                failed={(reason: string) => t('notes.graph_failed', reason)}
            />
        {/if}
    </div>
</Pane>

<style>
    /* The graph fills the body. */
    .graph {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-width: 0;
    }
</style>
