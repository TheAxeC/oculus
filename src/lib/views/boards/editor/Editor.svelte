<script module lang="ts">
    // Layer 3, view registration. A manifest editor opens from a project and is not listed.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'editor',
        label: 'views.editor',
        glyph: 'views.editor_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The project.yml edit form (DESIGN.md, "Configuration": the edit form is data
    // in config/schemas/manifest-schema.yml; "Decisions taken": "Unsaved form input is instance
    // state"): the sections of the schema in order, one widget per field, and a Save that posts
    // only what was changed. This file names no field, no section and no list of choices.
    //
    // What it holds is the edits, not the values. A field reads the project's current value until
    // it is edited, and the edit sits over it until it is saved or reverted; so nothing has to be
    // copied when the project changes, and what Save posts is exactly the map of edits. The edits
    // are kept in the instance's state through state/forms/manifest-draft.ts rather than in this
    // component, so a reload keeps them as a tab switch does, and the tab asks before it closes
    // over them.
    //
    // A save the server took drops the edits it took, keeping an edit typed while it was on its way
    // and one the server refused. The page sees its own write when the watcher pushes the rebuilt
    // snapshot; until then a field whose edit the save took shows the snapshot's value.
    //
    // The two follow-up fields address one note. A project with two or more notes shows them
    // read-only with a sentence saying where to edit them, and what the draft kept for them from
    // before is neither shown, counted nor posted (state/forms/schema.ts decides which fields
    // write).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { editDiffers } from '$lib/state/forms/manifest-draft';
    import {
        asList,
        asText,
        dateNeedsNote,
        fieldsOfSection,
        fieldValues,
        followupWritable,
        manifestPayload,
        NOT_IN_MODEL,
        refusedEdits,
        writableField,
        type FormField
    } from '$lib/state/forms/schema';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        manifestDraft: { editManifest, manifestEdits, revertManifest, settleManifest },
        selectors: { fieldChoices, manifestFields, manifestSections, projectOf },
        writes: { writeManifest }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How tall the prose boxes open. */
    const ROWS = 3;

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(instanceText(instance.state, 'id'));
    const project = $derived(id === '' ? null : projectOf(id));
    const values = $derived(project === null ? {} : fieldValues(project));
    const fields = $derived(manifestFields());
    const sections = $derived(manifestSections());

    /** The edits over the project's own values, by field name. Cleared by Revert and by a save. */
    const edits = $derived(manifestEdits(instance.id, id));
    /** What the last save said, as lines the pane shows under the form. */
    let result = $state<string[]>([]);
    /** Whether this editor's own save is on its way. */
    let saving = $state(false);

    const dirty = $derived(fields.filter((one) => changed(one.field)));

    /** Whether the form may write a field: a read-only one shows the project's value only. */
    function writable(field: string): boolean {
        return project !== null && writableField(project, field, edits);
    }

    /** The value a control shows: the edit when there is one, the project's value otherwise. */
    function valueOf(field: string): unknown {
        return field in edits && writable(field) ? edits[field] : values[field];
    }

    /**
     * Whether a field has an edit that says something other than what the project says, by the rule
     * the tab's close asks by: a row that says it is waiting to be saved when nothing will be
     * written says the wrong thing.
     */
    function changed(field: string): boolean {
        return writable(field) && field in edits && editDiffers(edits[field], values[field]);
    }

    function edit(field: string, value: unknown): void {
        editManifest(instance.id, id, field, value);
    }

    function revert(): void {
        revertManifest(instance.id);
        result = [];
    }

    /** What the toolbar says about the form: how much is waiting to be saved. */
    function summary(): string {
        return dirty.length === 0 ? t('editor.clean') : t('editor.dirty', dirty.length);
    }

    /** Post a body, with `saving` set for as long as the request is out. */
    async function post(body: Record<string, unknown>): ReturnType<typeof writeManifest> {
        saving = true;
        try {
            return await writeManifest(id, body);
        } finally {
            saving = false;
        }
    }

    /**
     * Post the changed fields. The instance is taken before the request goes, so an answer that
     * lands after the tab was switched settles the draft it was sent from.
     */
    async function save(): Promise<void> {
        const { body, taken } =
            project === null
                ? { body: {}, taken: {} }
                : manifestPayload(
                      project,
                      edits,
                      dirty.map((one) => one.field)
                  );
        if (Object.keys(body).length === 0) {
            result = [t('editor.saved_none')];
            return;
        }
        const from = instance.id;
        const answer = await post(body);
        if (!answer.ok) {
            result = [t('editor.failed', answer.error ?? '')];
            return;
        }
        const refused = refusedEdits(answer.refused.map((one) => one.field));
        settleManifest(from, taken, refused);
        result = [
            t('editor.saved', answer.changed.join(', ')),
            ...answer.refused.map((one) => t('editor.refused', one.field, one.reason))
        ];
    }

    /** A field the schema names but the snapshot does not carry: the form opens it empty. */
    function noteFor(field: FormField): string | undefined {
        if (project !== null && !followupWritable(project) && field.field.startsWith('followup.')) {
            return t('editor.followup_several');
        }
        if (project !== null && dateNeedsNote(project, field.field, edits)) {
            return t('editor.followup_needs_note');
        }
        return NOT_IN_MODEL.includes(field.field) ? t('editor.not_in_model') : undefined;
    }

    /** The handler of a read-only box: the typed character is dropped and the value stands. */
    function keepValue(): void {
        // A read-only TextInput still reports input; the form keeps what the snapshot holds.
    }
