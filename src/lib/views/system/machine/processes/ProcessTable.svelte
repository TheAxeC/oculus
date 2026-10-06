<script lang="ts">
    // Layer 3, view partial. The Processes table: one body per oculus terminal, the terminal's name
    // over its pane process (the group's row, with Stop), the terminal's other processes under it,
    // and then one body of the matched processes. A press on a column head sorts within each group
    // and within the matched rows, the groups keeping their place. The table primitive draws one
    // sorted body, so this draws its own bodies and takes its ordering from the primitive's
    // `order`.
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { order } from '$lib/ui/display/table-rows';
    import { humanSize } from '$lib/state/boards/board';
    import { stamp } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import type {
        Arranged,
        ProcessGroup,
        ProcessRow,
        ProcessesSort
    } from '$lib/state/system/machine/processes/processes';

    type Props = {
        arranged: Arranged;
        sort: ProcessesSort;
        onsort: (key: ProcessesSort['key']) => void;
        onstop: (group: ProcessGroup) => void;
    };
    let { arranged, sort, onsort, onstop }: Props = $props();

    const columns: { key: ProcessesSort['key']; label: string; numeric?: boolean }[] = [
        { key: 'pid', label: t('processes.col_pid'), numeric: true },
        { key: 'ppid', label: t('processes.col_parent'), numeric: true },
        { key: 'user', label: t('processes.col_user') },
        { key: 'started', label: t('processes.col_started') },
        { key: 'cpu', label: t('processes.col_cpu'), numeric: true },
        { key: 'memory', label: t('processes.col_memory'), numeric: true },
        { key: 'command', label: t('processes.col_command') },
        { key: 'folder', label: t('processes.col_folder') }
    ];

    /** The rows ordered by the sort in force. */
    function sorted(rows: ProcessRow[]): ProcessRow[] {
        return order(rows, sort) as ProcessRow[];
    }

    function ariaSort(key: string): 'ascending' | 'descending' | 'none' {
        if (sort.key !== key) return 'none';
        return sort.direction === 'asc' ? 'ascending' : 'descending';
    }
</script>

{#snippet line(row: ProcessRow, listed: boolean, group: ProcessGroup | null)}
    <tr class:head={group !== null} data-pid={row.pid}>
        <td class="numeric">{row.pid}</td>
        <td class="numeric">{listed && row.ppid > 0 ? row.ppid : ''}</td>
        <td>{row.user}</td>
        <td>{stamp(row.started)}</td>
        <td class="numeric">{listed ? `${row.cpu.toFixed(1)}%` : ''}</td>
        <td class="numeric">{listed && row.memory > 0 ? humanSize(row.memory) : ''}</td>
        <td class="wide"><span class="command" title={row.command}>{row.command}</span></td>
        <td class="wide"><span class="command" title={row.folder}>{row.folder}</span></td>
        <td class="actions">
            {#if group?.stoppable === true}
                <ToolButton small label={t('processes.stop')} onclick={() => onstop(group)} />
            {/if}
        </td>
    </tr>
{/snippet}

<table>
    <thead>
        <tr>
            {#each columns as column (column.key)}
                <th
                    scope="col"
                    class:numeric={column.numeric === true}
                    aria-sort={ariaSort(column.key)}
                >
                    <ToolButton plain label={column.label} onclick={() => onsort(column.key)} />
                </th>
            {/each}
            <th scope="col" aria-label={t('processes.stop')}></th>
        </tr>
    </thead>
    {#each arranged.groups as group (group.terminal)}
        <tbody data-terminal={group.terminal}>
            <tr class="name">
                <th scope="rowgroup" colspan="9">{group.name}</th>
            </tr>
            {#if group.head.pid > 0}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render line(group.head, group.listed, group)}
            {/if}
            {#each sorted(group.rows) as row (row.pid)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render line(row, true, null)}
            {/each}
        </tbody>
    {/each}
    {#if arranged.matched.length > 0}
        <tbody>
            {#each sorted(arranged.matched) as row (row.pid)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render line(row, true, null)}
            {/each}
        </tbody>
    {/if}
</table>

<style>
    table {
        width: 100%;
        border-collapse: collapse;
        color: var(--ink-txt, var(--ink));
    }

    /* The heading stays put while the body scrolls: the scroller is the view's. */
    thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--panel);
        border-bottom: 1px solid var(--line);
        padding: 3px 8px 2px;
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        text-align: left;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    :global(body.wall) thead th {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.rice) thead th {
        text-transform: none;
    }

    thead th:hover {
        color: var(--accent-txt, var(--accent));
    }

    td {
        padding: 3px 8px 2px;
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        border-bottom: 1px solid var(--line);
        vertical-align: top;
        white-space: nowrap;
    }

    :global(body.rice) td {
        border-bottom-style: dotted;
    }

    /* The terminal's name over its pane process. */
    .name th {
        padding: 6px 8px 2px;
        text-align: left;
        font-weight: 700;
    }

    .head td {
        font-weight: 700;
    }

    .numeric {
        text-align: right;
        font-family: var(--font-num);
        font-variant-numeric: tabular-nums;
    }

    /* A long command line or folder is cut with an ellipsis; its title holds it whole. */
    .wide {
        max-width: 28em;
    }

    .command {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .actions {
        text-align: right;
    }
</style>
