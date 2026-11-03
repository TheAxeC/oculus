// Layer 3, view helper of DetailsSection.svelte beside it. What the Details section says of one
// session, as the rows its tree walks: three group rows under the head, Session, Model and Usage
// (`group:<group>`), and under each while it is open one row per fact that has a value
// (`fact:<key>`). A group row folds under an id of its own in the tab's folds
// (views/shared/card/pane-fold.ts, under `folded`), `details:<group>`, which meets no fold of the
// session list, none of the Changes section's (`changes:...`) and no row id of a tree. The ids name
// no session, so a fold holds for every session the tab shows.
//
// The context fact is the context window, and what it measures is the last turn's occupancy, never
// the lifetime sums beside it: a session that has run for hours has sent far more tokens than any
// window holds, and the number that matters is what the model carried on the turn it just took.
// The window itself is `context_window` in config/defaults/behavior.yml, or the transcript's own
// when it states one, which Codex does and Claude does not.

import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
import type { KeyRow } from '$lib/ui/tree/tree-keys';
import type { GroupedSession } from '$lib/state/client/selectors.svelte';
import { clock, compactCount, modelShort, stamp } from '$lib/state/shared/words/format';
import { t } from '$lib/state/shared/words/text';

/** The section's groups, in the order they are drawn. */
export const DETAIL_GROUPS = ['session', 'model', 'usage'] as const;

export type DetailGroup = (typeof DETAIL_GROUPS)[number];

/** One fact of a session: its name, its value as the row says it, and the row's tooltip. */
export type Fact = {
    key: string;
    name: string;
    value: string;
    tip: string;
    /** For the context fact, how full the window is (0 to 1) and the meter's hue. */
    meter?: { level: number; tone: string };
};

/** The tree row of a group, and the id it folds under. */
export function groupRow(group: DetailGroup): string {
    return `group:${group}`;
}

export function groupFold(group: DetailGroup): string {
    return `details:${group}`;
}

/** The tree row of a fact. */
export function factRow(key: string): string {
    return `fact:${key}`;
}

/** The fact the title field stands in for while a title is typed. */
export const TITLE_FACT = 'title';

/** The group a row of the section's tree folds, or null for a row that does not fold. */
export function groupOfRow(id: string): DetailGroup | null {
    return DETAIL_GROUPS.find((group) => groupRow(group) === id) ?? null;
}

/** The group's name as its row says it. */
export function groupName(group: DetailGroup): string {
    if (group === 'session') return t('sessions.details_session');
    if (group === 'model') return t('sessions.details_model');
    return t('sessions.details_usage');
}

/** Where the meter changes hue: a window under half full, then three quarters, then above it. */
const MID = 0.5;
const HIGH = 0.75;

/** The meter's hue: green while there is room, amber as it fills, red when it is nearly full. */
function tone(fill: number): string {
    if (fill > HIGH) return 'red';
    if (fill > MID) return 'amber';
    return 'green';
}

/** The status: what the registry says while it is live, and that it ended when it is not. */
function status(session: GroupedSession): string {
    if (!session.live) return t('sessions.state_ended');
    if (session.liveStatus === 'busy') return t('sessions.live_busy');
    if (session.liveStatus === 'idle') return t('sessions.live_idle');
    return session.liveStatus ?? '';
}

/**
 * The share of the last turn that came out of the prompt cache rather than being sent again.
 * Both numbers are that one turn's: the lifetime sum is larger than any window, and divided by an
 * occupancy it would give a share in the tens of thousands of percent.
 */
function cacheShare(session: GroupedSession): number {
    if (session.contextTokens <= 0) return 0;
    return Math.round((100 * session.lastCacheRead) / session.contextTokens);
}

/**
 * The latest hook event, in words: the catalog's chip label for the two notification_type values
 * the session list also shows a chip for, the kind itself for any other Claude Code sends, and the
 * stop message's own catalog word for a Stop, each with the clock it arrived at.
 */
function hookLabel(session: GroupedSession): string {
    const hook = session.hook;
    if (hook === null) return '';
    const when = clock(hook.at);
    if (hook.event === 'stop') return t('sessions.stopped_at', when);
    const word =
        hook.kind === 'permission_prompt'
            ? t('notify.permission_chip')
            : hook.kind === 'idle_prompt'
              ? t('notify.idle_chip')
              : (hook.kind ?? '');
    return `${word} ${when}`.trim();
}

/** A fact whose tooltip is its whole value. */
function fact(key: string, name: string, value: string): Fact {
    return { key, name, value, tip: value };
}

/** The words that join the parts of one fact. */
function joined(parts: string[]): string {
    return parts.join(` ${t('sessions.meta_sep')} `);
}

function sessionFacts(session: GroupedSession, now: number): Fact[] {
    const kind =
        session.kind === 'observed' ? t('sessions.kind_observed', session.kind) : session.kind;
    const hook = hookLabel(session);
    const message = session.hook?.message ?? '';
    return [
        fact(TITLE_FACT, t('sessions.f_title'), session.title),
        fact('cwd', t('sessions.f_cwd'), session.cwd ?? ''),
        fact('branch', t('sessions.f_branch'), session.branch ?? ''),
        fact('kind', t('sessions.f_kind'), kind),
        fact('status', t('sessions.f_status'), status(session)),
        fact(
            'pid',
            t('sessions.f_pid'),
            session.live && session.pid !== null ? String(session.pid) : ''
        ),
        fact('version', t('sessions.f_version'), session.version ?? ''),
        fact('started', t('sessions.f_started'), stamp(session.started, now)),
        { ...fact('hook', t('sessions.f_hook'), hook), tip: message === '' ? hook : message }
    ];
}

