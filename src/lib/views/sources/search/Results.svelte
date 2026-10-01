<script lang="ts">
    // Layer 3, partial of views/sources/search/Search.svelte. What a run answered: the count line,
    // and the hits under one heading per file.
    //
    // A heading opens its file at its first hit and a row opens it at its own line, so the list is
    // the way into the file rather than a report about it. The match is emboldened from the hit's
    // own column and length: the page never matches the pattern a second time, which is the only
    // way a regular-expression hit could be marked at all.
    //
    // A heading and a hit are each one line of the tree's row height with the words at the
    // workbench size; a failed run is the message box with a control that runs the same query
    // again.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { firstLine, hitParts } from '$lib/state/sources/search';
    import { t } from '$lib/state/shared/words/text';
    import type { SearchAnswer, SearchFile, SearchHit } from '$lib/state/sources/search';

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
        /** Run the same query again, which is what the failed run's message box offers. */
        onretry: () => void;
    };

    let { answer, running, error, all, max, onopen, onretry }: Props = $props();

    const files = $derived(answer?.files ?? []);

    function heading(file: SearchFile): string {
        return all ? t('search.file_in_root', file.path, file.root) : file.path;
    }

    function hitTitle(file: SearchFile, hit: SearchHit): string {
        return t('search.hit_title', file.path, String(hit.line));
    }
</script>

{#snippet again()}
    <ToolButton small label={t('search.retry')} onclick={onretry} />
{/snippet}

{#if running}
    <Empty message={t('search.running')} glyph={t('search.empty_glyph')} />
{:else if error !== ''}
    <Empty error message={error} action={again} />
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
                <div class="row head">
                    <ToolButton
                        cell
                        label={heading(file)}
                        title={t('search.file_title', file.path)}
                        onclick={() => onopen(file, firstLine(file))}
                    >
                        <span class="line-box">
                            <Glyph name={t('search.file_glyph')} />
                            <span class="path">{heading(file)}</span>
                        </span>
                    </ToolButton>
                </div>
                <ul class="hits">
                    {#each file.hits as hit (`${hit.line}:${hit.column}`)}
                        <li class="row hit" data-search-hit={`${file.path}:${hit.line}`}>
                            <ToolButton
                                cell
                                label={hitTitle(file, hit)}
                                title={hitTitle(file, hit)}
                                onclick={() => onopen(file, hit.line)}
                            >
                                <span class="line-box">
                                    <span class="line">{hit.line}</span>
                                    <span class="text">
                                        {hitParts(hit).before}<strong class="match"
                                            >{hitParts(hit).match}</strong
                                        >{hitParts(hit).after}
                                    </span>
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
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    /* Hits sit under their file by the width of its icon. */
    .hits {
        padding-left: calc(var(--icon-box) * var(--text-scale, 1));
    }

    /* One line of the tree's row height; the button inside is the whole row. */
    .row {
        display: flex;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
        border-radius: var(--radius-sm);
        font-size: var(--fs-md);
    }

    .row:hover {
        background: var(--chip);
    }

    .line-box {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        height: 100%;
        min-width: 0;
        padding: 0 4px;
        text-align: left;
    }

    .path {
        min-width: 0;
        overflow: hidden;
        color: var(--ink-txt, var(--ink));
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .line {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    .text {
        min-width: 0;
        overflow: hidden;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        white-space: pre;
        text-overflow: ellipsis;
    }

    .match {
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }
</style>
