<script lang="ts">
    // Layer 3, view partial of views/boards/entry/Entry.svelte. What an entry's folder holds, for
    // an entry whose `link` names a folder of the hub: the Markdown documents of the folder, one at
    // a time, then the folder's files, then the sessions working in the folder. The documents are
    // fetched, not selected: state/system/docs.svelte.ts asks api/docs for the chosen one and the
    // shared Markdown partial draws what comes back, as the project view draws its own. The files
    // are views/shared/links/FolderFiles.svelte, the block the person view draws for a student's
    // folder, and each session is views/shared/sessions/SessionRow.svelte, the row the project view
    // draws. The chosen document is kept in the view instance's state, every other key of it kept.
    //
    // Documents, Files and Sessions are each drawn under a small label
    // (views/shared/card/record/RecordField.svelte), the folder's controls beside the Files label,
    // and none folds. Over a wallpaper each block is read off a `Surface`, so a document's code
    // blocks paint no surface of their own on it.

    import type { Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import type { SegmentItem } from '$lib/ui/controls/segment/segment-items';
    import FolderFiles from '../../shared/links/FolderFiles.svelte';
    import RecordField from '../../shared/card/record/RecordField.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import SessionRow from '../../shared/sessions/SessionRow.svelte';
    import { absoluteOf } from '$lib/state/workbench/navigation/pages';
    import { instanceChoice, withInstanceKey } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { hubDocument },
        fs: { listing, roots },
        selectors: { sessionsForProject },
        ui: { instanceState, setInstanceState }
    } = useState();

    type Props = {
        /** The view instance the chosen document is kept in. */
        instance: string;
        /** The key of the hub the folder is in. */
        hub: string;
        /** The folder the entry's link names; undefined while the listing of its parent is read. */
        folder: string | undefined;
        /** Whether the folder's listing is being fetched. */
        reading: boolean;
    };

    let { instance, hub, folder, reading }: Props = $props();

    const files = $derived(folder === undefined ? null : listing(hub, folder));
    const names = $derived(
        (files?.entries ?? [])
            .filter((one) => one.kind === 'file' && /\.md$/i.test(one.name))
            .map((one) => one.name)
    );
    const chosen = $derived(instanceChoice(instanceState(instance), 'doc', names));
    const shown = $derived(
        folder === undefined || chosen === '' ? null : hubDocument(`${folder}/${chosen}`, hub)
    );
    const documents: SegmentItem[] = $derived(names.map((name) => ({ id: name, label: name })));

    const hubDir = $derived(roots().find((one) => one.key === hub)?.dir ?? '');
    const rows = $derived(
        folder === undefined || hubDir === '' ? [] : sessionsForProject(absoluteOf(hubDir, folder))
    );

    /** Read once, so the stamps of one rendering all agree on what day it is. */
    const now = Date.now();

    /** Choose a document, keeping the rest of the instance's state. */
    function choose(name: string): void {
        setInstanceState(instance, withInstanceKey(instanceState(instance), 'doc', name));
    }
</script>

{#if reading}
    <Surface>
        <Empty message={t('entry.reading')} glyph={t('entry.none_glyph')} />
    </Surface>
{:else if folder === undefined}
    <Surface>
        <Empty message={t('entry.no_folder')} glyph={t('entry.none_glyph')} />
    </Surface>
{:else}
    <Surface>
        <RecordField data-block="documents" label={t('entry.documents')}>
            {#if shown === null}
                <Empty
                    message={files?.loading === true ? t('entry.reading') : t('entry.no_documents')}
                    glyph={t('entry.none_glyph')}
                />
            {:else}
                <Segment
                    label={t('entry.documents')}
                    items={documents}
                    value={chosen}
                    onchange={(name: string) => choose(name)}
                />
                <Markdown
                    doc={shown}
                    loading={t('entry.doc_loading')}
                    failed={t('entry.doc_failed', shown.error)}
                />
            {/if}
        </RecordField>
    </Surface>

    <FolderFiles {folder} root={hub}>
        {#snippet heading(controls: Snippet, body: Snippet)}
            <Surface>
                <RecordField data-block="files" label={t('entry.files', folder)} actions={controls}>
                    {@render body()}
                </RecordField>
            </Surface>
        {/snippet}
    </FolderFiles>

    <Surface>
        <RecordField data-block="sessions" label={t('entry.sessions')}>
            {#if rows.length === 0}
                <Empty message={t('entry.no_sessions')} glyph={t('entry.none_glyph')} />
            {:else}
                {#each rows as row (row.id)}
                    <SessionRow entry={row} {now} />
                {/each}
            {/if}
        </RecordField>
    </Surface>
{/if}
