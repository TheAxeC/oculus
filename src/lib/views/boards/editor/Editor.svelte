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
    // Layer 3, view. The project.yml edit form (the edit form is data
    // in config/schemas/manifest-schema.yml; unsaved form input is instance
    // state): the sections of the schema in order, one widget per field, and a Save that posts
    // only what was changed. This file names no field, no section and no list of choices.
    //
    // What it holds is the edits, not the values. A field reads the project's current value until
    // it is edited, and the edit sits over it until it is saved or reverted; so nothing has to be
    // copied when the project changes, and what Save posts is exactly the map of edits. The edits
    // are kept in the instance's state through state/forms/form-draft.ts rather than in this
    // component, so a reload keeps them as a tab switch does, and the tab asks before it closes
    // over them. The controls are views/shared/forms/entry/edit/EntryForm.svelte, the form the
    // entry pages and the career editor draw their fields with.
    //
    // A save the server took drops the edits it took, keeping an edit typed while it was on its way
    // and one the server refused. The saved values are held over the project's own
    // (state/forms/settled.svelte.ts) until the watcher's rebuilt snapshot shows them, so the form
    // and the tab's title show them at once; a snapshot that shows another value for a field than
    // the one the save was made over replaces the held value, and of two saves in flight the
    // newest one's values are the ones held.
    //
    // The follow-up notes and the subtasks are shown read-only, each list as one text: the
    // project's card adds, changes and removes them line by line (state/forms/schema.ts decides
    // which fields write).
    //
    // A person field's Add person writes the new person to the people registry of the project's own
    // hub (state/forms/new-entry.ts, `addPerson`), since a key the manifest writes resolves in its
    // own hub first; the person's key is then an edit of the field like any pick. A Revert while
    // the write is out leaves the field as the Revert left it (`unlessReverted`).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryForm from '../../shared/forms/entry/edit/EntryForm.svelte';
    import {
        editDiffers,
        fieldsOfSection,
        fieldValues,
        manifestPayload,
        NOT_IN_MODEL,
        projectKey,
        writableField,
        type FormField
    } from '$lib/state/forms/schema';
    import { addPerson, unlessReverted } from '$lib/state/forms/new-entry';
    import { PEOPLE } from '$lib/state/forms/page-entry';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { stateRecord } from '$lib/state/shared/page/records';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        formDraft: { draftEdits, editDraft, revertDraft, settleDraft },
        fs: { primary },
        selectors: {
            collectionsOfKey,
            fieldChoices,
            manifestFields,
            manifestSections,
            projectOf,
            waitedOn
        },
        settled,
        writes: { newEntry, writeManifest }
    } = client;

    let { instance }: ViewProps = $props();

    /** The kind of draft the project editor keeps (state/client/context.ts names its target). */
    const DRAFT_KIND = 'project';

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(stateRecord(instance.state));
    const project = $derived(id === '' ? null : projectOf(id));
    /** The project's values with the saved ones over them until the snapshot has them. */
    const stored = $derived(project === null ? {} : fieldValues(project, waitedOn));
    const values = $derived(settled.overlay(projectKey(id), stored));
    const tabTitle = $derived(
        typeof values.title === 'string' ? values.title : (project?.title ?? '')
    );
    const fields = $derived(manifestFields());
    const sections = $derived(manifestSections());

    /** The edits over the project's own values, by field name. Cleared by Revert and by a save. */
    const edits = $derived(draftEdits(instance.id, DRAFT_KIND, id));
    /** What the last save said, as lines the pane shows under the form. */
    let result = $state<string[]>([]);
    /** Whether this editor's own save is on its way. */
    let saving = $state(false);

    const dirty = $derived(fields.filter((one) => changed(one.field)));

    /** Whether the form may write a field: a read-only one shows the project's value only. */
    function writable(field: string): boolean {
        return project !== null && writableField(field);
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
        editDraft(instance.id, DRAFT_KIND, id, field, value);
    }

    /** How many Reverts this editor has had, which an Add person compares across its write. */
    let reverts = 0;

    function revert(): void {
        reverts += 1;
        revertDraft(instance.id);
        result = [];
    }

    /** What the toolbar says about the form: how much is waiting to be saved. */
    function summary(): string {
        return dirty.length === 0 ? t('editor.clean') : t('editor.dirty', dirty.length);
    }

    /** How many saves of this editor are out, and the number of the newest one sent. */
    let sending = 0;
    let newest = 0;

    /** Post a body, with `saving` set for as long as a request of this editor is out. */
    async function post(body: Record<string, unknown>): ReturnType<typeof writeManifest> {
        sending += 1;
        saving = true;
        try {
            return await writeManifest(id, body);
        } finally {
            sending -= 1;
            saving = sending > 0;
        }
    }

    /**
     * Post the changed fields. The instance is taken before the request goes, so an answer that
     * lands after the tab was switched settles the draft it was sent from. The server's answer
     * puts the saved values over the project's own at once, and the newest save sent is the one
     * whose words the pane shows.
     */
    async function save(): Promise<void> {
        const { body, taken } =
            project === null
                ? { body: {}, taken: {} }
                : manifestPayload(
                      edits,
                      dirty.map((one) => one.field)
                  );
        if (Object.keys(body).length === 0) {
            result = [t('editor.saved_none')];
            return;
        }
        const from = instance.id;
        newest += 1;
        const mine = newest;
        const seq = settled.begin();
        const answer = await post(body);
        if (!answer.ok) {
            if (mine === newest) result = [t('editor.failed', answer.error ?? '')];
            return;
        }
        const refused = answer.refused.map((one) => one.field);
        settled.record(
            projectKey(id),
            Object.fromEntries(Object.entries(taken).filter(([name]) => !refused.includes(name))),
            stored,
            seq
        );
        settleDraft(from, taken, refused);
        if (mine !== newest) return;
        result = [
            t('editor.saved', answer.changed.join(', ')),
            ...answer.refused.map((one) => t('editor.refused', one.field, one.reason))
        ];
    }

    /**
     * Write a new person to the people registry of the hub `hub`, the project's own, or the
     * primary's for a project that names none.
     */
    function addTo(hub: string): (name: string) => ReturnType<typeof addPerson> {
        const home = hub === '' ? primary() : hub;
        return unlessReverted(
            (name) => addPerson(name, collectionsOfKey(PEOPLE), home, newEntry),
            () => reverts
        );
    }

    /** A field the schema names but the snapshot does not carry: the form opens it empty. */
    function noteFor(field: FormField): string | undefined {
        return NOT_IN_MODEL.includes(field.field) ? t('editor.not_in_model') : undefined;
    }
</script>

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

<Pane title={project === null ? t('editor.title') : tabTitle} toolbar={tools} {bar} tinted>
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
                        <EntryForm
                            fields={own}
                            valueOf={(one: FormField) => valueOf(one.field)}
                            onedit={(one: FormField, held: unknown) => edit(one.field, held)}
                            {writable}
                            {changed}
                            choices={(one: FormField) => fieldChoices(one, project)}
                            note={noteFor}
                            addPerson={addTo(rootOf(project))}
                        />
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
