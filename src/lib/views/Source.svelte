<script module lang="ts">
    // Layer 3, view registration. A source file opens from another view and is not listed.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'source',
        label: 'views.source',
        glyph: 'views.source_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One configured local text file as a tab. It reads once through api/file, keeps
    // working and saved copies in its instance's ui state across tab switches, and writes through
    // api/source when its extension is editable.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Editor from './source/Editor.svelte';
    import { configMap } from '$lib/state/selectors.svelte';
    import {
        revertSourceDraft,
        editSourceDraft,
        loadSourceDraft,
        saveSourceDraft,
        sourceAccess,
        sourceDraft
    } from '$lib/state/source.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const root = $derived(read(instance.state, 'root'));
    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));
    const access = $derived(sourceAccess(path, configMap()));
    const title = $derived(label === '' ? t('views.source') : label);
    const draft = $derived(sourceDraft(instance.id));
    const blocked = $derived(root === '' || path === '' || access === 'blocked');
    const error = $derived(blocked ? t('source.cannot_open', path) : draft.error);

    $effect(() => {
        if (blocked) return;
        const id = instance.id;
        const fileRoot = root;
        const filePath = path;
        untrack(() => void loadSourceDraft(id, fileRoot, filePath));
    });

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }

    async function save(): Promise<void> {
        if (access !== 'editable') return;
        await saveSourceDraft(instance.id, root, path);
    }
</script>

<Pane {title}>
    <div class="source" data-instance={instance.id} data-root={root} data-path={path}>
        {#if error !== ''}
            <Empty message={error} glyph="warn" />
        {:else if !draft.loaded}
            <Empty message={t('app.waiting')} glyph="edit" />
        {:else}
            <Editor
                {path}
                text={draft.text}
                editable={access === 'editable'}
                message={draft.message}
                oninput={(value) => editSourceDraft(instance.id, value)}
                onsave={save}
                onrevert={() => revertSourceDraft(instance.id)}
            />
        {/if}
    </div>
</Pane>

<style>
    .source {
        height: 100%;
        min-height: 0;
    }
</style>
