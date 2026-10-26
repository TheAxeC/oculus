// Layer 2, client state. The hub a Settings row of a key each hub's own settings file is read for
// (data/shapes/hub-keys.ts `readPerHub`) shows and writes. In a workspace of more than one hub the
// row offers every hub, the primary first (`hubList` order), with the primary chosen and none
// chosen while there is no primary, as `chosenHub` of state/shared/page/hubs.ts picks for a new
// record; the hub picked on a row is the view's own per row, kept while the tab is open and never
// saved, and a hub that leaves the workspace gives the row back the first choice. A row of a key
// read from the primary's file alone, and every row of a workspace of one hub, offers no choice; a
// workspace of one hub that is not the primary writes that hub.
//
// With a hub other than the primary chosen the row is that hub's: its value and default are read
// from the slice of that hub's merged settings that api/hub-settings answers
// (server/files/source/hub-settings.ts), laid over the merged config the page holds, and its own
// line and file are read from that hub's `.oculus/config.yml`. The row names the hub its write
// names (`hub`) and the hub its drafts and typed text are kept under (`slot`). A row whose hub is
// not picked, whose hub's settings are not read yet or could not be read, or whose hub's settings
// file is being read, unreadable, cut or not parsed says why (`blocked`) and writes nothing. While
// the chosen hub's settings are not read yet or could not be read the row holds no value, default
// or line (`unread`) and is placed in that hub's settings file, so it shows and opens nothing of
// the primary's, and the drafts and typed text kept under the hub wait, undrawn, for the read.
//
// The reader asks for the slice of each hub a row has chosen, once per version of the settings the
// config channel pushes, so a write that lands is read back; the slice it held keeps being shown
// while a new read is out, and an answer a later read overtook changes nothing.

import { z } from 'zod';
import { HUB_FILE } from '../../../../data/helpers/hub-names.ts';
import { readPerHub } from '../../../../data/shapes/hub-keys.ts';
import { readAs, readJson } from '../../../../data/shapes/shapes.ts';
import { catalogOf, type Catalog } from '../../../../data/sources/config/catalog/options.ts';
import { laidHubSlice } from '../../../../data/sources/config/settings/hub-slice.ts';
import {
    failedAnswer,
    unreachableAnswer,
    unreadableAnswer
} from '../../../shared/answers/answers.ts';
import { chosenHub } from '../../../shared/page/hubs.ts';
import type { Group } from '../groups.ts';
import { message, type Message } from '../messages.ts';
import { fileRows, type ConfigRow, type HubFile } from '../rows.ts';

/** The slice of one hub's merged settings the server answers: its values and options entries. */
const hubSliceShape = z.object({ hub: z.string(), config: z.record(z.string(), z.unknown()) });

/** The slice of one hub's merged settings, as the server answers it. */
type HubSlice = z.infer<typeof hubSliceShape>;

/** What became of the read of one hub's settings: out, read, or refused with why. */
export type HubRead =
    { state: 'loading' } | { state: 'ready'; slice: HubSlice } | { state: 'failed'; error: string };

/** The `error` a refusal's body carries, when it is text. */
const errorShape = z.object({ error: z.string() });

/** The address the settings of one hub are read at. */
export function hubSettingsUrl(hub: string): string {
    return `/api/hub-settings?hub=${encodeURIComponent(hub)}`;
}

/**
 * The merged config the page holds with a hub's read slice laid over it, which the lists of that
 * hub's rows are built from; null while the slice is not read.
 */
export function hubConfig(
    config: Record<string, unknown>,
    read: HubRead
): Record<string, unknown> | null {
    return read.state === 'ready' ? laidHubSlice(config, read.slice.config) : null;
}

/** The reads of the settings of the hubs a Settings view has chosen on its rows. */
export type HubReader = {
    /** Read each hub of `hubs` whose settings are not read at `version`; forget every other hub. */
    want: (hubs: readonly string[], version: number) => void;
    /** What became of the read of a hub's settings: loading until the first answer. */
    read: (hub: string) => HubRead;
    /** End the reads: no answer on its way changes anything. */
    close: () => void;
};

/**
 * Open the reads of a Settings view. `get` asks the server for the settings of one hub, which the
 * view does through api/hub-settings.
 */
export function hubReader(get: (hub: string) => Promise<Response>): HubReader {
    let reads = $state<Partial<Record<string, HubRead>>>({});
    /** The version each hub was last asked at, and the turn of the read that is out. */
    const asked = new Map<string, { version: number; turn: number }>();
    let turns = 0;
    let closed = false;

    /** What one answer makes of the read: the slice, or the sentence of why there is none. */
    async function readOf(response: Response): Promise<HubRead> {
        const body = await readJson(response);
        if (!response.ok) {
            const error = readAs(errorShape, body)?.error ?? failedAnswer(response, body);
            return { state: 'failed', error };
        }
        const slice = readAs(hubSliceShape, body);
        if (slice === null) return { state: 'failed', error: unreadableAnswer(response.status) };
        return { state: 'ready', slice };
    }

    /** Ask for one hub's settings, keeping what the last read made of it while this one is out. */
    async function ask(hub: string, version: number): Promise<void> {
        turns += 1;
        const turn = turns;
        asked.set(hub, { version, turn });
        if (reads[hub] === undefined) reads = { ...reads, [hub]: { state: 'loading' } };
        let made: HubRead;
        try {
            made = await readOf(await get(hub));
        } catch {
            made = { state: 'failed', error: unreachableAnswer() };
        }
        if (closed || asked.get(hub)?.turn !== turn) return;
        reads = { ...reads, [hub]: made };
    }

    function want(hubs: readonly string[], version: number): void {
        if (closed) return;
        for (const hub of [...asked.keys()]) {
            if (hubs.includes(hub)) continue;
            asked.delete(hub);
            const { [hub]: _gone, ...rest } = reads;
            reads = rest;
        }
        for (const hub of hubs) {
            if (asked.get(hub)?.version === version) continue;
            void ask(hub, version);
        }
    }

    return {
        want,
        read: (hub) => reads[hub] ?? { state: 'loading' },
        close: () => {
            closed = true;
        }
    };
}

