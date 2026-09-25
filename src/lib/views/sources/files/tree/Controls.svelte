<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The view's own toolbar: the workspace
    // in force picked from a menu, the control that adds a root, and the two toggles that list
    // hidden files and the files git ignores. Each acts on the whole tree rather than any one root,
    // so they sit on the view's header, which is drawn in every state the view is in, while the
    // roots are still being read, when they could not be read and when there are none; a control on
    // a root's head would be gone in exactly those states. The toggles are the tab's own state, so
    // two file browsers list the same folder each their own way.

    import { workspaceChoices, type ListingShown } from '$lib/state/sources/fs';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        current: string;
        names: string[];
        /** Whether the form that adds a root is open. */
        adding: boolean;
        /** What the tab's listings show beside the default, which the two toggles flip. */
        shown: ListingShown;
        onselect: (name: string) => void;
        onadd: () => void;
        /** Flip one of the two toggles. */
        onshow: (which: keyof ListingShown) => void;
    };

    let { current, names, adding, shown, onselect, onadd, onshow }: Props = $props();

    /** The configured roots first, under the words for them, then every saved workspace. */
    const items = $derived<MenuItem[]>(
        workspaceChoices(names).map((name) => ({
            id: name,
            label: name === '' ? t('files.workspace_default') : name,
            active: name === current
        }))
    );
</script>

<Toolbar label={t('files.toolbar')}>
    <Menu
        label={t('files.workspace')}
        glyph={t('files.workspace_glyph')}
        compact
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
        expanded={adding}
        onclick={onadd}
    />
    <ToolButton
        label={t('files.show_hidden')}
        title={t('files.show_hidden_title')}
        active={shown.hidden}
        pressed={shown.hidden}
        onclick={() => onshow('hidden')}
    />
    <ToolButton
        label={t('files.show_ignored')}
        title={t('files.show_ignored_title')}
        active={shown.ignored}
        pressed={shown.ignored}
        onclick={() => onshow('ignored')}
    />
</Toolbar>
