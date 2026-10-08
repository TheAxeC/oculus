<script lang="ts">
    // Layer 3, view partial of Source.svelte. What the tab draws inside its pane: the sentence that
    // stands in for the editor when the file cannot be shown (with the control that reads it
    // again), an empty pane while the draft is read, and otherwise the line saying why a file may
    // not be written (save/LockedCode.svelte), the editor, and the row under them
    // (save/SourceNote.svelte). Focus anywhere in it makes the tab the source a command run from
    // another view reads. The pane's grid has a row for the line and the window when the tab draws
    // them, and a row for the note when it has one. Source.svelte owns every value drawn here;
    // this partial draws them and hands the editor's events back.

    import type { Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type {
        EditorAction,
        EditorCaret,
        EditorExtension,
        EditorHandle,
        EditorOwnAction,
        EditorReach
    } from '$lib/ui/controls/editor/types';
    import type { Indent, LineEnding, WordWrap } from '$lib/state/workbench/navigation/editor-text';
    import Editor from './Editor.svelte';
    import type { EditorGutter } from './source-gutter.svelte';
    import LockedCode from './save/LockedCode.svelte';
    import SourceNote from './save/SourceNote.svelte';
    import type { Locked } from './save/locked-words';
    import type { SaidTone } from './save/said-tone';

    type Props = {
        /** The tab's instance id, root and path, which the pane carries for commands to read. */
        instance: string;
        root: string;
        path: string;
        /** Said when focus enters the pane. */
        onfocus: () => void;
        /** The sentence that stands in for the editor, and whether it is drawn as an error. */
        error: string;
        errored: boolean;
        /** The control that reads the file again, absent for a tab that names no file. */
        again: Snippet | undefined;
        /** Whether the draft is read in. */
        loaded: boolean;
        lock: Locked;
        text: string;
        language: string;
        /** The tab's gutter for the code window, and the scroll the window reports to it. */
        margin: Snippet;
        onscrolled: (top: number) => void;
        /** The file the editor's model is for, and the line and column the tab was opened at. */
        at: string;
        line: number;
        column: number;
        first: number;
        onfirst: (shown: number) => void;
        indent: Indent | null;
        ending: LineEnding;
        wrap: WordWrap | null;
        rulers: number[] | null;
        actions: EditorOwnAction[];
        rendered: boolean;
        reached: () => EditorReach | null;
        gutter: EditorGutter;
        extension: EditorExtension | undefined;
        oninput: (value: string) => void;
        onblur: () => void;
        oncaret: (caret: EditorCaret) => void;
        onselect: (text: string) => void;
        onactions: (offered: EditorAction[]) => void;
        /** The editor, which the tab performs the asks that act on its model through. */
        editor: EditorHandle | undefined;
        /** The row under the editor: whether it is drawn, and what it says. */
        noted: boolean;
        disked: boolean;
        saveMessage: string;
        failed: boolean;
        said: string;
        tone: SaidTone;
    };

    let {
        instance,
        root,
        path,
        onfocus,
        error,
        errored,
        again,
        loaded,
        lock,
        text,
        language,
        margin,
        onscrolled,
        at,
        line,
        column,
        first,
        onfirst,
        indent,
        ending,
        wrap,
        rulers,
        actions,
        rendered,
        reached,
        gutter,
        extension,
        oninput,
        onblur,
        oncaret,
        onselect,
        onactions,
        editor = $bindable(),
        noted,
        disked,
        saveMessage,
        failed,
        said,
        tone
    }: Props = $props();
</script>

<!-- Focus in the tab makes it the source a command run from another view reads. -->
<div
    class="source"
    class:lined={lock.words !== '' && error === '' && loaded}
    class:noted
    data-instance={instance}
    data-root={root}
    data-path={path}
    onfocusin={onfocus}
>
    {#if error !== ''}
        <div data-tab-focus tabindex="-1">
            <Empty error={errored} message={error} action={again} />
        </div>
    {:else if !loaded}
        <div data-tab-focus tabindex="-1"></div>
    {:else}
        {#if lock.words !== ''}
            <LockedCode {lock} {text} {language} {path} gutter={margin} {onscrolled} />
        {/if}
        {#if !lock.window}
            <Editor
                bind:this={editor}
                path={at}
                {line}
                {column}
                {first}
                {onfirst}
                {language}
                {indent}
                {ending}
                {wrap}
                {rulers}
                {actions}
                {instance}
                {text}
                {reached}
                {rendered}
                {gutter}
                {extension}
                writable={lock.words === ''}
                {oninput}
                {onblur}
                {oncaret}
                {onselect}
                {onactions}
            />
        {/if}
    {/if}
    {#if noted}
        <SourceNote
            id={instance}
            {root}
            {path}
            {disked}
            message={saveMessage}
            {failed}
            {said}
            {tone}
        />
    {/if}
</div>

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
