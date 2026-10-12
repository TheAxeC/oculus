<script lang="ts">
    // Layer 3, Venues view partial. One catalogue venue, its metadata, project users, its deadline
    // changed in place and Edit in File.
    // The project list is already restricted to real users, and concentration arrives as a flag.
    //
    // A `link` is told a path of the hub from an address by the rule the collection cards use
    // (state/boards/collection.ts's hubPathsOf): a path opens through api/file under the root of
    // the hub the venue is of, in a tab of its own, and the card carries the control that selects
    // it in the Files view under that root; an address opens in a tab of the browser's own. Both
    // links the card draws, the site and the call, go through `hrefOf`, so neither is left relative
    // to the page's own address.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import CardActions, { type CardAction } from '$lib/views/shared/card/CardActions.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import { editAction } from '$lib/views/shared/card/card';
    import CrossLinks from '$lib/views/shared/links/CrossLinks.svelte';
    import InPlace from '$lib/views/shared/forms/InPlace.svelte';
    import { blockedBy, fileNameOf, openEntry } from '$lib/views/shared/forms/entry-file';
    import { inlineMarkdown } from '$lib/ui/html';
    import {
        groupProjects,
        hrefOf,
        hubPathsOf,
        type Entry,
        type IdentityFault,
        type SchemaField
    } from '$lib/state/boards/collection';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { t } from '$lib/state/shared/words/text';
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
        selectors: { archiveDead },
        source: { unsavedFile }
    } = client;

    type Props = {
        venue: Venue;
        /** Whether keyboard navigation has selected this venue. */
        cursor: boolean;
        projects: Project[];
        concentrated: boolean;
        /** The labels of `venue_themes`, which the theme tags draw in place of the word. */
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

    const groups = $derived(groupProjects(projects, archiveDead()));
    /** The hub path the venue's `link` names, or undefined for an address or no link. */
    const linkPath = $derived(hubPathsOf({ link: venue.link }).at(0));

    /**
     * The card's controls, drawn while the card is hovered or holds the focus: Show in Files for a
     * link that is a hub path, and Edit in File for a venue the collection file holds.
     */
    const actions = $derived.by((): CardAction[] => {
        const rows: CardAction[] = [];
        const path = linkPath;
        if (path !== undefined) {
            rows.push({
                id: `files:${path}`,
                label: t('venues.show_in_files'),
                title: t('venues.show_in_files_tip', path),
                glyph: 'show_in_files',
                onclick: () => {
                    showInFiles(path, rootOf(venue, client.fs.primary()));
                }
            });
        }
        if (entry !== null && schema !== undefined) {
            rows.push(
                editAction(fileNameOf(file), () =>
                    openEntry(client, file, entry, schema, fault, onsaid)
                )
            );
        }
        return rows;
    });
    /** Why the deadline cannot be written, or '' when it can. */
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );
    const deadline = $derived(schema?.find((one) => one.field === 'deadline'));

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
            venue.link
                ? {
                      label: t('venues.site'),
                      glyph: 'launch',
                      href: hrefOf(linkPath ?? venue.link, rootOf(venue, client.fs.primary())),
                      external: true
                  }
                : null,
            venue.call
                ? {
                      label: t('venues.call'),
                      glyph: 'paper',
                      href: hrefOf(venue.call, rootOf(venue, client.fs.primary())),
                      external: true
                  }
                : null,
            venue.email
                ? { label: t('venues.contact'), glyph: 'email', href: `mailto:${venue.email}` }
                : null
        ].filter((item) => item !== null)
    );
</script>

<div class="slot" class:concentrated data-venue={venue.id}>
    <Card id={venue.id} {cursor} title={venue.name} titleHtml={inlineMarkdown(venue.name)}>
        {#snippet meta()}
            <RootChip record={venue} />
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
            {#if actions.length > 0}
                <CardActions {actions} />
            {/if}
        {/snippet}

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
                        {item.label}
                    </span>
                {/if}
            {/each}
        </div>

        {#if venue.wants}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
            <p class="wants">{@html inlineMarkdown(venue.wants)}</p>
        {/if}

        {#if groups.length > 0}
            <div class="users">
                <span class="label">{t('collection.related')}</span>
                <CrossLinks {groups} />
            </div>
        {/if}

        {#if venue.themes.length > 0}
            <div class="themes">
                {#each venue.themes as theme (theme)}
                    <Tag label={themeWordLabel(labels, theme)} />
                {/each}
            </div>
        {/if}

        {#if entry?.fields.deadline !== undefined}
            <div class="deadline">
                <span class="label">{deadline?.label ?? t('venues.deadline')}</span>
                <InPlace field="deadline" collection="venues" {entry} {schema} {blocked} {onsaid} />
            </div>
        {/if}
    </Card>
</div>

<style>
    /* The concentration mark is the card's own border in its hue, drawn inside so a marked card and
       an unmarked one are the same size. */
    .slot.concentrated :global(.card) {
        border-color: var(--c-violet);
        box-shadow: inset 0 0 0 1px var(--c-violet);
    }

    .meta,
    .users,
    .deadline,
    .themes {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .meta,
    .users,
    .deadline,
    .themes,
    .wants {
        margin-top: 8px;
    }

    .meta,
    .users,
    .deadline {
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

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
    }
</style>
