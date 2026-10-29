// Layer 3, view helper of views/shared/forms/entry/AddAsk.svelte. What each Add asks and does: a
// collection's Add asks the fields `askFields` gives (state/forms/new-entry.ts: the file's primary
// key, the fields its schema marks required, and its `lead`, `supervisors` and `collaborators`); a
// lead's asks its title; a Lit Watch paper's asks its title, its address and its bucket;
// Literature's asks a DOI or an address. Each writes the entry and opens its page, which names the
// entry by its hub and its key and where the editor fills the rest; a refusal comes back as the
// server's sentence for the box to show above what was typed.
//
// A collection's Add asks each field by its type, its choices those of the hub the box opens on
// (`fieldChoices`): a `select` as a pick of its options or its `foreign_key`'s entries or words,
// with an empty choice; a `tags` field with a `foreign_key` or options as a multi-pick of them, a
// people field offering the hub's people; a field of any other type with a `foreign_key` as a pick;
// every other field as a typed line. A pick or a multi-pick with no choice in that hub (Lead in a
// hub with no people collection) is a typed line, a multi-pick's split on commas, so the Add stays
// possible. Lead starts with the user picked where the choices hold the user's key in its own hub.
// A field the schema marks `required: true` is required in the box, a typed line among them, so
// the yes stays off until each holds an answer; a field required under a condition is asked as an
// optional one, the box not checking the condition. The body holds a pick as its id, a multi-pick
// as its list of ids and a typed line trimmed, and leaves out a field that is not required and is
// left empty, so the file gets what was asked and nothing else.
//
// A collection's Add, Literature's Add and Lit Watch's Add write to a hub that could take the
// entry, by the rule every path that makes a record reads (`hubsTaking` and `chosenHub` of
// state/shared/page/hubs.ts): when more than one hub holds the collection, the box asks which, the
// primary first and chosen when it is among them, and none chosen otherwise, the Add off until one
// is picked; when one hub holds it, the entry goes to that hub, primary or not, and nothing is
// asked. A collection's Add answered with a hub other than the one whose choices it offered writes
// nothing and hands back the Add of the hub answered, its typed lines carried over and its picks
// asked again, so a key is written only to the hub whose choices offered it.
//
// Literature's Add looks a DOI, an arXiv paper or a PubMed paper up through the sources the
// Literature search asks (state/feeds/literature/lookup.ts) and saves the paper they merge into;
// any other address is saved as an entry of its address, and an identifier no source found as the
// address its `links` row of the primary hub makes, or as typed with no such row. An empty answer
// turns the box into the collection's own Add, which asks the key.
//
// A journal browser hit's Add is the venues registry's own Add, its typed lines starting from the
// hit's fields, and it writes the hit's name, ISSNs, fee and open-access status into the entry.

import type { PromptField } from '$lib/ui/forms/prompt';
import type { BrowserHit } from '$lib/state/sources/registries/browser';
import type { ClientState } from '$lib/state/client/context';
import { primaryKeyOf, type Collection, type SchemaField } from '$lib/state/boards/collection';
import { pageView } from '$lib/state/forms/page-entry';
import { formFieldsOf } from '$lib/state/forms/record-fields';
import { selectChoices, type Choice } from '$lib/state/forms/schema';
import {
    addressOfId,
    bareId,
    chosenHub,
    hubsTaking,
    keyOf,
    rootOf,
    type RegistryWord
} from '$lib/state/shared/page/hubs';
import { askFields } from '$lib/state/forms/new-entry';
import { radarBuckets } from '$lib/state/feeds/radar';
import { vocabOf } from '$lib/state/shared/words/tones';
import { lookUp, lookupOf, sourcesAsked } from '$lib/state/feeds/literature/lookup';
import { hitPaper } from '$lib/state/feeds/literature/saved';
import { orderOf } from '$lib/state/feeds/literature/merge';
import { t } from '$lib/state/shared/words/text';
import { refusalWords } from '../answer-words';

/** What an Add box asks, and what its yes does with the typed values and the picks. */
export type Ask = {
    message: string;
    fields: PromptField[];
    /**
     * Write the entry from each field's text (`values`) and each field's picks (`picked`, a
     * multi-pick's ids by the field's place, none for an Add that asks no multi-pick): the
     * sentence of a refusal, the empty text once the page is open, or another Add for the box to
     * ask in its place.
     */
    submit: (values: string[], picked?: string[][]) => Promise<string | Ask>;
};

/**
 * How a collection's Add asks one field: a typed line, a pick of one choice, a multi-pick, or a
 * typed line read as a list split on commas, which a multi-pick is in a hub that offers it no
 * choice.
 */
type AskedAs = 'line' | 'pick' | 'multi' | 'list';

