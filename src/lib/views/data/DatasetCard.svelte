<script lang="ts">
    // Layer 3, Data view partial. One dataset card, its registry metadata, recovery, project users
    // and edit form. The server supplies the recovery command and working directory.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Tooltip from '$lib/ui/Tooltip.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import CrossLinks from '$lib/views/shared/CrossLinks.svelte';
    import { accessTone, type Dataset } from '$lib/state/datasets';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, Project, SchemaField } from '$lib/state/collection';
    import { findView } from '$lib/state/layout';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const {
        layout: { layout, openView },
        selection: { select },
        terminals: { recoverDataset }
    } = useState();

    type Props = {
        dataset: Dataset;
        /** Whether keyboard navigation has selected this dataset. */
        cursor: boolean;
        projects: Project[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        editing: boolean;
        onedit: () => void;
        onsaid: (said: string) => void;
    };

    let { dataset, cursor, projects, entry, schema, editing, onedit, onsaid }: Props = $props();
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
        return findView(layout(), 'terminal', null) !== null;
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
        if (!terminalOpen()) openView('terminal');
    }
</script>

<div class="slot" data-dataset={dataset.id}>
    <Card
        id={dataset.id}
        {cursor}
        title={dataset.name === '' ? dataset.id : dataset.name}
        titleHtml={inlineMarkdown(dataset.name === '' ? dataset.id : dataset.name)}
    >
        {#snippet meta()}
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
                label={t('data.recover')}
                title={t('data.recover_tip')}
                glyph="refresh"
                active={recovering}
                disabled={recovering}
                onclick={recover}
            />
        {/snippet}

        {#if dataset.description}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="description">{@html inlineMarkdown(dataset.description)}</p>
        {/if}

        <!-- eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string must not count as a value here, which ?? would make it -->
        {#if dataset.size || dataset.hpcPath || method}
            <div class="meta">
                {#if dataset.size}
                    {@const words = `${t('data.size')} ${dataset.size}`}
                    <Tooltip text={words}>
                        <Chip label={words} />
                    </Tooltip>
                {/if}
                {#if dataset.hpcPath}
                    {@const words = `${t('data.hpc')} ${dataset.hpcPath}`}
                    <Tooltip text={words}>
                        <Chip label={words} />
                    </Tooltip>
                {/if}
                {#if method}
                    {@const words = `${t('data.fetch')} ${method}`}
                    <Tooltip text={words}>
                        <Chip label={words} />
                    </Tooltip>
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
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
                <span>{@html inlineMarkdown(notes)}</span>
            </div>
        {/if}

        {#if projects.length > 0}
            <CrossLinks {projects} />
        {/if}

        {#if dataset.source}
            <div class="links">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                <a href={dataset.source} target="_blank" rel="noopener">
                    <Glyph name="link" />
                    {t('data.source')}
                </a>
            </div>
        {/if}

        {#if editing && entry !== null}
            <EntryForm collection="data" {schema} {entry} onclose={onedit} {onsaid} />
        {/if}
    </Card>
</div>

<style>
    .meta,
    .tags,
    .note {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
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
        font-size: var(--fs-sm);
    }
</style>
