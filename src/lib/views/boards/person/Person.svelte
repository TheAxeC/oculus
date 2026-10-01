<script module lang="ts">
    // Layer 3, view registration. A person opens from a collaborator tag, a joint-work entry and
    // the Map's node, and is not listed in the view catalogue: opened bare it can only report that
    // it was opened for nobody.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'person',
        label: 'views.person',
        glyph: 'views.person_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One human as their own tab, drawn from the five joins state/boards/person.ts
    // makes: the registry entry, the organisations they are affiliated to, the joint work whose
    // `person:` is this key, the projects whose `collaborators:` name them, and a student's
    // supervision folder.
    //
    // One instance per person, and the person it is for is the `key` in its instance state, the way
    // the project tab reads its own `id`.
    //
    // The folder is listed through the file store rather than carried in the snapshot, because the
    // snapshot holds the portfolio's YAML and not what is in a folder; a file opens in the source
    // tab exactly as a file browser row does, which is the one way a text file is opened, and the
    // block's heading carries the control that selects the folder itself in the Files view of this
    // page.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import { openSourceFile } from '../../shared/links/source-file';
    import { hubPathsOf } from '$lib/state/boards/collection';
    import { HUB_ROOT } from '$lib/state/sources/fs';
    import { fileEntries } from '$lib/state/sources/fs-transport';
    import { personJoin, type PersonJoin } from '$lib/state/boards/person';
    import { optionalText } from '$lib/data/shapes/shapes';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        fs: { listing },
        layout: { openView, showInFiles },
        selectors: { configMap }
    } = client;

    let { instance }: ViewProps = $props();

    /** The person this instance was opened for, from the state the tag handed openView. */
    const key = $derived(instanceText(instance.state, 'key'));
    const join = $derived(personJoin(portfolio(), key));
    const folder = $derived(join.folder);
    /**
     * The folder as a path of the hub, which Show in Files can select, or nothing for one outside
     * it.
     */
    const folderPath = $derived(hubPathsOf({ folder }).at(0));
    // The listing is asked for the hub path and never for the raw value, so a folder that is an
    // address or climbs above the hub asks the file route for nothing.
    const files = $derived(folderPath === undefined ? null : listing(HUB_ROOT, folderPath));
    // The block offers what a source tab can hold, so a folder inside the supervision folder is not
    // a row: opening one would ask the file route for bytes a directory has none of.
    const documents = $derived(fileEntries(files?.entries ?? []));
    const source = $derived(viewSourceFile('people', configMap()));

    /** The rows of the fact strip: what the registry holds about this person beyond their name. */
    const facts = $derived.by(() => {
        const person = join.person;
        if (person === null) return [];
        const rows: { label: string; value: string }[] = [];
        // One row per organisation, in the entry's own order, so a clinician's university and
        // hospital are both drawn and the primary one is the row above the other.
        for (const held of join.organisations) {
            rows.push({ label: t('person.organisation'), value: organisationLine(held) });
        }
        if (person.role !== undefined) rows.push({ label: t('person.role'), value: person.role });
        if (person.orcid !== undefined)
            rows.push({ label: t('person.orcid'), value: person.orcid });
        if (person.email !== undefined)
            rows.push({ label: t('person.email'), value: person.email });
        for (const link of person.links) rows.push({ label: t('person.link'), value: link });
        return rows;
    });

    /** One organisation as one line: its name, then its kind and country when it names them. */
    function organisationLine(held: PersonJoin['organisations'][number]): string {
        const parts = [held.kind, held.country].filter(
            (one): one is string => one !== undefined && one !== ''
        );
        return parts.length === 0
            ? held.name
            : t('person.organisation_line', held.name, parts.join(t('person.sep')));
    }

    /** The joint-work entries with the status each carries: its text, and nothing for any other. */
    const jointWork = $derived(
        join.jointWork.map((entry) => ({ entry, status: optionalText(entry.fields.status) }))
    );

    /** The words on the tab and in the header: the person's name, their key until it is known. */
    const title = $derived(join.person === null ? key : join.person.name);

    /** Open one project of this person as its own tab, the tab a board card opens. */
    function openProject(id: string, label: string): void {
        openView('project', { id, label });
    }

    /** Open the joint-work collection, where the entries drawn here are edited. */
    function openJointWork(): void {
        openView('joint-work');
    }

    /** Open one file of a student's supervision folder in the source tab. */
    function openFile(name: string): void {
        if (folderPath === undefined) return;
        openSourceFile(client, { root: HUB_ROOT, path: `${folderPath}/${name}` });
    }