/**
 * What the rows of the hubs are made from: the hubs of the workspace, the primary first and the
 * others in the workspace's order; the primary, null when there is none; the hub picked on each
 * row, by row id; the merged config the page holds; the read of a hub's settings; and a hub's
 * settings file as the file browser holds it.
 */
export type HubsOf = {
    hubs: readonly string[];
    primary: string | null;
    chosen: Readonly<Partial<Record<string, string>>>;
    config: Record<string, unknown>;
    read: (hub: string) => HubRead;
    file: (hub: string) => HubFile;
};

/** The merged config of one hub laid over the page's, and its options catalog. */
type Laid = { config: Record<string, unknown>; catalog: Catalog };

/** The hub a row has chosen: the hub picked on it while it is offered, else the first choice. */
function chosenOn(row: ConfigRow, of: HubsOf): string | undefined {
    const picked = of.chosen[row.id];
    if (picked !== undefined && of.hubs.includes(picked)) return picked;
    return chosenHub(of.hubs, of.primary);
}

/**
 * The row while the settings of the hub `hub` are being read or could not be read: none of the
 * primary's value, default or line, placed in that hub's settings file, saying `said`.
 */
function unreadRow(row: ConfigRow, hub: string, file: HubFile, said: Message): ConfigRow {
    return {
        ...row,
        value: undefined,
        default: undefined,
        line: undefined,
        own: false,
        state: 'missing',
        modified: false,
        mismatch: false,
        place: { layer: 'hub', root: hub, path: HUB_FILE, present: file.present },
        hub,
        blocked: said,
        unread: true
    };
}

/**
 * The row as the hub `hub` holds it: its value, default and line from that hub's settings, or none
 * of them with why it writes nothing while they are not read. `laid` keeps each hub's laid config
 * for the other rows of the same call.
 */
function hubRow(row: ConfigRow, hub: string, of: HubsOf, laid: Map<string, Laid>): ConfigRow {
    const read = of.read(hub);
    if (read.state === 'loading') {
        return unreadRow(row, hub, of.file(hub), message('hubLoading', hub));
    }
    if (read.state === 'failed') {
        return unreadRow(row, hub, of.file(hub), message('hubFailed', hub, read.error));
    }
    let held = laid.get(hub);
    if (held === undefined) {
        const config = hubConfig(of.config, read) ?? of.config;
        held = { config, catalog: catalogOf(config) };
        laid.set(hub, held);
    }
    const entries = Object.hasOwn(held.catalog, row.file) ? held.catalog[row.file] : {};
    const entry = Object.hasOwn(entries, row.key) ? entries[row.key] : row.entry;
    const user = { hubFile: of.file(hub), workspace: null };
    const made = fileRows(row.file, { [row.key]: entry }, held.config, user, hub);
    const drawn = made.rows[0];
    const said = made.hubFile?.status === 'rows' ? null : (made.hubFile?.said ?? null);
    return { ...drawn, hub, ...(said === null ? {} : { blocked: said }) };
}

/** A row of a key each hub's own file is read for, as the hub chosen on it holds it. */
function chosenRow(row: ConfigRow, of: HubsOf, laid: Map<string, Laid>): ConfigRow {
    if (of.hubs.length === 0) return row;
    if (of.hubs.length === 1) {
        const only = of.hubs[0];
        return only === of.primary ? row : hubRow(row, only, of, laid);
    }
    const chosen = chosenOn(row, of);
    const choice = { offered: [...of.hubs], chosen };
    if (chosen === undefined) return { ...row, choice, blocked: message('pickHub') };
    if (chosen === of.primary) return { ...row, choice };
    return { ...hubRow(row, chosen, of, laid), slot: chosen, choice };
}

/**
 * The groups of the Settings view with each row of a key each hub's own file is read for made the
 * row of the hub chosen on it. Every other row is left as it is.
 */
export function withHubs(groups: Group[], of: HubsOf): Group[] {
    const laid = new Map<string, Laid>();
    return groups.map((group) => ({
        ...group,
        sections: group.sections.map((section) => ({
            ...section,
            rows: section.rows.map((row) =>
                row.kind === 'config' && readPerHub(row.file, row.key)
                    ? chosenRow(row, of, laid)
                    : row
            )
        }))
    }));
}

/**
 * The hubs other than the primary whose settings the rows read: the one hub of a workspace whose
 * hub is not the primary, else each hub picked on a row while it is offered.
 */
export function hubsRead(of: Pick<HubsOf, 'hubs' | 'primary' | 'chosen'>): string[] {
    if (of.hubs.length === 1) return of.hubs[0] === of.primary ? [] : [of.hubs[0]];
    const picked = Object.values(of.chosen).filter(
        (hub): hub is string => hub !== undefined && hub !== of.primary && of.hubs.includes(hub)
    );
    return [...new Set(picked)];
}
