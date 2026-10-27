<script lang="ts">
    // Layer 3, view partial. The Claude Code hooks block: what it does, the block itself, and a
    // control that copies it. The block is built here, by state/sessions/hooks.ts, from the address
    // the page was served on, so what a reader installs posts to the server that drew it. An origin
    // the caller could not read leaves the section out, since a block that posts nowhere helps
    // nobody. The section is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), folded under the key `hooks` in the tab's state
    // (views/shared/card/pane-fold.ts).

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { hooksSnippet } from '$lib/state/sessions/hooks';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /**
         * The page's own origin, `location.origin`, or empty where there is no location to read.
         */
        origin: string;
    };

    let { origin }: Props = $props();

    /** Whether the section is open, kept in the tab's state. */
    const fold = usePaneFold();

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
    <GroupHead
        data-hooks
        label={t('status.hooks_title')}
        open={fold.open('hooks')}
        ontoggle={() => fold.toggle('hooks')}
    >
        <p>{t('status.hooks_help')}</p>
        <pre>{snippet}</pre>
        <div class="controls">
            <ToolButton label={t('status.hooks_copy')} onclick={copy} />
            {#if said !== ''}
                <span class="said">{said}</span>
            {/if}
        </div>
    </GroupHead>
{/if}

<style>
    p {
        margin: 0 0 6px;
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
        font-size: var(--fs-sm);
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
