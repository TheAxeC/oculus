<script lang="ts">
    // Layer 3, partial of DetailsSection.svelte beside it. The rows of the Details section: the
    // words the last pin, rename or resume answered in one muted row while there are any, then the
    // three group rows, Session, Model and Usage, each a row of the section's tree that folds, and
    // under each while it is open one row per fact (detail-facts.ts). A fact's row says its name,
    // muted, at the left and its value at the right, cut with an ellipsis at the pane's width; the
    // whole value is the row's hover words, on the row's `li`, since ui/tree/TreeItem.svelte draws
    // a tooltip only on a row that is pressed. The context row draws its meter in the value's
    // place.
    //
    // While a title is typed, the title row holds the title's field (ui/tree/row/NameField.svelte)
    // in place of its value. It answers as the list's does (../title-field.ts): Enter writes the
    // title and an empty one clears it, Escape closes it with nothing written through
    // `escapeCloses`, and the focus leaving keeps it open. Enter and Escape give the focus back to
    // the title row. A rename is written when Enter is pressed rather than on each keystroke: every
    // write of the overrides file makes the server rescan the session stores.
    //
    // The body holds what the head's Rename, Pin and Resume act on, and hands the head those three
    // (`onactions`, `DetailsActions`) while it is drawn: the title typed and not written, the
    // session the resume was asked once for, the words the last write answered, and the time the
    // started row is measured from, read when the body is drawn. A closed section unmounts the
    // body, so a close drops all four and closes the Details title field, and a reopen reads the
    // time again.

    import { onMount, tick } from 'svelte';
    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import NameField from '$lib/ui/tree/row/NameField.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { escapeCloses, titleToWrite, type TitleField } from '../title-field';
    import {
        DETAIL_GROUPS,
        TITLE_FACT,
        detailFacts,
        factRow,
        groupName,
        groupRow,
        windowFor,
        type DetailGroup,
        type DetailsActions,
        type Fact
    } from './detail-facts';

    const {
        selection: { select },
        selectors: { contextWindow },
        terminals: { resumeTerminal, showTerminal },
        writes: { writeSession }
    } = useState();

    type Props = {
        record: GroupedSession;
        nav: TreeNav;
        /** The title field the tab keeps open, and the call that opens one or (null) closes it. */
        field: TitleField;
        setField: (next: TitleField) => void;
        /** Whether a group row is open. */
        open: (group: DetailGroup) => boolean;
        ontoggle: (group: DetailGroup) => void;
        /** What the head's controls act on, handed while the body is drawn, null once it is not. */
        onactions: (actions: DetailsActions | null) => void;
    };

    let { record, nav, field, setField, open, ontoggle, onactions }: Props = $props();

    /** What the title's field holds while it is open. */
    let typed = $state('');

    /** What the last pin, rename or resume answered, in words, or the empty string before any. */
    let outcome = $state('');

    /**
     * The session the resume control was asked once for. Resuming runs the agent again on the same
     * transcript, which is the explicit migration and never something a stray press does.
     */
    let armed = $state('');

    /** The time the started row is measured from, read when the body is drawn. */
    const now = Date.now();

    const renaming = $derived(field?.where === 'details' && field.session === record.id);
    const facts = $derived(
        detailFacts({
            session: record,
            window: windowFor(record, contextWindow()),
            now,
            renaming
        })
    );

    /** One write of the overrides file, with the answer put where the outcome row shows it. */
    async function write(part: { area?: string; title?: string }): Promise<void> {
        outcome = '';
        const answer = await writeSession(record.id, part);
        const refused = answer.refused.length > 0;
        outcome = answer.ok && !refused ? t('sessions.write_saved') : t('sessions.write_failed');
    }

    /**
     * Continue the session in a terminal. The first press arms the control and the second runs it;
     * the server reads the directory and the title off the record, so only the tool and the id go
     * out. On success the new terminal becomes the selection and is shown in the Terminal tab of
     * the page on screen, or a new one, since the pane it starts in would otherwise be nowhere.
     */
    async function resume(): Promise<void> {
        if (armed !== record.id) {
            armed = record.id;
            return;
        }
        armed = '';
        outcome = '';
        const answer = await resumeTerminal(record.tool, record.id);
        if (!answer.ok) {
            outcome = answer.error;
            return;
        }
        select(answer.id);
        showTerminal(answer.id);
    }

    onMount(() => {
        onactions({
            get armed() {
                return armed === record.id;
            },
            rename: () => {
                typed = record.title;
                setField({ where: 'details', session: record.id });
            },
            pin: (area: string) => void write({ area }),
            resume
        });
        return () => {
            onactions(null);
            if (field?.where === 'details') setField(null);
        };
    });

    function submit(text: string): void {
        const next = titleToWrite(text, record.title);
        setField(null);
        if (next !== null) void write({ title: next });
    }

    /** The field closed by Enter or Escape: the focus goes back to the title row. */
    async function closed(close: () => void): Promise<void> {
        close();
        await tick();
        nav.focus(factRow(TITLE_FACT));
    }

    const oncancel = (): void => setField(null);

    /** A fact's name in the muted colour, the row's words at the left. */
    const MUTED = '--tone-txt: var(--muted-txt, var(--muted))';
