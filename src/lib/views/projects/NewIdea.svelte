<script lang="ts">
    // Layer 3, view partial of views/Projects.svelte. The small form the "+ new idea" control opens:
    // the folder name, the title, the short handle, the domain and the one-line eli5. The control
    // itself is the board's, in its toolbar; the form is drawn under the toolbar, in the body, so
    // five fields do not widen the header row they were opened from.
    //
    // The form is inline rather than a dialog, for the reason views/focus/QuickAdd.svelte gives:
    // five fields over a board whose point is one glance, and a dialog costs the glance. Escape
    // closes it, and the save is one newIdea() call of the write path, which scaffolds the manifest
    // and its README under projects/ideas. The folder name is the only field the server insists on.

    import Select from '$lib/ui/Select.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { domainChoices } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { newIdea } from '$lib/state/writes.svelte';

    type Props = {
        /** Close the form, whether by cancel, by Escape or after a save that went through. */
        onclose: () => void;
        /** What the write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { onclose, onsaid }: Props = $props();

    let id = $state('');
    let title = $state('');
    let short = $state('');
    let domain = $state('');
    let eli5 = $state('');

    const choices = $derived(domainChoices());

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Escape') onclose();
    }

    /** Only what was typed is sent: a field left empty is a key the new manifest does not carry. */
    async function save(): Promise<void> {
        if (id.trim() === '') return;
        const answer = await newIdea({
            id: id.trim(),
            ...(title.trim() === '' ? {} : { title: title.trim() }),
            ...(short.trim() === '' ? {} : { short: short.trim() }),
            ...(domain === '' ? {} : { domain }),
            ...(eli5.trim() === '' ? {} : { eli5: eli5.trim() })
        });
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
        if (answer.ok) onclose();
    }
</script>

<svelte:window onkeydown={keyed} />

<div class="form">
    <TextInput
        value={id}
        label={t('board.new_idea_id')}
        placeholder={t('board.new_idea_id')}
        oninput={(next) => (id = next)}
    />
    <TextInput
        value={title}
        label={t('board.new_idea_title')}
        placeholder={t('board.new_idea_title')}
        oninput={(next) => (title = next)}
    />
    <TextInput
        value={short}
        label={t('board.new_idea_short')}
        placeholder={t('board.new_idea_short')}
        oninput={(next) => (short = next)}
    />
    <Select
        value={domain}
        label={t('board.new_idea_domain')}
        empty={t('board.new_idea_domain')}
        {choices}
        onchange={(next) => (domain = next)}
    />
    <TextInput
        value={eli5}
        label={t('board.new_idea_eli5')}
        placeholder={t('board.new_idea_eli5')}
        oninput={(next) => (eli5 = next)}
    />
    <ToolButton label={t('board.new_idea_save')} onclick={save} />
    <ToolButton label={t('board.new_idea_cancel')} onclick={onclose} />
</div>

<style>
    .form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin-bottom: 8px;
    }

    /* Five fields on one row: each takes its share and wraps when the board is narrow. */
    .form > :global(.text) {
        flex: 1 1 160px;
        width: auto;
    }
</style>
