// Layer 2, client state. Reactive view badges over the latest portfolio and socket feed payload,
// drawn in the view catalogue and on pane tabs.
// The snapshot summary remains the starting and read-error fallback until a usable feed arrives.
//
// Beside the words a tab draws, the store answers the counts themselves, as numbers: the count
// each view draws (a registration's `countPart`), read from the same state the tab reads, so a
// tab and the rail never count one thing two ways. Whether a view's tabs draw its count and
// whether the rail sums it is the view's row of `counts` in config/defaults/layout.yml
// (`countFlags`): the rail sums the views whose row says `rail: true`, Talks & Events among them,
// and no list of views in code decides it.

import { focusSetting } from '../../../data/helpers/guards.ts';
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
import type { RegistryStore } from '../navigation/registry.ts';
import { t } from '../../shared/words/text.ts';
import { statusTone, toneOf } from '../../shared/words/tones.ts';
import { countRow, countText, leadsDue, linkedinOverdue, matchedEntries } from './rail-badges.ts';
import { railCount } from '../../../data/shapes/boards/categories.ts';
import type { BoardItem, BoardPreset } from '../../boards/board/index.ts';
import { stagedEntries } from '../../boards/focus/focus-lanes.ts';
import type { Collection, GitState } from '../../../data/model/index.ts';
import type { WordsOf } from '../../../data/shapes/vocab-keys.ts';

/** One coloured count drawn as a cell on a pane tab. `color` is a theme hue name. */
export type BadgeCell = { count: number; color: string; label: string };

/**
 * The count one view draws, as a number, and the tone its tab's badge has, a hue name from
 * state/shared/words/tones.ts: an urgency tone (red, amber, green) where the view or its `counts`
 * row's `tone:` sets one, else the hue of the statuses or the cell it counts, as the Funding
 * count's violet, or none. The rail sums it when the view's row says so.
 */
export type RailPart = { count: number; tone?: string };

/** Where a view's count is drawn: on its tabs and catalogue entry, and in the rail's sum. */
type CountFlags = { tab: boolean; rail: boolean };

/** A socket feed with readable entries that can supply a badge count. */
function available(feed: FeedState | null): feed is FeedState {
    return feed?.ok === true && feed.error === undefined && feed.missing !== true;
}

/** The glyph of the red mark a view badge draws when something it watches is past due. */
const OVERDUE_GLYPH = 'bang';

/** The hover text shared by a split strip and its compact badge. */
function cellsTitle(cells: BadgeCell[]): string {
    return cells
        .map((cell) => t('views.badge_cell', cell.label, cell.count))
        .join(t('views.badge_separator'));
}

/**
 * The cells of a tab summed into one part, in the tone of the first cell that counts anything, so
 * Live HPC's part takes the running tone while a job runs and the pending tone while jobs only
 * wait.
 */
function cellsPart(cells: BadgeCell[]): RailPart {
    const count = cells.reduce((sum, cell) => sum + cell.count, 0);
    const first = cells.find((cell) => cell.count > 0);
    return first === undefined ? { count } : { count, tone: first.color };
}

