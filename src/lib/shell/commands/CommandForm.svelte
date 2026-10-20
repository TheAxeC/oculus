<script lang="ts">
    // Layer 3, shell. The form that writes an entry of a repository's `.oculus/commands.yml`, the
    // repository whose command bar opened it: its name, its line, an optional folder inside the
    // repository, an optional list of the commands it depends on, and an optional default (build,
    // test or none). Under the fields it lists the chain a press of the command would run, the
    // commands it depends on first, each line with its folder when that is not the repository; Save
    // approves that chain, so the reader's own command runs without a question until its text
    // changes. A new command is added at the end of the file's list, which is made from its
    // template when the repository has none; an edit rewrites the entry in its place, keeping the
    // keys the form does not show. The server's refusal is shown in the form and the form stays
    // open; a write that lands closes it.

    import Modal from '$lib/ui/frame/Modal.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { ClientState } from '$lib/state/client/context';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    /** The form as the commands store holds it: the repository and the command being edited. */
    type Forming = NonNullable<ReturnType<ClientState['commands']['forming']>>;

    /** The command a save is handed, as the fields describe it. */
    type Draft = Parameters<ClientState['commands']['save']>[1];

    type Props = {
        /** The repository the command is saved for. */
        repo: Forming['repo'];
        /** The command being edited, or null for a new one. */
        edit: Forming['edit'];
        onclose: () => void;
    };

    let { repo, edit, onclose }: Props = $props();

    const {
        commands: { draftLines, edit: change, save, watch }
    } = useState();

    // The repository's list is held while the form is open, so the chain is drawn over it.
    $effect(() => watch(repo));

    // The fields begin with what the command holds, once; after that what is typed is the form's.
    /* svelte-ignore state_referenced_locally */
    let name = $state(edit?.name ?? '');
    /* svelte-ignore state_referenced_locally */
    let run = $state(edit?.run ?? '');
    /* svelte-ignore state_referenced_locally */
    let cwd = $state(edit?.cwd ?? '');
    /* svelte-ignore state_referenced_locally */
    let depends = $state((edit?.depends_on ?? []).join(', '));
    /* svelte-ignore state_referenced_locally */
    let role = $state<string>(edit?.default ?? '');
    let failure = $state('');
    let saving = $state(false);

    const ready = $derived(name.trim() !== '' && run.trim() !== '' && !saving);

    /** The command the fields describe: only the fields that hold something are sent. */
    function draft(): Draft {
        const needs = depends
            .split(',')
            .map((one) => one.trim())
            .filter((one) => one !== '');
        return {
            name: name.trim(),
            run,
            ...(cwd.trim() === '' ? {} : { cwd: cwd.trim() }),
            ...(needs.length === 0 ? {} : { depends_on: needs }),
            ...(role === 'build' || role === 'test' ? { default: role } : {})
        };
    }

    async function submit(): Promise<void> {
        if (!ready) return;
        saving = true;
        const made = draft();
        const done = edit === null ? await save(repo, made) : await change(repo, edit.name, made);
        saving = false;
        if (done.ok) onclose();
        else failure = done.error;
    }

    /** The chain the fields describe, once they hold a name and a line; null before. */
    const chain = $derived(
        name.trim() === '' || run.trim() === ''
            ? null
            : draftLines(repo, draft(), edit?.name ?? null)
    );

    /** A line of the chain, worded as the line and, when it is not the repository's, its folder. */
    function worded(line: { folder: string; run: string }): string {
        return line.folder === '.' ? line.run : t('commands.approve_in', line.run, line.folder);
    }

    /** The heading of the form: adding a command, or editing one. */
    const heading = $derived(edit === null ? t('commands.form_add') : t('commands.form_edit'));

    /** Enter in a field saves, as the Save control does. */
    function submitted(event: SubmitEvent): void {
        event.preventDefault();
        void submit();
    }
</script>

<Modal {onclose}>
    {#snippet children(props)}
        <div {...props} class="box" aria-label={heading}>
            <form class="form" onsubmit={submitted}>
                <p class="message">{heading}</p>
                <Field label={t('commands.field_name')}>
                    <TextInput
                        value={name}
                        label={t('commands.field_name')}
                        oninput={(v: string) => (name = v)}
                    />
                </Field>
                <Field label={t('commands.field_run')} help={t('commands.field_run_help')}>
                    <TextInput
                        value={run}
                        label={t('commands.field_run')}
                        oninput={(v: string) => (run = v)}
                    />
                </Field>
                <Field label={t('commands.field_cwd')} help={t('commands.field_cwd_help')}>
                    <TextInput
                        value={cwd}
                        label={t('commands.field_cwd')}
                        oninput={(v: string) => (cwd = v)}
                    />
                </Field>
                <Field label={t('commands.field_depends')} help={t('commands.field_depends_help')}>
                    <TextInput
                        value={depends}
                        label={t('commands.field_depends')}
                        oninput={(v: string) => (depends = v)}
                    />
                </Field>
                <Field label={t('commands.field_default')}>
                    <Select
                        value={role}
                        label={t('commands.field_default')}
                        empty={t('commands.default_none')}
                        choices={[
                            { id: 'build', label: t('commands.default_build') },
                            { id: 'test', label: t('commands.default_test') }
                        ]}
                        onchange={(v: string) => (role = v)}
                    />
                </Field>
                {#if chain !== null}
                    <div class="chain" data-command-chain>
                        {#if 'lines' in chain}
                            <p class="note">{t('commands.chain_heading')}</p>
                            <ol class="lines">
                                {#each chain.lines as line, at (at)}
                                    <li><code>{worded(line)}</code></li>
                                {/each}
                            </ol>
                        {:else}
                            <p class="failure">{chain.refused}</p>
                        {/if}
                    </div>
                {/if}
                {#if failure !== ''}
                    <p class="failure" role="alert">{failure}</p>
                {/if}
                <div class="row">
                    <ToolButton label={t('ui.confirm_cancel')} onclick={onclose} />
                    <ToolButton
                        label={t('commands.save')}
                        disabled={!ready}
                        title={ready ? undefined : t('commands.save_needs')}
                        onclick={() => void submit()}
                    />
                </div>
            </form>
        </div>
    {/snippet}
</Modal>

<style>
    .form {
        display: contents;
    }

    .box {
        position: relative;
        width: min(34rem, 100%);
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    :global(body.wall) .box {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .message {
        margin: 0 0 4px;
        font-size: var(--fs-md);
    }

    .chain {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 4px;
    }

    .note {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .lines {
        margin: 0;
        padding-left: 1.4em;
        font-size: var(--fs-xs);
    }

    .lines code {
        font-family: var(--font-mono);
        white-space: pre-wrap;
        word-break: break-all;
    }

    .failure {
        margin: 0;
        color: var(--c-red-txt, var(--ink));
        font-size: var(--fs-xs);
    }

    .row {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 6px;
    }
</style>
