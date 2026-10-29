<script lang="ts">
    // Layer 3, view part. The deck's own keys: `deck.title`, the title on the first slide and in
    // the deck list, and `defaults.tag_tones`, one row for each slide tag with the hue its chip
    // wears, a hue picked or the tag taken out, and a row that adds a tag. What the reader sets is
    // the Slides view's unsaved work, written at Save with the lists. It is the group every
    // grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), headed Deck, and folds
    // by its control; the Slides view keeps the fold.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import HueSelect from '$lib/ui/forms/choice/select/HueSelect.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { TITLE_KEY, TONES_KEY, tonesOf, withTone } from '$lib/state/life/slides';

    let {
        shown,
        onset,
        hues,
        busy,
        open,
        ontoggle
    }: {
        /** The value a key of the deck shows, by its path; null for none. */
        shown: (path: string[]) => unknown;
        /** Set a key of the deck to a value; null takes it out. */
        onset: (path: string[], value: unknown) => void;
        /** The hues a tag may wear, by name. */
        hues: string[];
        /** True while a save is in flight, which holds every control still. */
        busy: boolean;
        /** Whether the group is open, and the press of its fold control. */
        open: boolean;
        ontoggle: () => void;
    } = $props();

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

<GroupHead data-deck-keys aria-label={t('slides.keys')} label={t('slides.keys')} {open} {ontoggle}>
    <div class="keys" inert={busy}>
        <Field label={t('slides.key_title')} help={t('slides.key_title_help')}>
            <TextInput value={title} label={t('slides.key_title')} oninput={ontitle} />
        </Field>
        <Field label={t('slides.key_tones')} help={t('slides.key_tones_help')}>
            <div class="tones" role="list">
                {#each tones as [one, worn] (one)}
                    <div class="tone" role="listitem" data-tone={one}>
                        <span class="tag">{one}</span>
                        <HueSelect
                            value={worn}
                            label={t('slides.key_tone_of', one)}
                            empty={t('slides.key_tone_none')}
                            {hues}
                            onchange={(next: string) => ontone(one, next)}
                        />
                    </div>
                {/each}
                <div class="tone" role="listitem">
                    <TextInput
                        value={tag}
                        label={t('slides.key_tone_tag')}
                        placeholder={t('slides.key_tone_tag')}
                        oninput={(next: string) => (tag = next)}
                        onenter={add}
                    />
                    <HueSelect
                        value={hue}
                        label={t('slides.key_tone_hue')}
                        empty={t('slides.key_tone_none')}
                        {hues}
                        onchange={(next: string) => (hue = next)}
                    />
                    <ToolButton
                        label={t('slides.key_tone_add')}
                        onclick={add}
                        disabled={!addable}
                    />
                </div>
            </div>
        </Field>
    </div>
</GroupHead>

<style>
    .keys {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
        padding: 4px 6px;
    }

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
