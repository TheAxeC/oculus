<script lang="ts">
    // Layer 3, view partial. What a connector with no account draws in place of its rows: the
    // view's sentence, and Add account as the empty state's action, which opens the same form the
    // header's control opens.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    let { message, glyph, onadd }: { message: string; glyph: string; onadd: () => void } = $props();
</script>

{#snippet add()}
    <ToolButton small label={t('accounts.add')} onclick={onadd} />
{/snippet}

<Empty {message} {glyph} action={add} />
