<script lang="ts">
    // Layer 3, shared view partial. The line a tab limited to a folder draws under its query row:
    // the words that say which folder the tab is limited to, and a control that takes the limit
    // away in that tab only. Search, Problems, Repositories and the sessions list draw it, each
    // with the words of its own catalogue, so the line reads the same and the control says what it
    // widens to.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';

    type Props = {
        /** The line: which folder the tab is limited to. */
        text: string;
        /** The control's words, and the tip that says what it widens the tab to. */
        clear: string;
        title: string;
        onclear: () => void;
    };

    let { text, clear, title, onclear }: Props = $props();
</script>

<p class="scope" data-folder-line>
    <span>{text}</span>
    <ToolButton label={clear} {title} glyph="dismiss" compact onclick={onclear} />
</p>

<style>
    /* The line takes the bar's whole width, so it sits under the query row. */
    .scope {
        display: flex;
        flex-basis: 100%;
        align-items: center;
        gap: 6px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
