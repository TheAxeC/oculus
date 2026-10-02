<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The view's own toolbar, all icons: the
    // follow toggle that roots the tree at the selected session's workspace, and while it follows,
    // the pin that keeps it on the session it follows (the tab's `session`, as a session view pins
    // one). The workspace, its folders and the listing toggles are the workspace header's
    // (header/WorkspaceHeader.svelte), a row of the tree. The toolbar is drawn in every state the
    // view is in: while the roots are still being read, when they could not be read and when there
    // are none.

    import { followsSession, withFollow, withFollowPin } from '$lib/state/sources/fs';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';

    type Props = {
        /** The Files instance whose follow mode the follow toggle turns on and off. */
        owner: string;
        /** The session or terminal the tab follows now, which the pin keeps; null for none. */
        followed: string | null;
    };

    let { owner, followed }: Props = $props();

    const {
        layout: { instanceLayoutState, restateInstance }
    } = useState();

    const following = $derived(followsSession(instanceLayoutState(owner)));
    const pinned = $derived(pinnedSession(instanceLayoutState(owner)) !== null);
</script>

<Toolbar label={t('files.toolbar')} overflow>
    <ToolButton
        label={t('files.follow')}
        title={t('files.follow_title')}
        glyph="compass"
        compact
        bare
        active={following}
        pressed={following}
        onclick={() => restateInstance(owner, withFollow(instanceLayoutState(owner), !following))}
    />
    {#if following && (pinned || followed !== null)}
        <ToolButton
            label={pinned ? t('files.follow_unpin') : t('files.follow_pin')}
            title={pinned ? t('files.follow_unpin') : t('files.follow_pin')}
            glyph="pin"
            compact
            bare
            active={pinned}
            pressed={pinned}
            onclick={() =>
                restateInstance(
                    owner,
                    withFollowPin(instanceLayoutState(owner), pinned ? null : followed)
                )}
        />
    {/if}
</Toolbar>
