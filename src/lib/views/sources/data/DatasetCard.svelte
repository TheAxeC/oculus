<script module lang="ts">
    import { z } from 'zod';
    import { optionalTextShape } from '$lib/data/shapes/shapes';

    /** How a dataset is retrieved: the method as text, and the notes with spaces collapsed. */
    const retrievalShape = z.object({
        method: optionalTextShape,
        notes: z
            .string()
            .transform((words) => words.replace(/\s+/g, ' ').trim())
            .catch('')
    });
</script>

<script lang="ts">
    // Layer 3, Data view partial. One dataset card, its registry metadata, recovery, project users,
    // Edit in File and Delete. The dataset's name opens its page. The server supplies the recovery
    // command and working directory.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import CardActions, { type CardAction } from '$lib/views/shared/card/CardActions.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import DeleteAsk from '$lib/views/shared/forms/entry/DeleteAsk.svelte';
    import { recordActions } from '$lib/views/shared/forms/entry/entry-actions';
    import { blockedBy } from '$lib/views/shared/forms/entry-file';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import { accessTone, type Dataset } from '$lib/state/sources/registries/datasets';
    import { inlineMarkdown } from '$lib/ui/html';
    import type { Entry, IdentityFault, Project, SchemaField } from '$lib/state/boards/collection';
    import { pageView } from '$lib/state/forms/page-entry';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { readOr } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { openView },
        selection: { select },
        source: { unsavedFile },
        terminals: { recoverDataset, showTerminal }
    } = client;

    type Props = {
        dataset: Dataset;
        /** Whether keyboard navigation has selected this dataset. */
        cursor: boolean;
        projects: Project[];
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        /** The registry file, which Edit in File opens; null when the configuration names none. */
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
    };

    let { dataset, cursor, projects, entry, schema, file, fault, onsaid }: Props = $props();
    let recovering = $state(false);

    /** True while the question before a delete is open. */
    let deleting = $state(false);

    /** Why the controls that write are disabled, '' when they are not. */
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    const retrieval = $derived(
        readOr(retrievalShape, dataset.retrieval, { method: undefined, notes: '' })
    );
    const method = $derived(retrieval.method);
    const notes = $derived(retrieval.notes);

    /**
     * The card's controls, drawn while the card is hovered or holds the focus: Edit in File for a
     * dataset the collection file holds, and the recovery, which is not offered again while one is
     * starting.
     */
    const actions = $derived.by((): CardAction[] => {
        const record: CardAction[] = recordActions(
            { client, file, entry, schema, fault, onsaid },
            blocked,
            () => {
                deleting = true;
            }
        );
        return record.concat({
            id: 'recover',
            label: t('data.recover'),
            title: t('data.recover_tip'),
            glyph: 'refresh',
            active: recovering,
            onclick: recover
        });
    });

    /** The dataset's page, opened from its heading. */
    function openPage(): void {
        if (entry === null) return;
        const page = pageView('data', entry.id, dataset.name === '' ? dataset.id : dataset.name);
        openView(page.view, page.state);
    }

    async function recover(): Promise<void> {
        if (recovering) return;
        recovering = true;
        const answer = await recoverDataset(dataset.id);
        recovering = false;
        if (!answer.ok) {
            onsaid(t('data.recover_failed', answer.error));
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
    }
</script>

<div class="slot" data-dataset={dataset.id}>
    <Card
        id={dataset.id}
        {cursor}
        title={dataset.name === '' ? dataset.id : dataset.name}
        titleHtml={inlineMarkdown(dataset.name === '' ? dataset.id : dataset.name)}
        ontitle={entry === null ? undefined : openPage}
    >
        {#snippet meta()}
            <RootChip record={dataset} />
            {#if dataset.access}
                <Tag label={dataset.access} tone={accessTone(dataset.access)} />
            {/if}
            <CardActions {actions} />
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
                        <Tag label={words} />
                    </Tooltip>
                {/if}
                {#if dataset.hpcPath}
                    {@const words = `${t('data.hpc')} ${dataset.hpcPath}`}
                    <Tooltip text={words}>
                        <Tag label={words} />
                    </Tooltip>
                {/if}
                {#if method}
                    {@const words = `${t('data.fetch')} ${method}`}
                    <Tooltip text={words}>
                        <Tag label={words} />
                    </Tooltip>
                {/if}
            </div>
        {/if}

        {#if dataset.modality}
            <div class="tags">
                <Tag label={dataset.modality} />
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
    </Card>
</div>

{#if deleting && entry !== null}
    <DeleteAsk collection="data" id={entry.id} {onsaid} onclose={() => (deleting = false)} />
{/if}

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
