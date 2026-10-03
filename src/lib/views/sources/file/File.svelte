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
    // from a root it checked, so the frame is as trusted as the page around it.
    //
    // The address carries the file's version from the fs store, so a file written under the open
    // tab, which is what a LaTeX build does to the PDF it rebuilds, is a new address and the frame
    // fetches the new bytes instead of drawing the ones the browser cached. A tab that is hidden
    // keeps the address it drew, and draws the new one, with the one request it makes, when it is
    // shown.
    //
    // The header holds the icon actions: the star, opening the address in a browser tab and the
    // program control. The star is `shared/links/BookmarkStar.svelte`, which the source tab draws
    // too: a reader bookmarks the file in front of them, whichever of the two tabs is showing it.
    // What a refused bookmark write or open says is at the end of the pane's bar.
    //
    // "Open in its program" is `shared/links/ProgramButton.svelte`, which hands the file to the
    // application `open.program_ext` of config/behavior.yml names for its extension, so a `.docx`
    // or an `.xlsx` the page draws no view of opens in the program that edits it. It is offered
    // only for a name with such an entry, in the header once this view holds the file (a file still
    // being read, or one about to be handed to the source tab, carries none, for the same reason
    // it carries no download) and again beside the download; a listed file whose bytes are text is
    // handed to the source tab, which carries the same control. The server refuses what the name
    // cannot show (an execute bit, a Finder alias, a file it cannot read) when it is pressed, and
    // each control says so beside it.
    //
    // A picture the browser cannot load is the read failure: the message box with a control that
    // draws the picture again, which asks the server for the bytes once more.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import BookmarkStar from '../../shared/links/BookmarkStar.svelte';
    import ProgramButton from '../../shared/links/ProgramButton.svelte';
    import { openSourceFile } from '../../shared/links/source-file';
    import { humanSize } from '$lib/state/boards/board';
    import { fileBytesUrl } from '$lib/state/sources/fs.svelte';
    import { extensionOf, nameOf, opensInProgram, typeOfFile } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source.svelte';
    import { instanceNumber, instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { fileVersion, heldFileKind, readFileKind },
        layout: { closeInstance },
        selectors: { programApps }
    } = client;

    let { instance }: ViewProps = $props();

    /** What the star or the program control was refused with, or the empty string. */
    let said = $state('');
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
    /**
     * Whether the view offers to open the file in its program: it holds it and the map names one.
     */
    const openable = $derived(holds && opensInProgram(drawn.path, programApps()));
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

    /** The same address in a browser tab of its own, which is also how the file is saved. */
    function outside(): void {
        if (src === '') return;
        window.open(src, '_blank', 'noopener');
    }

    /** Ask the server for the picture again, in a new element. */
    function retry(): void {
        unreadable = '';
        attempt += 1;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('file.toolbar')} overflow>
        <BookmarkStar bare {root} {path} onsaid={(words: string) => (said = words)} />
        <ToolButton
            bare
            label={t('file.open_outside')}
            glyph={t('file.open_outside_glyph')}
            onclick={outside}
        />
        {#if openable}
            <ProgramButton bare {root} {path} onsaid={(words: string) => (said = words)} />
        {/if}
    </Toolbar>
{/snippet}

{#snippet bar()}
    {#if said !== ''}
        <span class="said" role="alert">{said}</span>
    {/if}
{/snippet}

{#snippet again()}
    <ToolButton small label={t('file.retry')} onclick={retry} />
{/snippet}

<Pane {title} titled={false} toolbar={tools} {bar}>
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
                        alt={t('file.image', nameOf(drawn.path))}
                        {src}
                        onerror={() => (unreadable = src)}
                    />
                {/key}
            {/if}
        {:else if type.kind === 'pdf'}
            <iframe class="frame" {title} {src}></iframe>
        {:else if known === null || known.kind === 'text'}
            <Empty message={t('file.loading')} glyph={t('file.none_glyph')} />
        {:else}
            <div class="other">
                <Empty
                    message={t('file.other', extensionOf(drawn.path), size)}
                    glyph={t('file.other_glyph')}
                />
                <div class="actions">
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is the api/file endpoint rather than a route id resolve() takes -->
                    <a class="download" href={src} download={nameOf(drawn.path)}
                        >{t('file.download')}</a
                    >
                    {#if openable}
                        <ProgramButton root={drawn.root} path={drawn.path} />
                    {/if}
                </div>
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

    .actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .download {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }

    /* What the star or the program control was refused with: alert words at the end of the bar. */
    .said {
        margin-left: auto;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
