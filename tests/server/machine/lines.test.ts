// Layer 4, server test. The Status view's line counter (src/lib/server/machine/lines.ts): the
// folder a path is counted under, the lines the TODO rule counts, and the real counter, git and
// cloc included, over scratch repositories this file makes and throws away.
//
// The TODO cases are written with the tag held in a constant, so this file's own source holds no
// line the rule counts and the live table's tests row says what the tree holds rather than what
// these cases quote.
//
// The spawn the counter runs cloc with is recorded, the real one still running, so a case can see
// that a closed request left no cloc running.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { chmodSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { describe, expect, vi } from 'vitest';
import {
    TOP_LEVEL,
    countLines,
    counted,
    folderOf,
    todoLine
} from '../../../src/lib/server/machine/lines.ts';
import type { LineCount } from '../../../src/lib/data/model/index.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';
import { gitText as git } from '../root/watch/repos.ts';
import { folder, language, tally } from './line-counts.ts';

/** Every child the counter spawned, in order. */
const spawned = vi.hoisted(() => [] as ChildProcess[]);

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    return {
        ...actual,
        spawn: ((...args: Parameters<typeof actual.spawn>) => {
            const child = actual.spawn(...args);
            spawned.push(child);
            return child;
        }) as typeof actual.spawn
    };
});

/** The tag, apart from every case line, so no line of this file is itself a counted one. */
const TAG = 'TODO';

describe('the folder a path is counted under', () => {
    it('counts a path under src/lib/<x>/ under that folder', () => {
        expect(folderOf('src/lib/views/system/status/Status.svelte')).toBe('src/lib/views');
        expect(folderOf('src/lib/server/accounts/calendar/poll.ts')).toBe('src/lib/server');
    });

    it('counts every route under src/routes and the rest of src under src', () => {
        expect(folderOf('src/routes/api/(docs)/docs/+server.ts')).toBe('src/routes');
        expect(folderOf('src/hooks.server.ts')).toBe('src');
        expect(folderOf('src/lib/highlight-languages.d.ts')).toBe('src');
    });

    it('counts any other path under its first segment, and a bare name at the top level', () => {
        expect(folderOf('tests/views/feeds/radar.test.ts')).toBe('tests');
        expect(folderOf('config/text/app.yml')).toBe('config');
        expect(folderOf('HELP.md')).toBe(TOP_LEVEL);
    });

    it('leaves out the ledger, the generated diagrams and the lock file', () => {
        expect(counted('.scratch/migration/plan.md')).toBe(false);
        expect(counted('docs/diagrams/channels.svg')).toBe(false);
        expect(counted('package-lock.json')).toBe(false);
        expect(counted('HELP.md')).toBe(true);
        expect(counted('src/lib/views/system/status/Status.svelte')).toBe(true);
    });
});

describe('the lines the TODO rule counts', () => {
    it('counts a tag after a comment marker, and one opening a line with a colon', () => {
        for (const line of [
            `// ${TAG} fix this`,
            `# ${TAG}(axel): x`,
            `- ${TAG}: write`,
            `foo(); // ${TAG}: x`,
            `<!-- ${TAG}: x -->`
        ]) {
            expect(todoLine(line), line).toBe(true);
        }
    });

    it('counts no prose, no lowercase word, no longer word and no tag the line only mentions', () => {
        for (const line of [
            `${TAG}s are fine`,
            'todo: add(c)',
            `${TAG} the thing`,
            `${TAG}_PATTERN = 1`,
            `export const ${TAG}_LABEL = 'todo';`,
            `        sec_todo: Open items (${TAG} / VERIFY)`
        ]) {
            expect(todoLine(line), line).toBe(false);
        }
    });
});

/** A scratch repository holding these files, every one of them added to the index. */
function repository(files: Record<string, string>): string {
    const dir = plantScratch('oculus-lines-', files);
    git(dir, 'init', '--quiet');
    git(dir, 'add', '--', ...Object.keys(files));
    return dir;
}

/** The two counted files and the three the counter leaves out. */
const FILES: Record<string, string> = {
    'a.ts': `// head\nconst a = 1;\n\n// ${TAG}: b\n`,
    'src/lib/x/b.svelte': '<script>\n    let b = 1;\n</script>\n\n<p>{b}</p>\n',
    '.scratch/n.md': `# note\n\n- ${TAG}: left out\n`,
    'docs/diagrams/d.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n',
    'package-lock.json': '{ "name": "x" }\n'
};

/** The count a case expects to be one, refusing an error in its place. */
function answered(answer: LineCount | { error: string }): LineCount {
    if ('error' in answer) throw new Error(`the counter failed: ${answer.error}`);
    return answer;
}

