<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the `:language` list as VS Code's
    // Select Language Mode draws them: above the languages, Auto Detect (the tab's chosen language
    // cleared, so the language map names it again), the file association of the file's ending and
    // the language's own settings; each language with its name in brackets, and the one in force
    // marked. Choosing the association turns the list into a second one, titled with the ending,
    // whose pick writes the association into the `languages` map of the open workspace file's
    // `settings:` and closes the palette; a refusal of the write is said in the palette, which
    // stays open. With no source tab on screen the list
    // says there is none to set the language of.

    import { onDestroy } from 'svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { LanguageList } from '$lib/shell/keys/lists/language-list.svelte';
    import {
        associationOutcome,
        languageHint,
        type LanguageAction,
        type LanguageChoice
    } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    type Props = {
        /**
         * The source tab the palette is changing the language of, and the language in force; null
         * with no source tab on screen.
         */
        source: { instance: string; status: { language: string } } | null;
        list: LanguageList;
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { source, list, onclose, onsaid }: Props = $props();

    const associating = $derived(list.associating);

    /** Paint the source tab in a language, or in the one its name gives with an empty name. */
    function paint(language: string): void {
        if (source !== null)
            client.editorStatus.ask(source.instance, { kind: 'language', language });
        onclose();
    }

    /** Press one entry above the languages. */
    function press(action: LanguageAction): void {
        if (action.kind === 'auto') {
            paint('');
        } else if (action.kind === 'associate') {
            list.associate({ ending: action.ending, title: action.title });
        } else {
            client.paletteSource.openLanguageSettings();
            onclose();
        }
    }

    /** Whether the palette still draws these rows, which an answer to the write is told to. */
    let drawn = true;
    onDestroy(() => (drawn = false));

    /**
     * Write the association of the second list's ending with the language chosen. An answer that
     * comes after the palette closed says and closes nothing, since the palette may have been
     * opened again for something else.
     */
    async function associate(choice: LanguageChoice): Promise<void> {
        if (associating === null) return;
        const answer = await client.paletteSource.associate(associating.ending, choice.name);
        const outcome = associationOutcome(answer, drawn);
        if (outcome.kind === 'close') onclose();
        else if (outcome.kind === 'say') onsaid(outcome.words);
    }
</script>

{#if source === null}
    <p class="title">{t('statusbar.palette_language_none')}</p>
{:else if associating !== null}
    <p class="title" data-association-title>{associating.title}</p>
{/if}
{#each associating === null ? list.entries : [] as action (action.kind)}
    <PaletteRow
        row={{
            value: `language-action:${action.kind}`,
            kind: t('statusbar.palette_kind_language'),
            label: action.label,
            pick: () => press(action)
        }}
    />
{/each}
{#each source === null ? [] : list.languages as found (found.choice.name)}
    <PaletteRow
        row={{
            value: `language:${found.choice.name}`,
            kind: t('statusbar.palette_kind_language'),
            label: found.choice.label,
            parts: found.label,
            hint: languageHint(found.choice.name, source?.status.language ?? ''),
            active: source?.status.language === found.choice.name,
            language: found.choice.name,
            pick: () =>
                associating === null ? paint(found.choice.name) : void associate(found.choice)
        }}
    />
{/each}

<style>
    .title {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
