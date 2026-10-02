<script lang="ts">
    // Layer 3, shell. The rail's foot, where VS Code's activity bar keeps Accounts and Manage:
    // Bookmarks, Search and Update, each an icon with its name as the tooltip. Bookmarks opens a
    // menu of the reader's own bookmarks by name, beside the rail, and a choice opens the bookmark
    // as the file browser opens it (a folder is shown open in the Files view); with no bookmark the
    // menu says there is none.
    //
    // The keyboard ring is the rail's, so each control is handed its place in the focus order and
    // its key handler.

    import {
        bookmarkChoices,
        bookmarkPicked,
        documentState,
        type Bookmark
    } from '$lib/shell/rail/rail';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView, showInFiles }
    } = useState();

    type Props = {
        /** The reader's own bookmarks, in the order their file holds them. */
        saved: Bookmark[];
        stopIndex: (id: string) => number;
        ringKeys: (id: string) => (event: KeyboardEvent) => void;
        onsearch: () => void;
        onupdate: () => void;
    };

    let { saved, stopIndex, ringKeys, onsearch, onupdate }: Props = $props();

    const items = $derived<MenuItem[]>(bookmarkChoices(saved));

    /**
     * What one bookmark opens as, which the bookmark itself says. The file view is given the root,
     * the path and the label and no id of its own, so a file opened from here and the same file
     * opened from the tree are the one tab.
     */
    function pick(id: string): void {
        const mark = bookmarkPicked(saved, id);
        if (mark === null) return;
        if (mark.view === 'files') {
            showInFiles(mark.path, mark.root, true);
            return;
        }
        if (mark.view === 'file') {
            openView('file', { root: mark.root, path: mark.path, label: mark.label });
            return;
        }
        openView('document', documentState(mark));
    }
</script>

<div class="foot" data-foot>
    <div data-action="bookmarks">
        <Menu
            label={t('ui.docs')}
            glyph={t('ui.bookmarks_glyph')}
            rail
            placement="beside"
            {items}
            onpick={pick}
            stop="bookmarks"
            tabindex={stopIndex('bookmarks')}
            onkeydown={ringKeys('bookmarks')}
        />
    </div>
    <div data-action="search">
        <ToolButton
            label={t('app.search')}
            title={t('app.search_tip')}
            glyph="cmd"
            compact
            rail
            stop="search"
            tabindex={stopIndex('search')}
            onkeydown={ringKeys('search')}
            onclick={onsearch}
        />
    </div>
    <div data-action="update">
        <ToolButton
            label={t('app.update')}
            title={t('app.update_tip')}
            glyph="refresh"
            compact
            rail
            stop="update"
            tabindex={stopIndex('update')}
            onkeydown={ringKeys('update')}
            onclick={onupdate}
        />
    </div>
</div>

<style>
    /* On a short window the list above is what gives way, and it scrolls. Without the flex-shrink
       the foot shrinks with it and its buttons pile over each other. */
    .foot {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex-shrink: 0;
    }
</style>
