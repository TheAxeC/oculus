// Layer 1, data, pure. The facts of a project that the Present view's strip draws and that a
// slide's `{{project.<field>}}` is filled from: sixteen fields, each with the words the project
// card gives it, worked out from the project's ids, the records they name and the words of the hub
// the deck is read under. Both readers of decks make them here: the deck route's read
// (server/content/deck/read.ts) from the merged snapshot, and the snapshot build's read
// (snapshot/hubs/deck-facts.ts) from the project as the merged snapshot holds it, every reference
// resolved in its own hub and then in the other hubs of the workspace as the merge resolves it.
// The two give every field of every project the same words, and raise the same findings.
//
// The word rules the card and the strip share are here too, and the card reads them from here: a
// person by the name of their record, else the key; a pillar and a domain by their title, else the
// key; the venue by its short name, else its name; a word of a vocabulary list by its row's
// `label`, else the word; a code status by its catalog word. A reference no record answers is
// left out, as the merge leaves it out of the snapshot.

import { byKey, isMap, str } from '../helpers/guards.ts';
import type { TextCatalog } from '../helpers/finding-text.ts';
import { keyOf } from '../helpers/hub-names.ts';
import { FACT_FIELDS, type FactField, type Project, type ProjectFact } from '../model/index.ts';

/** The registries whose records a project's facts name. */
export type FactRecordKind =
    'people' | 'pillars' | 'datasets' | 'funding' | 'venues' | 'resources' | 'domains';

/** The records of one hub that a project's facts name, by kind and by their key in the hub. */
export type FactRecords = Record<FactRecordKind, Readonly<Record<string, object>>>;

/** What a project's ids are read against: the hub's records, its words and the catalog. */
export type FactWords = {
    /** The record of a registry by the id a project names it by, nothing for one it lacks. */
    record: (kind: FactRecordKind, id: string) => Record<string, unknown> | undefined;
    /** The merged config of the hub, whose `stages`, `forms`, `chips` and `tiers` give words. */
    vocab: Record<string, unknown>;
    /** The text catalog, for the code status's words and the yes word of reproduced. */
    catalog: TextCatalog;
};

/** The fields of a project its facts are read from. */
export type FactProject = Pick<
    Project,
    | 'form'
    | 'stage'
    | 'chips'
    | 'domainIds'
    | 'pillarIds'
    | 'datasetIds'
    | 'lead'
    | 'supervisors'
    | 'collaborators'
    | 'yearWritten'
    | 'venueId'
    | 'fundingIds'
    | 'resourceIds'
    | 'codeAvailability'
    | 'reproduced'
    | 'tier'
>;

/** A person's words: the name of their record, and their key for a record with no name. */
export function personWords(name: string, key: string): string {
    return name === '' ? key : name;
}

/** A pillar's or a domain's words: its title, and its key for a record with no title. */
export function titleWords(title: string | undefined, key: string): string {
    return title === undefined || title === '' ? key : title;
}

/** A venue's words: its short name, and its name for a venue with no short name. */
export function venueWords(short: string | undefined, name: string): string {
    return short !== undefined && short !== '' ? short : name;
}

/**
 * A word of a vocabulary list (`stages`, `forms`, `chips`, `tiers`) as it is drawn: the `label` of
 * its row when the row is a map holding one as text, else the word itself.
 */
export function vocabWords(row: unknown, word: string): string {
    const label = isMap(row) ? str(row.label) : undefined;
    return label ?? word;
}

/** The words of a code-deposit state, read from the catalog by `catalogText`. */
export function codeWords(status: string, catalogText: (key: string) => string): string {
    if (status === 'deposited') return catalogText('board.code_deposited');
    if (status === 'review-anon') return catalogText('board.code_anon');
    if (status === 'none') return catalogText('board.code_pending');
    return catalogText('board.code_none');
}

/** The fields whose facts carry their keys, for a hue or a glyph. */
const KEYED: ReadonlySet<FactField> = new Set(['form', 'stage', 'chips', 'domain', 'compute']);

/** One word with the key it is drawn by. */
type Word = { word: string; key: string };

/**
 * The facts of one project: each of the sixteen fields that holds a value, in the strip's order.
 * A word that comes out empty is left out, and a field left with no word is not given.
 */
export function projectFacts(project: FactProject, words: FactWords): ProjectFact[] {
    const listed = (list: string, word: string): Word => {
        const rows = words.vocab[list];
        return { word: vocabWords(isMap(rows) ? byKey(rows, word) : undefined, word), key: word };
    };
    const held = (
        kind: FactRecordKind,
        ids: readonly string[],
        word: (record: Record<string, unknown>, id: string) => Word
    ): Word[] =>
        ids.flatMap((id) => {
            const record = words.record(kind, id);
            return record === undefined ? [] : [word(record, id)];
        });
    const byId = (id: string): Word => ({ word: keyOf(id), key: id });
    const person = (record: Record<string, unknown>, id: string): Word => ({
        word: personWords(str(record.name) ?? '', keyOf(id)),
        key: id
    });
    const titled = (record: Record<string, unknown>, id: string): Word => ({
        word: titleWords(str(record.title), keyOf(id)),
        key: id
    });
    /** A word of the catalog, the key itself for a key the catalog lacks. */
    const catalogText = (key: string): string => byKey(words.catalog, key) ?? key;
    const year = project.yearWritten === undefined ? '' : String(project.yearWritten);
    const reproduced = project.reproduced;
    const status = project.codeAvailability?.status ?? '';
    const fields: Record<FactField, Word[]> = {
        form: project.form === undefined ? [] : [listed('forms', project.form)],
        stage: project.stage === undefined ? [] : [listed('stages', project.stage)],
        chips: project.chips.map((chip) => listed('chips', chip)),
        domain: held('domains', project.domainIds.slice(0, 1), titled),
        pillars: held('pillars', project.pillarIds, titled),
        datasets: held('datasets', project.datasetIds, (_, id) => byId(id)),
        lead: held('people', project.lead, person),
        supervisors: held('people', project.supervisors, person),
        collaborators: held('people', project.collaborators, person),
        year: [{ word: year, key: year }],
        venue: held(
            'venues',
            project.venueId === undefined ? [] : [project.venueId],
            (record, id) => ({
                word: venueWords(str(record.short), str(record.name) ?? ''),
                key: id
            })
        ),
        funding: held('funding', project.fundingIds, (_, id) => byId(id)),
        compute: held('resources', project.resourceIds, (record) => ({
            word: str(record.name) ?? '',
            key: str(record.kind) ?? ''
        })),
        code: status === '' ? [] : [{ word: codeWords(status, catalogText), key: status }],
        reproduced:
            reproduced === undefined
                ? []
                : [
                      {
                          word:
                              reproduced.date === undefined || reproduced.date === ''
                                  ? catalogText('board.repro_yes')
                                  : reproduced.date,
                          key: ''
                      }
                  ],
        tier: project.tier === undefined ? [] : [listed('tiers', project.tier)]
    };
    return FACT_FIELDS.flatMap((field) => {
        const kept = fields[field].filter((one) => one.word !== '');
        if (kept.length === 0) return [];
        const fact: ProjectFact = { field, words: kept.map((one) => one.word) };
        if (KEYED.has(field)) fact.keys = kept.map((one) => one.key);
        return [fact];
    });
}

/** Whether a name is one of the sixteen fields, as written. */
export function isFactField(name: string): name is FactField {
    return (FACT_FIELDS as readonly string[]).includes(name);
}
