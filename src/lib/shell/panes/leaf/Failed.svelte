<script lang="ts">
    // Layer 3, shell. What a tab's view (../TabView.svelte) or the page on screen (PageArea.svelte)
    // draws in place of what threw while it was drawn: the error's words in the caller's sentence
    // and a control that draws it again, as VS Code says an editor could not be opened.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** What was thrown. */
        error: unknown;
        /** The sentence the error's words are said in. */
        wording: (words: string) => string;
        /** Draw it again. */
        reset: () => void;
    };

    let { error, wording, reset }: Props = $props();

    /** The words of what was thrown: its message, else what it reads as, its name for one. */
    const words = $derived(
        error instanceof Error && error.message !== '' ? error.message : String(error)
    );
</script>

<div class="failed">
    <Empty error message={wording(words)}>
        {#snippet action()}
            <ToolButton small label={t('app.view_retry')} onclick={reset} />
        {/snippet}
    </Empty>
</div>

<style>
    .failed {
        padding: 10px;
    }
</style>
