// Layer 1, data. The user, marked once over the merged portfolio of a workspace's hubs: the person
// the key `self` of the primary hub's `.oculus/local.yml` names (data/sources/config/local.ts, read
// from the primary's file alone by machine.ts), resolved from the primary hub as every reference
// is (`resolveKey` of helpers/hub-names.ts): the primary's person of that key, else the person of
// the one other hub that holds it. That person carries `self: true` and nobody else does, so every
// reader of the user reads the mark and never the setting.
//
// A key no hub holds, and a key two or more hubs other than the primary hold, mark nobody and are
// one finding on the primary's `local.yml` at the key `self`, the second naming those hubs in the
// workspace's order. An empty key, a workspace with no primary and a people file of any hub that
// did not read give no finding: the file that did not read has its own.

import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { holdersOf, resolveKey, rootOf } from '../../helpers/hub-names.ts';
import type { Person, Snapshot } from '../../model/index.ts';
import { sortFindings } from '../validate.ts';

/** What the mark is made from besides the merged portfolio. */
export type SelfSetting = {
    /** The name of the primary hub, null for a workspace with none. */
    primary: string | null;
    /** The key `self` of the primary's `local.yml`, empty when it names nobody. */
    key: string;
    /** The primary's `local.yml`, which a finding about the key is raised on. */
    file: string;
    /**
     * Whether the people file of every hub read, so a key no hub holds is known to be held by none.
     */
    read: boolean;
    /** The names of the workspace's folders in its order, which a finding names the hubs in. */
    order: readonly string[];
};

/** The people of the merge in the workspace's folder order of their hubs, a hub outside it last. */
function inOrder(people: readonly Person[], order: readonly string[]): Person[] {
    const place = (one: Person): number => {
        const at = order.indexOf(rootOf(one));
        return at < 0 ? order.length : at;
    };
    return [...people].sort((one, other) => place(one) - place(other));
}

/** The merged portfolio with the user marked, or with the one finding the key gives. */
export function markSelf(snapshot: Snapshot, setting: SelfSetting, text: TextCatalog): Snapshot {
    const { primary, key } = setting;
    if (primary === null || key === '') return snapshot;
    const people = snapshot.entities.people;
    const found = resolveKey(
        holdersOf(inOrder(Object.values(people), setting.order)),
        primary,
        key
    );
    if (found !== null && 'id' in found) {
        const user = { ...people[found.id], self: true };
        const entities = { ...snapshot.entities, people: { ...people, [found.id]: user } };
        return { ...snapshot, entities };
    }
    if (!setting.read) return snapshot;
    const message =
        found === null
            ? findingText(text, 'findings.validate.self_unknown', key)
            : findingText(text, 'findings.validate.self_ambiguous', key, found.hubs.join(', '));
    const finding = { file: setting.file, key: 'self', message };
    return { ...snapshot, findings: sortFindings([...snapshot.findings, finding]) };
}
