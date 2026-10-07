<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the `:language` list as VS Code's
    // Select Language Mode draws them: above the languages, Auto Detect (the tab's chosen language
    // cleared, so the language map names it again), the file association of the file's ending and
    // the language's own settings; each language with its name in brackets, and the one in force
    // marked. Choosing the association turns the list into a second one, titled with the ending,
    // whose pick writes the association to config/sources.yml and closes the palette; a refusal of
    // the write is said in the palette, which stays open.

    import { onDestroy } from 'svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import {
        associationOutcome,
        languageHint,
        type LanguageAction,
        type LanguageAssociation,
        type LanguageChoice,
        type LanguageMatch
    } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    type Props = {
        /** The source tab the palette is changing the language of, and the language in force. */
        source: { instance: string; status: { language: string } };
        actions: LanguageAction[];
        languages: LanguageMatch[];
        associating: LanguageAssociation | null;
        onassociate: (association: LanguageAssociation) => void;
        onclose: () => void;
        onsaid: (words: string) => void;
    };

    let { source, actions, languages, associating, onassociate, onclose, onsaid }: Props = $props();

    /** Paint the source tab in a language, or in the one its name gives with an empty name. */
    function paint(language: string): void {
        client.editorStatus.ask(source.instance, { kind: 'language', language });
        onclose();
    }

    /** Press one entry above the languages. */
    function press(action: LanguageAction): void {
        if (action.kind === 'auto') {
            paint('');
        } else if (action.kind === 'associate') {
            onassociate({ ending: action.ending, title: action.title });
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

{#if associating !== null}
    <p class="title" data-association-title>{associating.title}</p>
{/if}
{#each associating === null ? actions : [] as action (action.kind)}
    <PaletteRow
        row={{
            value: `language-action:${action.kind}`,
            kind: t('statusbar.palette_kind_language'),
            label: action.label,
            pick: () => press(action)
        }}
    />
{/each}
{#each languages as found (found.choice.name)}
    <PaletteRow
        row={{
            value: `language:${found.choice.name}`,
            kind: t('statusbar.palette_kind_language'),
            label: found.choice.label,
            parts: found.label,
            hint: languageHint(found.choice.name, source.status.language),
            active: source.status.language === found.choice.name,
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
