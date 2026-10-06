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
    // The files of the project are the Files view's tree rooted at the project's folder
    // (shared/explorer/ProjectTree.svelte), under a finder box. While the box holds text the
    // matching files of the whole project are listed flat, most recent first, with their sizes, and
    // the project's file listing is asked for only then. The text lives in the card's tree record
    // (state/sources/explorer/view/card-tree.ts), so a card keeps what was typed across a tab
    // switch.
    //
    // The list of the project's documents is left out where the view drawing the card draws the
    // documents itself (views/boards/project/Project.svelte), so a reader meets one Documents
    // heading.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ProjectTree from '../explorer/ProjectTree.svelte';
    import { openPage } from '../explorer/opening';
    import { humanSize, type BoardItem } from '$lib/state/boards/board';
    import {
        cardTreeKey,
        filesViewOf,
        opensInProgram,
        patchedFilesView
    } from '$lib/state/sources/fs';
    import { matchingFiles } from '$lib/state/sources/files.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { nameOf, openDocument, subOf, urlOf } from './card';
    import ProgramButton from '../links/ProgramButton.svelte';
    import { useState } from '$lib/state/client/use';
    import { useInstance } from '$lib/state/client/instance-context';

    const client = useState();

    const {
        files: { files },
        selectors: { programApps },
        ui: { instanceState, setInstanceState }
    } = client;
    const instance = useInstance();

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
    /** The key of the record this card keeps its tree and its finder text under. */
    const owner = $derived(cardTreeKey(instance?.() ?? '', item.id));
    /** The current file-name or path filter. */
    const filter = $derived(filesViewOf(instanceState(owner)).filter);
    /** Whether the finder box holds text, which is when the flat list replaces the tree. */
    const finding = $derived(filter.trim() !== '');
    /** The file listing and its loading state for this project, asked for only while finding. */
    const held = $derived(finding ? files(item.id) : null);
    const rows = $derived(held === null ? [] : matchingFiles(held.rows, filter));

    /** Keep the finder text in the card's record, leaving the rest of the record as it is. */
    function find(value: string): void {
        setInstanceState(owner, patchedFilesView(instanceState(owner), { filter: value }));
    }

    /** Open a readable row from the file listing. */
    function openReadable(path: string): void {
        openPage(client, {
            root: 'hub',
            path: `${held?.folder ?? ''}/${path}`,
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
    <span class="label">
        {finding && held !== null
            ? t('project.card.files_hdr', held.rows.length)
            : t('project.card.files_title')}
    </span>
    <Search value={filter} placeholder={t('project.card.files_ph')} oninput={find} />
    {#if held === null}
        <ProjectTree {item} {owner} />
    {:else if held.loading}
        <Empty message={t('project.card.files_loading')} />
    {:else if held.error !== ''}
        <Empty
            error
            message={t('project.card.files_error', held.error)}
            glyph={t('board.warn_glyph')}
        />
    {:else if held.rows.length === 0}
        <Empty message={t('project.card.files_none')} />
    {:else}
        {#if held.truncated}
            <p class="capped">{t('project.card.files_capped', held.rows.length)}</p>
        {/if}
        <div class="files">
            {#each rows as row (row.path)}
                <div class="frow">
                    {#if READABLE.test(row.path)}
                        <ToolButton
                            small
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
        font-size: var(--fs-xs);
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

    /* A file is one row of the tree's height, its name in the main size and its folder and size
       beside it in the secondary one. */
    .frow {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    .fname {
        color: var(--accent-txt, var(--accent));
    }

    .fsub {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .fsize {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        white-space: nowrap;
    }

    .capped {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