</script>

{#snippet control(field: FormField)}
    {#if field.type === 'readonly' || !writable(field.field)}
        <TextInput
            value={asText(valueOf(field.field))}
            label={field.label}
            readonly
            oninput={keepValue}
        />
    {:else if field.type === 'checkbox'}
        <Checkbox
            checked={valueOf(field.field) === true}
            label={field.label}
            onchange={(on) => edit(field.field, on)}
        />
    {:else if field.type === 'select'}
        <Select
            value={asText(valueOf(field.field))}
            label={field.label}
            empty={t('editor.empty_choice')}
            choices={fieldChoices(field, project)}
            onchange={(value) => edit(field.field, value)}
        />
    {:else if field.type === 'chips' || field.type === 'tags'}
        <MultiSelect
            values={asList(valueOf(field.field))}
            label={field.label}
            choices={fieldChoices(field, project)}
            onchange={(list) => edit(field.field, list)}
            search={t('editor.search')}
            remove={t('editor.remove')}
            removeGlyph={t('editor.remove_glyph')}
            free={field.type === 'tags'}
            none={t('editor.no_choices')}
        />
    {:else if field.type === 'textarea' || field.type === 'lines'}
        <TextArea
            value={asText(valueOf(field.field))}
            label={field.label}
            rows={ROWS}
            oninput={(value: string) =>
                edit(field.field, field.type === 'lines' ? value.split('\n') : value)}
        />
    {:else if field.type === 'date'}
        <DateInput
            value={asText(valueOf(field.field))}
            label={field.label}
            oninput={(value) => edit(field.field, value)}
        />
    {:else if field.type === 'keymap'}
        <TextInput
            value={asText(valueOf(field.field))}
            label={field.label}
            readonly
            oninput={keepValue}
        />
    {:else}
        <TextInput
            value={asText(valueOf(field.field))}
            label={field.label}
            oninput={(value) => edit(field.field, value)}
        />
    {/if}
{/snippet}

{#snippet tools()}
    <Toolbar label={t('editor.toolbar')} overflow>
        <ToolButton
            bare
            label={t('editor.save')}
            glyph={t('editor.save_glyph')}
            active={dirty.length > 0}
            onclick={save}
        />
        <ToolButton
            bare
            label={t('editor.revert')}
            glyph={t('editor.revert_glyph')}
            onclick={revert}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('editor.status')}>
        <span class="status">
            <Tag label={saving ? t('editor.saving') : summary()} />
        </span>
    </Toolbar>
{/snippet}

<Pane title={project === null ? t('editor.title') : project.title} toolbar={tools} {bar} tinted>
    <div class="editor" data-instance={instance.id} data-project={id}>
        {#if id === ''}
            <Empty message={t('editor.none')} glyph={t('editor.none_glyph')} />
        {:else if project === null}
            <Empty message={t('editor.unknown', id)} glyph={t('editor.none_glyph')} />
        {:else}
            {#each sections as section (section)}
                {@const own = fieldsOfSection(fields, section)}
                {#if own.length > 0}
                    <section class="group">
                        <h3 class="heading">{section}</h3>
                        {#each own as field (field.field)}
                            <Field
                                label={field.label}
                                help={field.help}
                                note={noteFor(field)}
                                dirty={changed(field.field)}
                            >
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render control(field)}
                            </Field>
                        {/each}
                    </section>
                {/if}
            {/each}
            {#if result.length > 0}
                <p class="result">
                    {#each result as line, at (`${at}:${line}`)}
                        <span class="line">{line}</span>
                    {/each}
                </p>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .group {
        margin-bottom: 12px;
    }

    /* The status words close the bar. */
    .status {
        margin-left: auto;
    }

    .heading {
        margin: 0 0 4px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
        border-bottom: 1px solid var(--line);
    }

    .result {
        margin: 0;
        padding-top: 8px;
        border-top: 1px solid var(--line);
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .line {
        display: block;
    }

    :global(body.rice) .heading {
        text-transform: none;
        letter-spacing: 0.06em;
    }
</style>
