<script lang="ts">
    // Layer 3, Data view partial. One dataset card, its registry metadata, recovery, project users
    // and edit form. The server supplies the recovery command and working directory.

    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import { accessTone, type Dataset } from '$lib/state/datasets';
    import {
        inlineMarkdown,
        type Entry,
        type Project,
        type SchemaField
    } from '$lib/state/collection';
    import { findView } from '$lib/state/layout';
    import { openView, workbench } from '$lib/state/layout.svelte';
    import { select } from '$lib/state/selection.svelte';
    import { t } from '$lib/state/text';
    import { recoverDataset } from '$lib/state/terminals.svelte';

    type Props = {
        dataset: Dataset;
        projects: Project[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        editing: boolean;
        onedit: () => void;
        onsaid: (said: string) => void;
    };

    let { dataset, projects, entry, schema, editing, onedit, onsaid }: Props = $props();
    let recovering = $state(false);

    const method = $derived(
        typeof dataset.retrieval?.method === 'string' ? dataset.retrieval.method : undefined
    );
    const notes = $derived(
        typeof dataset.retrieval?.notes === 'string'
            ? dataset.retrieval.notes.replace(/\s+/g, ' ').trim()
            : ''
    );

    function terminalOpen(): boolean {
        return [workbench().main, workbench().panel].some(
            (tree) => findView(tree, 'terminal', null) !== null
        );
    }

    async function recover(): Promise<void> {
        recovering = true;
        const answer = await recoverDataset(dataset.id);
        recovering = false;
        if (!answer.ok) {
            onsaid(t('data.recover_failed', answer.error));
            return;
        }
        select(answer.id);
        if (!terminalOpen()) openView('terminal', 'main');
    }
</script>

<article class="card" data-dataset={dataset.id}>
    <div class="head">
        <h3>{@html inlineMarkdown(dataset.name === '' ? dataset.id : dataset.name)}</h3>
        {#if dataset.access}
            <Chip label={dataset.access} tone={accessTone(dataset.access)} />
        {/if}
        {#if entry !== null && schema !== undefined}
            <ToolButton
                label={t('collection.form_edit_title')}
                glyph={t('collection.edit_glyph')}
                compact
                active={editing}
                onclick={onedit}
            />
        {/if}
        <ToolButton
            label={t('col.ds_recover')}
            title={t('col.ds_recover_tip')}
            glyph="refresh"
            active={recovering}
            disabled={recovering}
            onclick={recover}
        />
    </div>

    {#if dataset.description}
        <p class="description">{@html inlineMarkdown(dataset.description)}</p>
    {/if}

    {#if dataset.size || dataset.hpcPath || method}
        <div class="meta">
            {#if dataset.size}
                <Chip label={`${t('col.ds_size')} ${dataset.size}`} />
            {/if}
            {#if dataset.hpcPath}
                <Chip label={`${t('col.ds_hpc')} ${dataset.hpcPath}`} />
            {/if}
            {#if method}
                <Chip label={`${t('col.ds_fetch')} ${method}`} />
            {/if}
        </div>
    {/if}

    {#if dataset.modality}
        <div class="tags">
            <Chip label={dataset.modality} />
        </div>
    {/if}

    {#if notes !== ''}
        <div class="note">
            <Glyph name="note_back" />
            <span>{@html inlineMarkdown(notes)}</span>
        </div>
    {/if}

    {#if projects.length > 0}
        <CrossLinks {projects} />
    {/if}

    {#if dataset.source}
        <div class="links">
            <a href={dataset.source} target="_blank" rel="noopener">
                <Glyph name="link" />
                {t('col.ds_source')}
            </a>
        </div>
    {/if}

    {#if editing && entry !== null}
        <EntryForm collection="data" {schema} {entry} onclose={onedit} {onsaid} />
    {/if}
</article>

<style>
    .card {
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    .head,
    .meta,
    .tags,
    .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    h3 {
        margin: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-lg);
    }

    .description,
    .meta,
    .tags,
    .note,
    .links {
        margin-top: 8px;
    }

    .description,
    .note {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .description {
        margin-bottom: 0;
    }

    .links a {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-md);
    }

    :global(body.rice) .card {
        border-radius: var(--radius-sm);
        box-shadow: none;
    }
</style>
