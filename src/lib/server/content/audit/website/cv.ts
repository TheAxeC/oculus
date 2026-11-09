// Layer 2, server. The website's CV file and its employer CVs' file built from the hub. No field
// name, list key or word of those files or of the hub's records they are built from stands here:
// the career file's lists are the rows of the hub's `website.cv_lists`, a collection entry's CV
// fields the rows of `website.cv_entry_fields`, and every other name the word of a role of
// `website.cv_fields`, which this comment names them by. A role whose word is empty reads nothing
// and writes nothing, and while `website.cv_sections` holds a row it is one problem naming it.
//
// The CV's person block (`person_block`) is the user's people entry: its given and family names
// and its links. Its sections are the rows of the career lists, the entries of the hub's
// collections that name a CV section (`section`), each supervision entry's students (`students`),
// and the manifests that carry a CV record, each section's rows by their rank and then in the
// order they are read in. The employer CVs are the career file's profiles (`profiles`), whose rows
// name the records they stand for (`records`) and take from the first one the fields their
// section's row of `website.cv_sections` says, or the place and the period where the row says none,
// where they hold none of their own. A section's title and the person's other details are the
// website's, which its templates read from its own file.
//
// The sections are the rows of the hub's `website.cv_sections`, in the rows' order, each writing
// the fields its row names; a row naming a section the setting does not list is a problem naming
// the row and the section, and is written nowhere.
//
// A record's period (`period`) is read by the period reader of data/helpers/dates.ts, and the CV
// prints it in one form in the field the website reads (`periodText`): under the row's `period:
// timestamp` in the `timestamp` field as the timestamp the website's `to_date` parses, and
// otherwise in the `period_text` field as the period text, and there for a section no row names. A
// student's row prints the degree with the student's period, else the supervision entry's. A
// record's period that is no period, and a record with none, print no period. The words a period
// prints are the website's CV text, so they come from the hub's `website.cv_words`, each read by
// key: a period needing a word the setting does not hold prints without it and is one problem
// naming the key, however many periods need it.
//
// A record is named by its key: a collection entry's key, a manifest's folder name, a career row's
// `record_key` field. A key two records hold names neither: a row that names it takes nothing from
// either and is a problem naming the key, both places and the row.

import { z } from 'zod';
import { readPeriod, type PeriodPoint } from '../../../../data/helpers/dates.ts';
import { bareId } from '../../../../data/helpers/hub-names.ts';
import { byKey, isMap } from '../../../../data/helpers/guards.ts';
import type {
    Career,
    Collection,
    CvFieldRole,
    Id,
    Person,
    Project
} from '../../../../data/model/index.ts';
import type {
    CvEntryField,
    CvFields,
    CvList,
    CvSection,
    CvWords
} from '../../../../data/sources/config/settings/files.ts';
import type { Problem } from './site.ts';

/** What the CV and the employer CVs are built from. */
export type CvInput = {
    projects: readonly Project[];
    collections: readonly Collection[];
    people: readonly Person[];
    career: Career | null;
    self: ReadonlySet<Id>;
    /** The CV's sections, in the file's order: the rows of `website.cv_sections`. */
    cvSections: readonly CvSection[];
    /** The career file's lists of CV rows: the rows of `website.cv_lists`. */
    cvLists: readonly CvList[];
    /** The fields of a collection entry the CV takes: the rows of `website.cv_entry_fields`. */
    cvEntryFields: readonly CvEntryField[];
    /** The field each role names: `website.cv_fields`. */
    cvFields: CvFields;
    /** The words a period prints: `website.cv_words`. */
    cvWords: CvWords;
};

/** How many months a `website.cv_words.months` list holds. */
const MONTHS_IN_A_YEAR = 12;

/** A list of maps; anything else holds none. */
const rowsShape = z.array(z.unknown()).transform((all) => all.filter(isMap));