/** What separates the keys of a typed list. */
const LIST_SEPARATOR = ',';

/** One field a collection's Add asks: the schema's field, how it is asked, and the box's field. */
type Question = { field: SchemaField; as: AskedAs; prompt: PromptField };

/** The field whose box starts with the user picked. */
const USER_FIELD = 'lead';

/**
 * The key Lead starts with: the key of the first of the user's ids (`self`) that the choices hold
 * as the user's own record, its key and its hub alike, a choice with no hub being of the hub the
 * box opens on (`hub`); none when no choice is the user's, so the box never starts with a key that
 * would name another person.
 */
function userPicked(self: ReadonlySet<string>, choices: readonly Choice[], hub: string): string[] {
    for (const id of self) {
        const address = addressOfId(id);
        const held = choices.some(
            (one) => one.id === address.key && (one.hub ?? hub) === address.hub
        );
        if (held) return [address.key];
    }
    return [];
}

/**
 * How the Add asks one schema field in the hub `hub`, its choices read there: a select as a pick,
 * a tags field with a `foreign_key` or options as a multi-pick, any other field with a
 * `foreign_key` as a pick, each a typed line where the hub offers no choice; every other field a
 * typed line, starting from `typed` (what was typed in it in another hub's box). Each is required
 * in the box, a typed line or a list included, when the schema marks it `required: true`.
 */
function questionOf(client: ClientState, one: SchemaField, hub: string, typed = ''): Question {
    const label = one.label ?? one.field;
    const required = one.required === true;
    const [form] = formFieldsOf([one], {});
    const keyed = form.foreign_key !== undefined;
    const multi = one.type === 'tags' && (keyed || (one.options ?? []).length > 0);
    const single = !multi && (one.type === 'select' || keyed);
    const line: PromptField = required
        ? { label, value: typed, required }
        : { label, value: typed };
    if (!multi && !single) return { field: one, as: 'line', prompt: line };
    const choices = client.selectors.fieldChoices(form, null, hub === '' ? undefined : hub);
    if (choices.length === 0) {
        return multi
            ? { field: one, as: 'list', prompt: { ...line, split: LIST_SEPARATOR } }
            : { field: one, as: 'line', prompt: line };
    }
    if (multi) {
        const picked =
            one.field === USER_FIELD ? userPicked(client.selectors.selfPeople(), choices, hub) : [];
        return { field: one, as: 'multi', prompt: { label, value: '', choices, picked, required } };
    }
    const prompt: PromptField = {
        label,
        value: '',
        choices: selectChoices(choices),
        empty: t('editor.empty_choice'),
        required
    };
    return { field: one, as: 'pick', prompt };
}

/** The value one asked field writes: a pick's id, a multi-pick's ids, a typed line trimmed. */
function answerOf(question: Question, typed: string, picks: readonly string[]): string | string[] {
    if (question.as === 'multi') return [...picks];
    if (question.as === 'list') {
        return typed
            .split(LIST_SEPARATOR)
            .map((one) => one.trim())
            .filter((one) => one !== '');
    }
    return question.as === 'pick' ? typed : typed.trim();
}

/** Whether an answer is empty: the empty text or no pick. */
function emptyAnswer(answer: string | string[]): boolean {
    return answer.length === 0;
}

/** Open the page of the entry just added, by its id in the portfolio; its tab shows its key. */
function openPage(
    client: ClientState,
    collection: string,
    id: string,
    registry?: RegistryWord
): void {
    const page = pageView(collection, id, keyOf(id), registry);
    void client.layout.openView(page.view, page.state);
}

/**
 * The question an Add asks for the hub among the hubs `names`, the primary first, each choice a
 * hub's name, which is what a write names it by: a pick the box requires, holding `chosen` when it
 * is one of them, else the primary when it is, else the empty choice, so the Add stays off until a
 * hub is picked.
 */
function hubField(client: ClientState, names: string[], chosen?: string): PromptField {
    const known = chosen !== undefined && names.includes(chosen) ? chosen : undefined;
    return {
        label: t('entry_form.add_hub'),
        value: known ?? chosenHub(names, client.fs.primary()) ?? '',
        choices: names.map((name) => ({ id: name, label: name })),
        empty: t('entry_form.add_hub_none'),
        required: true
    };
}

/**
 * Which hub an Add writes to: the question the box asks when more than one hub holds the collection
 * (`held`, each hub's, `hubField`), and the hub a box's typed values name, which is that question's
 * answer, the one hub holding the collection when there is one, and none otherwise.
 */
