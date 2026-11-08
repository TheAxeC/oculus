<script lang="ts">
    // Layer 3, shared view. The manifest fields and related documents the project page's card draws
    // under its closed card, in the two columns of every record card's page
    // (views/shared/card/record/RecordDetails.svelte), each field under its small label
    // (RecordField.svelte beside it): on the left STATUS, LATEST, NEXT (the whole next action),
    // RESULTS, OUTCOME and IDEAS / AVENUES; on the right REPRODUCED, DISSEMINATED IN, FILES, then
    // whatever the card puts after them (its subtasks and follow-up blocks). LATEST, NEXT, OUTCOME
    // and REPRODUCED are written line by line and are drawn as their Markdown
    // (../text/FieldMarkdown.svelte); STATUS, RESULTS and IDEAS / AVENUES are one value each and
    // are drawn through CodeText, so a backticked word is code and a web address in the other words
    // is a link.
    //
    // DISSEMINATED IN lists the entries of the collections flagged `dissemination` that name the
    // project, each a press that opens that entry's page in the current pane
    // (state/forms/page-entry.ts `pageView`), drawn in the box PressBox.svelte draws.

    import type { Snippet } from 'svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import type { BoardItem, Dissemination } from '$lib/state/boards/board';
    import { pageView } from '$lib/state/forms/page-entry';
    import { t } from '$lib/state/shared/words/text';
    import CardDocs from '../CardDocs.svelte';
    import FieldMarkdown from '../text/FieldMarkdown.svelte';
    import RecordDetails from '../record/RecordDetails.svelte';
    import RecordField from '../record/RecordField.svelte';
    import PressBox from './PressBox.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: { openView },
        selectors: { disseminatedFor }
    } = client;

    type Props = {
        /** The joined board item whose details are shown. */
        item: BoardItem;
        /** Show a refused or failed open in the owning board. */
        onsaid: (said: string) => void;
        /** Whether the project's documents are listed; a view that draws them itself says no. */
        documents: boolean;
        /** What the right column holds after FILES. */
        children?: Snippet;
    };
    let { item, onsaid, documents, children }: Props = $props();
    const shows = $derived(disseminatedFor(item.id));

    /** Open the page of one entry the project is disseminated in. */
    function openShown(entry: Dissemination): void {
        const page = pageView(entry.collection, entry.id, entry.title);
        openView(page.view, page.state);
    }

    /**
     * REPRODUCED's words: the date and the note on one line, or, when the note holds a line break,
     * the date and then the note's blocks after a blank line.
     */
    function reproducedWords(date: string | undefined, note: string | undefined): string {
        const parts = [date, note].filter((part) => part !== undefined && part !== '');
        return parts.join(note?.includes('\n') === true ? '\n\n' : ' | ');
    }
</script>

{#snippet field(name: string, value: string)}
    <RecordField label={name}>
        <p class="value"><CodeText text={value} linked /></p>
    </RecordField>
{/snippet}

<!-- A field written line by line: its Markdown, under its label. -->
{#snippet longField(name: string, value: string)}
    <RecordField label={name}>
        <div class="value">
            <FieldMarkdown text={value} />
        </div>
    </RecordField>
{/snippet}

{#snippet listField(name: string, values: string[])}
    <RecordField label={name}>
        <ul class="value">
            {#each values as value, at (`${at}:${value}`)}
                <li><CodeText text={value} linked /></li>
            {/each}
        </ul>
    </RecordField>
{/snippet}

{#snippet left()}
    {#if item.project.statusLine}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render field(t('project.card.status'), item.project.statusLine)}
    {/if}
    {#if item.project.latest}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render longField(t('project.card.latest'), item.project.latest)}
    {/if}
    {#if item.project.next}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render longField(t('project.card.next'), item.project.next)}
    {/if}
    {#if item.project.results.length > 0}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render listField(t('project.card.results'), item.project.results)}
    {/if}
    {#if item.project.outcome}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render longField(t('project.card.outcome'), item.project.outcome)}
    {/if}
    {#if item.project.ideas.length > 0}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render listField(t('project.card.ideas'), item.project.ideas)}
    {/if}
{/snippet}

{#snippet right()}
    {#if item.project.reproduced}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render longField(
            t('project.card.reproduced'),
            reproducedWords(item.project.reproduced.date, item.project.reproduced.note)
        )}
    {/if}
    {#if shows.length > 0}
        <RecordField label={t('project.card.disseminated_in')}>
            <div class="tags">
                {#each shows as entry (`${entry.collection}:${entry.id}`)}
                    <PressBox>
                        <ToolButton
                            plain
                            label={entry.title}
                            title={t('project.card.open_in', entry.collection)}
                            onclick={() => openShown(entry)}
                        >
                            <Tag label={entry.title} />
                        </ToolButton>
                    </PressBox>
                {/each}
            </div>
        </RecordField>
    {/if}
    <CardDocs {item} {onsaid} {documents} />
{/snippet}

<RecordDetails {left} {right}>
    {#if children !== undefined}
        {@render children()}
    {/if}
</RecordDetails>

<style>
    .value {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }

    ul.value {
        padding-left: 18px;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }
</style>
