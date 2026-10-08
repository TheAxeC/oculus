<script module lang="ts">
    // Layer 3, view registration. A source file opens from another view and is not listed.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

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
    // A tab over the file at HEAD or in the index (Open File (HEAD)) is read from the git route,
    // read again when HEAD's commit (a HEAD tab) or the file's staged or unstaged entry (an index
    // tab) moves, and is never written: it is drawn as a locked file, has no gutter marks, carries
    // the blame of that version (Toggle Blame is the one action it offers), and offers no preview,
    // since its root is a repository's own directory and not a served root.
    //
    // A keystroke keeps a preview tab: typing into the tab a single click opened, which the next
    // single click replaces, says the reader is working in it.
    //
    // The tab draws no title row and no row of controls: its path is the breadcrumb the pane draws
    // under the strip. It hands up to the pane through ui/tabs/tab-actions.svelte.ts its actions
    // for the right end of the breadcrumb bar (actions/BarActions.svelte): Save, Revert File, the
    // star, Open in Program, Open Preview, Open Preview to the Side, Submit Job, Toggle Blame and,
    // for a LaTeX file, Build, View PDF and Build Log, each where it applies, and nothing for the
    // tab row. Word wrap and the rendered half are the palette's, which lists Save, Revert File,
    // word wrap, the rendered half, Open Preview to the Side, Submit Job, Toggle Blame and the
    // LaTeX actions while each applies (status/tab-asks.svelte.ts), and Cmd+S asks the tab on
    // screen to save. The save outcome and what the tab said stay under the editor
    // (save/SourceNote.svelte): an alert for a refusal, a status for Submit's progress; the line
    // about the file on disk (changed under unsaved text, deleted, or a Save refused as newer) is
    // save/DiskNote.svelte. A file that could not be read is the message box with a control that
    // reads it again (actions/read-again.ts), which opens what the file is when it is back as
    // something other than text. A file the route says is gone opens here too, so this is the tab
    // that says it cannot be opened. While the draft is read the pane is empty.
    //
    // Submit Job, on a .slurm file on disk under a served root, is actions/submit-job.svelte.ts.
    //
    // A tab over a library file a language server named is this view too, read-only and with no
    // root or path (status/library-tab.svelte.ts).
    //
    // What the pane draws, from the sentence that stands in for the editor to the row under the
    // editor, is SourceBody.svelte; this file owns every value it draws.
    //
    // A tab over an untitled text (New Text File) holds an empty draft and no file. Its first Save
    // asks for a served root of the current workspace and a name, makes the file there, writes the
    // text to it and becomes a tab over that file.
    //
    // What the status bar draws for the tab and what the bar and the palette ask of it are
    // status/source-status.svelte.ts and status/ask-perform.ts, joined to the tab by
    // status/tab-asks.svelte.ts; the editor's indentation, word wrap and rulers are
    // views/shared/prose/source-options.ts. The editor keeps the text in the line ending it was
    // opened in, so typing into a CRLF file is kept in CRLF. A rewrite of the text is an edit like
    // typing, handed back as one and unsaved until Save. For a file in a repository the gutter
    // carries the quick diff marks and each line's blame (source-gutter.svelte.ts).
    //
    // A save made without a press of Save (editor.autosave) is state/sessions/source/
    // autosave.svelte.ts; the editor reports that it lost focus through `onblur`
    // (save/tab-save.svelte.ts).
    //
    // What a language adds to the editor (Markdown headings, LaTeX's editing commands and markers,
    // a language server's registration and actions, and the format before a save when the
    // language's `format_on_save` is on) is made by language/tab-language.svelte.ts. A LaTeX file's
    // build, its PDF, SyncTeX, citations and the keys of those are latex/latex-tab.svelte.ts, whose
    // controls are drawn in the bar (latex/LatexButtons.svelte) and whose questions are
    // latex/LatexDialogs.svelte.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import { handUp, useTabActions } from '$lib/ui/tabs/tab-actions.svelte';
    import { servedFile } from '$lib/views/shared/links/file-bar';
    import SourceBody from './SourceBody.svelte';
    import BarActions from './actions/BarActions.svelte';
    import Gutter from './Gutter.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import LatexDialogs from './latex/LatexDialogs.svelte';
    import { createLatexTab } from './latex/latex-tab.svelte';
    import { createSaid } from './save/tab-said.svelte';
    import { createTabAsks } from './status/tab-asks.svelte';
    import { createTabFile } from './status/tab-file.svelte';
    import { createLibraryTab } from './status/library-tab.svelte';
    import { tabFacts } from './status/tab-state';
    import { instanceMap } from '$lib/state/workbench/layout';
    import { tabShown } from './status/tab-shown';
    import { createSubmitJob } from './actions/submit-job.svelte';
    import ReadAgainButton from './actions/ReadAgainButton.svelte';
    import { createTabSave } from './save/tab-save.svelte';
    import { createTabDraft } from './save/tab-draft.svelte';
    import { createTabLanguage } from './language/tab-language.svelte';
    import { createSourceGutter } from './source-gutter.svelte';
    import { createSourceOptions } from '$lib/views/shared/prose/source-options';
    import { markdownPreviewState, MARKDOWN_PREVIEW_VIEW } from '$lib/state/sources/fs';
    import { blameStatus } from '$lib/state/sources/repositories/file-git';
    import { START, lineEnding, type Caret } from '$lib/state/workbench/navigation/editor-text';
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
            sourceReach,
            loadSourceDraft,
            reloadHead,
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

    const { root, path, label, head, place, blocked, untitled } = $derived(
        tabFacts(instance.state)
    );
    const lib = createLibraryTab({
        client,
        instance: () => instance.id,
        state: () => instance.state,
        name: () => label
    });
    /** The file the language server is asked about: the tab's, or the library file's. */
    const at = $derived(lib.address === '' ? { root, path } : { root: lib.root, path: lib.name });
    const title = $derived(label === '' ? t('views.source') : label);
    const draft = $derived(sourceDraft(instance.id));
    /** What the tab says under the editor: a refusal or Submit's status lines. */
    const note = createSaid();
    const { error, lock, read, editing, drawn, saveMessage, disked, noted } = $derived(
        tabShown({
            head,
            draft,
            library: lib.address !== '',
            gone: lib.gone,
            blocked,
            untitled,
            path,
            said: note.words
        })
    );

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
    /** The draft read in for the file the tab names, and the editor's typing and wrap toggle. */
    const tabDraft = createTabDraft({
        id: () => instance.id,
        root: () => root,
        path: () => path,
        head: () => head,
        blocked: () => blocked,
        untitled: () => untitled,
        toggled: () => options.toggled,
        load: loadSourceDraft,
        loadUntitled: loadUntitledDraft,
        edit: editSourceDraft,
        wrap: setSourceWrap,
        keepPreview,
        headSignature: () => file.headSignature,
        reloadHead
    });
    /** What the language adds to the editor: LaTeX's build, Markdown's headings or a server. */
    const tabLanguage = createTabLanguage({
        client,
        instance: () => instance.id,
        shown: () => options.shown,
        root: () => at.root,
        path: () => at.path,
        library: () => lib.address,
        version: () => head !== undefined,
        say: (words: string) => note.say(words),
        commands: (found) => (latexTab.commands = found)
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
    /** A LaTeX file's root, build, keys and questions; it applies to a file on disk by name. */
    const latexTab = createLatexTab({
        client,
        instance: () => instance.id,
        root: () => root,
        path: () => path,
        language: () => language,
        onDisk: () => file.onDisk && head === undefined && lib.address === '',
        draft: () => draft,
        caret: () => caret,
        editing: () => editing,
        save: () => tabSave.save()
    });
    /** Submit on the job script: the press that saves, asks and runs, and the confirm it holds. */
    const submit = createSubmitJob({
        root: () => root,
        path: () => path,
        roots: currentRoots,
        onDisk: () => file.onDisk,
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
        gate,
        riteFile: () =>
            language === 'rite' && file.onDisk && lib.address === '' ? file.wholeFile : '',
        debug: client.debug
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
    /** What the tab offers the palette and the status bar, and what it does on their asks. */
    const asks = createTabAsks({
        store: editorStatus,
        id: () => instance.id,
        // Each fact is a getter, so a derived of the partial tracks only the facts it reads.
        facts: {
            get read() {
                return read;
            },
            get editing() {
                return editing;
            },
            get drawn() {
                return drawn;
            },
            get markdown() {
                return markdown;
            },
            get previewable() {
                return file.previewable;
            },
            get blameable() {
                return file.blameable;
            },
            get submittable() {
                return submit.submittable;
            },
            get indent() {
                return indent;
            },
            get ending() {
                return ending;
            },
            get language() {
                return language;
            },
            get text() {
                return draft.text;
            },
            get caret() {
                return caret;
            },
            get selection() {
                return selection;
            },
            get editor() {
                return editor;
            },
            get blame() {
                return editing ? blameStatus(blameMap.get(caret.line), gutter.readAt) : '';
            },
            get file() {
                return file.wholeFile;
            },
            get served() {
                return tabLanguage.lsp.served(options.shown, at, drawn);
            },
            get languageActions() {
                return tabLanguage.lsp.actions(options.shown, at);
            },
            get latexActions() {
                return latexTab.actions();
            }
        },
        does: {
            save: () => void tabSave.save(),
            revert: () => void revertSourceDraft(instance.id),
            toggleWrap: tabDraft.toggleWrap,
            toggleRendered: () => toggleSourceRendered(instance.id),
            previewSide: () => openBeside(MARKDOWN_PREVIEW_VIEW, markdownPreviewState(root, path)),
            submit: () => void submit.press(),
            toggleBlame: () => toggleSourceBlame(instance.id),
            openCommit: () => gutter.openBlamed(blameMap.get(caret.line)),
            setLanguage: (next) => setSourceLanguage(instance.id, next),
            setIndent: (next) => setSourceIndent(instance.id, next),
            select: tabLanguage.lsp.select
        }
    });
    const own = $derived(asks.own);

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
            latexTab.applies ||
            servedFile(currentRoots(), root, path, file.onDisk)
    );
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
        submittable={submit.submittable}
        submitting={submit.busy}
        latex={latexTab}
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
    <SourceBody
        instance={instance.id}
        {root}
        {path}
        onfocus={() => editorStatus.focus(instance.id)}
        {error}
        errored={!lib.gone}
        again={blocked ? undefined : again}
        loaded={draft.loaded}
        {lock}
        text={draft.text}
        {language}
        {margin}
        onscrolled={(next: number) => (top = next)}
        at={at.path}
        {place}
        onwent={(asked: number) =>
            restateInstance(instance.id, { ...instanceMap(instance.state), wentTo: asked })}
        first={draft.first}
        onfirst={(shown: number) => setSourceFirst(instance.id, shown)}
        {indent}
        {ending}
        wrap={options.wrap}
        rulers={options.rulers}
        actions={own}
        rendered={draft.rendered}
        reached={() => sourceReach(instance.id)}
        gutter={gutter.editor}
        extension={tabLanguage.extension}
        oninput={tabDraft.typed}
        onblur={tabSave.blurred}
        oncaret={(at: Caret) => (caret = at)}
        onselect={(text: string) => (selection = text)}
        onactions={asks.offered}
        bind:editor
        {noted}
        {disked}
        {saveMessage}
        failed={draft.failed}
        said={note.words}
        tone={note.tone}
    />
</Pane>

{#if tabSave.asking !== null}
    <Prompt request={tabSave.asking} cancel={t('ui.confirm_cancel')} oncancel={tabSave.release} />
{/if}

<AskConfirm asking={submit.asking} onclose={submit.release} />

<LatexDialogs tab={latexTab} />
