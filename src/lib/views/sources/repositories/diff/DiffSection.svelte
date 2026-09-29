<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/Diff.svelte. One file of a diff: its path
    // above it when the diff holds several or is not a file's own, and Monaco's diff editor over
    // its two versions (ui/controls/editor/DiffEditor.svelte). A binary file is a note, and a file
    // whose two texts are equal (a rename or a mode change alone, a new empty file) is git's head
    // lines for it. A file whose line endings alone changed, which Monaco draws as no change, says
    // so at its head and shows all its lines.
    //
    // In a diff of several files the section's editor is made when the section first comes within
    // one screen of the pane's view, since each is two editors, and until then the section holds
    // the height of its lines. Each such editor grows to its content, so the pane scrolls one list.
    //
    // Above each hunk (git's grouping of Monaco's line changes, state/sources/repositories/
    // diff-hunks.ts) is a bar with git's hunk head and the actions the file allows: Stage Block and
    // Revert Block, or Unstage Block in a staged diff, each over the rows the selections choose in
    // that hunk while they choose any. Where a partial patch cannot be built the bar says to act
    // on the file whole from Changes, or, for a path in conflict, to resolve it in the merge
    // editor. What the actions do is the pane's: this reports presses.

    import DiffEditor from '$lib/ui/controls/editor/DiffEditor.svelte';
    import type {
        DiffCommand,
        DiffHandle,
        DiffSelections,
        EditorAction
    } from '$lib/ui/controls/editor/types';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        CONTEXT,
        chosenRows,
        endingsOnly,
        gitLineCount,
        hunkHead,
        hunkRows,
        hunksOf,
        type ChosenRows,
        type DiffActions,
        type Hunk,
        type LineChange
    } from '$lib/state/sources/repositories/diff-hunks';
    import type { PatchMode } from '$lib/state/sources/repositories/diff-patch';
    import type { DiffMode, DiffSides } from '$lib/state/sources/repositories/repositories';
    import { languageOf } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        file: DiffSides;
        /** This file's place among the pane's files, which its bars' ids carry. */
        index: number;
        /** The file's key among the pane's files: its path, and its place for a repeated path. */
        key: string;
        /** A name unique to the pane instance and this file, which names the editor's models. */
        model: string;
        mode: DiffMode;
        look: string;
        /** Whether the diff holds several files: the editor grows to its content and waits. */
        several: boolean;
        /** Whether to draw the path above the file. */
        headed: boolean;
        /** The pane's scrolled box, which the section's nearness is read against. */
        scroller: HTMLElement | undefined;
        view: object | null;
        /** The actions the file allows, or `read` for a diff nothing may act on. */
        actions: DiffActions | 'read';
        /** Whether the file's path is in conflict, which is settled in the merge editor. */
        conflicted?: boolean;
        staged: boolean;
        busy: boolean;
        /** The hunk the pane is at, by its place in this file, or -1. */
        current: number;
        onchanges: (changes: LineChange[]) => void;
        onview: (view: object) => void;
        onactions: (actions: EditorAction[]) => void;
        onact: (changes: LineChange[], rows: ChosenRows, mode: PatchMode, count: number) => void;
    };

    let {
        file,
        index,
        key,
        model,
        mode,
        look,
        several,
        headed,
        scroller,
        view,
        actions,
        conflicted = false,
        staged,
        busy,
        current,
        onchanges,
        onview,
        onactions,
        onact
    }: Props = $props();

    let section: HTMLElement | undefined = $state();
    let editor: DiffHandle | undefined = $state();
    let near = $state(false);
    let changes: LineChange[] = $state([]);
    let selections: DiffSelections = $state({ original: [], modified: [] });

    const path = $derived(file.newPath === '' ? file.oldPath : file.newPath);
    const equal = $derived(!file.binary && file.original === file.modified);
    const endings = $derived(endingsOnly(file));
    const drawn = $derived(!several || near);
    const hunks = $derived(hunksOf(changes));
    const bars = $derived(
        hunks.map((hunk, at) => ({ id: String(at), after: hunk.modified.from - 1 }))
    );
    const lines = $derived(Math.max(gitLineCount(file.original), gitLineCount(file.modified)));

    // A section of a long list is made when it first comes within a screen of the view.
    $effect(() => {
        const box = section;
        if (!several || near || box === undefined) return;
        const seen = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                near = true;
                seen.disconnect();
            },
            { root: scroller ?? null, rootMargin: '100% 0px' }
        );
        seen.observe(box);
        return () => seen.disconnect();
    });

    function changed(next: LineChange[]): void {
        changes = next;
        onchanges(next);
    }

    /** Bring the section into view, which makes its editor, and a hunk's first line with it. */
    export function reveal(hunk: number): void {
        near = true;
        section?.scrollIntoView({ block: 'nearest' });
        const target = hunks.at(hunk);
        if (target === undefined) return;
        editor?.perform({ kind: 'reveal', line: target.modified.from });
        queueMicrotask(() => {
            section?.ownerDocument
                .querySelector(`[data-hunk-id="${String(index)}:${String(hunk)}"]`)
                ?.scrollIntoView({ block: 'center' });
        });
    }

    /** Run a palette action on this file's editor. */
    export function perform(command: DiffCommand): void {
        editor?.perform(command);
    }

    /** The rows the selections choose in a hunk, and how many selected lines they came from. */
    function pickedIn(hunk: Hunk): { rows: ChosenRows; count: number } {
        if (actions !== 'lines') return { rows: { removed: [], added: [] }, count: 0 };
        const rows = chosenRows(hunk, selections.modified, selections.original);
        const added = chosenRows(hunk, selections.modified, []).added.length;
        const removed = chosenRows(hunk, [], selections.original).removed.length;
        return { rows, count: added + removed };
    }

    function headOf(hunk: Hunk): string {
        const head = hunkHead(hunk, gitLineCount(file.original), gitLineCount(file.modified));
        return t(
            'repositories.hunk_head',
            head.oldStart,
            head.oldCount,
            head.newStart,
            head.newCount
        );
    }

    function act(hunk: Hunk, doing: PatchMode): void {
        const picked = pickedIn(hunk);
        const rows = picked.count > 0 ? picked.rows : hunkRows(hunk);
        onact(changes, rows, doing, picked.count);
    }
