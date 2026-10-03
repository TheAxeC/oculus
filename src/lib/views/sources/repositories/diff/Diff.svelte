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
    // staged or as the worktree has it, one commit's change to a file, a whole stash, everything a
    // worktree holds that its repository's branch does not, every path of the staged or the changed
    // group, every file a ref and a commit differ in (Compare with Remote, Compare with Merge Base,
    // Compare with...), a linked worktree's file against the main worktree's (Compare with
    // Workspace), or the Replace Preview of a Search tab: a file as it is against the file as the
    // tab's replacements would leave it. The groups and the comparisons are read a few files at a
    // time (diff/diff-read.ts) and every read is read-only; the reader drops an answer that is no
    // longer the newest, and every answer once the pane is closed.
    //
    // The bar (diff/DiffBar.svelte) holds icon buttons: Open File (a file's own diff), Previous
    // Change and Next Change, which Shift+Alt+F5 and Alt+F5 press while the pane holds the focus
    // and which cross from one file to the next and open a folded file they step onto, and Collapse
    // Unchanged Regions, a toggle that is on at the start; then a `...` menu holding Inline View, a
    // checked item that switches the layout between side by side and inline, and Refresh, which
    // reads the diff again. The layout, the toggle and the folded files are kept as the pane's own
    // state. Each file is views/sources/repositories/diff/DiffSection.svelte under a header row
    // (diff/FileHeader.svelte) that folds it when the diff holds several, Monaco's diff editor over
    // the file's two versions, which the server answers whole. For a file's own diff each hunk can
    // be staged, unstaged or reverted whole or for the lines the selections choose in it, the patch
    // cut by state/sources/repositories/diff/diff-patch.ts and applied by git. A revert throws work
    // away, so it asks first.
    //
    // The files are read when the pane opens, again when the instance is pointed at something else,
    // and again whenever the repository's state on the `git` channel moves (once, when the tab is
    // shown, for a state that came while it was hidden), so a hunk staged here or anywhere else
    // redraws the pane; a read that changes nothing keeps what is drawn. Each
    // file's diff editor view state (the runs revealed, the scroll and the caret) is kept in the
    // instance state by the file's key (its path, or for a path git lists again the path and its
    // place, from `fileKeys`), so a pane drawn again while its tab stays open shows what it showed.
    // The pane lists its editor's actions for the palette as a source tab does, and runs the one
    // asked for.

    import { onDestroy, untrack } from 'svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { DiffCommand, EditorAction } from '$lib/ui/controls/editor/types';
    import DiffBar from './DiffBar.svelte';
    import DiffSection from './DiffSection.svelte';
    import { failureSentence } from './compare-words';
    import { readPaneDiff } from './diff-read';
    import { latestRead } from '$lib/state/sources/repositories/diff/compare';
    import { diffReader } from '$lib/state/sources/repositories/answers';
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
    } from '$lib/state/sources/repositories/diff/diff-hunks';
    import { sidesPatch, type PatchMode } from '$lib/state/sources/repositories/diff/diff-patch';
    import { previewKey } from '$lib/state/sources/repositories/replace-preview';
    import {
        diffActs,
        diffViewOf,
        fileKeys,
        groupFrom,
        groupWaits,
        heldDiff,
        sameFiles,
        toggleFolded,
        unfolded,
        viewKeeper,
        type DiffAttributes,
        type DiffSides,
        type DiffState
    } from '$lib/state/sources/repositories/repositories';
    import { DEFAULT_INDENT } from '$lib/state/workbench/navigation/editor-text';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor, gitRoots },
        writes,
        editorStatus: { asked: askedOf, forget, publish },
        layout: { instanceView },
        ui: { codeTheme, instanceState, setInstanceState, theme, textScale }
    } = useState();

    let { instance }: ViewProps = $props();

    /** Whether the repository's state is due a read now: shown, and moved since the last read. */
    const gate = shownGate(useShown());

    /** How long the view states wait before they are kept, so a scroll is one write. */
    const KEEP_AFTER_MS = 400;

    const held = $derived(heldDiff(instance.state));
    /** What a read is made under: the pane's id, and for a Replace Preview its replacements. */
    const readKey = $derived(`${held.id}${previewKey(held.replace)}`);

    let files: DiffSides[] = $state([]);
    let attributes: DiffAttributes | null = $state(null);
    /** Whether the path of a file's own diff is in conflict, which allows no action on it. */
    let conflicted = $state(false);
    let failure = $state('');
    let loaded = $state(false);
    /** Whether a read is in flight, which Refresh waits for. */
    let reading = $state(false);
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
    const grouped = $derived((held.group ?? '') !== '');
    const subject = $derived(
        held.path !== '' || (held.stash ?? '') !== '' || grouped || held.compare !== undefined
    );
    const title = $derived(held.label === '' ? t('views.repositories_diff') : held.label);
    const busy = $derived(repositories.busy(held.root));
    const look = $derived(`${theme()} ${String(textScale() ?? 1)}`);
    /** The repository's state, whose every move is a new read of a diff the pane can act on. */
    const repo = $derived(held.root === '' ? null : gitFor(held.root));
    const several = $derived(files.length > 1);
    const stops = $derived(counts.some((count) => count !== 0));

    /** The reads of this pane: the newest answer is drawn, and none once the pane is closed. */
    const reader = diffReader(
        (state) => readPaneDiff(state, repo, writes.writeToken()),
        latestRead()
    );

    async function load(state: DiffState): Promise<void> {
        reading = true;
        failure = '';
        const drawn = await reader.load(state, {
            answered(read) {
                if (!read.ok || read.files === null) {
                    failure = failureSentence(state, read.error, t);
                    return;
                }
                // A read that changed nothing keeps the files drawn, and with them the view.
                if (!sameFiles(files, read.files)) {
                    files = read.files;
                    counts = countsOf(read.files);
                    changes = [];
                }
                attributes = read.attributes;
                conflicted = read.conflicted;
            },
            failed() {
                failure = t('repositories.diff_failed');
            }
        });
        if (!drawn) return;
        reading = false;
        loaded = true;
    }

    $effect(() => {
        const wanted = held;
        if (!subject || readKey === taken) return;
        if (grouped && groupWaits(repo, gitRoots())) return;
        taken = readKey;
        at = null;
        placed = -1;
        void load(wanted);
        gate.note([untrack(() => repo)]);
    });

    /** Whether the repository's state has been heard since the pane was drawn. */
    let heard = false;

    // A file's own diff and a group's follow the repository: every new state the channel sends
    // reads it again. The first state is not a second read, since the read of a subject was made
    // against it or just before it, and a hidden pane reads once when it is shown if a state came
    // meanwhile. The read of a new subject notes the state it read against.
    $effect(() => {
        const now = repo;
        if (now === null || !(acts || grouped)) return;
        if (!heard) {
            heard = true;
            gate.note([now]);
            return;
        }
        if (!gate.due([now])) return;
        untrack(() => {
            if (taken === readKey) void load(held);
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

    /**
     * Put the pane at one change and bring it into view; a file not drawn yet is drawn first, and
     * a folded file is opened first.
     */
    function go(next: ChangeAt | null): void {
        if (next === null || (next.hunk < 0 && counts[next.file] !== null)) return;
        at = next;
        if (view.folded.includes(keys[next.file])) {
            setInstanceState(instance.id, {
                ...view,
                folded: unfolded(view.folded, keys[next.file])
            });
        }
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

    /** Keep part of what the pane remembers, the rest as it was. */
    function keep(part: Partial<typeof view>): void {
        setInstanceState(instance.id, { ...view, ...part });
    }

    /**
     * The path a file's header opens, the file being on disk for a file's own diff or a group's.
     */
    function pathOf(file: DiffSides): string {
        return file.newPath === '' ? file.oldPath : file.newPath;
    }

    /** Whether a diff's files are on disk to open. */
    const onDisk = $derived(
        !held.worktree && (held.commit ?? '') === '' && (held.stash ?? '') === ''
    );

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
            actions,
            file: '',
            selection: ''
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
        reader.close();
        keeper.close(() => instanceView(instance.id) !== undefined);
        forget(instance.id);
    });
</script>

{#snippet tools()}
    <DiffBar
        openable={held.path !== '' && !held.worktree && (held.commit ?? '') === ''}
        {stops}
        {reading}
        {subject}
        unchanged={view.unchanged === 'folded'}
        inline={view.mode === 'inline'}
        onopen={() => repositories.openFile(held.root, held.path, openLine())}
        onstep={step}
        ontoggle={() => keep({ unchanged: view.unchanged === 'folded' ? 'shown' : 'folded' })}
        oninline={() => keep({ mode: view.mode === 'inline' ? 'side' : 'inline' })}
        onrefresh={() => {
            if (subject && !reading) void load(held);
        }}
    />
{/snippet}

{#snippet again()}
    <ToolButton small label={t('repositories.diff_retry')} onclick={() => void load(held)} />
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
            <Empty error message={failure} action={again} />
        {:else if !loaded}
            <Empty message={t('repositories.diff_pending')} glyph={t('repositories.empty_glyph')} />
        {:else if files.length === 0}
            <Empty message={t('repositories.diff_empty')} glyph={t('repositories.empty_glyph')} />
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
                        foldable={several}
                        folded={view.folded.includes(keys[index])}
                        unchanged={view.unchanged === 'folded'}
                        openable={onDisk}
                        from={held.group === undefined
                            ? ''
                            : groupFrom(repo, held.group, pathOf(file))}
                        scroller={box}
                        view={view.views[keys[index]] ?? null}
                        actions={actionsOf(file)}
                        {conflicted}
                        staged={held.staged}
                        session={held.session}
                        {busy}
                        current={at?.file === index ? at.hunk : -1}
                        onchanges={(next: LineChange[]) => drawn(index, next)}
                        ontoggle={() => keep({ folded: toggleFolded(view.folded, keys[index]) })}
                        onopen={() =>
                            repositories.openFile(
                                held.root,
                                pathOf(file),
                                index === (at?.file ?? 0) ? openLine() : 0
                            )}
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
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    :global(body.wall) .files {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
