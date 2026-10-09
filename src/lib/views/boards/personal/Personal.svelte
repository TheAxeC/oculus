<script module lang="ts">
    // Layer 3, view registration. The Personal board is the Projects page's fourth tab; its badge
    // is the number of side projects the snapshot holds.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'personal',
        label: 'views.personal',
        glyph: 'views.personal_glyph',
        group: 'projects',
        order: 4,
        badge: (client) => client.railBadges.personalBadge()
    };
</script>

<script lang="ts">
    // Layer 3, view. The Personal board: one card per side project, whether it is a folder of the
    // hub's `side-projects/` or a repository that is a Files root and carries a
    // `.oculus/project.yml`. A card shows the title, its status in the status's hue, where the
    // project lives, what it is in a few lines, what comes next under a label, and its links. A
    // pinned card has the pin glyph and the accent ring and is drawn first within its status, a
    // priority is its flames, `latest` is drawn under the explanation, what the project waits on is
    // the project card's waiting line, and its collaborators and related projects are the project
    // card's cross-link lines.
    //
    // It joins nothing and counts nothing itself: the cards, their order, the search and the
    // toggles are the pure functions of state/boards/board/personal.ts. Every word a manifest
    // holds is drawn as text. A link is an address only when views/shared/forms/posting.ts says it
    // names a web page; every other entry is drawn as the words it is.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import CardActions, { type CardAction } from '$lib/views/shared/card/CardActions.svelte';
    import Clamp from '$lib/views/shared/card/Clamp.svelte';
    import CardLinks from '$lib/views/shared/card/CardLinks.svelte';
    import { posting } from '$lib/views/shared/forms/posting';
    import { openSourceFile } from '$lib/views/shared/links/source-file';
    import {
        filterCards,
        folderTarget,
        manifestTarget,
        parsePersonalState,
        sideLinks,
        sourceLine,
        toggleMore,
        toggleStatus,
        type PersonalState,
        type SideCard
    } from '$lib/state/boards/board/personal';
    import { waitingLine } from '$lib/state/boards/board';
    import { flamesOf } from '$lib/state/boards/focus';
    import { personNames } from '$lib/state/boards/person';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { showInFiles },
        entities: { portfolio },
        selectors: { configMap, sideCards, sideStatuses },
        ui: { instanceState, setInstanceState }
    } = client;

    let { instance }: ViewProps = $props();

    const held = $derived(parsePersonalState(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const cards = $derived(sideCards());
    const statuses = $derived(sideStatuses());
    const shown = $derived(filterCards(cards, held));
    const snapshot = $derived(portfolio());
    const config = $derived(configMap());

    /** What the project waits on, by the project card's rule, and nothing when it waits on none. */
    function waiting(card: SideCard): ReturnType<typeof waitingLine> {
        if (snapshot === null) return null;
        return waitingLine(
            { waitingOn: card.project.waitingOn ?? [] },
            snapshot.entities.venues,
            personNames(snapshot),
            snapshot.entities.projects
        );
    }

    function write(next: PersonalState): void {
        setInstanceState(instance.id, next);
    }

    /** The one control of a card: its folder selected in the Files view. */
    function actions(card: SideCard): CardAction[] {
        const target = folderTarget(card.project);
        return [
            {
                id: 'files',
                label: t('personal.show_in_files'),
                title: t('personal.show_in_files_tip', card.project.title),
                glyph: 'show_in_files',
                onclick: () => {
                    showInFiles(target.path, target.root);
                }
            }
        ];
    }

    /** The card's manifest in a source tab, which is where its words are edited. */
    function openManifest(card: SideCard): void {
        const target = manifestTarget(card.project);
        openSourceFile(client, { root: target.root, path: target.path, label: target.label });
    }
</script>

{#snippet bar()}
    <Toolbar label={t('personal.toolbar')}>
        <Search
            fill
            value={held.search}
            placeholder={t('personal.search')}
            oninput={(value: string) => write({ ...held, search: value })}
        />
        {#each statuses as item (item.key)}
            <Chip
                label={item.label}
                title={t('personal.status_toggle_tip', item.label)}
                glyph={item.glyph}
                tone={item.tone}
                pressed={!held.hidden.includes(item.key)}
                onclick={() => write(toggleStatus(held, item.key))}
            />
        {/each}
    </Toolbar>
{/snippet}

<Pane title={t('views.personal')} {bar}>
    <div class="board" data-instance={instance.id} data-board="personal">
        {#if shown.length === 0}
            {#if cards.length === 0}
                <Empty message={t('personal.empty')} glyph={t('personal.empty_glyph')} />
            {:else}
                <Empty message={t('personal.none_match')} glyph={t('personal.none_match_glyph')} />
            {/if}
        {:else}
            <div class="cards">
                {#each shown as card (card.project.id)}
                    <Card
                        id={card.project.id}
                        cursor={cursor === card.project.id}
                        title={card.project.title}
                        tone={card.status.tone}
                        pinned={card.project.pin === true}
                        ontitle={() => openManifest(card)}
                    >
                        {#snippet meta()}
                            {@const item = card.status}
                            {#if card.project.pin === true}
                                <span class="pin"><Glyph name={t('project.card.pin_glyph')} /></span
                                >
                            {/if}
                            {#if flamesOf(card.project, config) > 0}
                                <span class="flames" title={card.project.priority}>
                                    {#each { length: flamesOf(card.project, config) } as _, at (at)}
                                        <Glyph name={t('focus.fire_glyph')} />
                                    {/each}
                                </span>
                            {/if}
                            <Chip label={item.label} glyph={item.glyph} tone={item.tone} />
                            <CardActions actions={actions(card)} />
                        {/snippet}

                        {@const wait = waiting(card)}
                        <p class="source">{sourceLine(card.project)}</p>
                        {#if card.project.eli5 !== ''}
                            <div class="eli5">
                                <Clamp
                                    open={held.more.includes(card.project.id)}
                                    ontoggle={() => write(toggleMore(held, card.project.id))}
                                >
                                    {card.project.eli5}
                                </Clamp>
                            </div>
                        {/if}
                        {#if (card.project.latest ?? '') !== ''}
                            <p class="latest">
                                <span class="label">{t('project.card.latest')}</span>
                                {card.project.latest}
                            </p>
                        {/if}
                        {#if card.project.next !== ''}
                            <p class="next">
                                <span class="label">{t('personal.next')}</span>
                                {card.project.next}
                            </p>
                        {/if}
                        {#if wait !== null}
                            <p class="waiting {wait.kind}">{wait.text}</p>
                        {/if}
                        {#if card.project.links.length > 0}
                            <ul class="links">
                                {#each card.project.links as link, index (`${index}:${link}`)}
                                    {@const href = posting(link)}
                                    <li>
                                        {#if href !== undefined}
                                            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external web page, rather than a route id resolve() takes -->
                                            <a {href} target="_blank" rel="noreferrer">
                                                <Glyph name="link" />
                                                <span>{link}</span>
                                            </a>
                                        {:else}
                                            <span>{link}</span>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                        <CardLinks item={sideLinks(card.project, snapshot)} />
                    </Card>
                {/each}
            </div>
        {/if}
    </div>
</Pane>

<style>
    /* The cards of one row stretch to the row's height, in the board's order. */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        align-items: stretch;
    }

    .source,
    .next,
    .latest,
    .links {
        margin: 6px 0 0;
        overflow-wrap: anywhere;
    }

    .source {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
    }

    .eli5 {
        margin-top: 6px;
        font-size: var(--fs-md);
    }

    .next,
    .latest {
        font-size: var(--fs-md);
    }

    .waiting {
        margin: 6px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .pin,
    .flames {
        display: inline-flex;
        flex: 0 0 auto;
        line-height: 1;
    }

    .label {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .links {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 0;
        list-style: none;
        font-size: var(--fs-sm);
    }

    .links a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
