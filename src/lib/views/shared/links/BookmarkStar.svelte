<script lang="ts">
    // Layer 3, shared view support. The star over one open file: it is set when a bookmark of the
    // reader's own names this root and this path, and pressing it adds one under the file's own
    // name or takes that one out again. The rail's Bookmarks menu lists the bookmarks, and the
    // Files view is where one is renamed.
    //
    // It is shared because a file is read in two tabs, the source tab for text and the file view
    // for a picture, a PDF or a download, and a reader bookmarks the file they are looking at in
    // either. A label another bookmark already holds is refused rather than written over, which the
    // endpoint says in words and the line under the control repeats.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { nameOf } from '$lib/state/sources/fs';
    import { bookmarkAt, markRefusal } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
        path: string;
    };

    let { root, path }: Props = $props();

    const {
        fs: { addBookmark, bookmarks, removeBookmark }
    } = useState();

    /** The bookmark over this very file, or null when the reader has not made one. */
    const marked = $derived(bookmarkAt(bookmarks().entries, root, path));

    /** What the last bookmark write failed with, in the endpoint's own words. */
    let failed = $state('');

    async function mark(): Promise<void> {
        if (root === '' || path === '') return;
        const answer =
            marked === null
                ? await addBookmark({ label: nameOf(path), root, path })
                : await removeBookmark(marked.id);
        failed = markRefusal(answer);
    }
</script>

<ToolButton
    label={marked === null ? t('file.bookmark') : t('file.unbookmark')}
    glyph={t('file.bookmark_glyph')}
    pressed={marked !== null}
    active={marked !== null}
    onclick={() => void mark()}
/>

{#if failed !== ''}
    <span class="failed" aria-live="polite">{t('file.bookmark_failed', failed)}</span>
{/if}

<style>
    .failed {
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