/** A field of a record by a word of the settings: an own field alone, and none for no word. */
function held(fields: Record<string, unknown>, word: string): unknown {
    return word === '' ? undefined : byKey(fields, word);
}

/** A word of the settings and the value written under it. */
type Pair = readonly [string, unknown];

/** A record of the pairs, each word an own key; no word or no value writes nothing. */
function written(pairs: readonly Pair[]): Record<string, unknown> {
    return Object.fromEntries(pairs.filter(([word, value]) => word !== '' && value !== undefined));
}

/**
 * A row read by a shape whose keys are roles of `website.cv_fields`, each field read by its role's
 * word; undefined for a row the shape refuses.
 */
function byRoles<S extends z.ZodRawShape>(
    shape: z.ZodObject<S>,
    row: unknown,
    words: CvFields
): z.output<z.ZodObject<S>> | undefined {
    if (!isMap(row)) return undefined;
    const pairs = Object.keys(shape.shape).map((role) => [
        role,
        held(row, words[role as CvFieldRole])
    ]);
    const read = shape.safeParse(Object.fromEntries(pairs));
    return read.success ? read.data : undefined;
}

/**
 * A student of a supervision entry, by role: the person, the topic, the degree the CV prints, and
 * the student's own period where it differs from the entry's.
 */
const studentShape = z.object({
    student_person: z.string(),
    student_topic: z.string().optional(),
    student_degree: z.string().optional(),
    period: z.union([z.string(), z.number()]).optional()
});

/** A student's CV text: the degree and the period, `<degree> (<period>)`, or either alone. */
function studentText(degree: string | undefined, period: string | undefined): string | undefined {
    if (degree === undefined || degree === '') return period;
    return period === undefined ? degree : `${degree} (${period})`;
}

/** The rows of a list, the maps among them; none for anything that is no list. */
function rowsOf(value: unknown): Record<string, unknown>[] {
    const read = rowsShape.safeParse(value);
    return read.success ? read.data : [];
}

/** A row of the CV being built: its section, its rank, its place among its sources, its fields. */
type Row = { section: string; rank: number; at: number; fields: Record<string, unknown> };

/**
 * A rank the source writes, a whole number or a text of one, which the entry form writes; the
 * fallback when it writes none.
 */
function rankOf(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
    return fallback;
}

/**
 * The CV fields of a collection entry: its fields as it holds them, without each one a row of
 * `website.cv_entry_fields` says `own: false` of, and the field `from` of each row, where the entry
 * holds one, written as the row's `key`.
 */
function entryFields(
    fields: Record<string, unknown>,
    rows: readonly CvEntryField[]
): Record<string, unknown> {
    const left = new Set(rows.filter((row) => row.own === false).map((row) => row.key));
    const own = Object.entries(fields).filter(([name]) => !left.has(name));
    const named = rows.filter((row) => Object.hasOwn(fields, row.from));
    return Object.fromEntries([
        ...own,
        ...named.map((row): [string, unknown] => [row.key, fields[row.from]])
    ]);
}

/**
 * The fields of a row its section prints, in the section's order, each one the source holds. A
 * name comes from the setting, so it is read on the row's own fields alone.
 */
function printed(
    fields: Record<string, unknown>,
    keys: readonly string[]
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of keys) {
        if (Object.hasOwn(fields, key) && fields[key] !== undefined) out[key] = fields[key];
    }
    return out;
}

/** The CV's builder: the people, the records by key, the rows, and the problems found. */
class Cv {
    readonly rows: Row[] = [];
    readonly problems: Problem[] = [];
    /** The field each role names. */
    readonly words: CvFields;
    /** The person blocks' names, from the user's people entry; none when it gives none. */
    names: Record<string, unknown> = {};
    /** The rows of `website.cv_sections`, by their key. */
    private readonly sections = new Map<string, CvSection>();
    /** The CV fields of every record a profile row or an award row may name, by its key. */
    private readonly records = new Map<string, Record<string, unknown>>();
    /** The places of the records each key was read at, in the order they were read in. */
    private readonly places = new Map<string, string[]>();
    private readonly people = new Map<string, Person>();
    private readonly input: CvInput;
    /** The keys of `website:` already said to lack a word, each said once per build. */
    private readonly saidWords = new Set<string>();
    private at = 0;

