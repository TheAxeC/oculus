#!/usr/bin/env node
// Layer 1, data. Split a hub's collaborations collection into the people and organisation
// registries and the joint-work collection.
//
// One entry of `network/collaborations.yml` holds two things at once: who the person is (the name
// and the institution in `title`, the role in `sub` and in the `meta` rows Institution and Role)
// and how the work with them stands (`status`, `tags`, `note`, `deadline`, `followup`). This writes
// the first half to `registries/people.yml` and `registries/organisations.yml` and leaves the
// second half in `network/joint-work.yml`, where each entry names its person by key.
//
// A person belongs to every organisation their Institution row names, so `affiliations:` is a list
// with the primary first. `--from <file>` reads those rows out of a collaborations file the hub no
// longer has, which is how a hub whose people were written from the first organisation alone gains
// the rest; a tool script never runs git, so the file is handed to it rather than read from
// history.
//
// It is idempotent: a registry already on the hub is read first and its entries are kept as they
// are, so a second run over a migrated hub writes the same bytes, and a run over a hub that has
// gained a collaborations entry since adds that one and touches nothing else. Run it as
//
//     node utils/migrations/migrate-joint-work.mjs <hub> [--from f] [--self-key k] \
//         [--self-name n] [--self-role r] [--self-affiliation a]
//
// and it prints, per file, what it wrote and what it could not fill in.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
// `isMap` names data/helpers/guards.ts's test of a parsed value in every file, so the yaml
// library's own node test is imported as `isYamlMap`.

import { Document, isMap as isYamlMap, isSeq, parse, stringify } from 'yaml';

/** Where each half of a collaborations entry goes. */
const SOURCE = 'network/collaborations.yml';
const JOINT_WORK = 'network/joint-work.yml';
const PEOPLE = 'registries/people.yml';
const ORGANISATIONS = 'registries/organisations.yml';
const STUDENTS = 'education/student-supervision';

/** The keys of an entry that belong to the person rather than to the work. */
const PERSON_ROWS = ['Institution', 'Role'];

/**
 * What the hub's own organisation spellings mean. The registry's `name` is never taken from here:
 * it is the string the hub wrote, first spelling wins. `alias` folds a second spelling of one
 * organisation onto the first, since two spellings of one organisation would otherwise be two
 * entries of the registry. Anything not named here is written `kind: other` with no country and is
 * listed in the run's output as a row to complete.
 */
const KNOWN = {
    'university-of-twente': { kind: 'university', country: 'NL' },
    utwente: { alias: 'university-of-twente' },
    mst: { kind: 'hospital', country: 'NL' },
    'linkoping-university': { kind: 'university', country: 'SE' },
    'region-ostergotland': { kind: 'other', country: 'SE' },
    'ku-leuven': { kind: 'university', country: 'BE' },
    'uz-leuven': { kind: 'hospital', country: 'BE' },
    uhasselt: { kind: 'university', country: 'BE' },
    'zol-genk': { kind: 'hospital', country: 'BE' }
};

