// Layer 1, data, pure. The roles of `roles:` in config/catalogs/vocab.yml, highest first, and the
// user's role on a project or a collection entry: the first row whose `field` holds the user, the
// person marked `self: true` (data/snapshot/hubs/self.ts), else the first row without a field when
// the record names people in any role's field, else none. Mine only keeps a record whose role
// fields hold the user, and a record that names no one. The project boards, the collection views
// (whose entries name people by key, read with `entryPeople` and `isSelfByKey`), the audit and the
// New project write read the roles through this module, so a role is decided by one rule.

import { z } from 'zod';
import type { Id, Person } from '../../model/index.ts';
import { keyOf } from '../../helpers/hub-names.ts';
import { readAs, rowsShape } from '../shapes.ts';
import { wordsShape } from './words.ts';

/**
 * One row of `roles:`: its key, its words, the field of a record it is read from, and whether a
 * Focus lane card leaves it off its tags (`unmarked: true`).
 */
export type Role = { key: string; label: string; field?: string; unmarked?: true };

/** One row as written: a key, with an optional label, field and `unmarked` flag. */
const roleShape = z.looseObject({ key: z.string().min(1) }).transform((row): Role => {
    const label = typeof row.label === 'string' && row.label !== '' ? row.label : row.key;
    const field = typeof row.field === 'string' && row.field !== '' ? row.field : undefined;
    return {
        key: row.key,
        label,
        ...(field === undefined ? {} : { field }),
        ...(row.unmarked === true ? { unmarked: true as const } : {})
    };
});

/** The rows of `roles:` in the merged config, highest first, each key once. */
export function rolesOf(config: Record<string, unknown>): Role[] {
    const rows = readAs(rowsShape(roleShape), config.roles) ?? [];
    const seen = new Set<string>();
    return rows.filter((row) => {
        if (seen.has(row.key)) return false;
        seen.add(row.key);
        return true;
    });
}

/**
 * The ids of the people marked `self: true`: the user, whom the key `self` of the primary hub's
 * `local.yml` names, or nobody.
 */
export function selfOf(people: readonly Pick<Person, 'id' | 'self'>[]): Set<Id> {
    return new Set(people.filter((one) => one.self === true).map((one) => one.id));
}

/** The fields the roles are read from, each once, in the roles' order. */
export function roleFields(roles: readonly Role[]): string[] {
    return [...new Set(roles.flatMap((role) => (role.field === undefined ? [] : [role.field])))];
}

/** The people a record names in one field, as the values `isSelf` is asked about. */
export type PeopleOf = (field: string) => readonly string[];

/** Whether a record names anyone in a field of the roles. */
function namesPeople(peopleOf: PeopleOf, roles: readonly Role[]): boolean {
    return roleFields(roles).some((field) => peopleOf(field).length > 0);
}

/**
 * The user's role on a record: the first row whose field holds a person `isSelf` answers true for,
 * else the first row without a field when the record names people, else none, which is also the
 * answer for a record that names no one.
 */
export function roleOf(
    peopleOf: PeopleOf,
    roles: readonly Role[],
    isSelf: (person: string) => boolean
): Role | undefined {
    const held = roles.find(
        (role) => role.field !== undefined && peopleOf(role.field).some(isSelf)
    );
    if (held !== undefined) return held;
    if (!namesPeople(peopleOf, roles)) return undefined;
    return roles.find((role) => role.field === undefined);
}

/**
 * Whether a record carries the Lead badge: the field of the highest role with a field (`lead` in
 * oculus's own vocab.yml) holds the user.
 */
export function isLead(
    peopleOf: PeopleOf,
    roles: readonly Role[],
    isSelf: (person: string) => boolean
): boolean {
    const first = roles.find((role) => role.field !== undefined)?.field;
    return first !== undefined && peopleOf(first).some(isSelf);
}

/**
 * Whether Mine only keeps a record: one of its role fields holds the user, or it names no one.
 */
export function isMine(
    peopleOf: PeopleOf,
    roles: readonly Role[],
    isSelf: (person: string) => boolean
): boolean {
    const fields = roleFields(roles);
    return !namesPeople(peopleOf, roles) || fields.some((field) => peopleOf(field).some(isSelf));
}

/**
 * The field a new record made on a board names the user in: the field of the first of the
 * board's roles, in the board's order, that has one, and none when no such role has a field.
 */