    constructor(input: CvInput) {
        this.input = input;
        this.words = input.cvFields;
        for (const row of input.cvSections) this.sections.set(row.key, row);
        for (const person of input.people) this.people.set(bareId(person), person);
        if (input.cvSections.length === 0) return;
        if (input.cvLists.length === 0) this.noWord('cv_lists');
        for (const [role, word] of Object.entries(input.cvFields)) {
            if (word === '') this.noWord(`cv_fields.${role}`);
        }
    }

    /** A word the setting `website.<key>` does not hold, as one problem per build. */
    private noWord(key: string): void {
        if (this.saidWords.has(key)) return;
        this.saidWords.add(key);
        this.problems.push({
            about: null,
            key: 'audit.msg_cv_no_word',
            args: [`website.${key}`]
        });
    }

    /** One end of a period as the CV prints it: its month and year, or its year alone. */
    private pointText(point: PeriodPoint): string {
        if (point.month === undefined) return String(point.year);
        const { months } = this.input.cvWords;
        const word = months.length === MONTHS_IN_A_YEAR ? months[point.month - 1] : undefined;
        if (word === undefined || word === '') {
            this.noWord('cv_words.months');
            return String(point.year);
        }
        return `${word} ${point.year}`;
    }

    /**
     * A period as the CV prints it: `<start> - <end>`, `<start> - <open end word>` for an open
     * end, and one end alone when the two print the same or the setting holds no open end word;
     * undefined for a value that is no period.
     */
    periodText(value: unknown): string | undefined {
        const read = readPeriod(value);
        if (read === null) return undefined;
        const start = this.pointText(read.start);
        const openEnd = this.input.cvWords.open_end;
        if (read.end === null && openEnd === '') {
            this.noWord('cv_words.open_end');
            return start;
        }
        const end = read.end === null ? openEnd : this.pointText(read.end);
        return start === end ? start : `${start} - ${end}`;
    }

    /** A timestamp the website parses from a period, its day the start's first day. */
    private timestamp(value: unknown): string | undefined {
        const read = readPeriod(value);
        if (read === null) return undefined;
        const time = this.input.cvWords.award_time;
        return time === '' ? read.start.first : `${read.start.first} ${time}`;
    }

    /**
     * The fields of a row with its period printed in the field its section reads: the `timestamp`
     * field under the row's `period: timestamp`, as the timestamp (`stamped`) or with `stamped`
     * false as the period text, which is what an employer CV prints; the `period_text` field as the
     * text for any other row, and for a section no row names. The record's `period` field and any
     * period text it holds are left out, so a record with no period prints none.
     */
    withPeriod(
        section: string,
        fields: Record<string, unknown>,
        stamped: boolean
    ): Record<string, unknown> {
        const { words } = this;
        const stamp = this.sections.get(section)?.period === 'timestamp';
        const into = stamp ? words.timestamp : words.period_text;
        const own = Object.entries(fields).filter(
            ([name]) => name !== words.period && name !== into
        );
        const when = held(fields, words.period);
        const text = stamp && stamped ? this.timestamp(when) : this.periodText(when);
        return written([...own, [into, text]]);
    }

    /** The fields a profile row of a section takes from its record. */
    recordFields(section: string): readonly string[] {
        const { words } = this;
        return this.sections.get(section)?.record_fields ?? [words.record_place, words.period];
    }

    /** A record read at `where` under `key`; a key a record read before holds names neither. */
    hold(key: string, where: string, fields: Record<string, unknown>): void {
        const places = this.places.get(key);
        if (places === undefined) {
            this.places.set(key, [where]);
            this.records.set(key, fields);
            return;
        }
        places.push(where);
        this.records.delete(key);
    }

