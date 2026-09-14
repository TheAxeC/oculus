// Layer 2, client state. Reactive rail badges over the latest portfolio and socket feed payload.
// The snapshot summary remains the starting and read-error fallback until a usable feed arrives.

import { scalar } from '../data/guards.ts';
import type { EntitiesStore } from './entities.svelte.ts';
import type { FeedsStore } from './feeds.svelte.ts';
import type { HpcStore } from './hpc.svelte.ts';
import type { SelectorsStore } from './selectors.svelte.ts';
import { splitPosts } from './linkedin.ts';
import { glyph, t } from './text.ts';
import { statusTone, toneOf, UNKNOWN_TONE } from './tones.ts';
import { isMap } from '../data/guards.ts';
import {
    actionableEntries,
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    numericSetting,
    rollup,
    typeSplit
} from './rail-badges.ts';
import type { FeedState } from './feeds.svelte.ts';

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

/** The hover text shared by a split strip and its compact rail badge. */
function cellsTitle(cells: BadgeCell[]): string {
    return cells
        .map((cell) => t('views.badge_cell', cell.label, cell.count))
        .join(t('views.badge_separator'));
}

/** The reactive rail badges of one client. */
export type RailBadgesStore = {
    boardBadge: (view: string) => string;
    collectionBadge: (key: string) => string;
    collectionBadgeTone: (key: string) => string;
    collectionBadgeTitle: (key: string) => string;
    inboxBadge: () => string;
    leadsBadge: () => string;
    linkedinBadge: () => string;
    applicationsBadge: () => string;
    boardCells: (view: string) => BadgeCell[];
    queueCells: () => BadgeCell[];
    boardBadgeTitle: (view: string) => string;
    queueBadgeTitle: () => string;
};

export function createRailBadges(
    entities: EntitiesStore,
    feeds: FeedsStore,
    hpc: HpcStore,
    selectors: SelectorsStore
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

    /** Inbox entries awaiting triage, from the socket feed with the summary as fallback. */
    function inboxBadge(): string {
        const fetched = feeds.feed('inbox');
        const count = available(fetched)
            ? actionableEntries(fetched.entries)
            : (entities.portfolio()?.entities.feeds.inbox?.actionable ?? 0);
        return countText(count);
    }

    /** Position Leads due inside `leads_badge_days`, from the socket feed with the summary as fallback. */
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

    /** A red mark when the newest LinkedIn post is beyond `linkedin_cadence_days`. */
    function linkedinBadge(): string {
        const fetched = feeds.feed('linkedin');
        const lastPost = available(fetched)
            ? (splitPosts(fetched.entries).posts[0]?.date ?? null)
            : (entities.portfolio()?.entities.feeds.linkedin?.lastPost ?? null);
        return linkedinOverdue(
            lastPost,
            numericSetting(selectors.configMap(), 'linkedin_cadence_days'),
            Date.now()
        )
            ? glyph('bang')
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

    /** Hover words for one board's split counts. */
    function boardBadgeTitle(view: string): string {
        return cellsTitle(boardCells(view));
    }

    /** Hover words for the running and pending queue counts. */
    function queueBadgeTitle(): string {
        return cellsTitle(queueCells());
    }

    return {
        boardBadge,
        collectionBadge,
        collectionBadgeTone,
        collectionBadgeTitle,
        inboxBadge,
        leadsBadge,
        linkedinBadge,
        applicationsBadge,
        boardCells,
        queueCells,
        boardBadgeTitle,
        queueBadgeTitle
    };
}
