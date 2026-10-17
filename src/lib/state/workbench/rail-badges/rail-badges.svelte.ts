// Layer 2, client state. Reactive view badges over the latest portfolio and socket feed payload,
// drawn in the view catalogue and on pane tabs.
// The snapshot summary remains the starting and read-error fallback until a usable feed arrives.
//
// Beside the words a tab draws, the store answers the counts themselves, as numbers: the parts the
// views give their rail button (a registration's `railPart`, which the rail sums), read from the
// same state the tab reads, so a tab and the rail never count one thing two ways.

import { scalar, isMap, numericSetting } from '../../../data/helpers/guards.ts';
import type { EntitiesStore } from '../../shared/stores/shapes.ts';
import type { FeedsStore, FeedState } from '../../feeds/feeds.svelte.ts';
import type { AuditStore } from '../../system/audit.svelte.ts';
import type { ProblemsStore } from '../../system/problems.svelte.ts';
import type { CalendarStore } from '../../life/calendar.svelte.ts';
import type { HpcStore } from '../../system/machine/hpc/hpc.svelte.ts';
import type { InboxStore } from '../../feeds/inbox.svelte.ts';
import { splitPosts } from '../../feeds/linkedin.ts';
import { needsInput, sessionRows } from '../../sessions/folds.ts';
import { findingsCount as listedFindings } from '../navigation/status.ts';
import { t } from '../../shared/words/text.ts';
import { statusTone, toneOf, UNKNOWN_TONE } from '../../shared/words/tones.ts';
import {
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    rollup,
    typeSplit
} from './rail-badges.ts';
import type { BoardItem, BoardPreset } from '../../boards/board/index.ts';
import type { Collection, GitState } from '../../../data/model/index.ts';

/** One coloured count drawn as a cell on a pane tab. `color` is a theme hue name. */
export type BadgeCell = { count: number; color: string; label: string };

/**
 * What one view gives its rail button: a count and the tone its tab's badge has, a hue name from
 * state/shared/words/tones.ts: an urgency tone (red, amber, green) where the view or `nav_live`'s
 * `tone:` sets one, else the hue of the statuses or the cell it counts, as the Funding count's
 * violet, or none.
 */
export type RailPart = { count: number; tone?: string };

/**
 * The cell of a board's tab whose count the board gives its rail button: for the Projects board,
 * whose cells are its types, the cell of a type key of `tab_split`; for a board split by
 * `tab_rollup`, the cell at a bucket's place in the board's list, counted from 0.
 */
export type RailCell = { type: string } | { bucket: number };

/** A socket feed with readable entries that can supply a badge count. */
function available(feed: FeedState | null): feed is FeedState {
    return feed?.ok === true && feed.error === undefined && feed.missing !== true;
}

/** A configured tone is a CSS custom-property fragment; missing or invalid values stay neutral. */
function splitTone(value: unknown): string {
    return typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value) ? value : UNKNOWN_TONE;
}

/** The glyph of the red mark a view badge draws when something it watches is past due. */
const OVERDUE_GLYPH = 'bang';

/** The hover text shared by a split strip and its compact badge. */
function cellsTitle(cells: BadgeCell[]): string {
    return cells
        .map((cell) => t('views.badge_cell', cell.label, cell.count))
        .join(t('views.badge_separator'));
}

/** The reactive view badges of one client. */
export type RailBadgesStore = {
    boardBadge: (view: string) => string;
    /** The count of one cell of a board's tab, found by `RailCell`, with the cell's tone. */
    boardPart: (view: string, cell: RailCell) => RailPart;
    collectionCount: (key: string) => number;
    inboxCount: () => number;
    applicationsCount: () => number;
    auditCount: () => number;
    problemsCount: () => number;
    repositoriesCount: () => number;
    /** The findings the Findings view lists. */
    findingsCount: () => number;
    /** The sessions the Session list draws as needing input, an archived one left out. */
    sessionInputCount: () => number;
    collectionBadge: (key: string) => string;
    collectionBadgeTone: (key: string) => string;
    collectionBadgeTitle: (key: string) => string;
    inboxBadge: () => string;
    leadsBadge: () => string;
    linkedinBadgeGlyph: () => string;
    applicationsBadge: () => string;
    auditBadge: () => string;
    problemsBadge: () => string;
    problemsBadgeTitle: () => string;
    repositoriesBadge: () => string;
    boardCells: (view: string) => BadgeCell[];
    queueCells: () => BadgeCell[];
    calendarCells: () => BadgeCell[];
    boardBadgeTitle: (view: string) => string;
    queueBadgeTitle: () => string;
    calendarBadgeTitle: () => string;
};

