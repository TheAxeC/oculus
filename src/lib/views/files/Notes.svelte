<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The scratch notes under the tree: one row per note,
    // newest first, with what it is called, when it was last written, and its removal behind the
    // confirm every write that can lose work sits behind.
    //
    // It holds nothing of its own but which row the confirm is open for, and even that is the id
    // rather than a flag, so the dialog names the note it is about to remove.

    import Confirm from '$lib/ui/Confirm.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { stamp } from '$lib/state/notes';

    type Props = {
        rows: { id: string; title: string; modified: number }[];
        onopen: (id: string) => void;
        onremove: (id: string) => void;
    };

    let { rows, onopen, onremove }: Props = $props();

    /** The note the confirm is open for, and the empty string while it is closed. */
    let asked = $state('');

    const named = $derived(rows.find((row) => row.id === asked));

    /** What a note is listed as: its own title, or the words for one that has none yet. */
    function nameOf(row: { title: string }): string {
        return row.title.trim() === '' ? t('files.note_untitled') : row.title;
    }
</script>

<div class="notes" data-fs-notes>
    <p class="head">{t('files.notes')}</p>
    <ul class="list" aria-label={t('files.notes')}>
        {#each rows as row (row.id)}
            <li class="row" data-fs-note={row.id}>
                <span class="open">
                    <ToolButton
                        label={nameOf(row)}
                        glyph={t('files.note_glyph')}
                        title={t('files.note_open_title', nameOf(row))}
                        onclick={() => onopen(row.id)}
                    />
                </span>
                <span class="when">{stamp(row.modified)}</span>
                <ToolButton
                    label={t('files.note_delete')}
                    glyph="trash"
                    compact
                    title={t('files.note_delete_title', nameOf(row))}
                    onclick={() => (asked = row.id)}
                />
            </li>
        {/each}
    </ul>
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
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
    }

    .head {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-3xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    /* The name is the row's own box, so a long title elides against the pane's edge rather than
       pushing the time and the removal out of the pane. */
    .open {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
    }

    .when {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-3xs);
        white-space: nowrap;
    }
</style>
