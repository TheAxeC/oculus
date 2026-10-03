<script module lang="ts">
    // Layer 3, view registration. History follows the audit in the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'history',
        label: 'views.history',
        glyph: 'views.history_glyph',
        group: 'info',
        order: 3
    };
</script>

<script lang="ts">
    // Layer 3, view. Every write oculus made on this machine, newest first: when it was made, what
    // kind of write it was, which file it wrote, what it addressed, and the value that file held
    // before it against the value it holds after.
    //
    // The log is a machine-local file rather than anything in the snapshot, so the store fetches a
    // page at a time and "load older" asks for the page behind the oldest row on screen. The filter
    // is the pane's own and is held in its instance state, so a tab comes back filtered as it was.
    //
    // A file operation of the Files view is a row too: the operation, the path it was made on, the
    // paths it took and the paths it left, and its undo control. Its undo goes through the file
    // store, which restates the tabs and the bookmarks over a path that moves back.
    //
    // The undo control is offered on a row whose record says how to take it back. The server checks
    // that the file still holds what the write left before it writes the earlier value, so a field
    // edited since is refused rather than written over; the sentence for each refusal is this
    // view's and the wire word is never shown. A row whose undo was refused keeps its control
    // unpressable, since pressing it again would be refused for the same reason until the page is
    // read afresh. An answer that wrote no field is a refusal here too: the row says the value is
    // back only when the endpoint names the field it wrote.
    //
    // The filter is in the bar under the header, with the status sentence of the last press at the
    // bar's end. A row's undo control and the pills that open its values are drawn while the
    // pointer is over the row or the focus is inside it, and an opened pill stays drawn.

    import { SvelteSet } from 'svelte/reactivity';
    import Disclosure from '$lib/ui/tree/Disclosure.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import { t } from '$lib/state/shared/words/text';
    import { instanceText } from '$lib/state/workbench/layout';
    import { FILE_RECORD, fileOperation, shown, shownPaths, undoSaid } from './rows';
    import type { Shown } from './rows';
    import { matching, type Change } from '$lib/state/sessions/changes.svelte';
    import { currentWorkspace } from '$lib/state/sources/fs-transport';
    import { useState } from '$lib/state/client/use';

    const {
        changes: { error, loading, more, older, reload, rows },
        explorer,
        fs: { workspaces },
        ui: { instanceState, setInstanceState },
        writes: { pending, undoWrite }
    } = useState();

    let { instance }: ViewProps = $props();

    const filter = $derived(instanceText(instanceState(instance.id), 'filter'));
    const list = $derived(matching(rows(), filter));

    /** What the status region says: the last sentence a press produced. */
    let said = $state('');

    /** The rows whose undo the server refused, which keeps their control unpressable. */
    const refused = new SvelteSet<string>();

    /** The values a reader opened, by the row's moment and which side of it. */
    const opened = new SvelteSet<string>();

    function typed(value: string): void {
        setInstanceState(instance.id, { filter: value });
    }

    function toggle(key: string): void {
        if (!opened.delete(key)) opened.add(key);
    }

    /**
     * The two sides of one row: what the file held, and what the write put there. A file operation
     * names the paths it took and left, not the values of a field.
     */
    function sides(row: Change): { side: string; label: string; held: Shown }[] {
        const fold = row.kind === FILE_RECORD ? shownPaths : shown;
        return [
            { side: 'before', label: t('history.before'), held: fold(row.before) },
            { side: 'after', label: t('history.after'), held: fold(row.after) }
        ];
    }

    /** The word a kind of write is called, which is a catalog word and never the wire's own. */
    function kindOf(row: Change): string {
        return t(`history.kind_${row.kind.replaceAll('-', '_')}`);
    }

    /** The words a row is named by in a control's tooltip and in the status region. */
    function named(row: Change): string {
        if (row.kind === FILE_RECORD) {
            const operation = fileOperation(row.field, row.after);
            // A replace already says how many files it wrote; the files are the lists under it.
            return row.field === 'replace'
                ? operation
                : t('history.file_named', operation, row.file);
        }
        return row.field === '' ? row.key : t('history.named', row.key, row.field);
    }

    /** What a row says it addressed: the operation of a file record, else the key and field. */
    function whatOf(row: Change): string {
        return row.kind === FILE_RECORD ? fileOperation(row.field, row.after) : named(row);
    }

    /**
     * Take one change back. The list is read again afterwards whichever way it went: the undo is a
     * write of its own and joins the log above the row it took back.
     */
    async function undo(row: Change): Promise<void> {
        said = t('history.undoing', named(row));
        // A file operation is taken back through the file store, which also moves the tabs and
        // the bookmarks over the paths back.
        const answer =
            row.kind === FILE_RECORD
                ? await explorer.undoFile(row, currentWorkspace(workspaces()).roots)
                : await undoWrite(row.at);
        const outcome = undoSaid(answer, named(row));
        said = outcome.said;
        if (!outcome.undone) {
            refused.add(row.at);
            return;
        }
        reload();
    }
