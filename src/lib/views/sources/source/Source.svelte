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
    // A tab over the file at HEAD or in the index (Open File (HEAD)) is read from the git route
    // and is never written: it is drawn as a locked file, has no gutter marks or blame, and carries
    // no bookmark or program control, since its root is a repository's own directory and not a
    // served root.
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
    // indentation in force, the line ending of the text, the language (the one chosen from the
    // bar, or the file name's), whether the file may be written, and the editor's actions the
    // palette lists. The indentation is the first of these that gives one: the one chosen from the
    // bar, the file's own when it indents, the record of the language in the root's
    // `.oculus/settings.yml`, then in `editor.languages`, then the global `editor.tab_size` and
    // `editor.insert_spaces`. The word wrap is the tab's Alt+Z choice, kept with the draft, else
    // the root's record, else `editor.languages`, else `editor.word_wrap`; the rulers come from the
    // records alone. All of them are resolved in views/shared/prose/source-options.ts and handed
    // to the editor as its options. What the bar and the palette ask of the tab is performed here
    // once per ask: an indentation, a language and a word wrap are kept with the draft and handed
    // to the editor, and a line to go to, a conversion of the indentation, a line ending and an
    // editor action are performed by the editor on its model (Editor.svelte's `perform`). A
    // rewrite of the text is an edit like typing, handed back as one and unsaved until Save. The
    // editor keeps the text in the line ending it was opened in, so typing into a CRLF file is kept
    // in CRLF.
    //
    // For a file in a repository the gutter carries VS Code's quick diff marks against the index,
    // and the bar's Blame toggle, kept with the draft, adds each line's blame to it and the caret
    // line's blame to the status bar. Both are read from GET /api/git for the repository holding
    // the file, again whenever the repository's state on the `git` channel moves and after every
    // save (a hidden tab reads again once, when it is shown), and a press on a mark opens the
    // file's diff at its change while a press on a line's blame opens its commit in the
    // Repositories view's graph. The editor draws them as its own decorations; the code window
    // draws them with Gutter.svelte.
    //
    // A Markdown or LaTeX file adds the headings of its text as document symbols (`symbols.ts`),
    // which sticky scroll pins at the top of the editor. A LaTeX file adds to its editor the
    // problems of its latest build as markers, the preview of math and pictures under the pointer
    // and Format Document (`latex-editor.ts`); a save of it builds its main file when
    // `latex.auto_build` says so (state/sessions/latex.svelte.ts).

    import { onDestroy, untrack } from 'svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import BookmarkStar from '../../shared/links/BookmarkStar.svelte';
    import ProgramButton from '../../shared/links/ProgramButton.svelte';
    import Code from '../../shared/prose/Code.svelte';
    import Editor from './Editor.svelte';
    import Gutter from './Gutter.svelte';
    import { latexEditor } from './latex-editor';
    import { createSourceGutter } from './source-gutter.svelte';
    import { createSourceOptions } from '$lib/views/shared/prose/source-options';
    import { symbolsExtension } from './symbols';
    import { readAs } from '$lib/data/shapes/shapes';
    import { opensInProgram } from '$lib/state/sources/fs';
    import { markdownOutline } from '$lib/state/sources/explorer/sections/outline';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { headOf } from '$lib/state/sessions/source.svelte';
    import {
        blameStatus,
        repoOfFile,
        wholePath,
        type RepoFile
    } from '$lib/state/sources/repositories/file-git';
    import type { GitBlameLine } from '$lib/state/sources/repositories/repositories';
    import {
        START,
        lineCount,
        lineEnding,
        type Caret
    } from '$lib/state/workbench/navigation/editor-text';
    import type { EditorAction } from '$lib/state/workbench/navigation/editor-status.svelte';
    import type { EditorBlame, EditorMark } from '$lib/ui/controls/editor/gutter/gutter';
    import type { EditorHandle } from '$lib/ui/controls/editor/types';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const client = useState();
    const {
        editorStatus: { asked, focus, forget, publish },
        fs: { fileText, workspaces },
        layout: { keepPreview },
        repositories,
        selectors: { editorOptions, gitFor, gitRoots, languages, paintLimit, programApps },
        source: {
            revertSourceDraft,
            editSourceDraft,
            loadSourceDraft,
            saveSourceDraft,
            setSourceIndent,
            setSourceLanguage,
            setSourceWrap,
            toggleSourceRendered,
            toggleSourceBlame,
            sourceDraft
        }
    } = client;

    let { instance }: ViewProps = $props();

    const root = $derived(instanceText(instance.state, 'root'));
    const path = $derived(instanceText(instance.state, 'path'));
    const label = $derived(instanceText(instance.state, 'label'));
    /** The version of the file the tab holds, when it is the file at HEAD or in the index. */
    const head = $derived(headOf(instance.state));
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
        head !== undefined
            ? head === 'head'
                ? t('source.head_locked')
                : t('source.index_locked')
            : draft.readonly
              ? t('source.readonly')
              : draft.truncated
                ? t('source.truncated')
                : ''
    );
    /** Whether the editor is drawn, which is when the text controls have text to act on. */
    const editing = $derived(error === '' && draft.loaded && locked === '');
    /** The indentation, word wrap and rulers of the tab, in the order `resolveEditor` states. */
    const options = createSourceOptions({
        path: () => path,
        root: () => root,
        draft: () => draft,
        languages,
        options: editorOptions,
        paintLimit,
        fileText
    });
    /** The language the tab paints in: the one chosen from the status bar, or the name's. */
    const language = $derived(options.language);
    /** The indentation Tab inserts: the tab's choice, the file's own, or the configured one. */
    const indent = $derived(options.indent);
    const ending = $derived(lineEnding(draft.text));
    /** What a LaTeX file adds to the editor: its build's markers, the preview and the formatter. */
    const extension = $derived(
        language === 'latex' && head === undefined
            ? latexEditor(client, { root, path }, (words: string) => (said = words))
            : language === 'markdown'
              ? symbolsExtension(markdownOutline)
              : undefined
    );
    /** Whether the file has a rendered half, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');

    /** The roots the file routes serve, which name a tab's file by a key and a path. */
    const served = $derived(workspaces().workspaces.flatMap((workspace) => workspace.roots));
    /** The absolute path of the file on disk, empty for a tab that shows no file on disk. */
    const wholeFile = $derived(
        blocked || head !== undefined ? '' : (wholePath(served, { root, path }) ?? '')
    );

    /** The repository holding the file and its path there, or null for a file in none. */
    const inRepo = $derived.by<RepoFile | null>(() => {
        if (blocked || head !== undefined) return null;
        const repos = gitRoots().filter((one) => {
            const held = gitFor(one);
            return held !== null && held.repository && held.error === null;
        });
        return repoOfFile(served, { root, path }, repos);
    });
    /** The repository's state, whose every move is a new read of the gutter. */
    const repoState = $derived(inRepo === null ? null : gitFor(inRepo.root));
    const gate = shownGate(useShown());
    /** The quick diff marks and the blame, read for a file in a repository. */
    const gutter = createSourceGutter({
        file: () => inRepo,
        repoState: () => repoState,
        loaded: () => draft.loaded,
        text: () => draft.text,
        saved: () => draft.saved,
        blameOn: () => draft.blame,
        gate
    });
    /** How far the text is scrolled, which the gutter follows. */
    let top = $state(0);
    const markMap = $derived(gutter.markMap);
    const blameMap = $derived(gutter.blameMap);

    /** Where the editor's caret is, as it last reported. */
    let caret: Caret = $state(START);
    /** The text selected in the editor, as it last reported. */
    let selection = $state('');
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
            blame: draft.blame ? blameStatus(blameMap.get(caret.line), gutter.readAt) : '',
            actions: editing ? actions : [],
            file: wholeFile,
            selection: editing ? selection : ''
        });
    });

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
        const stage = head;
        untrack(() => void loadSourceDraft(id, fileRoot, filePath, stage));
    });

    /** Alt+Z in the editor: the tab's word wrap toggled, kept with the draft. */
    function toggleWrap(): void {
        setSourceWrap(instance.id, options.toggled);
    }

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
        lines={gutter.lines}
        {top}
        marks={markMap}
        blame={gutter.blame}
        now={gutter.readAt}
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
        {#if head === undefined}
            <BookmarkStar bare {root} {path} onsaid={(words: string) => (said = words)} />
        {/if}
        {#if !blocked && head === undefined && opensInProgram(path, programApps())}
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
        onclick={() => void loadSourceDraft(instance.id, root, path, head)}
    />
{/snippet}

<Pane {title} toolbar={tools} {bar}>
    <!-- Focus in the tab makes it the source a command run from another view reads. -->
    <div
        class="source"
        data-instance={instance.id}
        data-root={root}
        data-path={path}
        onfocusin={() => focus(instance.id)}
    >
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
                wrap={options.wrap}
                rulers={options.rulers}
                ontogglewrap={toggleWrap}
                instance={instance.id}
                text={draft.text}
                rendered={draft.rendered}
                marks={gutter.editorMarks}
                blame={gutter.editorBlame}
                {extension}
                oninput={typed}
                oncaret={(at: Caret) => (caret = at)}
                onselect={(text: string) => (selection = text)}
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
