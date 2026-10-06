<script lang="ts">
    // Layer 3, primitive. The right-click menu every text box carries (text-menu.ts): it wraps the
    // box, reads the box's selection and read-only state as the right-click arrives, and runs the
    // pick on the box. The menu is the box's own, so a menu of a row or a view around it does not
    // open over it. In the desktop app it also asks the page's spell checker about the word at the
    // caret on a right-click (spelling.ts) and draws the suggestions at the top of the menu,
    // whether the answer comes before the menu opens or after.

    import type { Snippet } from 'svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { useSpelling } from './spelling';
    import {
        suggestionItems,
        textFacts,
        textMenu,
        textPicked,
        wordAt,
        type WordRange
    } from './text-menu';

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

    const ask = useSpelling();

    /** The word the last right-click was on, and what the spell checker suggests for it. */
    let range = $state.raw<WordRange | null>(null);
    let suggested = $state.raw<string[]>([]);

    /**
     * The facts of the right-click: the box's selection, and, where the page has a spell checker
     * and the box can be written to, the word at the caret, asked about once. An answer for a word
     * the caret has left since is dropped, and a word the checker accepts shows no suggestion.
     */
    function read(): MenuItem[] {
        const held = box();
        suggested = [];
        range = null;
        if (held === null) return [];
        if (ask !== undefined && !held.readOnly && !secret) {
            const found = wordAt(held.value, held.selectionStart ?? 0);
            range = found;
            if (found !== null) {
                void ask(found.word).then((answer) => {
                    if (range === found && answer.misspelled) suggested = answer.suggestions;
                });
            }
        }
        return textMenu(textFacts(held, secret), t);
    }

    function picked(pick: string): void {
        const held = box();
        if (held !== null) textPicked(held, pick, range);
    }
</script>

<ContextMenu {label} own {read} lead={suggestionItems(suggested)} onpick={picked}>
    {@render children()}
</ContextMenu>
