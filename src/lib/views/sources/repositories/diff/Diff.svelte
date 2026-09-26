<script module lang="ts">
    // Layer 3, view registration. A diff opens from the Source Control views and is not listed:
    // opened bare it could only report that it was opened for nothing.
    import { DIFF_VIEW } from '$lib/state/sources/repositories/repositories.svelte';
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: DIFF_VIEW,
        label: 'views.repositories_diff',
        glyph: 'views.repositories_diff_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One diff as its own tab, as VS Code's diff editor: a file of a repository,
    // staged or as the worktree has it, one commit's change to a file, a whole stash, or
    // everything a worktree holds that its repository's branch does not.
    //
    // The bar holds the layout toggle (side by side or inline, kept as the pane's own state),
    // Previous Change and Next Change, which Shift+Alt+F5 and Alt+F5 press while the pane holds the
    // focus, Open File, and a re-read. The rows are
    // views/sources/repositories/diff/DiffFile.svelte, one per file; for a file's own diff each
    // hunk can be staged, unstaged or reverted whole or for the lines chosen in it, the patch cut
    // by state/sources/repositories/diff-patch.ts and applied by git. A revert throws work away, so
    // it asks first.
    //
    // The text is read when the pane opens, again when the instance is pointed at something else,
    // and again whenever the repository's state on the `git` channel moves, so a hunk staged here
    // or anywhere else redraws the pane. The server reads a file with the whole of it as context,
    // and the pane folds what it does not need to show.

    import { untrack } from 'svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import DiffFile from './DiffFile.svelte';
    import {
        hunkNear,
        hunksOf,
        parseDiff,
        stepChange,
        type Hunk
    } from '$lib/state/sources/repositories/diff-rows';
    import { hunkPatch, type PatchMode } from '$lib/state/sources/repositories/diff-patch';
    import {
        diffActs,
        diffUrl,
        diffViewOf,
        type DiffMode,
        type DiffState
    } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const held = $derived(read(instance.state));
    const view = $derived(diffViewOf(instanceState(instance.id)));

    let text = $state('');
    let failure = $state('');
    let reading = $state(false);
    /** What the last read was over, so a new subject is read once and a redraw is not. */
    let taken = $state('');
    /** The rows chosen in each file, by the file's place. */
    let chosen: Record<number, number[]> = $state({});
    /** The change the pane is at, by its place among every file's hunks. */
    let at = $state(-1);
    /** The line an opening asked for, already gone to. */
    let placed = $state(-1);
    let asking: { message: string; act: () => void } | null = $state(null);
    let box: HTMLDivElement | undefined = $state();

    const files = $derived(parseDiff(text));
    /** Every hunk of the pane, in order, with the file it is in. */
    const changes = $derived(
        files.flatMap((file, index) =>
            hunksOf(file.lines).map((hunk, place) => ({ index, place, hunk }))
        )
    );
    const acts = $derived(diffActs(held) && held.path !== '');
    const subject = $derived(held.path !== '' || (held.stash ?? '') !== '');
    const title = $derived(held.label === '' ? t('views.repositories_diff') : held.label);
    const busy = $derived(repositories.busy(held.root));
    /** The repository's state, whose every move is a new read of a diff the pane can act on. */
    const repo = $derived(held.root === '' ? null : gitFor(held.root));

    function read(state: unknown): DiffState {
        const map = (state ?? {}) as Partial<DiffState>;
        const text = (value: unknown): string => (typeof value === 'string' ? value : '');
        return {
            id: text(map.id),
            label: text(map.label),
            root: text(map.root),
            path: text(map.path),
            staged: map.staged === true,
            worktree: map.worktree === true,
            commit: text(map.commit),
            stash: text(map.stash),
            line: typeof map.line === 'number' ? map.line : 0
        };
    }

    /** The number of the last read asked for, so an older answer that lands late is dropped. */
    let asked = 0;

    async function load(state: DiffState): Promise<void> {
        asked += 1;
        const mine = asked;
        reading = true;
        failure = '';
        let next = '';
        try {
            const response = await fetch(diffUrl(state));
            const body = (await response.json()) as { output?: string; error?: string };
            if (mine !== asked) return;
            if (!response.ok) {
                failure =
                    typeof body.error === 'string' ? body.error : t('repositories.diff_failed');
            } else {
                next = typeof body.output === 'string' ? body.output : '';
            }
        } catch {
            if (mine !== asked) return;
            failure = t('repositories.diff_failed');
        }
        // The rows chosen are held by their place in the text; a text that moved them drops them,
        // so a Stage of chosen lines never takes lines the reader did not choose.
        if (next !== text) chosen = {};
        text = next;
        reading = false;
    }

    $effect(() => {
        const wanted = held;
        if (!subject || wanted.id === taken) return;
        taken = wanted.id;
        chosen = {};
        at = -1;
        placed = -1;
        void load(wanted);
    });

    /** The state the pane last read against, so the first state is not a second read. */
    let seen: unknown = null;

    // A file's own diff follows the repository: every new state the channel sends reads it again.
    $effect(() => {
        const now = repo;
        if (now === null || !acts) return;
        if (seen === null || seen === now) {
            seen = now;
            return;
        }
        seen = now;
        untrack(() => {
            if (taken === held.id) void load(held);
        });
    });

    // The line the pane was opened at, gone to once the text that holds it is drawn.
    $effect(() => {
        const line = held.line ?? 0;
        if (line <= 0 || changes.length === 0 || placed === line) return;
        placed = line;
        const file = files.at(0);
        if (file === undefined) return;
        go(hunkNear(file.lines, hunksOf(file.lines), line));
    });

    // The change the pane is at, and none before the first move: `at` starts at -1, which `.at()`
    // would read as the last change.
    const shownAt = $derived(at >= 0 ? changes.at(at) : undefined);

    function patch(part: Record<string, unknown>): void {
        setInstanceState(instance.id, { ...view, ...part });
    }

    /** Put the pane at one change and bring its bar into view. */
    function go(next: number): void {
        if (next < 0 || next >= changes.length) return;
        at = next;
        const change = changes[at];
        queueMicrotask(() => {
            box?.querySelector(`[data-hunk-id="${change.index}:${change.place}"]`)?.scrollIntoView({
                block: 'center'
            });
        });
    }

    /** Alt+F5 is the next change and Shift+Alt+F5 the one before, VS Code's keys. */
    function keyed(event: KeyboardEvent): void {
        if (event.key !== 'F5' || !event.altKey) return;
        event.preventDefault();
        go(stepChange(at, changes.length, event.shiftKey ? -1 : 1));
    }

    function choose(file: number, row: number): void {
        const rows = chosen[file] ?? [];
        chosen = {
            ...chosen,
            [file]: rows.includes(row) ? rows.filter((one) => one !== row) : [...rows, row]
        };
    }

    async function apply(file: number, hunk: Hunk, mode: PatchMode, rows: number[] | null) {
        const cut = hunkPatch(files[file], hunk, mode, rows === null ? null : new Set(rows));
        if (cut === '') return;
        if (await repositories.applyPatch(held.root, cut, mode)) chosen = { ...chosen, [file]: [] };
    }

    function acted(file: number, hunk: Hunk, mode: PatchMode, rows: number[] | null): void {
        if (mode !== 'revert') {
            void apply(file, hunk, mode, rows);
            return;
        }
        asking = {
            message:
                rows === null
                    ? t('repositories.hunk_revert_confirm', held.path)
                    : t('repositories.lines_revert_confirm', rows.length, held.path),
            act: () => void apply(file, hunk, mode, rows)
        };
    }

    /**
     * The line Open File opens at: the new side's first line of the change the pane is at, or with
     * no change current the line the pane was opened at, or the top of the file.
     */
    function openLine(): number {
        const change = shownAt;
        if (change === undefined) return held.line ?? 0;
        const lines = files[change.index].lines.slice(change.hunk.first, change.hunk.last + 1);
        return lines.find((line) => line.new !== null)?.new ?? lines.at(0)?.old ?? 0;
    }

    function setMode(mode: DiffMode): void {
        patch({ mode });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('views.repositories_diff')}>
        <ToolButton
            label={t('repositories.diff_side')}
            glyph="side_by_side"
            compact
            pressed={view.mode === 'side'}
            onclick={() => setMode('side')}
        />
        <ToolButton
            label={t('repositories.diff_inline')}
            glyph="inline_diff"
            compact
            pressed={view.mode === 'inline'}
            onclick={() => setMode('inline')}
        />
        <ToolButton
            label={t('repositories.change_prev')}
            title={t('repositories.change_prev_title')}
            glyph="prev_change"
            compact
            disabled={changes.length === 0}
            onclick={() => go(stepChange(at, changes.length, -1))}
        />
        <ToolButton
            label={t('repositories.change_next')}
            title={t('repositories.change_next_title')}
            glyph="next_change"
            compact
            disabled={changes.length === 0}
            onclick={() => go(stepChange(at, changes.length, 1))}
        />
        {#if held.path !== '' && !held.worktree && (held.commit ?? '') === ''}
            <ToolButton
                label={t('repositories.open_file')}
                glyph="open_file"
                compact
                onclick={() => repositories.openFile(held.root, held.path, openLine())}
            />
        {/if}
        <ToolButton
            label={t('repositories.diff')}
            title={t('repositories.diff_title')}
            glyph="refresh"
            compact
            disabled={reading || !subject}
            onclick={() => void load(held)}
        />
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools}>
    <!-- The pane's keys: the rows region is the focus stop, and Alt+F5 moves through changes. -->
    <div
        class="diff"
        data-instance={instance.id}
        data-view="repositories-diff"
        onkeydown={keyed}
        role="presentation"
    >
        {#if !subject}
            <Empty message={t('repositories.diff_empty')} glyph={t('repositories.empty_glyph')} />
        {:else if failure !== ''}
            <p class="failed">{failure}</p>
        {:else if reading && text === ''}
            <p class="note">{t('repositories.diff_pending')}</p>
        {:else if files.length === 0}
            <p class="note">{t('repositories.diff_empty')}</p>
        {:else}
            <!-- A scrolled region is a focus stop, to scroll it and move by change by keyboard. -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div class="rows" bind:this={box} role="region" aria-label={title} tabindex="0">
                {#each files as file, index (index)}
                    <DiffFile
                        {file}
                        {index}
                        mode={view.mode}
                        opened={view.opened}
                        {acts}
                        staged={held.staged}
                        {busy}
                        chosen={chosen[index] ?? []}
                        current={shownAt?.index === index ? shownAt.place : -1}
                        headed={files.length > 1 || !acts}
                        onopen={(from: number) => patch({ opened: [...view.opened, from] })}
                        onchoose={(row: number) => choose(index, row)}
                        onhunk={(hunk: Hunk, mode: PatchMode, rows: number[] | null) =>
                            acted(index, hunk, mode, rows)}
                    />
                {/each}
            </div>
        {/if}
    </div>
</Pane>

{#if asking !== null}
    <Confirm
        message={asking.message}
        detail={t('git.discard_detail')}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            const was = asking;
            asking = null;
            was?.act();
        }}
        oncancel={() => (asking = null)}
    />
{/if}

<style>
    .diff {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
    }

    .rows {
        flex: 1 1 auto;
        min-height: 0;
        padding: 4px 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        overflow: auto;
    }

    .rows:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    :global(body.wall) .rows {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .note,
    .failed {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .failed {
        color: var(--c-red-txt, var(--muted));
    }
</style>
