<script lang="ts">
    // Layer 3, Venues view partial. One catalogue venue as the record card
    // (views/shared/card/record/RecordCard.svelte): its metadata, its deadline as a tag with the
    // deadline glyph and the countdown and tone of a project's due, and the strip of its project
    // users at the foot. The venue's name and the strip's Page open its page; the menu holds Page
    // and Show in Files in its Open run, the Add run, whose Deadline changes the venue's deadline,
    // Edit in File and Delete (views/shared/forms/registry/registry-card.svelte.ts). The project
    // list is already restricted to real users, and concentration arrives as a flag, drawn as the
    // card's ring.
    //
    // A `link` is told a path of the hub from an address by the rule the collection cards use
    // (hubPathsOf of state/boards/collection/): a path is offered only as the action that selects
    // it in the Files view under the root of the hub the venue is of, since a folder of the hub is
    // no site and the file address cannot serve it; an address is the site link, opened in a tab of
    // the browser's own. Both links the card draws, the site and the call, go through `hrefOf`, so
    // neither is left relative to the page's own address. A web address written in a plain item of
    // the metadata line (the timing) is a link (ui/display/text/LinkedText.svelte), and `wants` is
    // inline Markdown, which links its addresses itself.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import type { RecordAction } from '$lib/views/shared/card/record/record-menu';
    import { createRegistryCard } from '$lib/views/shared/forms/registry/registry-card.svelte';
    import { inlineMarkdown } from '$lib/ui/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';
    import {
        hrefOf,
        hubPathsOf,
        type Entry,
        type IdentityFault,
        type SchemaField
    } from '$lib/state/boards/collection';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { t } from '$lib/state/shared/words/text';
    import { dueBadge } from '$lib/views/shared/card/card';
    import {
        freeTone,
        quartileTone,
        type Project,
        type Venue
    } from '$lib/state/sources/registries/venues';
    import { themeWordLabel, type ThemeWordLabels } from '$lib/state/shared/words/themes';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { showInFiles },
        selectors: { registryKey }
    } = client;

    type Props = {
        venue: Venue;
        /** Whether keyboard navigation has selected this venue. */
        cursor: boolean;
        projects: Project[];
        concentrated: boolean;
        /** The labels of the venue theme words, which the theme tags draw in place of the word. */
        labels: ThemeWordLabels;
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        /** The registry file, which Edit in File opens; null when the configuration names none. */
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
    };

    let {
        venue,
        cursor,
        projects,
        concentrated,
        labels,
        entry,
        schema,
        file,
        fault,
        onsaid
    }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();

    /** The key the venue's hub gives the venues registry, which its page and writes name. */
    const collection = $derived(registryKey('venues', rootOf(venue)));

    /** The hub path the venue's `link` names, or undefined for an address or no link. */
    const linkPath = $derived(hubPathsOf({ link: venue.link }).at(0));

    /** Page, Edit in File and Delete for a venue the collection file holds, and its Add run. */
    const card = createRegistryCard(client, () => ({
        file,
        entry,
        schema,
        fault,
        onsaid,
        collection,
        title: venue.name
    }));

    /**
     * The card's actions: Show in Files for a link that is a hub path, then Page, Edit in File and
     * Delete for a venue the collection file holds.
     */
    const actions = $derived.by((): RecordAction[] => {
        const path = linkPath;
        if (path === undefined) return card.actions;
        const show: RecordAction = {
            id: `files:${path}`,
            label: t('venues.show_in_files'),
            row: t('collection.show_path_in_files', path),
            title: t('venues.show_in_files_tip', path),
            glyph: 'show_in_files',
            onclick: () => {
                showInFiles(path, rootOf(venue));
            }
        };
        return [show, ...card.actions];
    });

    /** The moment the deadline's countdown is measured from. */
    const now = Date.now();
    /** The venue's deadline as the project card draws a due: its countdown and tone, or none. */
    const due = $derived(dueBadge(card.dated?.deadline?.held, now, t));

    /** One item of the card's metadata line. */
    type MetaItem = {
        label: string;
        glyph?: string;
        bold?: boolean;
        href?: string;
        external?: boolean;
    };

    /**
     * An indexing field as the card draws it: its words, with the check or cross glyph before them
     * when the registry opened the field with a yes or a no mark, and nothing for an empty field.
     */
    function indexed(
        words: string | undefined,
        mark: 'yes' | 'no' | undefined,
        named: (words: string) => string
    ): MetaItem | null {
        if (words === undefined && mark === undefined) return null;
        const label = named(words ?? '').trim();
        if (mark === undefined) return { label };
        return { label, glyph: mark === 'yes' ? 'check' : 'cross' };
    }

    const metadata: MetaItem[] = $derived(
        [
            venue.jif && !['none', ' - '].includes(venue.jif.toLowerCase())
                ? { label: t('venues.jif', venue.jif) }
                : null,
            indexed(venue.wos, venue.wosMark, (words) => t('venues.wos', words)),
            indexed(venue.scopus, venue.scopusMark, (words) => t('venues.scopus', words)),
            venue.format ? { label: venue.format, bold: true } : null,
            venue.timing ? { label: venue.timing, glyph: 'timing' } : null,
            venue.link && linkPath === undefined
                ? {
                      label: t('venues.site'),
                      glyph: 'launch',
                      href: hrefOf(venue.link, rootOf(venue)),
                      external: true
                  }
                : null,
            venue.call
                ? {
                      label: t('venues.call'),
                      glyph: 'paper',
                      href: hrefOf(venue.call, rootOf(venue)),
                      external: true
                  }
                : null,
            venue.email
                ? { label: t('venues.contact'), glyph: 'email', href: `mailto:${venue.email}` }
                : null
        ].filter((item) => item !== null)
    );
