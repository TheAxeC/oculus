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
    <span class="copy">
        <ToolButton
            label={copied ? t('accounts.copied') : t('accounts.copy')}
            title={t('accounts.copy_value', value)}
            glyph={t('accounts.copy_glyph')}
            compact
            onclick={() => void copy()}
        />
    </span>
</span>

<style>
    /* `--row-reveal` says whether the copy control is drawn: 0 at rest and 1 while the value is
       hovered or holds the focus, and always on a screen whose pointer does not hover. */
    .value {
        --row-reveal: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
        min-width: 0;
    }
    .value:hover,
    .value:focus-within {
        --row-reveal: 1;
    }
    @media (hover: none) {
        .value {
            --row-reveal: 1;
        }
    }
    .copy {
        display: inline-flex;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }
    code {
        overflow-wrap: anywhere;
        font-size: var(--fs-md);
    }
</style>
