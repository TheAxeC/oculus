<script module lang="ts">
    // Layer 3, view registration. A source file opens from another view and is not listed.
    import { z } from 'zod';
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    /** The line a tab was opened at: a finite number above zero, and 0 for anything else. */
    const openedAtShape = z.object({ line: z.number().positive().catch(0) });

    export const registration: ViewRegistration = {
        id: 'source',
        label: 'views.source',
        glyph: 'views.source_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One local text file as a tab: every text file of the file browser opens here.
    // It reads once through api/file, asks api/source whether this machine's mode lets it be
    // written, keeps working and saved copies in its instance's ui state across tab switches, and
    // writes through api/source.
    //
    // A file it holds but may not write is drawn by the code window under a line saying why, rather
    // than by an editor that would take typing and refuse every save: a file this machine's mode
    // locks, and a file too long to have been read whole, where writing the copy back would take
    // the rest of the file off the disk.
    //
    // A keystroke keeps a preview tab. A file opened by a single click is the tab the next single
    // click replaces, and typing into it is a reader saying they are working in it.
    //
    // The tab's controls are on the pane's header and bar. The header holds the icon actions: Save
    // and Revert, drawn while the text may be written, then the star,
    // `shared/links/BookmarkStar.svelte`, which the file view draws too, so a reader bookmarks the
    // file in front of them whichever of the two tabs is showing it, and, for a file whose
    // extension `open.program_ext` names an application for, such as a `.rtf` whose bytes are
    // text, `shared/links/ProgramButton.svelte`, the control the file view draws. The bar holds the
    // toggles (the rendered half of a Markdown file and Blame) and, at its end, the save outcome
    // and what a refused bookmark write or open said. The editor below draws no bar of its own. A
    // file that could not be read is the message box with a control that reads it again.
    //
    // What the status bar draws for the tab is published from here to the editor status store,
    // keyed by the instance, while the tab is mounted: the caret the editor reports, the
    // indentation (the one chosen from the bar, or the file's own), the line ending of the text,
    // the language (the one chosen from the bar, or the file name's), whether the file may be
    // written, and the editor's actions the palette lists. What the bar and the palette ask of the
    // tab is performed here once per ask: an indentation and a language are kept with the draft and
    // handed to the editor, and a line to go to, a conversion of the indentation, a line ending and
    // an editor action are performed by the editor on its model (Editor.svelte's `perform`). A
    // rewrite of the text is an edit like typing, handed back as one and unsaved until Save. The
    // editor keeps the text in the line ending it was opened in, so typing into a CRLF file is kept
    // in CRLF.
    //
    // For a file in a repository the gutter carries VS Code's quick diff marks against the index,
    // and the bar's Blame toggle, kept with the draft, adds each line's blame to it and the caret
    // line's blame to the status bar. Both are read from GET /api/git for the repository holding
    // the file, again whenever the repository's state on the `git` channel moves and after every
    // save, and a press on a mark opens the file's diff at its change while a press on a line's
    // blame opens its commit in the Repositories view's graph. The editor draws them as its own
    // decorations; the code window draws them with Gutter.svelte.

    import { onDestroy, untrack } from 'svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import BookmarkStar from '../../shared/links/BookmarkStar.svelte';
    import ProgramButton from '../../shared/links/ProgramButton.svelte';
    import Code from '../../shared/code/Code.svelte';
    import Editor from './Editor.svelte';
    import Gutter from './Gutter.svelte';
    import { readAs, readJson } from '$lib/data/shapes/shapes';
    import { languageOf, opensInProgram } from '$lib/state/sources/fs';
    import { listOf } from '$lib/state/sources/repositories/answers';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import {
        blameRows,
        blameStatus,
        markWords,
        marksByLine,
        repoOfFile,
        type RepoFile
    } from '$lib/state/sources/repositories/file-git';
    import {
        blameUrl,
        marksUrl,
        type GitBlameLine,
        type GitLineMark
    } from '$lib/state/sources/repositories/repositories';
    import {
        START,
        detectIndent,
        lineCount,
        lineEnding,
        type Caret
    } from '$lib/state/workbench/navigation/editor-text';
    import type { EditorAction } from '$lib/state/workbench/navigation/editor-status.svelte';
    import type { EditorBlame, EditorMark } from '$lib/ui/controls/editor/gutter';
    import type { EditorHandle } from '$lib/ui/controls/editor/types';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        editorStatus: { asked, forget, publish },
        fs: { workspaces },
        layout: { keepPreview },
        repositories,
        selectors: { gitFor, gitRoots, languages, programApps },
        source: {
            revertSourceDraft,
            editSourceDraft,
            loadSourceDraft,
            saveSourceDraft,
            setSourceIndent,
            setSourceLanguage,
            toggleSourceRendered,
            toggleSourceBlame,
            sourceDraft
        }
    } = useState();

    let { instance }: ViewProps = $props();

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));
    /** The line the tab was opened at, and zero for one opened at the file itself. */
    const line = $derived(readAs(openedAtShape, instance.state)?.line ?? 0);
    const title = $derived(label === '' ? t('views.source') : label);
    const draft = $derived(sourceDraft(instance.id));
    const blocked = $derived(root === '' || path === '');
    /** What the star or the program control was refused with, or the empty string. */
    let said = $state('');
    const error = $derived(blocked ? t('source.cannot_open', path) : draft.error);
    /** The line a tab that may not write its file draws, and the empty string for one that may. */
    const locked = $derived(
        draft.readonly ? t('source.readonly') : draft.truncated ? t('source.truncated') : ''
    );
    /** Whether the editor is drawn, which is when the text controls have text to act on. */
    const editing = $derived(error === '' && draft.loaded && locked === '');
    /** The language the tab paints in: the one chosen from the status bar, or the name's. */
    const language = $derived(
        draft.language === '' ? languageOf(path, languages()) : draft.language
    );
    /** The indentation Tab inserts: the one chosen from the status bar, or the file's own. */
    const indent = $derived(draft.indent ?? detectIndent(draft.text));
    const ending = $derived(lineEnding(draft.text));
    /** Whether the file has a rendered half, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');

    /** The repository holding the file and its path there, or null for a file in none. */
    const inRepo = $derived.by<RepoFile | null>(() => {
        if (blocked) return null;
        const served = workspaces().workspaces.flatMap((workspace) => workspace.roots);
        const repos = gitRoots().filter((one) => {
            const held = gitFor(one);
            return held !== null && held.repository && held.error === null;
        });
        return repoOfFile(served, { root, path }, repos);
    });
    /** The repository's state, whose every move is a new read of the gutter. */
    const repoState = $derived(inRepo === null ? null : gitFor(inRepo.root));
    /** The quick diff marks against the index, as the last read gave them. */
    let marks: GitLineMark[] = $state([]);
    /** Each line's blame while blame is on, and null while it is off or not read yet. */
    let blame = $state<GitBlameLine[] | null>(null);
    /** The moment the blame was read, which "how long ago" is counted from. */
    let readAt = $state(Date.now());
    /** How far the text is scrolled, which the gutter follows. */
    let top = $state(0);
    /** Each gutter read takes the next number, and only the newest may write what it read. */
    let reads = 0;
    const lines = $derived(lineCount(draft.text));
    const markMap = $derived(marksByLine(marks, lines));
    const blameMap = $derived(new Map((blame ?? []).map((one) => [one.line, one])));
    /** The quick diff marks as the editor draws them, each with the words its hover says. */
    const editorMarks = $derived<EditorMark[]>(
        marks.map((mark) => ({ ...mark, words: markWords({ kind: mark.kind, start: mark.line }) }))
    );
    /** The blame as the editor's line-number column draws it, none while blame is off. */
    const editorBlame = $derived<EditorBlame[]>(
        draft.blame && blame !== null ? blameRows(blame, readAt) : []
    );

    /** Where the editor's caret is, as it last reported. */
    let caret: Caret = $state(START);
    /** The editor, which performs the asks that act on its model. */
    let editor: EditorHandle | undefined = $state();
    /** The editor's actions the palette lists, as the editor labelled them once it loaded. */
    let actions: EditorAction[] = $state([]);
    /** The last ask of this instance already performed, so a remount does not perform it again. */
    let performed = untrack(() => asked(instance.id)?.seq ?? 0);

    // What the status bar draws for this tab, said again whenever any of it changes. A tab with no
    // text yet says nothing, so the bar draws no source items over a tab still reading.
    $effect(() => {
        const id = instance.id;
        if (error !== '' || !draft.loaded) {
            forget(id);
            return;
        }
        publish(id, {
            caret: editing ? caret : null,
            lines: lineCount(draft.text),
            indent,
            ending,
            language,
            writable: editing,
            blame: draft.blame ? blameStatus(blameMap.get(caret.line), readAt) : '',
            actions: editing ? actions : []
        });
    });

    // The gutter follows the repository and the file on disk: a new state on the channel, a save,
    // and the blame turned on each read it again.
    $effect(() => {
        // The saved text is read only so that a save reads the gutter again.
        const [file, moved, on] = [inRepo, repoState, draft.blame, draft.saved];
        if (file === null || moved === null || !draft.loaded) {
            reads += 1;
            marks = [];
            blame = null;
            return;
        }
        untrack(() => void readGutter(file, on));
    });

    /** Read one of the gutter's answers: its status and body, and a refusal when the read threw. */
    async function readOne(url: string): Promise<{ ok: boolean; body: unknown }> {
        try {
            const response = await fetch(url);
            return { ok: response.ok, body: await readJson(response) };
        } catch {
            return { ok: false, body: undefined };
        }
    }

    async function readGutter(file: RepoFile, on: boolean): Promise<void> {
        reads += 1;
        const mine = reads;
        const [marked, blamed] = await Promise.all([
            readOne(marksUrl(file.root, file.path)),
            on ? readOne(blameUrl(file.root, file.path)) : null
        ]);
        if (mine !== reads) return;
        marks = listOf(marked.ok, marked.body, 'marks');
        blame = blamed === null ? null : listOf(blamed.ok, blamed.body, 'lines');
        readAt = Date.now();
    }

    /** Open the file's diff at a change its gutter marks, as VS Code's gutter press peeks it. */
    function openMark(line: number): void {
        if (inRepo === null) return;
        repositories.openDiff(
            { root: inRepo.root, path: inRepo.path, staged: false, worktree: false, line },
            inRepo.path
        );
    }

    /** Open a blamed line's commit in the Repositories view's graph. */
    function openBlamed(line: GitBlameLine | undefined): void {
        if (inRepo === null || line === undefined || line.uncommitted) return;
        repositories.openCommit(inRepo.root, line.hash);
    }

    onDestroy(() => forget(instance.id));

    // An ask of the status bar, performed once on the draft.
    $effect(() => {
        const ask = asked(instance.id);
        if (ask === null || ask.seq === performed) return;
        performed = ask.seq;
        untrack(() => {
            const id = instance.id;
            if (ask.kind === 'commit') {
                openBlamed(blameMap.get(caret.line));
            } else if (ask.kind === 'language') {
                setSourceLanguage(id, ask.language);
            } else if (ask.kind === 'indent') {
                setSourceIndent(id, ask.indent);
            } else if (!editing) {
                return;
            } else if (ask.kind === 'convert') {
                setSourceIndent(id, { tabs: ask.tabs, size: indent.size });
                editor?.perform(ask);
            } else {
                editor?.perform(ask);
            }
        });
    });

    $effect(() => {
        if (blocked) return;
        const id = instance.id;
        const fileRoot = root;
        const filePath = path;
        untrack(() => void loadSourceDraft(id, fileRoot, filePath));
    });

    async function save(): Promise<void> {
        await saveSourceDraft(instance.id, root, path);
    }

    /**
     * Typing is the reader working in this tab, so a preview tab becomes one that is kept. The
     * editor hands the text back in the line ending it holds it in.
     */
    function typed(value: string): void {
        keepPreview(instance.id);
        editSourceDraft(instance.id, value);
    }
