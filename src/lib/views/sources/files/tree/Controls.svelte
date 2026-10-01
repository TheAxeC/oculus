<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The view's own header actions, all
    // icons: the workspace in force picked from a menu, the control that adds a root, the follow
    // toggle that roots the tree at the selected session's workspace, and while it follows, the pin
    // that keeps it on the session it follows (the tab's `session`, as a session view pins one).
    // Each acts on the whole tree, not on any one root, so they sit on the view's header, which is
    // drawn in every state the view is in: while the roots are still being read, when they could
    // not be read and when there are none. A control on a root's head would be gone in exactly
    // those states. The two toggles that list hidden files and the files git ignores are on the
    // bar (tree/Filters.svelte).

    import {
        followsSession,
        withFollow,
        withFollowPin,
        workspaceChoices
    } from '$lib/state/sources/fs';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';

    type Props = {
        current: string;
        names: string[];
        /** Whether the form that adds a root is open. */
        adding: boolean;
        /** The Files instance whose follow mode the follow toggle turns on and off. */
        owner: string;
        /** The session or terminal the tab follows now, which the pin keeps; null for none. */
        followed: string | null;
        onselect: (name: string) => void;
        onadd: () => void;
    };

    let { current, names, adding, owner, followed, onselect, onadd }: Props = $props();

    const {
        layout: { instanceLayoutState, restateInstance }
    } = useState();

    const following = $derived(followsSession(instanceLayoutState(owner)));
    const pinned = $derived(pinnedSession(instanceLayoutState(owner)) !== null);

    /** The configured roots first, under the words for them, then every saved workspace. */
    const items = $derived<MenuItem[]>(
        workspaceChoices(names).map((name) => ({
            id: name,
            label: name === '' ? t('files.workspace_default') : name,
            active: name === current
        }))
    );
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
    <Menu
        label={t('files.workspace')}
        glyph={t('files.workspace_glyph')}
        compact
        bare
        placement="down"
        align="right"
        {items}
        onpick={(name: string) => onselect(name)}
    />
    <ToolButton
        label={t('files.add_root')}
        title={t('files.add_root_title')}
        glyph="folder_add"
        compact
        bare
        active={adding}
        pressed={adding}
        onclick={onadd}
    />
</Toolbar>
