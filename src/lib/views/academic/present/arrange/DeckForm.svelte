<script lang="ts">
    // Layer 3, Present partial. The form the deck's Edit opens at the head of the Overview: the
    // deck's own keys, `deck.title`, the title on the first slide and in the deck list, and
    // `defaults.tag_tones`, one row for each slide tag with the hue its chip wears, a hue picked or
    // the tag taken out, and a row that adds a tag.
    //
    // What the reader sets is the form's own work until Apply writes it, each key with the value
    // the file held as its base, and closes the form; Cancel and Escape close it with nothing
    // written (KeyForm.svelte). A key typed in a field stays with the field: the Present pane
    // hands no key a field takes to the deck.

    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import HueSelect from '$lib/ui/forms/choice/select/HueSelect.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import KeyForm from './KeyForm.svelte';
    import { createKeyWork } from './arrange.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        TITLE_KEY,
        TONES_KEY,
        tonesOf,
        withTone,
        type DeckKeys,
        type KeyEdit
    } from '$lib/state/life/arrange';

    type Props = {
        /** The deck's keys as the file holds them. */
        keys: DeckKeys | null;
        /** The hues a tag may wear, by name. */
        hues: string[];
        /**
         * True while the arranging controls are held, which holds Apply: from a write until its
         * answer, and after a write that changed the file until the next push of the deck or the
         * bound after the answer. A refusal or a failure holds nothing.
         */
        busy: boolean;
        /** Write the keys the form changed; resolves true once they are written. */
        onapply: (changes: KeyEdit[]) => Promise<boolean>;
        oncancel: () => void;
    };

    let { keys, hues, busy, onapply, oncancel }: Props = $props();

    const work = createKeyWork(() => keys);
    const { shown, onset } = work;

    /** The title shown, the empty text for none, and each tag with the hue its chip wears. */
    const title = $derived.by(() => {
        const held = shown(TITLE_KEY);
        return typeof held === 'string' ? held : '';
    });
    const tones = $derived(tonesOf(shown(TONES_KEY)));

    /** Set the title; the empty text takes it out. */
    function ontitle(text: string): void {
        onset(TITLE_KEY, text.trim() === '' ? null : text);
    }

    /** Give a tag a hue; the empty hue takes the tag out. */
    function ontone(tag: string, hue: string): void {
        onset(TONES_KEY, withTone(shown(TONES_KEY), tag, hue));
    }

    /** The tag being added, and the hue it is to wear. */
    let tag = $state('');
    let hue = $state('');

    /** Whether the tag typed can be added: it is named, has a hue and has no row yet. */
    const addable = $derived(
        tag.trim() !== '' && hue !== '' && !tones.some(([one]) => one === tag.trim())
    );

    function add(): void {
        if (!addable) return;
        ontone(tag.trim(), hue);
        tag = '';
        hue = '';
    }
</script>

<KeyForm label={t('present.deck_form')} {work} {busy} {onapply} {oncancel} data-deck-form>
    <Field label={t('present.field_title')} help={t('present.field_title_help')}>
        <TextInput value={title} label={t('present.field_title')} oninput={ontitle} />
    </Field>
    <Field label={t('present.field_tones')} help={t('present.field_tones_help')}>
        <div class="tones" role="list">
            {#each tones as [one, worn] (one)}
                <div class="tone" role="listitem" data-tone={one}>
                    <span class="tag">{one}</span>
                    <HueSelect
                        value={worn}
                        label={t('present.field_tone_of', one)}
                        empty={t('present.field_tone_none')}
                        {hues}
                        onchange={(next: string) => ontone(one, next)}
                    />
                </div>
            {/each}
            <div class="tone" role="listitem">
                <TextInput
                    value={tag}
                    label={t('present.field_tone_tag')}
                    placeholder={t('present.field_tone_tag')}
                    oninput={(next: string) => (tag = next)}
                    onenter={add}
                />
                <HueSelect
                    value={hue}
                    label={t('present.field_tone_hue')}
                    empty={t('present.field_tone_none')}
                    {hues}
                    onchange={(next: string) => (hue = next)}
                />
                <ToolButton label={t('present.field_tone_add')} onclick={add} disabled={!addable} />
            </div>
        </div>
    </Field>
</KeyForm>

<style>
    .tones {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .tone {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .tag {
        flex: 0 1 12ch;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
    }
</style>