</script>

{#snippet value(one: Fact, group: DetailGroup)}
    {#if one.meter !== undefined}
        <span class="value num meter">
            <Meter
                value={one.meter.level}
                tone={one.meter.tone}
                label={one.name}
                text={one.value}
            />
        </span>
    {:else}
        <span class="value" class:num={group === 'usage'}>{one.value}</span>
    {/if}
{/snippet}

{#if outcome !== ''}
    <li role="none" data-details-outcome>
        <TreeItem label={outcome} tone="muted" depth={1} />
    </li>
{/if}
{#each DETAIL_GROUPS as group (group)}
    <li role="none" data-details-group={group}>
        <TreeItem
            label={groupName(group)}
            id={groupRow(group)}
            {nav}
            level={2}
            depth={1}
            expanded={open(group)}
            onclick={() => ontoggle(group)}
        />
    </li>
    {#if open(group)}
        {#each facts[group] as one (one.key)}
            {#if renaming && one.key === TITLE_FACT}
                <li role="none" data-fact={one.key}>
                    <TreeItem
                        label={one.name}
                        name={t('sessions.rename_field')}
                        id={factRow(one.key)}
                        {nav}
                        level={3}
                        depth={2}
                        nameStyle={MUTED}
                    >
                        {#snippet field()}
                            <span class="box" {@attach escapeCloses(() => void closed(oncancel))}>
                                <NameField
                                    value={typed}
                                    label={t('sessions.rename_field')}
                                    oninput={(text: string) => (typed = text)}
                                    onsubmit={(text: string) => void closed(() => submit(text))}
                                    oncancel={() => void closed(oncancel)}
                                    onleave={() => undefined}
                                />
                            </span>
                        {/snippet}
                    </TreeItem>
                </li>
            {:else}
                <li role="none" data-fact={one.key} title={one.tip === '' ? undefined : one.tip}>
                    <TreeItem
                        label={one.name}
                        name={`${one.name} ${one.value}`}
                        id={factRow(one.key)}
                        {nav}
                        level={3}
                        depth={2}
                        nameStyle={MUTED}
                    >
                        {#snippet detail()}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render value(one, group)}
                        {/snippet}
                    </TreeItem>
                </li>
            {/if}
        {/each}
    {/if}
{/each}

<style>
    /* The value stands at the row's right edge in the row's own ink, cut at its end when the pane
       is narrower than it; the name keeps its width. */
    .value {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: right;
        padding-right: var(--tree-end-inset);
        color: var(--ink-txt, var(--ink));
    }

    /* The measurements in the face numbers are set in, as the counts of every row are. */
    .value.num {
        font-family: var(--font-num);
    }

    /* The meter takes the value's width, its number at its right. */
    .value.meter {
        padding-left: 8px;
    }

    .box {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
    }
</style>
