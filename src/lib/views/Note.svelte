<script module lang="ts">
    // Layer 3, view registration. A note opens from the file browser and is not listed: opened bare
    // it names no note and can only say so.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'note',
        label: 'views.note',
        glyph: 'views.note_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One scratch note: a title line, a text area, and a save that follows the typing
    // rather than a control the reader has to remember to press.
    //
    // The note the reader is typing lives here and the file on disk is what it is saved to, so an
    // answer landing from the server never writes over a keystroke: the draft is seeded from the
    // file once per note and is the reader's from then on. The save is a wait that starts again on
    // every keystroke (state/notes.ts), so typing a paragraph is one write and not one per letter,
    // and the toolbar says when the last one landed.
    //
    // The note never leaves this machine: the endpoint writes it into the folder the server's own
    // configuration names and reads it back from there, and nothing else is told about it.

    import Empty from '$lib/ui/Empty.svelte';
    import Field from '$lib/ui/Field.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import {
        abandoned,
        autosaveMs,
        browserTimer,
        debounce,
        stamp,
        titleOf
    } from '$lib/state/notes';
    import { NOTE_GONE } from '$lib/state/fs.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        fs: { deleteNote, note, noteDeleted, saveNote },
        layout: { closeRecord, restateInstance },
        selectors: { configMap }
    } = useState();

    let { instance }: ViewProps = $props();

    const id = $derived(read(instance.state, 'id'));
    const held = $derived(note(id));
    /** Whether this tab was opened for a note nothing has been written to: its file is empty. */
    const fresh = $derived(flag(instance.state, 'fresh'));

    /** What the reader has typed, and which note it belongs to. */
    let draft: { id: string; title: string; body: string } = $state({
        id: '',
        title: '',
        body: ''
    });
    /** The note the draft was seeded from, so the file is read into it once and no more. */
    let seeded = $state('');
    /** Whether the reader has typed since then, which makes the draft newer than any answer. */
    let touched = $state(false);
    /** When the last save landed, and the empty string while none has. */
    let savedAt = $state('');
    /** What the last save failed with, in the endpoint's own word. */
    let failed = $state('');

    /** How tall the text area opens. A note is prose, so it takes the pane rather than three lines. */
    const ROWS = 20;

    /** The title the note is written under: the reader's own, or its first line of words. */
    const written = $derived(draft.title.trim() === '' ? titleOf(draft.body) : draft.title);

    /** The title the pane draws, which says so for a note that carries none. */
    const title = $derived(written === '' ? t('note.untitled') : written);

    function read(state: unknown, key: string): string {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return '';
        const value = (state as Record<string, unknown>)[key];
        return typeof value === 'string' ? value : '';
    }

    function flag(state: unknown, key: string): boolean {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return false;
        return (state as Record<string, unknown>)[key] === true;
    }

    /**
     * Put the draft back to nothing, for the note this component is about to draw. A pane draws only
     * its active tab, and a switch from one note's tab to another's reuses this one component, so the
     * note it drew is left through leave() below and the draft starts again for the new one.
     */
    function reset(): void {
        seeded = '';
        touched = false;
        savedAt = '';
        failed = '';
        draft = { id: '', title: '', body: '' };
    }

    // Which note the component is drawing. The teardown is the note being left, whether the tab
    // closed or the pane switched to another note, and it runs for the note that was drawn, with the
    // draft as it stands, before the draft is read for the next one.
    $effect(() => {
        const which = id;
        reset();
        return () => leave(which);
    });

    // The file is read into the draft once per note. A later answer for the same note, which is what
    // a save asks for again, leaves it alone; so does an answer for a note the reader has already
    // typed into, which is what a fresh note's first keystrokes are while its file is still coming.
    // A note opened for the first time is empty by construction and is seeded without waiting, so
    // what the tab knows about its note does not depend on a round trip having landed.
    $effect(() => {
        if (id === '' || seeded === id) return;
        if (touched && draft.id === id) {
            seeded = id;
            return;
        }
        if (fresh) {
            seeded = id;
            draft = { id, title: '', body: '' };
            return;
        }
        if (held.loading) return;
        seeded = id;
        touched = false;
        draft = { id, title: held.title, body: held.body };
        savedAt = stamp(held.modified);
    });

    const autosave = debounce(
        browserTimer,
        () => autosaveMs(configMap()),
        () => void save()
    );

    /** Whether one note is no longer on the disk: this page deleted it, or its read said so. */
    function vanished(which: string): boolean {
        return noteDeleted(which) || note(which).error === NOTE_GONE;
    }

    /**
     * Whether one note holds nothing and nothing was typed into it. The file has to have been read
     * into the draft first: a tab closed before its note arrived knows nothing about what is in it,
     * and what it does not know it does not delete.
     */
    function empty(which: string): boolean {
        return seeded === which && abandoned(draft.title, draft.body, touched);
    }

    /**
     * What leaving a note does, which is the tab closing or the pane switching to another note. A
     * wait still running is run now rather than dropped, so what was typed in the last moment is
     * written and not lost; a note that is already gone is not written back; and a note nothing was
     * ever typed into is taken off the disk and its tab with it, since "+ note" made its file before
     * the tab was opened and what is left is a name in the folder for a note that was never used.
     */
    function leave(which: string): void {
        if (which === '' || vanished(which)) {
            autosave.cancel();
            return;
        }
        if (empty(which)) {
            autosave.cancel();
            void deleteNote(which);
            closeRecord('note', which);
            return;
        }
        autosave.flush();
    }

    /** One keystroke: the draft takes it and the note's id, and the wait starts again. */
    function typed(part: 'title' | 'body', value: string): void {
        draft = { ...draft, id, [part]: value };
        touched = true;
        autosave.poke();
    }

    /**
     * Write the draft to its file, under the title the note is written as, and name the tab by that
     * title: the strip draws an instance's `label`, so two open notes read as two names rather than
     * as "Note" twice.
     */
    async function save(): Promise<void> {
        if (draft.id === '') return;
        const answer = await saveNote(draft.id, written, draft.body);
        failed = answer.ok ? '' : (answer.error ?? '');
        if (!answer.ok) return;
        savedAt = stamp(Date.now());
        if (read(instance.state, 'label') !== written) {
            restateInstance(instance.id, { id: draft.id, label: written });
        }
    }
</script>

{#snippet tools()}
    <Toolbar label={t('note.toolbar')}>
        <span class="when" aria-live="polite">
            {#if failed !== ''}
                {t('note.failed', failed)}
            {:else if savedAt === ''}
                {t('note.unsaved')}
            {:else}
                {t('note.saved', savedAt)}
            {/if}
        </span>
    </Toolbar>
{/snippet}

<Pane {title} toolbar={tools} tinted>
    <div class="note" data-instance={instance.id} data-note={id}>
        {#if id === ''}
            <Empty message={t('note.none')} glyph={t('note.none_glyph')} />
        {:else if held.error !== ''}
            <Empty message={t('note.error', held.error)} glyph={t('note.none_glyph')} />
        {:else}
            <Field label={t('note.title_label')}>
                <TextInput
                    value={draft.title}
                    label={t('note.title_label')}
                    placeholder={t('note.title_hint')}
                    oninput={(next: string) => typed('title', next)}
                />
            </Field>
            <Field label={t('note.body_label')}>
                <TextArea
                    value={draft.body}
                    label={t('note.body_label')}
                    rows={ROWS}
                    oninput={(next: string) => typed('body', next)}
                />
            </Field>
        {/if}
    </div>
</Pane>

<style>
    .note {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
        min-width: 0;
    }

    .when {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