/**
 * What the badges read of the selectors: the configuration, one board by its preset, one
 * collection, and the repositories of the list with their states. The selectors store in
 * state/client, the folder above this one, satisfies it.
 */
export type BadgeSelectors = {
    configMap: () => Record<string, unknown>;
    boardPreset: (view: string) => BoardPreset;
    board: (preset: BoardPreset) => BoardItem[];
    collectionOf: (key: string) => Collection | null;
    /** The repositories of the Repositories list, each with the root that shows it. */
    repositories: () => readonly { shown: string }[];
    gitFor: (workspace: string) => GitState | null;
    /** The changes the apps' source controls count, summed. */
    appSourceCount: () => number;
};

export function createRailBadges(
    entities: EntitiesStore,
    feeds: FeedsStore,
    hpc: HpcStore,
    calendar: CalendarStore,
    inbox: InboxStore,
    audit: AuditStore,
    problems: Pick<ProblemsStore, 'total'>,
    selectors: BadgeSelectors
): RailBadgesStore {
    /** The number of cards on one of the four project boards. */
    function boardBadge(view: string): string {
        return String(selectors.board(selectors.boardPreset(view)).length);
    }

    /**
     * The count of the cell of a board's tab that `cell` names, 0 when the tab draws none: the
     * cell at the bucket's place for a rollup board, the cell whose label is the type key for the
     * Projects board, whose cells are labelled by their types.
     */
    function boardPart(view: string, cell: RailCell): RailPart {
        const cells = boardCells(view);
        const found =
            'bucket' in cell ? cells.at(cell.bucket) : cells.find((one) => one.label === cell.type);
        return found === undefined ? { count: 0 } : { count: found.count, tone: found.color };
    }

    /** The number of entries in one collection's configured `nav_live` status set. */
    function collectionCount(key: string): number {
        const collection = selectors.collectionOf(key);
        return liveEntries(collection?.entries ?? [], liveRule(selectors.configMap(), key));
    }

    function collectionBadge(key: string): string {
        return countText(collectionCount(key));
    }

    /** The configured urgency tone, or the first counted status's vocabulary tone. */
    function collectionBadgeTone(key: string): string {
        const rule = liveRule(selectors.configMap(), key);
        return rule?.tone ?? statusTone(rule?.match[0] ?? '');
    }

    /** A collection's live count followed by the label configured in `nav_live`. */
    function collectionBadgeTitle(key: string): string {
        return t(
            'views.badge_title',
            collectionBadge(key),
            liveRule(selectors.configMap(), key)?.label ?? ''
        );
    }

    /** Threads of the live plate awaiting an answer or an action, from the `inbox` channel. */
    function inboxBadge(): string {
        return countText(inbox.actionable());
    }

    /**
     * The findings the Findings view lists, the one count of those rows the status bar's item reads
     * too: the snapshot's, the config channel's and the apps channel's.
     */
    function findingsCount(): number {
        return listedFindings(entities.portfolio(), entities.config(), entities.apps());
    }

    /**
     * The sessions of the Session list in its "needs input" state, which the list draws for a live
     * session whose latest hook is a notification; an archived session is drawn as archived and
     * left out. The archived mark is the channel's: between an Archive press and the channel's
     * answer the list draws the press while this count reads the channel, and once the channel
     * gives the row the mark the list and the count agree.
     */
    function sessionInputCount(): number {
        const rows = sessionRows(entities.sessions()?.workspaces ?? []);
        return new Set(rows.filter((row) => needsInput(row) && !row.hidden).map((row) => row.id))
            .size;
    }

    /**
     * Position Leads due inside `leads_badge_days`, from the socket feed with the summary as
     * fallback.
     */
    function leadsBadge(): string {
        const fetched = feeds.feed('leads');
        const entries = available(fetched)
            ? fetched.entries
            : (entities.portfolio()?.entities.feeds.leads ?? []);
        return countText(
            leadsDue(
                entries as Record<string, unknown>[],
                numericSetting(selectors.configMap(), 'leads_badge_days'),
                Date.now()
            )
        );
    }

    /**
     * The glyph name of a red mark when the newest LinkedIn post is beyond `linkedin_cadence_days`.
     */
    function linkedinBadgeGlyph(): string {
        const fetched = feeds.feed('linkedin');
        const lastPost = available(fetched)
            ? (splitPosts(fetched.entries).posts[0]?.date ?? null)
            : (entities.portfolio()?.entities.feeds.linkedin?.lastPost ?? null);
        return linkedinOverdue(
            lastPost,
            numericSetting(selectors.configMap(), 'linkedin_cadence_days'),
            Date.now()
        )
            ? OVERDUE_GLYPH
            : '';
    }

    /** Active applications, which are urgent rather than a general `nav_live` rollup. */
    function applicationsCount(): number {
        const entries = selectors.collectionOf('applications')?.entries ?? [];
        return entries.filter(
            (entry) => scalar(entry.fields.status).trim().toLowerCase() === 'active'
        ).length;
    }

    /** Audit findings the reader has not parked, which is what the Audit view opens on. */
    function auditBadge(): string {
        return countText(audit.openCount());
    }

    /** Every problem of every source, as VS Code's Problems view counts them for its badge. */
    function problemsCount(): number {
        const { errors, warnings, infos } = problems.total();
        return errors + warnings + infos;
    }

    function problemsBadge(): string {
        return countText(problemsCount());
    }

    function problemsBadgeTitle(): string {
        return t('problems.badge_title', problemsCount());
    }

    /**
     * The changes of every repository the Repositories list holds, as VS Code's git.countBadge
     * "all" counts them: the held merge, staged, changes and untracked counts summed, so a file in
     * two groups counts twice and a list cut at 200 counts what git reported. A repository counts
     * once however many roots of the `git` channel lie in it, a root that is no repository adds
     * nothing, and a repository a Repositories tab closed still counts, since the closed list is
     * that tab's own. The counts the apps' source controls give are added.
     */
    function repositoriesCount(): number {
        let total = selectors.appSourceCount();
        for (const { shown } of selectors.repositories()) {
            const held = selectors.gitFor(shown);
            if (!held?.repository) continue;
            total += held.held.merge + held.held.staged + held.held.changes + held.held.untracked;
        }
        return total;
    }

    /** The types the Projects board's projects hold, in the vocabulary's configured type order. */
    function projectTypeOrder(): string[] {
        const preset = selectors.boardPreset('projects');
        const types = new Set(selectors.board(preset).map((item) => item.project.type));
        return preset.typeOrder.filter((type) => types.has(type));
    }

    /** The configured split cells for a board registration. */
    function boardCells(view: string): BadgeCell[] {
        const preset = selectors.boardPreset(view);
        const projects = selectors.board(preset).map((item) => item.project);
        if (view === 'projects') {
            const split = selectors.configMap().tab_split;
            return typeSplit(projects, projectTypeOrder()).map((cell) => ({
                ...cell,
                color: splitTone(isMap(split) ? split[cell.label] : undefined)
            }));
        }
        return rollup(projects, preset.rollup).map((cell) => ({
            ...cell,
            color: toneOf(cell.color)
        }));
    }

    /** The running and pending queue cells, using the matching vocabulary status colours. */
    function queueCells(): BadgeCell[] {
        const queue = hpc.counts();
        return [
            {
                count: queue.running,
                color: statusTone('active'),
                label: t('hpc.badge_running')
            },
            {
                count: queue.pending,
                color: statusTone('pending'),
                label: t('hpc.badge_pending')
            }
        ];
    }

    /** The one count the Calendar badge carries: today's events that have not ended. */
    function calendarCells(): BadgeCell[] {
        return [
            {
                count: calendar.remaining(),
                color: statusTone('active'),
                label: t('calendar.badge_today')
            }
        ];
    }

    /** Hover words for one board's split counts. */
    function boardBadgeTitle(view: string): string {
        return cellsTitle(boardCells(view));
    }

    /** Hover words for the running and pending queue counts. */
    function queueBadgeTitle(): string {
        return cellsTitle(queueCells());
    }

    /** Hover words for today's remaining events. */
    function calendarBadgeTitle(): string {
        return cellsTitle(calendarCells());
    }

    return {
        boardBadge,
        boardPart,
        collectionCount,
        inboxCount: () => inbox.actionable(),
        applicationsCount,
        auditCount: () => audit.openCount(),
        problemsCount,
        repositoriesCount,
        findingsCount,
        sessionInputCount,
        collectionBadge,
        collectionBadgeTone,
        collectionBadgeTitle,
        inboxBadge,
        leadsBadge,
        linkedinBadgeGlyph,
        applicationsBadge: () => countText(applicationsCount()),
        auditBadge,
        problemsBadge,
        problemsBadgeTitle,
        repositoriesBadge: () => countText(repositoriesCount()),
        boardCells,
        queueCells,
        calendarCells,
        boardBadgeTitle,
        queueBadgeTitle,
        calendarBadgeTitle
    };
}
