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

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { docState, followDoc, readDocs } from '$lib/state/workbench/navigation/catalogue';
    import { isInstanceOf, tabsOf } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { hubDocument },
        entities: { config },
        layout: { activateInstance, closeInstance, pages, restateInstance }
    } = useState();

    let { instance }: ViewProps = $props();

    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));
    const pushed = $derived(config());
    const followed = $derived(
        pushed === null || path === '' ? null : followDoc(readDocs(pushed.config.docs), path, label)
    );
    /** The path read: the entry's, or the tab's own while the list is unknown. */
    const reading = $derived(followed === null ? path : (followed.entry?.path ?? ''));
    const title = $derived(followed?.entry?.label ?? (label === '' ? t('views.doc') : label));
    const shown = $derived(reading === '' ? null : hubDocument(reading));

    $effect(() => {
        const entry = followed?.entry;
        if (followed?.moved !== true || entry === undefined || entry === null) return;
        const open = openElsewhere(entry.path);
        if (open === null) {
            restateInstance(instance.id, { ...held(instance.state), ...docState(entry) });
            return;
        }
        // Another tab already shows the entry, so this one goes rather than becoming a second
        // instance of the same path, which a press in the catalogue could never reach.
        activateInstance(open);
        closeInstance(instance.id);
    });

    /** The id of another document tab on any page already open at a path, or null for none. */
    function openElsewhere(at: string): string | null {
        for (const page of pages()) {
            for (const tab of tabsOf(page.workbench.root)) {
                if (tab.id !== instance.id && isInstanceOf(tab, 'doc', at)) return tab.id;
            }
        }
        return null;
    }

    function held(state: unknown): Record<string, unknown> {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return {};
        return state as Record<string, unknown>;
    }

    function read(state: unknown, key: string): string {
        const value = held(state)[key];
        return typeof value === 'string' ? value : '';
    }
</script>

<Pane {title} tinted>
    <div class="view" data-instance={instance.id} data-path={reading === '' ? path : reading}>
        {#if path === ''}
            <Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />
        {:else if shown === null}
            <Empty message={t('doc.unlisted', path)} glyph={t('doc.none_glyph')} />
        {:else}
            <Markdown
                doc={shown}
                loading={t('doc.loading')}
                failed={t('doc.failed', reading, shown.error)}
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
