// Layer 2, client state. Reactive view badges over the latest portfolio and socket feed payload,
// drawn in the view catalogue and on pane tabs.
// The snapshot summary remains the starting and read-error fallback until a usable feed arrives.

import { scalar, isMap, numericSetting } from '../../data/helpers/guards.ts';
import type { EntitiesStore } from '../shared/stores/shapes.ts';
import type { FeedsStore, FeedState } from '../feeds/feeds.svelte.ts';
import type { AuditStore } from '../system/audit.svelte.ts';
import type { CalendarStore } from '../life/calendar.svelte.ts';
import type { HpcStore } from '../system/hpc.svelte.ts';
import type { InboxStore } from '../feeds/inbox.svelte.ts';
import { splitPosts } from '../feeds/linkedin.ts';
import { t } from '../shared/words/text.ts';
import { statusTone, toneOf, UNKNOWN_TONE } from '../shared/words/tones.ts';
import {
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    rollup,
    typeSplit
} from './rail-badges.ts';
import type { BoardItem, BoardPreset } from '../boards/board/index.ts';
import type { Collection } from '../../data/model/index.ts';

/** One coloured count drawn as a cell on a pane tab. `color` is a theme hue name. */
export type BadgeCell = { count: number; color: string; label: string };

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
    collectionBadge: (key: string) => string;
    collectionBadgeTone: (key: string) => string;
    collectionBadgeTitle: (key: string) => string;
    inboxBadge: () => string;
    leadsBadge: () => string;
    linkedinBadgeGlyph: () => string;
    applicationsBadge: () => string;
    auditBadge: () => string;
    boardCells: (view: string) => BadgeCell[];
    queueCells: () => BadgeCell[];
    calendarCells: () => BadgeCell[];
    boardBadgeTitle: (view: string) => string;
    queueBadgeTitle: () => string;
    calendarBadgeTitle: () => string;
};

/**
 * What the badges read of the selectors: the configuration, one board by its preset, and one
 * collection. The selectors store in state/client, the folder above this one, satisfies it.
 */
export type BadgeSelectors = {
    configMap: () => Record<string, unknown>;
    boardPreset: (view: string) => BoardPreset;
    board: (preset: BoardPreset) => BoardItem[];
    collectionOf: (key: string) => Collection | null;
};

export function createRailBadges(
    entities: EntitiesStore,
    feeds: FeedsStore,
    hpc: HpcStore,
    calendar: CalendarStore,
    inbox: InboxStore,
    audit: AuditStore,
    selectors: BadgeSelectors
): RailBadgesStore {
    /** The number of cards on one of the three project boards. */
    function boardBadge(view: string): string {
        return String(selectors.board(selectors.boardPreset(view)).length);
    }

    /** The number of entries in one collection's configured `nav_live` status set. */
    function collectionBadge(key: string): string {
        const collection = selectors.collectionOf(key);
        return countText(
            liveEntries(collection?.entries ?? [], liveRule(selectors.configMap(), key))
        );
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
    function applicationsBadge(): string {
        const entries = selectors.collectionOf('applications')?.entries ?? [];
        return countText(
            entries.filter((entry) => scalar(entry.fields.status).trim().toLowerCase() === 'active')
                .length
        );
    }

    /** Audit findings the reader has not parked, which is what the Audit view opens on. */
    function auditBadge(): string {
        return countText(audit.openCount());
    }

    /** The project-board types from `scan`, in the vocabulary's configured type order. */
    function projectTypeOrder(): string[] {
        const preset = selectors.boardPreset('projects');
        const rows = selectors.configMap().scan;
        if (!Array.isArray(rows)) return [];
        const types = new Set(
            rows.flatMap((row) => {
                if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
                const value = row as Record<string, unknown>;
                return value.tier === preset.id && typeof value.type === 'string'
                    ? [value.type]
                    : [];
            })
        );
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
        collectionBadge,
        collectionBadgeTone,
        collectionBadgeTitle,
        inboxBadge,
        leadsBadge,
        linkedinBadgeGlyph,
        applicationsBadge,
        auditBadge,
        boardCells,
        queueCells,
        calendarCells,
        boardBadgeTitle,
        queueBadgeTitle,
        calendarBadgeTitle
    };
}
