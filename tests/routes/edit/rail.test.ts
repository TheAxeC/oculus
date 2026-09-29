// What the /api/write route does with the rail list: the `rail:` list of config/layout.yml
// rewritten over its bytes with every other line kept, the refusals that leave the file as it was
// (a page named twice, a page no arrangement holds, a glyph the vocabulary does not hold, a body of
// the wrong shape, a file that is not there), and the change taken back through the log.
//
// The layout file is a copy under the system temporary directory beside the fixture's hub, asserted
// to be inside it before anything is written, so no case here writes the engine's own
// config/layout.yml.

import { chmodSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite, railWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN, changesOf, request, target } from './write-fixture.ts';

/** A layout.yml of the engine's shape, with the comments and the other keys the edit must keep. */
const LAYOUT = `# The rail: one button per page.
rail:
  - { label: "Focus", glyph: compass, page: focus }


# The catalogue's groups.
nav_groups:
  boards: { label: "Boards" }


arrangements:
  focus:
    root: { kind: pane, view: focus }
  inbox:
    root: { kind: pane, view: inbox }
`;

const FOCUS = { label: 'Focus', glyph: 'compass', page: 'focus' };
const INBOX = { label: 'Mail: in', glyph: 'inbox', page: 'inbox' };

/** A target whose layout.yml is a copy in the fixture's own temporary directory. */
function railTarget(body = LAYOUT): WriteTarget {
    const into = { ...target(), glyphs: ['compass', 'inbox'] };
    expect(resolve(into.layoutFile).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    writeFileSync(into.layoutFile, body);
    return into;
}

function layoutOf(into: WriteTarget): string {
    return readFileSync(into.layoutFile, 'utf8');
}

function railOf(into: WriteTarget): unknown {
    return (parse(layoutOf(into)) as { rail: unknown }).rail;
}

async function send(into: WriteTarget, rail: unknown): Promise<Response> {
    return handleWrite(request({ kind: 'rail', rail }), TOKEN, into);
}

describe('the rail write', () => {
    it('writes the list in its order and keeps every other line of the file', async () => {
        const into = railTarget();
        const response = await send(into, [INBOX, FOCUS]);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['rail'], refused: [] });
        expect(railOf(into)).toEqual([INBOX, FOCUS]);
        const written = layoutOf(into);
        expect(written).toContain('# The rail: one button per page.\n');
        expect(written).toContain("# The catalogue's groups.\n");
        expect(written).toContain('    root: { kind: pane, view: inbox }\n');
        expect(written).toContain('  - { label: "Mail: in", glyph: inbox, page: inbox }\n');
    });

    it('refuses a page named twice and leaves the file as it was', async () => {
        const into = railTarget();
        const response = await send(into, [FOCUS, { ...FOCUS, label: 'Again' }]);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'invalid' });
        expect(layoutOf(into)).toBe(LAYOUT);
    });

    it('refuses a page no arrangement of the file holds, and an empty one', async () => {
        const into = railTarget();
        expect((await send(into, [{ ...FOCUS, page: 'nowhere' }])).status).toBe(400);
        expect((await send(into, [{ ...FOCUS, page: '' }])).status).toBe(400);
        expect(layoutOf(into)).toBe(LAYOUT);
    });

    it('refuses a glyph the vocabulary does not hold', async () => {
        const into = railTarget();
        expect((await send(into, [{ ...FOCUS, glyph: 'nonesuch' }])).status).toBe(400);
        expect(layoutOf(into)).toBe(LAYOUT);
    });

    it('reads no write in a body whose rows are not three strings', () => {
        expect(railWrite({ kind: 'rail', rail: [FOCUS] })).toEqual({ kind: 'rail', rail: [FOCUS] });
        expect(railWrite({ kind: 'rail', rail: [{ ...FOCUS, page: 3 }] })).toBe(null);
        expect(railWrite({ kind: 'rail', rail: 'focus' })).toBe(null);
        expect(railWrite({ kind: 'rail', rail: ['focus'] })).toBe(null);
    });

    it('answers unwritable for a file that is not there, and writes nothing', async () => {
        const into = { ...railTarget(), layoutFile: `${railTarget().layoutFile}.gone` };
        const response = await send(into, [FOCUS]);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
    });

    it('answers unwritable for a read-only file, and leaves it and its mode as they were', async () => {
        const into = railTarget();
        chmodSync(into.layoutFile, 0o444);
        const response = await send(into, [INBOX, FOCUS]);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
        expect(layoutOf(into)).toBe(LAYOUT);
        expect(statSync(into.layoutFile).mode & 0o777).toBe(0o444);
        expect(changesOf(into)).toEqual([]);
    });

    it('writes nothing and records nothing for the list the file already holds', async () => {
        const into = railTarget();
        const response = await send(into, [FOCUS]);
        expect(await response.json()).toEqual({ ok: true, changed: [], refused: [] });
        expect(changesOf(into)).toEqual([]);
    });

    it('records the change, and the undo puts the list back through the same writer', async () => {
        const into = railTarget();
        expect((await send(into, [FOCUS, INBOX])).status).toBe(200);
        const [change] = changesOf(into);
        expect(change).toMatchObject({
            kind: 'rail',
            key: 'rail',
            field: 'rail',
            before: [FOCUS],
            after: [FOCUS, INBOX],
            undo: 'field'
        });
        const undo = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(undo.status).toBe(200);
        expect(railOf(into)).toEqual([FOCUS]);
    });

    it('refuses the undo once the list has been edited since', async () => {
        const into = railTarget();
        await send(into, [FOCUS, INBOX]);
        const [change] = changesOf(into);
        await send(into, [INBOX]);
        const undo = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
        expect(undo.status).toBe(409);
        expect(railOf(into)).toEqual([INBOX]);
    });
});
