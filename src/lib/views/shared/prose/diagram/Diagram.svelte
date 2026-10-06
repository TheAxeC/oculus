<script lang="ts">
    // Layer 3, shared view partial. One diagram of a document of oculus's own, drawn in the page's
    // own text colour.
    //
    // The drawing is the diagram route's SVG, which utils/diagrams/diagrams.mjs writes with no
    // background and every line and letter in `currentColor`. Drawn by an `img` it would keep black
    // under every theme, since an image is a document of its own, so the file is fetched as text,
    // passed through ui/html.ts's graph filter and put into the page, where `currentColor` is the
    // colour of the figure around it: the prose colour of the theme in force.
    //
    // A later name supersedes a fetch in flight, and a closed view stops one: newest.ts
    // aborts the fetch its stop is called for and hands on an answer only while its fetch is the
    // current one. A file the route refuses, or a fetch that fails, draws a line saying which
    // diagram and why, instead of an empty box.

    import { t } from '$lib/state/shared/words/text';
    import { sanitiseGraph } from '$lib/ui/html';
    import { loadDiagram, type DiagramFile } from './diagram-file';
    import { newestAnswer } from './newest';

    type Props = {
        /** The diagram's file name without `.svg`, as the document names it. */
        name: string;
        /** The alternative text the document gives it, read out in place of the drawing. */
        alt: string;
    };

    let { name, alt }: Props = $props();

    let drawn = $state<DiagramFile | null>(null);

    /** The answer for the name shown now; one for an earlier name is not drawn. */
    const shown = $derived(drawn !== null && drawn.name === name ? drawn : null);

    /** Takes the answer of the newest fetch and drops one for a name that is not the one shown. */
    const ask = newestAnswer<DiagramFile>((answer) => {
        drawn = answer;
    });

    // The stop the effect returns is its cleanup, which is what aborts a fetch: it runs when the
    // name changes and when the view closes.
    $effect(() => {
        const asked = name;
        return ask((signal) => loadDiagram(asked, signal));
    });
</script>

<figure class="diagram" data-diagram={name} role="img" aria-label={alt}>
    {#if shown === null}
        <p class="note">{t('diagram.loading', name)}</p>
    {:else if shown.error !== ''}
        <p class="note">{t('diagram.failed', name, shown.error)}</p>
    {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- the graph filter writes this -->
        {@html sanitiseGraph(shown.svg)}
    {/if}
</figure>

<style>
    /* The drawing's lines and letters are currentColor, so this colour is theirs. */
    .diagram {
        margin: 12px 0;
        overflow-x: auto;
        color: var(--ink-txt, var(--ink));
    }

    .note {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
