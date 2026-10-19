// Layer 2, client state. What a new entry is made of before it is written: the fields the Add box
// of a collection asks for, and the task that `:task-add <title>` writes. Pure, so the rules are
// tested without a browser; the refusals of a value the file holds, a value that is empty and a key
// that reads as another hub's id are the server's (server/edit/writes/entries.ts), and are shown as
// it words them.

import { KEYED_FIELDS } from '../../data/helpers/files/yaml/collection-text.ts';
import { byKey, scalar, slugOf } from '../../data/helpers/guards.ts';
import { rootOf } from '../../data/helpers/hub-names.ts';
import { wordsWith } from '../../data/shapes/vocab-keys.ts';
import type { Collection, SchemaField } from '../../data/model/index.ts';
import { t } from '../shared/words/text.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import { identityField } from './record-fields.ts';

/** The collection whose entries are tasks. */
const TASKS = 'tasks';

/** The longest key a task is given, however long its title. */
const TASK_KEY_MAX = 80;

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

/** The collection Add writes to: the primary hub's, else the first hub's. */
function homeCollection(
    collections: readonly Collection[],
    primary: string | null
): Collection | null {
    if (primary === null) return collections.at(0) ?? null;
    return collections.find((one) => rootOf(one, primary) === primary) ?? null;
}

/** What `:task-add` makes of a title: the fields of the task, or why it adds nothing. */
type TaskFields = { fields: Record<string, unknown> } | { refusal: 'title' | 'key' | 'collection' };

/**
 * The task a title makes in the collection `tasks` of the hub Add writes to. The key is the title
 * as lowercase ASCII words joined by hyphens, accents taken off and cut to `TASK_KEY_MAX`; a key
 * the file holds already gets `-2`, `-3` and on, inside the same length. An empty title, a title
 * that gives no key (no ASCII letter or digit after the accents are taken off) and a workspace
 * with no tasks collection give a refusal and no fields. The task's status is the word of
 * `statuses` (config/catalogs/vocab.yml) carrying `default_task`, and none when no word does.
 */
function taskFields(
    title: string,
    collections: readonly Collection[],
    primary: string | null,
    config: Record<string, unknown>
): TaskFields {
    const words = title.trim();
    if (words === '') return { refusal: 'title' };
    const home = homeCollection(collections, primary);
    if (home?.schema === undefined) return { refusal: 'collection' };
    const identity = identityField(home.schema);
    const taken = new Set(home.entries.map((entry) => scalar(entry.fields[identity])));
    let key = slugOf(words, TASK_KEY_MAX);
    if (key === '') return { refusal: 'key' };
    for (let n = 2; taken.has(key); n += 1) {
        const suffix = `-${n}`;
        key = `${slugOf(words, TASK_KEY_MAX - suffix.length)}${suffix}`;
    }
    const status = wordsWith(config, 'statuses', 'default_task').at(0);
    return {
        fields: { [identity]: key, title: words, ...(status === undefined ? {} : { status }) }
    };
}

/** The sentence that says why a title adds no task. */
function refusalWords(refusal: 'title' | 'key' | 'collection'): string {
    if (refusal === 'title') return t('app.palette.task_add_title');
    if (refusal === 'key') return t('app.palette.task_add_key');
    return t('app.palette.task_add_collection');
}

/** What `:task-add` did: the id of the task written, or the sentence saying why it wrote none. */
export type TaskAdded =
    { id: string; label: string; said: '' } | { id: ''; label: ''; said: string };

/**
 * Add the task a title makes (`taskFields`) with `write`, which is the `new-entry` write of the
 * tasks collection. A refusal of the title, of the key or of the collection, and a refusal of the
 * write, come back as the sentence to say.
 */
export async function addTask(
    title: string,
    collections: readonly Collection[],
    primary: string | null,
    config: Record<string, unknown>,
    write: (collection: string, fields: Record<string, unknown>) => Promise<WriteAnswer>
): Promise<TaskAdded> {
    const made = taskFields(title, collections, primary, config);
    if ('refusal' in made) return { id: '', label: '', said: refusalWords(made.refusal) };
    const answer = await write(TASKS, made.fields);
    if (!answer.ok) return { id: '', label: '', said: answer.error ?? t('editor.failed', '') };
    const refused = answer.refused.map((one) => one.reason).join('; ');
    if (refused !== '' || answer.id === undefined) return { id: '', label: '', said: refused };
    return { id: answer.id, label: String(made.fields.title), said: '' };
}
