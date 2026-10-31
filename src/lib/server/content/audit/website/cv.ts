// Layer 2, server. The website's CV file and its employer CVs' file built from the hub. The CV's
// person block is the user's people entry, its names its `name` and `family`, and its links; its
// sections are the rows of the career file's lists (`positions`, `degrees`, `awards`,
// `references`), the entries of the hub's collections that name a CV section (`cv_section`), each
// supervision entry's students, and the manifests that carry a `cv:` record, each section's rows by
// their rank and then in the order they are read in. The employer CVs are the career file's
// `profiles`, whose rows name the records they stand for and take from the first one the place,
// period, day or address their section prints where they print none of their own. A section's
// title and the person's other details (portrait, titles, author, website) are the website's, which
// its templates read from its own file.
//
// A record is named by its key: a collection entry's key, a manifest's folder name, a career row's
// `key`. A key two records hold names neither: a row that names it takes nothing from either and is
// a problem naming the key, both places and the row.

import { z } from 'zod';
import { bareId } from '../../../../data/helpers/hub-names.ts';
import { isMap } from '../../../../data/helpers/guards.ts';
import type { Career, Collection, Id, Person, Project } from '../../../../data/model/index.ts';
import type { Problem } from './site.ts';

/** What the CV and the employer CVs are built from. */
export type CvInput = {
    projects: readonly Project[];
    collections: readonly Collection[];
    people: readonly Person[];
    career: Career | null;
    self: ReadonlySet<Id>;
};

/** The fields of a row that carries a title, in the order a row is written. */
const TITLED = ['title', 'location', 'duration', 'url', 'about', 'hide'];

/**
 * The CV's sections in the order the file lists them, each with the fields its rows print: the
 * shape the website's templates and its CV programs read.
 */
const SECTIONS: { key: string; fields: readonly string[] }[] = [
    { key: 'references', fields: ['name', 'email', 'reason'] },
    { key: 'experience', fields: TITLED },
    { key: 'academic', fields: TITLED },
    { key: 'students', fields: ['title', 'location', 'duration'] },
    { key: 'news', fields: TITLED },
    { key: 'education', fields: TITLED },
    { key: 'grants', fields: ['title', 'url', 'duration', 'role', 'status', 'about', 'hide'] },
    { key: 'projects', fields: ['title', 'url', 'duration', 'role', 'hide', 'about'] },
    { key: 'awards', fields: ['award', 'event', 'date', 'location', 'content', 'hide'] },
    { key: 'extracurricular', fields: TITLED }
];

/** The career file's lists of CV rows, each with the section its rows go to unless one is named. */
const CAREER_LISTS: { list: string; section: string }[] = [
    { list: 'references', section: 'references' },
    { list: 'positions', section: 'experience' },
    { list: 'degrees', section: 'education' },
    { list: 'awards', section: 'awards' }
];

/**
 * The fields a profile row takes from the first record it names when it prints none of its own: of
 * the place, the period, the day and the address, those its section of the employer CV prints (the
 * website's `_industry/src/cv/` templates), by the section's key.
 */
const FROM_RECORD: Record<string, readonly string[]> = {
    awards: ['location', 'date'],
    projects: ['url', 'duration']
};

/** The fields a row of any other section of a profile takes from its record. */
const FROM_RECORD_ELSE: readonly string[] = ['location', 'duration'];

/** The list that names the records a profile row stands for. */
const RECORDS = 'records';

/** A list of maps; anything else holds none. */
const rowsShape = z.array(z.unknown()).transform((all) => all.filter(isMap));

/** A student of a supervision entry: the person, the topic and the degree the CV prints. */
const studentShape = z.object({
    person: z.string(),
    topic: z.string().optional(),
    degree: z.string().optional()
});

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
 * The CV fields of a collection entry: the CV's title, address and status where the entry names
 * them (`cv_title`, `cv_url`, `cv_status`), else its own title and address; the other fields as the
 * entry holds them.
 */
function entryFields(fields: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(fields)) if (name !== 'status') out[name] = value;
    if (Object.hasOwn(fields, 'cv_title')) out.title = fields.cv_title;
    if (Object.hasOwn(fields, 'cv_url')) out.url = fields.cv_url;
    if (Object.hasOwn(fields, 'cv_status')) out.status = fields.cv_status;
    return out;
}

/** The fields of a row its section prints, in the section's order, each one the source holds. */
function printed(
    fields: Record<string, unknown>,
    keys: readonly string[]
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of keys) if (fields[key] !== undefined) out[key] = fields[key];
    return out;
}