</script>

{#snippet margin()}
    <Gutter
        {lines}
        {top}
        marks={markMap}
        blame={draft.blame ? blame : null}
        now={readAt}
        onmark={openMark}
        onblame={(line: GitBlameLine) => openBlamed(line)}
    />
{/snippet}

{#snippet tools()}
    <Toolbar label={t('source.toolbar')} overflow>
        {#if editing}
            <ToolButton bare label={t('editor.save')} glyph="check" onclick={() => void save()} />
            <ToolButton
                bare
                label={t('editor.revert')}
                glyph={t('editor.revert_glyph')}
                onclick={() => revertSourceDraft(instance.id)}
            />
        {/if}
        <BookmarkStar bare {root} {path} onsaid={(words: string) => (said = words)} />
        {#if !blocked && opensInProgram(path, programApps())}
            <ProgramButton bare {root} {path} onsaid={(words: string) => (said = words)} />
        {/if}
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('source.bar')}>
        {#if editing && markdown}
            <Chip
                label={t('source.preview')}
                title={t('source.preview_title')}
                glyph={t('source.preview_glyph')}
                pressed={draft.rendered}
                onclick={() => toggleSourceRendered(instance.id)}
            />
        {/if}
        {#if inRepo !== null && draft.loaded}
            <Chip
                label={t('source.blame')}
                title={t('source.blame_title')}
                glyph="blame"
                pressed={draft.blame}
                onclick={() => toggleSourceBlame(instance.id)}
            />
        {/if}
    </Toolbar>
    {#if editing && draft.message !== ''}
        <span class="message" aria-live="polite">
            {#if draft.failed}
                <Glyph name="cross" />
            {/if}
            {draft.message}
        </span>
    {/if}
    {#if said !== ''}
        <span class="refused" role="alert">{said}</span>
    {/if}
{/snippet}

{#snippet again()}
    <ToolButton
        small
        label={t('source.retry')}
        onclick={() => void loadSourceDraft(instance.id, root, path)}
    />
{/snippet}

<Pane {title} toolbar={tools} {bar}>
    <div class="source" data-instance={instance.id} data-root={root} data-path={path}>
        {#if error !== ''}
            <Empty error message={error} action={blocked ? undefined : again} />
        {:else if !draft.loaded}
            <Empty message={t('app.waiting')} glyph="edit" />
        {:else if locked !== ''}
            <p class="locked" data-source-locked={path}>
                <Glyph name={t('source.locked_glyph')} />
                {locked}
            </p>
            <Code
                text={draft.text}
                {language}
                {path}
                gutter={margin}
                onscrolled={(next: number) => (top = next)}
            />
        {:else}
            <Editor
                bind:this={editor}
                {path}
                {line}
                {language}
                {indent}
                {ending}
                instance={instance.id}
                text={draft.text}
                rendered={draft.rendered}
                marks={editorMarks}
                blame={editorBlame}
                oninput={typed}
                oncaret={(at: Caret) => (caret = at)}
                onmark={(mark: EditorMark) => openMark(mark.line)}
                onblame={(row: EditorBlame) => openBlamed(blameMap.get(row.line))}
                onactions={(offered: EditorAction[]) => (actions = offered)}
            />
        {/if}
    </div>
</Pane>

<style>
    .source {
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        height: 100%;
        min-height: 0;
    }

    /* A tab drawing the line and the window is two rows: the line takes what it needs. */
    .source:has(.locked) {
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
    }

    /* The save outcome: status words at the end of the bar. */
    .message {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* What a refused bookmark write or open said: alert words at the end of the bar. */
    .refused {
        margin-left: auto;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }

    .message ~ .refused {
        margin-left: 0;
    }

    .locked {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
