<script module lang="ts">
    // Layer 3, view registration. A source file opens from another view and is not listed.
    import type { ViewRegistration } from './registry';
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
    // It reads once through api/file, asks api/source whether this machine's mode lets it be written,
    // keeps working and saved copies in its instance's ui state across tab switches, and writes
    // through api/source.
    //
    // A file it holds but may not write is drawn by the code window under a line saying why, rather
    // than by an editor that would take typing and refuse every save: a file this machine's mode
    // locks, and a file too long to have been read whole, where writing the copy back would take the
    // rest of the file off the disk.
    //
    // A keystroke keeps a preview tab. A file opened by a single click is the tab the next single
    // click replaces, and typing into it is a reader saying they are working in it.
    //
    // The star in the pane's own bar is `shared/BookmarkStar.svelte`, which the file view draws too,
    // so a reader bookmarks the file in front of them whichever of the two tabs is showing it. The
    // controls that act on the text (Save, Revert, the rendered half) are the editor's own bar. A file
    // whose extension `open.program_ext` names an application for, such as a `.rtf` whose bytes are
    // text, also carries `shared/ProgramButton.svelte` there, the control the file view draws.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import BookmarkStar from './shared/BookmarkStar.svelte';
    import ProgramButton from './shared/ProgramButton.svelte';
    import Code from './source/Code.svelte';
    import Editor from './source/Editor.svelte';
    import { languageOf, opensInProgram } from '$lib/state/fs';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        layout: { keepPreview },
        selectors: { programApps },
        source: {
            revertSourceDraft,
            editSourceDraft,
            loadSourceDraft,
            saveSourceDraft,
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

    /** Typing is the reader working in this tab, so a preview tab becomes one that is kept. */
    function typed(value: string): void {
        keepPreview(instance.id);
        editSourceDraft(instance.id, value);
    }
</script>

{#snippet tools()}
    <Toolbar label={t('source.toolbar')}>
        <BookmarkStar {root} {path} />
        {#if !blocked && opensInProgram(path, programApps())}
            <ProgramButton {root} {path} />
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
            <Code text={draft.text} language={languageOf(path)} {path} />
        {:else}
            <Editor
                {path}
                {line}
                text={draft.text}
                message={draft.message}
                rendered={draft.rendered}
                oninput={typed}
                onsave={save}
                onrevert={() => revertSourceDraft(instance.id)}
                onrendered={() => toggleSourceRendered(instance.id)}
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

    .locked {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
