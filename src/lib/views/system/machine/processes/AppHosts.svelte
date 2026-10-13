<script lang="ts">
    // Layer 3, view partial. The programs the apps run: one row per app host with the app's title
    // (and its root key for a root app), the pid and start time of a running program, its state,
    // and under it the output it wrote to its standard error. Stop ends a running program behind a
    // question that names the app; Restart starts an ended program again; Approve, on a program
    // that waits for its changed files to be approved, shows the approval panel and approves
    // nothing itself. The rows are the `app-hosts` channel's; they carry the size of the output
    // and no text, so an open output is read from the server when it opens and again each time the
    // size in its row changes.
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import type { AppHostRow } from '$lib/state/system/apps/apps.svelte';
    import { createOutputReader } from '$lib/state/system/apps/manage';

    type Props = {
        rows: AppHostRow[];
        onstop: (row: AppHostRow) => void;
        onrestart: (row: AppHostRow) => void;
        onapprove: (row: AppHostRow) => void;
        /** The kept lines of an app's host output, or null when the server did not answer. */
        onoutput: (app: string) => Promise<string[] | null>;
    };
    let { rows, onstop, onrestart, onapprove, onoutput }: Props = $props();

    /** The apps whose output is open. */
    let shown: string[] = $state([]);
    /** The lines last read of each open output. */
    let lines: Record<string, string[]> = $state({});
    const reader = createOutputReader(
        (app) => onoutput(app),
        (app, read) => {
            lines[app] = read;
        }
    );

    function toggle(row: AppHostRow): void {
        if (shown.includes(row.app)) {
            shown = shown.filter((one) => one !== row.app);
            reader.close(row.app);
        } else {
            shown = [...shown, row.app];
            reader.open(row);
        }
    }

    $effect(() => reader.update(rows));

    const nameOf = (row: AppHostRow): string =>
        row.root === ''
            ? t('processes.host_app', row.title)
            : t('processes.host_app_root', row.title, row.root);

    /** The words of where a program stands. */
    function stateOf(row: AppHostRow): string {
        if (row.state === 'running') return t('processes.host_running');
        if (row.state === 'starting') return t('processes.host_starting');
        if (row.state === 'ended') {
            return row.code === null
                ? t('processes.host_ended_signal', row.signal)
                : t('processes.host_ended_code', row.code.toString());
        }
        if (row.stoppedBy !== '') return t('processes.host_stopped_by', row.stoppedBy);
        if (row.waiting === 'approval') return t('processes.host_wait_approval');
        if (row.waiting === 'cycle') return t('processes.host_wait_cycle');
        if (row.waiting === 'missing') return t('processes.host_wait_missing', row.dependency);
        return t('processes.host_wait_dependency', row.dependency);
    }
</script>

<section class="hosts" data-app-hosts>
    <h3>{t('processes.hosts_title')}</h3>
    {#each rows as row (row.app)}
        <div class="host" data-host={row.app}>
            <div class="line">
                <span class="name">{nameOf(row)}</span>
                {#if row.pid > 0}
                    <span class="meta">{t('processes.host_pid', row.pid.toString())}</span>
                    <span class="meta">{t('processes.host_started', stamp(row.started))}</span>
                {/if}
                <span class="state">{stateOf(row)}</span>
                <span class="actions">
                    {#if row.state === 'running' || row.state === 'starting'}
                        <ToolButton small label={t('processes.stop')} onclick={() => onstop(row)} />
                    {/if}
                    {#if row.state === 'ended'}
                        <ToolButton
                            small
                            label={t('processes.host_restart')}
                            onclick={() => onrestart(row)}
                        />
                    {/if}
                    {#if row.state === 'waiting' && row.waiting === 'approval'}
                        <ToolButton
                            small
                            label={t('processes.host_approve')}
                            onclick={() => onapprove(row)}
                        />
                    {/if}
                    <ToolButton
                        small
                        label={shown.includes(row.app)
                            ? t('processes.host_output_hide')
                            : t('processes.host_output_show')}
                        onclick={() => toggle(row)}
                    />
                </span>
            </div>
            {#if shown.includes(row.app)}
                {#if (lines[row.app] ?? []).length === 0}
                    <p class="empty">{t('processes.host_output_empty')}</p>
                {:else}
                    <pre class="output">{(lines[row.app] ?? []).join('\n')}</pre>
                {/if}
            {/if}
        </div>
    {/each}
</section>

<style>
    .hosts {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    h3 {
        margin: 0;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }

    .name {
        font-weight: 600;
    }

    .meta,
    .state {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .actions {
        display: inline-flex;
        gap: 4px;
        margin-left: auto;
    }

    .output {
        margin: 4px 0 0;
        max-height: 240px;
        overflow: auto;
        font-family: var(--font-mono, monospace);
        font-size: var(--fs-sm);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    .empty {
        margin: 4px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
