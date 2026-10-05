<script module lang="ts">
    // Layer 3, view registration. A hub document opens from its group in the view catalogue and
    // is not listed as a view of its own.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'doc',
        label: 'views.doc',
        glyph: 'views.doc_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One Markdown document of the research hub as its own tab: the documents the
    // `docs:` list of config/layout.yml names, one instance per path and the entry's label on the
    // tab.
    //
    // The document is fetched rather than selected, as a project's README is: the wire model keeps
    // documents out of the snapshot, so state/system/docs.svelte.ts asks api/docs for this path and
    // the shared Markdown partial draws what comes back. A figure beside the document is addressed
    // under the hub root by the server, so it is drawn through the file route. The prose is drawn
    // straight into the box, so over a wallpaper the box asks for the tint and is the one surface
    // the document is read off.
    //
    // The tab holds the path it was opened with, and the list can move an entry to another path
    // while a saved layout still names the old one. The list is read from the config channel, as
    // the Views catalogue reads it. A tab whose path left it while one entry still carries its
    // label shows that entry and is restated to its path and id, so the saved layout holds the new
    // path from then on; when another tab already holds that path, this one is closed and that one
    // made the active tab of its page, so one path stays one tab. A tab matching no entry says
    // which path it asked for.
    // Before the config's first push the list is unknown and the tab's own path is read.
    //
    // The document is a file of the hub root, which the pane's breadcrumb reads it as and the tab's
    // right-click menu acts on (shell/panes/strip/tab-menu.ts): the bookmark and Open in Program
    // items. The star and, for a file whose extension `open.program_ext` maps, Open in Program also
    // stand at the right end of the pane's breadcrumb bar (shared/links/FileBarActions.svelte). The
    // tab hands nothing to the pane's strip. Its scroll box carries `data-tab-focus`, which is
    // where the keyboard goes when a double click keeps the tab (PaneBody.svelte). The headings the
    // server's answer carries are said to the Outline, and a press on an Outline row scrolls the
    // tab to that heading (shared/prose/rendered-headings.svelte.ts).

    import Empty from '$lib/ui/frame/Empty.svelte';
    import FileBarActions from '../../shared/links/FileBarActions.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import { servedFile } from '$lib/views/shared/links/file-bar';
    import { shareHeadings } from '../../shared/prose/rendered-headings.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { docState, followDoc, readDocs } from '$lib/state/workbench/navigation/catalogue';
    import { instanceMap, instanceText, isInstanceOf, tabsOf } from '$lib/state/workbench/layout';
    import { HUB_ROOT } from '$lib/state/sources/fs';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { hubDocument },
        entities: { config },
        fs: { roots },
        headings,
        layout: { activateInstance, closeInstance, hosts, restateInstance }
    } = useState();

    let { instance }: ViewProps = $props();

    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));
    const pushed = $derived(config());
    const followed = $derived(
        pushed === null || path === '' ? null : followDoc(readDocs(pushed.config.docs), path, label)
    );
    /** The path read: the entry's, or the tab's own while the list is unknown. */
    const reading = $derived(followed === null ? path : (followed.entry?.path ?? ''));
    const title = $derived(followed?.entry?.label ?? (label === '' ? t('views.doc') : label));
    const shown = $derived(reading === '' ? null : hubDocument(reading));

    let box: HTMLDivElement | undefined = $state();
    shareHeadings({
        store: headings,
        id: () => instance.id,
        headings: () =>
            shown === null || shown.loading || shown.error !== '' ? null : shown.headings,
        box: () => box
    });

    $effect(() => {
        const entry = followed?.entry;
        if (followed?.moved !== true || entry === undefined || entry === null) return;
        const open = openElsewhere(entry.path);
        if (open === null) {
            restateInstance(instance.id, { ...instanceMap(instance.state), ...docState(entry) });
            return;
        }
        // Another tab already shows the entry, so this one goes rather than becoming a second
        // instance of the same path, which a press in the catalogue could never reach.
        activateInstance(open);
        closeInstance(instance.id);
    });

    /**
     * The id of another document tab on any page or float already open at a path, or null for none.
     */
    function openElsewhere(at: string): string | null {
        for (const host of hosts()) {
            for (const tab of tabsOf(host.workbench.root)) {
                if (tab.id !== instance.id && isInstanceOf(tab, 'doc', at)) return tab.id;
            }
        }
        return null;
    }

    // The bar's actions go up to the pane while the tab is mounted and one of them applies
    // (ui/tabs/tab-actions.svelte.ts).
    handUp(
        useTabActions(),
        () => instance.id,
        barActions,
        () => servedFile(roots(), HUB_ROOT, reading, reading !== '')
    );
</script>

<!-- The file's actions, handed up to the right end of the pane's breadcrumb bar. -->
{#snippet barActions()}
    <FileBarActions root={HUB_ROOT} path={reading} onDisk={reading !== ''} />
{/snippet}

<Pane {title} tinted>
    <div
        class="view"
        data-instance={instance.id}
        data-path={reading === '' ? path : reading}
        data-tab-focus
        tabindex="-1"
        bind:this={box}
    >
        {#if path === ''}
            <Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />
        {:else if shown === null}
            <Empty message={t('doc.unlisted', path)} glyph={t('doc.none_glyph')} />
        {:else}
            <Markdown
                doc={shown}
                loading={t('doc.loading')}
                failed={t('doc.failed', reading, shown.error)}
                surface={false}
            />
        {/if}
    </div>
</Pane>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
    }

    /* The terminal shape: the whole tab follows the folder line, as the boards do. */
    :global(body.rice) .view {
        font-family: var(--font-mono);
    }
</style>