    /**
     * The record a row at `where` names by `key`: none, and a problem naming the row and the key,
     * when no record holds it; none, and a problem naming the key, the first two places and the
     * row, when two do.
     */
    record(key: string, where: string): Record<string, unknown> | undefined {
        const places = this.places.get(key) ?? [];
        if (places.length > 1) {
            this.problems.push({
                about: null,
                key: 'audit.msg_cv_key_twice',
                args: [key, places[0], places[1], where]
            });
            return undefined;
        }
        const found = this.records.get(key);
        if (found === undefined) {
            this.problems.push({
                about: null,
                key: 'audit.msg_cv_unknown_record',
                args: [where, key]
            });
        }
        return found;
    }

    /** The person a key names, or a problem naming the place that names it. */
    person(key: string, where: string): Person | undefined {
        const found = this.people.get(key);
        if (found === undefined) {
            this.problems.push({
                about: null,
                key: 'audit.msg_cv_unknown_person',
                args: [where, key]
            });
        }
        return found;
    }

    /**
     * A row of the CV at `where`: one row of `section` when the setting lists the section, its
     * fields made only then, so a section written nowhere needs no period word; a problem naming
     * the row and the section otherwise.
     */
    add(section: string, rank: number, where: string, fields: () => Record<string, unknown>): void {
        if (!this.sections.has(section)) {
            this.problems.push({
                about: null,
                key: 'audit.msg_cv_unknown_section',
                args: [where, section]
            });
            return;
        }
        this.rows.push({ section, rank, at: this.at++, fields: fields() });
    }

    /**
     * The rows of the collections' entries that name a CV section; a supervision entry gives a row
     * per student in place of its own.
     */
    collections(): void {
        const { words } = this;
        for (const collection of this.input.collections) {
            for (const entry of collection.entries) {
                const fields = entryFields(entry.fields, this.input.cvEntryFields);
                const place = `${bareId(collection)}.${bareId(entry)}`;
                this.hold(bareId(entry), place, fields);
                const section = held(entry.fields, words.section);
                if (typeof section !== 'string') continue;
                const rank = rankOf(held(entry.fields, words.rank), Number.POSITIVE_INFINITY);
                const students = held(entry.fields, words.students);
                if (Array.isArray(students)) {
                    const where = `${bareId(entry)}.${words.students}`;
                    this.students(students, where, rank, held(entry.fields, words.period));
                } else {
                    this.add(section, rank, place, () => this.withPeriod(section, fields, true));
                }
            }
        }
    }

    /**
     * One row per student of a supervision entry, in the entry's order, its period the student's
     * own, else the entry's (`when`).
     */
    students(list: unknown[], where: string, rank: number, when: unknown): void {
        const { words } = this;
        const section = words.students_section;
        if (section === '') return;
        list.forEach((one, index) => {
            const student = byRoles(studentShape, one, words);
            if (student === undefined) return;
            const place = `${where}.${index}`;
            const person = this.person(student.student_person, place);
            if (person === undefined) return;
            this.add(section, rank, place, () =>
                written([
                    [words.row_title, person.name],
                    [words.row_place, student.student_topic],
                    [
                        words.period_text,
                        studentText(
                            student.student_degree,
                            this.periodText(student.period) ?? this.periodText(when)
                        )
                    ]
                ])
            );
        });
    }

    /**
     * The rows of the career file's lists, each in its list's section unless it names one; a row
     * whose key field is the empty text is a problem naming the row, and is the record of no key.
     */
    career(): void {
        const { words } = this;
        const sections = this.input.career?.sections ?? {};
        for (const { list, section, reference } of this.input.cvLists) {
            rowsOf(held(sections, list)).forEach((row, index) => {
                const where = `${list}.${index}`;
                const fields = this.careerFields(reference === true, row, where);
                if (fields === undefined) return;
                const key = held(row, words.record_key);
                if (key === '') {
                    this.problems.push({
                        about: null,
                        key: 'audit.msg_cv_empty_key',
                        args: [where]
                    });
                } else if (typeof key === 'string') this.hold(key, where, fields);
                const own = held(row, words.section);
                const named = typeof own === 'string' ? own : section;
                this.add(named, rankOf(held(row, words.rank), index), where, () =>
                    this.withPeriod(named, fields, true)
                );
            });
        }
    }

