<script lang="ts">
    // Layer 3, shared view partial. One Markdown document drawn as prose: the answer is still being
    // read, it failed, or it is the HTML the document rule of data/prose/markdown/markdown.ts
    // rendered. The doc, help and project views draw a fetched document with it, and
    // RenderedMarkdown.svelte draws the text it renders on the page, for the source tab's rendered
    // half and for the Markdown preview tab.
    //
    // The HTML is somebody's Markdown turned into markup by marked, so it is sanitised by
    // ui/html.ts and holds only what its profiles allow. The words for the two states the document
    // is not in come from the view that owns the document, since each of them names what it is
    // reading; the pending line is an Empty state and the failure its error box.
    //
    // A view that hands `onlink` answers a press on its own links first (a note's links and tags),
    // and one that hands `slots` hands the formulas its renderer held apart (RenderedMarkdown's),
    // which the sanitiser puts back through a profile of their own.
    //
    // A press on a link to a fragment is handled inside the view by jump.ts, never through the
    // address. A view that says `follow` also has a press on a relative link to a Markdown file
    // opened as a tab: the target is resolved from this document's own path (the answer's `path`)
    // in the space the answer names, the engine folder for the manual and oculus's own guides and
    // the hub for any other document (doc-link.ts, `openingOf`). The manual opens the Help view at
    // the heading the link names, a file of the engine folder opens as the engine's document
    // whichever document linked to it, and any other document opens as a doc tab of the hub, which
    // says so when the `docs:` list of config/layout.yml does not name it. A link of the engine's
    // documents that climbs out of the engine folder is read in the hub when the folder lies in
    // it. A link that leaves the hub, and any link of a document outside the hub (the answer's
    // `path` is then the empty path), opens nothing and the page stays where it is.
    //
    // A right-click on the document opens the prose menu (prose-menu.ts), read as the right-click
    // arrives: Copy over a selection, Copy Image over an image, and Open Image over an image the
    // hub serves, which opens it in the file view. With neither, nothing opens.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import { sanitise, type MathSlots } from '$lib/ui/html';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { t } from '$lib/state/shared/words/text';
    import { getContext } from 'svelte';
    import { STATE_KEY } from '$lib/state/client/use';
    import type { ClientState } from '$lib/state/client/context';
    import { proseAt, proseMenu, prosePicked } from './prose-menu';
    import type { DocState } from '$lib/state/system/docs.svelte';
    import { jump, type LinkFollower } from './jump';
    import { openingOf, type DocLink } from './doc-link';
    import {
        docState,
        engineDocState,
        engineHubPath,
        readDocs
    } from '$lib/state/workbench/navigation/catalogue';
    import { instanceText, isInstanceOf, tabsOf } from '$lib/state/workbench/layout';

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
        /** Whether a relative link to a Markdown file opens that document in a tab. */
        follow?: boolean;
        /** The formulas the renderer held apart from `doc.html` (blockMarkdownParts). */
        slots?: MathSlots;
        /** Answers a press on a link first: true when it handled the address, which is kept. */
        onlink?: (href: string) => boolean;
    };

    let { doc, loading, failed, surface = true, follow = false, slots, onlink }: Props = $props();

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

    /** Open the document a link between documents names, as the view's tab. */
    function open(link: DocLink): void {
        if (client === undefined) return;
        const opening = openingOf(link, doc);
        if (opening === null) return;
        const state = fragmentState(link);
        if (opening.kind === 'help') {
            client.layout.openView('help', state);
            return;
        }
        const listed = readDocs(client.entities.config()?.config.docs);
        if (opening.kind === 'hub') {
            const ownHub = opening.hub === '' || opening.hub === client.fs.primary();
            const entry = ownHub ? listed.find((one) => one.path === opening.path) : undefined;
            const named = entry ?? { label: '', path: opening.path, group: '' };
            const hubState = ownHub
                ? {}
                : { id: `${opening.hub}:${opening.path}`, hub: opening.hub };
            client.layout.openView('doc', { ...docState(named), ...hubState, ...state });
            return;
        }
        const at = engineHubPath(opening.path, doc.engineAt);
        const inPrimary = doc.engineHub === client.fs.primary();
        const entry = listed.find((one) => inPrimary && at !== '' && one.path === at);
        const label = entry?.label ?? heldLabel(opening.path);
        client.layout.openView('doc', { ...engineDocState(opening.path, label), ...state });
    }

    /**
     * The words of the tab already open over a document of the engine folder, or the empty text
     * for none. Opening a tab that is open states it again, so the words it holds are handed back
     * to keep its name.
     */
    function heldLabel(path: string): string {
        const id = engineDocState(path).id;
        for (const host of client?.layout.hosts() ?? []) {
            for (const tab of tabsOf(host.workbench.root)) {
                if (isInstanceOf(tab, 'doc', id)) return instanceText(tab.state, 'label');
            }
        }
        return '';
    }

    /** The state that carries the heading a link names, none for a link to the document alone. */
    function fragmentState(link: DocLink): { fragment?: string } {
        return link.fragment === '' ? {} : { fragment: link.fragment };
    }

    /** What a press on a link between documents is handed to, for a view that follows them. */
    const follower: LinkFollower | undefined = $derived(
        follow ? { from: doc.path, open } : undefined
    );

    /**
     * A press in the document: a link the view answers itself, else the fragment and the follower.
     */
    function pressed(event: MouseEvent): void {
        const link = event.target instanceof Element ? event.target.closest('a') : null;
        const href = link?.getAttribute('href') ?? '';
        if (onlink !== undefined && href !== '' && onlink(href)) {
            event.preventDefault();
            return;
        }
        jump(event, follower);
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
        <div class="doc" class:surfaced={surface} onclick={pressed} bind:this={box}>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
            {@html sanitise(doc.html, slots)}
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

    /* A note's link, a link to no note, a tag, an embedded note's frame and a formula KaTeX
       refused. */
    .doc :global(a.wikilink.unresolved) {
        color: var(--muted-txt, var(--muted));
        text-decoration-line: underline;
        text-decoration-style: dashed;
    }

    .doc :global(a.note-tag) {
        padding: 0 4px;
        border-radius: var(--radius-sm);
        background: var(--chip);
        text-decoration: none;
    }

    .doc :global(.embed) {
        margin: 6px 0;
        padding: 4px 8px;
        border-left: 2px solid var(--accent-txt, var(--accent));
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    .doc :global(span.embed-head) {
        margin-right: 6px;
    }

    .doc :global(span.math-error) {
        color: var(--c-red-txt);
        font-family: var(--font-mono);
    }

    .doc :global(blockquote) {
        margin: 6px 0;
        padding-left: 8px;
        border-left: 2px solid var(--line);
        color: var(--muted-txt, var(--muted));
    }
</style>