/** The reactive view badges of one client. */
export type RailBadgesStore = {
    /** Where one view's count is drawn, from its row of `counts`; nowhere for a view with none. */
    countFlags: (view: string) => CountFlags;
    boardBadge: (view: string) => string;
    /**
     * The count a board gives the rail: its projects in the rows of `categories` carrying
     * `rail: true`, in the tone of the colour `rail_color` gives, and 0 when it has none there.
     */
    boardRail: (view: string) => RailPart;
    collectionCount: (key: string) => number;
    inboxCount: () => number;
    /** The open entries of the collection `key`, one flagged `open_badge`. */
    openCount: (key: string) => number;
    auditCount: () => number;
    problemsCount: () => number;
    repositoriesCount: () => number;
    /** The findings the Findings view lists. */
    findingsCount: () => number;
    /** The sessions the Session list draws as needing input, an archived one left out. */
    sessionInputCount: () => number;
    /** The Position Leads due inside the `days` of their `counts` row, the Leads tab's count. */
    leadsCount: () => number;
    /** Today's events that have not ended, in the tone of the Calendar tab's cell. */
    calendarPart: () => RailPart;
    /** The running and pending jobs Live HPC's tab draws, summed, by `cellsPart`. */
    queuePart: () => RailPart;
    collectionBadge: (key: string) => string;
    collectionBadgeTone: (key: string) => string;
    collectionBadgeTitle: (key: string) => string;
    inboxBadge: () => string;
    leadsBadge: () => string;
    linkedinBadgeGlyph: () => string;
    /** The count of `openCount` as the badge draws it. */
    openBadge: (key: string) => string;
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
 * collection, the collections of one key with the words of each hub, and the repositories of the
 * list with their states. The selectors store in state/client, the folder above this one,
 * satisfies it.
 */
export type BadgeSelectors = {
    configMap: () => Record<string, unknown>;
    boardPreset: (view: string) => BoardPreset;
    board: (preset: BoardPreset) => BoardItem[];
    collectionOf: (key: string) => Collection | null;
    /** The collections of one key across the hubs, the primary hub's first. */
    collectionsOfKey: (key: string) => Collection[];
    /** The words a record of a hub is read under, and every hub's words for none. */
    vocabOf: WordsOf;
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
    selectors: BadgeSelectors,
    registry: Pick<RegistryStore, 'refused'>
): RailBadgesStore {
    /** Where one view's count is drawn: its `counts` row's `tab` and `rail`, false without one. */
    function countFlags(view: string): CountFlags {
        const row = countRow(selectors.configMap(), view);
        return { tab: row?.tab ?? false, rail: row?.rail ?? false };
    }

    /** The number of cards on one of the project boards. */
    function boardCount(view: string): number {
        return selectors.board(selectors.boardPreset(view)).length;
    }

    /**
     * The count a board gives the rail: its projects in the rows of `categories` of their own hub's
     * words carrying `rail: true` (`railCount`), in the tone of the colour `rail_color` gives: in
     * the words of the board's hub for a board naming `hub:`, whose projects are all of that hub,
     * and in the merged config otherwise; 0, drawn as no count, when none of its projects is in
     * such a row.
     */
    function boardRail(view: string): RailPart {
        const preset = selectors.boardPreset(view);
        const projects = selectors.board(preset).map((item) => item.project);
        const hub = preset.rule.hub;
        const rail = railCount(
            projects,
            preset.categories,
            hub === null ? preset.config : preset.words(hub).config,
            (root) => preset.words(root).config
        );
        return rail.color === ''
            ? { count: rail.count }
            : { count: rail.count, tone: toneOf(rail.color) };
    }

    /** The number of entries of one collection whose status is one of its `counts` row's match. */
    function collectionCount(key: string): number {
        const collection = selectors.collectionOf(key);
        const match = countRow(selectors.configMap(), key)?.match ?? [];
        return matchedEntries(collection?.entries ?? [], match);
    }

    function collectionBadge(key: string): string {
        return countText(collectionCount(key));
    }

    /** The row's urgency tone, or the vocabulary tone of the first status the row counts. */
    function collectionBadgeTone(key: string): string {
        const row = countRow(selectors.configMap(), key);
        if (row !== null && row.tone !== '') return row.tone;
        return statusTone(row?.match[0] ?? '');
    }

    /** A collection's count followed by the label its `counts` row gives. */
    function collectionBadgeTitle(key: string): string {
        const label = countRow(selectors.configMap(), key)?.label ?? '';
        return t('views.badge_title', collectionBadge(key), label);
    }

    /** Threads of the live plate awaiting an answer or an action, from the `inbox` channel. */
    function inboxBadge(): string {
        return countText(inbox.actionable());
    }

    /**
     * The findings the Findings view lists, the one count of those rows the status bar's item reads
     * too: the snapshot's, the config channel's, the apps channel's and the page's own (the
     * registry's `refused`).
     */
    function findingsCount(): number {
        return listedFindings(entities.portfolio(), entities.config(), entities.apps(), {
            findings: registry.refused()
        });
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
     * Position Leads due inside the `days` of the `leads` row of `counts`, from the socket feed
     * with the summary as fallback; none without the row or its days.
     */
    function leadsCount(): number {
        const fetched = feeds.feed('leads');
        const entries = available(fetched)
            ? fetched.entries
            : (entities.portfolio()?.entities.feeds.leads ?? []);
        return leadsDue(
            selectors.configMap(),
            entries as Record<string, unknown>[],
            countRow(selectors.configMap(), 'leads')?.days ?? null,
            Date.now()
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
            focusSetting(selectors.configMap(), 'linkedin_cadence_days'),
            Date.now()
        )
            ? OVERDUE_GLYPH
            : '';
    }

    /**
     * The entries of the collection `key` of every hub, one flagged `open_badge`, that a stage of
     * `position_stages` holds, read by each hub's own words as the Focus band's positions column
     * reads them (`stagedEntries`), which are urgent rather than a count of a `counts` row's
     * `match`. An entry two stages hold is counted once, and the Focus filter narrows nothing here.
     */
    function openCount(key: string): number {
        const stages = stagedEntries(
            selectors.collectionsOfKey(key),
            'position_stages',
            selectors.configMap(),
            selectors.vocabOf
        );
        return new Set(stages.flatMap((stage) => stage.held.map((one) => one.entry))).size;
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

    /**
     * The cells of a board's tab: the count of each row of `categories` that holds at least one of
     * its cards, in the list's order, in the row's tone.
     */
    function boardCells(view: string): BadgeCell[] {
        const preset = selectors.boardPreset(view);
        const items = selectors.board(preset);
        return preset.categories.flatMap((category) => {
            const count = items.filter((item) => item.category === category.key).length;
            return count === 0
                ? []
                : [{ count, label: category.label, color: toneOf(category.color) }];
        });
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
        countFlags,
        boardBadge: (view) => String(boardCount(view)),
        boardRail,
        collectionCount,
        inboxCount: () => inbox.actionable(),
        openCount,
        auditCount: () => audit.openCount(),
        problemsCount,
        repositoriesCount,
        findingsCount,
        sessionInputCount,
        leadsCount,
        calendarPart: () => cellsPart(calendarCells()),
        queuePart: () => cellsPart(queueCells()),
        collectionBadge,
        collectionBadgeTone,
        collectionBadgeTitle,
        inboxBadge,
        leadsBadge: () => countText(leadsCount()),
        linkedinBadgeGlyph,
        openBadge: (key) => countText(openCount(key)),
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
