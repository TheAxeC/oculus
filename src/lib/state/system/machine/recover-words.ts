// Layer 2, client state. The words and the figures the Recover view and Live HPC's Login node
// section draw from the state GET /api/recover answers and the `recover` channel pushes: a size in
// the unit that suits it, the reason an action or a listing was refused, the setup row of an
// access, the state of a file a pushed reading changed, and the time left of a fetch. Every
// sentence is a literal catalog key, so the catalog gate sees each one. The types of the answers
// are passed on from here, so the views read them through the state layer.
//
// The rate is the server's: the bytes at one reading of the run against the reading before, over
// the time between them (runs/recover/live/watch.ts).

import type {
    RecoverAccess,
    RecoverFileState,
    RecoverRefusal,
    RecoverRow
} from '../../../data/model/index.ts';
import { t } from '../../shared/words/text.ts';

export type {
    RecoverAccess,
    RecoverFileState,
    RecoverRow,
    RecoverRun,
    RecoverSession,
    RecoverState,
    RecoverTotals
} from '../../../data/model/index.ts';

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

/** A size in bytes in the largest unit it fills, to one decimal above a kilobyte. */
export function sizeWords(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < KB) return t('recover.bytes', Math.max(0, bytes));
    if (bytes >= TB) return t('recover.tb', (bytes / TB).toFixed(1));
    if (bytes >= GB) return t('recover.gb', (bytes / GB).toFixed(1));
    if (bytes >= MB) return t('recover.mb', (bytes / MB).toFixed(1));
    return t('recover.kb', (bytes / KB).toFixed(1));
}

/** A time in seconds as hours and minutes, or minutes and seconds under an hour. */
export function timeWords(seconds: number): string {
    const whole = Math.max(0, Math.round(seconds));
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    if (hours > 0) return t('recover.hours', hours, minutes);
    return t('recover.minutes', minutes, whole % 60);
}

/** The sentence of each reason the route refuses an action or a GET with. */
const REFUSALS: Record<string, () => string> = {
    dataset: () => t('recover.refused_dataset'),
    host: () => t('recover.refused_host'),
    kind: () => t('recover.refused_kind'),
    place: () => t('recover.refused_place'),
    target: () => t('recover.refused_target'),
    request: () => t('recover.refused_request'),
    access: () => t('recover.refused_access'),
    listing: () => t('recover.refused_listing'),
    running: () => t('recover.refused_running'),
    credential: () => t('recover.refused_credential'),
    nothing: () => t('recover.refused_nothing'),
    start: () => t('recover.refused_start'),
    send: () => t('recover.refused_send'),
    scratch: () => t('recover.refused_scratch'),
    submit: () => t('recover.refused_submit'),
    download: () => t('recover.refused_download'),
    unreachable: () => t('recover.refused_unreachable')
};

/**
 * The sentence for a refusal of the route; `host` and `target` are worded by the sentence the
 * route gives with them when it gives one, `row` names the kind the route gives and the hub `hub`,
 * and a reason the catalog does not word is shown as it came.
 */
export function refusalWords(reason: string, hint = '', hub = ''): string {
    if ((reason === 'host' || reason === 'target') && hint !== '') return hint;
    if (reason === 'host') return t('recover.refused_host');
    if (reason === 'row') return t('recover.refused_row', hint, hub);
    const words = REFUSALS[reason] as (() => string) | undefined;
    return words === undefined ? reason : words();
}

/**
 * The sentence for a source that gave no file list, naming it by its row's `name` (by its kind, or
 * the host it asked, when it has none), with its status and the file name; a kind no row reads
 * names the hub `hub`.
 */
export function listingWords(refusal: RecoverRefusal, hub = ''): string {
    const status = refusal.status ?? '';
    const name = refusal.name ?? '';
    const source = refusal.label ?? refusal.source;
    switch (refusal.refused) {
        case 'row':
            return t('recover.refused_row', refusal.source, hub);
        case 'access':
            return t('recover.listing_access', source, status);
        case 'status':
            return t('recover.listing_status', source, status);
        case 'answer':
            return t('recover.listing_answer', source);
        case 'name':
            return t('recover.listing_name', source, name);
        case 'missing':
            return t('recover.listing_missing', source, name);
        case 'network':
            return t('recover.listing_network', source);
    }
}

/**
 * The row of `downloads:` the setup of an access adds, as the template writes it: with a user when
 * the row's `auth` entry sends the secret with one.
 */
export function setupRow(access: RecoverAccess): string {
    return access.basic
        ? t('recover.setup_row_user', access.service)
        : t('recover.setup_row', access.service);
}

/** What the access of one service says, by its row's name: set up, refused, missing, unreached. */
export function accessWords(access: RecoverAccess): string {
    const service = access.name;
    if (access.state === 'ok') return t('recover.access_ok', service);
    if (access.state === 'unreachable') return t('recover.access_unreachable', service);
    return access.row
        ? t('recover.access_refused', service, access.status ?? '')
        : t('recover.access_missing', service);
}

/** The word and the tone of a file's state: done, there, under way, wrong, absent. */
export function stateLook(state: RecoverFileState): { words: string; tone: string } {
    switch (state) {
        case 'verified':
            return { words: t('recover.state_verified'), tone: 'green' };
        case 'present':
            return { words: t('recover.state_present'), tone: 'teal' };
        case 'partial':
            return { words: t('recover.state_partial'), tone: 'amber' };
        case 'different':
            return { words: t('recover.state_different'), tone: 'red' };
        case 'missing':
            return { words: t('recover.state_missing'), tone: 'muted' };
    }
}

/** Bytes per second of each file that grew at the server's last reading, and of all together. */
export type Rates = { files: Map<string, number>; total: number };

export const NO_RATES: Rates = { files: new Map(), total: 0 };

/**
 * The state of a file of the plan whose bytes a pushed reading changed, as the server's plan states
 * a changed file: partial below its size, different above it, and present at it, since a check row
 * of the earlier bytes no longer matches.
 */
export function grownState(row: RecoverRow, have: number): RecoverFileState {
    if (have === row.have) return row.state;
    if (row.size === null || have === row.size) return 'present';
    return have < row.size ? 'partial' : 'different';
}

/** The seconds left at a rate for the bytes still to come, or null when either is unknown. */
export function secondsLeft(bytes: number, rate: number): number | null {
    return rate > 0 && bytes > 0 ? bytes / rate : null;
}