/** An ASCII key from a display name: accents folded, everything else a single hyphen. */
function slug(name) {
    return name
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Whether a field has something to write; an empty one is left out of its entry. */
function filled(value) {
    return value !== undefined && value !== null && value !== '';
}

/** The fields of an entry that hold something, as strings, in the order they are named. */
function strings(entry, keys) {
    const out = {};
    for (const key of keys) if (filled(entry[key])) out[key] = String(entry[key]);
    return out;
}

/** A list field when it holds anything, and nothing when it does not. */
function listed(key, value) {
    return Array.isArray(value) && value.length > 0 ? { [key]: value } : {};
}

/** The parsed map of a hub file, and an empty map when the file is not there or is not a map. */
function read(hub, relative) {
    const file = join(hub, relative);
    if (!existsSync(file)) return {};
    const parsed = parse(readFileSync(file, 'utf8'));
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
}

/** The entries of a parsed registry or collection file, as maps only. */
function entriesOf(data) {
    const list = data.entries;
    return Array.isArray(list)
        ? list.filter((one) => typeof one === 'object' && one !== null && !Array.isArray(one))
        : [];
}

/** One `meta:` row's value by its label, and nothing when the entry carries no such row. */
function metaRow(entry, label) {
    const rows = Array.isArray(entry.meta) ? entry.meta : [];
    for (const row of rows) {
        if (typeof row !== 'object' || row === null) continue;
        if (row.label === label && typeof row.value === 'string') return row.value;
    }
    return undefined;
}

/** The `meta:` rows that are about the work rather than about the person. */
function workRows(entry) {
    const rows = Array.isArray(entry.meta) ? entry.meta : [];
    return rows.filter(
        (row) => typeof row === 'object' && row !== null && !PERSON_ROWS.includes(row.label)
    );
}

/**
 * The person's name out of an entry's title. The file writes "Name - Institution", so the name is
 * what stands before the first such separator and the whole title when there is none.
 */
function nameOf(title) {
    const at = title.indexOf(' - ');
    return at < 0 ? title.trim() : title.slice(0, at).trim();
}

/**
 * The organisations one Institution row names, in the order it names them. The row is written
 * "Organisation / Organisation - Department", so the department is dropped at the first " - " and
 * the remainder is split on " / "; a trailing country code in brackets is taken as the country.
 */
function organisationsOf(institution) {
    const at = institution.indexOf(' - ');
    const head = at < 0 ? institution : institution.slice(0, at);
    const out = [];
    for (const part of head.split(' / ')) {
        const text = part.trim();
        if (text === '') continue;
        const coded = /^(.*?)\s*\(([A-Z]{2})\)$/.exec(text);
        const name = coded === null ? text : coded[1].trim();
        const country = coded === null ? undefined : coded[2];
        if (name !== '') out.push({ name, country });
    }
    return out;
}

/** The canonical key of an organisation name, folding a second spelling onto the first. */
function organisationKey(name) {
    const key = slug(name);
    return KNOWN[key]?.alias ?? key;
}

/** The registry keys a list of named organisations comes to, each one recorded as it is reached. */
function keysOf(named, addOrganisation) {
    const keys = [];
    for (const one of named) {
        const held = addOrganisation(one.name, one.country);
        if (!keys.includes(held)) keys.push(held);
    }
    return keys;
}

/** The student folders of a hub, each one person the supervision folder is for. */
function students(hub) {
    const dir = join(hub, STUDENTS);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
        .filter((one) => one.isDirectory())
        .map((one) => one.name)
        .sort()
        .map((folder) => {
            const word = folder.replace(/-\d{4}$/, '');
            return {
                key: word,
                name: word.charAt(0).toUpperCase() + word.slice(1),
                role: 'student',
                folder: `${STUDENTS}/${folder}`,
                seeded: true
            };
        });
}

/**
 * The people an already-migrated hub holds, by key, so a second run keeps what is there. An entry
 * still written with the one key `affiliation:` is read as a list of that one, which is what makes
 * a run over such a hub write the list without being told anything about the entry.
 */
function existingPeople(hub) {
    const held = new Map();
    for (const entry of entriesOf(read(hub, PEOPLE))) {
        if (typeof entry.key !== 'string' || entry.key === '') continue;
        const { affiliation, ...rest } = entry;
        held.set(entry.key, { ...rest, affiliations: affiliationList(entry) });
    }
    return held;
}

/** The organisation keys one people entry names, taking the one key the list replaced. */
function affiliationList(entry) {
    if (Array.isArray(entry.affiliations)) {
        return entry.affiliations.filter((one) => typeof one === 'string' && one !== '');
    }
    return typeof entry.affiliation === 'string' && entry.affiliation !== ''
        ? [entry.affiliation]
        : [];
}

/** The organisations an already-migrated hub holds, by key. */
function existingOrganisations(hub) {
    const held = new Map();
    for (const entry of entriesOf(read(hub, ORGANISATIONS))) {
        if (typeof entry.key === 'string' && entry.key !== '') held.set(entry.key, entry);
    }
    return held;
}

/** Write a file, making the folder it sits in when the hub does not have it yet. */
function write(hub, relative, text) {
    const file = join(hub, relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, 'utf8');
}

const PEOPLE_HEAD = `# People - one entry per human the hub names: a collaborator a project's \`collaborators:\` or
# \`waiting-on:\` points at, a student whose supervision folder is under education/, and the hub's own
# owner, the one entry carrying \`self: true\`. A person's facts live here and nowhere else, so a name
# is written once and every card, tag and map node that draws one reads it from this file.
# \`affiliations:\` are keys of registries/organisations.yml, never free strings, the primary first.

schema:
  - { field: key,          type: text,     required: true, label: "Person key" }
  - { field: name,         type: text,     required: true }
  - { field: affiliations, type: tags,     help: "organisations.yml keys, the primary first" }
  - { field: role,         type: text,     help: "what this person is to the hub" }
  - { field: orcid,        type: text }
  - { field: email,        type: text }
  - { field: links,        type: tags }
  - { field: folder,       type: text,     help: "hub-relative folder of a student's supervision files" }
  - { field: self,         type: checkbox, help: "true on the hub owner's own entry, exactly one" }

`;

const ORGANISATIONS_HEAD = `# Organisations - the universities, hospitals, funders and companies the hub names. A person's
# \`affiliations:\` in registries/people.yml and a funding scheme's \`funder:\` in funding/funding.yml are
# keys into this file, so an organisation is spelled once and drawn the same way everywhere.
# \`kind:\` is one of university | hospital | funder | company | other.

schema:
  - { field: key,     type: text,   required: true, label: "Organisation key" }
  - { field: name,    type: text,   required: true }
  - { field: kind,    type: select, options: [university, hospital, funder, company, other], required: true }
  - { field: country, type: text,   help: "two-letter country code" }
  - { field: links,   type: tags }

`;

const JOINT_WORK_HEAD = `# Joint work - one entry per piece of work with one person, and the pipeline it is in. Who the person
# is lives in registries/people.yml; this file holds only the work, and \`person:\` names whom it is
# with. A project's \`collaborators:\` names people keys, not entries of this file.
# \`related:\` ids cross-link to the project cards the work feeds.
title: Joint work
intro: "The work I have going with each person, and where it stands. Who each person is lives in registries/people.yml; status = exploring / active / completed."
# Form schema: field -> type / options / required / help. Drives the add/edit modal.
schema:
  - { field: key,    type: text,     help: "short slug for this piece of work" }
  - { field: title,  type: text,     required: true, help: "what the work is, not who it is with" }
  - { field: person, type: select,   options_from: people, required: true, help: "a registries/people.yml key" }
  - { field: status, type: select,   options: [exploring, active, completed], required: true }
  - { field: meta,   type: metalist }
  - { field: tags,   type: tags }
  - { field: note,   type: textarea }
  - { field: deadline, type: date }
  - { field: followup, type: text, help: "a standing reminder" }

`;

/** One people entry, whichever of its optional fields it has. */
function personEntry(entry) {
    return {
        key: String(entry.key),
        ...strings(entry, ['name']),
        ...listed('affiliations', entry.affiliations?.map(String)),
        ...strings(entry, ['role', 'orcid', 'email']),
        ...listed('links', entry.links?.map(String)),
        ...strings(entry, ['folder']),
        ...(entry.self === true ? { self: true } : {})
    };
}

/** One organisation entry. */
function organisationEntry(entry) {
    return {
        key: String(entry.key),
        ...strings(entry, ['name', 'kind', 'country']),
        ...listed('links', entry.links?.map(String))
    };
}

/** One joint-work entry: the work, its person, and the pipeline fields it kept. */
function workEntry(entry) {
    return {
        key: String(entry.key),
        ...strings(entry, ['title', 'person', 'status']),
        ...listed(
            'meta',
            entry.meta.map((row) => ({ label: String(row.label), value: String(row.value) }))
        ),
        ...listed('tags', entry.tags),
        ...strings(entry, ['note', 'deadline', 'followup']),
        ...listed('related', entry.related)
    };
}

/**
 * A registry or collection file: its head as written, then `entries:` built as objects. Strings are
 * double-quoted except a tag, which is plain where YAML allows it, a list inside an entry and a
 * `meta:` row are written on one line with no space inside their brackets, and a blank line stands
 * between two entries, so the file reads as the hand-kept ones do.
 */
function fileText(head, entries) {
    const doc = new Document({ entries });
    const list = doc.get('entries');
    if (isSeq(list)) {
        list.items.forEach((item, at) => {
            if (at > 0) item.spaceBefore = true;
            if (!isYamlMap(item)) return;
            for (const pair of item.items) {
                if (!isSeq(pair.value)) continue;
                if (pair.key.value === 'meta') for (const row of pair.value.items) row.flow = true;
                else pair.value.flow = true;
                if (pair.key.value === 'tags')
                    for (const tag of pair.value.items) tag.type = 'PLAIN';
            }
        });
    }
    return (
        head +
        stringify(doc, {
            defaultStringType: 'QUOTE_DOUBLE',
            defaultKeyType: 'PLAIN',
            flowCollectionPadding: false,
            lineWidth: 0
        })
    );
}

/** The whole migration over one hub, and the lines the run prints about it. */
function migrate(hub, self, from) {
    const said = [];
    const source = existsSync(join(hub, SOURCE)) ? SOURCE : JOINT_WORK;
    const data = read(hub, source);
    const entries = entriesOf(data);

    const people = existingPeople(hub);
    const organisations = existingOrganisations(hub);
    const work = [];

    /** Record one organisation, keeping the first spelling and the first country seen. */
    function addOrganisation(name, country) {
        const key = organisationKey(name);
        if (organisations.has(key)) return key;
        const known = KNOWN[key] ?? {};
        organisations.set(key, {
            key,
            name,
            kind: known.kind ?? 'other',
            country: known.country ?? country
        });
        if (known.kind === undefined)
            said.push(`organisation ${key}: kind and country to complete`);
        return key;
    }

    for (const entry of entries) {
        const key = typeof entry.key === 'string' ? entry.key : '';
        if (key === '') continue;
        const title = typeof entry.title === 'string' ? entry.title : '';
        const sub = typeof entry.sub === 'string' ? entry.sub : '';
        const institution = metaRow(entry, 'Institution');
        const role = metaRow(entry, 'Role');
        const affiliations = keysOf(organisationsOf(institution ?? ''), addOrganisation);
        // An entry that already names a person has had its person facts taken out of it, so its
        // title is the work and no name can be read from it; the registry already holds that
        // person.
        const migrated = typeof entry.person === 'string';
        if (!migrated && !people.has(key)) {
            people.set(key, { key, name: nameOf(title), affiliations, role: role ?? sub });
        }
        work.push({
            key,
            // A migrated entry's title is already the work; one still carrying the person's name
            // takes the subtitle, which is what that entry wrote the work in.
            title: migrated ? title : sub || title,
            person: migrated ? entry.person : key,
            status: typeof entry.status === 'string' ? entry.status : '',
            meta: workRows(entry),
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            note: typeof entry.note === 'string' ? entry.note : '',
            deadline: typeof entry.deadline === 'string' ? entry.deadline : '',
            followup: typeof entry.followup === 'string' ? entry.followup : '',
            related: Array.isArray(entry.related) ? entry.related : []
        });
    }

    // The Institution rows of the file named by --from: every organisation a row names becomes a
    // key of that person's list, which is what a hub whose entries hold the first one alone is
    // missing.
    for (const entry of entriesOf(from === '' ? {} : read('', from))) {
        const key = typeof entry.key === 'string' ? entry.key : '';
        const institution = metaRow(entry, 'Institution');
        if (key === '' || institution === undefined || !people.has(key)) continue;
        const affiliations = keysOf(organisationsOf(institution), addOrganisation);
        if (affiliations.length === 0) continue;
        people.set(key, { ...people.get(key), affiliations });
    }

    for (const one of students(hub)) {
        if (people.has(one.key)) continue;
        people.set(one.key, one);
        said.push(`person ${one.key}: name seeded from the folder word, to complete`);
    }

    const owner = [...people.values()].find((one) => one.self === true);
    if (owner === undefined && self.key !== '') {
        people.set(self.key, { ...self, self: true });
        said.push(`person ${self.key}: the hub's own entry, orcid and email to complete`);
    }

    const peopleText = fileText(PEOPLE_HEAD, [...people.values()].map(personEntry));
    const organisationsText = fileText(
        ORGANISATIONS_HEAD,
        [...organisations.values()].map(organisationEntry)
    );
    const workText = fileText(JOINT_WORK_HEAD, work.map(workEntry));

    write(hub, PEOPLE, peopleText);
    write(hub, ORGANISATIONS, organisationsText);
    write(hub, JOINT_WORK, workText);
    if (source === SOURCE) rmSync(join(hub, SOURCE));

    said.unshift(
        `${PEOPLE}: ${people.size} entries`,
        `${ORGANISATIONS}: ${organisations.size} entries`,
        `${JOINT_WORK}: ${work.length} entries`
    );
    return said;
}

const USAGE =
    'usage: node utils/migrations/migrate-joint-work.mjs <hub> [--from f] [--self-key k] [--self-name n] [--self-role r] [--self-affiliation a]';

/**
 * The command line: the hub, then the hub owner's own person entry. A flag this does not know, or
 * one with nothing after it, is refused with the usage rather than read as the hub.
 */
function options(argv) {
    const { values, positionals } = parseArgs({
        args: argv,
        options: {
            from: { type: 'string', default: '' },
            'self-key': { type: 'string', default: 'axel-faes' },
            'self-name': { type: 'string', default: 'Axel Faes' },
            'self-role': { type: 'string', default: 'postdoc' },
            'self-affiliation': { type: 'string', default: 'university-of-twente' }
        },
        allowPositionals: true
    });
    const self = {
        key: values['self-key'],
        name: values['self-name'],
        role: values['self-role'],
        affiliations: [values['self-affiliation']]
    };
    return { hub: positionals[0], self, from: values.from };
}

let asked;
try {
    asked = options(process.argv.slice(2));
} catch {
    asked = { hub: undefined };
}
const { hub, self, from } = asked;
if (hub === undefined) {
    console.error(USAGE);
    process.exit(2);
}
if (from !== '' && !existsSync(from)) {
    console.error(`no such file: ${from}`);
    process.exit(2);
}
if (!existsSync(join(hub, SOURCE)) && !existsSync(join(hub, JOINT_WORK))) {
    console.error(`no ${SOURCE} and no ${JOINT_WORK} under ${hub}`);
    process.exit(2);
}
for (const said of migrate(hub, self, from)) console.log(said);
