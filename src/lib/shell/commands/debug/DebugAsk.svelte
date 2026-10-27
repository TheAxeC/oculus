<script lang="ts">
    // Layer 3, shell. What the debugger puts over the page: the approval of a launch (the debug
    // configuration and the line `rite_dap <program>` it would run, in its folder when that is not
    // the repository's), the confirmation of a stop or a restart naming the adapter process, the
    // question after a `before` command ended other than 0 (Debug Anyway, Show Errors, Abort), and
    // the confirmation of aborting a launch by stopping the command's terminal. The debug store
    // holds the one question; a yes or a no is handed back to it.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        debug: { answer, asking, choice }
    } = useState();

    const held = $derived(asking());

    /** The words under the launch question: what runs and where. */
    function detailOf(program: string, cwd: string): string {
        const line = t('debug.ask_line', program);
        return cwd === '.' ? line : `${line}\n${t('debug.ask_in', cwd)}`;
    }
</script>

{#if held?.kind === 'launch'}
    <Confirm
        message={held.name === ''
            ? t('debug.ask_launch_default')
            : t('debug.ask_launch', held.name)}
        detail={detailOf(held.program, held.cwd)}
        confirm={t('debug.ask_yes')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void answer(true)}
        oncancel={() => void answer(false)}
    />
{:else if held?.kind === 'stop'}
    <Confirm
        message={t('debug.ask_stop', held.process)}
        confirm={held.restart ? t('debug.restart') : t('debug.stop')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void answer(true)}
        oncancel={() => void answer(false)}
    />
{:else if held?.kind === 'abort'}
    <Confirm
        message={t('debug.ask_abort', held.name)}
        confirm={t('debug.abort')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void answer(true)}
        oncancel={() => void answer(false)}
    />
{:else if held?.kind === 'before'}
    {@const words = t('debug.before_failed', held.name, held.code)}
    <Modal alert onclose={() => choice('abort')}>
        {#snippet children(props)}
            <div {...props} class="box" aria-label={words}>
                <p class="message">{words}</p>
                <div class="row">
                    <ToolButton label={t('debug.go_on')} onclick={() => choice('anyway')} />
                    <ToolButton label={t('debug.show_errors')} onclick={() => choice('errors')} />
                    <ToolButton label={t('debug.abort')} onclick={() => choice('abort')} />
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
