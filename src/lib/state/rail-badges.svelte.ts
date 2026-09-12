// Layer 2, client state. Reactive rail badges over the latest portfolio and already-fetched feeds.
// These selectors call `peekFeed`, so reading a badge never starts a request.

import { config, portfolio } from './entities.svelte.ts';
import { peekFeed } from './feeds.svelte.ts';
import { board, boardPreset, collectionOf } from './selectors.svelte.ts';
import { splitPosts } from './linkedin.ts';
import { glyph } from './text.ts';
import { statusTone } from './tones.ts';
import {
    actionableEntries,
    countText,
    leadsDue,
    linkedinOverdue,
    liveEntries,
    liveRule,
    numericSetting
} from './rail-badges.ts';
import type { FeedState } from './feeds.svelte.ts';

function configMap(): Record<string, unknown> {
    return config()?.config ?? {};
}

/** A fetched feed that can replace the snapshot summary rather than erase it. */
function available(feed: FeedState | null): feed is FeedState {
    return feed !== null && feed.ok && feed.error === undefined && feed.missing !== true;
}

/** The number of cards on one of the three project boards. */
export function boardBadge(view: string): string {
    return countText(board(boardPreset(view)).length);
}

/** The number of entries in one collection's configured `nav_live` status set. */
export function collectionBadge(key: string): string {
    const collection = collectionOf(key);
    return countText(liveEntries(collection?.entries ?? [], liveRule(configMap(), key)));
}

/** The configured urgency tone, or the first counted status's vocabulary tone. */
export function collectionBadgeTone(key: string): string {
    const rule = liveRule(configMap(), key);
    return rule?.tone ?? statusTone(rule?.match[0] ?? '');
}

/** Inbox entries awaiting triage, from a fetched feed when present and its summary otherwise. */
export function inboxBadge(): string {
    const fetched = peekFeed('inbox');
    const count = available(fetched)
        ? actionableEntries(fetched.entries)
        : (portfolio()?.entities.feeds.inbox?.actionable ?? 0);
    return countText(count);
}

/** Position Leads due inside `leads_badge_days`, preferring an already-fetched feed. */
export function leadsBadge(): string {
    const fetched = peekFeed('leads');
    const entries = available(fetched)
        ? fetched.entries
        : (portfolio()?.entities.feeds.leads ?? []);
    return countText(
        leadsDue(
            entries as Record<string, unknown>[],
            numericSetting(configMap(), 'leads_badge_days'),
            Date.now()
        )
    );
}

/** A red mark when the newest LinkedIn post is beyond `linkedin_cadence_days`. */
export function linkedinBadge(): string {
    const fetched = peekFeed('linkedin');
    const lastPost = available(fetched)
        ? (splitPosts(fetched.entries).posts[0]?.date ?? null)
        : (portfolio()?.entities.feeds.linkedin?.lastPost ?? null);
    return linkedinOverdue(
        lastPost,
        numericSetting(configMap(), 'linkedin_cadence_days'),
        Date.now()
    )
        ? glyph('warn')
        : '';
}

/** Active applications, which are urgent rather than a general `nav_live` rollup. */
export function applicationsBadge(): string {
    const entries = collectionOf('applications')?.entries ?? [];
    return countText(
        entries.filter(
            (entry) =>
                String(entry.fields.status ?? '')
                    .trim()
                    .toLowerCase() === 'active'
        ).length
    );
}
