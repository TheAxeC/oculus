<script module lang="ts">
    // Layer 3, view registration. A person opens from a tag of a project card's team, a field of an
    // entry that names a person, the Map's node and a card of the People view, and is not listed in
    // the view catalogue: opened bare it can only report that it was opened for nobody.
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
    // Layer 3, view. One human as their own tab, in the frame of every record's page
    // (views/shared/card/record/RecordPage.svelte), drawn from the joins state/boards/person.ts
    // makes: the person's card, the row of count buttons under it, and a student's supervision
    // folder.
    //
    // The row (views/shared/card/record/RecordCounts.svelte) counts the projects of whose team the
    // person is (whose `lead:`, `collaborators:` or `supervisors:` name them) by row of
    // `categories:`, then their total, then "<n> waiting on <name>" for the projects whose
    // `waiting-on:` names them, when there are any; a press opens a board of those projects. A
    // person with no project and none waiting on them draws no row.
    //
    // The card is views/shared/forms/entry/card/EntryCard.svelte, the card the People view draws,
    // with `page` on: its fields in two columns under the closed card, and no strip of role rows,
    // since the row counts those projects. The page holds no form: Edit opens the editor beside it
    // (views/boards/editor/Editor.svelte). Delete, in the toolbar, asks first and names every
    // project that refers to the person. A person of a people file with no schema, which the page
    // tells by `page.schema`, has a line saying so over the card and no Edit, Delete or Status, as
    // the page of any entry of such a file.
    //
    // One instance per person, and the person it is for is the `key` in its instance state, the way
    // the project tab reads its own `id`.
    //
    // The folder block is views/shared/links/FolderFiles.svelte, which lists the folder through the
    // file store rather than carrying it in the snapshot and opens a file in the source tab exactly
    // as a file browser row does; the entry page draws it for the folder an entry's link names. It
    // is drawn under its small label (views/shared/card/record/RecordField.svelte) with the
    // folder's controls beside the label, and does not fold.
    //
    // A person of any hub has a "this is me" button in the toolbar, pressed on the person the key
    // `self` of the primary hub's `.oculus/local.yml` names; pressing it on another person writes
    // that person's key there (state/workbench/ui.svelte.ts, `setSelf`). The key is read from the
    // primary hub, so the button is drawn disabled, with a tip that says why, on a person whose key
    // names another person first or names nobody, and in a workspace with no primary hub
    // (state/boards/person.ts, `selfStanding`). A person of another hub has the chip of their hub
    // beside it.

    import type { Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import DeleteAsk from '../../shared/forms/entry/DeleteAsk.svelte';
    import EntryCard from '../../shared/forms/entry/card/EntryCard.svelte';
    import { pageFault, pageFile } from '../../shared/forms/entry/edit/page-file';
    import { blockedBy } from '../../shared/forms/entry-file';
    import FolderFiles from '../../shared/links/FolderFiles.svelte';
    import SourceButton from '../../shared/links/SourceButton.svelte';
    import RecordField from '../../shared/card/record/RecordField.svelte';
    import RecordPage from '../../shared/card/record/RecordPage.svelte';
    import { entryById, hubPathsOf, identityFaults } from '$lib/state/boards/collection';
    import { personJoin, selfStanding } from '$lib/state/boards/person';
    import { recordRow } from '$lib/state/boards/record-board';
    import { stateRecord } from '$lib/state/shared/page/records';
    import { t } from '$lib/state/shared/words/text';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import { viewSourceFile } from '$lib/state/sessions/view-source';
    import { addressOfId, fileUnder, keyOf, rootOf } from '$lib/state/shared/page/hubs';
    import RootChip from '../../shared/card/RootChip.svelte';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        fs: { primary, roots },
        pages: { pageOf },
        selectors: { collectionsOfKey, configMap, projects, registryKey },
        source: { unsavedFile },
        ui: { setSelf }
    } = client;

    let { instance }: ViewProps = $props();

    /** The person this instance was opened for, from the state the tag handed openView. */
    const key = $derived(stateRecord(instance.state));
    const join = $derived(personJoin(portfolio(), key));
    /** The key the person's hub gives the people registry, which the page and Delete name. */
    const people = $derived(registryKey('people', addressOfId(key).hub));
    /** The person's registry entry as the editor sees it, null while no file holds it. */
    const page = $derived(key === '' ? null : pageOf(people, key));
    const editFile = $derived(page === null ? null : pageFile(client, page));
    const fault = $derived(page === null ? undefined : pageFault(client, page));
    /** Why Delete is disabled: unsaved text of the people file, or an identity no write names. */
    const blocked = $derived(
        blockedBy(editFile, editFile !== null && unsavedFile(editFile.root, editFile.path), fault)
    );
    /** True while the question before a delete is open. */
    let deleting = $state(false);
    /** What the card's last write answered, the one outcome line this tab holds. */
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

    /** The file of the people registry that holds the person. */
    const collection = $derived(
        collectionsOfKey(people).find((one) => entryById(one, key) !== null) ?? null
    );
    /** The person's entry, with the values the page took over the snapshot's. */
    const entry = $derived.by(() => {
        const stored = entryById(collection, key);
        if (stored === null || page === null) return stored;
        return { ...stored, title: page.title, fields: page.values };
    });
    const faults = $derived(
        identityFaults(
            collection?.entries ?? [],
            collection?.primary_key ?? null,
            collection?.key_fault
        )
    );

    /**
     * The words on the tab and in the header: the person's name as the page holds it, a saved name
     * included before the snapshot shows it, their key until it is known.
     */
    const title = $derived(page?.title ?? (join.person === null ? keyOf(key) : join.person.name));

    /**
     * The row of count buttons under the card: the projects of whose team the person is, by row of
     * `categories:`, their total, and the projects waiting on them.
     */
    const row = $derived(
        join.person === null
            ? undefined
            : recordRow(
                  portfolio(),
                  { kind: 'person', id: join.person.id },
                  title,
                  configMap(),
                  vocabOf
              )
    );

    /**
     * Whether this person is the user, the one the key `self` of the primary hub's `local.yml`
     * names: the flag of the published portfolio, so a write on its way shows the state before it
     * until the portfolio that carries it arrives.
     */
    const isSelf = $derived(join.person?.self === true);

    /** What this person's button can do, from where the key resolves from the primary hub. */
    const standing = $derived(
        join.person === null ? null : selfStanding(portfolio(), join.person, primary())
    );

    /** The tip of the button: what a press writes, who is marked, or why it writes nothing. */
    const selfTip = $derived.by(() => {
        const person = join.person;
        if (person === null || standing === null) return '';
        const personKey = keyOf(person.id);
        if (standing.kind === 'no_primary') return t('person.self_no_primary_tip');
        if (standing.kind === 'named') {
            return t('person.self_named_tip', personKey, standing.name, standing.hub);
        }
        if (standing.kind === 'ambiguous') {
            return t('person.self_ambiguous_tip', personKey, standing.hubs.join(t('person.sep')));
        }
        return isSelf ? t('person.self_held_tip', title) : t('person.self_tip', title, personKey);
    });

    /**
     * Make this person the user by writing their key to `self` of the primary hub's `local.yml`;
     * on the person already marked, and on one the key does not resolve to, nothing is written, and
     * clearing the key is the Settings row's.
     */
    function markSelf(): void {
        const person = join.person;
        if (person === null || standing?.kind !== 'mark' || isSelf) return;
        setSelf(keyOf(person.id));
    }

    function say(words: string): void {
        said = words;
    }
