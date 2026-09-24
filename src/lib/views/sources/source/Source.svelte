<script module lang="ts">
    // Layer 3, view registration. A source file opens from another view and is not listed.
    import type { ViewRegistration } from '../../registry';
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
    // Every control of the tab is on the pane's own bar, in one row: Save, Revert and, for a
    // Markdown file, the rendered half, which act on the text and are drawn while the text may be
    // written; then the star, `shared/links/BookmarkStar.svelte`, which the file view draws too, so
    // a reader bookmarks the file in front of them whichever of the two tabs is showing it; then,
    // for a file whose extension `open.program_ext` names an application for, such as a `.rtf`
    // whose bytes are text, `shared/links/ProgramButton.svelte`, the control the file view draws.
    // The editor below draws no bar of its own.
    //
    // What the status bar draws for the tab is published from here to the editor status store,
    // keyed by the instance, while the tab is mounted: the caret the editor reports, the
    // indentation (the one chosen from the bar, or the file's own), the line ending of the text,
    // the language (the one chosen from the bar, or the file name's) and whether the file may be
    // written. What the bar asks of the tab, a line to go to, an indentation, a conversion, a line
    // ending or a language, is performed here on the draft, once per ask, and a rewrite of the text
    // is an edit like typing, unsaved until Save. The textarea hands back every line ending as a
    // line feed, so typing into a CRLF file is kept in CRLF.

    import { onDestroy, untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import BookmarkStar from '../../shared/links/BookmarkStar.svelte';
    import ProgramButton from '../../shared/links/ProgramButton.svelte';
    import Code from './Code.svelte';
    import Editor from './Editor.svelte';
    import { languageOf, opensInProgram } from '$lib/state/sources/fs';
    import {
        START,
        convertIndent,
        detectIndent,
        lineCount,
        lineEnding,
        withEnding,
        type Caret
    } from '$lib/state/workbench/navigation/editor-text';
    import { t } from '$lib/state/words/text';
    import type { ViewProps } from '../../registry';
    import { useState } from '$lib/state/client/use';

    const {
        editorStatus: { asked, forget, publish },
        layout: { keepPreview },
        selectors: { programApps },
        source: {
            revertSourceDraft,
            editSourceDraft,
            loadSourceDraft,
            saveSourceDraft,
            setSourceIndent,
            setSourceLanguage,
            toggleSourceRendered,
            sourceDraft
        }
    } = useState();

    let { instance }: ViewProps = $props();

    const root = $derived(read(instance.state, 'root'));
    const path = $derived(read(instance.state, 'path'));
    const label = $derived(read(instance.state, 'label'));
    /** The line the tab was opened at, and zero for one opened at the file itself. */
    const line = $derived(number(instance.state, 'line'));
    const title = $derived(label === '' ? t('views.source') : label);
    const draft = $derived(sourceDraft(instance.id));
    const blocked = $derived(root === '' || path === '');
    const error = $derived(blocked ? t('source.cannot_open', path) : draft.error);
    /** The line a tab that may not write its file draws, and the empty string for one that may. */
    const locked = $derived(
        draft.readonly ? t('source.readonly') : draft.truncated ? t('source.truncated') : ''
    );
    /** Whether the editor is drawn, which is when the text controls have text to act on. */
    const editing = $derived(error === '' && draft.loaded && locked === '');
    /** The language the tab paints in: the one chosen from the status bar, or the name's. */
    const language = $derived(draft.language === '' ? languageOf(path) : draft.language);
    /** The indentation Tab inserts: the one chosen from the status bar, or the file's own. */
    const indent = $derived(draft.indent ?? detectIndent(draft.text));
    const ending = $derived(lineEnding(draft.text));
    /** Whether the file has a rendered half, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');

    /** Where the editor's caret is, as it last reported. */
    let caret: Caret = $state(START);
    /** The line the status bar asked the editor to go to, and the ask's number. */
    let jump: { line: number; seq: number } | null = $state(null);
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
            writable: editing
        });
    });

    onDestroy(() => forget(instance.id));

    // An ask of the status bar, performed once on the draft.
    $effect(() => {
        const ask = asked(instance.id);
        if (ask === null || ask.seq === performed) return;
        performed = ask.seq;
        untrack(() => {
            const id = instance.id;
            const held = sourceDraft(id);
            if (ask.kind === 'goto') {
                jump = { line: ask.line, seq: ask.seq };
            } else if (ask.kind === 'language') {
                setSourceLanguage(id, ask.language);
            } else if (ask.kind === 'indent') {
                setSourceIndent(id, ask.indent);
            } else if (!editing) {
                return;
            } else if (ask.kind === 'convert') {
                keepPreview(id);
                editSourceDraft(id, convertIndent(held.text, ask.tabs, indent.size));
                setSourceIndent(id, { tabs: ask.tabs, size: indent.size });
            } else {
                keepPreview(id);
                editSourceDraft(id, withEnding(held.text, ask.ending));
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

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }

    function number(state: unknown, key: string): number {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return 0;
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
    }

    async function save(): Promise<void> {
        await saveSourceDraft(instance.id, root, path);
    }

    /**
     * Typing is the reader working in this tab, so a preview tab becomes one that is kept. The
     * textarea's value has line feeds, so the text keeps the line ending it had.
     */
    function typed(value: string): void {
        keepPreview(instance.id);
        editSourceDraft(instance.id, withEnding(value, ending));
    }
</script>

{#snippet tools()}
    <Toolbar label={t('source.toolbar')}>
        {#if editing}
            <ToolButton label={t('editor.save')} glyph="check" onclick={() => void save()} />
            <ToolButton
                label={t('editor.revert')}
                glyph={t('editor.revert_glyph')}
                onclick={() => revertSourceDraft(instance.id)}
            />
            {#if markdown}
                <ToolButton
                    label={t('source.preview')}
                    glyph={t('source.preview_glyph')}
                    pressed={draft.rendered}
                    onclick={() => toggleSourceRendered(instance.id)}
                />
            {/if}
        {/if}
        <BookmarkStar {root} {path} />
        {#if !blocked && opensInProgram(path, programApps())}
            <ProgramButton {root} {path} />
        {/if}
        {#if editing && draft.message !== ''}
            <span class="message" aria-live="polite">
                {#if draft.failed}
                    <Glyph name="cross" />
                {/if}
                {draft.message}
            </span>
        {/if}
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools}>
    <div class="source" data-instance={instance.id} data-root={root} data-path={path}>
        {#if error !== ''}
            <Empty message={error} glyph="warn" />
        {:else if !draft.loaded}
            <Empty message={t('app.waiting')} glyph="edit" />
        {:else if locked !== ''}
            <p class="locked" data-source-locked={path}>
                <Glyph name={t('source.locked_glyph')} />
                {locked}
            </p>
            <Code text={draft.text} {language} {path} />
        {:else}
            <Editor
                {path}
                {line}
                {language}
                {indent}
                {jump}
                text={draft.text}
                rendered={draft.rendered}
                oninput={typed}
                oncaret={(at: Caret) => (caret = at)}
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

    .message {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .locked {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
