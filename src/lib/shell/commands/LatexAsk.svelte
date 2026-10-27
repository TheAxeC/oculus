<script lang="ts">
    // Layer 3, shell. The question a build or clean of a LaTeX main file puts over the page when
    // the server will not start it until the reader approves what it would run: the latexmkrc files
    // latexmk reads, which run as code on this machine, and the tools of a recipe that run the
    // code of the document. The step is a build or clean the reader pressed, a Rerun or Restart of
    // a build or clean terminal, or an automatic build or clean the status item shows as waiting.
    // Approve posts the approval and runs the step once (the LaTeX store's `approve`); Cancel
    // closes the question, a step the reader pressed stops waiting, and an automatic one keeps
    // waiting, which the LaTeX status item shows. When the files changed since they were listed the
    // list is drawn again under the sentence that says so until the reader acts, and a file that
    // cannot be read has its sentence and nothing to approve.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        latex: { approving, approve, dismissApproval }
    } = useState();

    const held = $derived(approving());

    /** The lines under the question: the sentence of a refusal, the files, then the tools. */
    function detailOf(
        approval: NonNullable<NonNullable<typeof held>['approval']>,
        message: string
    ): string {
        const parts: string[] = message === '' ? [] : [message];
        if (approval.latexmkrc.length > 0) {
            parts.push(t('latex.approve_latexmkrc'), approval.latexmkrc.join('\n'));
        }
        if (approval.weave !== null) {
            parts.push(
                t('latex.approve_weave', approval.weave.recipe),
                approval.weave.tools.join('\n')
            );
        }
        return parts.join('\n');
    }
</script>

{#if held !== null && held.approval !== null}
    <Confirm
        message={t('latex.approve_title', held.main)}
        detail={detailOf(held.approval, held.message)}
        confirm={held.approval.step === 'clean' ? t('latex.approve_clean') : t('latex.approve')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void approve()}
        oncancel={dismissApproval}
    />
{:else if held !== null}
    <Modal alert onclose={dismissApproval}>
        {#snippet children(props)}
            <div {...props} class="box" aria-label={held.message}>
                <p class="message">{held.message}</p>
                <div class="row">
                    <ToolButton label={t('ui.confirm_cancel')} onclick={dismissApproval} />
                </div>
            </div>
        {/snippet}
    </Modal>
{/if}

<style>
    .box {
        position: relative;
        max-width: 30rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    .message {
        margin: 0;
        font-size: var(--fs-md);
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }
</style>
