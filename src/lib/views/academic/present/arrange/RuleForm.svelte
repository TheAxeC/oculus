<script lang="ts">
    // Layer 3, Present partial. The form a group's Edit Rule opens under its header in the
    // Overview: `find`, the folder globs the group looks in and the tiers, stages, forms and status
    // chips a found deck's project must have, each list a word of the engine's vocabulary or one
    // typed; `sort`, how the found decks are ordered; and `discover`, whether the group takes the
    // decks it finds beyond the ones it names. Unset, `sort` orders by folder and `discover` takes
    // none, the deck reader's defaults.
    //
    // What the reader sets is the form's own work until Apply writes it, each key with the value
    // the file held as its base, and closes the form; Cancel and Escape close it with nothing
    // written (KeyForm.svelte), so a half-typed glob is never written. A key typed in a field
    // stays with the field: the Present pane hands no key a field takes to the deck.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import KeyForm from './KeyForm.svelte';
    import { createKeyWork } from './arrange.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        FIND_LISTS,
        findForm,
        findValue,
        groupKey,
        type DeckKeys,
        type FindChoices,
        type FindForm,
        type FindList,
        type KeyEdit
    } from '$lib/state/life/arrange';

    type Props = {
        /** The group's name. */
        group: string;
        /** The deck's keys as the file holds them. */
        keys: DeckKeys | null;
        /** The words each list of `find:` offers. */
        choices: FindChoices;
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

    let { group, keys, choices, busy, onapply, oncancel }: Props = $props();

    const work = createKeyWork(() => keys);
    const { shown, onset } = work;

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
                return t('present.field_find_tiers');
            case 'stages':
                return t('present.field_find_stages');
            case 'forms':
                return t('present.field_find_forms');
            case 'status':
                return t('present.field_find_status');
        }
    }
</script>

<KeyForm
    label={t('present.rule_form', group)}
    {work}
    {busy}
    {onapply}
    {oncancel}
    data-rule-form={group}
>
    <Field label={t('present.field_find')} help={t('present.field_find_help')}>
        <div class="find">
            <TextInput
                value={find.folders}
                label={t('present.field_find_folders', group)}
                placeholder={t('present.field_find_folders_hint')}
                oninput={(folders: string) => onfind({ ...find, folders })}
            />
            {#each FIND_LISTS as { key } (key)}
                <div class="list">
                    <span class="caption">{caption(key)}</span>
                    <MultiSelect
                        values={find[key]}
                        label={t('present.field_find_list', caption(key), group)}
                        choices={choices(key)}
                        free
                        search={t('editor.search')}
                        remove={t('editor.remove')}
                        removeGlyph={t('editor.remove_glyph')}
                        none={t('editor.no_choices')}
                        more={(count: number) => t('editor.more_choices', count)}
                        onchange={(next: string[]) => onfind({ ...find, [key]: next })}
                    />
                </div>
            {/each}
        </div>
    </Field>
    <div class="line">
        <Field label={t('present.field_sort')} help={t('present.field_sort_help')}>
            <Select
                value={sort}
                label={t('present.field_sort_of', group)}
                empty={t('present.field_sort_none')}
                choices={[
                    { id: 'folder', label: t('present.field_sort_folder') },
                    { id: 'title', label: t('present.field_sort_title') }
                ]}
                onchange={(next: string) =>
                    onset(groupKey(group, 'sort'), next === '' ? null : next)}
            />
        </Field>
        <Checkbox
            checked={discover}
            label={t('present.field_discover')}
            unset={t('present.field_discover_none')}
            onchange={(on: boolean) => onset(groupKey(group, 'discover'), on)}
            onunset={() => onset(groupKey(group, 'discover'), null)}
        />
    </div>
</KeyForm>

<style>
    /* The folder globs, then each list under its caption. */
    .find,
    .list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .list {
        gap: 2px;
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
