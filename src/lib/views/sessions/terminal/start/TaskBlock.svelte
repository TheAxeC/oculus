<script lang="ts">
    // Layer 3, view partial. The task a composer is seeded with: the seed the server built for it,
    // shown read-only under the word Task, and a control that drops the task so the start is a
    // plain one. What the reader types in the prompt box below is added to the seed; the text here
    // is the server's, shown as it will be sent.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The seed the server answered for the task. */
        seed: string;
        onremove: () => void;
    };

    let { seed, onremove }: Props = $props();
</script>

<div class="task" data-composer-task>
    <div class="head">
        <span class="label">{t('composer.task_label')}</span>
        <ToolButton
            label={t('composer.task_remove')}
            title={t('composer.task_remove_title')}
            glyph="dismiss"
            compact
            bare
            onclick={onremove}
        />
    </div>
    <pre class="seed" data-composer-seed>{seed}</pre>
</div>

<style>
    .task {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        padding: 6px 8px 0;
    }

    .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
    }

    .label {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .seed {
        margin: 0;
        max-height: 9rem;
        overflow: auto;
        font: inherit;
        font-size: var(--fs-md);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: var(--ink);
    }
</style>
