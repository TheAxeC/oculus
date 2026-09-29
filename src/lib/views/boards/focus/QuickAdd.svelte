<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. Quick add: a follow-up note or a
    // deadline on a project, without opening the project first.
    //
    // The form is inline rather than a dialog: it is two fields, and a dialog over a board whose
    // whole point is one glance costs the glance. Escape closes it and the save control writes the
    // one field through state/client/writes.svelte.ts, like every other write on this board. Escape
    // acts only while the form is on screen: a pane keeps the view of a tab it hides mounted, and a
    // key pressed in another tab is not one this form was asked to answer.

    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { labelOf, type Project } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        writes: { writeManifest }
    } = useState();

    type Props = {
        /** The projects the form may write to, already filtered to the live ones by the board. */
        projects: Project[];
        /** What the write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { projects, onsaid }: Props = $props();

    /** Which field the open form writes, and nothing when no form is open. */
    let field = $state<'followup' | 'deadline' | null>(null);
    let project = $state('');
    let value = $state('');
    let box: HTMLElement | undefined = $state();

    const choices = $derived(
        projects
            .map((one) => ({ id: one.id, label: labelOf(one) }))
            .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))
    );

    function open(next: 'followup' | 'deadline'): void {
        field = next;
        project = choices[0]?.id ?? '';
        value = '';
    }

    function close(): void {
        field = null;
        value = '';
    }

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Escape' && field !== null && box?.checkVisibility() === true) close();
    }

    /**
     * A follow-up is written as the manifest's `followup.do`, the field
     * config/catalogs/manifest-schema.yml names (a bare `followup:` note in the file is expanded to
     * the map by the editor), a deadline as its `deadline:`. Both are one field of one manifest, so
     * both are one writeManifest call.
     *
     * A write the server refused whole answers ok with nothing changed and the refusals filled, so
     * the outcome line reads the refusals rather than saying "saved" over an untouched file.
     */
    async function save(): Promise<void> {
        if (field === null || project === '' || value.trim() === '') return;
        const key = field === 'followup' ? 'followup.do' : field;
        const answer = await writeManifest(project, { [key]: value.trim() });
        const refused = answer.refused.map((one) => one.reason).join(', ');
        if (!answer.ok) onsaid(t('editor.failed', answer.error ?? ''));
        else if (answer.changed.length === 0 && refused !== '') onsaid(t('editor.failed', refused));
        else onsaid(t('editor.saved', answer.changed.join(', ')));
        if (answer.ok && answer.changed.length > 0) close();
    }
</script>

<svelte:window onkeydown={keyed} />

<section class="qa" bind:this={box}>
    <div class="bar">
        <span class="lbl">{t('focus.quick_add')}</span>
        <ToolButton
            label={t('focus.add_followup')}
            active={field === 'followup'}
            onclick={() => (field === 'followup' ? close() : open('followup'))}
        />
        <ToolButton
            label={t('focus.add_deadline')}
            active={field === 'deadline'}
            onclick={() => (field === 'deadline' ? close() : open('deadline'))}
        />
    </div>

    {#if field !== null}
        <div class="form">
            <Select
                value={project}
                label={t('focus.qa_project')}
                empty={t('focus.qa_project')}
                {choices}
                onchange={(next: string) => (project = next)}
            />
            {#if field === 'deadline'}
                <DateInput
                    {value}
                    label={t('focus.add_deadline')}
                    oninput={(next: string) => (value = next)}
                />
            {:else}
                <TextInput
                    {value}
                    label={t('focus.add_followup')}
                    oninput={(next: string) => (value = next)}
                />
            {/if}
            <ToolButton label={t('focus.qa_save')} onclick={save} />
            <ToolButton label={t('focus.qa_cancel')} onclick={close} />
        </div>
    {/if}
</section>

<style>
    .qa {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .bar,
    .form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .lbl {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }
</style>