function hubAsk(
    client: ClientState,
    held: Collection[],
    chosen?: string
): { fields: PromptField[]; rootOf: (answer: string | undefined) => string | undefined } {
    const hubs = hubsTaking(held, client.fs.primary());
    if (hubs.length > 1) {
        return { fields: [hubField(client, hubs, chosen)], rootOf: (answer) => answer };
    }
    return { fields: [], rootOf: () => chosenHub(hubs, client.fs.primary()) };
}

/**
 * The body a collection's Add writes from what its box holds: each asked field's answer
 * (`answerOf`), a field that is not required left out while its answer is empty.
 */
function bodyOf(
    questions: readonly Question[],
    values: readonly string[],
    picked: readonly (readonly string[])[]
): Record<string, string | string[]> {
    const body: Record<string, string | string[]> = {};
    questions.forEach((question, at) => {
        const answer = answerOf(question, values[at] ?? '', picked[at] ?? []);
        if (question.field.required !== true && emptyAnswer(answer)) return;
        body[question.field.field] = answer;
    });
    return body;
}

/**
 * The Add of a collection: the fields `askFields` gives, each asked by its type (`questionOf`)
 * with the choices of the hub the box opens on, and the hub to write the entry in when more than
 * one hub holds the collection, `chosen` chosen when it is one of them, else the primary when it
 * is, else none (`hubField`). The box opens on `chosen` when it is one of them, else on the hub
 * the Add would write to, else on the primary. `held` is the collection of each hub that holds it,
 * those of the key `collection` unless given (a registry's, whose key each hub's list gives); the
 * entry is written under the key of the chosen hub's collection. Answered with a hub other than
 * the one it opened on, the Add writes nothing and answers with the Add of the hub answered, the
 * typed lines carried over by field (`typed`, by field name). `given` holds the values of fields
 * the box does not ask, written into the entry beside the answers (a journal browser hit's).
 */
export function collectionAsk(
    client: ClientState,
    collection: string,
    schema: SchemaField[] | undefined,
    title: string,
    chosen?: string,
    held: Collection[] = client.selectors.collectionsOfKey(collection),
    typed: Record<string, string> = {},
    given: Record<string, string | string[]> = {}
): Ask {
    const named = held.find((one) => one.primary_key !== undefined)?.primary_key ?? null;
    const asked = askFields(schema, schema === undefined ? named : primaryKeyOf(schema));
    const hub = hubAsk(client, held, chosen);
    const taking = hubsTaking(held, client.fs.primary());
    const first = hub.fields.at(0)?.value;
    const opened =
        chosen !== undefined && taking.includes(chosen)
            ? chosen
            : (hub.rootOf(first === '' ? undefined : first) ?? client.fs.primary() ?? '');
    const questions = asked.map((one) => questionOf(client, one, opened, typed[one.field]));
    /** The key the hub `root` names the collection by, `collection` for none. */
    const keyIn = (root: string | undefined): string => {
        const one = held.find((each) => rootOf(each) === root);
        return one === undefined ? collection : bareId(one);
    };
    return {
        message: t('entry_form.add_ask', title),
        fields: [...questions.map((one) => one.prompt), ...hub.fields],
        submit: async (values, picked = []) => {
            const root = hub.rootOf(values.at(asked.length));
            if (root !== undefined && root !== opened && taking.includes(root)) {
                const carried = Object.fromEntries(
                    questions
                        .map((one, at) => [one, values[at] ?? ''] as const)
                        .filter(([one]) => one.as === 'line' || one.as === 'list')
                        .map(([one, text]) => [one.field.field, text])
                );
                return collectionAsk(client, collection, schema, title, root, held, carried, given);
            }
            const key = keyIn(root);
            const unasked = Object.entries(given).filter(
                ([field]) => !asked.some((one) => one.field === field)
            );
            const answer = await client.writes.newEntry(
                key,
                { ...Object.fromEntries(unasked), ...bodyOf(questions, values, picked) },
                root
            );
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) {
                const into = held.find((each) => rootOf(each) === root);
                openPage(client, key, answer.id, into?.registry);
            }
            return sentence;
        }
    };
}

/** The Add of the leads feed: the title of the new lead. */
export function leadAsk(client: ClientState): Ask {
    return {
        message: t('entry_form.add_lead_ask'),
        fields: [{ label: t('entry_form.add_lead_title'), value: '' }],
        submit: async ([title]) => {
            const answer = await client.writes.addLead({ title: title.trim() });
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) openPage(client, 'leads', answer.id);
            return sentence;
        }
    };
}

/**
 * The Add of Lit Watch: the title and the address of the new paper, and its bucket, one of the
 * `radar_buckets` of the hub the paper is written to. That hub is `chosen` when it is a hub of the
 * workspace, else the one hub, else the primary; with several hubs and no primary the box first
 * asks the hub alone (`hubField`), since the buckets are that hub's, and its answer is this Add for
 * the hub picked.
 */
