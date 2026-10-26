// Layer 2, route tests. What the /api/write route does with the rail list: the list the reader sees
// written into the `settings:` map of the open workspace file, laid over oculus's rail by `page`,
// with every other byte of the file kept, so a drag keeps its order and a hidden button stays
// hidden once the merge reads the file again, and the change taken back through the log.
//
// The engine is a scratch copy of the checkout's config/ folder and the workspace file is under the
// fixture's hub (write-fixture.ts `configTarget`), so no case here writes the engine's own
// config/defaults/layout.yml.
// @module-tag slow: every case takes 500 ms or more in a run of its own. The time is the write's
// own checks: the rail write reads the whole configuration of the scratch engine before and after
// it writes (`loadConfig`, about 220 ms a read), and no case waits.

import { readFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { glyphNames, type RailEntry } from '../../../src/lib/data/sources/config/rail.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { handleWrite, type PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { loadLayers, layersOf } from '../../../src/lib/server/edit/writes/config/config-place.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    defaultsFile,
    request,
    workspaceFileOf
} from './write-fixture.ts';

/** One rail entry as the page sends it. */
type Entry = RailEntry;

/**
 * A target over a scratch engine with a saved workspace open, its file ending in `settings`, and
 * the engine's glyph names.
 */
function railTarget(settings = ''): PrimaryTarget {
    const into = configTarget(undefined, settings);
    return { ...into, glyphs: glyphNames(loadConfig(into.engine).config) ?? [] };
}

/** The rail in force over a target's layers, as the page sends it back. */
function railOf(into: PrimaryTarget): Entry[] {
    const rail = loadLayers(into.engine, layersOf(into)).config.rail as Partial<Entry>[];
    return rail.map((row) => ({
        label: row.label ?? '',
        glyph: row.glyph ?? '',
        page: row.page ?? '',
        chord: row.chord ?? '',
        group_glyph: row.group_glyph ?? '',
        unplaced_collections: row.unplaced_collections === true
    }));
}

/** What the workspace file holds under `settings.rail`. */
function storedRail(into: PrimaryTarget): unknown {
    const parsed = parse(readFileSync(workspaceFileOf(into), 'utf8')) as {
        settings?: { rail?: unknown };
    };
    return parsed.settings?.rail;
}

async function send(into: PrimaryTarget, rail: unknown): Promise<Response> {
    return handleWrite(request({ kind: 'rail', rail }), TOKEN, into);
}

describe('the rail write', { tags: ['slow'] }, () => {
    it('keeps a drag in its new order once the merge reads the workspace file again, and every other byte of the file', async () => {
        const into = railTarget('settings:\n  # mine\n  code_theme: nord\n');
        const defaults = readFileSync(defaultsFile(into.engine, 'layout.yml'), 'utf8');
        const before = readFileSync(workspaceFileOf(into), 'utf8');
        const rail = railOf(into);
        const dragged = [rail[2], rail[0], rail[1], ...rail.slice(3)];
        const response = await send(into, dragged);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['layout.yml:rail'],
            refused: []
        });
        expect(railOf(into)).toEqual(dragged);
        expect(readFileSync(workspaceFileOf(into), 'utf8').startsWith(before)).toBe(true);
        expect(readFileSync(defaultsFile(into.engine, 'layout.yml'), 'utf8')).toBe(defaults);
    });

    it('Hide on the focus button removes it, and the workspace file holds { page: focus, removed: true }', async () => {
        const into = railTarget();
        const hidden = railOf(into).filter((row) => row.page !== 'focus');
        expect((await send(into, hidden)).status).toBe(200);
        expect(railOf(into).map((row) => row.page)).toEqual(hidden.map((row) => row.page));
        const stored = storedRail(into) as unknown[];
        expect(stored.at(-1)).toEqual({ page: 'focus', removed: true });
        expect(stored).toHaveLength(hidden.length + 1);
    });

    it('records the change, and the undo puts the workspace file back byte for byte', async () => {
        const into = railTarget();
        const file = workspaceFileOf(into);
        const before = readFileSync(file, 'utf8');
        const rail = railOf(into);
        expect((await send(into, [rail[1], rail[0], ...rail.slice(2)])).status).toBe(200);
        const [change] = changesOf(into);
        expect(change).toMatchObject({ kind: 'rail', file, key: 'layout.yml', field: 'rail' });
        const undo = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(undo.status).toBe(200);
        expect(readFileSync(file, 'utf8')).toBe(before);
        expect(railOf(into)).toEqual(rail);
    });

    it("writes a button's group chord and refuses a chord that is no letter, writing nothing", async () => {
        const into = railTarget();
        const rail = railOf(into);
        const grouped = rail.map((row) => (row.page === 'focus' ? { ...row, chord: 'q' } : row));
        expect((await send(into, grouped)).status).toBe(200);
        expect(railOf(into).find((row) => row.page === 'focus')?.chord).toBe('q');
        const before = readFileSync(workspaceFileOf(into), 'utf8');
        const bad = rail.map((row) => (row.page === 'focus' ? { ...row, chord: 'EE' } : row));
        expect((await send(into, bad)).status).not.toBe(200);
        expect(readFileSync(workspaceFileOf(into), 'utf8')).toBe(before);
    });

    it('is refused with the no-workspace-file sentence for the unsaved workspace', async () => {
        const into = railTarget();
        const unsaved: PrimaryTarget = { ...into, workspace: undefined };
        const rail = railOf(into);
        const response = await send(unsaved, [rail[1], rail[0], ...rail.slice(2)]);
        const body = (await response.json()) as { refused?: { reason: string }[] };
        const text = textCatalog(loadConfig(into.engine).config);
        expect(body.refused?.map((one) => one.reason)).toEqual([
            words(text, 'server.config_key.no_workspace')
        ]);
    });
});