    /**
     * The CV fields of a career row: a reference's person's name and email with its reason, an
     * award's fields over those of the funding entry it names, and any other row as it is.
     */
    careerFields(reference: boolean, row: Record<string, unknown>, where: string) {
        const { words } = this;
        if (reference) {
            const key = held(row, words.reference_person);
            const person = typeof key === 'string' ? this.person(key, where) : undefined;
            if (person === undefined) return undefined;
            return written([
                [words.reference_name, person.name],
                [words.reference_email, person.email],
                [words.reference_reason, held(row, words.reference_reason)]
            ]);
        }
        const key = held(row, words.funding);
        if (typeof key !== 'string') return row;
        const funding = this.record(key, where);
        if (funding === undefined) return row;
        return {
            ...written([
                [words.award_title, held(funding, words.funding_title)],
                [words.award_place, held(funding, words.funding_place)],
                [words.award_content, held(funding, words.funding_about)]
            ]),
            ...row
        };
    }

    /** The rows of the manifests that carry a CV record, in the CV's projects section. */
    manifests(): void {
        const { words } = this;
        const section = words.projects_section;
        for (const project of this.input.projects) {
            const record = project.cv;
            if (record === undefined) continue;
            const title = written([[words.row_title, record.title ?? project.title]]);
            const fields = { ...record, ...title };
            const place = `${section}.${bareId(project)}`;
            this.hold(bareId(project), place, fields);
            if (section === '') continue;
            const rank = rankOf(record.rank, Number.POSITIVE_INFINITY);
            this.add(section, rank, place, () => this.withPeriod(section, fields, true));
        }
    }

    /** The rows of one section, by rank and then by the order they were read in. */
    section(key: string, fields: readonly string[]): Record<string, unknown>[] {
        return this.rows
            .filter((row) => row.section === key)
            .sort((left, right) => left.rank - right.rank || left.at - right.at)
            .map((row) => printed(row.fields, fields));
    }
}

/** The user's people entry: the first person the user's ids name. */
function selfOf(input: CvInput): Person | undefined {
    return input.people.find((person) => input.self.has(person.id));
}

/** The text a CV prints for one of the user's addresses: its account name, else its address. */
function shownLink(person: Person, name: string): string | undefined {
    const row = person.links.find((one) => one.name === name);
    return row === undefined ? undefined : (row.handle ?? row.url);
}

/**
 * The person blocks' names from the user's people entry: the given name its `name` with the space
 * and the `family` at its end taken off, and the family name its `family`. An entry with no
 * `family`, or whose `name` does not end with a space and its `family`, gives none and a problem
 * naming the entry.
 */
function namesOf(person: Person, cv: Cv): Record<string, unknown> {
    const { name, family } = person;
    const end = family === undefined ? undefined : ` ${family}`;
    if (end === undefined || !name.endsWith(end) || name.length === end.length) {
        cv.problems.push({ about: null, key: 'audit.msg_cv_self_names', args: [bareId(person)] });
        return {};
    }
    return written([
        [cv.words.first_name, name.slice(0, -end.length)],
        [cv.words.last_name, family]
    ]);
}

/** The CV's person block: the names and the user's email, links and ORCID. */
function personal(person: Person, cv: Cv): Record<string, unknown> {
    const { words } = cv;
    const links = written([
        [words.link_email, person.email],
        ...person.links.map((row): Pair => [row.name, row.handle ?? row.url]),
        [words.link_orcid, person.orcid]
    ]);
    return written([...Object.entries(cv.names), [words.person_links, links]]);
}

