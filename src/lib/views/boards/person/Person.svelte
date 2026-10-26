<script module lang="ts">
    // Layer 3, view registration. A person opens from a tag of a project card's team, a joint-work
    // entry and the Map's node, and is not listed in the view catalogue: opened bare it can only
    // report that it was opened for nobody.
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
    // `person:` is this key, the projects of whose team they are (whose `lead:`, `collaborators:`
    // or `supervisors:` name them), the projects whose `waiting-on:` names them, and a student's
    // supervision folder.
    // Below the joins is the editor of the person's registry entry, built from the people file's
    // own `schema:`, and Delete, which asks first and names every project and joint-work entry that
    // refers to the person.
    //
    // One instance per person, and the person it is for is the `key` in its instance state, the way
    // the project tab reads its own `id`.
    //
    // The fact strip's values (the organisations, the role, the ORCID, the email and the links) are
    // drawn through ui/display/text/LinkedText.svelte, so a web address among them is a link.
    //
    // The folder block is views/shared/links/FolderFiles.svelte, which lists the folder through the
    // file store rather than carrying it in the snapshot and opens a file in the source tab exactly
    // as a file browser row does; the entry page draws it for the folder an entry's link names.
    //
    // A person of the primary hub has a "this is me" button, pressed on the person the workspace
    // setting `self` names; pressing it on another person writes that person's key to `self`
    // through the Settings write path (state/workbench/ui.svelte.ts, `setSelf`). A person of
    // another hub has none, since the setting names a person of the primary hub.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import DeleteAsk from '../../shared/forms/entry/DeleteAsk.svelte';
    import EntryEditor from '../../shared/forms/entry/edit/EntryEditor.svelte';
    import { pageFault, pageFile } from '../../shared/forms/entry/edit/page-file';
    import { blockedBy } from '../../shared/forms/entry-file';
    import FolderFiles from '../../shared/links/FolderFiles.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import { hubPathsOf } from '$lib/state/boards/collection';
    import { personJoin, type PersonJoin } from '$lib/state/boards/person';
    import { optionalText } from '$lib/data/shapes/shapes';
    import { recordState, stateRecord } from '$lib/state/shared/page/records';
    import { t } from '$lib/state/shared/words/text';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import { addressOfId, bareId, fileUnder, keyOf, rootOf } from '$lib/state/shared/page/hubs';
    import RootChip from '../../shared/card/RootChip.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        fs: { primary, roots },
        layout: { openView },
        pages: { pageOf },
        selectors: { configMap, flaggedCollections, registryKey },
        source: { unsavedFile },
        ui: { setSelf }
    } = client;

    let { instance }: ViewProps = $props();

    /** The person this instance was opened for, from the state the tag handed openView. */
    const key = $derived(stateRecord(instance.state));
    const join = $derived(personJoin(portfolio(), key));
    /** The key the person's hub gives the people registry, which the page and Delete name. */
    const people = $derived(registryKey('people', addressOfId(key).hub));
    /** The person's registry entry as the editor sees it. */
    const page = $derived(key === '' ? null : pageOf(people, key));
    const editFile = $derived(page === null ? null : pageFile(client, page));
    const fault = $derived(page === null ? undefined : pageFault(client, page));
    /** Why Delete is disabled: unsaved text of the people file, or an identity no write names. */
    const blocked = $derived(
        blockedBy(editFile, editFile !== null && unsavedFile(editFile.root, editFile.path), fault)
    );
    /** True while the question before a delete is open. */
    let deleting = $state(false);
    /** What the delete answered, when the write was refused. */
    let said = $state('');
    const folder = $derived(join.folder);
    /** The folder as a path of the hub, or nothing for one outside it. */
    const folderPath = $derived(hubPathsOf({ folder }).at(0));
    /** The key of the hub the person is of. */
    const hub = $derived(rootOf(join.person ?? {}));
    /**
     * The people file the person is read from: the configuration's for the primary hub, and for a
     * person of another hub that hub's own file, under the root the hub is served under.
     */
    const source = $derived(
        join.person?.file !== undefined && hub !== primary()
            ? fileUnder(join.person.file, roots(), primary())
            : viewSourceFile('people', configMap(), primary())
    );

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

    /**
     * The words on the tab and in the header: the person's name as the page holds it, a saved name
     * included before the snapshot shows it, their key until it is known.
     */
    const title = $derived(page?.title ?? (join.person === null ? keyOf(key) : join.person.name));

    /**
     * Whether this person is the user, the one the workspace setting `self` names: the flag of the
     * published portfolio, so a write on its way shows the state before it until the portfolio
     * that carries it arrives.
     */
    const isSelf = $derived(join.person?.self === true);

    /**
     * Make this person the user by writing their key to `self` through the Settings write path; on
     * the person already marked nothing is written, and clearing the setting is the Settings row's.
     */
    function markSelf(): void {
        const person = join.person;
        if (person === null || hub !== primary() || isSelf) return;
        setSelf(keyOf(person.id));
    }

    /** Open one project of this person as its own tab, the tab a board card opens. */
    function openProject(id: string, label: string): void {
        openView('project', recordState(id, label));
    }

    /**
     * Open the joint-work collection, where the entries drawn here are edited: the collection
     * flagged `joint_work` of the person's hub, else the first hub's.
     */
    function openJointWork(): void {
        const held = flaggedCollections('joint_work');
        const own = held.find((one) => rootOf(one) === hub) ?? held.at(0);
        if (own !== undefined) openView(bareId(own));
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
            {#if page !== null}
                <ToolButton
                    bare
                    label={t('entry_form.delete')}
                    glyph={t('entry_form.delete_glyph')}
                    title={blocked === '' ? t('person.delete_tip', page.title) : blocked}
                    disabled={blocked !== ''}
                    onclick={() => (deleting = true)}
                />
            {/if}
            {#if source !== null}
                <SourceButton file={source} />
            {/if}
        </Toolbar>
    {/snippet}

    {#if join.person === null}
        <Empty
            message={key === '' ? t('person.nobody') : t('person.unknown', keyOf(key))}
            glyph="warn"
        />
    {:else}
        <div class="person" data-person={join.person.id}>
            {#if hub !== primary()}
                <p class="self">
                    <RootChip record={join.person} />
                </p>
            {:else}
                <p class="self">
                    <ToolButton
                        label={t('person.self')}
                        glyph="star"
                        pressed={isSelf}
                        active={isSelf}
                        title={isSelf
                            ? t('person.self_held_tip', title)
                            : t('person.self_tip', title, keyOf(join.person.id))}
                        onclick={markSelf}
                    />
                </p>
            {/if}

            {#if facts.length > 0}
                <dl class="facts">
                    {#each facts as fact (fact.label + fact.value)}
                        <dt>{fact.label}</dt>
                        <dd><LinkedText text={fact.value} /></dd>
                    {/each}
                </dl>
            {/if}

            <section class="block" data-block="joint-work">
                <h3>{t('person.joint_work')}</h3>
                {#if join.jointWork.length === 0}
                    <Empty message={t('person.no_joint_work')} />
                {:else}
                    <ul class="rows">
                        {#each jointWork as { entry, status } (`${entry.file}:${entry.index}`)}
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

            <section class="block" data-block="waiting-on">
                <h3>{t('person.waiting_on')}</h3>
                {#if join.waitingOn.length === 0}
                    <Empty message={t('person.no_waiting_on')} />
                {:else}
                    <ul class="rows">
                        {#each join.waitingOn as project (project.id)}
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
                    <FolderFiles folder={folderPath} root={hub}>
                        {#snippet heading()}
                            <h3>{t('person.folder', folder)}</h3>
                        {/snippet}
                    </FolderFiles>
                </section>
            {/if}

            {#if said !== ''}
                <p class="self">{said}</p>
            {/if}
            {#if page !== null}
                <section class="block" data-block="editor">
                    <h3>{t('person.editor')}</h3>
                    <EntryEditor {page} instance={instance.id} file={editFile} {fault} />
                </section>
            {/if}
        </div>
    {/if}
</Pane>

{#if deleting && page !== null}
    <DeleteAsk
        collection={people}
        id={key}
        onsaid={(answer: string) => (said = answer)}
        onclose={() => (deleting = false)}
    />
{/if}

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

    [data-block='folder'] h3 {
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
