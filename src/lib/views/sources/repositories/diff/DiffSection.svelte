<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/Diff.svelte. One file of a diff: its
    // header row (diff/FileHeader.svelte) above it when the diff holds several or is not a file's
    // own, and Monaco's diff editor over its two versions
    // (ui/controls/editor/diff/DiffEditor.svelte), drawing git's line changes where the file
    // carries them. A folded file draws its header alone. The editor hides the unchanged runs, or
    // draws them all, as the pane says. A binary file is a note, and a file whose two texts are
    // equal (a rename or a mode change alone, a new empty file) is git's head lines for it. A file
    // whose line endings alone changed says so at its head and shows all its lines, and a file
    // whose type changed says which side is which type.
    //
    // In a diff of several files the section's editor is made when the section first comes within
    // one screen of the pane's view, since each is two editors, and until then the section holds
    // the height of its lines. Each such editor grows to its content, so the pane scrolls one list.
    // A change the pane asks this section to bring into view while its editor is not there (the
    // file is folded, or not made yet) is kept and brought into view once the editor reports its
    // changes.
    //
    // Above each hunk (the editor's line changes as git groups them, git's own hunk for a file git
    // diffed, state/sources/repositories/diff/diff-hunks.ts) is a bar (diff/HunkBar.svelte) with
    // its head as git writes it and the actions the file allows: Stage Block and Revert Block, or
    // Unstage Block in a staged diff, each over the rows the selections choose in that hunk while
    // they choose any. Where a partial patch cannot be built the bar says to act on the file whole
    // from Changes, or, for a path in conflict, to resolve it in the merge editor. The bar draws
    // its buttons as glyphs while the editor leaves it too little width for their words. What the
    // actions do is the pane's: this reports presses. A diff against the original an app's source
    // control gives (`source`) puts the actions of the app's `scm/change/title` menu in each bar
    // (apps/change-offers.svelte.ts), and pressing one runs its command in the app's host with the
    // file, the diff's changes and the hunk's first change as the index. Bars sit after lines of
    // either side: the hunk bars of the modified side, and the comment box.
    //
    // A file's own diff opened for a session that the sessions payload still holds takes a comment
    // on a line of either side (the editor's `+` or Add Comment on Line): the box opens after that
    // line, holds the comment as the section's draft (comment-draft.svelte.ts), and sends it to
    // the session through state/sources/repositories/review-comment.ts. One box per section; a
    // second line moves it and keeps the draft, Escape closes it keeping the draft, and Cancel
    // drops the draft. A commit, stash, worktree, compare or group diff, and a session the payload
    // no longer holds, offer none.

    import DiffEditor from '$lib/ui/controls/editor/diff/DiffEditor.svelte';
    import type {
        DiffCommand,
        DiffHandle,
        DiffSelections,
        EditorAction
    } from '$lib/ui/controls/editor/types';
    import CommentBox from './CommentBox.svelte';
    import { CommentDraft } from './comment-draft.svelte';
    import FileHeader from './FileHeader.svelte';
    import HunkBar from './HunkBar.svelte';
    import { createChangeOffers } from '../apps/change-offers.svelte';
    import {
        createSourceOptions,
        diffOptions
    } from '$lib/views/shared/prose/editor/source-options';
    import { diffLanguage } from '$lib/views/shared/prose/editor/lsp';
    import {
        CONTEXT,
        chosenRows,
        endingsOnly,
        gitLineCount,
        hunkRows,
        hunksOf,
        revealAsked,
        revealDue,
        type ChosenRows,
        type DiffActions,
        type Hunk,
        type LineChange
    } from '$lib/state/sources/repositories/diff/diff-hunks';
    import type { PatchMode } from '$lib/state/sources/repositories/diff/diff-patch';
    import {
        fileDeleted,
        typeChangeWords,
        type DiffMode,
        type DiffSides
    } from '$lib/state/sources/repositories/repositories';
    import {
        COMMENT_BAR,
        browserCopy,
        commentBars,
        commentTitle
    } from '$lib/state/sources/repositories/review-comment';
    import { languageOfFile } from '$lib/state/sources/fs';
    import { useState } from '$lib/state/client/use';
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
        codeTheme: string;
        /** Whether the diff holds several files: the editor grows to its content and waits. */
        several: boolean;
        /** Whether to draw the file's header row above it. */
        headed: boolean;
        /** Whether the header folds the file: the diff holds several. */
        foldable: boolean;
        /** Whether the file is folded, which draws its header and nothing else. */
        folded: boolean;
        /** Whether the editor hides the unchanged runs of the file. */
        unchanged: boolean;
        /** Whether the file is on disk, which the header's Open File opens. */
        openable: boolean;
        /** The old path of a rename the git state lists, for a file whose read shows it created. */
        from?: string;
        /** The root the file is read from; its `.oculus/settings.yml` sets the editor's options. */
        root?: string;
        /** The app source control whose original the diff compares with, when it does. */
        source?: { app: string; id: string };
        /** Whether the diff is the comparison of two files, whose header names both. */
        compare?: boolean;
        /** The pane's scrolled box, which the section's nearness is read against. */
        scroller: HTMLElement | undefined;
        view: object | null;
        /** The actions the file allows, or `read` for a diff nothing may act on. */
        actions: DiffActions | 'read';
        /** Whether the file's path is in conflict, which is settled in the merge editor. */
        conflicted?: boolean;
        staged: boolean;
        /** The id of the session this diff was opened for, the empty string for none. */
        session?: string;
        busy: boolean;
        /** The hunk the pane is at, by its place in this file, or -1. */
        current: number;
        /** Whether the modified side can be typed into, for the comparison of a save conflict. */
        editable?: boolean;
        /** The modified side's text as the reader changes it. */
        oninput?: (text: string) => void;
        onchanges: (changes: LineChange[]) => void;
        onview: (view: object) => void;
        onactions: (actions: EditorAction[]) => void;
        onact: (changes: LineChange[], rows: ChosenRows, mode: PatchMode, count: number) => void;
        /** The header's chevron folded or unfolded the file. */
        ontoggle: () => void;
        /** The header's Open File. */
        onopen: () => void;
    };

    let {
        file,
        index,
        key,
        model,
        mode,
        look,
        codeTheme,
        several,
        headed,
        foldable,
        folded,
        unchanged,
        openable,
        from = '',
        root = '',
        source,
        compare = false,
        scroller,
        view,
        actions,
        conflicted = false,
        staged,
        session = '',
        busy,
        current,
        editable = false,
        oninput,
        onchanges,
        onview,
        onactions,
        onact,
        ontoggle,
        onopen
    }: Props = $props();

    let section: HTMLElement | undefined = $state();
    let editor: DiffHandle | undefined = $state();
    let near = $state(false);
    let changes: LineChange[] = $state([]);
    /** Whether the editor now drawn has reported its changes; a fold removes the editor. */
    let reported = $state(false);
    /** The hunk a reveal asked for while the editor was not ready, done once it is. */
    let pending: number | null = null;
    let selections: DiffSelections = $state({ original: [], modified: [] });

    const client = useState();
    const {
        appShell,
        appTools,
        selectors: { editorOptions, languages, paintLimit, repoSettings, sessionById },
        terminals: { steerTerminal, terminalOfSession }
    } = client;

    /** The session record the diff was opened for, while the sessions payload holds it. */
    const record = $derived(sessionById(session));
    /** Whether a comment is offered: a file's own diff, opened for a session still held. */
    const commentable = $derived(record !== null && actions !== 'read');
    const who = $derived(record === null ? '' : commentTitle(record));
    const box = new CommentDraft({
        file: () => file,
        staged: () => staged,
        who: () => who,
        allowed: (side) => commentable && !(mode === 'inline' && side === 'original'),
        deps: () => ({
            terminal: () => terminalOfSession(sessionById(session)),
            steer: steerTerminal,
            copy: browserCopy()
        })
    });

    const path = $derived(file.newPath === '' ? file.oldPath : file.newPath);
    const equal = $derived(!file.binary && file.original === file.modified);
    const endings = $derived(endingsOnly(file));
    const drawn = $derived(!several || near);
    /** The path the file was renamed from, or the empty string for a file that was not. */
    const renamedFrom = $derived(
        file.oldPath !== '' && file.newPath !== '' && file.oldPath !== file.newPath
            ? file.oldPath
            : from
    );
    /** The word wrap and rulers of the file's language, as a source tab of it resolves them. */
    const resolved = createSourceOptions({
        path: () => path,
        root: () => root,
        draft: () => ({
            text: file.modified,
            saved: file.modified,
            language: '',
            indent: null,
            wrap: null
        }),
        languages,
        options: editorOptions,
        repoSettings,
        paintLimit,
        folders: () => client.fs.workspaces().folders
    });
    const options = $derived(diffOptions(resolved, editorOptions()));
    /**
     * The modified side of a diff of the working tree is the file on disk, which the language
     * server of the served root holding it is given, so hover, definitions and diagnostics answer
     * in the diff. The diff names the file by its repository's folder; the server names it by the
     * served root and the path under it, as a source tab of the file does.
     */
    const working = $derived(!staged && actions !== 'read' && openable && source === undefined);
    const language = $derived(languageOfFile(path, file.modified, languages()));
    const serverFile = $derived(
        working && !compare && root !== '' ? client.repositories.placeOf(root, path) : null
    );
    const extension = $derived(
        serverFile === null ? undefined : diffLanguage(client, model, language, serverFile)
    );
    /** Whether the header offers Open File: the file is on disk, which a deleted file is not. */
    const present = $derived(openable && !fileDeleted(file));
    const hunks = $derived(hunksOf(changes));
    const bars = $derived(
        commentBars(
            hunks.map((hunk, at) => ({ id: String(at), after: hunk.modified.from - 1 })),
            box.at
        )
    );
    const sideLines = $derived({
        original: gitLineCount(file.original),
        modified: gitLineCount(file.modified)
    });
    const lines = $derived(Math.max(sideLines.original, sideLines.modified));
    const turned = $derived(typeChangeWords(file, mode));

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

    // A folded file has no editor, so the next one starts without a report.
    $effect(() => {
        if (folded) reported = false;
    });

    function changed(next: LineChange[]): void {
        changes = next;
        reported = true;
        onchanges(next);
        const due = revealDue(pending);
        pending = due.pending;
        if (due.now !== null) place(due.now);
    }

    /**
     * Bring the section into view, which makes its editor, and a hunk's first line with it. A
     * folded section or one whose editor is not made or has not reported keeps the hunk and
     * brings it into view when the editor reports (`revealAsked`, `revealDue`).
     */
    export function reveal(hunk: number): void {
        near = true;
        section?.scrollIntoView({ block: 'nearest' });
        const asked = revealAsked(!folded && reported, hunk);
        pending = asked.pending;
        if (asked.now !== null) place(asked.now);
    }

    /** Bring one hunk of the drawn editor into view. */
    function place(hunk: number): void {
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

    /** The actions of the app's `scm/change/title` menu, for a diff against its original. */
    const offers = createChangeOffers({
        appShell,
        appTools,
        source: () => source,
        root: () => root,
        path: () => path,
        changes: () => changes
    });

    function act(hunk: Hunk, doing: PatchMode): void {
        const picked = pickedIn(hunk);
        const rows = picked.count > 0 ? picked.rows : hunkRows(hunk);
        onact(changes, rows, doing, picked.count);
    }
</script>

{#snippet lineBar(id: string)}
    {#if id === COMMENT_BAR}
        <CommentBox
            title={who}
            text={box.text}
            sending={box.sending}
            failure={box.failure}
            opened={box.opened}
            oninput={box.write}
            onsend={() => void box.send()}
            onclose={box.close}
            oncancel={box.drop}
        />
    {:else}
        {@const at = Number(id)}
        {@const hunk = hunks.at(at)}
        {#if hunk !== undefined}
            <HunkBar
                {hunk}
                sides={sideLines}
                {at}
                id={`${index}:${id}`}
                {actions}
                count={pickedIn(hunk).count}
                {conflicted}
                {staged}
                {busy}
                current={at === current}
                onact={(doing: PatchMode) => act(hunk, doing)}
                offered={offers.actions}
                onoffer={(pick: string, event: MouseEvent) =>
                    offers.offer(hunk, pick, event.altKey)}
            />
        {/if}
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
        <FileHeader
            {path}
            oldPath={compare ? '' : renamedFrom}
            against={compare ? file.oldPath : ''}
            {foldable}
            {folded}
            openable={present}
            {ontoggle}
            {onopen}
        />
    {/if}
    {#if !folded}
        {#if turned !== ''}
            <p class="note" data-type-change>{turned}</p>
        {/if}
        {#if endings}
            <p class="note">{t('repositories.diff_eol_only')}</p>
        {/if}
        {#if box.notice !== ''}
            <p class="note" role="status" data-comment-notice>{box.notice}</p>
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
                    {language}
                    {model}
                    {path}
                    originalPath={file.oldPath === '' ? path : file.oldPath}
                    changes={file.changes}
                    {mode}
                    context={CONTEXT}
                    hideUnchanged={unchanged && !endings}
                    {editable}
                    {oninput}
                    {look}
                    {codeTheme}
                    {options}
                    sized={several}
                    {view}
                    {bars}
                    bar={lineBar}
                    oncomment={commentable ? box.open : undefined}
                    commentLabel={t('sessions.comment_action')}
                    onchanges={changed}
                    onselect={(next: DiffSelections) => (selections = next)}
                    {onview}
                    {onactions}
                    {extension}
                />
            </div>
        {:else}
            <div class="waiting"></div>
        {/if}
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

    .note,
    .heads {
        margin: 2px 0;
        color: var(--muted-txt, var(--muted));
    }

    .heads {
        font-family: var(--font-mono);
        white-space: pre-wrap;
    }
</style>
