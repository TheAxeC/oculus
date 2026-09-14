<script lang="ts">
    // Layer 3, shared view. Project document and file rows live here because file browsing changes
    // independently of the project-card frame.

    import Empty from '$lib/ui/Empty.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Search from '$lib/ui/Search.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { humanSize, type BoardItem } from '$lib/state/board';
    import { files } from '$lib/state/files.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';
    import { matching, nameOf, openDocument, subOf, urlOf } from './card';

    type Props = {
        /** The joined board item whose documents and files are listed. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    /** Extensions the document view can render as text. */
    const READABLE = /\.(html?|md|txt|ya?ml|py|sh|slurm|tex|bib|json|csv|r|m|cpp|h|ts|js|css)$/i;
    /** The current file-name or path filter. */
    let filter = $state('');
    /** The file listing and its loading state for this project. */
    const held = $derived(files(item.id));
    const rows = $derived(matching(held.rows, filter));

    /** Open a readable row from the file listing. */
    function openFile(path: string): void {
        openView('document', 'main', {
            root: 'hub',
            path: `${held.folder}/${path}`,
            label: nameOf(path)
        });
    }

    /** Explain a document's human-only or public marker when it has one. */
    function docTip(doc: { human: boolean; public: boolean }): string | undefined {
        if (doc.human) return t('project.helper.doc_human_tip');
        if (doc.public) return t('project.helper.doc_public_tip');
        return undefined;
    }
</script>

{#if item.project.docs.length > 0}
    <div class="field">
        <span class="label">{t('project.card.documents')}</span>
        <div class="docs">
            {#each item.project.docs as doc (doc.name)}
                {#if doc.present}
                    <span class="doc" class:human={doc.human} class:public={doc.public}>
                        <ToolButton
                            label={doc.label}
                            title={docTip(doc)}
                            onclick={() => openDocument(item.project.folder, doc.name)}
                        />
                    </span>
                {:else}
                    <Chip label={doc.label} />
                {/if}
            {/each}
        </div>
    </div>
{/if}

<div class="field">
    <span class="label">{t('project.card.files_hdr', held.rows.length)}</span>
    {#if held.loading}
        <Empty message={t('project.card.files_loading')} />
    {:else if held.error !== ''}
        <Empty message={t('project.card.files_error', held.error)} glyph={t('board.warn_glyph')} />
    {:else if rows.length === 0 && filter === ''}
        <Empty message={t('project.card.files_none')} />
    {:else}
        <Search
            value={filter}
            placeholder={t('project.card.files_ph')}
            oninput={(value) => (filter = value)}
        />
        {#if held.truncated}
            <p class="capped">{t('project.card.files_capped', held.rows.length)}</p>
        {/if}
        <div class="files">
            {#each rows as row (row.path)}
                <div class="frow">
                    {#if READABLE.test(row.path)}
                        <button type="button" class="fname" onclick={() => openFile(row.path)}>
                            {nameOf(row.path)}
                        </button>
                    {:else}
                        <a
                            class="fname"
                            href={urlOf(held.folder, row.path)}
                            target="_blank"
                            rel="noopener"
                        >
                            {nameOf(row.path)}
                        </a>
                    {/if}
                    <span class="fsub">{subOf(row.path)}</span>
                    <span class="fsize">{humanSize(row.size)}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .field {
        margin-top: 6px;
    }

    .label {
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .docs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .doc.human :global(.tool) {
        border-color: var(--c-amber);
    }

    .doc.public :global(.tool) {
        border-color: var(--c-green);
    }

    .files {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 4px;
        max-height: 220px;
        overflow: auto;
    }

    .frow {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: var(--fs-md);
    }

    .fname {
        border: none;
        background: none;
        color: var(--accent-txt, var(--accent));
        font: inherit;
        padding: 0;
        cursor: pointer;
        text-align: left;
        text-decoration: none;
    }

    .fname:hover {
        text-decoration: underline;
    }

    .fsub {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-mono);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .fsize {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    .capped {
        margin: 4px 0 0;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
