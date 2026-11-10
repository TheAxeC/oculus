<script lang="ts">
    // Layer 3, view partial of views/feeds/literature/Literature.svelte. The small form on a card
    // that adds its paper to Lit Watch: the bucket (the radar's own vocabulary, the bucket of
    // `radar_buckets` that carries `default: true` preselected), an optional project, the relevance
    // (a word of `radar_relevance`, the one that carries `default: true` preselected, each drawn as
    // the word itself, as the radar's card draws it) and an optional note.
    // Saving sends one `radar-add` write; the radar feed republishes the file, so Lit Watch shows
    // the paper without a reload and the card reads `In Lit Watch`. Escape closes it only while it
    // is on screen: a pane keeps the view of a tab it hides mounted.

    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { answerWords } from '../../shared/forms/answer-words';
    import { radarFields, type RadarChoice } from '$lib/state/feeds/literature/radar';
    import type { MergedHit } from '$lib/state/feeds/literature/merge';
    import { defaultBucket, defaultRelevance, relevanceWords } from '$lib/state/feeds/radar';
    import { t } from '$lib/state/shared/words/text';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const {
        writes: { addRadarEntry }
    } = useState();

    type Props = {
        hit: MergedHit;
        buckets: { id: string; label: string }[];
        projects: { id: string; label: string; group?: string }[];
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { hit, buckets, projects, onclose, onsaid }: Props = $props();
    let choice: RadarChoice = $state({
        bucket: defaultBucket(vocabOf()) ?? '',
        project: '',
        relevance: defaultRelevance(vocabOf()) ?? '',
        why: ''
    });
    let saving = $state(false);
    let box: HTMLDivElement | undefined = $state();

    const relevances = $derived(relevanceWords(vocabOf()).map((id) => ({ id, label: id })));

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Escape' && box?.checkVisibility() === true) onclose();
    }

    async function save(): Promise<void> {
        if (saving) return;
        saving = true;
        try {
            const answer = await addRadarEntry(radarFields(hit, choice));
            onsaid(answerWords(answer));
            if (answer.ok && answer.refused.length === 0) onclose();
        } finally {
            saving = false;
        }
    }
</script>

<svelte:window onkeydown={keyed} />

<div class="form" bind:this={box}>
    <Select
        value={choice.bucket}
        label={t('literature.add_bucket')}
        choices={buckets}
        onchange={(next: string) => (choice.bucket = next)}
    />
    <Select
        value={choice.project}
        label={t('literature.add_project')}
        empty={t('literature.add_project')}
        choices={projects}
        onchange={(next: string) => (choice.project = next)}
    />
    <Select
        value={choice.relevance}
        label={t('literature.add_relevance')}
        choices={relevances}
        onchange={(next: string) => (choice.relevance = next)}
    />
    <span class="why">
        <TextInput
            value={choice.why}
            label={t('literature.add_why')}
            placeholder={t('literature.add_why')}
            oninput={(next: string) => (choice.why = next)}
            onenter={save}
        />
    </span>
    <ToolButton label={t('literature.add_save')} disabled={saving} onclick={save} />
    <ToolButton label={t('literature.add_cancel')} onclick={onclose} />
</div>

<style>
    .form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin-top: 8px;
    }

    .why {
        flex: 1 1 160px;
        min-width: 0;
    }
</style>
