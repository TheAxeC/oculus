<script lang="ts">
    // Layer 3, view partial. The More Actions of one setting, as VS Code's gear: a menu of Reset
    // Setting, which writes the default back (or makes the browser forget its own value), and Copy
    // Setting ID, which copies the key path. The item around it decides when it is drawn.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Whether Reset Setting is offered. */
        reset: boolean;
        /** Whether Copy Setting ID is offered. */
        copy: boolean;
        onreset: () => void;
        oncopy: () => void;
    };

    let { reset, copy, onreset, oncopy }: Props = $props();

    const items = $derived<MenuItem[]>([
        ...(reset
            ? [{ id: 'reset', label: t('workbench.settings_reset'), glyph: 'note_back' }]
            : []),
        ...(copy ? [{ id: 'copy', label: t('workbench.settings_copy_id'), glyph: 'copy' }] : [])
    ]);

    function picked(id: string): void {
        if (id === 'reset') onreset();
        else oncopy();
    }
</script>

<Menu
    label={t('workbench.settings_gear')}
    glyph="more"
    compact
    bare
    placement="down"
    align="right"
    {items}
    onpick={picked}
/>