</script>

{#snippet tools()}
    <Toolbar label={t('person.toolbar')} overflow>
        {#if join.person !== null}
            {#if hub !== primary()}
                <RootChip record={join.person} />
            {/if}
            <ToolButton
                label={t('person.self')}
                glyph="star"
                pressed={isSelf}
                active={isSelf}
                disabled={standing?.kind !== 'mark'}
                title={selfTip}
                onclick={markSelf}
            />
        {/if}
        {#if page?.schema !== undefined}
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

<RecordPage
    title={title === '' ? t('person.nobody') : title}
    {instance}
    toolbar={tools}
    {said}
    {row}
    data-person={join.person?.id}
>
    {#snippet card()}
        {#if page !== null && page.schema === undefined}
            <Empty message={t('entry.no_schema')} />
        {/if}
        {#if join.person === null}
            <Surface>
                <Empty
                    message={key === '' ? t('person.nobody') : t('person.unknown', keyOf(key))}
                    glyph="warn"
                />
            </Surface>
        {:else if entry !== null}
            <EntryCard
                {entry}
                cursor={false}
                collection={people}
                schema={page?.schema}
                projects={projects()}
                statuses={[]}
                file={source}
                fault={faults.get(entry.index)}
                onsaid={say}
                more
                page
            />
        {/if}
    {/snippet}

    {#if join.person !== null && folder !== ''}
        <FolderFiles folder={folderPath} root={hub}>
            {#snippet heading(controls: Snippet, body: Snippet)}
                <Surface>
                    <RecordField
                        data-block="folder"
                        label={t('person.folder', folder)}
                        actions={controls}
                    >
                        {@render body()}
                    </RecordField>
                </Surface>
            {/snippet}
        </FolderFiles>
    {/if}
</RecordPage>

{#if deleting && page !== null}
    <DeleteAsk collection={people} id={key} onsaid={say} onclose={() => (deleting = false)} />
{/if}
