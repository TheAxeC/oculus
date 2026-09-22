<script lang="ts">
    // Layer 3, shared view. Project document and file rows live here because file browsing changes
    // independently of the project-card frame.
    //
    // A file row is one of three things, decided by its name. A name READABLE matches (a Markdown
    // file, a script, a LaTeX source) opens in the document view. A name whose extension
    // `open.program_ext` of config/behavior.yml names an application for (a `.docx`, an `.xlsx`) is
    // `shared/links/ProgramButton.svelte`, which hands the file to that application, since a link
    // to it would only download it; a refused or failed open is said through the card's own message
    // line. Every other file is a link the browser opens or downloads.
    //
    // The list of the project's documents is left out where the view drawing the card draws the
    // documents itself (views/boards/project/Project.svelte), so a reader meets one Documents
    // heading.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Search from '$lib/ui/controls/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { humanSize, type BoardItem } from '$lib/state/boards/board';
    import { opensInProgram } from '$lib/state/sources/fs';
    import { t } from '$lib/state/words/text';
    import { matching, nameOf, openDocument, subOf, urlOf } from './card';
    import ProgramButton from '../links/ProgramButton.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        files: { files },
        layout: { openView },
        selectors: { programApps }
    } = client;

    type Props = {
        /** The joined board item whose documents and files are listed. */
        item: BoardItem;
        /** Show a refused or failed open in the owning board. */
        onsaid: (said: string) => void;
        /** Whether the project's documents are listed above its files. */
        documents: boolean;
    };
    let { item, onsaid, documents }: Props = $props();

    /** Extensions the document view can render as text. */
    const READABLE = /\.(html?|md|txt|ya?ml|py|sh|slurm|tex|bib|json|csv|r|m|cpp|h|ts|js|css)$/i;
    /** The current file-name or path filter. */
    let filter = $state('');
    /** The file listing and its loading state for this project. */
    const held = $derived(files(item.id));
    const rows = $derived(matching(held.rows, filter));

    /** Open a readable row from the file listing. */
    function openReadable(path: string): void {
        openView('document', {
            root: 'hub',
            path: `${held.folder}/${path}`,
            label: nameOf(path)
        });
    }

    /** Explain a document's human-only marker when it has one. */
    function docTip(doc: { human: boolean }): string | undefined {
        return doc.human ? t('project.helper.doc_human_tip') : undefined;
    }
</script>

{#if documents && item.project.docs.length > 0}
    <div class="field">
        <span class="label">{t('project.card.documents')}</span>
        <div class="docs">
            {#each item.project.docs as doc (doc.name)}
                {#if doc.present}
                    <span class="doc" class:human={doc.human}>
                        <ToolButton
                            label={doc.label}
                            title={docTip(doc)}
                            onclick={() => openDocument(client, item.project.folder, doc.name)}
                        />
                    </span>
                {:else}
                    <Tag label={doc.label} />
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
            oninput={(value: string) => (filter = value)}
        />
        {#if held.truncated}
            <p class="capped">{t('project.card.files_capped', held.rows.length)}</p>
        {/if}
        <div class="files">
            {#each rows as row (row.path)}
                <div class="frow">
                    {#if READABLE.test(row.path)}
                        <ToolButton
                            label={nameOf(row.path)}
                            onclick={() => openReadable(row.path)}
                        />
                    {:else if opensInProgram(row.path, programApps())}
                        <ProgramButton
                            root="hub"
                            path={`${held.folder}/${row.path}`}
                            label={nameOf(row.path)}
                            {onsaid}
                        />
                    {:else}
                        <!-- eslint-disable svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                        <a
                            class="fname"
                            href={urlOf(held.folder, row.path)}
                            target="_blank"
                            rel="noopener"
                        >
                            {nameOf(row.path)}
                        </a>
                        <!-- eslint-enable svelte/no-navigation-without-resolve -->
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
        color: var(--accent-txt, var(--accent));
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
