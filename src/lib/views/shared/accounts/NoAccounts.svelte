<script lang="ts">
    // Layer 3, view partial. What a connector with no account draws in place of its rows: the
    // view's sentence, and Add account, which opens the same form the head's control opens.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    let { message, glyph, onadd }: { message: string; glyph: string; onadd: () => void } = $props();
</script>

<div class="none">
    <Empty {message} {glyph} />
    <span>
        <ToolButton label={t('accounts.add')} glyph={t('accounts.add_glyph')} onclick={onadd} />
    </span>
</div>

<style>
    .none {
        display: grid;
        justify-items: start;
        gap: 4px;
    }
</style>
