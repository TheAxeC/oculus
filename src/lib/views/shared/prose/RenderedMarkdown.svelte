<script lang="ts">
    // Layer 3, shared view partial. The text of one Markdown file as HTML, drawn with the document
    // styles Markdown.svelte carries. The rendered half of a source tab (source/Editor.svelte) and
    // the Markdown preview tab (views/sources/doc/MarkdownPreview.svelte) both draw it.
    //
    // It renders on the client from the text it is given, so it never asks the server and never
    // waits for a save: the source tab hands it the text the reader is typing and the preview tab
    // the file as saved. The text is the file's own Markdown, so it goes through the same
    // marked-and-sanitise call every other document of the application is drawn through.
    //
    // An image address is left as the file wrote it. The text is one file, and the file route is
    // not asked to resolve a figure beside it. A front matter block at the head of the file is the
    // manifest of a document and not its prose, so it is left out as the document route leaves it
    // out.
    //
    // `framed` draws the box the source tab's half sits in; a tab that is only this document asks
    // for none, and for `tabFocus`, which marks the scroll box as where the keyboard goes when a
    // double click keeps that tab. `fraction`, when given, is how far the caller's own view of the
    // text is scrolled, 0 to 1, and this follows it through its own height.

    import Markdown from './Markdown.svelte';
    import { blockMarkdownParts } from '$lib/ui/html';
    import type { RenderedHeading } from '$lib/state/system/docs.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The file the text belongs to, which names it for a reader. */
        path: string;
        /** The Markdown to render. */
        text: string;
        /** Whether the text is still being read. */
        loading?: boolean;
        /** Why the text could not be read, or the empty string. */
        error?: string;
        /** How far the caller is scrolled through the same text, 0 to 1. */
        fraction?: number;
        /** Whether the document sits in a bordered box of its own. */
        framed?: boolean;
        /** Whether the scroll box takes the keyboard when a double click keeps the tab. */
        tabFocus?: boolean;
        /** Told the headings of the document each time it is drawn. */
        onheadings?: (headings: readonly RenderedHeading[]) => void;
    };

    let {
        path,
        text,
        loading = false,
        error = '',
        fraction,
        framed = true,
        tabFocus = false,
        onheadings
    }: Props = $props();
    let box: HTMLDivElement | undefined = $state();

    /**
     * A YAML front matter block at the head of the file, which the document route splits off too.
     */
    const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

    /** The rendered document and its headings, drawn once the text has been read. */
    const drawn = $derived(
        error === '' && !loading
            ? blockMarkdownParts(text.replace(FRONT_MATTER, ''))
            : { html: '', headings: [] }
    );
    const doc = $derived({
        html: drawn.html,
        headings: drawn.headings,
        frontmatter: null,
        error,
        loading,
        parts: [],
        path: '',
        manual: ''
    });

    $effect(() => {
        onheadings?.(drawn.headings);
    });

    // Two views of the same text hold it at different heights, so the caller's position through
    // its text is what carries over, not its pixels.
    $effect(() => {
        const at = fraction;
        if (at === undefined || box === undefined) return;
        const room = box.scrollHeight - box.clientHeight;
        if (room > 0) box.scrollTop = at * room;
    });
</script>

<div
    class="preview"
    class:framed
    data-source-preview={path}
    data-tab-focus={tabFocus ? '' : undefined}
    tabindex="-1"
    bind:this={box}
>
    <Markdown
        {doc}
        loading={t('file.loading')}
        failed={t('source.cannot_open', path)}
        surface={false}
    />
</div>

<style>
    .preview {
        height: 100%;
        min-width: 0;
        box-sizing: border-box;
        overflow: auto;
        padding: 8px;
    }

    .framed {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    :global(body.wall) .framed {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
