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
    // focus and which cross from one file to the next, Open File, and a re-read. Each file is
    // views/sources/repositories/diff/DiffSection.svelte, Monaco's diff editor over the file's two
    // versions, which the server answers whole. For a file's own diff each hunk can be staged,
    // unstaged or reverted whole or for the lines the selections choose in it, the patch cut by
    // state/sources/repositories/diff-patch.ts and applied by git. A revert throws work away, so
    // it asks first.
    //
    // The files are read when the pane opens, again when the instance is pointed at something
    // else, and again whenever the repository's state on the `git` channel moves, so a hunk staged
    // here or anywhere else redraws the pane; a read that changes nothing keeps what is drawn. Each
    // file's diff editor view state (the runs revealed, the scroll and the caret) is kept in the
    // instance state by the file's key (its path, or for a path git lists again the path and its
    // place, from `fileKeys`), so a pane drawn again while its tab stays open shows what it
    // showed. The pane lists its editor's actions for the palette as a source tab does, and runs
    // the one asked for.

    import { onDestroy, untrack } from 'svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import type { DiffCommand, EditorAction } from '$lib/ui/controls/editor/types';
    import DiffSection from './DiffSection.svelte';
    import {
        countsOf,
        diffActions,
        hunkNear,
        hunksOf,
        stepFiles,
        type ChangeAt,
        type ChosenRows,
        type DiffActions,
        type LineChange
    } from '$lib/state/sources/repositories/diff-hunks';
    import { sidesPatch, type PatchMode } from '$lib/state/sources/repositories/diff-patch';
    import {
        diffActs,
        diffUrl,
        diffViewOf,
        fileKeys,
        sameFiles,
        viewKeeper,
        type DiffAttributes,
        type DiffMode,
        type DiffSides,
        type DiffState
    } from '$lib/state/sources/repositories/repositories';
    import { DEFAULT_INDENT } from '$lib/state/workbench/navigation/editor-text';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor },
        editorStatus: { asked: askedOf, forget, publish },
        layout: { instanceView },
        ui: { codeTheme, instanceState, setInstanceState, theme, textScale }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How long the view states wait before they are kept, so a scroll is one write. */
    const KEEP_AFTER_MS = 400;

    const held = $derived(read(instance.state));

    let files: DiffSides[] = $state([]);
    let attributes: DiffAttributes | null = $state(null);
    /** Whether the path of a file's own diff is in conflict, which allows no action on it. */
    let conflicted = $state(false);
    let failure = $state('');
    let reading = $state(false);
    let loaded = $state(false);
    /** What the last read was over, so a new subject is read once and a redraw is not. */
    let taken = $state('');
    /** Each file's hunk count once its editor has drawn it, null before. */
    let counts: (number | null)[] = $state([]);
    /** Each file's line changes, as its editor last answered them. */
    let changes: LineChange[][] = [];
    /** The change the pane is at, and the way it was going when its file was not drawn yet. */
    let at: ChangeAt | null = $state(null);
    let going: 1 | -1 = 1;
    /** The line an opening asked for, already gone to. */
    let placed = $state(-1);
    let asking: { message: string; act: () => void } | null = $state(null);
    let box: HTMLDivElement | undefined = $state();
    /** What the pane asks of a file's section: bring a hunk into view, run a palette action. */
    type Section = { reveal: (hunk: number) => void; perform: (command: DiffCommand) => void };
    const sections: (Section | undefined)[] = $state([]);
    let actions: EditorAction[] = $state([]);
    let performed = 0;
    /** The view states the editors say, kept by file key in one write per pause. */
    const keeper = viewKeeper(
        () => instanceState(instance.id),
        (state) => setInstanceState(instance.id, state),
        KEEP_AFTER_MS
    );

    const keys = $derived(fileKeys(files));
    const view = $derived(diffViewOf(instanceState(instance.id), loaded ? keys : undefined));
    const acts = $derived(diffActs(held) && held.path !== '');
    const subject = $derived(held.path !== '' || (held.stash ?? '') !== '');
    const title = $derived(held.label === '' ? t('views.repositories_diff') : held.label);
    const busy = $derived(repositories.busy(held.root));
    const look = $derived(`${theme()} ${String(textScale() ?? 1)}`);
    /** The repository's state, whose every move is a new read of a diff the pane can act on. */
    const repo = $derived(held.root === '' ? null : gitFor(held.root));
    const several = $derived(files.length > 1);
    const stops = $derived(counts.some((count) => count !== 0));

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
        try {
            const response = await fetch(diffUrl(state));
            const body = (await response.json()) as {
                files?: DiffSides[];
                attributes?: DiffAttributes;
                conflicted?: boolean;
                error?: string;
            };
            if (mine !== asked) return;
            if (!response.ok || !Array.isArray(body.files)) {
                failure =
                    typeof body.error === 'string' ? body.error : t('repositories.diff_failed');
            } else {
                // A read that changed nothing keeps the files drawn, and with them the view.
                if (!sameFiles(files, body.files)) {
                    files = body.files;
                    counts = countsOf(body.files);
                    changes = [];
                }
                attributes = body.attributes ?? null;
                conflicted = body.conflicted === true;
            }
        } catch {
            if (mine !== asked) return;
            failure = t('repositories.diff_failed');
        }
        reading = false;
        loaded = true;
    }

    $effect(() => {
        const wanted = held;
        if (!subject || wanted.id === taken) return;
        taken = wanted.id;
        at = null;
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

    /** A file's editor drew its diff: its hunks are known, and a step waiting on it lands. */
    function drawn(index: number, next: LineChange[]): void {
        changes[index] = next;
        const hunks = hunksOf(next);
        counts[index] = hunks.length;
        const line = held.line ?? 0;
        if (index === 0 && line > 0 && placed !== line) {
            placed = line;
            go({ file: 0, hunk: hunkNear(hunks, line) });
        } else if (at?.file === index && at.hunk === -1 && hunks.length > 0) {
            go({ file: index, hunk: going === 1 ? 0 : hunks.length - 1 });
        }
    }

    /** Put the pane at one change and bring it into view; a file not drawn yet is drawn first. */
    function go(next: ChangeAt | null): void {
        if (next === null || (next.hunk < 0 && counts[next.file] !== null)) return;
        at = next;
        sections[next.file]?.reveal(next.hunk);
    }

    function step(direction: 1 | -1): void {
        going = direction;
        go(stepFiles(counts, at, direction));
    }

    /** Alt+F5 is the next change and Shift+Alt+F5 the one before, VS Code's keys. */
    function keyed(event: KeyboardEvent): void {
        if (event.key !== 'F5' || !event.altKey) return;
        event.preventDefault();
        step(event.shiftKey ? -1 : 1);
    }

    async function apply(index: number, cut: string, mode: PatchMode): Promise<void> {
        if (cut === '' || index >= files.length) return;
        await repositories.applyPatch(held.root, cut, mode);
    }

    function acted(
        index: number,
        drawnChanges: LineChange[],
        rows: ChosenRows,
        mode: PatchMode,
        count: number
    ): void {
        const cut = sidesPatch(files[index], drawnChanges, rows, mode);
        if (mode !== 'revert') {
            void apply(index, cut, mode);
            return;
        }
        asking = {
            message:
                count === 0
                    ? t('repositories.hunk_revert_confirm', held.path)
                    : t('repositories.lines_revert_confirm', count, held.path),
            act: () => void apply(index, cut, mode)
        };
    }

    /**
     * The line Open File opens at: the first line of the change the pane is at on the file's side,
     * or with no change current the line the pane was opened at, or the top of the file.
     */
    function openLine(): number {
        if (at === null || at.hunk < 0) return held.line ?? 0;
        const hunk = hunksOf(changes[at.file] ?? []).at(at.hunk);
        return hunk === undefined ? (held.line ?? 0) : hunk.modified.from;
    }

    /**
     * The actions a file allows: none for a diff of a commit, a stash or a worktree, and for a
     * file's own diff what its texts, git's attributes and a conflict on its path allow, none while
     * those are unread.
     */
    function actionsOf(file: DiffSides): DiffActions | 'read' {
        if (!acts) return 'read';
        return attributes === null ? 'none' : diffActions(file, attributes, conflicted);
    }

    function setMode(mode: DiffMode): void {
        setInstanceState(instance.id, { ...view, mode });
    }

    // The palette lists the editor's actions while the pane draws a diff, as for a source tab.
    $effect(() => {
        const id = instance.id;
        if (files.length === 0 || actions.length === 0) {
            forget(id);
            return;
        }
        publish(id, {
            caret: null,
            lines: 0,
            indent: DEFAULT_INDENT,
            ending: 'LF',
            language: '',
            writable: false,
            blame: '',
            actions
        });
    });

    // A palette action asked of the pane, run once on the file the pane is at.
    $effect(() => {
        const ask = askedOf(instance.id);
        if (ask === null || ask.seq === performed || ask.kind !== 'action') return;
        performed = ask.seq;
        untrack(() => sections[at?.file ?? 0]?.perform({ kind: 'action', id: ask.id }));
    });

    // Closed first: an editor torn down with the pane says its view state after this. A tab still
    // open keeps it; a closed tab's instance state is gone, and nothing may write it back.
    onDestroy(() => {
        keeper.close(() => instanceView(instance.id) !== undefined);
        forget(instance.id);
    });
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
            disabled={!stops}
            onclick={() => step(-1)}
        />
        <ToolButton
            label={t('repositories.change_next')}
            title={t('repositories.change_next_title')}
            glyph="next_change"
            compact
            disabled={!stops}
            onclick={() => step(1)}
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
    <!-- The pane's keys: the files region is the focus stop, and Alt+F5 moves through changes. -->
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
        {:else if !loaded}
            <p class="note">{t('repositories.diff_pending')}</p>
        {:else if files.length === 0}
            <p class="note">{t('repositories.diff_empty')}</p>
        {:else}
            <!-- A scrolled region is a focus stop, to scroll it and move by change by keyboard. -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div
                class="files"
                class:several
                bind:this={box}
                role="region"
                aria-label={title}
                tabindex="0"
            >
                {#each files as file, index (keys[index])}
                    <DiffSection
                        bind:this={sections[index]}
                        {file}
                        {index}
                        key={keys[index]}
                        model={`${instance.id}:${keys[index]}`}
                        mode={view.mode}
                        {look}
                        codeTheme={codeTheme()}
                        {several}
                        headed={several || !acts}
                        scroller={box}
                        view={view.views[keys[index]] ?? null}
                        actions={actionsOf(file)}
                        {conflicted}
                        staged={held.staged}
                        {busy}
                        current={at?.file === index ? at.hunk : -1}
                        onchanges={(next: LineChange[]) => drawn(index, next)}
                        onview={(state: object) => keeper.viewed(keys[index], state)}
                        onactions={(offered: EditorAction[]) => (actions = offered)}
                        onact={(
                            drawnChanges: LineChange[],
                            rows: ChosenRows,
                            mode: PatchMode,
                            count: number
                        ) => acted(index, drawnChanges, rows, mode, count)}
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

    .files {
        flex: 1 1 auto;
        min-height: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        overflow: hidden;
    }

    .files.several {
        padding: 0 6px 6px;
        overflow: auto;
    }

    .files:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    :global(body.wall) .files {
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