</script>

<Pane title={title === '' ? t('person.nobody') : title} tinted>
    {#snippet toolbar()}
        <Toolbar label={t('person.toolbar')} overflow>
            {#if join.jointWork.length > 0}
                <ToolButton
                    bare
                    label={t('person.open_joint_work')}
                    glyph="collab"
                    title={t('person.open_joint_work_tip')}
                    onclick={openJointWork}
                />
            {/if}
            {#if source !== null}
                <SourceButton file={source} />
            {/if}
        </Toolbar>
    {/snippet}

    {#if join.person === null}
        <Empty message={key === '' ? t('person.nobody') : t('person.unknown', key)} glyph="warn" />
    {:else}
        <div class="person" data-person={join.person.id}>
            {#if join.person.self === true}
                <p class="self">
                    <Tag label={t('person.self')} glyph="star" tone="teal" />
                </p>
            {/if}

            {#if facts.length > 0}
                <dl class="facts">
                    {#each facts as fact (fact.label + fact.value)}
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                    {/each}
                </dl>
            {/if}

            <section class="block" data-block="joint-work">
                <h3>{t('person.joint_work')}</h3>
                {#if join.jointWork.length === 0}
                    <Empty message={t('person.no_joint_work')} />
                {:else}
                    <ul class="rows">
                        {#each jointWork as { entry, status } (entry.id)}
                            <li>
                                <span class="what">{entry.title}</span>
                                {#if status !== undefined}
                                    <Tag label={status} />
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </section>

            <section class="block" data-block="projects">
                <h3>{t('person.projects')}</h3>
                {#if join.projects.length === 0}
                    <Empty message={t('person.no_projects')} />
                {:else}
                    <ul class="rows">
                        {#each join.projects as project (project.id)}
                            <li>
                                <span class="link">
                                    <ToolButton
                                        plain
                                        cut
                                        label={project.short === undefined || project.short === ''
                                            ? project.title
                                            : project.short}
                                        title={t('person.open_project', project.title)}
                                        onclick={() => openProject(project.id, project.title)}
                                    />
                                </span>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </section>

            {#if folder !== ''}
                <section class="block" data-block="folder">
                    <div class="head">
                        <h3>{t('person.folder', folder)}</h3>
                        {#if folderPath !== undefined}
                            <ToolButton
                                label={t('person.show_in_files')}
                                title={t('person.show_in_files_tip', folderPath)}
                                glyph="show_in_files"
                                compact
                                onclick={() => {
                                    showInFiles(folderPath);
                                }}
                            />
                        {/if}
                    </div>
                    {#if files === null}
                        <Empty message={t('person.folder_outside')} glyph="warn" />
                    {:else if files.loading}
                        <Empty message={t('person.folder_loading')} />
                    {:else if files.error !== ''}
                        <Empty message={files.error} glyph="warn" />
                    {:else if documents.length === 0}
                        <Empty message={t('person.folder_empty')} />
                    {:else}
                        <ul class="rows">
                            {#each documents as entry (entry.name)}
                                <li>
                                    <span class="link">
                                        <ToolButton
                                            plain
                                            cut
                                            label={entry.name}
                                            title={t('person.open_file', entry.name)}
                                            onclick={() => openFile(entry.name)}
                                        />
                                    </span>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </section>
            {/if}
        </div>
    {/if}
</Pane>

<style>
    .person {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .self {
        margin: 0;
    }

    /* Every line of the fact strip is the tree's row height, and a longer value grows by whole
       lines. */
    .facts {
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: 12px;
        margin: 0;
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .facts dt {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .facts dd {
        margin: 0;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .block h3 {
        margin: 0 0 4px;
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    /* The folder block's heading carries the control that selects the folder in the Files view. */
    .head {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .head h3 {
        margin: 0;
    }

    .rows {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .rows li {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    .what {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    /* A project and a file open from their name, drawn as a link: the accent colour, an underline
       under the pointer and with the focus. */
    .link {
        display: inline-flex;
        min-width: 0;
        color: var(--accent-txt, var(--accent));
    }

    .link:hover,
    .link:focus-within {
        text-decoration: underline;
    }
</style>