/** The CV file the hub gives, from the rows read (`built`). */
export function cvFile(input: CvInput, cv: Cv): Record<string, unknown> {
    const { words } = cv;
    const person = selfOf(input);
    return written([
        [words.person_block, person === undefined ? undefined : personal(person, cv)],
        ...input.cvSections.map(({ key, fields }): Pair => [
            key,
            written([[words.rows, cv.section(key, fields)]])
        ])
    ]);
}

/**
 * The CV's rows read from the hub, in the order the records a later row names are read in, and the
 * person blocks' names.
 */
export function built(input: CvInput): Cv {
    const cv = new Cv(input);
    const person = selfOf(input);
    if (person !== undefined) cv.names = namesOf(person, cv);
    cv.collections();
    cv.manifests();
    cv.career();
    return cv;
}

/**
 * A profile row with the fields it takes from its first record (`taken`, its section's), its list
 * of records left out, and its period printed as its section of the employer CV prints it.
 */
function profileRow(
    row: Record<string, unknown>,
    cv: Cv,
    where: string,
    section: string,
    taken: readonly string[]
): Record<string, unknown> {
    const { words } = cv;
    const records = held(row, words.records);
    if (!Array.isArray(records)) return cv.withPeriod(section, row, false);
    const keys = records.filter((one): one is string => typeof one === 'string');
    const own = Object.entries(row).filter(([name]) => name !== words.records);
    const found = keys.map((key) => cv.record(key, where));
    const first = found.at(0);
    const kept = Object.fromEntries(own);
    const fromRecord = taken
        .filter((name) => held(kept, name) === undefined)
        .map((name): Pair => [name, first === undefined ? undefined : held(first, name)]);
    return cv.withPeriod(section, written([...own, ...fromRecord]), false);
}

/** A profile with every section's rows given their records' fields. */
function profileOf(profile: Record<string, unknown>, cv: Cv, where: string) {
    const { words } = cv;
    const out: Record<string, unknown> = {};
    for (const [name, part] of Object.entries(profile)) {
        const rows = isMap(part) ? held(part, words.rows) : undefined;
        if (!isMap(part) || !Array.isArray(rows)) {
            out[name] = part;
            continue;
        }
        const content = rowsOf(rows).map((row, index) =>
            profileRow(row, cv, `${where}.${name}.${index}`, name, cv.recordFields(name))
        );
        out[name] = { ...part, ...written([[words.rows, content]]) };
    }
    return out;
}

/** The block the employer CVs share, by role: the place, the email and the links they print. */
const sharedShape = z.object({
    shared_place: z.string().optional(),
    shared_email: z.string().optional(),
    shared_links: z.array(z.string()).optional()
});

/** The employer CVs' file the hub gives: the shared person block and each profile. */
export function industryFile(input: CvInput, cv: Cv): Record<string, unknown> {
    const { words } = cv;
    const sections = input.career?.sections ?? {};
    const given = held(sections, words.profiles);
    const profiles = isMap(given) ? given : {};
    const block: z.output<typeof sharedShape> =
        byRoles(sharedShape, held(profiles, words.profile_shared), words) ?? {};
    const person = selfOf(input);
    const links = written([
        [words.link_place, block.shared_place],
        [words.link_email, block.shared_email],
        ...(block.shared_links ?? []).map((name): Pair => [
            name,
            person === undefined ? undefined : shownLink(person, name)
        ])
    ]);
    const out: Record<string, unknown> = {};
    for (const [name, profile] of Object.entries(profiles)) {
        if (name !== words.profile_shared && isMap(profile)) {
            out[name] = profileOf(profile, cv, `${words.profiles}.${name}`);
        }
    }
    const shared = written([
        [words.person_block, written([...Object.entries(cv.names), [words.person_links, links]])]
    ]);
    return written([
        [words.profile_shared, shared],
        [words.profiles, out]
    ]);
}

export type { Cv };
