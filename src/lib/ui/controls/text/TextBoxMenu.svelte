<script lang="ts">
    // Layer 3, primitive. The right-click menu every text box carries (text-menu.ts): it wraps the
    // box, reads the box's selection and read-only state as the right-click arrives, and runs the
    // pick on the box. The menu is the box's own, so a menu of a row or a view around it does not
    // open over it.

    import type { Snippet } from 'svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { textFacts, textMenu, textPicked } from './text-menu';

    type Props = {
        /** The box's accessible name, already translated by the view. */
        label: string;
        /** The box the menu acts on, null until it is drawn. */
        box: () => HTMLInputElement | HTMLTextAreaElement | null;
        /** A box whose text the browser keeps off the clipboard. */
        secret?: boolean;
        children: Snippet;
    };

    let { label, box, secret = false, children }: Props = $props();

    function picked(pick: string): void {
        const held = box();
        if (held !== null) textPicked(held, pick);
    }
</script>

<ContextMenu
    {label}
    own
    read={() => {
        const held = box();
        return held === null ? [] : textMenu(textFacts(held, secret), t);
    }}
    onpick={picked}
>
    {@render children()}
</ContextMenu>
