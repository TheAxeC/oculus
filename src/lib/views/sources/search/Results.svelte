<script lang="ts">
    // Layer 3, partial of views/sources/search/Search.svelte. What a run answered: the count line,
    // and the hits under one heading per file, drawn as the rows of one tree (ui/tree/TreeView),
    // so the arrow keys walk the rows and the keys of the Search keymap act on the row in focus.
    //
    // A heading opens its file at its first hit and a row opens it at its own line, or its Replace
    // Preview while the replace row is shown, so the list is the way into the file rather than a
    // report about it. The match is emboldened from the hit's own column and length: the page never
    // matches the pattern a second time, which is the only way a regular-expression hit could be
    // marked at all. While the replace row is shown the match is struck through and the text that
    // replaces it follows it, read from the groups the run reported, so it follows the replace text
    // as it is typed.
    //
    // A row's controls are drawn beside it: Replace and Dismiss on a hit, Replace All and Dismiss
    // on a heading, Replace and Replace All only while the replace row is shown and none while a
    // replace is in flight. A heading and a hit are each one line of the tree's row height with the
    // words at the workbench size; a failed run is the message box with a control that runs the
    // same query again.

    import { tick } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { Chord, TreeNav } from '$lib/ui/tree/tree-keys';
    import { firstLine, hitParts } from '$lib/state/sources/search/search';
    import {
        fileKey,
        hitKey,
        replacementShown,
        resultRows,
        type Chosen,
        type ReplaceSettings
    } from '$lib/state/sources/search/hits';
    import { countLine } from '$lib/state/sources/search/words';
    import { t } from '$lib/state/shared/words/text';
    import type { SearchAnswer, SearchFile, SearchHit } from '$lib/state/sources/search/search';

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
        /** Whether the replace row is shown. */
        replacing: boolean;
        /** Whether a replace is in flight, which is when Replace and Replace All wait. */
        busy: boolean;
        /**
         * What the last replace said, which takes the place of the count line until the next run
         * or edit of the query, or null for a tab whose count line is the count.
         */
        said: { text: string; refused: boolean } | null;
        /**
         * What the replace text and Preserve Case are, for the text a hit would be replaced with.
         */
        settings: ReplaceSettings;
        /** The keys of the rows and what each asks for. */
        keymap: readonly Chord[];
        /** A hit pressed: its Replace Preview while the replace row is shown, else its file. */
        onhit: (file: SearchFile, hit: SearchHit) => void;
        /** A heading pressed: its file at the first hit. */
        onfile: (file: SearchFile, line: number) => void;
        onreplace: (pick: Chosen) => void;
        ondismiss: (pick: Chosen) => void;
        /** A key of the keymap pressed on a row. */
        onkey: (action: string, id: string, event: KeyboardEvent) => boolean;
        /** Run the same query again, which is what the failed run's message box offers. */
        onretry: () => void;
    };

    let {
        answer,
        running,
        error,
        all,
        max,
        replacing,
        busy,
        said,
        settings,
        keymap,
        onhit,
        onfile,
        onreplace,
        ondismiss,
        onkey,
        onretry
    }: Props = $props();

    const files = $derived(answer?.files ?? []);
    const rows = $derived(resultRows(files));
    // The count the line says is the hits listed, which a dismiss or a replace takes down.
    const hitCount = $derived(files.reduce((sum, file) => sum + file.hits.length, 0));

    let host: HTMLElement | undefined = $state();

    /** Put the focus on a row once the rows drawn are the ones the last change left. */
    export async function focusRow(id: string): Promise<void> {
        await tick();
        const row = Array.from(host?.querySelectorAll<HTMLElement>('[data-value]') ?? []).find(
            (one) => one.dataset.value === id
        );
        row?.focus({ preventScroll: false });
    }

    function heading(file: SearchFile): string {
        return all ? t('search.file_in_root', file.path, file.root) : file.path;
    }

    function hitTitle(file: SearchFile, hit: SearchHit): string {
        return replacing
            ? t('search.preview_hit_title', file.path, String(hit.line))
            : t('search.hit_title', file.path, String(hit.line));
    }

    function hitLabel(file: SearchFile, hit: SearchHit): string {
        return `${file.path}:${String(hit.line)}`;
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
{:else if files.length === 0 && said === null}
    <Empty message={t('search.none')} glyph={t('search.empty_glyph')} />
{:else}
    {#if said !== null}
        <p
            class="count"
            class:refused={said.refused}
            role={said.refused ? 'alert' : 'status'}
            data-search-count
        >
            {said.text}
        </p>
    {:else}
        <p class="count" data-search-count>
            {countLine(hitCount, files.length, answer.ms, replacing)}
            {#if answer.truncated}
                <span class="capped">{t('search.capped', String(max))}</span>
            {/if}
        </p>
    {/if}
    {#each answer.failed as one (one.root)}
        <p class="count" data-search-failed>
            {one.why === 'timed-out'
                ? t('search.root_timed_out', one.root)
                : t('search.root_failed', one.root)}
        </p>
    {/each}
    <div class="results" bind:this={host}>
        <TreeView label={t('search.results')} {rows} {keymap} {onkey}>
            {#snippet children(nav: TreeNav)}
                <ul class="files" role="none">
                    {#each files as file (fileKey(file))}
                        <li class="file" role="none" data-search-file={`${file.root}:${file.path}`}>
                            <TreeItem
                                label={heading(file)}
                                id={fileKey(file)}
                                {nav}
                                level={1}
                                glyph={t('search.file_glyph')}
                                title={t('search.file_title', file.path)}
                                onclick={() => onfile(file, firstLine(file))}
                            >
                                {#snippet actions(reach: number)}
                                    {#if replacing}
                                        <ToolButton
                                            label={t('search.replace_all')}
                                            glyph={t('search.replace_all_glyph')}
                                            title={t('search.replace_file_title')}
                                            compact
                                            disabled={busy}
                                            tabindex={reach}
                                            onclick={() => onreplace({ kind: 'file', file })}
                                        />
                                    {/if}
                                    <ToolButton
                                        label={t('search.dismiss')}
                                        glyph={t('search.dismiss_glyph')}
                                        title={t('search.dismiss_file_title', file.path)}
                                        compact
                                        tabindex={reach}
                                        onclick={() => ondismiss({ kind: 'file', file })}
                                    />
                                {/snippet}
                            </TreeItem>
                            {#if file.rereadFailed === true}
                                <p class="count" data-search-reread-failed>
                                    {t('search.reread_failed')}
                                </p>
                            {/if}
                            <ul class="hits" role="none">
                                {#each file.hits as hit (hitKey(file, hit))}
                                    {@const parts = hitParts(hit)}
                                    {@const replacement = replacing
                                        ? replacementShown(hit, settings)
                                        : null}
                                    <li
                                        class="hit"
                                        role="none"
                                        data-search-hit={`${file.path}:${hit.line}`}
                                    >
                                        <TreeItem
                                            label={hitLabel(file, hit)}
                                            id={hitKey(file, hit)}
                                            {nav}
                                            level={2}
                                            depth={1}
                                            title={hitTitle(file, hit)}
                                            onclick={() => onhit(file, hit)}
                                        >
                                            {#snippet words()}
                                                <span class="line">{hit.line}</span>
                                                <span class="text"
                                                    >{parts.before}{#if replacing}<span
                                                            class="struck"
                                                            data-search-struck>{parts.match}</span
                                                        >{#if replacement !== null}<span
                                                                class="with"
                                                                data-search-with>{replacement}</span
                                                            >{/if}{:else}<strong class="match"
                                                            >{parts.match}</strong
                                                        >{/if}{parts.after}</span
                                                >
                                            {/snippet}
                                            {#snippet actions(reach: number)}
                                                {#if replacing}
                                                    <ToolButton
                                                        label={t('search.replace_hit')}
                                                        glyph={t('search.replace_glyph')}
                                                        title={t('search.replace_hit_title')}
                                                        compact
                                                        disabled={busy}
                                                        tabindex={reach}
                                                        onclick={() =>
                                                            onreplace({ kind: 'hit', file, hit })}
                                                    />
                                                {/if}
                                                <ToolButton
                                                    label={t('search.dismiss')}
                                                    glyph={t('search.dismiss_glyph')}
                                                    title={t('search.dismiss_hit_title')}
                                                    compact
                                                    tabindex={reach}
                                                    onclick={() =>
                                                        ondismiss({ kind: 'hit', file, hit })}
                                                />
                                            {/snippet}
                                        </TreeItem>
                                    </li>
                                {/each}
                            </ul>
                        </li>
                    {/each}
                </ul>
            {/snippet}
        </TreeView>
    </div>
{/if}

<style>
    .count {
        margin: 0 0 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .count.refused {
        color: var(--c-red-txt);
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

    .line {
        flex: 0 0 auto;
        margin-right: 6px;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    .text {
        min-width: 0;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        white-space: pre;
    }

    .match {
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }

    /* The match a replace would take out, then the text that replaces it. */
    .struck {
        color: var(--c-red-txt);
        text-decoration: line-through;
    }

    .with {
        color: var(--c-green-txt);
    }
</style>