</script>

{#snippet hunkBar(id: string)}
    {@const at = Number(id)}
    {@const hunk = hunks.at(at)}
    {#if hunk !== undefined}
        {@const count = pickedIn(hunk).count}
        <div
            class="hunk"
            class:current={at === current}
            data-hunk={at}
            data-hunk-id={`${index}:${id}`}
        >
            <span class="head">{headOf(hunk)}</span>
            {#if actions === 'none'}
                <span class="whole"
                    >{conflicted
                        ? t('repositories.diff_conflicted')
                        : t('repositories.diff_whole')}</span
                >
            {:else if actions !== 'read' && staged}
                <ToolButton
                    label={count > 0
                        ? t('repositories.lines_unstage', count)
                        : t('repositories.hunk_unstage')}
                    glyph="collapse"
                    disabled={busy}
                    onclick={() => act(hunk, 'unstage')}
                />
            {:else if actions !== 'read'}
                <ToolButton
                    label={count > 0
                        ? t('repositories.lines_stage', count)
                        : t('repositories.hunk_stage')}
                    glyph="expand"
                    disabled={busy}
                    onclick={() => act(hunk, 'stage')}
                />
                <ToolButton
                    label={count > 0
                        ? t('repositories.lines_revert', count)
                        : t('repositories.hunk_revert')}
                    glyph="note_back"
                    disabled={busy}
                    onclick={() => act(hunk, 'revert')}
                />
            {/if}
        </div>
    {/if}
{/snippet}

<section
    class="file"
    class:several
    bind:this={section}
    data-diff-file={path}
    data-diff-key={key}
    data-mode={mode}
    style:--lines={lines}
>
    {#if headed}
        <p class="path">{path}</p>
    {/if}
    {#if endings}
        <p class="note">{t('repositories.diff_eol_only')}</p>
    {/if}
    {#if file.binary}
        <p class="note">{t('repositories.diff_binary')}</p>
    {:else if equal}
        <pre class="heads">{file.head.join('\n')}</pre>
    {:else if drawn}
        <div class="editor">
            <DiffEditor
                bind:this={editor}
                original={file.original}
                modified={file.modified}
                language={languageOf(path)}
                {model}
                {path}
                originalPath={file.oldPath === '' ? path : file.oldPath}
                {mode}
                context={CONTEXT}
                hideUnchanged={!endings}
                {look}
                sized={several}
                {view}
                {bars}
                bar={hunkBar}
                onchanges={changed}
                onselect={(next: DiffSelections) => (selections = next)}
                {onview}
                {onactions}
            />
        </div>
    {:else}
        <div class="waiting"></div>
    {/if}
</section>

<style>
    .file {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        font-size: var(--fs-sm);
    }

    .file.several {
        height: auto;
    }

    .editor {
        flex: 1 1 auto;
        min-height: 0;
    }

    /* A file not drawn yet holds the height its lines will take, so the list keeps its length. */
    .waiting {
        height: calc(var(--lines) * 1.45em);
    }

    .path {
        margin: 8px 0 2px;
        font-weight: 600;
    }

    .note,
    .heads {
        margin: 2px 0;
        color: var(--muted-txt, var(--muted));
    }

    .heads {
        font-family: var(--font-mono);
        white-space: pre-wrap;
    }

    .hunk {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 1px 6px;
        border-top: 1px solid var(--line);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    .hunk.current {
        border-top-color: var(--accent);
    }

    .hunk .head {
        margin-right: auto;
        font-family: var(--font-mono);
    }

    :global(body.wall) .hunk {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
    }
</style>
