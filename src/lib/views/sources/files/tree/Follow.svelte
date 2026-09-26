<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. Follow mode's side of a Files tab: when
    // the followed folder moves, the tree opens that folder, the head of its tree, once per
    // move; and a line says when nothing followed names a folder, or when no root holds it, since
    // the file server lists nothing outside its roots.

    import { followRevealed, type FollowView } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The Files instance the tree belongs to. */
        owner: string;
        follow: FollowView;
    };

    let { owner, follow }: Props = $props();

    const {
        ui: { instanceState, setInstanceState }
    } = useState();

    /** The folder the tab last opened, so each move is asked for once. */
    let revealedDir = '';

    $effect(() => {
        const dir = follow.dir;
        const found = follow.found;
        if (dir === null) revealedDir = '';
        if (dir === null || found === null || dir === revealedDir) return;
        revealedDir = dir;
        untrack(() => setInstanceState(owner, followRevealed(instanceState(owner), found)));
    });
</script>

{#if follow.following && follow.dir === null}
    <p class="said" data-follow-line>{t('files.follow_none')}</p>
{:else if follow.following && follow.found === null}
    <p class="said" data-follow-line>{t('files.follow_unserved', follow.dir ?? '')}</p>
{/if}

<style>
    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