</script>

{#snippet meta()}
    {#if venue.quartile}
        <Tag label={venue.quartile} tone={quartileTone(venue.quartile)} />
    {/if}
    {#if concentrated}
        <Tooltip text={t('venues.conc_tip')} focusable>
            <Tag label={t('venues.conc')} tone="violet" />
        </Tooltip>
    {/if}
    {#if venue.free}
        <Tag label={venue.free} tone={freeTone(venue.free)} />
    {/if}
    {#if due}
        <Tag label={due.label} glyph={t('project.card.deadline_glyph')} tone={due.tone} />
    {/if}
{/snippet}

{#snippet text()}
    <div class="meta">
        {#each metadata as item, at (item.label)}
            {#if at > 0}
                <span class="sep">{t('venues.sep')}</span>
            {/if}
            {#if item.bold}
                <strong>{item.label}</strong>
            {:else if item.href}
                <!-- eslint-disable svelte/no-navigation-without-resolve -- the address is data, an external link or the api/file endpoint, rather than a route id resolve() takes -->
                <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener' : undefined}
                >
                    {#if item.glyph}
                        <Glyph name={item.glyph} />
                    {/if}
                    {item.label}
                </a>
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
            {:else}
                <span>
                    {#if item.glyph}
                        <Glyph name={item.glyph} />
                    {/if}
                    <LinkedText text={item.label} />
                </span>
            {/if}
        {/each}
    </div>

    {#if venue.wants}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
        <p class="wants">{@html inlineMarkdown(venue.wants, cardMath(venue.wants))}</p>
    {/if}

    {#if venue.themes.length > 0}
        <div class="themes">
            {#each venue.themes as theme (theme)}
                <Tag label={themeWordLabel(labels, theme)} />
            {/each}
        </div>
    {/if}
{/snippet}

<div class="slot" data-venue={venue.id}>
    <RecordCard
        id={venue.id}
        {cursor}
        title={venue.name}
        titleHtml={inlineMarkdown(venue.name, cardMath(venue.name))}
        ontitle={card.onpage}
        ring={concentrated ? 'violet' : undefined}
        record={venue}
        {actions}
        strip={['page']}
        dated={card.dated}
        {onsaid}
        {meta}
        {text}
        {projects}
        deleting={card.deleting}
    />
</div>

<style>
    .meta,
    .themes {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .meta,
    .themes,
    .wants {
        margin-top: 8px;
    }

    .meta {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .wants {
        margin-top: 8px;
        margin-bottom: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .meta .sep {
        color: var(--muted-txt, var(--muted));
    }

    .meta a {
        color: var(--accent-txt, var(--accent));
    }
</style>
