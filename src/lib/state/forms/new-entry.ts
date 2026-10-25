// Layer 2, client state. What a new entry is made of before it is written: the fields the Add box
// of a collection asks for, the task that `:task-add <title>` writes, in the tasks collection of
// the hub chosen, or with none chosen of the first hub that could take it (`hubsTaking` of
// state/shared/page/hubs.ts: the primary when it holds tasks, else the one that does), and the
// person a person picker's Add person writes. A task and a person get their key from their words
// by one rule (`freeKey`). Pure, so the rules are tested without a browser; the refusals of a
// value the file holds and of a value that is empty are the server's
// (server/edit/writes/entries.ts), and are shown as it words them.

import { KEYED_FIELDS } from '../../data/helpers/files/yaml/collection-text.ts';
import { byKey, scalar, slugOf } from '../../data/helpers/guards.ts';
import { keyOf, rootOf } from '../../data/helpers/hub-names.ts';
import { hubsTaking } from '../shared/page/hubs.ts';
import { wordsWith, type WordsOf } from '../../data/shapes/vocab-keys.ts';
import type { Collection, SchemaField } from '../../data/model/index.ts';
import { t } from '../shared/words/text.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import { PEOPLE } from './page-entry.ts';
import { identityField } from './record-fields.ts';

/** The collection whose entries are tasks. */
const TASKS = 'tasks';

/** The longest key a task or a person is given, however long its words. */
const TASK_KEY_MAX = 80;

/** The field of the people registry that holds a person's name. */
const NAME_FIELD = 'name';

/**
 * The fields an Add box asks for when it adds to a collection: the identity field, and the field
 * the collection's registry keys its entities by when that is another (a venue: its name and its
 * id).
 */
export function askFields(collection: string, schema: SchemaField[] | undefined): SchemaField[] {
    const identity = identityField(schema);
    const keyed = byKey(KEYED_FIELDS, collection);
    const names = keyed === undefined || keyed === identity ? [identity] : [identity, keyed];
    return names.map(
        (name) => (schema ?? []).find((one) => one.field === name) ?? { field: name, type: 'text' }
    );
}

/**
 * The key `words` make that `taken` does not hold: the words as lowercase ASCII words joined by
 * hyphens, accents taken off and cut to `TASK_KEY_MAX`, and `-2`, `-3` and on, inside the same
 * length, while `taken` holds it. Words with no ASCII letter or digit after the accents are taken
 * off give the empty text, which is no key.
 */
function freeKey(words: string, taken: ReadonlySet<string>): string {
    let key = slugOf(words, TASK_KEY_MAX);
    if (key === '') return '';
    for (let n = 2; taken.has(key); n += 1) {
        const suffix = `-${n}`;
        key = `${slugOf(words, TASK_KEY_MAX - suffix.length)}${suffix}`;
    }
    return key;
}

/** The keys the entries of a collection hold in its identity field. */
function takenKeys(collection: Collection): Set<string> {
    const identity = identityField(collection.schema);
    return new Set(collection.entries.map((entry) => scalar(entry.fields[identity])));
}

/**
 * What `:task-add` makes of a title: the fields of the task and the name of the hub it is added to,
 * or why it adds nothing.
 */
type TaskFields =
    { fields: Record<string, unknown>; hub: string } | { refusal: 'title' | 'key' | 'collection' };

/**
 * The task a title makes in `home`, the collection `tasks` of the hub it is added to. The key is
 * the title as lowercase ASCII words joined by hyphens, accents taken off and cut to
 * `TASK_KEY_MAX`; a key the file holds already gets `-2`, `-3` and on, inside the same length. An
 * empty title, a title that gives no key (no ASCII letter or digit after the accents are taken off)
 * and no tasks collection give a refusal and no fields. The task's status is the word of `statuses`
 * carrying `default_task` in `config`, the words of the hub it is added to, and none when no word
 * does.
 */
function taskFields(
    title: string,
    home: Collection | undefined,
    config: Record<string, unknown>
): TaskFields {
    const words = title.trim();
    if (words === '') return { refusal: 'title' };
    if (home?.schema === undefined) return { refusal: 'collection' };
    const identity = identityField(home.schema);
    const key = freeKey(words, takenKeys(home));
    if (key === '') return { refusal: 'key' };
    const status = wordsWith(config, 'statuses', 'default_task').at(0);
    return {
        fields: { [identity]: key, title: words, ...(status === undefined ? {} : { status }) },
        hub: rootOf(home)
    };
}

/** The sentence that says why a title adds no task. */
function refusalWords(refusal: 'title' | 'key' | 'collection'): string {
    if (refusal === 'title') return t('app.palette.task_add_title');
    if (refusal === 'key') return t('app.palette.task_add_key');
    return t('app.palette.task_add_collection');
}

/**
 * The sentence that says why a title adds no task whichever hub takes it, its words or its key
 * refused, or the empty text when it makes one: what Add Task says before it asks the hub.
 */
export function taskTitleRefusal(title: string): string {
    const words = title.trim();
    if (words === '') return refusalWords('title');
    return slugOf(words, TASK_KEY_MAX) === '' ? refusalWords('key') : '';
}

