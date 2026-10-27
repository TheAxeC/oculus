<script lang="ts">
    // Layer 3, view partial. The line counts of oculus's own files on the Status view: one row per
    // folder with its languages under it, indented and muted, one row labelled src/ directly above
    // the first folder under src that sums every file under src/ at every depth, and the total last
    // in bold, each with its files, blank, comment, code and TODO lines and their sum. The src/ row
    // is not added into the total, which is the server's. The count is the lines store's, which
    // asks the server the first time this reads it; Count again asks it once more.
    //
    // The table is the ui/ primitive with a cell snippet, since a row's kind (a folder, a language
    // inside one, the total) is what decides how its cells are drawn. It sits in a box of its own
    // that scrolls sideways, so a narrow pane scrolls the table rather than the view past its edge.
    //
    // The block is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), folded under the key `lines` in the tab's state
    // (views/shared/card/pane-fold.ts).

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { Column } from '$lib/ui/display/table/table-rows';
    import {
        isUnderSource,
        SOURCE_FOLDER,
        underSource,
        type LineCount,
        type LineTally
    } from '$lib/state/system/lines.svelte';
    import { grouped, stamp } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';

    const {
        lines: { lines, recount }
    } = useState();

    /** Whether the block is open, kept in the tab's state. */
    const fold = usePaneFold();

    const held = $derived(lines());

    /** The numeric columns, in the order they are drawn after the folder. */
    const SUMS = ['files', 'blank', 'comment', 'code', 'todo', 'lines'] as const;

    const columns: Column[] = [
        { key: 'name', label: t('status.lines_folder') },
        { key: 'files', label: t('status.lines_files'), numeric: true },
        { key: 'blank', label: t('status.lines_blank'), numeric: true },
        { key: 'comment', label: t('status.lines_comment'), numeric: true },
        { key: 'code', label: t('status.lines_code'), numeric: true },
        { key: 'todo', label: t('status.lines_todo'), numeric: true },
        { key: 'lines', label: t('status.lines_lines'), numeric: true }
    ];

    /** One drawn row: which kind of row it is, what its first cell names, and its sums. */
    function row(
        key: string,
        kind: string,
        name: string,
        sums: LineTally
    ): Record<string, unknown> {
        return { key, kind, name, ...sums, lines: sums.blank + sums.comment + sums.code };
    }

    /**
     * Every folder, each followed by its languages, the src/ row directly above the first folder
     * under src (none when no folder is), and the total last. Its key starts `sum:`, which no
     * folder, language or total key does.
     */
    function drawn(count: LineCount): Record<string, unknown>[] {
        const out: Record<string, unknown>[] = [];
        const source = underSource(count.rows);
        let sourceDrawn = false;
        for (const folder of count.rows) {
            if (source !== null && !sourceDrawn && isUnderSource(folder.folder)) {
                out.push(row(`sum:${SOURCE_FOLDER}/`, 'folder', `${SOURCE_FOLDER}/`, source));
                sourceDrawn = true;
            }
            const name = folder.folder === '' ? t('status.lines_top') : folder.folder;
            out.push(row(`folder:${folder.folder}`, 'folder', name, folder));
            for (const language of folder.languages) {
                const key = `language:${folder.folder}:${language.language}`;
                out.push(row(key, 'language', language.language, language));
            }
        }
        out.push(row('total', 'total', t('status.lines_total'), count.total));
        return out;
    }

    const rows = $derived(held.count === null ? [] : drawn(held.count));

    /** A numeric cell as the page writes counts, and the first cell as it is. */
    function text(value: unknown, key: string): string {
        if ((SUMS as readonly string[]).includes(key) && typeof value === 'number') {
            return grouped(value);
        }
        return typeof value === 'string' ? value : '';
    }

    function said(): string {
        if (held.loading) return t('status.lines_counting');
        if (held.error !== '') return t('status.lines_failed', held.error);
        if (held.count !== null) return t('status.lines_counted', stamp(held.count.counted));
        return '';
    }
</script>

<GroupHead
    data-lines
    label={t('status.lines_title')}
    open={fold.open('lines')}
    ontoggle={() => fold.toggle('lines')}
>
    <p class="help">{t('status.lines_help')}</p>
    <div class="controls">
        <span class="said" class:failed={held.error !== '' && !held.loading}>
            {said()}
        </span>
        {#if !held.loading}
            <ToolButton label={t('status.lines_recount')} onclick={recount} />
        {/if}
    </div>
    {#if held.count !== null}
        <div class="scroller">
            <Table {columns} {rows} rowKey="key">
                {#snippet cell(item: Record<string, unknown>, column: Column)}
                    <span
                        class={String(item.kind)}
                        class:indent={item.kind === 'language' && column.key === 'name'}
                    >
                        {text(item[column.key], column.key)}
                    </span>
                {/snippet}
            </Table>
        </div>
    {/if}
</GroupHead>

<style>
    .help {
        margin: 0 0 6px;
        color: var(--muted-txt, var(--muted));
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }

    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .said.failed {
        color: var(--c-red-txt);
    }

    /* The table scrolls inside this box, so a narrow pane scrolls the table and not itself. */
    .scroller {
        min-width: 0;
        max-width: 100%;
        overflow-x: auto;
    }

    .folder,
    .language,
    .total {
        white-space: nowrap;
    }

    .language {
        color: var(--muted-txt, var(--muted));
    }

    /* A language's name sits in from its folder's, so the rows under a folder read as its own. */
    .indent {
        display: inline-block;
        padding-left: 16px;
    }

    .total {
        font-weight: 700;
    }
</style>
