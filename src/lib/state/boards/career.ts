// Layer 2, client state. The Career banner's arithmetic: the days left to the next milestone, and
// the track record, the user's projects counted by the record rows of `categories:` for each role,
// and the funding the user leads that was obtained.
//
// Pure over the snapshot, the merged config and the day the caller passes. A project's category and
// role are read with the boards' own rule (data/shapes/boards/categories.ts `categoryOf`, takes.ts
// `projectRole`), so the track record counts a project where every board files it. A role's row
// opens the track record's board for that role, whose rule takes a project by the same two
// readings (state/boards/board/presets.ts `recordPreset`, takes.ts `boardTakes`), so its sections
// hold the counts the row shows. The words come from the catalog through `t`, and a category's and
// a role's words from their rows.

import type { Id, Snapshot } from '../../data/model/index.ts';
import { categoriesOf, categoryOf } from '../../data/shapes/boards/categories.ts';
import { entryPeople, isLead, isSelfByKey, rolesOf } from '../../data/shapes/boards/roles.ts';
import { projectRole } from '../../data/shapes/boards/takes.ts';
import { registryEntries, rootOf } from '../../data/helpers/hub-names.ts';
import { str } from '../../data/helpers/guards.ts';
import { wordFlag, type WordsOf } from '../../data/shapes/vocab-keys.ts';
import { daysUntil } from './board/index.ts';
import { selfIds } from './board/team.ts';
import { t } from '../shared/words/text.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the model type the
// career banner names reaches it from here.
export type { Career } from '../../data/model/index.ts';

/**
 * The days left to a day written YYYY-MM-DD, in words: `in 1 day` and `in {0} days` before the day,
 * `today` on it, `1 day ago` and `{0} days ago` after it, counted from `now` with `daysUntil`; the
 * empty text for a value that is no day.
 */
export function daysLeft(date: string, now: number): string {
    const days = daysUntil(date, now);
    if (days === null) return '';
    if (days === 1) return t('focus.career_in_day');
    if (days > 1) return t('focus.career_in_days', days);
    if (days === 0) return t('focus.today');
    if (days === -1) return t('focus.career_day_ago');
    return t('focus.career_days_ago', -days);
}

/** One line of a role's track record: a record row of `categories:` and its count. */
type RecordLine = { key: string; label: string; count: number };

/** The track record of one role: the role's words and one line per record row, in order. */
type RoleRecord = { key: string; label: string; lines: RecordLine[] };

/**
 * The track record: the roles that have a project in a record row, each with its lines, and how
 * many funding entries the user leads whose status carries `obtained`.
 */
export type TrackRecord = { roles: RoleRecord[]; funding: number };

/**
 * The track record of the user, the person marked `self: true`, over every project and every
 * funding entry of the snapshot, which holds every hub of the workspace; the funding entries are
 * those of each hub's collection whose entry names the `funding` registry. For each role of
 * `roles:` that has a field, in the roles' order, one line per row of `categories:` carrying
 * `record: true`, in the list's order, each with the number of projects whose category
 * (`categoryOf`) is that row and whose role (`projectRole`) is that role; a role with no project
 * in any record row gives no lines, and the counts are never summed. The funding count is the
 * funding entries whose highest role field (`lead` in oculus's own vocab.yml) names the user
 * (`isLead`, by key) and whose status carries `obtained` in `statuses`, compared trimmed and in
 * lower case (`wordFlag`). Null when no `self` is set, and when no role has a line and no funding
 * is obtained. The roles and the rows are those of every hub's words, and a project or an entry is
 * filed under the words of its own hub when `wordsOf` gives them, under `config` otherwise.
 */
export function trackRecord(
    snapshot: Snapshot | null,
    config: Record<string, unknown>,
    wordsOf: WordsOf = () => config
): TrackRecord | null {
    if (snapshot === null) return null;
    const self: ReadonlySet<Id> = selfIds(snapshot);
    if (self.size === 0) return null;
    const union = wordsOf();
    const rows = categoriesOf(union).filter((category) => category.record);
    const roles = rolesOf(union);
    const filed = Object.values(snapshot.entities.projects).map((project) => {
        const words = wordsOf(rootOf(project));
        return {
            category: categoryOf(project, categoriesOf(words), words)?.key,
            role: projectRole(project, rolesOf(words), self)?.key
        };
    });
    const held = roles
        .filter((role) => role.field !== undefined)
        .map((role): RoleRecord => ({
            key: role.key,
            label: role.label,
            lines: rows.map((row) => ({
                key: row.key,
                label: row.label,
                count: filed.filter((one) => one.role === role.key && one.category === row.key)
                    .length
            }))
        }))
        .filter((role) => role.lines.some((line) => line.count > 0));
    const isSelf = isSelfByKey(self);
    const funding = registryEntries(snapshot.entities.collections, 'funding').filter((entry) => {
        const words = wordsOf(rootOf(entry));
        return (
            isLead(entryPeople(entry.fields), rolesOf(words), isSelf) &&
            wordFlag(words, 'statuses', str(entry.fields.status) ?? '', 'obtained')
        );
    }).length;
    return held.length === 0 && funding === 0 ? null : { roles: held, funding };
}
