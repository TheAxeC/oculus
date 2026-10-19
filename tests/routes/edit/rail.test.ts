// Layer 2, route tests. What the /api/write route does with the rail list: the `rail:` list of
// config/layout.yml rewritten over its bytes with every other line kept, the change taken back
// through the log.
//
// The layout file is a copy under the system temporary directory beside the fixture's hub, asserted
// to be inside it before anything is written, so no case here writes the engine's own
// config/layout.yml.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no
// case pays for it.

import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, test } from '../../fixtures/scratch.ts';
import { TOKEN, changesOf, request, target, warmConfig } from './write-fixture.ts';

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

test.beforeAll(warmConfig);

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

    it("writes a button's group chord and group glyph, and refuses a chord that is no letter", async () => {
        const into = railTarget();
        const grouped = { ...INBOX, chord: 'e', group_glyph: 'compass' };
        expect((await send(into, [FOCUS, grouped])).status).toBe(200);
        expect(railOf(into)).toEqual([FOCUS, grouped]);
        expect(layoutOf(into)).toContain(
            '  - { label: "Mail: in", glyph: inbox, page: inbox, chord: e, group_glyph: compass }\n'
        );
        const before = layoutOf(into);
        const refused = await send(into, [FOCUS, { ...INBOX, chord: 'EE' }]);
        expect(refused.status).not.toBe(200);
        expect(layoutOf(into)).toBe(before);
    });
});