describe('the counter', () => {
    it('counts the tracked files by folder and language, cloc giving the lines', async () => {
        const count = answered(await countLines(repository(FILES)));
        expect(count.rows).toEqual([
            folder(TOP_LEVEL, [1, 1, 2, 1, 1], [language('TypeScript', [1, 1, 2, 1, 1])]),
            folder('src/lib/x', [1, 1, 0, 4, 0], [language('Svelte', [1, 1, 0, 4, 0])])
        ]);
        expect(count.total).toEqual(tally([2, 2, 2, 5, 1]));
        expect(Number.isNaN(Date.parse(count.counted))).toBe(false);
        const said = JSON.stringify(count);
        for (const left of ['.scratch', 'diagrams', 'package-lock', 'SVG', 'JSON', 'Markdown']) {
            expect(said).not.toContain(left);
        }
    });

    it('counts no untracked file beside the tracked ones', async () => {
        const dir = repository(FILES);
        writeFileSync(join(dir, 'loose.ts'), `const loose = 1;\n// ${TAG}: loose\n`);
        writeFileSync(join(dir, 'src/lib/x/c.svelte'), '<p>c</p>\n');
        const count = answered(await countLines(dir));
        expect(count.total).toEqual(tally([2, 2, 2, 5, 1]));
        expect(count.rows.map((row) => row.files)).toEqual([1, 1]);
    });

    it('counts two tracked files with the same bytes as two files', async () => {
        const dir = repository({ ...FILES, 'src/lib/y/b.svelte': FILES['src/lib/x/b.svelte'] });
        const count = answered(await countLines(dir));
        expect(count.rows.map((row) => [row.folder, row.files, row.code])).toEqual([
            [TOP_LEVEL, 1, 1],
            ['src/lib/x', 1, 4],
            ['src/lib/y', 1, 4]
        ]);
        expect(count.total.files).toBe(3);
    });

    it('answers an error naming git for a folder that is no repository, and throws nothing', async () => {
        const answer = await countLines(scratchDir('oculus-lines-plain-'));
        expect('error' in answer).toBe(true);
        if (!('error' in answer)) return;
        expect(answer.error.startsWith('git could not list the tracked files')).toBe(true);
        expect(answer.error).not.toContain('\n');
        expect(answer.error).not.toMatch(/\bat .*:\d+:\d+/);
    });

    it('answers an error naming cloc when cloc exits non-zero', async () => {
        const dir = repository(FILES);
        const script = join(scratchDir('oculus-lines-cloc-'), 'cloc');
        writeFileSync(script, 'exit 1;\n');
        chmodSync(script, 0o755);
        const answer = await countLines(dir, { cloc: script });
        expect(answer).toEqual({ error: 'cloc exited with code 1.' });
    });

    it('answers an error naming perl and cloc when perl cannot be started', async () => {
        const dir = repository(FILES);
        const perl = join(scratchDir('oculus-lines-noperl-'), 'no-such-perl');
        const answer = await countLines(dir, { perl });
        expect('error' in answer).toBe(true);
        if (!('error' in answer)) return;
        expect(answer.error.startsWith('perl could not be started to run cloc')).toBe(true);
        expect(answer.error).toContain('ENOENT');
    });

    it('kills cloc and answers no count when the request is closed while it runs', async () => {
        const dir = repository(FILES);
        const script = join(scratchDir('oculus-lines-abort-'), 'cloc');
        writeFileSync(script, 'sleep 30;\n');
        const closing = new AbortController();
        const before = spawned.length;
        const counting = countLines(dir, { cloc: script, signal: closing.signal, timeout: 3000 });
        await new Promise((wake) => setTimeout(wake, 200));
        expect(spawned.length).toBe(before + 1);
        const child = spawned[before];
        expect(child.exitCode === null && child.signalCode === null).toBe(true);
        closing.abort();
        const answer = await counting;
        expect(answer).toEqual({ error: 'The request was closed, so cloc was stopped.' });
        expect(child.killed).toBe(true);
        // The kill is sent; the child is gone once it closes, which it does by that signal.
        if (child.exitCode === null && child.signalCode === null) {
            await new Promise((wake) => child.once('close', wake));
        }
        expect(child.signalCode).toBe('SIGTERM');
    });

    it('reads no further file once the request is closed after cloc has answered', async () => {
        const dir = repository(FILES);
        const script = join(scratchDir('oculus-lines-late-'), 'cloc');
        const answer = { 'a.ts': { language: 'TypeScript', blank: 1, comment: 2, code: 1 } };
        writeFileSync(script, `print '${JSON.stringify(answer)}';\n`);
        const closing = new AbortController();
        const before = spawned.length;
        const counting = countLines(dir, { cloc: script, signal: closing.signal });
        expect(spawned.length).toBe(before + 1);
        // The child has exited and its abort listener is gone, so the close reaches only the files.
        spawned[before].once('exit', () => closing.abort());
        expect(await counting).toEqual({ error: 'The request was closed.' });
    });

    it('starts no cloc for a request already closed', async () => {
        const dir = repository(FILES);
        const closing = new AbortController();
        closing.abort();
        const before = spawned.length;
        expect(await countLines(dir, { signal: closing.signal })).toEqual({
            error: 'The request was closed.'
        });
        expect(spawned.length).toBe(before);
    });

    it('answers an error naming cloc when cloc runs past its time', async () => {
        const dir = repository(FILES);
        const script = join(scratchDir('oculus-lines-slow-'), 'cloc');
        writeFileSync(script, 'sleep 5;\n');
        const started = Date.now();
        const answer = await countLines(dir, { cloc: script, timeout: 200 });
        expect(Date.now() - started).toBeLessThan(4000);
        expect(answer).toEqual({
            error: 'cloc was stopped by SIGTERM before it answered; it is given 0.2 s.'
        });
    });

    it('answers an error naming cloc when its answer is not JSON', async () => {
        const dir = repository(FILES);
        const script = join(scratchDir('oculus-lines-prose-'), 'cloc');
        writeFileSync(script, 'print "no json here\\n";\n');
        const answer = await countLines(dir, { cloc: script });
        expect('error' in answer).toBe(true);
        if (!('error' in answer)) return;
        expect(answer.error).toMatch(/\bcloc\b/);
    });
});
