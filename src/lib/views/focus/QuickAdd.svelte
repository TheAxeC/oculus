<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. Quick add: a follow-up note or a deadline on a
    // project, without opening the project first.
    //
    // The form is inline rather than a dialog: it is two fields, and a dialog over a board whose
    // whole point is one glance costs the glance. Escape closes it and the save control writes the
    // one field through state/writes.svelte.ts, like every other write on this board.

    import DateInput from '$lib/ui/DateInput.svelte';
    import Select from '$lib/ui/Select.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { labelOf, type Project } from '$lib/state/focus';
    import { t } from '$lib/state/text';
    import { writeManifest } from '$lib/state/writes.svelte';

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
        if (event.key === 'Escape' && field !== null) close();
    }

    /**
     * A follow-up is written as the manifest's `followup:`, a deadline as its `deadline:`. Both are
     * one field of one manifest, so both are one writeManifest call.
     */
    async function save(): Promise<void> {
        if (field === null || project === '' || value.trim() === '') return;
        const answer = await writeManifest(project, { [field]: value.trim() });
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
        if (answer.ok) close();
    }
</script>

<svelte:window onkeydown={keyed} />

<section class="qa">
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
                onchange={(next) => (project = next)}
            />
            {#if field === 'deadline'}
                <DateInput
                    {value}
                    label={t('focus.add_deadline')}
                    oninput={(next) => (value = next)}
                />
            {:else}
                <TextInput
                    {value}
                    label={t('focus.add_followup')}
                    oninput={(next) => (value = next)}
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