/** The CV's builder: the people, the records by key, the rows, and the problems found. */
class Cv {
    readonly rows: Row[] = [];
    readonly problems: Problem[] = [];
    /** The person blocks' names, from the user's people entry; none when it gives none. */
    names: Record<string, unknown> = {};
    /** The CV fields of every record a profile row or an award row may name, by its key. */
    private readonly records = new Map<string, Record<string, unknown>>();
    /** The places of the records each key was read at, in the order they were read in. */
    private readonly places = new Map<string, string[]>();
    private readonly people = new Map<string, Person>();
    private at = 0;

    constructor(private readonly input: CvInput) {
        for (const person of input.people) this.people.set(bareId(person), person);
    }

    /** A record read at `where` under `key`; a key a record read before holds names neither. */
    hold(key: string, where: string, fields: Record<string, unknown>): void {
        const held = this.places.get(key);
        if (held === undefined) {
            this.places.set(key, [where]);
            this.records.set(key, fields);
            return;
        }
        held.push(where);
        this.records.delete(key);
    }

    /**
     * The record a row at `where` names by `key`: none, and a problem naming the row and the key,
     * when no record holds it; none, and a problem naming the key, the first two places and the
     * row, when two do.
     */
    record(key: string, where: string): Record<string, unknown> | undefined {
        const held = this.places.get(key) ?? [];
        if (held.length > 1) {
            this.problems.push({
                about: null,
                key: 'audit.msg_cv_key_twice',
                args: [key, held[0], held[1], where]
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

    add(section: string, rank: number, fields: Record<string, unknown>): void {
        this.rows.push({ section, rank, at: this.at++, fields });
    }

    /**
     * The rows of the collections' entries that name a CV section; a supervision entry gives a row
     * per student in place of its own.
     */
    collections(): void {
        for (const collection of this.input.collections) {
            for (const entry of collection.entries) {
                const fields = entryFields(entry.fields);
                this.hold(bareId(entry), `${bareId(collection)}.${bareId(entry)}`, fields);
                const section = entry.fields.cv_section;
                if (typeof section !== 'string') continue;
                const rank = rankOf(entry.fields.cv_rank, Number.POSITIVE_INFINITY);
                if (Array.isArray(entry.fields.students)) {
                    this.students(entry.fields.students, `${bareId(entry)}.students`, rank);
                } else this.add(section, rank, fields);
            }
        }
    }

    /** One row per student of a supervision entry, in the entry's order. */
    students(list: unknown[], where: string, rank: number): void {
        list.forEach((one, index) => {
            const row = studentShape.safeParse(one);
            if (!row.success) return;
            const person = this.person(row.data.person, `${where}.${index}`);
            if (person === undefined) return;
            this.add('students', rank, {
                title: person.name,
                location: row.data.topic,
                duration: row.data.degree
            });
        });
    }

    /**
     * The rows of the career file's lists, each in its list's section unless it names one; a row
     * whose `key` is the empty text is a problem naming the row, and is the record of no key.
     */
    career(): void {
        const sections = this.input.career?.sections ?? {};
        for (const { list, section } of CAREER_LISTS) {
            rowsOf(sections[list]).forEach((row, index) => {
                const where = `${list}.${index}`;
                const fields = this.careerFields(list, row, where);
                if (fields === undefined) return;
                if (row.key === '') {
                    this.problems.push({
                        about: null,
                        key: 'audit.msg_cv_empty_key',
                        args: [where]
                    });
                } else if (typeof row.key === 'string') this.hold(row.key, where, fields);
                const named = typeof row.cv_section === 'string' ? row.cv_section : section;
                this.add(named, rankOf(row.cv_rank, index), fields);
            });
        }
    }

    /**
     * The CV fields of a career row: a reference's person's name and email with its reason, an
     * award's fields over those of the funding entry it names, and any other row as it is.
     */
    careerFields(list: string, row: Record<string, unknown>, where: string) {
        if (list === 'references') {
            const person =
                typeof row.person === 'string' ? this.person(row.person, where) : undefined;
            if (person === undefined) return undefined;
            return { name: person.name, email: person.email, reason: row.reason };
        }
        if (typeof row.funding !== 'string') return row;
        const funding = this.record(row.funding, where);
        if (funding === undefined) return row;
        return {
            award: funding.title,
            location: funding.location,
            content: funding.about,
            ...row
        };
    }

    /** The rows of the manifests that carry a `cv:` record, in the CV's projects. */
    manifests(): void {
        for (const project of this.input.projects) {
            const held = project.cv;
            if (held === undefined) continue;
            const fields = { ...held, title: held.title ?? project.title };
            this.hold(bareId(project), `projects.${bareId(project)}`, fields);
            this.add('projects', rankOf(held.rank, Number.POSITIVE_INFINITY), fields);
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
function namesOf(person: Person, problems: Problem[]): Record<string, unknown> {
    const { name, family } = person;
    const end = family === undefined ? undefined : ` ${family}`;
    if (end === undefined || !name.endsWith(end) || name.length === end.length) {
        problems.push({ about: null, key: 'audit.msg_cv_self_names', args: [bareId(person)] });
        return {};
    }
    return { 'first-name': name.slice(0, -end.length), 'last-name': family };
}

/** The CV's person block: the names and the user's email, links and ORCID. */
function personal(person: Person, cv: Cv): Record<string, unknown> {
    const links: Record<string, unknown> = {};
    if (person.email !== undefined) links.email = person.email;
    for (const row of person.links) links[row.name] = row.handle ?? row.url;
    if (person.orcid !== undefined) links.orcid = person.orcid;
    return { ...cv.names, links };
}

/** The CV file the hub gives, from the rows read (`built`). */
export function cvFile(input: CvInput, cv: Cv): Record<string, unknown> {
    const person = selfOf(input);
    const value: Record<string, unknown> = {};
    if (person !== undefined) value.personal = personal(person, cv);
    for (const { key, fields } of SECTIONS) value[key] = { content: cv.section(key, fields) };
    return value;
}

/**
 * The CV's rows read from the hub, in the order the records a later row names are read in, and the
 * person blocks' names.
 */
export function built(input: CvInput): Cv {
    const cv = new Cv(input);
    const person = selfOf(input);
    if (person !== undefined) cv.names = namesOf(person, cv.problems);
    cv.collections();
    cv.manifests();
    cv.career();
    return cv;
}

/**
 * A profile row with the fields it takes from its first record (`taken`, its section's), its list
 * of records left out.
 */
function profileRow(
    row: Record<string, unknown>,
    cv: Cv,
    where: string,
    taken: readonly string[]
): Record<string, unknown> {
    if (!Array.isArray(row[RECORDS])) return row;
    const keys = row[RECORDS].filter((one): one is string => typeof one === 'string');
    const out: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(row)) if (name !== RECORDS) out[name] = value;
    const found = keys.map((key) => cv.record(key, where));
    const first = found.at(0);
    for (const name of taken) {
        if (out[name] === undefined && first?.[name] !== undefined) out[name] = first[name];
    }
    return out;
}

/** A profile with every section's rows given their records' fields. */
function profileOf(profile: Record<string, unknown>, cv: Cv, where: string) {
    const out: Record<string, unknown> = {};
    for (const [name, part] of Object.entries(profile)) {
        if (!isMap(part) || !Array.isArray(part.content)) {
            out[name] = part;
            continue;
        }
        const taken = Object.hasOwn(FROM_RECORD, name) ? FROM_RECORD[name] : FROM_RECORD_ELSE;
        const content = rowsOf(part.content).map((row, index) =>
            profileRow(row, cv, `${where}.${name}.${index}`, taken)
        );
        out[name] = { ...part, content };
    }
    return out;
}

/** The block the employer CVs share: the place, the email and the names of the links they print. */
const sharedShape = z.object({
    location: z.string().optional(),
    email: z.string().optional(),
    links: z.array(z.string()).optional()
});

/** The key of the career file's profiles that holds the block they share. */
const SHARED = 'shared';

/** The employer CVs' file the hub gives: the shared person block and each profile. */
export function industryFile(input: CvInput, cv: Cv): Record<string, unknown> {
    const sections = input.career?.sections ?? {};
    const profiles = isMap(sections.profiles) ? sections.profiles : {};
    const shared = sharedShape.safeParse(profiles[SHARED]);
    const block = shared.success ? shared.data : {};
    const person = selfOf(input);
    const links: Record<string, unknown> = {};
    if (block.location !== undefined) links.location = block.location;
    if (block.email !== undefined) links.email = block.email;
    for (const name of block.links ?? []) {
        const shown = person === undefined ? undefined : shownLink(person, name);
        if (shown !== undefined) links[name] = shown;
    }
    const out: Record<string, unknown> = {};
    for (const [name, profile] of Object.entries(profiles)) {
        if (name !== SHARED && isMap(profile)) {
            out[name] = profileOf(profile, cv, `profiles.${name}`);
        }
    }
    return { shared: { personal: { ...cv.names, links } }, profiles: out };
}

export type { Cv };
