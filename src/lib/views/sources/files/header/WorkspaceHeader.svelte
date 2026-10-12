<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The workspace in force as VS Code's
    // Explorer heads its folders: a 22 px pane header, the workspace's name in capitals with the
    // twistie at its left, and at its right, while the pointer is over it or the focus is in it,
    // the four title actions (New File..., New Folder..., Refresh Explorer, Collapse Folders in
    // Explorer) and the `...` menu: Add Folder to Workspace..., Switch Workspace..., New
    // Workspace..., Save Workspace As..., Close Workspace (while a workspace file is open), Open
    // Folder..., and the checked items Show Hidden Files, Show Ignored Files and File Nesting,
    // which are the tab's own state. It is the first row of the tree, so the arrow keys walk from
    // it into the roots, and a press on it opens or closes them.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import type { ItemDrag } from '$lib/ui/tree/item-props';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { HEADER_ID } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        nav: TreeNav;
        /** The workspace's name, or the words for an unsaved workspace. */
        label: string;
        /** Whether the roots show under the header. */
        open: boolean;
        /** The tab's three toggles. */
        hidden: boolean;
        ignored: boolean;
        nesting: boolean;
        ontoggle: () => void;
        onnewfile: () => void;
        onnewfolder: () => void;
        onrefresh: () => void;
        oncollapse: () => void;
        /** Flip one of the tab's toggles. */
        onflip: (which: 'hidden' | 'ignored' | 'nesting') => void;
        onaddfolder: () => void;
        onswitch: () => void;
        onsave: () => void;
        onnew: () => void;
        onclosework: () => void;
        /** Whether a workspace file is open, which Close Workspace leaves. */
        saved: boolean;
        onopenfolder: () => void;
        /** Whether the folder panel is open, which disables the two items that open it. */
        panelOpen: boolean;
        /** What lets the header be dragged over the heads of the view's other sections. */
        drag?: ItemDrag;
    };

    let {
        nav,
        label,
        open,
        hidden,
        ignored,
        nesting,
        ontoggle,
        onnewfile,
        onnewfolder,
        onrefresh,
        oncollapse,
        onflip,
        onaddfolder,
        onswitch,
        onsave,
        onnew,
        onclosework,
        saved,
        onopenfolder,
        panelOpen,
        drag
    }: Props = $props();

    /** The menu's items in VS Code's groups, the three toggles drawn checked while on. */
    const items = $derived<MenuItem[]>([
        { id: 'add-folder', label: t('files.menu_add_root'), disabled: panelOpen },
        { id: 'switch-workspace', label: t('files.menu_switch_workspace'), rule: true },
        { id: 'new-workspace', label: t('files.menu_new_workspace') },
        { id: 'save-workspace', label: t('files.menu_save_workspace') },
        { id: 'close-workspace', label: t('files.menu_close_workspace'), disabled: !saved },
        { id: 'open-folder', label: t('files.menu_open_folder'), disabled: panelOpen },
        { id: 'hidden', label: t('files.menu_show_hidden'), active: hidden, rule: true },
        { id: 'ignored', label: t('files.menu_show_ignored'), active: ignored },
        { id: 'nesting', label: t('files.menu_nesting'), active: nesting }
    ]);

    function picked(id: string): void {
        if (id === 'add-folder') onaddfolder();
        else if (id === 'switch-workspace') onswitch();
        else if (id === 'new-workspace') onnew();
        else if (id === 'save-workspace') onsave();
        else if (id === 'close-workspace') onclosework();
        else if (id === 'open-folder') onopenfolder();
        else if (id === 'hidden' || id === 'ignored' || id === 'nesting') onflip(id);
    }
</script>

<TreeItem
    {label}
    id={HEADER_ID}
    {nav}
    level={1}
    heading
    expanded={open}
    title={open ? t('files.header_close_title', label) : t('files.header_open_title', label)}
    onclick={ontoggle}
    {drag}
>
    {#snippet actions(reach: number)}
        <ToolButton
            label={t('files.header_new_file')}
            glyph="file_add"
            compact
            tabindex={reach}
            onclick={onnewfile}
        />
        <ToolButton
            label={t('files.header_new_folder')}
            glyph="folder_add"
            compact
            tabindex={reach}
            onclick={onnewfolder}
        />
        <ToolButton
            label={t('files.header_refresh')}
            glyph="refresh"
            compact
            tabindex={reach}
            onclick={onrefresh}
        />
        <ToolButton
            label={t('files.header_collapse')}
            glyph="collapse_all"
            compact
            tabindex={reach}
            onclick={oncollapse}
        />
        <Menu
            label={t('files.header_menu')}
            glyph="more"
            compact
            bare
            placement="down"
            align="right"
            tabindex={reach}
            {items}
            onpick={picked}
        />
    {/snippet}
</TreeItem>