</script>

{#snippet bar()}
    <Toolbar label={t('history.toolbar')}>
        <Search fill value={filter} placeholder={t('history.filter')} oninput={typed} />
        <span class="said" role="status">{said}</span>
    </Toolbar>
{/snippet}

<Pane title={t('views.history')} {bar}>
    <div class="view" data-instance={instance.id} data-history>
        {#if error() !== ''}
            <Empty error message={t('history.failed', error())} />
        {:else if loading()}
            <p class="loading">{t('history.loading')}</p>
        {:else if list.length === 0}
            <Empty message={t('history.none')} glyph={t('history.none_glyph')} />
        {:else}
            <ul>
                {#each list as row (row.at)}
                    <li data-change={row.at}>
                        <div class="head">
                            <span class="when">{stamp(row.at)}</span>
                            <span class="kind" data-kind={row.kind}>{kindOf(row)}</span>
                            <span class="file">{row.file}</span>
                            <span class="what">{whatOf(row)}</span>
                            {#if row.undo !== 'none'}
                                <span class="reveal">
                                    <ToolButton
                                        small
                                        label={t('history.undo')}
                                        glyph={t('history.undo_glyph')}
                                        title={t('history.undo_tip', named(row))}
                                        disabled={pending() || refused.has(row.at)}
                                        onclick={() => void undo(row)}
                                    />
                                </span>
                            {/if}
                        </div>
                        <div class="sides">
                            {#each sides(row) as pair (pair.side)}
                                {@const key = `${row.at}:${pair.side}`}
                                <div class="side" data-side={pair.side}>
                                    <span class="lbl">{pair.label}</span>
                                    {#if pair.held.empty}
                                        <span class="empty">{t('history.nothing_there')}</span>
                                    {:else if pair.held.size === 0}
                                        <span class="value">{pair.held.text}</span>
                                    {:else}
                                        <span class="reveal" class:open={opened.has(key)}>
                                            <Disclosure
                                                count={pair.held.size}
                                                label={t('history.items')}
                                                expanded={opened.has(key)}
                                                onclick={() => toggle(key)}
                                            />
                                        </span>
                                        {#if opened.has(key)}
                                            <pre class="raw" data-value={key}>{pair.held.text}</pre>
                                        {/if}
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </li>
                {/each}
            </ul>
            {#if more()}
                <div class="foot">
                    <ToolButton label={t('history.older')} onclick={() => older()} />
                </div>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* A row's controls are drawn while the pointer is over the row or the focus is inside it, and
       always where nothing hovers. They stay in the layout and in the tab order while clear. */
    li {
        --row-reveal: 0;
        border-bottom: 1px solid var(--line);
    }

    li:hover,
    li:focus-within {
        --row-reveal: 1;
    }

    @media (hover: none) {
        li {
            --row-reveal: 1;
        }
    }

    .reveal {
        display: inline-flex;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    /* A pill that is open is the row's selected control, so it stays drawn. */
    .reveal.open {
        opacity: 1;
    }

    /* Each line of a row is one line of the tree's row height, and a line that wraps grows by
       whole lines. */
    .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
    }

    .sides {
        display: flex;
        flex-wrap: wrap;
        gap: 0 12px;
    }

    .side {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 4px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
    }

    .when {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }

    .kind {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .file,
    .lbl {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .file {
        font-family: var(--font-mono);
        word-break: break-all;
    }

    .what,
    .value {
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    .empty,
    .loading {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    /* The sentence the last press produced, at the bar's end. */
    .said {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .raw {
        max-height: 18rem;
        overflow: auto;
        margin: 2px 0 0;
        padding: 6px;
        background: var(--chip);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--ink-txt, var(--ink));
    }

    .foot {
        display: flex;
        padding: 4px 0;
    }

    :global(body.wall) .raw {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The terminal shape: the log follows the folder line, as every list does. */
    :global(body.rice) .view {
        font-family: var(--font-mono);
    }
</style>
