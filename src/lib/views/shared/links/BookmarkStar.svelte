<script lang="ts">
    // Layer 3, shared view support. The star over one open file: it is set when a bookmark of the
    // reader's own names this root and this path, and pressing it adds one under the file's own
    // name or takes that one out again. The rail's Bookmarks menu lists the bookmarks, and the
    // Files view is where one is renamed.
    //
    // It is shared because a file is read in several tabs (the source tab for text, the file view
    // for a picture, a PDF or a download, a document, a Doc), each drawing it in its breadcrumb bar
    // (FileBarActions.svelte), and a reader bookmarks the file they are looking at in any of them.
    // A label another bookmark already holds is refused rather than written over, which the
    // endpoint says in words: beside the control, or through `onsaid` where the caller draws a
    // message line of its own. `bare` draws the star as a header icon, its words the tooltip and
    // the accessible name, and the star is filled while the bookmark is set.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { nameOf } from '$lib/state/sources/fs';
    import { bookmarkAt, markRefusal } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
        path: string;
        /** Draw the star as an icon action of a pane's header. */
        bare?: boolean;
        /** Where a refused write is said, for a caller with a message line of its own. */
        onsaid?: (said: string) => void;
    };

    let { root, path, bare = false, onsaid }: Props = $props();

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
        const refusal = markRefusal(answer);
        if (onsaid === undefined) failed = refusal;
        else onsaid(refusal === '' ? '' : t('file.bookmark_failed', refusal));
    }
</script>

<span class="star" class:set={marked !== null}>
    <ToolButton
        {bare}
        label={marked === null ? t('file.bookmark') : t('file.unbookmark')}
        glyph={t('file.bookmark_glyph')}
        pressed={marked !== null}
        active={marked !== null}
        onclick={() => void mark()}
    />
</span>

{#if failed !== ''}
    <span class="failed" aria-live="polite">{t('file.bookmark_failed', failed)}</span>
{/if}

<style>
    /* The star is filled while the file is bookmarked, so a bare star in a bar, which draws no
       active background, still says it is set. */
    .star {
        display: contents;
    }

    .star.set :global(svg) {
        fill: currentColor;
    }

    .failed {
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
