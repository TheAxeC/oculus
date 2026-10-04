// Layer 4, server test. The config-key writer: one option of a tracked config file set in place,
// the refusals that leave the file as it was, and the bytes it keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder with the machine's
// own file left out (tests/routes/edit/write-fixture.ts), so the writer reads the catalog, the text
// and the other files from the copy and writes the copy. What this does NOT cover: the route that
// carries the writer (tests/routes/edit/config-key.test.ts) and the page's call of it.
//
// A case that merges the whole config folder and takes 100 ms or more in a run of its own is
// tagged slow.

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { writeConfigKey } from '../../../src/lib/server/edit/writes/config/config-key.ts';
import { it } from '../../fixtures/scratch.ts';
import { engineFile, refusalOf, scratchEngine } from '../../routes/edit/write-fixture.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One of the writer's own reason sentences, out of config/text/server.yml. */
function why(key: string, ...args: string[]): string {
    return words(CATALOG, `server.config_key.${key}`, ...args);
}

const KEEP = 'behavior.yml:changes.keep';

/** The `changes:` block of config/behavior.yml as the checkout holds it. */
const KEEP_BLOCK = 'changes:\n  keep: 500\n';

/** The block a case starts from: a comment above `keep` and a comment after its value. */
const KEEP_HELD = 'changes:\n  # how long the log is\n  keep: 200  # how many\n';

/** A scratch engine whose file holds the text `change` made of the checkout's. */
function engineWith(file: string, change: (text: string) => string): string {
    const engine = scratchEngine();
    const path = engineFile(engine, file);
    const original = readFileSync(path, 'utf8');
    const changed = change(original);
    expect(changed).not.toBe(original);
    writeFileSync(path, changed);
    return engine;
}

/** The text with the `changes:` block of KEEP_HELD in it. */
function keepText(text: string): string {
    return text.replace(KEEP_BLOCK, KEEP_HELD);
}

/** A scratch engine whose `changes.keep` holds 200 with the comments of KEEP_HELD. */
function keepEngine(): string {
    return engineWith('behavior.yml', keepText);
}

/** One file of a scratch engine, as it is now. */
function held(engine: string, file = 'behavior.yml'): string {
    return readFileSync(engineFile(engine, file), 'utf8');
}

describe('one value written over its own bytes', { tags: ['slow'] }, () => {
    it('replaces the value and keeps every other byte, the comment on its line included', () => {
        const engine = keepEngine();
        const before = held(engine);
        const outcome = writeConfigKey(engine, 'behavior.yml', 'changes.keep', 300);
        expect(outcome.changed).toEqual([KEEP]);
        expect(outcome.refused).toEqual([]);
        expect(held(engine)).toBe(before.replace('keep: 200  # how many', 'keep: 300  # how many'));
        expect(outcome.records).toEqual([
            {
                file: engineFile(engine, 'behavior.yml'),
                key: 'behavior.yml',
                field: 'changes.keep',
                before: 200,
                after: 300,
                undo: 'field'
            }
        ]);
    });
});

describe('an option the catalog does not hold', { tags: ['slow'] }, () => {
    it("refuses the machine's own file without reading it", () => {
        const engine = scratchEngine();
        const local = engineFile(engine, 'local.yml');
        writeFileSync(local, 'port: 8791\n');
        const stamp = statSync(local).mtimeMs;
        const outcome = writeConfigKey(engine, 'local.yml', 'port', 8792);
        expect(refusalOf(outcome, 'local.yml:port')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
        expect(statSync(local).mtimeMs).toBe(stamp);
    });
});
