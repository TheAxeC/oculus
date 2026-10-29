<script lang="ts">
    // Layer 3, view part. The keys of one group of a deck, drawn at the head of the group: `find`,
    // the folder globs the group looks in and the tiers, stages, forms and status chips a found
    // deck's project must have, each list a word of the engine's vocabulary or one typed; `sort`,
    // how the found decks are ordered; and `discover`, whether the group takes the decks it finds
    // beyond the ones it names. Unset, `sort` orders by folder and `discover` takes none, the
    // deck reader's defaults. What the reader sets is the Slides view's unsaved work, written at
    // Save with the lists.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        FIND_LISTS,
        findForm,
        findValue,
        groupKey,
        type FindForm,
        type FindList
    } from '$lib/state/life/slides';

    let {
        group,
        shown,
        onset,
        choices
    }: {
        /** The group's name. */
        group: string;
        /** The value a key of the deck shows, by its path; null for none. */
        shown: (path: string[]) => unknown;
        /** Set a key of the deck to a value; null takes it out. */
        onset: (path: string[], value: unknown) => void;
        /** The words each list of `find:` offers. */
        choices: (list: FindList) => { id: string; label: string }[];
    } = $props();

    /** The group's `find:` as the form draws it, its sort (empty for none) and its discovery. */
    const find = $derived(findForm(shown(groupKey(group, 'find'))));
    const sort = $derived.by(() => {
        const held = shown(groupKey(group, 'sort'));
        return typeof held === 'string' ? held : '';
    });
    const discover = $derived.by(() => {
        const held = shown(groupKey(group, 'discover'));
        return typeof held === 'boolean' ? held : null;
    });

    function onfind(form: FindForm): void {
        const path = groupKey(group, 'find');
        onset(path, findValue(shown(path), form));
    }

    /** The caption of each list of `find:`. */
    function caption(list: FindList): string {
        switch (list) {
            case 'tiers':
                return t('slides.key_find_tiers');
            case 'stages':
                return t('slides.key_find_stages');
            case 'forms':
                return t('slides.key_find_forms');
            case 'status':
                return t('slides.key_find_status');
        }
    }
</script>

<div class="keys" data-group-keys={group}>
    <Field label={t('slides.key_find')} help={t('slides.key_find_help')}>
        <div class="find">
            <TextInput
                value={find.folders}
                label={t('slides.key_find_folders', group)}
                placeholder={t('slides.key_find_folders_hint')}
                oninput={(folders: string) => onfind({ ...find, folders })}
            />
            {#each FIND_LISTS as { key } (key)}
                <span class="caption">{caption(key)}</span>
                <MultiSelect
                    values={find[key]}
                    label={t('slides.key_find_list', caption(key), group)}
                    choices={choices(key)}
                    free
                    search={t('editor.search')}
                    remove={t('editor.remove')}
                    removeGlyph={t('editor.remove_glyph')}
                    none={t('editor.no_choices')}
                    more={(count: number) => t('editor.more_choices', count)}
                    onchange={(next: string[]) => onfind({ ...find, [key]: next })}
                />
            {/each}
        </div>
    </Field>
    <div class="line">
        <Field label={t('slides.key_sort')} help={t('slides.key_sort_help')}>
            <Select
                value={sort}
                label={t('slides.key_sort_of', group)}
                empty={t('slides.key_sort_none')}
                choices={[
                    { id: 'folder', label: t('slides.key_sort_folder') },
                    { id: 'title', label: t('slides.key_sort_title') }
                ]}
                onchange={(next: string) =>
                    onset(groupKey(group, 'sort'), next === '' ? null : next)}
            />
        </Field>
        <Checkbox
            checked={discover}
            label={t('slides.key_discover')}
            unset={t('slides.key_discover_none')}
            onchange={(on: boolean) => onset(groupKey(group, 'discover'), on)}
            onunset={() => onset(groupKey(group, 'discover'), null)}
        />
    </div>
</div>

<style>
    .keys {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        padding: 4px 6px 8px;
        border-bottom: 1px solid var(--border);
    }

    .find {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 4px 8px;
        min-width: 0;
    }

    /* The folder globs take the whole row above the lists. */
    .find > :global(:first-child) {
        grid-column: 1 / -1;
    }

    .caption {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        min-width: 0;
    }
</style>
