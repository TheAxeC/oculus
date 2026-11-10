<script lang="ts">
    // Layer 3, shared view partial, drawn by the Venues view and, with `page`, by the venue's page
    // (views/boards/entry/Entry.svelte). One catalogue venue as the record card
    // (views/shared/card/record/RecordCard.svelte): its metadata, its deadline as a tag with the
    // deadline glyph and the countdown and tone of a project's due, and the strip of its project
    // users at the foot, its dead ends a group of their own as on the page's row. The venue's name
    // and the strip's Page open its page; the menu holds Page and Show in Files in its Open run,
    // the Add run, whose Deadline changes the venue's deadline, Edit, Edit in File and Delete
    // (views/shared/forms/registry/registry-card.svelte.ts). On the page the name is words, the
    // strip holds Edit, the venue's wants are the left of the two columns of a record's page and
    // its metadata line and its themes the right, each under its small label
    // (views/shared/card/record/RecordDetails.svelte), and the card draws no strip of projects,
    // which the row under the page's card counts. The project list is every project that targets
    // the venue, dead ends included (state/sources/registries/venues.ts `venueUsers`), and
    // concentration, read over the real ones among them, arrives as the warning count they reach,
    // drawn as the card's ring and a tag whose tip names the count.
    //
    // A `link` is told a path of the hub from an address by the rule the collection cards use
    // (hubPathsOf of state/boards/collection/): a path is offered only as the action that selects
    // it in the Files view under the root of the hub the venue is of, since a folder of the hub is
    // no site and the file address cannot serve it; an address is the site link, opened in a tab of
    // the browser's own. Both links the card draws, the site and the call, go through `hrefOf`, so
    // neither is left relative to the page's own address. A web address written in a plain item of
    // the metadata line (the timing) is a link (ui/display/text/LinkedText.svelte), and `wants` is
    // its Markdown (views/shared/card/text/FieldMarkdown.svelte), which links its addresses itself.
    //
    // The metadata line holds the fee and the open-access status the entry stores. For a venue
    // whose hub names a journal browser that asks by ISSN, the menu holds Read from the browser,
    // which asks the browser by the venue's ISSNs and writes the fee and the open-access status of
    // the one hit into the entry through the entry write, its History record with it; it is off,
    // its title saying why, for a venue with no ISSN (state/sources/registries/browser.ts).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import FieldMarkdown from '$lib/views/shared/card/text/FieldMarkdown.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import RecordField from '$lib/views/shared/card/record/RecordField.svelte';
    import type { RecordAction } from '$lib/views/shared/card/record/record-menu';
    import { createRegistryCard } from '$lib/views/shared/forms/registry/registry-card.svelte';
    import { inlineMarkdown, useHtmlMemo } from '$lib/ui/html/html';
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
        noJif,
        venueTone,
        type Project,
        type Venue
    } from '$lib/state/sources/registries/venues';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import { readBlocked, readFromBrowser } from '$lib/state/sources/registries/browser';
    import { routeBody } from '$lib/state/feeds/literature/answers';
    import { refusalWords } from '$lib/views/shared/forms/answer-words';
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
        /** The warning count the venue's live projects reach, null while they reach none. */
        concentrated: number | null;
        /** The labels of the venue theme words, which the theme tags draw in place of the word. */
        labels: ThemeWordLabels;
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        /** The registry file, which Edit in File opens; null when the configuration names none. */
        file: ViewSource | null;
        fault: IdentityFault | undefined;
        onsaid: (said: string) => void;
        /** Drawn on the venue's own page: the name as words, no Page. */
        page?: boolean;
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
        onsaid,
        page = false
    }: Props = $props();

    /** How this component's Markdown fields draw their formulas, once KaTeX is in. */
    const cardMath = createCardMath();
    const htmlMemo = useHtmlMemo();

    /** The words of the venue's own hub, whose `venue_ranks` and `venue_costs` tone its tags. */
    const words = $derived(vocabOf(rootOf(venue)));

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
        title: venue.name,
        page
    }));

    /** Whether a Read from the browser press is under way. */
    let reading = $state(false);

    /**
     * One Read from the browser press: the venue's ISSNs asked in order, and the fee and the
     * open-access status of the one hit written into the venue's entry, or the sentence saying why
     * nothing was.
     */
    async function read(target: Entry): Promise<void> {
        reading = true;
        try {
            const token = client.writes.writeToken();
            const outcome = await readFromBrowser(venue, (url) => routeBody(url, token));
            if ('none' in outcome) {
                onsaid(outcome.none);
                return;
            }
            const answer = await client.writes.writeEntry(collection, target.id, outcome.write);
            const refused = refusalWords(answer);
            onsaid(refused === '' ? t('venues.read_done', outcome.issn) : refused);
        } finally {
            reading = false;
        }
    }

    /**
     * Read from the browser, for a venue the collection file holds whose hub names a journal
     * browser that asks by ISSN: off with the reason while the venue has no ISSN or the file
     * cannot be written, and none on the page of a venue of a file with no schema, which writes
     * nothing.
     */
    const readAction = $derived.by((): RecordAction | null => {
        if (venue.browsable !== true || entry === null) return null;
        if (page && schema === undefined) return null;
        const target = entry;
        const blocked = readBlocked(venue) || (card.dated?.blocked ?? '');
        return {
            id: 'read',
            label: reading ? t('venues.read_reading') : t('venues.read'),
            title: blocked === '' ? t('venues.read_tip') : blocked,
            glyph: 'refresh',
            turning: reading,
            disabled: blocked !== '' || reading,
            onclick: () => read(target)
        };
    });

    /**
     * The card's actions: Show in Files for a link that is a hub path, then Page, Edit in File and
     * Delete for a venue the collection file holds, and Read from the browser.
     */
    const actions = $derived.by((): RecordAction[] => {
        const path = linkPath;
        const own = readAction === null ? card.actions : [...card.actions, readAction];
        if (path === undefined) return own;
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
        return [show, ...own];
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
            venue.jif !== undefined && !noJif(venue.jif, words)
                ? { label: t('venues.jif', venue.jif) }
                : null,
            indexed(venue.wos, venue.wosMark, (words) => t('venues.wos', words)),
            indexed(venue.scopus, venue.scopusMark, (words) => t('venues.scopus', words)),
            venue.fee ? { label: t('venues.fee', venue.fee) } : null,
            venue.openAccess ? { label: t('venues.open_access', venue.openAccess) } : null,
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
        <Tag label={venue.quartile} tone={venueTone(venue.quartile, 'venue_ranks', words)} />
    {/if}
    {#if concentrated !== null}
        <Tooltip text={t('venues.conc_tip', concentrated)} focusable>
            <Tag label={t('venues.conc')} tone="violet" />
        </Tooltip>
    {/if}
    {#if venue.free}
        <Tag label={venue.free} tone={venueTone(venue.free, 'venue_costs', words)} />
    {/if}
    {#if due}
        <Tag label={due.label} glyph={t('project.card.deadline_glyph')} tone={due.tone} />
    {/if}
{/snippet}

{#snippet metaLine()}
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
{/snippet}

{#snippet wants(words: string)}
    <div class="wants">
        <FieldMarkdown text={words} />
    </div>
{/snippet}

{#snippet themes()}
    <div class="themes">
        {#each venue.themes as theme (theme)}
            <Tag label={themeWordLabel(labels, theme)} />
        {/each}
    </div>
{/snippet}

{#snippet text()}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render metaLine()}
    {#if venue.wants}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render wants(venue.wants)}
    {/if}
    {#if venue.themes.length > 0}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render themes()}
    {/if}
{/snippet}

{#snippet left()}
    {#if venue.wants}
        <RecordField label={t('venues.field_wants')}>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render wants(venue.wants)}
        </RecordField>
    {/if}
{/snippet}

{#snippet right()}
    {#if metadata.length > 0}
        <RecordField label={t('venues.field_details')}>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render metaLine()}
        </RecordField>
    {/if}
    {#if venue.themes.length > 0}
        <RecordField label={t('venues.themes_facet')}>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render themes()}
        </RecordField>
    {/if}
{/snippet}

<div class="slot" data-venue={venue.id}>
    <RecordCard
        {...card.face}
        id={venue.id}
        {cursor}
        title={venue.name}
        titleHtml={inlineMarkdown(venue.name, cardMath(venue.name), htmlMemo)}
        ring={concentrated !== null ? 'violet' : undefined}
        record={venue}
        {actions}
        {onsaid}
        {meta}
        {text}
        {left}
        {right}
        {projects}
        archival
    />
</div>

<style>
    /* The slot fills its grid cell and the record card fills the slot, so the cards of one row are
       one height and no empty cell is left under a short one. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

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
