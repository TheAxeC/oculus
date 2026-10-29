<script lang="ts">
    // Layer 3, view partial. Edit and Delete of the configuration the Debug view's picker shows,
    // drawn while `.oculus/launch.yml` holds it. Edit asks for its fields in a form
    // (ui/forms/Prompt.svelte): its name, program, folder and command to run first, and for a
    // debugger of an app each attribute its schema gives
    // (state/system/machine/debug/launch-form.ts); the fields answered otherwise than they were
    // filled are written in the entry's place, and a Save that changes no field writes nothing.
    // Delete asks first and takes the entry out. A number field that does not read as a number
    // keeps the form open and says which.

    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { PromptField, PromptRequest } from '$lib/ui/forms/prompt';
    import {
        PARTS,
        launchChanges,
        launchForm,
        wrongNumber,
        type DebugConfiguration,
        type LaunchField
    } from '$lib/state/system/machine/debug/launch-form';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = { repo: string; configuration: DebugConfiguration };

    let { repo, configuration }: Props = $props();

    const { debug } = useState();

    /** The question on screen, or null. */
    let asking: PromptRequest | null = $state(null);

    /** The words of the fields oculus reads, by their key. */
    function ownWord(key: string): string | null {
        if (key === 'name') return t('debug.field_name');
        if (key === 'program') return t('debug.field_program');
        if (key === 'cwd') return t('debug.field_cwd');
        if (key === 'before') return t('debug.field_before');
        return null;
    }

    /** The words of a field: its key, and its schema's description after it. */
    function labelOf(field: LaunchField): string {
        const own = ownWord(field.key) ?? field.key;
        return field.help === '' ? own : `${own} (${field.help})`;
    }

    /** The field of the form a launch field is asked by. */
    function promptField(field: LaunchField): PromptField {
        const label = labelOf(field);
        if (field.kind === 'toggle') {
            const choices = ['true', 'false'].map((id) => ({ id, label: id }));
            return { label, value: field.value, choices, empty: t('debug.field_unset') };
        }
        if (field.kind === 'choice') {
            const choices = (field.choices ?? []).map((id) => ({ id, label: id }));
            return { label, value: field.value, choices, empty: t('debug.field_unset') };
        }
        const placeholder =
            field.kind === 'map'
                ? t('debug.field_map')
                : field.kind === 'list'
                  ? t('debug.field_list')
                  : '';
        return {
            label,
            value: field.value,
            ...(field.required === true ? { required: true } : {}),
            ...(placeholder === '' ? {} : { placeholder })
        };
    }

    function edit(note = ''): void {
        const one = debug.debuggers().find((each) => each.debugger.type === configuration.type);
        const form = launchForm(configuration, one);
        asking = {
            message: t('debug.edit_title', configuration.name),
            detail: note === '' ? t('debug.edit_detail', PARTS) : note,
            fields: form.fields.map(promptField),
            verb: t('debug.edit_save'),
            act: (answers) => {
                asking = null;
                const wrong = wrongNumber(form, answers);
                if (wrong !== null) {
                    edit(t('debug.edit_not_number', wrong));
                    return;
                }
                const changes = launchChanges(form, answers);
                if (Object.keys(changes).length === 0) return;
                void debug.editConfiguration(repo, configuration.name, changes);
            }
        };
    }

    function remove(): void {
        asking = {
            message: t('debug.delete_title', configuration.name),
            detail: t('debug.delete_detail'),
            fields: [],
            verb: t('debug.delete_verb'),
            act: () => {
                asking = null;
                void debug.editConfiguration(repo, configuration.name, null);
            }
        };
    }
</script>

<ToolButton plain label={t('debug.edit_configuration')} glyph="edit" onclick={() => edit()} />
<ToolButton plain label={t('debug.delete_configuration')} glyph="trash" onclick={remove} />
{#if asking !== null}
    <Prompt request={asking} cancel={t('ui.confirm_cancel')} oncancel={() => (asking = null)} />
{/if}
