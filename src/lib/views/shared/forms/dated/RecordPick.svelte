<script lang="ts">
    // Layer 3, view partial under views/shared/. The form that adds a follow-up or a subtask to a
    // record picked from two dropdowns, or changes its deadline: the kind of record, then the
    // record, then the add form (DatedForm.svelte). Quick add on Focus draws it
    // (views/boards/focus/QuickAdd.svelte), and so does an inbox thread's card, whose Follow-up and
    // Subtask write to a record of the hubs since a thread is no record of one
    // (views/feeds/inbox/InboxCard.svelte), "What" then starting with the thread's subject.
    //
    // The kinds are Project first, then each collection of the workspace's hubs whose file has a
    // schema, each key once, by the words its view carries in the view catalogue: the view
    // registered under the collection's key, else the view of the registry the collection is, else
    // the file's title. A deadline is offered for Project and for a collection whose schema has a
    // `deadline` field only. The records of Project are the live projects the part that draws it
    // hands it; the records of a collection are its entries in every hub, by their display title,
    // sorted by it. Two records with the same words carry their primary key after them, and with
    // more than one hub each record carries its hub's name after it. A kind with no record leaves
    // the record dropdown empty and Save disabled.
    //
    // A follow-up is added with its "Not before" date, a subtask with its deadline, each with the
    // people picked (the people of the record's hub first), and a deadline is written to the
    // project's manifest or to the entry, an emptied box clearing it. The answer is said through
    // `onsaid`, and the form closes on a write that changed a file.

    import Select from '$lib/ui/forms/choice/Select.svelte';
    import DatedForm from './DatedForm.svelte';
    import type { DatedKind } from '../../card/record/record-menu';
    import { answerWords } from '../answer-words';
    import { labelOf, type Project } from '$lib/state/boards/focus';
    import type { Collection } from '$lib/state/boards/collection';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import type { LinePeopleFields } from '$lib/state/shared/stores/shapes';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { REGISTRY_VIEWS, bareId, keyOf, rootOf } from '$lib/state/shared/page/hubs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        entities: { portfolio },
        fs: { roots },
        writes: { addFollowup, addSubtask, writeEntry, writeManifest }
    } = client;

    type Props = {
        kind: DatedKind;
        /** The text a new line starts with: the subject of the thread it comes from, or none. */
        text?: string;
        /** The projects the form may write to: the live ones. */
        projects: Project[];
        /** Say what a write answered. */
        onsaid: (said: string) => void;
        onclose: () => void;
    };

    let { kind, text = '', projects, onsaid, onclose }: Props = $props();

    /** The id of the kind Project, which no collection key can be, since a key holds no colon. */
    const PROJECT = ':project';

    /** One record of the record dropdown: its id, its words, its hub and the deadline it has. */
    type Row = { id: string; words: string; hub: string; deadline: string };

    /** Whether the workspace has more than one hub, which names each record's hub after it. */
    const many = $derived(roots().filter((one) => one.hub === true).length > 1);

    /** The collections with a schema, and with a `deadline` field for a deadline. */
    const collections = $derived(
        Object.values(portfolio()?.entities.collections ?? {}).filter(
            (one): one is Collection & { schema: NonNullable<Collection['schema']> } =>
                one.schema !== undefined &&
                (kind !== 'deadline' || one.schema.some((field) => field.field === 'deadline'))
        )
    );

    /** The words of a collection's kind: its view's, else its registry's view's, else its title. */
    function kindWords(collection: Collection): string {
        const key = bareId(collection);
        const registry = collection.registry;
        const own = registry === undefined ? undefined : REGISTRY_VIEWS[registry];
        const view =
            client.registry.viewFor(key) ??
            (own === undefined ? undefined : client.registry.viewFor(own));
        if (view !== undefined) return registrationLabel(view);
        return collection.title === '' ? key : collection.title;
    }

    /** Project, then each collection key once, in the order the snapshot holds them. */
    const kinds = $derived.by(() => {
        const rows = [{ id: PROJECT, label: t('focus.qa_project') }];
        for (const collection of collections) {
            const key = bareId(collection);
            if (rows.some((one) => one.id === key)) continue;
            rows.push({ id: key, label: kindWords(collection) });
        }
        return rows;
    });

    let chosen = $state(PROJECT);
    /** The kind picked, Project while the one picked is not offered. */
    const group = $derived(kinds.some((one) => one.id === chosen) ? chosen : PROJECT);

    /** The text a field holds, for the deadline a deadline form starts with. */
    function fieldText(value: unknown): string {
        return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
    }

    /** The records of the kind picked, sorted by their words. */
    const rows = $derived.by((): Row[] => {
        const found: Row[] =
            group === PROJECT
                ? projects.map((one) => ({
                      id: one.id,
                      words: labelOf(one),
                      hub: rootOf(one),
                      deadline: one.deadline ?? ''
                  }))
                : collections
                      .filter((one) => bareId(one) === group)
                      .flatMap((one) =>
                          one.entries.map((entry) => ({
                              id: entry.id,
                              words: entry.title === '' ? keyOf(entry.id) : entry.title,
                              hub: rootOf(entry),
                              deadline: fieldText(entry.fields.deadline)
                          }))
                      );
        return found.sort((a, b) => (a.words < b.words ? -1 : a.words > b.words ? 1 : 0));
    });

    /** A record's words in the dropdown: its key after words another record shares, its hub. */
    function named(row: Row): string {
        const shared = rows.filter((one) => one.words === row.words).length > 1;
        const words = shared ? t('focus.qa_named', row.words, keyOf(row.id)) : row.words;
        return many ? t('focus.qa_named', words, row.hub) : words;
    }

    const choices = $derived(rows.map((row) => ({ id: row.id, label: named(row) })));

    let picked = $state('');
    /** The record picked, the first while the one picked is not among the records. */
    const row = $derived(rows.find((one) => one.id === picked) ?? rows.at(0));

    /** The type of the deadline field of the kind picked: a project's is a date. */
    const type = $derived.by((): 'date' | 'text' => {
        if (group === PROJECT) return 'date';
        const field = collections
            .find((one) => bareId(one) === group)
            ?.schema.find((one) => one.field === 'deadline');
        return field === undefined || field.type === 'date' ? 'date' : 'text';
    });

    /** Write what the form holds to the record picked, a new line with the people it names. */
    async function save(
        words: string,
        date: string,
        people: LinePeopleFields
    ): Promise<WriteAnswer> {
        const target = row;
        if (target === undefined)
            return { ok: false, error: t('focus.qa_no_record'), changed: [], refused: [] };
        const at = group === PROJECT ? { id: target.id } : { id: target.id, collection: group };
        if (kind === 'subtask') {
            return addSubtask(at, {
                do: words,
                ...(date === '' ? {} : { deadline: date }),
                ...people
            });
        }
        if (kind === 'followup') {
            return addFollowup(at, {
                do: words,
                ...(date === '' ? {} : { after: date }),
                ...people
            });
        }
        const value = date === '' ? null : date;
        return group === PROJECT
            ? writeManifest(target.id, { deadline: value })
            : writeEntry(group, target.id, { deadline: value });
    }

    /** Say the answer, and close on a write that changed a file. */
    function answered(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
        if (answer.ok && answer.changed.length > 0) onclose();
    }
</script>

<div class="pick">
    <Select
        value={group}
        label={t('focus.qa_kind')}
        choices={kinds}
        onchange={(next: string) => (chosen = next)}
    />
    <Select
        value={row?.id ?? ''}
        label={t('focus.qa_record')}
        {choices}
        onchange={(next: string) => (picked = next)}
    />
</div>
{#key kind === 'deadline' ? `${group}|${row?.id ?? ''}` : kind}
    <DatedForm
        {kind}
        record={`${group}|${row?.id ?? ''}`}
        {text}
        held={row?.deadline ?? ''}
        {type}
        root={row?.hub ?? ''}
        blocked={row === undefined ? t('focus.qa_no_record') : ''}
        {save}
        onanswer={answered}
        oncancel={onclose}
    />
{/key}

<style>
    .pick {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
    }
</style>
