<script module lang="ts">
    // Layer 3, view registration. A note opens from the file browser and is not listed: opened bare
    // it names no note and can only say so.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

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
    // Layer 3, view. One scratch note: a title line, a text area, and a save that follows the
    // typing rather than a control the reader has to remember to press.
    //
    // The note the reader is typing lives here and the file on disk is what it is saved to, so an
    // answer landing from the server never writes over a keystroke: the draft is seeded from the
    // file once per note and is the reader's from then on. The save is a wait that starts again on
    // every keystroke (state/life/notes.ts), so typing a paragraph is one write and not one
    // per letter, and the end of the pane's bar says when the last one landed.
    //
    // A note's file is made by its first keystroke and not by the control that opened the tab, so a
    // tab left with nothing typed into it leaves nothing on the disk and nothing has to be cleaned
    // up behind the reader. Nothing here deletes a note; the Files list's own control does that.
    //
    // The note never leaves this machine: the endpoint writes it into the folder the server's own
    // configuration names and reads it back from there, and nothing else is told about it.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import {
        autosaveMs,
        browserTimer,
        debounce,
        stamp,
        titleOf,
        writesNow
    } from '$lib/state/life/notes';
    import { NOTE_GONE, type NoteState } from '$lib/state/sources/fs.svelte';
    import { instanceFlag, instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { note, noteDeleted, saveNote },
        layout: { restateInstance },
        selectors: { configMap }
    } = useState();

    let { instance }: ViewProps = $props();

    /** What a note whose file is not written yet reads as, so nothing asks the server for it. */
    const BLANK: NoteState = {
        id: '',
        title: '',
        body: '',
        modified: 0,
        error: '',
        loading: false
    };

    const id = $derived(instanceText(instance.state, 'id'));
    /** Whether this tab's note has no file yet: nothing has been typed into it. */
    const fresh = $derived(instanceFlag(instance.state, 'fresh'));
    const held = $derived(fresh ? BLANK : note(id));

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
    /**
     * The tab this note is drawn in and the label that tab carries. The `instance` prop is a live
     * reference to whatever the pane is drawing, so a save landing after the pane moved to another
     * tab would name that tab instead of this one; both are read while the reader is typing here.
     */
    let tab = '';
    let named = '';

    /**
     * How tall the text area opens. A note is prose, so it takes the pane rather than three lines.
     */
    const ROWS = 20;

    /** The title the note is written under: the reader's own, or its first line of words. */
    const written = $derived(draft.title.trim() === '' ? titleOf(draft.body) : draft.title);

    /** The title the pane draws, which says so for a note that carries none. */
    const title = $derived(written === '' ? t('note.untitled') : written);

    /**
     * Put the draft back to nothing, for the note this component is about to draw. A pane keeps
     * each tab's view for as long as the tab is open, so this runs before the first draw and again
     * only when the instance is pointed at another note, whose predecessor is left through leave()
     * below.
     */
    function reset(): void {
        seeded = '';
        touched = false;
        savedAt = '';
        failed = '';
        tab = '';
        named = '';
        draft = { id: '', title: '', body: '' };
    }

    // Which note the component is drawing. The teardown is the note being left, whether the tab
    // closed or the pane switched to another note, and it runs for the note that was drawn, with
    // the draft as it stands, before the draft is read for the next one.
    $effect(() => {
        const which = id;
        reset();
        return () => leave(which);
    });

    // The file is read into the draft once per note. A later answer for the same note, which is
    // what a save asks for again, leaves it alone; so does an answer for a note the reader has
    // already typed into, which is what a fresh note's first keystrokes are while its file is still
    // coming. A note with no file yet is empty by construction and is seeded without waiting, so
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
     * What leaving a note does, which is the tab closing or the pane switching to another note. A
     * wait still running is run now rather than dropped, so what was typed in the last moment is
     * written and not lost. Nothing is deleted and no tab is closed here: a note with nothing in it
     * has no file to take away, and the list's own delete control is the one thing that removes
     * one. A note nothing was typed into holds no wait and may have no file, so it is left
     * untouched.
     */
    function leave(which: string): void {
        if (which === '' || tab === '' || vanished(which)) {
            autosave.cancel();
            return;
        }
        autosave.flush();
    }

    /**
     * One keystroke: the draft takes it and the note's id. The first keystroke into a note with no
     * file writes it at once, so the words are on the disk the moment there are any and a reload
     * inside the wait cannot lose them; every keystroke after it starts the wait again.
     */
    function typed(part: 'title' | 'body', value: string): void {
        const first = writesNow(fresh, touched);
        if (tab === '') {
            tab = instance.id;
            named = instanceText(instance.state, 'label');
        }
        draft = { ...draft, id, [part]: value };
        touched = true;
        if (first) {
            void save(true);
            return;
        }
        autosave.poke();
    }

    /**
     * Write the draft to its file, under the title the note is written as, and name the tab by that
     * title: the strip draws an instance's `label`, so two open notes read as two names rather than
     * as "Note" twice. The write that makes the file also takes the tab's `fresh` flag off, since
     * the file is there from now on and a reload reads it rather than opening on an empty draft.
     */
    async function save(made = false): Promise<void> {
        if (draft.id === '' || tab === '') return;
        const answer = await saveNote(draft.id, written, draft.body);
        failed = answer.ok ? '' : (answer.error ?? '');
        if (!answer.ok) return;
        savedAt = stamp(Date.now());
        // The tab is restated when its label moved and whenever it still carries `fresh`: a first
        // write that failed leaves the flag on, and the retry that lands must take it off even
        // when the title is still empty, or a reload would draw a blank over a file that is there.
        if (!made && !fresh && named === written) return;
        named = written;
        restateInstance(tab, { id: draft.id, label: written });
    }
</script>

{#snippet bar()}
    <span class="when" aria-live="polite">
        {#if failed !== ''}
            {t('note.failed', failed)}
        {:else if savedAt === ''}
            {t('note.unsaved')}
        {:else}
            {t('note.saved', savedAt)}
        {/if}
    </span>
{/snippet}

<Pane {title} {bar} tinted>
    <div class="note" data-instance={instance.id} data-note={id}>
        {#if id === ''}
            <Empty message={t('note.none')} glyph={t('note.none_glyph')} />
        {:else if held.error !== ''}
            <Empty error message={t('note.error', held.error)} />
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

    /* Status words at the end of the bar. */
    .when {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