export function selfField(roles: readonly Role[], keys: readonly string[]): string | undefined {
    for (const key of keys) {
        const field = roles.find((role) => role.key === key)?.field;
        if (field !== undefined) return field;
    }
    return undefined;
}

/** The people a collection entry names in a field: the keys of its list, or of its one text. */
export function entryPeople(fields: Record<string, unknown>): PeopleOf {
    return (field) => readAs(wordsShape, fields[field]) ?? [];
}

/** Whether a person a collection entry names, by key, is one of the user's ids. */
export function isSelfByKey(self: ReadonlySet<Id>): (person: string) => boolean {
    const keys = new Set([...self].map(keyOf));
    return (person) => keys.has(keyOf(person));
}

/**
 * Whether a collection's `schema:` declares a field one of the roles is read from, which is what
 * makes it draw the Mine only toggle, the Lead badge and the Role facet.
 */
function declaresRoles(
    schema: readonly { field: string }[] | undefined,
    roles: readonly Role[]
): boolean {
    const fields = roleFields(roles);
    return (schema ?? []).some((one) => fields.includes(one.field));
}

/** One value of the Role facet: a role and how many records the user holds it on. */
type RoleCount = { key: string; label: string; count: number };

/**
 * The Role facet over a set of records: every row of `roles:`, the row without a field included,
 * each with the number of records whose role (`roleOf`) it is.
 */
function roleCounts(
    records: readonly PeopleOf[],
    roles: readonly Role[],
    isSelf: (person: string) => boolean
): RoleCount[] {
    const held = records.map((record) => roleOf(record, roles, isSelf)?.key);
    return roles.map((role) => ({
        key: role.key,
        label: role.label,
        count: held.filter((key) => key === role.key).length
    }));
}

/**
 * Whether a record is kept by the Mine only toggle and the Role facet: with `mine`, only what
 * `isMine` keeps, and with roles picked, only a record whose role is one of them.
 */
function roleKeeps(
    record: PeopleOf,
    roles: readonly Role[],
    isSelf: (person: string) => boolean,
    filter: { mine: boolean; picked: readonly string[] }
): boolean {
    if (filter.mine && !isMine(record, roles, isSelf)) return false;
    if (filter.picked.length === 0) return true;
    const role = roleOf(record, roles, isSelf)?.key;
    return role !== undefined && filter.picked.includes(role);
}

/** A record of a collection as the roles read it: its fields. */
type Fielded = { fields: Record<string, unknown> };

/** What a collection view draws of the roles, over the files of one collection key. */
type EntryRoles = {
    /**
     * Whether the Mine only toggle, the Role facet and the Lead badge are drawn: a person is
     * marked as the user and a file's `schema:` declares a field of a role.
     */
    drawn: boolean;
    /** The Role facet over every entry, each row of `roles:` with its count; [] when not drawn. */
    facet: RoleCount[];
    /** Whether the Mine only toggle and the Role facet keep an entry; every one when not drawn. */
    keeps: (entry: Fielded) => boolean;
    /** The key of the row of `roles:` an entry is at for the user, none when not drawn. */
    role: (entry: Fielded) => string | undefined;
    /** Whether an entry carries the Lead badge; none when not drawn. */
    lead: (entry: Fielded) => boolean;
};

/**
 * The roles of a collection view: the merged config's `roles:`, the schemas of the collection's
 * files, the user's ids, every entry, and the toggle's and the facet's state.
 */
export function entryRoles(
    config: Record<string, unknown>,
    schemas: readonly (readonly { field: string }[] | undefined)[],
    self: ReadonlySet<Id>,
    entries: readonly Fielded[],
    filter: { mine: boolean; picked: readonly string[] }
): EntryRoles {
    const roles = rolesOf(config);
    const isSelf = isSelfByKey(self);
    const drawn = self.size > 0 && schemas.some((schema) => declaresRoles(schema, roles));
    if (!drawn) {
        return { drawn, facet: [], keeps: () => true, role: () => undefined, lead: () => false };
    }
    const people = (entry: Fielded): PeopleOf => entryPeople(entry.fields);
    return {
        drawn,
        facet: roleCounts(entries.map(people), roles, isSelf),
        keeps: (entry) => roleKeeps(people(entry), roles, isSelf, filter),
        role: (entry) => roleOf(people(entry), roles, isSelf)?.key,
        lead: (entry) => isLead(people(entry), roles, isSelf)
    };
}
