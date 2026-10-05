<script lang="ts">
    // Layer 3, shared view support. The actions of a file tab that stand at the right end of its
    // breadcrumb bar, handed up to the pane through ui/tabs/tab-actions.svelte.ts: the tab's own
    // actions before them (`lead`: Save and Revert File), the star, Open in Program, and the tab's
    // own actions after them (`tail`: Open Preview and Toggle Blame). Every file view draws this
    // one row, so a bookmark or an open in the file's program is the same control wherever the file
    // opens.
    //
    // The star and Open in Program apply to a file under a served root (`onDisk`; a tab over the
    // file at HEAD or in the index names a repository's folder, not a served root, and an untitled
    // text names no file), and Open in Program only to a file whose extension `open.program_ext`
    // maps, the rule the tab menu and the server hold too (data/helpers/files/opens-in-program.ts).

    import type { Snippet } from 'svelte';
    import { opensInProgram } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import BookmarkStar from './BookmarkStar.svelte';
    import { servedFile } from './file-bar';
    import ProgramButton from './ProgramButton.svelte';

    type Props = {
        /** The file's root key and its path under it. */
        root: string;
        path: string;
        /** Whether the tab shows a file under a served root, which the star and the open act on. */
        onDisk?: boolean;
        /** The tab's own actions before the star. */
        lead?: Snippet;
        /** The tab's own actions after Open in Program. */
        tail?: Snippet;
    };

    let { root, path, onDisk = true, lead, tail }: Props = $props();

    const {
        fs: { roots },
        selectors: { programApps }
    } = useState();

    /** Whether the root is one the server serves, which the bookmark and the open are made over. */
    const served = $derived(servedFile(roots(), root, path, onDisk));
    /** Whether the extension is one `open.program_ext` names an application for. */
    const program = $derived(served && opensInProgram(path, programApps()));
</script>

<div class="actions" role="toolbar" aria-label={t('file.bar')}>
    {#if lead}
        {@render lead()}
    {/if}
    {#if served}
        <BookmarkStar bare {root} {path} />
    {/if}
    {#if program}
        <ProgramButton bare {root} {path} />
    {/if}
    {#if tail}
        {@render tail()}
    {/if}
</div>

<style>
    .actions {
        display: flex;
        align-items: center;
        gap: var(--tab-action-gap);
    }
</style>
