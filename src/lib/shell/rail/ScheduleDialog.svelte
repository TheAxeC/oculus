<script lang="ts">
    // Layer 3, shell. The dialog that adds or edits one schedule, drawn while the `schedule`
    // store holds a draft. It stands on the modal ground at the sheet level, over the update tray
    // that opened it, and takes the first Escape, so the tray stays open behind it. Its fields are
    // the ui primitives, each reading the draft and writing it back through the store; the store
    // owns the draft, its rules, its preview of the next runs and its post, so a save is refused
    // here by the rule the server refuses by.
    //
    // A save that the rule refuses lists every sentence it gives and stays open; one the server
    // refuses shows the server's sentence and stays open; one that lands puts the dialog away.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import SuggestInput from '$lib/ui/forms/choice/SuggestInput.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { schedule } = useState();

    let problems: string[] = $state([]);
    let saving = $state(false);

    const draft = $derived(schedule.dialog());

    /** Put the dialog away and forget what a save said. */
    function close(): void {
        problems = [];
        schedule.closeDialog();
    }

    async function save(): Promise<void> {
        if (draft === null) return;
        const found = schedule.check(draft);
        problems = found;
        if (found.length > 0) return;
        saving = true;
        const answer = await schedule.save(draft);
        saving = false;
        if (!answer.ok) problems = [answer.error];
        else problems = [];
    }
</script>

{#if draft !== null}
    <Modal level="sheet" onclose={close}>
        {#snippet children(props)}
            <div
                {...props}
                class="dialog"
                aria-label={draft.was === null
                    ? t('app.schedules.title_add')
                    : t('app.schedules.title_edit')}
                data-schedule-dialog
            >
                <h3>
                    {draft.was === null
                        ? t('app.schedules.title_add')
                        : t('app.schedules.title_edit')}
                </h3>
                <Field label={t('app.schedules.name')}>
                    <TextInput
                        value={draft.name}
                        label={t('app.schedules.name')}
                        oninput={(name: string) => schedule.edit({ name })}
                    />
                </Field>
                <Field label={t('app.schedules.runs')}>
                    <Select
                        value={draft.kind}
                        label={t('app.schedules.runs')}
                        choices={schedule.kinds()}
                        onchange={(value: string) => schedule.choose('kind', value)}
                    />
                </Field>
                {#if draft.kind === 'task'}
                    <Field label={t('app.schedules.task')}>
                        <Select
                            value={draft.task}
                            label={t('app.schedules.task')}
                            empty={draft.unchosen.includes('task')
                                ? t('app.schedules.refused_task')
                                : undefined}
                            choices={schedule.tasks()}
                            onchange={(value: string) => schedule.choose('task', value)}
                        />
                    </Field>
                {:else if draft.kind === 'command'}
                    <Field label={t('app.schedules.command')}>
                        <Select
                            value={draft.commandKey}
                            label={t('app.schedules.command')}
                            empty={t('app.schedules.refused_command')}
                            choices={schedule.commands()}
                            onchange={(value: string) => schedule.pickCommand(value)}
                        />
                    </Field>
                {:else}
                    <Field label={t('app.schedules.prompt')}>
                        <TextArea
                            value={draft.prompt}
                            label={t('app.schedules.prompt')}
                            oninput={(prompt: string) => schedule.edit({ prompt })}
                            rows={4}
                        />
                    </Field>
                    <Field label={t('app.schedules.folder')}>
                        <SuggestInput
                            value={draft.folder}
                            label={t('app.schedules.folder')}
                            suggestions={schedule.folders()}
                            oninput={(folder: string) => schedule.edit({ folder })}
                        />
                    </Field>
                {/if}
                <Field label={t('app.schedules.when')}>
                    <Select
                        value={draft.when}
                        label={t('app.schedules.when')}
                        choices={schedule.whens()}
                        onchange={(value: string) => schedule.choose('when', value)}
                    />
                </Field>
                {#if draft.when === 'day' || draft.when === 'week'}
                    <Field label={t('app.schedules.time')}>
                        <TextInput
                            value={draft.time}
                            label={t('app.schedules.time')}
                            oninput={(time: string) => schedule.edit({ time })}
                        />
                    </Field>
                {/if}
                {#if draft.when === 'week'}
                    <Field label={t('app.schedules.days')}>
                        <div class="days">
                            {#each schedule.dayNames() as day, at (at)}
                                <Checkbox
                                    checked={draft.days[at]}
                                    label={day}
                                    onchange={(on: boolean) =>
                                        schedule.edit({
                                            days: draft.days.map((was, index) =>
                                                index === at ? on : was
                                            )
                                        })}
                                />
                            {/each}
                        </div>
                    </Field>
                {/if}
                {#if draft.when === 'custom'}
                    <Field label={t('app.schedules.pattern')}>
                        <TextInput
                            value={draft.pattern}
                            label={t('app.schedules.pattern')}
                            oninput={(pattern: string) => schedule.edit({ pattern })}
                        />
                    </Field>
                {/if}
                {#if schedule.preview(draft) !== ''}
                    <p class="preview" data-preview>{schedule.preview(draft)}</p>
                {/if}
                {#if draft.kind !== 'command'}
                    <Checkbox
                        checked={draft.unattended}
                        label={t('app.schedules.unattended')}
                        unset={draft.unchosen.includes('unattended')
                            ? t('app.schedules.unattended_unset')
                            : undefined}
                        onchange={(unattended: boolean) => schedule.edit({ unattended })}
                        onunset={() => schedule.edit({ unattended: null })}
                    />
                    {#if draft.unattended === true}
                        <p class="preview" data-unattended-note>
                            {t('app.schedules.unattended_note')}
                        </p>
                    {/if}
                {/if}
                {#each problems as problem (problem)}
                    <p class="problem" data-problem>{problem}</p>
                {/each}
                <div class="buttons">
                    <ToolButton label={t('app.schedules.cancel')} onclick={close} />
                    <ToolButton
                        label={t('app.schedules.save')}
                        primary
                        disabled={saving}
                        onclick={save}
                    />
                </div>
            </div>
        {/snippet}
    </Modal>
{/if}

<style>
    .dialog {
        position: relative;
        display: grid;
        gap: 6px;
        width: min(32rem, 100%);
        max-height: 100%;
        overflow: auto;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    :global(body.wall) .dialog {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    h3,
    p {
        margin: 0;
    }

    h3 {
        font-size: var(--fs-md);
    }

    .days {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .preview {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .problem {
        color: var(--c-red-txt, var(--c-red));
        font-size: var(--fs-sm);
    }

    .buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
    }
</style>
