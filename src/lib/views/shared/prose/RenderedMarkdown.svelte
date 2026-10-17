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
    // A relative image source is resolved against the file's own folder and read through the file
    // route under the file's root (data/helpers/files/address.ts, `figureUrl`), as the document
    // route resolves a figure, so a diagram beside the file draws; an address the browser resolves
    // itself, and one that climbs out of the root, are left as the file wrote them. A front matter
    // block at the head of the file is the manifest of a document and not its prose, so it is
    // left out as the document route leaves it out.
    //
    // A note of a hub (a file of its `.oculus/notes/`, named by `root` and `path`) is drawn with
    // its links, embeds and tags (state/sources/explorer/notes/note-press.ts's noteDrawing): an
    // embedded note's text is read through the file store's text query, so a save of it redraws
    // this one, and a press on a link or a tag is answered by
    // views/shared/explorer/control/note-actions.ts, a refusal said as a notice. Every Markdown
    // file has its `$...$` and `$$...$$` typeset with KaTeX once a text holding `$` has loaded it
    // (views/shared/latex/math.ts), a formula KaTeX refuses drawn as its source in the error colour
    // with the catalog's sentence as its title. Markdown.svelte sanitises the HTML that
    // blockMarkdownParts answers with the formulas it held apart, each through its own profile.
    //
    // `framed` draws the box the source tab's half sits in; a tab that is only this document asks
    // for none, and for `tabFocus`, which marks the scroll box as where the keyboard goes when a
    // double click keeps that tab. `fraction`, when given, is how far the caller's own view of the
    // text is scrolled, 0 to 1, and this follows it through its own height.

    import { getContext } from 'svelte';
    import Markdown from './Markdown.svelte';
    import { blockMarkdownParts, type MathDrawing } from '$lib/ui/html';
    import type { RenderedHeading } from '$lib/state/system/docs.svelte';
    import { STATE_KEY } from '$lib/state/client/use';
    import type { ClientState } from '$lib/state/client/context';
    import { noteDrawing } from '$lib/state/sources/explorer/notes/note-press';
    import { notePath } from '$lib/state/sources/explorer/notes/note-tree';
    import { pressNote } from '$lib/views/shared/explorer/control/note-actions';
    import { MATH_OPTIONS, holdsMath, loadMarkdownMath } from '$lib/views/shared/latex/math';
    import { t } from '$lib/state/shared/words/text';
    import { figureUrl } from '$lib/state/sources/fs-transport';

    type Props = {
        /** The file the text belongs to, which names it for a reader. */
        path: string;
        /** The root the file is under, which a note is read in; none draws no note. */
        root?: string;
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
        root = '',
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

    /**
     * The client's stores, which a note is read through. A document drawn outside the workbench,
     * as a test draws one, has none, and draws no note.
     */
    const client = getContext<ClientState | undefined>(STATE_KEY);

    /** What the file is drawn with when it is a note of a hub, else null. */
    const note = $derived(
        client === undefined || root === ''
            ? null
            : noteDrawing(
                  client.fs.notes().hubs,
                  { root, path },
                  (inside: string) => {
                      const read = client.fs.fileText(root, notePath(inside));
                      return read.loading || read.error !== '' ? null : read.text;
                  },
                  t
              )
    );

    /** KaTeX and its extension, once a text holding `$` has loaded them. */
    let math = $state.raw<MathDrawing | null>(null);
    $effect(() => {
        if (math !== null || !holdsMath(text)) return;
        loadMarkdownMath().then(
            (modules) => {
                math = { modules, options: MATH_OPTIONS, refused: t('notes.math_refused') };
            },
            () => undefined
        );
    });

    /** The address an image source of the file is read at, under the file's root. */
    const image = $derived(root === '' ? null : (source: string) => figureUrl(root, path, source));

    /** The rendered document and its headings, drawn once the text has been read. */
    const drawn = $derived(
        error === '' && !loading
            ? blockMarkdownParts(text.replace(FRONT_MATTER, ''), { note, math, image })
            : { html: '', slots: undefined, headings: [] }
    );

    /** A press on a note's link or tag, which the note's actions answer. */
    function pressed(href: string): boolean {
        if (client === undefined || root === '') return false;
        return pressNote(client, root, href, (sentence: string) =>
            client.notices.post(sentence, { tone: 'warning' })
        );
    }
    const doc = $derived({
        html: drawn.html,
        headings: drawn.headings,
        frontmatter: null,
        error,
        loading,
        parts: [],
        path: '',
        manual: '',
        engine: false,
        hub: '',
        engineHub: '',
        engineAt: ''
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
        slots={drawn.slots}
        onlink={pressed}
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
