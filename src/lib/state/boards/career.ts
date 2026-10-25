// Layer 2, client state. The Career banner's arithmetic: the Next line, the next milestone with its
// day and the days left to it, and the track record, the user's projects counted by the record rows
// of `categories:` for each role, and the funding the user leads that was obtained, with the table
// the banner draws it as.
//
// Pure over the snapshot, the merged config and the day the caller passes. A project's category
// and role are read with the boards' own rule (data/shapes/boards/categories.ts `categoryOf`,
// takes.ts `projectRole`), so the track record counts a project where every board files it. The
// words come from the catalog through `t`, and a category's and a role's words from their rows.

import type { Career, Id, Snapshot } from '../../data/model/index.ts';
import { categoriesOf, categoryOf } from '../../data/shapes/boards/categories.ts';
import { entryPeople, isLead, isSelfByKey, rolesOf } from '../../data/shapes/boards/roles.ts';
import { projectRole } from '../../data/shapes/boards/takes.ts';
import { joinedEntries, rootOf } from '../../data/helpers/hub-names.ts';
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
function daysLeft(date: string, now: number): string {
    const days = daysUntil(date, now);
    if (days === null) return '';
    if (days === 1) return t('focus.career_in_day');
    if (days > 1) return t('focus.career_in_days', days);
    if (days === 0) return t('focus.today');
    if (days === -1) return t('focus.career_day_ago');
    return t('focus.career_days_ago', -days);
}

/**
 * The banner's Next line: the milestone, its day and the days left to it, `<milestone> on <day>,
 * in 24 days`; the milestone alone when the file gives no day, and the empty text when it gives no
 * milestone. The milestone is kept as written, so a web address in it is drawn as a link.
 */
export function nextLine(career: Pick<Career, 'milestone' | 'milestoneDate'>, now: number): string {
    const { milestone, milestoneDate } = career;
    if (milestone === undefined) return '';
    if (milestoneDate === undefined) return milestone;
    const left = daysLeft(milestoneDate, now);
    return left === '' ? milestone : t('focus.career_next_line', milestone, milestoneDate, left);
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
 * The track record of the user the workspace setting `self` names, over every project and every
 * funding entry of the snapshot, which holds every hub of the workspace. For each role of `roles:`
 * that has a field, in the roles' order, one line per row of `categories:` carrying `record: true`,
 * in the list's order, each with the number of projects whose category (`categoryOf`) is that row
 * and whose role (`projectRole`) is that role; a role with no project in any record row gives no
 * lines, and the counts are never summed. The funding count is the funding entries whose highest
 * role field (`lead` in oculus's own vocab.yml) names the user (`isLead`, by key) and whose status
 * carries `obtained` in `statuses`, compared trimmed and in lower case (`wordFlag`). Null when no
 * `self` is set, and when no role has a line and no funding is obtained. The roles and the rows
 * are those of every hub's words, and a project or an entry is filed under the words of its own hub
 * when `wordsOf` gives them, under `config` otherwise.
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
    const funding = joinedEntries(snapshot.entities.collections, 'funding').filter((entry) => {
        const words = wordsOf(rootOf(entry));
        return (
            isLead(entryPeople(entry.fields), rolesOf(words), isSelf) &&
            wordFlag(words, 'statuses', str(entry.fields.status) ?? '', 'obtained')
        );
    }).length;
    return held.length === 0 && funding === 0 ? null : { roles: held, funding };
}

/**
 * One column of the track record's table: the key its cells are read at in a row, its heading,
 * and whether it holds counts. The shape of ui/display/table/table-rows.ts `Column`, which the
 * banner draws it with.
 */
type RecordColumn = { key: string; label: string; numeric?: boolean };

/** The track record as a table: its columns and its rows, each row's cells by column key. */
type RecordTable = {
    columns: RecordColumn[];
    rows: Record<string, string | number>[];
    /** The key of the cell that tells the rows apart, a row's place in the table. */
    rowKey: string;
};

/** The key of the column of the rows' words, the role's label or Funding obtained. */
const LABEL = 'label';

/** The key of the one count column of a table with no role row, whose heading is empty. */
const COUNT = 'count';

/** The key a record row's column is read at, apart from LABEL, COUNT and the row key. */
const recordKey = (key: string): string => `record:${key}`;

/** The key of a row's place, which tells two rows apart whatever their words. */
const AT = 'at';

/**
 * The track record as the banner's table: a first column of the rows' words with an empty heading,
 * then one column per record row of `categories:` that any role has a project in, in the list's
 * order, headed by its label; one row per role, its label and its count in each column, then, when
 * funding is obtained, a row Funding obtained with its count in the first count column and the
 * other cells blank. With no role row the table holds one count column with an empty heading and
 * the Funding obtained row alone. Every role's lines name the same record rows in the same order
 * (`trackRecord`), so the first role's give the columns.
 */
export function recordTable(record: TrackRecord): RecordTable {
    const lines = record.roles.at(0)?.lines ?? [];
    const kept = lines.filter((line) =>
        record.roles.some((role) => role.lines.some((one) => one.key === line.key && one.count > 0))
    );
    const counts: RecordColumn[] =
        kept.length === 0
            ? [{ key: COUNT, label: '', numeric: true }]
            : kept.map((line) => ({ key: recordKey(line.key), label: line.label, numeric: true }));
    const first = kept.at(0);
    const fundingKey = first === undefined ? COUNT : recordKey(first.key);
    const rows: Record<string, string | number>[] = record.roles.map((role) => {
        const row: Record<string, string | number> = { [LABEL]: role.label };
        for (const line of role.lines) {
            if (kept.some((one) => one.key === line.key)) row[recordKey(line.key)] = line.count;
        }
        return row;
    });
    if (record.funding > 0) {
        rows.push({ [LABEL]: t('focus.career_funding_row'), [fundingKey]: record.funding });
    }
    return {
        columns: [{ key: LABEL, label: '' }, ...counts],
        rows: rows.map((row, at) => ({ ...row, [AT]: String(at) })),
        rowKey: AT
    };
}
