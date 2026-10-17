<script lang="ts">
    // Layer 3, primitive. The box a glyph is chosen in, VS Code's Change Icon: a quick pick
    // (QuickPick.svelte) whose rows are the caller's word for "no glyph" first, then the glyph
    // vocabulary, each name drawn with its icon and in words, the name itself dimmed after them
    // (glyphItems of ./choices.ts). The text typed narrows the rows by their words and by the name,
    // so a glyph is found by what it reads as and by the name a manifest holds. Choosing a row, the
    // first one included, hands its name out and closes the box; Escape or a press outside closes
    // it and changes nothing. A stored value the vocabulary no longer holds is listed as it is,
    // after the first row. The words are the caller's.

    import QuickPick from './QuickPick.svelte';
    import { glyphItems } from './choices';
    import type { Choice } from './quick-pick';

    type Props = {
        /** The glyph name held now, or the empty string for none. */
        value: string;
        /** The names of the glyph vocabulary. */
        choices: string[];
        /** The box's title and the search field's accessible name, already translated. */
        title: string;
        label: string;
        /** The word for the empty choice, already translated. */
        empty: string;
        /** A name was chosen; the empty string is the empty choice. */
        onpick: (name: string) => void;
        onclose: () => void;
    };

    let { value, choices, title, label, empty, onpick, onclose }: Props = $props();

    /** The rows: each glyph by its words with its icon, and its name as the description. */
    const rows: Choice[] = $derived(
        glyphItems(value, empty, choices).map((item) =>
            item.icon
                ? { id: item.value, label: item.label, glyph: item.value, description: item.value }
                : { id: item.value, label: item.label }
        )
    );
</script>

<QuickPick {title} placeholder={label} choices={rows} {onpick} {onclose} />
