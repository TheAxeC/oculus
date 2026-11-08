<script lang="ts">
    // Layer 3, Present partial. The form a group's Edit Rule opens under its header in the
    // Overview: `find`, the folder globs the group looks in and the tiers, stages, forms and status
    // chips a found deck's project must have, each list a word of the engine's vocabulary or one
    // typed; and `discover`, whether the group takes the decks it finds beyond the ones it names.
    // Unset, `discover` takes none, the deck reader's default. The decks a group takes go in the
    // deck order (data/shapes/boards/order.ts), which the form does not set.
    //
    // What the reader sets is the form's own work until Apply writes it, each key with the value
    // the file held as its base, and closes the form; Cancel and Escape close it with nothing
    // written (KeyForm.svelte), so a half-typed glob is never written. A key typed in a field
    // stays with the field: the Present pane hands no key a field takes to the deck.
    //
    // The form is drawn in its group's body, under the group's sticky strip. Opened from an Edit
    // Rule pressed on a strip that stands over the body, its top would lie under the strip, and
    // so would a label the focus is moved to by Tab: in either case the label is scrolled into view
    // by the least distance, with a scroll margin of the room the strip and the space under it
    // take, read from `--group-strip`, set on the group's body, and `--group-strip-gap`, set on its
    // section, so the words stand under the strip.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
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

    /** The group's `find:` as the form draws it, and its discovery. */
    const find = $derived(findForm(shown(groupKey(group, 'find'))));
    const discover = $derived.by(() => {
        const held = shown(groupKey(group, 'discover'));
        return typeof held === 'boolean' ? held : null;
    });

    function onfind(form: FindForm): void {
        const path = groupKey(group, 'find');
        onset(path, findValue(shown(path), form));
    }

    /**
     * Scroll `part` of the form into the pane's view by the least distance, none when it is in
     * view. Each part's scroll margin is the room the group's sticky strip and the space under it
     * take (`.rule` below), so a part brought into view stands under the strip.
     */
    function uncover(part: Element | null): void {
        part?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    /**
     * The form's top out from under the strip once it opens, and, as the focus moves into a
     * control, the words that label it: a list's caption, the Find label at the form's top over
     * the folder globs, the control itself for the checkbox and the buttons.
     */
    function unhidden(form: HTMLElement): () => void {
        const top = form.querySelector('[data-rule-top]');
        uncover(top);
        const moved = (event: FocusEvent): void => {
            const control = event.target;
            if (!(control instanceof Element)) return;
            const list = control.closest('[data-rule-list]');
            const find = control.closest('[data-rule-find]');
            uncover(list ?? (find === null ? control : top));
        };
        form.addEventListener('focusin', moved);
        return () => form.removeEventListener('focusin', moved);
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

<div class="rule" {@attach unhidden}>
    <span class="top" data-rule-top></span>
    <KeyForm
        label={t('present.rule_form', group)}
        {work}
        {busy}
        {onapply}
        {oncancel}
        data-rule-form={group}
    >
        <Field label={t('present.field_find')} help={t('present.field_find_help')}>
            <div class="find" data-rule-find>
                <TextInput
                    value={find.folders}
                    label={t('present.field_find_folders', group)}
                    placeholder={t('present.field_find_folders_hint')}
                    oninput={(folders: string) => onfind({ ...find, folders })}
                />
                {#each FIND_LISTS as { key } (key)}
                    <div class="list" data-rule-list>
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
        <Checkbox
            checked={discover}
            label={t('present.field_discover')}
            unset={t('present.field_discover_none')}
            onchange={(on: boolean) => onset(groupKey(group, 'discover'), on)}
            onunset={() => onset(groupKey(group, 'discover'), null)}
        />
    </KeyForm>
</div>

<style>
    /* Every part of the form keeps the room of the group's sticky strips and the space under them
       when it is scrolled into view: ui/controls/heads/GroupHead.svelte sets the first on its body
       and the second on its section, and the form reads both through the body. */
    .rule,
    .rule :global(*) {
        scroll-margin-top: calc(var(--group-strip, 0px) + var(--group-strip-gap, 0px));
    }

    /* The form's top, the place its first label is scrolled to. */
    .top {
        display: block;
    }

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
</style>
