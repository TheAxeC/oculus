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
    // Layer 3, view. One file under one root as its own tab, drawn by what its name says it is: a
    // code window for text, a picture for an image, a frame for a PDF, and a name with a link for
    // anything else. An HTML file never reaches here; the file browser opens it in the document
    // view, which gives it a document of its own so its relative assets resolve.
    //
    // Everything is read through api/file, the one route that serves a local file, so the inside-root
    // check is the same for a code window as it is for a manual's stylesheet. A file longer than the
    // window draws is cut by the store at the window's limit, the transfer stopped there as well as
    // the layout, and the window says so, because a browser asked to lay out forty megabytes of text
    // stops being a browser.
    //
    // The PDF frame carries no sandbox: Chrome refuses to run its own PDF viewer inside a sandboxed
    // frame and draws an error page instead, and what the frame shows is a file this server serves
    // from a root it checked, so the frame is as trusted as the page around it.
    //
    // The star in the toolbar is the reader's own bookmarks over this file: it is set when a
    // bookmark names this root and this path, and pressing it adds one under the file's own name or
    // takes that one out again. The rail draws them, and the Files view is where one is renamed.
    //
    // The window itself is read only. A file whose extension `editable_extensions` lists is handed to
    // a source tab by the control beside the star, which is the same handing-on the Config view's
    // cards make of the engine's own YAML; a file the source tab could only show read only gets no
    // control, since this window already shows it.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import Code from './file/Code.svelte';
    import { openSourceFile } from './shared/edit-bar';
    import { humanSize } from '$lib/state/board';
    import { fileBytesUrl } from '$lib/state/fs.svelte';
    import { extensionOf, nameOf, typeOfFile } from '$lib/state/fs';
    import { sourceAccess } from '$lib/state/source.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const client = useState();
    const {
        fs: { addBookmark, bookmarks, fileText, removeBookmark },
        selectors: { configMap }
    } = client;

    let { instance }: ViewProps = $props();

    const root = $derived(read(instance.state, 'root'));
    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));

    const title = $derived(label === '' ? t('views.file') : label);
    const src = $derived(root === '' || path === '' ? '' : fileBytesUrl(root, path));
    const type = $derived(typeOfFile(path));
    const held = $derived(type.kind === 'text' ? fileText(root, path) : null);
    /** What the tree knew the file's size to be, which is what an undrawn type reports. */
    const size = $derived(humanSize(number(instance.state, 'size')));
    /** Whether the configuration lets the source tab open this file at all, to edit or to read. */
    const openable = $derived(
        type.kind === 'text' && path !== '' && sourceAccess(path, configMap()) === 'editable'
    );

    /** The bookmark over this very file, or null when the reader has not made one. */
    const marked = $derived(
        bookmarks().entries.find((one) => one.fields.root === root && one.fields.path === path) ??
            null
    );

    /** What the last bookmark write failed with, in the endpoint's own words. */
    let failed = $state('');

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

    /** Hand this file on to the source tab, which is where it is edited and saved. */
    function edit(): void {
        if (!openable) return;
        openSourceFile(client, { root, path, label: nameOf(path) });
    }

    /** The same address in a browser tab of its own, which is also how the file is saved. */
    function outside(): void {
        if (src === '') return;
        window.open(src, '_blank', 'noopener');
    }

    /**
     * Bookmark this file under its own name, or take the bookmark over it out again. A label another
     * bookmark already holds is refused rather than written over, which the endpoint says in words
     * and the line under the toolbar repeats; the Files view is where that one is renamed.
     */
    async function mark(): Promise<void> {
        if (root === '' || path === '') return;
        const answer =
            marked === null
                ? await addBookmark({ label: nameOf(path), root, path })
                : await removeBookmark(marked.id);
        failed = answer.ok
            ? answer.refused.map((one) => one.reason).join('; ')
            : (answer.error ?? '');
    }
</script>

{#snippet tools()}
    <Toolbar label={t('file.toolbar')}>
        <ToolButton
            label={marked === null ? t('file.bookmark') : t('file.unbookmark')}
            glyph={t('file.bookmark_glyph')}
            pressed={marked !== null}
            active={marked !== null}
            onclick={() => void mark()}
        />
        {#if openable}
            <ToolButton label={t('file.edit')} glyph={t('file.edit_glyph')} onclick={edit} />
        {/if}
        <ToolButton label={t('file.open_outside')} onclick={outside} />
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools}>
    <div class="file" data-instance={instance.id} data-root={root} data-path={path}>
        {#if failed !== ''}
            <p class="failed" aria-live="polite">{t('file.bookmark_failed', failed)}</p>
        {/if}
        {#if src === ''}
            <Empty message={t('file.none')} glyph={t('file.none_glyph')} />
        {:else if type.kind === 'image'}
            <img class="picture" alt={t('file.image', nameOf(path))} {src} />
        {:else if type.kind === 'pdf'}
            <iframe class="frame" {title} {src}></iframe>
        {:else if type.kind === 'text'}
            {#if held !== null && held.error !== ''}
                <Empty message={t('file.error', held.error)} glyph={t('file.none_glyph')} />
            {:else if held === null || held.loading}
                <Empty message={t('file.loading')} glyph={t('file.none_glyph')} />
            {:else}
                {#if held.truncated}
                    <p class="note" aria-live="polite">{t('file.truncated')}</p>
                {/if}
                <Code text={held.text} language={type.language} {path} />
            {/if}
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

    .note {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .failed {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
