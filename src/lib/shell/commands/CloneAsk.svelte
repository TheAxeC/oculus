<script lang="ts">
    // Layer 3, shell. The question after a repository was cloned. Open and Add to Workspace are the
    // two answers; Open of a workspace holding unsaved folders asks once more, Save, Don't Save or
    // Cancel, and Save asks for the name of the workspace file. Cancel, Escape and a press on the
    // ground close the question and change nothing (state/sources/clone/clone-after.svelte.ts).

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        clone: { after }
    } = useState();

    const held = $derived(after.asking());
    let name = $state('');

    /** The last segment of a folder, which the questions name it by. */
    function baseOf(dir: string): string {
        return dir.replace(/\/+$/, '').split('/').at(-1) ?? dir;
    }
</script>

{#if held !== null && held.step === 'after'}
    <Confirm
        message={t('app.clone.after', baseOf(held.dir))}
        detail={held.dir}
        confirm={t('app.clone.open')}
        others={[t('app.clone.add')]}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void after.open()}
        onother={() => void after.add()}
        oncancel={after.cancel}
    />
{:else if held !== null && held.step === 'leave'}
    <Confirm
        message={t('app.clone.leave', baseOf(held.dir))}
        confirm={t('app.clone.save')}
        others={[t('app.clone.dont_save')]}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => {
            name = '';
            after.save();
        }}
        onother={() => void after.dontSave()}
        oncancel={after.cancel}
    />
{:else if held !== null}
    <Modal level="palette" onclose={after.cancel}>
        {#snippet children(props)}
            <div {...props} class="box" aria-label={t('app.clone.name_label')}>
                <p class="heading">{t('app.clone.name_prompt', baseOf(held.dir))}</p>
                <TextInput
                    value={name}
                    label={t('app.clone.name_label')}
                    oninput={(next: string) => (name = next)}
                    onenter={(value: string) => void after.named(value)}
                    invalid={held.said === '' ? undefined : held.said}
                />
                {#if held.said !== ''}
                    <p class="message">{held.said}</p>
                {/if}
                <div class="row">
                    <ToolButton label={t('ui.confirm_cancel')} onclick={after.cancel} />
                    <ToolButton
                        label={t('app.clone.save')}
                        onclick={() => void after.named(name)}
                    />
                </div>
            </div>
        {/snippet}
    </Modal>
{/if}

<style>
    .box {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(30rem, 100%);
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    .box :global(input[type='text']) {
        width: 100%;
        max-width: none;
        box-sizing: border-box;
    }

    .heading {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .message {
        margin: 0;
        color: var(--c-red-txt);
        font-size: var(--fs-xs);
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }
</style>
