<script module lang="ts">
    // Layer 3, view registration. A Markdown file rendered alone opens from the file browser's Open
    // Preview and is not listed.
    import { MARKDOWN_PREVIEW_VIEW } from '$lib/state/sources/fs';
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: MARKDOWN_PREVIEW_VIEW,
        label: 'views.markdown_preview',
        glyph: 'views.markdown_preview_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One Markdown file under one root as its own tab, rendered and nothing else, as
    // VS Code's Open Preview draws it; the file is opened by opening it. The tab's state is the
    // root, the path and the label `Preview <name>`, so the pane's breadcrumb reads it as a file
    // tab and a rename or move of the file restates it (state/sources/explorer/follow.ts).
    //
    // The text is the file as saved, read through the file store's text query (`fs.fileText`), the
    // read a save from a source tab marks, so a save redraws this tab; a change made from outside
    // oculus is seen when the tab is opened again, since no file is polled. The query is held per
    // file, not per tab, so an answer that lands after the tab closed or was pointed at another
    // file draws nothing and throws nothing. A file that cannot be read says so with the source
    // tab's words, a file longer than the read window says so above its first part with the source
    // tab's words, and a saved state naming no file says none was chosen.
    //
    // The tab draws no row of controls and hands none to the pane's strip: the star and, for a file
    // whose extension `open.program_ext` maps, Open in Program stand at the right end of the pane's
    // breadcrumb bar (shared/links/FileBarActions.svelte) with Open Source, which opens the file's
    // source tab, kept, in the same pane as VS Code's Markdown: Open Source does on its preview,
    // and the bookmark and Open in Program items are in the tab's right-click menu
    // (shell/panes/strip/tab-menu.ts). The rendering is shared/prose/RenderedMarkdown.svelte,
    // which the source tab's rendered half draws too; here its scroll box is where the keyboard
    // goes when a double click keeps the tab (PaneBody.svelte). The headings it draws are said to
    // the Outline, and a press on an Outline row scrolls the tab to that heading
    // (shared/prose/rendered-headings.svelte.ts).

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import FileBarActions from '../../shared/links/FileBarActions.svelte';
    import { openSourceFile } from '../../shared/links/source-file';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RenderedMarkdown from '../../shared/prose/RenderedMarkdown.svelte';
    import { shareHeadings } from '../../shared/prose/rendered-headings.svelte';
    import type { RenderedHeading } from '$lib/state/system/docs.svelte';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        fs: { fileText },
        headings,
        layout: { keepPreview }
    } = client;

    let { instance }: ViewProps = $props();

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));
    const title = $derived(label === '' ? t('views.markdown_preview') : label);
    const named = $derived(root !== '' && path !== '');
    const file = $derived(fileText(root, path));

    /** Open Source: the file's source tab, kept, in this tab's pane. */
    function openSource(): void {
        keepPreview(openSourceFile(client, { root, path }));
    }

    /** The headings of the document as last drawn, and the box that carries the tab's instance. */
    let drawn = $state.raw<readonly RenderedHeading[] | null>(null);
    let box: HTMLDivElement | undefined = $state();
    shareHeadings({
        store: headings,
        id: () => instance.id,
        headings: () => drawn,
        box: () => box
    });

    // The bar's actions go up to the pane while the tab is mounted and one of them applies
    // (ui/tabs/tab-actions.svelte.ts).
    handUp(
        useTabActions(),
        () => instance.id,
        barActions,
        () => named
    );
</script>

<!-- The file's actions, handed up to the right end of the pane's breadcrumb bar. -->
{#snippet barActions()}
    <FileBarActions {root} {path} onDisk={named}>
        {#snippet tail()}
            {#if named}
                <ToolButton
                    bare
                    label={t('doc.markdown_source')}
                    title={t('doc.markdown_source_title', path)}
                    glyph={t('doc.markdown_source_glyph')}
                    onclick={openSource}
                />
            {/if}
        {/snippet}
    </FileBarActions>
{/snippet}

<Pane {title} titled={false}>
    <div
        class="view"
        class:noted={named && file.truncated}
        data-instance={instance.id}
        data-root={root}
        data-path={path}
        bind:this={box}
    >
        {#if !named}
            <Empty message={t('doc.markdown_none')} glyph={t('doc.markdown_none_glyph')} />
        {:else}
            {#if file.truncated}
                <p class="cut" data-markdown-truncated={path}>
                    <Glyph name={t('source.locked_glyph')} />
                    {t('source.truncated')}
                </p>
            {/if}
            <RenderedMarkdown
                {path}
                text={file.text}
                loading={file.loading}
                error={file.error}
                framed={false}
                tabFocus
                onheadings={(list: readonly RenderedHeading[]) => (drawn = list)}
            />
        {/if}
    </div>
</Pane>

<style>
    .view {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    /* A cut file is two rows: the line takes what it needs, the text the rest. */
    .view.noted {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
    }

    .cut {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