function modelFacts(session: GroupedSession): Fact[] {
    return [
        fact('model', t('sessions.f_model'), modelShort(session.model)),
        fact('effort', t('sessions.f_effort'), session.effort ?? ''),
        fact('mode', t('sessions.f_mode'), session.permissionMode ?? '')
    ];
}

function usageFacts(session: GroupedSession, window: number): Fact[] {
    const used = session.contextTokens;
    const level = window > 0 ? used / window : 0;
    const context = t('sessions.context_num', compactCount(used), compactCount(window));
    const cache = session.cache;
    return [
        { ...fact('context', t('sessions.context'), context), meter: { level, tone: tone(level) } },
        fact(
            'tokens',
            t('sessions.tokens'),
            joined([
                t('sessions.tok_in', compactCount(session.tokens.input)),
                t('sessions.tok_out', compactCount(session.tokens.output)),
                t('sessions.tok_think', compactCount(session.tokens.thinking))
            ])
        ),
        fact(
            'cache',
            t('sessions.cache'),
            joined([
                cache.ttl === null || cache.ttl === ''
                    ? t('sessions.cache_ttl_none')
                    : t('sessions.cache_ttl', cache.ttl),
                t('sessions.cache_share', cacheShare(session)),
                cache.busts === 1
                    ? t('sessions.cache_busts_one')
                    : t('sessions.cache_busts', cache.busts)
            ])
        )
    ];
}

/** What the section is made of. */
type DetailsInput = {
    session: GroupedSession;
    /** The context window the session's turns are measured against. */
    window: number;
    now: number;
    /** Whether the title row is drawn as the field, which it is with a title or without one. */
    renaming: boolean;
};

/**
 * Each group's facts that have a value, in the order they are drawn; the title is kept while its
 * field is open whether or not the session has one.
 */
export function detailFacts(input: DetailsInput): Record<DetailGroup, Fact[]> {
    const { session, window, now, renaming } = input;
    const kept = (one: Fact): boolean => one.value !== '' || (renaming && one.key === TITLE_FACT);
    return {
        session: sessionFacts(session, now).filter(kept),
        model: modelFacts(session).filter(kept),
        usage: usageFacts(session, window).filter(kept)
    };
}

/** The window the session's turns are measured against: the transcript's own, else `fallback`. */
export function windowFor(session: GroupedSession, fallback: number): number {
    const own = session.contextWindow;
    return own !== null && own > 0 ? own : fallback;
}

/**
 * The section's rows under its head as the keyboard reads them: each group row and, while it is
 * open, its facts. Which facts have a value does not depend on the time the started row is
 * measured from, so the rows are read with none.
 */
export function detailRows(
    input: Omit<DetailsInput, 'now'>,
    folded: (id: string) => boolean
): KeyRow[] {
    const facts = detailFacts({ ...input, now: 0 });
    return DETAIL_GROUPS.flatMap((group) => {
        const open = !folded(groupFold(group));
        const row: KeyRow = { id: groupRow(group), parent: 'head', open };
        if (!open) return [row];
        return [row, ...facts[group].map((one) => ({ id: factRow(one.key), parent: row.id }))];
    });
}

/**
 * What the head's controls ask of the open Details body, which holds what they act on: whether the
 * resume control was pressed once for the session, and the rename, the pin and the resume.
 */
export type DetailsActions = {
    readonly armed: boolean;
    rename: () => void;
    pin: (area: string) => void;
    resume: () => Promise<void>;
};

/** The Pin menu's group, and its one choice, that lets the score file the session. */
export const SCORED_PIN = 'scored';

/** An area a session may be pinned to, and the hub it is grouped under ('' for its own). */
type PinArea = { key: string; label: string; group: string };

/**
 * The Pin menu's choices: "(scored)" first, then the areas of the session's own workspace, then
 * every other hub's projects under the hub's name, in the order they come; the area the session is
 * pinned to marked, and "(scored)" while it is pinned to none (`pinned` the empty string).
 */
export function pinGroups(areas: readonly PinArea[], pinned: string): MenuGroup[] {
    const item = (one: PinArea): MenuItem => ({
        id: one.key,
        label: one.label,
        active: one.key === pinned
    });
    const scored = { id: SCORED_PIN, label: t('sessions.pin_scored'), active: pinned === '' };
    const groups: MenuGroup[] = [{ id: SCORED_PIN, heading: '', items: [scored] }];
    const own = areas.filter((one) => one.group === '');
    if (own.length > 0) groups.push({ id: 'own', heading: '', items: own.map(item) });
    const hubs = [...new Set(areas.map((one) => one.group).filter((hub) => hub !== ''))];
    for (const hub of hubs) {
        const items = areas.filter((one) => one.group === hub).map(item);
        groups.push({ id: `hub:${hub}`, heading: hub, items });
    }
    return groups;
}
