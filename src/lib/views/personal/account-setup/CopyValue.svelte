<script lang="ts">
    // Layer 3, view partial. One value the reader enters at a provider's console, drawn as code
    // with a Copy control beside it that puts it on the clipboard.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    let { value }: { value: string } = $props();

    /** Whether this value was the last one copied, which the control says until the next press. */
    let copied = $state(false);

    async function copy(): Promise<void> {
        if (typeof navigator === 'undefined' || !('clipboard' in navigator)) return;
        await navigator.clipboard.writeText(value);
        copied = true;
    }
</script>

<span class="value" data-copy-value={value}>
    <code>{value}</code>
    <ToolButton
        label={copied ? t('accounts.copied') : t('accounts.copy')}
        title={t('accounts.copy_value', value)}
        glyph={t('accounts.copy_glyph')}
        compact
        onclick={() => void copy()}
    />
</span>

<style>
    .value {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
        min-width: 0;
    }
    code {
        overflow-wrap: anywhere;
        font-size: var(--fs-sm);
    }
</style>