/**
 * The hubs a task can be added to: the hubs of the tasks collections given, the primary first and
 * then the workspace's order (`hubsTaking`). The palette's hub list of `:task-add` reads it.
 */
export function taskHubOrder(collections: readonly Collection[], primary: string | null): string[] {
    return hubsTaking(collections, primary);
}

/**
 * What `:task-add` did: the id in the portfolio of the task written, which the write answers with,
 * or the sentence saying why it wrote none.
 */
export type TaskAdded =
    { id: string; label: string; said: '' } | { id: ''; label: ''; said: string };

/**
 * Add the task a title makes (`taskFields`) with `write`, which is the `new-entry` write of the
 * tasks collection of the hub it names. `collections` are the tasks collections of the hubs, each
 * carrying its hub's name in `root`; the task goes to the hub `hub` names, or, with none named, to
 * the first that could take it, the primary when it holds one. A refusal of the title, of the key
 * or of the collection, and a refusal of the write, come back as the sentence to say; a hub named
 * that holds no tasks collection is said by its name, and no hub holding one by the workspace.
 * The status is read in the words of that hub, given as `wordsOf`, and in `config` without it.
 */
export async function addTask(
    title: string,
    collections: readonly Collection[],
    primary: string | null,
    config: Record<string, unknown>,
    write: (
        collection: string,
        fields: Record<string, unknown>,
        root: string
    ) => Promise<WriteAnswer>,
    hub?: string,
    wordsOf?: WordsOf
): Promise<TaskAdded> {
    const chosen = hub ?? taskHubOrder(collections, primary).at(0);
    const home = collections.find((one) => rootOf(one) === chosen);
    const words = home === undefined ? config : (wordsOf?.(rootOf(home)) ?? config);
    const made = taskFields(title, home, words);
    if ('refusal' in made) {
        const said =
            made.refusal === 'collection' && hub !== undefined
                ? t('app.palette.task_hub_collection', hub)
                : refusalWords(made.refusal);
        return { id: '', label: '', said };
    }
    const answer = await write(TASKS, made.fields, made.hub);
    if (!answer.ok) return { id: '', label: '', said: answer.error ?? t('editor.failed', '') };
    const refused = answer.refused.map((one) => one.reason).join('; ');
    if (refused !== '' || answer.id === undefined) return { id: '', label: '', said: refused };
    return { id: answer.id, label: String(made.fields.title), said: '' };
}

/**
 * The words a person picker offers to add as a new person, and the empty text when it offers none:
 * the typed text trimmed, when it gives a key (`freeKey`) and is, compared without case, the name
 * or the key of no person among `people`, the field's choices with those already chosen included. A
 * partial match offers the Add as well, so a person whose name holds another's can be added.
 */
export function personToAdd(
    typed: string,
    people: readonly { id: string; label: string }[]
): string {
    const words = typed.trim();
    if (freeKey(words, new Set()) === '') return '';
    const needle = words.toLowerCase();
    const named = people.some(
        (one) => one.id.toLowerCase() === needle || one.label.toLowerCase() === needle
    );
    return named ? '' : words;
}

/**
 * What an Add person did: the key of the person written, which the field picks, or the sentence
 * saying why it wrote none.
 */
export type PersonAdded = { key: string; said: '' } | { key: ''; said: string };

/**
 * Add the person `name` names to the people registry of the hub `hub`, the hub of the record being
 * edited (the primary's, else the first hub's, when it is null), with `write`, the `new-entry`
 * write of that hub's people collection. `name` is the words `personToAdd` offered, which give a
 * key. The key is made from the name as a task's is from its title (`freeKey`), `-2` and on while
 * that registry holds it; the name is the words trimmed. A hub with no people collection and a
 * refusal of the write come back as the sentence to say.
 */
export async function addPerson(
    name: string,
    collections: readonly Collection[],
    hub: string | null,
    write: (
        collection: string,
        fields: Record<string, unknown>,
        root: string
    ) => Promise<WriteAnswer>
): Promise<PersonAdded> {
    const words = name.trim();
    const home = hub === null ? collections.at(0) : collections.find((one) => rootOf(one) === hub);
    if (home?.schema === undefined) {
        return { key: '', said: t('editor.add_person_collection') };
    }
    const key = freeKey(words, takenKeys(home));
    const fields = { [identityField(home.schema)]: key, [NAME_FIELD]: words };
    const answer = await write(PEOPLE, fields, rootOf(home));
    if (!answer.ok) return { key: '', said: answer.error ?? t('editor.failed', '') };
    const refused = answer.refused.map((one) => one.reason).join('; ');
    if (refused !== '' || answer.id === undefined) return { key: '', said: refused };
    return { key: keyOf(answer.id), said: '' };
}

/**
 * An Add person of a form that a Revert or a Discard can undo: `reverts` counts the form's Reverts
 * (or Discards), read as the write is sent and again as it answers, and an answer that comes after
 * a later one is taken as no key and no sentence, so the field stays as the Revert left it. The
 * person stays written in the registry.
 */
export function unlessReverted(
    add: (name: string) => Promise<PersonAdded>,
    reverts: () => number
): (name: string) => Promise<PersonAdded> {
    return async (name) => {
        const sent = reverts();
        const done = await add(name);
        return reverts() === sent ? done : { key: '', said: '' };
    };
}
