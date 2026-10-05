<script module lang="ts">
    // Layer 3, view registration. Documents open from bookmarks and are not listed.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'document',
        label: 'views.document',
        glyph: 'views.document_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. A local HTML file under a configured root opens as a tab. The file is the
    // manuals of cathedra and game-engine today, opened from the reader's bookmarks file, which the
    // rail's Bookmarks menu lists.
    //
    // The document is an iframe rather than markup pulled into the page: the manuals are whole
    // documents with their own stylesheets, scripts and relative assets, and an iframe is the one
    // thing that gives them their own document to be. `allow-same-origin allow-scripts` is what
    // they need to work at all: same-origin so the browser lets their own stylesheets, images and
    // storage load from api/file, scripts so their own navigation and search run. Same-origin means
    // the frame is not walled off from this page's origin, so it could reach the page through
    // window.parent; the file it holds is the owner's own document from the owner's own disk, which
    // is the same ground api/docs renders a README on.
    //
    // A right-click in the document opens the prose menu (views/shared/prose/prose-menu.ts), as it
    // does on rendered Markdown. The frame is a document of its own whose right-clicks never reach
    // this page, so the frame's own right-click is heard on the frame's document, each time a page
    // loads in it: what it selects and the image under the pointer are read there, and the
    // right-click is raised again on the frame element at the same point, where the menu opens.
    // With no selection and no image the frame's right-click opens nothing. A key pressed with
    // Cmd or Ctrl inside the frame is raised again on the frame element the same way, so the
    // workbench's keys hear it and one they take (Cmd+S among them) is kept from the browser, whose
    // own save dialog would otherwise open over the page.
    //
    // The tab draws no row of controls and hands none to the pane's strip: its path is the
    // breadcrumb the pane draws under the strip, the star and, for a file whose extension
    // `open.program_ext` maps, Open in Program stand at that bar's right end
    // (shared/links/FileBarActions.svelte), and the bookmark, Open in Browser Tab and Open in
    // Program items are also in the tab's right-click menu (shell/panes/strip/tab-menu.ts).

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { useState } from '$lib/state/client/use';
    import { proseAt, proseMenu, prosePicked } from '../../shared/prose/prose-menu';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import { servedFile } from '$lib/views/shared/links/file-bar';
    import { t } from '$lib/state/shared/words/text';
    import FileBarActions from '../../shared/links/FileBarActions.svelte';
    import { fileUrl } from '../../shared/links/file-url';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();

    const {
        fs: { roots },
        layout: { openView }
    } = useState();

    let frame: HTMLIFrameElement | null = $state(null);
    let menu: MenuItem[] = $state([]);
    let heard: { text: string; image: string | null } = { text: '', image: null };

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));

    /** The title the pane draws: the bookmark's own words, or the view's name when it has none. */
    const title = $derived(label === '' ? t('views.document') : label);
    const src = $derived(root === '' || path === '' ? '' : fileUrl(root, path));

    /**
     * A right-click inside the frame: read there, kept from the browser's own menu, and raised
     * again on the frame element at the same point of this page, where the menu opens. A
     * right-click the browser raises for a key comes at no point, and opens at the element it was
     * raised on.
     */
    function inFrame(event: MouseEvent): void {
        const held = frame;
        if (held === null) return;
        const view = held.contentWindow;
        heard = proseAt(event.target, view === null ? null : view.getSelection());
        const origin = window.location.origin;
        menu = proseMenu({ selection: heard.text !== '', image: heard.image, origin }, t);
        event.preventDefault();
        if (menu.length === 0) return;
        const box = held.getBoundingClientRect();
        let x = event.clientX;
        let y = event.clientY;
        const target = event.target as { getBoundingClientRect?: () => DOMRect } | null;
        if (x === 0 && y === 0 && typeof target?.getBoundingClientRect === 'function') {
            const rect = target.getBoundingClientRect();
            x = rect.right;
            y = rect.top;
        }
        held.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: box.left + x,
                clientY: box.top + y
            })
        );
    }

    /**
     * A key with Cmd or Ctrl pressed inside the frame, raised again on the frame element, where it
     * reaches the workbench's keys; a key they take is kept from the browser. A key without them is
     * the document's own (its search box, its links) and stays there.
     */
    function keyInFrame(event: KeyboardEvent): void {
        const held = frame;
        if (held === null || !(event.metaKey || event.ctrlKey)) return;
        const again = new KeyboardEvent('keydown', {
            key: event.key,
            code: event.code,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            repeat: event.repeat,
            bubbles: true,
            cancelable: true
        });
        held.dispatchEvent(again);
        if (again.defaultPrevented) event.preventDefault();
    }

    /**
     * Each page the frame loads is heard for its right-clicks and its keys; a page of its own goes
     * with it.
     */
    function loaded(): void {
        frame?.contentDocument?.addEventListener('contextmenu', inFrame);
        frame?.contentDocument?.addEventListener('keydown', keyInFrame);
    }

    function picked(pick: string): void {
        prosePicked(pick, heard, { openView });
    }

    // The bar's actions go up to the pane while the tab is mounted and one of them applies
    // (ui/tabs/tab-actions.svelte.ts).
    handUp(
        useTabActions(),
        () => instance.id,
        barActions,
        () => servedFile(roots(), root, path, src !== '')
    );
</script>

<!-- The file's actions, handed up to the right end of the pane's breadcrumb bar. -->
{#snippet barActions()}
    <FileBarActions {root} {path} onDisk={src !== ''} />
{/snippet}

<Pane {title} titled={false}>
    <div class="document" data-instance={instance.id} data-root={root} data-path={path}>
        {#if src === ''}
            <Empty message={t('document.none')} glyph={t('document.none_glyph')} />
        {:else}
            <ContextMenu label={t('ui.prose_menu')} items={menu} onpick={picked}>
                <iframe
                    class="frame"
                    {title}
                    {src}
                    sandbox="allow-same-origin allow-scripts"
                    bind:this={frame}
                    onload={loaded}
                ></iframe>
            </ContextMenu>
        {/if}
    </div>
</Pane>

<style>
    .document {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    /* The frame is the body: the document inside it scrolls, so the pane does not scroll around
       it. */
    .frame {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: var(--panel);
    }

    :global(body.wall) .frame {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
