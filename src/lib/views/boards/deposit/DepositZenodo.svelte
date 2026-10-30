<script lang="ts">
    // Layer 3, partial of views/boards/deposit/Deposit.svelte. The Zenodo deposit of one project:
    // For review, which sends an anonymised copy of `code/` with the author Anonymous and its files
    // open only through a share link, and Publish, which sends the real files and authors, public;
    // each behind the yes of views/shared/writes/AskConfirm.svelte, and each a press of the parent
    // (the deposit actions zenodoReview and zenodoPublish of POST /api/deposit). The DOI and the
    // share link are read from the snapshot's `code_availability` of the project, each with a Copy
    // button, and the sentence the last press answered is shown under them. With the `downloads`
    // row of the Zenodo token missing (the deposit GET's `zenodo.ready`), both buttons are off with
    // a tip naming the setting. Neither needs a mirror: the review copy is made in a folder of its
    // own on the server.

    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { CodeAvailability } from '$lib/state/system/deposit.svelte';
    import { t } from '$lib/state/shared/words/text';

    /** What a press answered: whether it went through, and its sentence. */
    type Pressed = { ok: boolean; output: string; error: string };

    type Props = {
        id: string;
        /** The project's `code_availability` as the snapshot holds it, or nothing. */
        code: CodeAvailability | undefined;
        /** Whether the Zenodo token's `downloads` row is held. */
        ready: boolean;
        /** Whether a request of the panel is in flight, which disables both presses. */
        busy: boolean;
        /** Run one confirmed Zenodo action. */
        onpress: (action: 'zenodoReview' | 'zenodoPublish') => Promise<Pressed>;
    };

    let { id, code, ready, busy, onpress }: Props = $props();

    /** The dialog, or null when nothing is being asked. */
    let asking: Ask | null = $state(null);
    /** The sentence of the last press or copy, shown under the section. */
    let said = $state('');

    const doi = $derived(code?.doi ?? '');
    const link = $derived(code?.reviewLink ?? '');
    const status = $derived(code?.zenodoStatus ?? '');

    function review(): void {
        asking = {
            message: t('deposit.zenodo_review_confirm', id),
            detail: t('deposit.zenodo_review_detail'),
            act: () => void run('zenodoReview')
        };
    }

    function publish(): void {
        asking = {
            message: t('deposit.zenodo_publish_confirm', id),
            detail: t('deposit.zenodo_publish_detail'),
            act: () => void run('zenodoPublish')
        };
    }

    async function run(action: 'zenodoReview' | 'zenodoPublish'): Promise<void> {
        said = '';
        const answer = await onpress(action);
        said = answer.ok ? answer.output : answer.error;
    }

    /** Put one text on the clipboard, and say either way what happened. */
    async function copy(text: string): Promise<void> {
        if (typeof navigator === 'undefined' || !('clipboard' in navigator)) {
            said = t('deposit.zenodo_copy_blocked');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            said = t('deposit.zenodo_copied');
        } catch {
            said = t('deposit.zenodo_copy_failed');
        }
    }
</script>

<div class="grp">
    <div class="grp-h line">
        <span>{t('deposit.zenodo')}</span>
        <ToolButton
            small
            label={t('deposit.zenodo_review')}
            title={ready ? t('deposit.zenodo_review_title') : t('deposit.zenodo_off')}
            disabled={busy || !ready}
            onclick={review}
        />
        <ToolButton
            small
            label={t('deposit.zenodo_publish')}
            title={ready ? t('deposit.zenodo_publish_title') : t('deposit.zenodo_off')}
            disabled={busy || !ready}
            onclick={publish}
        />
    </div>
    <div class="line">
        <span class="lb">{t('deposit.zenodo_status')}</span>
        <span class="mt">{status === '' ? t('deposit.zenodo_status_none') : status}</span>
    </div>
    <div class="line">
        <span class="lb">{t('deposit.zenodo_doi')}</span>
        {#if doi === ''}
            <span class="mt">{t('deposit.zenodo_doi_none')}</span>
        {:else}
            <span class="val">{doi}</span>
            <ToolButton
                small
                label={t('deposit.zenodo_copy')}
                title={t('deposit.zenodo_copy_doi')}
                onclick={() => void copy(doi)}
            />
        {/if}
    </div>
    <div class="line">
        <span class="lb">{t('deposit.zenodo_link')}</span>
        {#if link === ''}
            <span class="mt">{t('deposit.zenodo_link_none')}</span>
        {:else}
            <span class="val" title={link}>{link}</span>
            <ToolButton
                small
                label={t('deposit.zenodo_copy')}
                title={t('deposit.zenodo_copy_link')}
                onclick={() => void copy(link)}
            />
        {/if}
    </div>
    {#if !ready}
        <p class="none">{t('deposit.zenodo_off')}</p>
    {/if}
    {#if said !== ''}
        <p class="outcome">{said}</p>
    {/if}
</div>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .grp {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 6px 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .grp-h {
        color: var(--muted-txt);
        font-size: var(--fs-xs);
    }

    .line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .lb {
        color: var(--muted-txt);
        font-size: var(--fs-xs);
    }

    .val {
        color: var(--ink-txt);
        font-family: var(--font-mono);
        overflow-wrap: anywhere;
    }

    .mt {
        color: var(--muted-txt);
        font-size: var(--fs-sm);
    }

    .none,
    .outcome {
        font-size: var(--fs-md);
        margin: 0;
    }

    .none {
        color: var(--muted-txt);
    }

    .outcome {
        color: var(--ink-txt);
    }
</style>
