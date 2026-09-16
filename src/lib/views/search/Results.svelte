<script lang="ts">
    // Layer 3, partial of views/Search.svelte. What a run answered: the count line, and the hits
    // under one heading per file.
    //
    // A heading opens its file at its first hit and a row opens it at its own line, so the list is
    // the way into the file rather than a report about it. The match is emboldened from the hit's
    // own column and length: the page never matches the pattern a second time, which is the only way
    // a regular-expression hit could be marked at all.

    import Empty from '$lib/ui/Empty.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { firstLine, hitParts } from '$lib/state/search';
    import { t } from '$lib/state/text';
    import type { SearchAnswer, SearchFile, SearchHit } from '$lib/state/search';

    type Props = {
        /** The last answer, and null for a tab that has not run one. */
        answer: SearchAnswer | null;
        running: boolean;
        /** What the last run failed with, or the empty string. */
        error: string;
        /** Whether the run was over every root, which is when a heading names the root it found. */
        all: boolean;
        /** The cap the run was given, which is the number the cap word says. */
        max: number;
        onopen: (file: SearchFile, line: number) => void;
    };

    let { answer, running, error, all, max, onopen }: Props = $props();

    const files = $derived(answer?.files ?? []);

    function heading(file: SearchFile): string {
        return all ? t('search.file_in_root', file.path, file.root) : file.path;
    }

    function hitTitle(file: SearchFile, hit: SearchHit): string {
        return t('search.hit_title', file.path, String(hit.line));
    }
</script>

{#if running}
    <Empty message={t('search.running')} glyph={t('search.empty_glyph')} />
{:else if error !== ''}
    <Empty message={error} glyph="warn" />
{:else if answer === null}
    <Empty message={t('search.empty')} glyph={t('search.empty_glyph')} />
{:else if files.length === 0}
    <Empty message={t('search.none')} glyph={t('search.empty_glyph')} />
{:else}
    <p class="count" data-search-count>
        {t('search.count', String(answer.total), String(files.length), String(answer.ms))}
        {#if answer.truncated}
            <span class="capped">{t('search.capped', String(max))}</span>
        {/if}
    </p>
    {#if answer.failed.length > 0}
        <p class="count" data-search-failed>
            {t('search.failed_roots', answer.failed.map((one) => one.root).join(', '))}
        </p>
    {/if}
    <ul class="files">
        {#each files as file (`${file.root}:${file.path}`)}
            <li class="file" data-search-file={`${file.root}:${file.path}`}>
                <ToolButton
                    label={heading(file)}
                    glyph={t('search.file_glyph')}
                    title={t('search.file_title', file.path)}
                    onclick={() => onopen(file, firstLine(file))}
                />
                <ul class="hits">
                    {#each file.hits as hit (`${hit.line}:${hit.column}`)}
                        <li class="hit" data-search-hit={`${file.path}:${hit.line}`}>
                            <ToolButton
                                label={hitTitle(file, hit)}
                                title={hitTitle(file, hit)}
                                onclick={() => onopen(file, hit.line)}
                            >
                                <span class="line">{hit.line}</span>
                                <span class="text">
                                    {hitParts(hit).before}<strong class="match"
                                        >{hitParts(hit).match}</strong
                                    >{hitParts(hit).after}
                                </span>
                            </ToolButton>
                        </li>
                    {/each}
                </ul>
            </li>
        {/each}
    </ul>
{/if}

<style>
    .count {
        margin: 0 0 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .capped {
        color: var(--c-amber-txt, var(--muted));
    }

    .files,
    .hits {
        display: flex;
        flex-direction: column;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .files {
        gap: 10px;
    }

    .hits {
        padding-left: 12px;
    }

    /* A results row reads as a line of the file it came from, so the primitive keeps the press and
       the focus ring and drops the box a control on a bar is drawn in. */
    .hit :global(.tool) {
        width: 100%;
        border-color: transparent;
        background: none;
        text-align: left;
    }

    .hit :global(.tool:hover) {
        border-color: var(--line);
    }

    .hit :global(.label) {
        display: flex;
        gap: 8px;
        min-width: 0;
    }

    .line {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .text {
        min-width: 0;
        overflow: hidden;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        white-space: pre;
        text-overflow: ellipsis;
    }

    .match {
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }
</style>
