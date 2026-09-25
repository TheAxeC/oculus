<script lang="ts">
    // Layer 3, partial of views/sources/source/Source.svelte. The rendered half of a Markdown
    // source tab: the editor's working text as HTML, drawn with the document styles
    // shared/prose/Markdown.svelte carries.
    //
    // It renders on the client from the text the reader is typing, so it never asks the server and
    // never waits for a save. The text is the file's own Markdown, so it goes through the same
    // marked-and-sanitise call every other document of the application is drawn through.
    //
    // An image address is left as the file wrote it. The preview is the text of one file, and the
    // file route is not asked to resolve a figure beside it. A front matter block at the head of
    // the file is the manifest of a document and not its prose, so it is left out as the document
    // route leaves it out.

    import Markdown from '$lib/views/shared/prose/Markdown.svelte';
    import { blockMarkdown } from '$lib/ui/html';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The file the text belongs to, which names the pane for a reader. */
        path: string;
        /** The editor's working text, rendered as it is typed. */
        text: string;
        /** How far the editor is scrolled through its own text, 0 to 1. */
        fraction: number;
    };

    let { path, text, fraction }: Props = $props();
    let box: HTMLDivElement | undefined = $state();

    /**
     * A YAML front matter block at the head of the file, which the document route splits off too.
     */
    const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

    const doc = $derived({
        html: blockMarkdown(text.replace(FRONT_MATTER, '')),
        frontmatter: null,
        error: '',
        loading: false
    });

    // The two halves hold the same text at different heights, so the editor's position through its
    // text is what carries over, not its pixels.
    $effect(() => {
        const at = fraction;
        if (box === undefined) return;
        const room = box.scrollHeight - box.clientHeight;
        if (room > 0) box.scrollTop = at * room;
    });
</script>

<div class="preview" data-source-preview={path} bind:this={box}>
    <Markdown {doc} loading={t('file.loading')} failed={t('source.cannot_open', path)} />
</div>

<style>
    .preview {
        height: 100%;
        min-width: 0;
        box-sizing: border-box;
        overflow: auto;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    :global(body.wall) .preview {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
