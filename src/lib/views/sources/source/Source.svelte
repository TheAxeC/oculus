<script module lang="ts">
    // Layer 3, view registration. A source file opens from another view and is not listed.
    import { z } from 'zod';
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    /** The line a tab was opened at: a finite number above zero, and 0 for anything else. */
    const openedAtShape = z.object({ line: z.number().positive().catch(0) });

    /** A tab over an untitled text: it names no file until its first Save gives it one. */
    const untitledShape = z.object({ untitled: z.literal(true) });

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
    // A file it holds but may not write is drawn under a line saying why. One too long to have been
    // read whole is drawn by the code window; one this machine's mode locks is drawn by the editor
    // in its read-only form, which a mode change toggles (save/locked-words.ts).
    //
    // A tab over the file at HEAD or in the index (Open File (HEAD)) is read from the git route
    // and is never written: it is drawn as a locked file, has no gutter marks, carries the blame
    // of that version (Toggle Blame is the one action it offers), and offers no preview, since its
    // root is a repository's own directory and not a served root.
    //
    // A keystroke keeps a preview tab: typing into the tab a single click opened, which the next
    // single click replaces, says the reader is working in it.
    //
    // The tab draws no title row and no row of controls: its path is the breadcrumb the pane draws
    // under the strip. It hands up to the pane through ui/tabs/tab-actions.svelte.ts its actions
    // for the right end of the breadcrumb bar (actions/BarActions.svelte): Save, Revert File, the
    // star, Open in Program, Open Preview, Open Preview to the Side, Submit Job and Toggle Blame,
    // each where it applies, and nothing for the tab row. Word wrap and the rendered half are the
    // palette's, which lists Save, Revert File, word wrap, the rendered half, Open Preview to the
    // Side, Submit Job and Toggle Blame while each applies (status/ask-perform.ts), and Cmd+S asks
    // the tab on screen to save. The save outcome and what the tab said stay under the editor
    // (save/SourceNote.svelte): an alert for a refusal, a status for Submit's progress. A file that
    // could not be read is the message box with a control that reads it again
    // (actions/read-again.ts), which opens what the file is when it is back as something other than
    // text. A file the route says is gone opens here too, so this is the tab that says it cannot be
    // opened.
    //
    // Submit Job, on a .slurm file on disk under a served root, saves the unsaved text, asks the
    // server for the plan, puts it to the reader as one confirm and on a yes runs it; the flow is
    // actions/submit-job.svelte.ts, its confirm is drawn by views/shared/writes/AskConfirm.svelte,
    // and the job is then shown in the Live HPC view.
    //
    // A tab over an untitled text (New Text File) holds an empty draft and no file. Its first Save
    // asks for a served root of the current workspace and a name, makes the file there, writes the
    // text to it and becomes a tab over that file.
    //
    // What the status bar draws for the tab is published from here to the editor status store,
    // keyed by the instance, while the tab is mounted: the caret the editor reports, the
    // indentation in force, the line ending of the text, the language (the one chosen from the
    // bar, or the file name's), whether the file may be written, and the editor's actions the
    // palette lists. The indentation, the word wrap (the tab's Alt+Z choice among them) and the
    // rulers are resolved in views/shared/prose/source-options.ts, in the order
    // data/helpers/editor.ts's `resolveEditor` states, and handed to the editor as its options.
    // What the bar and the palette ask of the tab is performed here once per ask: an indentation, a
    // language and a word wrap are kept with the draft and handed to the editor, and a line to go
    // to, a conversion of the indentation, a line ending and an editor action are performed by the
    // editor on its model (Editor.svelte's `perform`). A rewrite of the text is an edit like
    // typing, handed back as one and unsaved until Save. The editor keeps the text in the line
    // ending it was opened in, so typing into a CRLF file is kept in CRLF.
    //
    // For a file in a repository the gutter carries VS Code's quick diff marks against the index,
    // and Git: Toggle Git Blame Editor Decoration, kept with the draft, adds each line's blame to
    // it. The caret line's blame is in the status bar whether or not the decoration is on, as VS
    // Code's `git.blame.statusBarItem.enabled` is on by default. A tab over the file at HEAD or in
    // the index reads the blame of that version and no marks. They are read
    // (source-gutter.svelte.ts) again whenever the repository's state on the `git` channel moves
    // and after every save; a hidden tab reads again once, when it is shown. A press on a mark
    // opens the file's diff at its change and a press on a line's blame opens its commit in the
    // Repositories view's graph.
    //
    // What a language adds to the editor (Markdown headings, LaTeX's build, a language server's
    // registration and actions, and the format before a save when the language's `format_on_save`
    // is on) is made by language/tab-language.svelte.ts.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import { servedFile } from '$lib/views/shared/links/file-bar';
    import { ownListing } from '$lib/ui/controls/editor/chords';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import Editor from './Editor.svelte';
    import BarActions from './actions/BarActions.svelte';
    import Gutter from './Gutter.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import LockedCode from './save/LockedCode.svelte';
    import { createSaid } from './save/tab-said.svelte';
    import { lockedWords } from './save/locked-words';
    import SourceNote from './save/SourceNote.svelte';
    import { performAsk, tabActions } from './status/ask-perform';
    import { connectSourceStatus } from './status/source-status.svelte';
    import { createTabFile } from './status/tab-file.svelte';
    import { createSubmitJob, isJobScript } from './actions/submit-job.svelte';
    import ReadAgainButton from './actions/ReadAgainButton.svelte';
    import { createTabSave } from './save/tab-save.svelte';
    import { createTabLanguage } from './language/tab-language.svelte';
    import { createSourceGutter } from './source-gutter.svelte';
    import { createSourceOptions } from '$lib/views/shared/prose/source-options';
    import { readAs } from '$lib/data/shapes/shapes';
    import { markdownPreviewState, MARKDOWN_PREVIEW_VIEW } from '$lib/state/sources/fs';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { headOf } from '$lib/state/sessions/source.svelte';
    import { blameStatus } from '$lib/state/sources/repositories/file-git';
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
        editorStatus,
        explorer,
        fs: { fileText, roots: currentRoots, workspaces },
        hpc,
        layout: { keepPreview, openBeside, openView, restateInstance },
        repositories,
        selectors: { editorOptions, gitFor, gitRoots, languages, paintLimit, repoSettings },
        source: {
            revertSourceDraft,
            editSourceDraft,
            loadSourceDraft,
            loadUntitledDraft,
            saveSourceDraft,
            setSourceIndent,
            setSourceLanguage,
            setSourceWrap,
            setSourceFirst,
            toggleSourceRendered,
            toggleSourceBlame,
            sourceDirty,
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
    /** Whether the tab names no file: an untitled text, or a state that lost its address. */
    const blocked = $derived(root === '' || path === '');
    const untitled = $derived(readAs(untitledShape, instance.state) !== null);
    /** What the tab says under the editor: a refusal or Submit's status lines. */
    const note = createSaid();
    const error = $derived(blocked && !untitled ? t('source.cannot_open', path) : draft.error);
    /** The line a tab that may not write its file draws, and the empty string for one that may. */
    const lock = $derived(lockedWords(head, draft));
    /**
     * Whether the tab holds the file's text: read, and not refused since. A draft read once keeps
     * its text when a later read fails, so `draft.loaded` alone stays true for a file now gone.
     */
    const read = $derived(error === '' && draft.loaded);
    /** Whether the text may be written, which is when the text controls have text to act on. */
    const editing = $derived(read && lock.words === '');
    /** Whether the editor is drawn: the text may be written, or only the mode locks it. */
    const drawn = $derived(read && !lock.window);

    /** The save outcome the row under the editor shows, only while the text may be written. */
    const saveMessage = $derived(editing ? draft.message : '');
    /** Whether the row under the editor is drawn: a save outcome or a sentence the tab said. */
    const noted = $derived(saveMessage !== '' || note.words !== '');

    /** The indentation, word wrap and rulers of the tab, in the order `resolveEditor` states. */
    const options = createSourceOptions({
        path: () => path,
        root: () => root,
        draft: () => draft,
        languages,
        options: editorOptions,
        repoSettings,
        paintLimit,
        fileText
    });
    /** The language the tab paints in: the one chosen from the status bar, or the name's. */
    const language = $derived(options.language);
    /** The indentation Tab inserts: the tab's choice, the file's own, or the configured one. */
    const indent = $derived(options.indent);
    const ending = $derived(lineEnding(draft.text));
    /** What the language adds to the editor: LaTeX's build, Markdown's headings or a server. */
    const tabLanguage = createTabLanguage({
        client,
        instance: () => instance.id,
        language: () => language,
        shown: () => options.shown,
        root: () => root,
        path: () => path,
        version: () => head !== undefined,
        say: (words: string) => note.say(words)
    });
    /** Whether the file has a rendered half, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');
    /** Where the file is on disk and in which repository, and what that allows the tab. */
    const file = createTabFile({
        workspaces,
        gitRoots,
        gitFor,
        root: () => root,
        path: () => path,
        head: () => head,
        blocked: () => blocked,
        read: () => read,
        markdown: () => markdown
    });
    /** The tab's Save, and the question the first Save of an untitled text asks. */
    const tabSave = createTabSave({
        get id() {
            return instance.id;
        },
        untitled: () => untitled,
        root: () => root,
        path: () => path,
        title: () => title,
        roots: currentRoots,
        create: explorer.create,
        saveDraft: saveSourceDraft,
        prepare: () => (options.formatOnSave ? tabLanguage.lsp.formatForSave() : Promise.resolve()),
        restate: restateInstance,
        said: (words) => note.say(words)
    });
    /** Whether the tab is a .slurm job script on disk under a served root, which Submit acts on. */
    const submittable = $derived(
        isJobScript(path) && servedFile(currentRoots(), root, path, file.onDisk)
    );
    /** Submit on the job script: the press that saves, asks and runs, and the confirm it holds. */
    const submit = createSubmitJob({
        root: () => root,
        path: () => path,
        unsaved: () => sourceDirty(instance.id),
        save: () => tabSave.save(),
        said: note.say,
        hpc,
        openView
    });
    const gate = shownGate(useShown());
    /** The quick diff marks and the blame, read for a file in a repository once its text is. */
    const gutter = createSourceGutter({
        file: () => (read ? file.inRepo : null),
        stage: () => head,
        repoState: () => file.repoState,
        repositories,
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
    /** The editor's own actions the palette lists, as it labelled them once it loaded. */
    let actions: EditorAction[] = $state([]);
    /** The tab's actions that apply now: Save, Revert, word wrap, the rendered half, Blame. */
    const own = $derived(
        tabActions({
            editing,
            markdown,
            previewable: file.previewable,
            blameable: file.blameable,
            submittable,
            save: () => void tabSave.save(),
            revert: () => revertSourceDraft(instance.id),
            toggleWrap,
            toggleRendered: () => toggleSourceRendered(instance.id),
            submit: () => void submit.press(),
            previewSide: () => openBeside(MARKDOWN_PREVIEW_VIEW, markdownPreviewState(root, path)),
            toggleBlame: () => toggleSourceBlame(instance.id),
            language: drawn ? tabLanguage.lsp.actions(options.shown, { root, path }) : []
        })
    );
    /** What the palette lists: the tab's actions, then the editor's while it is drawn. */
    const listed = $derived([
        ...ownListing(own, onMac()),
        ...(drawn ? actions.filter((one) => !own.some((mine) => mine.id === one.id)) : [])
    ]);
    // What the status bar draws for this tab, said again whenever any of it changes, and the asks
    // of the bar and the palette. A tab with no text yet says nothing, so the bar draws no source
    // items over a tab still reading, and a tab whose indentation is not known yet (the
    // configuration has not arrived) says nothing either.
    connectSourceStatus({
        store: editorStatus,
        id: () => instance.id,
        status: () =>
            error !== '' || !draft.loaded || indent === null
                ? null
                : {
                      caret: drawn ? caret : null,
                      lines: lineCount(draft.text),
                      indent,
                      ending,
                      language,
                      writable: editing,
                      blame: editing ? blameStatus(blameMap.get(caret.line), gutter.readAt) : '',
                      actions: listed,
                      file: file.wholeFile,
                      selection: drawn ? selection : '',
                      served: tabLanguage.lsp.served(options.shown, { root, path }, drawn)
                  },
        perform: (ask) =>
            performAsk(ask, {
                editing,
                drawn,
                indent,
                editor,
                actions: own,
                openCommit: () => gutter.openBlamed(blameMap.get(caret.line)),
                setLanguage: (next) => setSourceLanguage(instance.id, next),
                setIndent: (next) => setSourceIndent(instance.id, next),
                select: tabLanguage.lsp.select
            })
    });

    // The bar's actions go up to the pane while the tab is mounted and one of them applies
    // (ui/tabs/tab-actions.svelte.ts).
    handUp(
        useTabActions(),
        () => instance.id,
        barActions,
        () =>
            editing ||
            file.previewable ||
            file.blameable ||
            servedFile(currentRoots(), root, path, file.onDisk)
    );

    $effect(() => {
        const id = instance.id;
        if (untitled) untrack(() => loadUntitledDraft(id));
        if (blocked) return;
        const fileRoot = root;
        const filePath = path;
        const stage = head;
        untrack(() => void loadSourceDraft(id, fileRoot, filePath, stage));
    });

    /** Alt+Z in the editor: the tab's word wrap toggled, kept with the draft. */
    function toggleWrap(): void {
        setSourceWrap(instance.id, options.toggled);
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
        onmark={gutter.openMark}
        onblame={gutter.openBlamed}
    />
{/snippet}

<!-- The tab's actions for the right end of the breadcrumb bar. -->
{#snippet barActions()}
    <BarActions
        id={instance.id}
        {root}
        {path}
        onDisk={file.onDisk}
        {editing}
        previewable={file.previewable}
        blameable={file.blameable}
        {submittable}
        submitting={submit.busy}
        onsave={() => void tabSave.save()}
        onsubmit={() => void submit.press()}
    />
{/snippet}

{#snippet again()}
    <ReadAgainButton
        tab={{ id: instance.id, preview: instance.preview === true, root, path, head }}
    />
{/snippet}

<Pane {title} titled={false}>
    <!-- Focus in the tab makes it the source a command run from another view reads. -->
    <div
        class="source"
        class:lined={lock.words !== '' && error === '' && draft.loaded}
        class:noted
        data-instance={instance.id}
        data-root={root}
        data-path={path}
        onfocusin={() => editorStatus.focus(instance.id)}
    >
        {#if error !== ''}
            <div data-tab-focus tabindex="-1">
                <Empty error message={error} action={blocked ? undefined : again} />
            </div>
        {:else if !draft.loaded}
            <Empty message={t('app.waiting')} glyph="edit" />
        {:else}
            {#if lock.words !== ''}
                <LockedCode
                    {lock}
                    text={draft.text}
                    {language}
                    {path}
                    gutter={margin}
                    onscrolled={(next: number) => (top = next)}
                />
            {/if}
            {#if !lock.window}
                <Editor
                    bind:this={editor}
                    {path}
                    {line}
                    first={draft.first}
                    onfirst={(shown: number) => setSourceFirst(instance.id, shown)}
                    {language}
                    {indent}
                    {ending}
                    wrap={options.wrap}
                    rulers={options.rulers}
                    actions={own}
                    instance={instance.id}
                    text={draft.text}
                    rendered={draft.rendered}
                    marks={gutter.editorMarks}
                    blame={gutter.editorBlame}
                    extension={tabLanguage.extension}
                    writable={lock.words === ''}
                    oninput={typed}
                    oncaret={(at: Caret) => (caret = at)}
                    onselect={(text: string) => (selection = text)}
                    onmark={(mark: EditorMark) => gutter.openMark(mark.line)}
                    onblame={(row: EditorBlame) => gutter.openBlamed(blameMap.get(row.line))}
                    onactions={(offered: EditorAction[]) => (actions = offered)}
                />
            {/if}
        {/if}
        {#if noted}
            <SourceNote
                message={saveMessage}
                failed={draft.failed}
                said={note.words}
                tone={note.tone}
            />
        {/if}
    </div>
</Pane>

{#if tabSave.asking !== null}
    <Prompt request={tabSave.asking} cancel={t('ui.confirm_cancel')} oncancel={tabSave.release} />
{/if}

<AskConfirm asking={submit.asking} onclose={submit.release} />

<style>
    .source {
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        height: 100%;
        min-height: 0;
    }

    /* A tab drawing the line and the window is two rows: the line takes what it needs. */
    .source.lined {
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
    }

    /* The save outcome and what the tab said take a row of their own under the editor. */
    .source.noted {
        grid-template-rows: minmax(0, 1fr) auto;
    }

    .source.lined.noted {
        grid-template-rows: auto minmax(0, 1fr) auto;
    }
</style>
