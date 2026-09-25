<script lang="ts">
    // Layer 3, view partial. One diagram of the manual, drawn in the page's own text colour.
    //
    // The drawing is the diagram route's SVG, which bin/diagrams/diagrams.mjs writes with no
    // background and every line and letter in `currentColor`. Drawn by an `img` it would keep black
    // under every theme, since an image is a document of its own, so the file is fetched as text,
    // passed through ui/html.ts's graph filter and put into the page, where `currentColor` is the
    // colour of the figure around it: the prose colour of the theme in force.
    //
    // A later name supersedes a fetch still on its way, and a closed view stops one: newest.ts
    // aborts the fetch its stop is called for and hands on an answer only while its fetch is the
    // current one. A file the route refuses, or a fetch that fails, draws a line saying which
    // diagram and why, instead of an empty box.

    import { t } from '$lib/state/shared/words/text';
    import { sanitiseGraph } from '$lib/ui/html';
    import { diagramUrl } from './manual';
    import { newestAnswer } from './newest';

    type Props = {
        /** The diagram's file name without `.svg`, as HELP.md names it. */
        name: string;
        /** The alternative text HELP.md gives it, read out in place of the drawing. */
        alt: string;
    };

    let { name, alt }: Props = $props();

    /** One answer: the diagram it is for, the file's text, or what went wrong. */
    type Drawn = { name: string; svg: string; error: string };

    let drawn = $state<Drawn | null>(null);

    /** The answer for the name shown now; one for an earlier name is not drawn. */
    const shown = $derived(drawn !== null && drawn.name === name ? drawn : null);

    /** Fetch one diagram, or say why there is none; the signal stops the fetch. */
    async function load(asked: string, signal: AbortSignal): Promise<Drawn> {
        try {
            const response = await fetch(diagramUrl(asked), { signal });
            if (!response.ok) return { name: asked, svg: '', error: String(response.status) };
            return { name: asked, svg: await response.text(), error: '' };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { name: asked, svg: '', error: reason };
        }
    }

    /** Takes the answer of the newest fetch and drops one for a name no longer shown. */
    const ask = newestAnswer<Drawn>((answer) => {
        drawn = answer;
    });

    // The stop the effect returns is its cleanup, which is what aborts a fetch: it runs when the
    // name changes and when the view closes.
    $effect(() => {
        const asked = name;
        return ask((signal) => load(asked, signal));
    });
</script>

<figure class="diagram" data-diagram={name} role="img" aria-label={alt}>
    {#if shown === null}
        <p class="note">{t('help.diagram_loading', name)}</p>
    {:else if shown.error !== ''}
        <p class="note">{t('help.diagram_failed', name, shown.error)}</p>
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
