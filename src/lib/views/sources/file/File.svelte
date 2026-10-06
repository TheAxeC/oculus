<script module lang="ts">
    // Layer 3, view registration. A file opens from the file browser and is not listed.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'file',
        label: 'views.file',
        glyph: 'views.file_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One file under one root as its own tab, for the files an editor cannot show: a
    // picture, a PDF in a frame, and a name with a link for anything else. An HTML file never
    // reaches here; the file browser opens it in the document view, which gives it a document of
    // its own so its relative assets resolve.
    //
    // A text file does not stay here either. The file browser opens one in the source tab, and a
    // text file that reaches this view another way (a bookmark, a saved layout from before, a deep
    // link) is handed to the source tab and this tab goes: one file is read in one place, whichever
    // way the reader arrived at it. Which files those are is the file's own first bytes, so a file
    // whose name does not say what it is reads as being read until they have arrived: a download
    // offered for a second over a file that is about to open in an editor would be a flicker saying
    // the wrong thing.
    //
    // Everything is read through api/file, the one route that serves a local file, so the
    // inside-root check is the same here as it is for a manual's stylesheet.
    //
    // The PDF frame carries no sandbox: Chrome refuses to run its own PDF viewer inside a sandboxed
    // frame and draws an error page instead, and what the frame shows is a file this server serves
    // from a root it checked, so the frame is as trusted as the page around it. The view draws the
    // frame's slot and describes the frame to the workbench's tab frames (ui/tabs/
    // tab-frames.svelte.ts), which the frame layer draws over the slot, so a layout change never
    // loads the PDF again.
    //
    // The address carries the file's version from the fs store, so a file written under the open
    // tab, which is what a LaTeX build does to the PDF it rebuilds, is a new address and the frame
    // fetches the new bytes instead of drawing the ones the browser cached. A tab that is hidden
    // keeps the address it drew, and draws the new one, with the one request it makes, when it is
    // shown.
    //
    // The tab draws no row of controls and hands none to the pane's strip: its path is the
    // breadcrumb the pane draws under the strip, and the star and, for a file whose extension
    // `open.program_ext` names an application for, Open in Program stand at that bar's right end
    // (shared/links/FileBarActions.svelte, handed up while the file is served). Open in Program
    // hands the file to that application, so a `.docx` or an `.xlsx` the page draws no view of
    // opens in the program that edits it. The server refuses what the name cannot show (an
    // execute bit, a Finder alias, a file it cannot read) when it is pressed, and the button says
    // so beside it.
    // The bookmark, Open in Browser Tab and Open in Program items are also in the tab's
    // right-click menu (shell/panes/strip/tab-menu.ts). A file whose bytes are text is handed to
    // the source tab.
    //
    // The picture and the download line carry `data-tab-focus`, which is where the keyboard goes
    // when a double click keeps the tab (PaneBody.svelte): the arrow keys then scroll the picture.
    //
    // A picture the browser cannot load is the read failure: the message box with a control that
    // draws the picture again, which asks the server for the bytes once more.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FrameSlot from '$lib/ui/tabs/FrameSlot.svelte';
    import { drawFrame, useTabFrames, type FrameSpec } from '$lib/ui/tabs/tab-frames.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import { servedFile } from '$lib/views/shared/links/file-bar';
    import FileBarActions from '../../shared/links/FileBarActions.svelte';
    import { openSourceFile } from '../../shared/links/source-file';
    import { humanSize } from '$lib/state/boards/board';
    import { fileBytesUrl } from '$lib/state/sources/fs.svelte';
    import { extensionOf, nameOf, typeOfFile } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source.svelte';
    import { instanceNumber, instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { fileVersion, heldFileKind, readFileKind, roots },
        layout: { closeInstance }
    } = client;

    let { instance }: ViewProps = $props();

    const frames = useTabFrames();

    /** The address of the picture that failed to load, and the empty string while none has. */
    let unreadable = $state('');
    /** How many times the picture was asked for again, which makes a new element each time. */
    let attempt = $state(0);

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));

    const title = $derived(label === '' ? t('views.file') : label);
    const gate = shownGate(useShown());
    /** What the address of the file is made of: the root, the path and the version written. */
    const addressed = (): unknown[] => [root, path, fileVersion(root, path)];
    /** The file's address as it stands, with the version the fs store holds for it. */
    const address = $derived(
        root === '' || path === '' ? '' : fileBytesUrl(root, path, fileVersion(root, path))
    );
    /**
     * The address the picture and the frame draw, with the root and the path it was taken for. All
     * three move together to the file's address when the tab is shown and the root, the path or
     * the version moved since it was last drawn, so a hidden tab asks for nothing, a change of file
     * in a shown tab is drawn at once, and what is drawn (the kind, the name, the address) always
     * belongs to one file. A tab drawn shown starts at the file's address; one drawn hidden starts
     * with no address and draws the loading line until it is shown.
     */
    let drawn = $state(untrack(() => (gate.due(addressed()) ? taken() : undrawn())));
    const src = $derived(drawn.src);
    const type = $derived(typeOfFile(drawn.path));
    /** What the file opens as once that is known, and null while its first bytes are being read. */
    const known = $derived(
        drawn.root === '' || drawn.path === '' ? null : heldFileKind(drawn.root, drawn.path)
    );
    /**
     * Whether this view holds the file rather than reading it or handing it to the source tab: a
     * picture or a PDF, which the name says at once, or a file whose first bytes say it is no text.
     */
    const holds = $derived(src !== '' && known !== null && known.kind !== 'text');
    /** What the tree knew the file's size to be, which is what an undrawn type reports. */
    const size = $derived(humanSize(instanceNumber(instance.state, 'size')));

    /**
     * Hand a text file on to the source tab, which is where every text file is read and written.
     * The preview mark goes with it, so a file opened by a single click stays the tab the next one
     * replaces; when the source tab took this instance's own place, there is nothing left to close.
     *
     * Everything this reads about the instance is taken before the first await. Opening the source
     * tab makes it the pane's active one, and the props of a component the pane is no longer
     * drawing are not this tab's any more, so an id read afterwards would name the tab that took
     * its place.
     */
    async function handOn(
        mine: string,
        own: boolean,
        fileRoot: string,
        filePath: string
    ): Promise<void> {
        if (fileRoot === '' || filePath === '') return;
        if (typeOfFile(filePath).kind !== 'other') return;
        const found = await readFileKind(fileRoot, filePath);
        if (found.kind !== 'text') return;
        const opened = openSourceFile(client, sourceTabState(fileRoot, filePath), {
            preview: own
        });
        if (opened !== mine) closeInstance(mine);
    }

    /** The file's address as it stands, with the root and the path it is the address of. */
    function taken(): { src: string; root: string; path: string } {
        return { src: address, root, path };
    }

    /** What a tab that has not drawn a file yet holds. */
    function undrawn(): { src: string; root: string; path: string } {
        return { src: '', root: '', path: '' };
    }

    $effect(() => {
        if (gate.due(addressed())) drawn = taken();
    });

    $effect(() => {
        const mine = instance.id;
        const own = instance.preview === true;
        const fileRoot = root;
        const filePath = path;
        untrack(() => void handOn(mine, own, fileRoot, filePath));
    });

    /** The frame the tab holds while it draws a PDF. */
    const frame = $derived<FrameSpec | null>(
        src !== '' && type.kind === 'pdf'
            ? { kind: 'pdf', view: instance.view, src, title, key: '' }
            : null
    );
    drawFrame(
        frames,
        () => instance.id,
        () => frame
    );

    /** Ask the server for the picture again, in a new element. */
    function retry(): void {
        unreadable = '';
        attempt += 1;
    }

    // The bar's actions go up to the pane while the tab is mounted and one of them applies
    // (ui/tabs/tab-actions.svelte.ts).
    handUp(
        useTabActions(),
        () => instance.id,
        barActions,
        () => servedFile(roots(), drawn.root, drawn.path, holds)
    );
