<script module lang="ts">
    // Layer 3, view registration. A file opens from the file browser and is not listed.
    import type { ViewRegistration } from './registry';

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
    // picture, a PDF in a frame, and a name with a link for anything else. An HTML file never reaches
    // here; the file browser opens it in the document view, which gives it a document of its own so
    // its relative assets resolve.
    //
    // A text file does not stay here either. The file browser opens one in the source tab, and a text
    // file that reaches this view another way (a bookmark, a saved layout from before, a deep link)
    // is handed to the source tab and this tab goes: one file is read in one place, whichever way the
    // reader arrived at it. Which files those are is the file's own first bytes, so a file whose name
    // does not say what it is reads as being read until they have arrived: a download offered for a
    // second over a file that is about to open in an editor would be a flicker saying the wrong
    // thing.
    //
    // Everything is read through api/file, the one route that serves a local file, so the inside-root
    // check is the same here as it is for a manual's stylesheet.
    //
    // The PDF frame carries no sandbox: Chrome refuses to run its own PDF viewer inside a sandboxed
    // frame and draws an error page instead, and what the frame shows is a file this server serves
    // from a root it checked, so the frame is as trusted as the page around it.
    //
    // The address carries the file's version from the fs store, so a file written under the open tab,
    // which is what a LaTeX build does to the PDF it rebuilds, is a new address and the frame fetches
    // the new bytes instead of drawing the ones the browser cached.
    //
    // The star in the toolbar is `shared/BookmarkStar.svelte`, which the source tab draws too: a
    // reader bookmarks the file in front of them, whichever of the two tabs is showing it.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import BookmarkStar from './shared/BookmarkStar.svelte';
    import { openSourceFile } from './shared/source-file';
    import { humanSize } from '$lib/state/board';
    import { fileBytesUrl } from '$lib/state/fs.svelte';
    import { extensionOf, nameOf, typeOfFile } from '$lib/state/fs';
    import { sourceTabState } from '$lib/state/source.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const client = useState();
    const {
        fs: { fileVersion, heldFileKind, readFileKind },
        layout: { closeInstance }
    } = client;

    let { instance }: ViewProps = $props();

    const root = $derived(read(instance.state, 'root'));
    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));

    const title = $derived(label === '' ? t('views.file') : label);
    const src = $derived(
        root === '' || path === '' ? '' : fileBytesUrl(root, path, fileVersion(root, path))
    );
    const type = $derived(typeOfFile(path));
    /** What the file opens as once that is known, and null while its first bytes are being read. */
    const known = $derived(root === '' || path === '' ? null : heldFileKind(root, path));
    /** What the tree knew the file's size to be, which is what an undrawn type reports. */
    const size = $derived(humanSize(number(instance.state, 'size')));

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }

    function number(state: unknown, key: string): number {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return 0;
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'number' ? value : 0;
    }

    /**
     * Hand a text file on to the source tab, which is where every text file is read and written.
     * The preview mark goes with it, so a file opened by a single click stays the tab the next one
     * replaces; when the source tab took this instance's own place, there is nothing left to close.
     *
     * Everything this reads about the instance is taken before the first await. Opening the source
     * tab makes it the pane's active one, and the props of a component the pane is no longer drawing
     * are not this tab's any more, so an id read afterwards would name the tab that took its place.
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
</script>

{#snippet tools()}
    <Toolbar label={t('file.toolbar')}>
        <BookmarkStar {root} {path} />
        <ToolButton label={t('file.open_outside')} onclick={outside} />
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools}>
    <div class="file" data-instance={instance.id} data-root={root} data-path={path}>
        {#if src === ''}
            <Empty message={t('file.none')} glyph={t('file.none_glyph')} />
        {:else if type.kind === 'image'}
            <img class="picture" alt={t('file.image', nameOf(path))} {src} />
        {:else if type.kind === 'pdf'}
            <iframe class="frame" {title} {src}></iframe>
        {:else if known === null || known.kind === 'text'}
            <Empty message={t('file.loading')} glyph={t('file.none_glyph')} />
        {:else}
            <div class="other">
                <Empty
                    message={t('file.other', extensionOf(path), size)}
                    glyph={t('file.other_glyph')}
                />
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is the api/file endpoint rather than a route id resolve() takes -->
                <a class="download" href={src} download={nameOf(path)}>{t('file.download')}</a>
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

    /* The frame is the body: the document inside it scrolls, so the pane does not scroll around it. */
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
        align-items: flex-start;
        gap: 4px;
    }

    .download {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }
</style>
