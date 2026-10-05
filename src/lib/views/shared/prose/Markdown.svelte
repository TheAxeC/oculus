<script lang="ts">
    // Layer 3, shared view partial. One Markdown document drawn as prose: the answer is still being
    // read, it failed, or it is the HTML the document rule of data/prose/markdown.ts rendered. The
    // doc, help and project views draw a fetched document with it, and RenderedMarkdown.svelte
    // draws the text it renders on the page, for the source tab's rendered half and for the
    // Markdown preview tab.
    //
    // The HTML is somebody's Markdown turned into markup by marked, so it is drawn through
    // ui/html.ts's sanitise and holds only what that profile allows. The words for the two states
    // the document is not in come from the view that owns the document, since each of them names
    // what it is reading; the pending line is an Empty state and the failure its error box.
    //
    // A press on a link to a fragment is handled inside the view by jump.ts, never through the
    // address.
    //
    // A right-click on the document opens the prose menu (prose-menu.ts), read as the right-click
    // arrives: Copy over a selection, Copy Image over an image, and Open Image over an image the
    // hub serves, which opens it in the file view. With neither, nothing opens.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import { sanitise } from '$lib/ui/html';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { t } from '$lib/state/shared/words/text';
    import { getContext } from 'svelte';
    import { STATE_KEY } from '$lib/state/client/use';
    import type { ClientState } from '$lib/state/client/context';
    import { proseAt, proseMenu, prosePicked } from './prose-menu';
    import type { DocState } from '$lib/state/system/docs.svelte';
    import { jump } from './jump';

    type Props = {
        /** What state/system/docs.svelte.ts holds for this document. */
        doc: DocState;
        /** The line drawn while the first answer is still to come. */
        loading: string;
        /** The line drawn when the read failed, already carrying the reason. */
        failed: string;
        /**
         * Whether the document keeps a surface of its own under a fenced block over a wallpaper,
         * which a view drawing it on a box that paints nothing (the project view) needs. A view
         * whose box is a translucent surface already (a tinted pane, the preview's frame) says
         * false, since a second layer reads as a nearly solid one.
         */
        surface?: boolean;
    };

    let { doc, loading, failed, surface = true }: Props = $props();

    /**
     * The client's stores, which Open Image opens the file view through. A document drawn outside
     * the workbench, as a test draws one, has none, and its Open Image opens nothing.
     */
    const client = getContext<ClientState | undefined>(STATE_KEY);

    /** What the last right-click read: the selected text and the image under the pointer. */
    let heard: { text: string; image: string | null } = { text: '', image: null };

    /** The document's box, which a selection must start in for Copy to copy it. */
    let box: HTMLDivElement | null = $state(null);

    function pointed(event: MouseEvent): MenuItem[] {
        const selection = window.getSelection();
        const anchor = selection?.anchorNode ?? null;
        const inside = anchor !== null && box?.contains(anchor) === true;
        heard = proseAt(event.target, inside ? selection : null);
        const origin = window.location.origin;
        return proseMenu({ selection: heard.text !== '', image: heard.image, origin }, t);
    }

    function picked(pick: string): void {
        prosePicked(pick, heard, {
            openView: (view: string, state: unknown) => client?.layout.openView(view, state)
        });
    }
</script>

{#if doc.error !== ''}
    <Empty error message={failed} />
{:else if doc.loading}
    <Empty message={loading} />
{:else}
    <!-- The press is the links' own: each link is a keyboard stop whose Enter is a click, and the
         box only hears it bubble up, so the box itself takes no key and no focus. -->
    <ContextMenu label={t('ui.prose_menu')} read={pointed} onpick={picked}>
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="doc" class:surfaced={surface} onclick={jump} bind:this={box}>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
            {@html sanitise(doc.html)}
        </div>
    </ContextMenu>
{/if}

<style>
    /* The document. The Markdown reaches the DOM as HTML, so every rule below is :global. */
    .doc {
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
        overflow-wrap: anywhere;
    }

    .doc :global(h1),
    .doc :global(h2),
    .doc :global(h3),
    .doc :global(h4) {
        margin: 12px 0 4px;
        color: var(--ink-txt, var(--ink));
    }

    .doc :global(h1) {
        font-size: var(--fs-3xl);
    }

    .doc :global(h2) {
        font-size: var(--fs-2xl);
    }

    .doc :global(h3) {
        font-size: var(--fs-xl);
    }

    .doc :global(h4) {
        font-size: var(--fs-md);
    }

    .doc :global(p),
    .doc :global(ul),
    .doc :global(ol) {
        margin: 6px 0;
    }

    .doc :global(a) {
        color: var(--accent-txt, var(--accent));
    }

    /* A table of contents: the document's own links, indented once per level, with no bullets,
       since the indentation is what shows which heading an entry sits under. */
    .doc :global(ul.toc),
    .doc :global(ul.toc ul) {
        list-style: none;
        margin: 2px 0;
        padding-left: 0;
    }

    .doc :global(ul.toc ul) {
        padding-left: 16px;
    }

    .doc :global(ul.toc li) {
        margin: 2px 0;
    }

    .doc :global(img) {
        max-width: 100%;
    }

    .doc :global(code) {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    .doc :global(pre) {
        overflow-x: auto;
        padding: 8px;
        background: var(--chip);
        border-radius: var(--radius-sm);
    }

    /* Over a wallpaper a document drawn on a surface (a tinted pane, the source preview's frame)
       paints nothing under a code span or block, since a second layer reads as a nearly solid
       one. A code span paints nothing on a box that is not tinted either: a blur behind a span
       that wraps covers the whole box around both of its halves, which blurs the prose between
       them. */
    :global(body.wall) .doc :global(code) {
        background: transparent;
    }

    :global(body.wall) .doc :global(pre) {
        background: transparent;
    }

    /* A document drawn straight onto the wallpaper (a box that is not tinted) keeps the one surface
       its fenced blocks would otherwise lack, so a block of code is read off a surface. */
    :global(body.wall) .doc.surfaced :global(pre) {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    .doc :global(pre code) {
        background: none;
        padding: 0;
    }

    /* A table wider than the pane scrolls inside its own box rather than widening the document. Its
       cells break at spaces and not inside a word, so no column is narrower than its longest word:
       the document's `overflow-wrap: anywhere` would let each column shrink to one letter. */
    .doc :global(table) {
        display: block;
        overflow-x: auto;
        border-collapse: collapse;
        font-size: var(--fs-md);
    }

    .doc :global(th),
    .doc :global(td) {
        border: 1px solid var(--line);
        padding: 3px 6px;
        text-align: left;
        overflow-wrap: normal;
    }

    .doc :global(blockquote) {
        margin: 6px 0;
        padding-left: 8px;
        border-left: 2px solid var(--line);
        color: var(--muted-txt, var(--muted));
    }
</style>
