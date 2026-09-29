<script lang="ts">
    // A menu held open for tests/ui/menu/menu.test.ts: the item drawing ui/menu/Menu.svelte and
    // ui/menu/ContextMenu.svelte share, inside an open bits-ui menu drawn in place, since the
    // page's menus draw their list through the portal and a server render draws nothing there.

    import { DropdownMenu } from 'bits-ui';
    import MenuList from '../../../src/lib/ui/menu/MenuList.svelte';
    import type { MenuGroup, MenuItem } from '../../../src/lib/ui/menu/menu-items';

    type Props = { items: MenuItem[]; groups?: MenuGroup[] };

    let { items, groups }: Props = $props();
</script>

<DropdownMenu.Root open>
    <DropdownMenu.Content>
        {#snippet child({ wrapperProps, props })}
            <div {...wrapperProps}>
                <MenuList label="Menu" {items} {groups} onpick={() => undefined} list={props} />
            </div>
        {/snippet}
    </DropdownMenu.Content>
</DropdownMenu.Root>
