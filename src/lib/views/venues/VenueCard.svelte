<script lang="ts">
    // Layer 3, Venues view partial. One catalogue venue, its metadata, project users and edit form.
    // The project list is already restricted to real users, and concentration arrives as a flag.

    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/EntryForm.svelte';
    import {
        groupProjects,
        inlineMarkdown,
        type Entry,
        type SchemaField
    } from '$lib/state/collection';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';
    import { freeTone, quartileTone, type Project, type Venue } from '$lib/state/venues';

    type Props = {
        venue: Venue;
        projects: Project[];
        concentrated: boolean;
        entry: Entry | null;
        schema: SchemaField[] | undefined;
        editing: boolean;
        onedit: () => void;
        onsaid: (said: string) => void;
    };

    let { venue, projects, concentrated, entry, schema, editing, onedit, onsaid }: Props = $props();

    const groups = $derived(groupProjects(projects));
    const metadata = $derived(
        [
            venue.jif && !['none', ' - '].includes(venue.jif.toLowerCase())
                ? { label: t('col.ven_jif', venue.jif) }
                : null,
            venue.wos ? { label: t('col.ven_wos', venue.wos) } : null,
            venue.scopus ? { label: t('col.ven_scopus', venue.scopus) } : null,
            venue.format ? { label: venue.format, bold: true } : null,
            venue.timing ? { label: venue.timing, glyph: 'timing' } : null,
            venue.link
                ? { label: t('col.ven_site'), glyph: 'launch', href: venue.link, external: true }
                : null,
            venue.call
                ? { label: t('col.ven_call'), glyph: 'paper', href: venue.call, external: true }
                : null,
            venue.email
                ? { label: t('col.ven_contact'), glyph: 'email', href: `mailto:${venue.email}` }
                : null
        ].filter((item) => item !== null)
    );
</script>

<article class="card" class:concentrated data-venue={venue.id}>
    <div class="head">
        <h3>{@html inlineMarkdown(venue.name)}</h3>
        {#if venue.quartile}
            <Chip label={venue.quartile} tone={quartileTone(venue.quartile)} />
        {/if}
        {#if venue.free}
            <Chip label={venue.free} tone={freeTone(venue.free)} />
        {/if}
        {#if entry !== null && schema !== undefined}
            <ToolButton
                label={t('collection.form_edit_title')}
                glyph={t('collection.edit_glyph')}
                compact
                active={editing}
                onclick={onedit}
            />
        {/if}
    </div>

    <div class="meta">
        {#each metadata as item, at (item.label)}
            {#if at > 0}
                <span class="sep">{t('col.ven_sep')}</span>
            {/if}
            {#if item.bold}
                <strong>{item.label}</strong>
            {:else if item.href}
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
        <p class="wants">{@html inlineMarkdown(venue.wants)}</p>
    {/if}

    {#if groups.length > 0}
        <div class="users">
            <span class="label">{t('collection.related')}</span>
            {#each groups as group (group.type)}
                <Chip label={`${group.count} ${group.type}`} />
                {#each group.members as member (member.id)}
                    <ToolButton
                        label={member.label}
                        onclick={() =>
                            openView('project', 'main', {
                                id: member.id,
                                label: member.label
                            })}
                    />
                {/each}
            {/each}
        </div>
    {/if}

    {#if venue.themes.length > 0}
        <div class="themes">
            {#each venue.themes as theme (theme)}
                <Chip label={theme} />
            {/each}
        </div>
    {/if}

    {#if editing && entry !== null}
        <EntryForm collection="venues" {schema} {entry} onclose={onedit} {onsaid} />
    {/if}
</article>

<style>
    .card {
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    .card.concentrated {
        border-color: var(--c-violet);
        box-shadow: inset 0 0 0 1px var(--c-violet);
    }

    .head,
    .meta,
    .users,
    .themes {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    h3 {
        margin: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-lg);
    }

    .meta,
    .users,
    .themes,
    .wants {
        margin-top: 8px;
    }

    .meta,
    .users,
    .wants {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .meta .sep {
        color: var(--muted-txt, var(--muted));
    }

    .meta a {
        color: var(--accent-txt, var(--accent));
    }

    .wants {
        margin-bottom: 0;
    }

    .label {
        font-weight: 700;
    }

    :global(body.rice) .card {
        border-radius: var(--radius-sm);
        box-shadow: none;
    }
</style>
