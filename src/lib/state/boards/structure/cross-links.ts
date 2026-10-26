// Layer 2, client state. The projects that name one entry of a collection, grouped as the
// portfolio groups projects everywhere (in flight, done, ideas), and the live projects no funding
// scheme covers, which the Funding tab draws as one card. Pure joins of the snapshot, like the
// Pillars and Domains joins beside it, so they are checked without a browser. A project's stage and
// chips are read under the words of its own hub when the caller gives them (`wordsOf`).

import { z } from 'zod';
import { anyWord, hasWord, wordNumber, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { bareId, holdersOf, resolvedId, rootOf } from '../../../data/helpers/hub-names.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import type { Collection, Entry, Person, Project } from '../../../data/model/index.ts';
import { teamOf } from '../board/team.ts';
import { listWords } from '../collection/index.ts';

/** A string and nothing else, for the person a joint work's entry names. */
const stringShape = z.string();

/** One member of a cross-link group. Its project stage remains visible inside the broader group. */
type CrossMember = { id: string; label: string; stage: string };

/** One of the three cross-link groups the portfolio uses everywhere. */
export type CrossGroup = {
    type: 'in-flight' | 'ideas' | 'done';
    count: number;
    members: CrossMember[];
    warn: boolean;
};

/** The word a cross-link member is filed under: the project's own `stage:`, else the empty word. */
function stageOf(project: Project): string {
    return project.stage ?? '';
}

/**
 * The projects that name one entry, grouped by stage with a count each.
 *
 * Which projects those are is the collection's own question and has three answers: an entry of the
 * collection whose entry names the `funding` registry is a scheme, named by the manifests'
 * `funding:` tags; an entry of a collection flagged `joint_work` is a joint work, named by the
 * projects whose team (`lead:`, `collaborators:` and `supervisors:`, state/boards/board/team.ts)
 * holds its person; and every other collection has no project-side inverse, so it is the entry's
 * own `related:` list of keys. `collection` is the collection of the entry's own hub that holds
 * it, none when the snapshot holds no such collection. A key of the entry's file names the record
 * its hub resolves it to, the entry's own hub first, then the one other hub that holds it
 * (`resolvedId`); `people` are the people of the snapshot, which a joint work's person is resolved
 * among. A related key no project of the snapshot resolves is left out rather than drawn as a dead
 * link. Each project is grouped under its own hub's words when `wordsOf` gives them
 * (`groupProjects`).
 */
export function crossLinks(
    entry: Entry,
    collection: Pick<Collection, 'registry' | 'joint_work'> | undefined,
    projects: Project[],
    people: readonly Person[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): CrossGroup[] {
    let named: Project[];
    if (collection?.registry === 'funding') {
        named = projects.filter((project) => project.fundingIds.includes(entry.id));
    } else if (collection?.joint_work === true) {
        const own = readAs(stringShape, entry.fields.person);
        const key = own ?? bareId(entry);
        const person = resolvedId(holdersOf(people), rootOf(entry), key);
        named = projects.filter((project) => person !== null && teamOf(project).includes(person));
    } else {
        const held = holdersOf(projects);
        named = listWords(entry.fields.related)
            .map((key) => resolvedId(held, rootOf(entry), key))
            .map((id) => projects.find((project) => project.id === id))
            .filter((project): project is Project => project !== undefined);
    }
    return groupProjects(named, config, wordsOf);
}

/** The cross-link group of a stage, read from its flags in `stages`; null for a stage in none. */
function groupOf(stage: string, config: Record<string, unknown>): CrossGroup['type'] | null {
    if (wordNumber(config, 'stages', 'dead', stage) !== null) return null;
    if (hasWord(config, 'stages', 'live', stage)) return 'in-flight';
    if (hasWord(config, 'stages', 'idea', stage)) return 'ideas';
    if (hasWord(config, 'stages', 'terminal', stage)) return 'done';
    return null;
}

/**
 * Projects in the in-flight, done and ideas groups, in that order and by project id within each,
 * read from the stage's flags in `stages` on every tier: a stage carrying `live` is in flight,
 * flagged when one of the group's projects carries a chip carrying `blocked` in `chips`; one
 * carrying `idea` is an idea; one carrying `terminal` is done. A project at a stage carrying a
 * `dead` number, or at a stage in none of the three, is left out. A project's stage and chips are
 * read under its own hub's words when `wordsOf` gives them, under `config` otherwise.
 */
export function groupProjects(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): CrossGroup[] {
    const at = (project: Project): Record<string, unknown> => wordsOf?.(rootOf(project)) ?? config;
    const grouped: Record<CrossGroup['type'], CrossMember[]> = {
        'in-flight': [],
        done: [],
        ideas: []
    };
    for (const project of [...projects].sort((a, b) => a.id.localeCompare(b.id))) {
        const stage = stageOf(project);
        const group = groupOf(stage, at(project));
        if (group === null) continue;
        const short = project.short?.trim() ?? '';
        grouped[group].push({
            id: project.id,
            label: short === '' ? project.title : short,
            stage
        });
    }
    return (['in-flight', 'done', 'ideas'] as const)
        .filter((type) => grouped[type].length > 0)
        .map((type) => ({
            type,
            count: grouped[type].length,
            members: grouped[type],
            warn:
                type === 'in-flight' &&
                projects.some(
                    (project) =>
                        grouped['in-flight'].some((member) => member.id === project.id) &&
                        anyWord(at(project), 'chips', 'blocked', project.chips)
                )
        }));
}

/**
 * The projects whose stage carries `live` in `stages` (the work in flight) no funding scheme of
 * the file covers, which is the Funding tab's one synthetic card. A project naming a scheme the
 * file does not hold is not covered by it, so the schemes are the file's own keys rather than
 * whatever a manifest happens to name. A project's stage is read under its own hub's words when
 * `wordsOf` gives them.
 */
function noFunding(
    projects: Project[],
    schemes: string[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return projects.filter(
        (project) =>
            hasWord(wordsOf?.(rootOf(project)) ?? config, 'stages', 'live', project.stage) &&
            !project.fundingIds.some((id) => schemes.includes(id))
    );
}

/** The live projects no entry of the funding file covers, the file's entries handed in whole. */
export function unfundedBy(
    projects: Project[],
    entries: readonly Entry[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return noFunding(
        projects,
        entries.map((entry) => entry.id),
        config,
        wordsOf
    );
}

/** One cross-link group's members by their own project stage, in the order the members are in. */
export function membersByStage(
    group: CrossGroup
): { stage: string; members: CrossGroup['members'] }[] {
    const held = new Map<string, CrossGroup['members']>();
    for (const member of group.members) {
        const found = held.get(member.stage);
        if (found === undefined) held.set(member.stage, [member]);
        else found.push(member);
    }
    return [...held].map(([stage, members]) => ({ stage, members }));
}
