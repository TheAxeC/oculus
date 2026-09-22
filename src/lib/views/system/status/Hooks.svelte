<script lang="ts">
    // Layer 3, view partial. The Claude Code hooks block: what it does, the block itself, and a
    // control that copies it. The block is built here, by state/sessions/hooks.ts, from the address
    // the page was served on, so what a reader installs posts to the server that drew it. An origin
    // the caller could not read leaves the section out, since a block that posts nowhere helps
    // nobody.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { hooksSnippet } from '$lib/state/sessions/hooks';
    import { t } from '$lib/state/words/text';

    type Props = {
        /**
         * The page's own origin, `location.origin`, or empty where there is no location to read.
         */
        origin: string;
    };

    let { origin }: Props = $props();

    const snippet = $derived(hooksSnippet(origin));

    /** What the last copy did, shown beside the control; empty until one is pressed. */
    let said = $state('');

    /** Put the block on the clipboard, and say either way what happened. */
    async function copy(): Promise<void> {
        if (typeof navigator === 'undefined' || !('clipboard' in navigator)) {
            said = t('status.hooks_copy_blocked');
            return;
        }
        try {
            await navigator.clipboard.writeText(snippet);
            said = t('status.hooks_copied');
        } catch {
            said = t('status.hooks_copy_failed');
        }
    }
</script>

{#if origin !== ''}
    <section class="hooks">
        <h3>{t('status.hooks_title')}</h3>
        <p>{t('status.hooks_help')}</p>
        <pre>{snippet}</pre>
        <div class="controls">
            <ToolButton label={t('status.hooks_copy')} onclick={copy} />
            {#if said !== ''}
                <span class="said">{said}</span>
            {/if}
        </div>
    </section>
{/if}

<style>
    .hooks {
        margin-top: 16px;
        border-top: 1px solid var(--line);
        padding-top: 10px;
    }

    h3 {
        margin: 0;
        font-size: var(--fs-md);
    }

    p {
        color: var(--muted-txt, var(--muted));
    }

    pre {
        max-height: 24em;
        overflow: auto;
        margin: 0;
        padding: 8px;
        border: 1px solid var(--line);
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
    }

    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