</script>

<!-- The file's actions, handed up to the right end of the pane's breadcrumb bar. -->
{#snippet barActions()}
    <FileBarActions root={drawn.root} path={drawn.path} onDisk={holds} />
{/snippet}

{#snippet again()}
    <ToolButton small label={t('file.retry')} onclick={retry} />
{/snippet}

<Pane {title} titled={false}>
    <div class="file" data-instance={instance.id} data-root={root} data-path={path}>
        {#if src === '' && (root === '' || path === '')}
            <Empty message={t('file.none')} glyph={t('file.none_glyph')} />
        {:else if src === ''}
            <Empty message={t('file.loading')} glyph={t('file.none_glyph')} />
        {:else if type.kind === 'image'}
            {#if unreadable === src}
                <Empty error message={t('file.unreadable', nameOf(drawn.path))} action={again} />
            {:else}
                {#key attempt}
                    <img
                        class="picture"
                        data-tab-focus
                        tabindex="-1"
                        alt={t('file.image', nameOf(drawn.path))}
                        {src}
                        onerror={() => (unreadable = src)}
                    />
                {/key}
            {/if}
        {:else if type.kind === 'pdf'}
            <FrameSlot id={instance.id} />
        {:else if known === null || known.kind === 'text'}
            <Empty message={t('file.loading')} glyph={t('file.none_glyph')} />
        {:else}
            <div class="other" data-tab-focus tabindex="-1">
                <Empty
                    message={t('file.other', extensionOf(drawn.path), size)}
                    glyph={t('file.other_glyph')}
                />
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is the api/file endpoint rather than a route id resolve() takes -->
                <a class="download" href={src} download={nameOf(drawn.path)}>{t('file.download')}</a
                >
            </div>
        {/if}
    </div>
</Pane>

<style>
    .file {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    .picture {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        align-self: flex-start;
    }

    .other {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .download {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }
</style>
