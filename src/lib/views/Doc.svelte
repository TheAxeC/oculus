<script module lang="ts">
    // Layer 3, view registration. A hub document opens from its group in the rail and is not listed.
    import type { ViewRegistration } from './registry';

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
    // documents out of the snapshot, so state/docs.svelte.ts asks api/docs for this path and the
    // shared Markdown partial draws what comes back. A figure beside the document is addressed under
    // the hub root by the server, so it is drawn through the file route.

    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Markdown from './shared/Markdown.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        docs: { hubDocument }
    } = useState();

    let { instance }: ViewProps = $props();

    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));
    const title = $derived(label === '' ? t('views.doc') : label);
    const shown = $derived(path === '' ? null : hubDocument(path));

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }
</script>

<Pane {title}>
    <div class="view" data-instance={instance.id} data-path={path}>
        {#if shown === null}
            <Empty message={t('doc.none')} glyph={t('doc.none_glyph')} />
        {:else}
            <Markdown
                doc={shown}
                loading={t('doc.loading')}
                failed={t('doc.failed', shown.error)}
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
