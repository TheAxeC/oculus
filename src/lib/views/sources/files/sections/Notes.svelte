<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The scratch notes as a section under
    // the trees: a head that opens and closes it and carries the control that opens a new note, and
    // one explorer row per note, newest first, with what it is called, when it was last written,
    // and its removal behind the confirm every write that can lose work sits behind.
    //
    // The head is drawn in every state, since it is where a note is started: with no note the
    // section says so in one muted row, and with notes that could not be read it says why in that
    // row instead, with the control that reads them again beside it, as every other row of the tree
    // carries its controls. The section is one stop of the focus order through
    // ui/tree/TreeView.svelte.
    //
    // It holds nothing of its own but which row the confirm is open for, and even that is the id
    // rather than a flag, so the dialog names the note it is about to remove.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Failed from '../tree/Failed.svelte';
    import Section from './Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { stamp } from '$lib/state/life/notes';

    type Props = {
        rows: { id: string; title: string; modified: number }[];
        /** What reading the notes failed with, or the empty string. */
        error: string;
        /** Whether the section is open. */
        open: boolean;
        ontoggle: () => void;
        onadd: () => void;
        onopen: (id: string) => void;
        onremove: (id: string) => void;
        /** Ask for the notes again, which the failed line's own control offers. */
        onretry: () => void;
    };

    let { rows, error, open, ontoggle, onadd, onopen, onremove, onretry }: Props = $props();

    /** The note the confirm is open for, and the empty string while it is closed. */
    let asked = $state('');

    const named = $derived(rows.find((row) => row.id === asked));

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: `note:${row.id}`, parent: 'head' })) : [])
    ]);

    /** What a note is listed as: its own title, or the words for one that has none yet. */
    function nameOf(row: { title: string }): string {
        return row.title.trim() === '' ? t('files.note_untitled') : row.title;
    }
</script>

<div class="notes" data-fs-notes>
    <TreeView label={t('files.notes')} rows={keyRows} {ontoggle}>
        {#snippet children(nav: TreeNav)}
            <Section
                label={t('files.notes')}
                {nav}
                count={rows.length}
                {open}
                {ontoggle}
                add={{
                    label: t('files.add_note'),
                    title: t('files.add_note_title'),
                    glyph: t('files.note_glyph')
                }}
                {onadd}
                showActions
            >
                {#if error !== ''}
                    <li role="none">
                        <Failed
                            label={t('files.notes_failed', error)}
                            title={t('files.read_again_notes')}
                            {onretry}
                        />
                    </li>
                {:else if rows.length === 0}
                    <li role="none">
                        <TreeItem label={t('files.notes_empty')} tone="muted" />
                    </li>
                {/if}
                {#each rows as row (row.id)}
                    <li role="none" data-fs-note={row.id}>
                        <TreeItem
                            label={nameOf(row)}
                            id={`note:${row.id}`}
                            {nav}
                            level={2}
                            glyph={t('files.note_glyph')}
                            title={t('files.note_open_title', nameOf(row))}
                            onclick={() => onopen(row.id)}
                        >
                            {#snippet detail()}
                                {stamp(row.modified)}
                            {/snippet}
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('files.note_delete')}
                                    glyph="trash"
                                    compact
                                    tabindex={reach}
                                    title={t('files.note_delete_title', nameOf(row))}
                                    onclick={() => (asked = row.id)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>

{#if named !== undefined}
    <Confirm
        message={t('files.note_delete_confirm')}
        detail={nameOf(named)}
        confirm={t('files.note_delete')}
        cancel={t('files.cancel')}
        onconfirm={() => {
            const id = asked;
            asked = '';
            onremove(id);
        }}
        oncancel={() => (asked = '')}
    />
{/if}

<style>
    .notes {
        margin-top: 6px;
    }
</style>
