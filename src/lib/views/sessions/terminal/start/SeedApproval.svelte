<script lang="ts">
    // Layer 3, view partial. The approval a start with a task asks for ahead of the run: the seed
    // that would be sent, the folder and the agent it is approved for, and the two controls. The
    // approval is of the seed, the folder and the agent together, so a changed seed or another
    // folder asks again; the words the reader typed are outside it.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        seed: string;
        /** The folder the start runs in, as the server resolved it. */
        folder: string;
        /** The agent's words, translated by the page. */
        agent: string;
        /** Whether the approval is being written, which holds both controls. */
        busy: boolean;
        onapprove: () => void;
        oncancel: () => void;
    };

    let { seed, folder, agent, busy, onapprove, oncancel }: Props = $props();
</script>

<div class="approve" data-composer-approve role="group" aria-label={t('composer.approve_title')}>
    <p class="title">{t('composer.approve_title')}</p>
    <p class="detail">{t('composer.approve_detail')}</p>
    <pre class="seed" data-composer-seed>{seed}</pre>
    <p class="fact">{t('composer.approve_folder', folder)}</p>
    <p class="fact">{t('composer.approve_agent', agent)}</p>
    <div class="row">
        <ToolButton
            label={t('composer.approve_no')}
            title={t('composer.approve_no')}
            disabled={busy}
            onclick={oncancel}
        />
        <ToolButton
            label={t('composer.approve_yes')}
            title={t('composer.approve_yes')}
            glyph="launch"
            disabled={busy}
            onclick={onapprove}
        />
    </div>
</div>

<style>
    .approve {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        padding: 8px;
    }

    p {
        margin: 0;
    }

    .title {
        font-weight: 600;
    }

    .detail,
    .fact {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }

    .seed {
        margin: 0;
        max-height: 12rem;
        overflow: auto;
        font: inherit;
        font-size: var(--fs-md);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        padding: 4px 6px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
    }
</style>
