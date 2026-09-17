<script lang="ts">
    // Layer 3, partial of views/Files.svelte. The view's own toolbar: the workspace in force picked
    // from a menu, and the control that adds a root. Both change the workspace rather than any one
    // root, so they sit on the view's header, which is drawn in every state the view is in, while the
    // roots are still being read, when they could not be read and when there are none; a control on
    // a root's head would be gone in exactly those states.

    import { workspaceChoices } from '$lib/state/fs';
    import Menu from '$lib/ui/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu-items';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        current: string;
        names: string[];
        /** Whether the form that adds a root is open. */
        adding: boolean;
        onselect: (name: string) => void;
        onadd: () => void;
    };

    let { current, names, adding, onselect, onadd }: Props = $props();

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
</Toolbar>
