// Layer 2, client state. What the Career view (views/academic/career/Career.svelte) draws for the
// career file of the primary hub: the line saying the hub holds no career file, the line saying the
// file has no schema, or the groups of cards of the career record, one group per list of the file
// and one card per row. Pure, so a row's title and lines are read without a rendering. The fields
// a row's lines come from are the nested `fields:` of the group's row of the file's own `schema:`,
// so a field the schema adds is drawn with no change here. The editor of the file is
// views/boards/editor/Editor.svelte.

import { isMap } from '../../data/helpers/guards.ts';
import type { Career, SchemaField } from '../../data/model/index.ts';
import { textOrNumber } from '../../data/shapes/shapes.ts';

/** One labelled text line of a card. */
export type CareerLine = { label: string; text: string };

/** One row of a group as a card: `hidden` says the file keeps it off the CV. */
type CareerCard = { id: string; title: string; hidden: boolean; lines: CareerLine[] };

/** One list of the career file as a group of cards, named by the file's key of the list. */
type CareerGroup = { field: string; cards: CareerCard[] };

/** What the Career view draws. */
export type CareerShown =
    { state: 'none' } | { state: 'no_schema' } | { state: 'cards'; groups: CareerGroup[] };

/** The lists the view groups, in its order, each with the field that titles a card of the list. */
const GROUPS: { field: string; title: string }[] = [
    { field: 'positions', title: 'title' },
    { field: 'degrees', title: 'title' },
    { field: 'awards', title: 'award' },
    { field: 'references', title: 'person' },
    { field: 'profiles', title: '' }
];

/** The field of a reference that names a person by key. */
const PERSON_FIELD = 'person';

/** The field of a row whose value `true` keeps the row off the CV. */
const HIDE_FIELD = 'hide';

/** The types of a schema row whose value a card's line draws as text. */
const TEXT_TYPES = ['text', 'textarea', 'date', 'select'];

/** The filled text fields of a row, in the schema's order, less the one that titles the card. */
function linesOf(
    row: Record<string, unknown>,
    fields: readonly SchemaField[],
    title: string
): CareerLine[] {
    return fields.flatMap((one): CareerLine[] => {
        const text = textOrNumber(row[one.field]);
        if (one.field === title || !TEXT_TYPES.includes(one.type) || text === '') return [];
        return [{ label: one.label ?? one.field, text }];
    });
}

/** One row as a card: titled by `name`, else by its first line, which then leaves the lines. */
function cardOf(
    id: string,
    row: Record<string, unknown>,
    fields: readonly SchemaField[],
    titleField: string,
    name: string
): CareerCard {
    const lines = linesOf(row, fields, titleField);
    const hidden = row[HIDE_FIELD] === true;
    if (name !== '') return { id, title: name, hidden, lines };
    return { id, title: lines[0]?.text ?? '', hidden, lines: lines.slice(1) };
}

/** The cards of one list of the file: a list of rows, or for `profiles` a map from a name. */
function groupOf(
    group: (typeof GROUPS)[number],
    career: Career,
    schema: readonly SchemaField[],
    personName: (key: string) => string
): CareerGroup {
    const fields = schema.find((one) => one.field === group.field)?.fields ?? [];
    const held = career.sections[group.field];
    if (isMap(held)) {
        const cards = Object.entries(held).map(([name, row]) =>
            cardOf(`${group.field}:${name}`, isMap(row) ? row : {}, fields, '', name)
        );
        return { field: group.field, cards };
    }
    const rows = Array.isArray(held) ? held.filter(isMap) : [];
    const cards = rows.map((row, at) => {
        const own = textOrNumber(row[group.title]);
        const name = group.title === PERSON_FIELD && own !== '' ? personName(own) : own;
        return cardOf(`${group.field}:${at}`, row, fields, group.title, name);
    });
    return { field: group.field, cards };
}

/**
 * What the Career view draws for the career file: `personName` gives the name of the person a
 * reference names by key.
 */
export function careerShown(
    career: Career | null,
    personName: (key: string) => string
): CareerShown {
    if (career === null) return { state: 'none' };
    const schema = career.schema;
    if (schema === undefined) return { state: 'no_schema' };
    return {
        state: 'cards',
        groups: GROUPS.map((group) => groupOf(group, career, schema, personName))
    };
}
