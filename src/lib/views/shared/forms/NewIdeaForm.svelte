<script lang="ts">
    // Layer 3, shared view partial. The new-project form used by the four project boards and Lit
    // Watch. A new project could go to any hub of the workspace (`hubsTaking` of
    // state/shared/page/hubs.ts): with more than one, the form draws a Hub field, the primary
    // first and chosen; with one, it draws none. The write names the hub chosen. A board gives its
    // tier, and the form then offers a Folder field and sends the tier and the folder with the
    // write; Lit Watch gives none, and the server creates the project in the tier `projects`. The
    // Folder starts with the tier's `new_project_dir` entry of the primary while the primary is
    // chosen, and empty for another hub, whose settings the page does not hold; an empty Folder
    // sends no folder, so the server takes the `new_project_dir` of the tier in the settings of the
    // hub written to, and a hub that names none for it refuses, said here. A change of hub starts
    // the Folder again from that hub's value and clears a Domain the hub's registry does not hold:
    // the Domain choices are the chosen hub's own, so the key written resolves in that hub.
    // Optional seed values let a radar spark pre-fill the same form without duplicating its write.
    // Escape closes it only while it is on screen: a pane keeps the view of a tab it hides mounted,
    // and a key pressed in another tab is not one this form was asked to answer.

    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';
    import { selectChoices } from '$lib/state/forms/schema';
    import { hubsTaking } from '$lib/state/shared/page/hubs';
    import { answerWords } from './answer-words';

    const {
        fs: { primary, roots },
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

    /** The hubs a new project can be written to: every hub of the workspace, the primary first. */
    const hubs = $derived(
        hubsTaking(
            roots()
                .filter((one) => one.hub === true)
                .map((one) => one.key),
            primary()
        )
    );
    /** The hub picked in the Hub field, the empty text while none is picked. */
    let picked = $state('');
    /** The hub the project is written to: the one picked, else the first of the list. */
    const hub = $derived(picked === '' ? (hubs.at(0) ?? '') : picked);

    /**
     * The folder the form starts with for the hub `at`: the tier's `new_project_dir` entry of the
     * primary while the primary is chosen (or no hub is read yet), and empty for another hub.
     */
    function startFolder(at: string): string {
        if (tier === undefined) return '';
        return at === '' || at === primary() ? newProjectFolder(tier) : '';
    }

    let folder = $state(untrack(() => startFolder(hub)));
    let id = $state(untrack(() => seed?.id ?? ''));
    let title = $state(untrack(() => seed?.title ?? ''));
    let short = $state('');
    let domain = $state('');
    let eli5 = $state(untrack(() => seed?.eli5 ?? ''));
    const choices = $derived(selectChoices(domainChoices(hub)));
    let box: HTMLDivElement | undefined = $state();

    /** Choose the hub: the Folder starts again, and a Domain its registry does not hold is cleared. */
    function choose(next: string): void {
        picked = next;
        folder = startFolder(next);
        if (!domainChoices(next).some((one) => one.id === domain)) domain = '';
    }

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Escape' && box?.checkVisibility() === true) onclose();
    }

    async function save(): Promise<void> {
        if (id.trim() === '') return;
        const named = folder.trim();
        const answer = await newIdea(
            {
                id: id.trim(),
                ...(tier === undefined ? {} : { tier }),
                ...(tier === undefined || named === '' ? {} : { folder: named }),
                ...(title.trim() === '' ? {} : { title: title.trim() }),
                ...(short.trim() === '' ? {} : { short: short.trim() }),
                ...(domain === '' ? {} : { domain }),
                ...(eli5.trim() === '' ? {} : { eli5: eli5.trim() })
            },
            hub === '' ? undefined : hub
        );
        // A refused field answers ok with nothing written: the form stays open and says why.
        onsaid(answerWords(answer));
        if (answer.ok && answer.refused.length === 0) {
            await oncreated?.();
            onclose();
        }
    }
</script>

<svelte:window onkeydown={keyed} />

<div class="form" bind:this={box}>
    {#if hubs.length > 1}
        <Select
            value={hub}
            label={t('board.new_idea_hub')}
            choices={hubs.map((one) => ({ id: one, label: one }))}
            onchange={choose}
        />
    {/if}
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