export function paperAsk(client: ClientState, chosen?: string): Ask {
    const roots = client.fs.roots().filter((one) => one.hub === true);
    const hubs = hubsTaking(
        roots.map((one) => one.key),
        client.fs.primary()
    );
    const home =
        chosen !== undefined && hubs.includes(chosen)
            ? chosen
            : chosenHub(hubs, client.fs.primary());
    if (home === undefined && hubs.length > 1) {
        return {
            message: t('entry_form.add_paper_ask'),
            fields: [hubField(client, hubs)],
            submit: ([picked]) => Promise.resolve(paperAsk(client, picked))
        };
    }
    const buckets = radarBuckets(vocabOf(home).radar_buckets).map((one) => ({
        id: one.key,
        label: one.label
    }));
    return {
        message: t('entry_form.add_paper_ask'),
        fields: [
            { label: t('entry_form.add_paper_title'), value: '' },
            { label: t('entry_form.add_paper_url'), value: '' },
            {
                label: t('entry_form.add_paper_bucket'),
                value: buckets.at(0)?.id ?? '',
                choices: buckets
            }
        ],
        submit: async ([title, url, bucket]) => {
            const fields = { title: title.trim(), url: url.trim(), bucket };
            const answer = await client.writes.addRadarEntry(fields, home);
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) openPage(client, 'radar', answer.id);
            return sentence;
        }
    };
}

/**
 * The Add of a journal browser's hit to the venues registry: the collection's Add of `held` under
 * the key `collection` (collectionAsk), its typed lines starting from the hit's fields, and the
 * entry written with the hit's `name`, `issn`, `fee` and `open_access`, each field the hit does not
 * hold left out, so a hit with no ISSN makes an entry with no `issn`. `chosen` is the hub of the
 * browser the hit came from, chosen when more than one hub holds the registry.
 */
export function browserHitAsk(
    client: ClientState,
    hit: BrowserHit,
    collection: string,
    schema: SchemaField[] | undefined,
    title: string,
    held: Collection[],
    chosen?: string
): Ask {
    const given: Record<string, string | string[]> = {};
    if (hit.title !== undefined) given.name = hit.title;
    if (hit.issn.length > 0) given.issn = hit.issn;
    if (hit.fee !== undefined) given.fee = hit.fee;
    if (hit.open_access !== undefined) given.open_access = hit.open_access;
    const typed = Object.fromEntries(
        Object.entries(given).map(([field, value]) => [
            field,
            Array.isArray(value) ? value.join(`${LIST_SEPARATOR} `) : value
        ])
    );
    return collectionAsk(client, collection, schema, title, chosen, held, typed, given);
}

/**
 * The Add of the Literature collection, the one whose entry names the `literature` registry: one
 * value, a DOI or an address, and the hub to save it in when more than one hub holds such a
 * collection, the primary chosen when it is among them and none otherwise. `plain` is the
 * collection's own Add, which an empty answer turns the box into, given the hub chosen in this box.
 * `held` is the collection of each hub the paper may be saved in, every hub's whose entry names the
 * registry unless given (a joined view's, whose hubs' entries of its key name it). The saved
 * paper's page opens under its hub's key of the registry.
 */
export function literatureAsk(
    client: ClientState,
    plain: (chosen?: string) => Ask,
    held: Collection[] = client.selectors.registryCollections('literature')
): Ask {
    const hub = hubAsk(client, held);
    return {
        message: t('entry_form.add_literature_ask'),
        fields: [{ label: t('entry_form.add_literature_value'), value: '' }, ...hub.fields],
        submit: async ([typed, chosen]) => {
            const text = typed.trim();
            if (text === '') return plain(chosen);
            const order = orderOf(client.entities.config()?.config ?? {});
            const lookup = lookupOf(text, order.links);
            let paper: Record<string, unknown> = { url: text };
            if (lookup !== null) {
                const token = client.writes.writeToken();
                const found = await lookUp(lookup, await sourcesAsked(token), order, { token });
                if ('failed' in found) {
                    return t('entry_form.add_literature_failed', found.failed.join(', '));
                }
                if ('paper' in found) paper = hitPaper(found.paper);
                else if (lookup.by === 'doi') paper = { doi: lookup.id };
                else paper = { url: lookup.url ?? text };
            }
            const answer = await client.writes.saveLiterature('hand', paper, hub.rootOf(chosen));
            const sentence = refusalWords(answer);
            if (sentence === '' && answer.id !== undefined) {
                const into = addressOfId(answer.id).hub;
                const key = client.selectors.registryKey('literature', into);
                openPage(client, key, answer.id);
            }
            return sentence;
        }
    };
}
