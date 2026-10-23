<script lang="ts">
    // Layer 3, shared view partial. The new-project form used by the four project boards and Lit
    // Watch. A board gives its tier, and the form then offers a Folder field starting with the
    // tier's `new_project_dir` entry and sends the tier and the folder with the write; Lit Watch
    // gives none, and the server creates the project in the tier `projects` under that tier's
    // `new_project_dir`. Optional seed values let a radar spark pre-fill the same form without
    // duplicating its write.
    // Escape closes it only while it is on screen: a pane keeps the view of a tab it hides mounted,
    // and a key pressed in another tab is not one this form was asked to answer.

    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';
    import { selectChoices } from '$lib/state/forms/schema';

    const {
        selectors: { domainChoices, newProjectFolder },
        writes: { newIdea }
    } = useState();

    type Props = {
        onclose: () => void;
        onsaid: (said: string) => void;
        /** The tier of the board that opened the form; none for Lit Watch. */
        tier?: string;
        seed?: { id: string; eli5: string; title?: string };
        oncreated?: () => void | Promise<void>;
    };

    let { onclose, onsaid, tier, seed, oncreated }: Props = $props();
    let folder = $state(untrack(() => (tier === undefined ? '' : newProjectFolder(tier))));
    let id = $state(untrack(() => seed?.id ?? ''));
    let title = $state(untrack(() => seed?.title ?? ''));
    let short = $state('');
    let domain = $state('');
    let eli5 = $state(untrack(() => seed?.eli5 ?? ''));
    const choices = $derived(selectChoices(domainChoices()));
    let box: HTMLDivElement | undefined = $state();

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Escape' && box?.checkVisibility() === true) onclose();
    }

    async function save(): Promise<void> {
        if (id.trim() === '') return;
        const answer = await newIdea({
            id: id.trim(),
            ...(tier === undefined ? {} : { tier, folder: folder.trim() }),
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
        if (answer.ok) {
            await oncreated?.();
            onclose();
        }
    }
</script>

<svelte:window onkeydown={keyed} />

<div class="form" bind:this={box}>
    {#if tier !== undefined}
        <TextInput
            value={folder}
            label={t('board.new_idea_folder')}
            placeholder={t('board.new_idea_folder')}
            oninput={(next: string) => (folder = next)}
        />
    {/if}
    <TextInput
        value={id}
        label={t('board.new_idea_id')}
        placeholder={t('board.new_idea_id')}
        oninput={(next: string) => (id = next)}
    />
    <TextInput
        value={title}
        label={t('board.new_idea_title')}
        placeholder={t('board.new_idea_title')}
        oninput={(next: string) => (title = next)}
    />
    <TextInput
        value={short}
        label={t('board.new_idea_short')}
        placeholder={t('board.new_idea_short')}
        oninput={(next: string) => (short = next)}
    />
    <Select
        value={domain}
        label={t('board.new_idea_domain')}
        empty={t('board.new_idea_domain')}
        {choices}
        onchange={(next: string) => (domain = next)}
    />
    <TextInput
        value={eli5}
        label={t('board.new_idea_eli5')}
        placeholder={t('board.new_idea_eli5')}
        oninput={(next: string) => (eli5 = next)}
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

    /* A box is inside the wrappers of its right-click menu, which draw no box, so it is still a
       flex item of the form. */
    .form :global(.text) {
        flex: 1 1 160px;
        width: auto;
    }
</style>
