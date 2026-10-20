<svelte:options namespace="svg" />

<script lang="ts">
    // Layer 3, shared graph partial. The label layer of the graph, drawn inside the SVG of
    // Graph.svelte over every node, from the nodes and the edges where the graph draws them and
    // the part of the graph its SVG shows. By the rule of labels.ts beside this file a label is
    // drawn on its node's left when the right has no room inside that part, and is hidden when it
    // would overlap a label already drawn, any node but its own or any edge's line, or would be
    // cut by the SVG's edge on either side of its node or at the top or the bottom, the pillars'
    // labels placed first, until its node is hovered, holds the keyboard or is an end of the link
    // being drawn; those labels are drawn whatever they overlap, and last, so they sit on top. An
    // archived project's label is dimmed with its node, and drawn at full strength with it while
    // the node is the one the pointer or the keyboard is on.
    //
    // Each label's size is read from the page by measure(), which the graph calls once the words,
    // the text size or the placement change and once a hidden tab shows, since a label is measured
    // only where it is drawn and a hidden tab draws it at no size.

    import {
        LABEL_DROP,
        UNMEASURED,
        labelBox,
        labelSize,
        shownLabels,
        type LabelLine,
        type LabelSize,
        type LabelView
    } from './labels';
    import type { PointNode } from '$lib/state/boards/structure/graph';

    type Props = {
        /** The nodes where the graph draws them. */
        nodes: PointNode[];
        /** Each edge's line as the graph draws it. */
        lines: LabelLine[];
        /** The part of the graph the SVG shows under the pan and the zoom, where a label fits. */
        view: LabelView;
        /** The node under the pointer, by id. */
        hovered: string | null;
        /** The node holding the keyboard, by id. */
        focused: string | null;
        /** The two ends of the link being drawn in link mode, by id; null while there is none. */
        linking: (string | null)[];
    };
    let { nodes, lines, view, hovered, focused, linking }: Props = $props();

    /**
     * Each drawn label element by node id, which is where a label's width is measured. It is state
     * because `bind:this` writes into it; measure() reads it after a tick, outside any effect.
     */
    const texts: Record<string, SVGTextElement | null> = $state({});

    /** Each label's measured size by node id; a label not yet measured has none. */
    let measured: Partial<Record<string, LabelSize>> = $state({});

    /** The labels drawn on top of the rest: the hovered node's, the selected node's, the link's. */
    const leading = $derived(
        [hovered, focused, ...linking].filter((id): id is string => id !== null)
    );

    /** Each label's box and the side of its node it is drawn on, by node id. */
    const boxes = $derived(
        new Map(
            nodes.map((node) => [node.id, labelBox(node, measured[node.id] ?? UNMEASURED, view)])
        )
    );

    /** The labels drawn, by node id. An unmeasured label has no width and so overlaps nothing. */
    const shown = $derived(shownLabels([...boxes.values()], leading, nodes, lines));

    /** The nodes in the order their labels are drawn: the leading labels last, so on top. */
    const labelled = $derived([
        ...nodes.filter((node) => !leading.includes(node.id)),
        ...nodes.filter((node) => leading.includes(node.id))
    ]);

    /** Read every drawn label's box from the page, so the box follows the node as it moves. */
    export function measure(): void {
        const next: Record<string, LabelSize> = {};
        for (const [id, text] of Object.entries(texts)) {
            if (text?.isConnected === true) next[id] = labelSize(text);
        }
        measured = next;
    }
</script>

<g class="labels">
    {#each labelled as node (node.id)}
        {@const box = boxes.get(node.id)}
        <text
            class:line-label={node.kind === 'line'}
            class:hidden={!shown.has(node.id)}
            class:archived={node.archived !== undefined}
            class:lifted={node.id === hovered || node.id === focused}
            data-label={node.id}
            bind:this={texts[node.id]}
            x={box?.side === 'left' ? box.right : (box?.left ?? node.x)}
            y={node.y + LABEL_DROP}
            text-anchor={box?.side === 'left' ? 'end' : 'start'}
        >
            {node.label}
        </text>
    {/each}
</g>

<style>
    text {
        fill: var(--ink-txt, var(--ink));
        font-size: var(--fs-xs);
        pointer-events: none;
    }

    text.line-label {
        font-size: var(--fs-sm);
    }

    /* An archived node's label, drawn in this layer outside its node, is dimmed with the node,
       and drawn at full strength with it while the node is the one the pointer or the keyboard is
       on. */
    text.archived {
        opacity: 0.6;
        transition: opacity 120ms ease;
    }

    text.archived.lifted {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        text.archived {
            transition: none;
        }
    }

    text.hidden {
        visibility: hidden;
    }
</style>
