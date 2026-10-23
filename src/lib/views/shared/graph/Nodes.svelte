<svelte:options namespace="svg" />

<script lang="ts">
    // Layer 3, shared graph partial. The node layer of the graph, drawn inside the SVG of
    // Graph.svelte: a circle in the tone of its project stage for a project (node-tone.ts), a
    // circle in the accent for a note, a square for a pillar or a person of a project's team, each
    // a keyboard stop that opens it on Enter or Space. The layer holds no pointer state of its own:
    // a press goes to the graph, which owns the drag, the link and the pan, and the node the
    // pointer or the keyboard is on is handed back through the two bound props, since the graph
    // draws that node's label on top. An archived project is dimmed, and drawn at full strength
    // while it is the node the pointer or the keyboard is on.

    import { nodeTone } from './node-tone';
    import type { PointNode } from '$lib/state/boards/structure/graph';

    type Props = {
        /** The nodes at their drawn positions. */
        nodes: PointNode[];
        /** The id of the node a link would end on, which is drawn with a ring. */
        targetId?: string;
        /** The id of the node under the pointer, or null. */
        hovered?: string | null;
        /** The id of the node holding the keyboard, or null. */
        focused?: string | null;
        /** A pointer went down on a node. */
        onpress: (event: PointerEvent, node: PointNode) => void;
        /** A node was opened from the keyboard. */
        onopen: (node: PointNode) => void;
    };
    let {
        nodes,
        targetId,
        hovered = $bindable(),
        focused = $bindable(),
        onpress,
        onopen
    }: Props = $props();
</script>

{#each nodes as node (node.id)}
    <g
        class="node"
        class:archived={node.archived !== undefined}
        class:lifted={node.id === hovered || node.id === focused}
        class:target={node.id === targetId}
        data-node={node.id}
        role="button"
        tabindex="0"
        aria-label={node.label}
        onpointerdown={(event) => onpress(event, node)}
        onpointerenter={() => (hovered = node.id)}
        onpointerleave={() => {
            if (hovered === node.id) hovered = null;
        }}
        onfocus={() => (focused = node.id)}
        onblur={() => {
            if (focused === node.id) focused = null;
        }}
        onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onopen(node);
        }}
    >
        {#if node.kind === 'project'}
            <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                style={`--node-fill: var(--c-${nodeTone(node)})`}
            ></circle>
        {:else if node.kind === 'note'}
            <circle class="note-node" cx={node.x} cy={node.y} r={node.radius}></circle>
        {:else}
            <rect
                class:line-node={node.kind === 'line'}
                class:collaborator-node={node.kind === 'collaborator'}
                x={node.x - node.radius}
                y={node.y - node.radius}
                width={node.radius * 2}
                height={node.radius * 2}
                rx="3"
            ></rect>
        {/if}
        <title>{node.label}</title>
    </g>
{/each}

<style>
    circle {
        fill: var(--node-fill);
    }

    circle.note-node {
        fill: var(--accent);
    }

    rect.line-node {
        fill: var(--map-line);
    }

    rect.collaborator-node {
        fill: var(--map-collab);
    }

    .node {
        cursor: grab;
    }

    /* An archived project is faded as archival; while it is the node the pointer or the keyboard is
       on the fade lifts, with its label (Labels.svelte), so it is read at full strength. */
    .node.archived {
        opacity: 0.6;
        transition: opacity 120ms ease;
    }

    .node.archived.lifted {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .node.archived {
            transition: none;
        }
    }

    .node.target circle {
        stroke: var(--accent);
        stroke-width: 4;
    }
</style>
