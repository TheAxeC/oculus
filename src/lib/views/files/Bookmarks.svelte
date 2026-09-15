<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The reader's own bookmarks under the tree: one row per
    // bookmark, opening the file it names, with the control that opens the shared entry form over it.
    //
    // The rail draws the same bookmarks as buttons, which is where they are pressed from; this is
    // where they are changed, since a form has nowhere to go in a rail of 34-pixel controls.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import type { Entry } from '$lib/state/collection';
    import { t } from '$lib/state/text';

    type Props = {
        rows: Entry[];
        /** The bookmark the form is open for, and the empty string while it is closed. */
        editing: string;
        onopen: (entry: Entry) => void;
        onedit: (id: string) => void;
    };

    let { rows, editing, onopen, onedit }: Props = $props();

    /** The root and the path one bookmark names, which is what a row says under its label. */
    function whereOf(entry: Entry): string {
        const root = entry.fields.root;
        const path = entry.fields.path;
        return `${typeof root === 'string' ? root : ''}/${typeof path === 'string' ? path : ''}`;
    }
</script>

<div class="marks" data-fs-bookmarks>
    <p class="head">{t('files.bookmarks')}</p>
    <ul class="list" aria-label={t('files.bookmarks')}>
        {#each rows as row (row.id)}
            <li class="row" data-fs-bookmark={row.id}>
                <span class="open">
                    <ToolButton
                        label={row.title}
                        glyph={t('files.bookmark_glyph')}
                        title={t('files.bookmark_open_title', whereOf(row))}
                        onclick={() => onopen(row)}
                    />
                </span>
                <ToolButton
                    label={t('files.bookmark_edit')}
                    glyph="edit"
                    compact
                    expanded={editing === row.id}
                    title={t('files.bookmark_edit_title', row.title)}
                    onclick={() => onedit(row.id)}
                />
            </li>
        {/each}
    </ul>
</div>

<style>
    .marks {
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

    /* The label is the row's own box, so a long one elides against the pane's edge rather than
       pushing the edit control out of the pane. */
    .open {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
    }
</style>
