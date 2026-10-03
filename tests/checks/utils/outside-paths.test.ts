// Layer 4, test. The outside-paths report over a scratch repository of its own: what a brief's
// "Paths this step writes" section covers, what it leaves out, and the three ways the report
// refuses to compare.
//
// Each case makes a repository with one commit as the base, changes it, and runs the script from
// that repository's root as a reviewer does. What this does NOT cover: the checkout the oculus
// tests run in, which the script is never pointed at here.

import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { entriesOf, outside, sectionOf } from '../../../utils/outside-paths.mjs';

const SCRIPT = join(process.cwd(), 'utils', 'outside-paths.mjs');

const made: string[] = [];

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Run git in a directory, failing the case when it fails. */
function git(dir: string, ...args: string[]): void {
    const held = spawnSync(
        'git',
        ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args],
        { cwd: dir, encoding: 'utf8' }
    );
    expect(held.status, held.stderr).toBe(0);
}

/** Write a file under a directory, making the folders above it. */
function put(dir: string, rel: string, body = 'one\n'): void {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
}

/** A repository holding these files in one commit, the base the cases compare against. */
function repository(files: string[]): string {
    const dir = scratchDir('oculus-outside-paths-');
    made.push(dir);
    git(dir, 'init', '-q');
    for (const rel of files) put(dir, rel);
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'base');
    return dir;
}

/** A brief, in a scratch directory of its own, whose section names these entries. */
function brief(entries: string[], heading = '## Paths this step writes'): string {
    const path = join(scratchDir('oculus-outside-brief-'), 'brief.md');
    const lines = entries.map((one) => `- ${one}`).join('\n');
    writeFileSync(
        path,
        `# Step\n\nSome \`prose/with.token\` before.\n\n${heading}\n\n${lines}\n\n## Cases\n\n- \`later/file.ts\`\n`
    );
    return path;
}

/** The report, run from the repository's root against the base commit. */
function report(
    dir: string,
    briefPath: string,
    base = 'HEAD'
): { out: string[]; err: string; status: number | null } {
    const held = spawnSync('node', [SCRIPT, briefPath, base], { cwd: dir, encoding: 'utf8' });
    return {
        out: held.stdout.split('\n').filter((line) => line !== ''),
        err: held.stderr,
        status: held.status
    };
}

describe('the paths a step changed that its brief does not name', () => {
    it('prints nothing for a changed file the section names', () => {
        const dir = repository(['src/a.ts']);
        put(dir, 'src/a.ts', 'two\n');
        const held = report(dir, brief(['`src/a.ts`']));
        expect(held).toMatchObject({ out: [], status: 0 });
    });

    it('prints a changed file the section does not name', () => {
        const dir = repository(['src/a.ts', 'src/b.ts']);
        put(dir, 'src/a.ts', 'two\n');
        put(dir, 'src/b.ts', 'two\n');
        const held = report(dir, brief(['`src/a.ts`']));
        expect(held).toMatchObject({ out: ['src/b.ts'], status: 0 });
    });

    it('prints an untracked file the section does not name, and not an ignored one', () => {
        const dir = repository(['src/a.ts']);
        put(dir, '.gitignore', 'ignored.log\n');
        put(dir, 'src/new.ts');
        put(dir, 'ignored.log');
        const held = report(dir, brief(['`src/a.ts`']));
        expect(held.out).toEqual(['.gitignore', 'src/new.ts']);
    });

    it('prints a deleted file the section does not name', () => {
        const dir = repository(['src/a.ts', 'src/b.ts']);
        rmSync(join(dir, 'src', 'b.ts'));
        const held = report(dir, brief(['`src/a.ts`']));
        expect(held.out).toEqual(['src/b.ts']);
    });

    it('prints nothing for a file under a folder entry that ends with a slash', () => {
        const dir = repository(['src/lib/a.ts']);
        put(dir, 'src/lib/a.ts', 'two\n');
        put(dir, 'src/lib/deep/new.ts');
        put(dir, 'src/other.ts');
        const held = report(dir, brief(['`src/lib/`']));
        expect(held.out).toEqual(['src/other.ts']);
    });

    it('covers tools/oculus/<token> by a token written relative to tools/oculus', () => {
        const dir = repository(['tools/oculus/src/a.ts', 'tools/oculus/src/b.ts']);
        put(dir, 'tools/oculus/src/a.ts', 'two\n');
        put(dir, 'tools/oculus/src/b.ts', 'two\n');
        const held = report(dir, brief(['`src/a.ts`']));
        expect(held.out).toEqual(['tools/oculus/src/b.ts']);
    });

    it('prints the old and the new path of a rename when neither is named', () => {
        const dir = repository(['src/old.ts']);
        renameSync(join(dir, 'src', 'old.ts'), join(dir, 'src', 'new.ts'));
        git(dir, 'add', '-A');
        const held = report(dir, brief(['`src/other.ts`']));
        expect(held.out).toEqual(['src/new.ts', 'src/old.ts']);
    });

    it('prints a path holding a space or a non-ASCII letter as it is', () => {
        const dir = repository(['src/a.ts']);
        put(dir, 'src/with space.ts');
        put(dir, 'src/caf\u00e9.ts');
        const held = report(dir, brief(['`src/a.ts`']));
        expect(held.out).toEqual(['src/caf\u00e9.ts', 'src/with space.ts']);
    });

    it('lets a token of one segment cover only the path equal to it', () => {
        const dir = repository(['HELP.md', 'tools/oculus/HELP.md']);
        put(dir, 'HELP.md', 'two\n');
        put(dir, 'tools/oculus/HELP.md', 'two\n');
        const held = report(dir, brief(['`HELP.md`']));
        expect(held.out).toEqual(['tools/oculus/HELP.md']);
    });

    it('lets a token of two segments cover the same two segments under any folder', () => {
        const dir = repository(['a/x.ts', 'other/a/x.ts', 'other/b/x.ts']);
        put(dir, 'a/x.ts', 'two\n');
        put(dir, 'other/a/x.ts', 'two\n');
        put(dir, 'other/b/x.ts', 'two\n');
        const held = report(dir, brief(['`a/x.ts`']));
        expect(held.out).toEqual(['other/b/x.ts']);
    });

    it('reads a line range after a token as the whole file', () => {
        const dir = repository(['src/a.ts', 'src/b.ts']);
        put(dir, 'src/a.ts', 'two\n');
        put(dir, 'src/b.ts', 'two\n');
        const held = report(dir, brief(['`src/a.ts:12-30` and `src/b.ts` (`:4,9`)']));
        expect(held.out).toEqual([]);
    });

    it('reads only the backticked tokens of the section, and only up to the next heading', () => {
        const dir = repository(['later/file.ts', 'prose/with.token', 'src/a.ts']);
        put(dir, 'later/file.ts', 'two\n');
        put(dir, 'prose/with.token', 'two\n');
        put(dir, 'src/a.ts', 'two\n');
        const held = report(dir, brief(['`src/a.ts` and src/b.ts and `two words.ts`']));
        expect(held.out).toEqual(['later/file.ts', 'prose/with.token']);
    });
});

describe('the bullets that name entries', () => {
    it('takes the tokens of a bullet outside its parentheses and none inside them', () => {
        const dir = repository(['src/a.ts', 'lib/x.ts', 'src/b.ts']);
        put(dir, 'src/a.ts', 'two\n');
        put(dir, 'lib/x.ts', 'two\n');
        put(dir, 'src/b.ts', 'two\n');
        const held = report(dir, brief(['`src/a.ts` (its shared types are in `lib/`)']));
        expect(held.out).toEqual(['lib/x.ts', 'src/b.ts']);
    });

    it('takes every token of a bullet that does not start with one, and a token that holds parentheses', () => {
        const entries = entriesOf(
            [
                '- the files of item 20: `src/one.ts`, `src/(group)/two.ts` (their tests: `tests/one.ts`)',
                '- `lib/` and `docs/` (a note on `elsewhere/`)',
                '',
                'A paragraph that is no bullet and names `prose/` and `prose.ts`.'
            ].join('\n')
        );
        expect(entries).toEqual(['src/one.ts', 'src/(group)/two.ts', 'lib/', 'docs/']);
    });

    it('takes no folder a clause of a bullet names as an entry, so a path under it is printed', () => {
        const entries = entriesOf(
            sectionOf(
                '## Paths this step writes\n\n- `src/a.ts`, or, since `helpers/` is full, a folder `src/h/` holding it\n'
            ) ?? ''
        );
        expect(entries).toEqual(['src/a.ts', 'src/h/']);
        expect(outside(['x/helpers/b.ts', 'src/h/c.ts'], entries)).toEqual(['x/helpers/b.ts']);
    });

    it('leaves a folder named in prose out of the list, so a path under it is printed', () => {
        const entries = entriesOf(
            sectionOf(`## Paths this step writes\n\n- \`a.ts\` (kept in \`state/\`)\n`) ?? ''
        );
        expect(outside(['x/state/b.ts', 'a.ts'], entries)).toEqual(['x/state/b.ts']);
    });
});

/**
 * A real brief's list, copied in whole: a bullet with a folder in a parenthesis, a bullet whose
 * prose names a folder in a clause, and lists after a colon.
 */
const REAL_SECTION = [
    '## Paths this step writes',
    '',
    '- `tools/oculus/src/lib/views/sources/search/` (the three components, and new partials beside them)',
    '- `tools/oculus/src/lib/state/sources/search.svelte.ts`',
    '- `tools/oculus/src/lib/state/sources/search.ts`',
    '- `tools/oculus/src/lib/data/helpers/search.ts`, or, since `data/helpers/` is full, a folder `tools/oculus/src/lib/data/helpers/search/` holding it and the replace module (every importer follows)',
    '- `tools/oculus/tests/checks/tree/boundaries.test.ts` (the `data/helpers/search` entry and its head comment line, when the module moves or a new one is imported by `state/`)',
    '- `tools/oculus/src/lib/data/model/model-search.ts`',
    '- `tools/oculus/src/lib/data/file-ops.ts`',
    '- `tools/oculus/src/lib/server/files/search.ts`',
    '- `tools/oculus/src/lib/server/files/search-routes.ts`',
    '- `tools/oculus/src/routes/api/(files)/search/+server.ts`',
    '- `tools/oculus/src/lib/server/files/fs/replace.ts` (new)',
    '- `tools/oculus/src/lib/server/files/fs/ops.ts` (the `replace` branch of `run` and the preview branch of the compare route)',
    '- `tools/oculus/src/lib/server/files/fs/history.ts` (`HistoryKind`, the limit and the pruning of `replace` copies)',
    '- `tools/oculus/src/lib/server/edit/writes/file-undo.ts`',
    '- `tools/oculus/src/lib/views/system/history/rows.ts`',
    '- `tools/oculus/src/lib/state/sources/explorer/sections/timeline.ts`, `tools/oculus/src/lib/state/sources/explorer/sections/timeline-reads.ts`',
    "- `tools/oculus/src/lib/views/sources/files/` (the Timeline's word for a `replace` copy, where it is drawn)",
    '- `tools/oculus/src/lib/state/sources/explorer/ops.svelte.ts` (`unsaved` shared or called; the replace post)',
    "- `tools/oculus/src/lib/state/sessions/source.svelte.ts` (`reloadSource`, and item 20's line 145)",
    '- `tools/oculus/src/lib/state/sources/repositories/repositories.ts` (one field of `DiffSubject`, one line of `sideOf`, one line of the URL choice, the field in `heldDiffShape`)',
    '- `tools/oculus/src/lib/state/sources/repositories/replace-preview.ts` (new)',
    '- `tools/oculus/src/routes/api/(files)/ops/+server.ts` (the preview branch and the search timeout)',
    '- `tools/oculus/src/lib/state/client/entities.svelte.ts`, `tools/oculus/src/lib/state/client/socket.svelte.ts` (N1)',
    '- `tools/oculus/src/lib/state/sessions/terminal/pty-io.ts` (N7 and item 20)',
    '- `tools/oculus/src/lib/shell/keys/keys.ts`, `tools/oculus/src/lib/shell/keys/workbench-keys.svelte.ts` (Cmd+Shift+F and Cmd+Shift+H)',
    '- the files of item 20: `tools/oculus/src/lib/state/life/memories.svelte.ts`, `tools/oculus/src/lib/state/system/docs.svelte.ts`, `tools/oculus/src/lib/state/system/deposit.svelte.ts`, `tools/oculus/src/lib/state/sessions/transcript.svelte.ts`, `tools/oculus/src/lib/state/sessions/latex.svelte.ts`, `tools/oculus/src/lib/state/sessions/agents.svelte.ts`, `tools/oculus/src/lib/state/sessions/changes.svelte.ts`, `tools/oculus/src/lib/state/sources/fs.svelte.ts`, `tools/oculus/src/lib/state/sources/fs-transport.ts`, `tools/oculus/src/lib/state/client/writes.svelte.ts`, `tools/oculus/src/lib/views/system/help/Diagram.svelte`',
    "- `tools/oculus/config/text/views/sources/search.yml`, `tools/oculus/config/text/ui.yml` (the two `answer_` keys), `tools/oculus/config/text/app.yml` (the key sheet's `rows`, line 12), and the History view's, the Timeline's and the ops refusals' text files for the new words",
    '- `tools/oculus/HELP.md` lines 115 and 162-170',
    '- `tools/oculus/DESIGN.md` lines 130, 140 and 171, and the line of the ops refusals where `DESIGN.md` lists them',
    '- `tools/oculus/utils/outside-paths.mjs` (new), `tools/oculus/utils/unused-exports.sh` (new)',
    '- `tools/oculus/package.json`, `tools/oculus/package-lock.json` (`knip` as a devDependency, through `npm install --save-dev knip@6.39.0`)',
    '- `tools/oculus/knip.json` (new, only if Decision 4 needs it)',
    "- tests, in these folders and no other new place: `tools/oculus/tests/routes/replace/` (new: the ops replace, the preview route, the replace undo and redo, the search route's words), `tools/oculus/tests/data/helpers/` (the replace module, the template, the search helpers), the existing `tools/oculus/tests/state/sources/search.test.ts`, `tools/oculus/tests/state/sources/files.test.ts` and `tools/oculus/tests/state/sources/explorer/sections/sections.test.ts` (cases added in place, no file added to or moved out of `tests/state/sources/`), the existing `tools/oculus/tests/views/sources/search.test.ts`, the existing tests of the files of item 20, `tools/oculus/tests/state/client/config-seed.test.ts`, `tools/oculus/tests/views/system/` (the History words), `tools/oculus/tests/views/whole/type-scale.test.ts` (rows of the new Search partials), `tools/oculus/tests/shell/keys/keys.test.ts` (the two key actions), `tools/oculus/tests/checks/utils/outside-paths.test.ts` (new)",
    "- `tools/oculus/docs/diagrams/` (regenerated with `npm run diagrams` when the write chain's modules change)",
    '- `tools/oculus/.scratch/migration/agents/reviews/D32-report.md`',
    '',
    'A folder this step would take past ten items is split into folders named for what they hold, and the move is listed in the report; `tests/server/files/` and `tests/state/sources/` are not split by this step.'
].join('\n');

/** The paths that list leaves out among the ones its step changed. */
describe('a real brief read as a reviewer reads it', () => {
    const brief = REAL_SECTION;
    const root = 'tools/oculus/';
    const changed = [
        'src/lib/state/client/context.ts',
        'src/lib/state/shared/answers/answers.ts',
        'src/lib/state/sources/explorer/acts/undo.ts',
        'src/lib/state/sources/explorer/follow.ts',
        'src/lib/state/sources/search/hits.ts',
        'src/lib/state/sources/search/keys.ts',
        'src/lib/state/sources/search/search.svelte.ts',
        'src/lib/state/sources/search/search.ts',
        'src/lib/state/sources/search/walk.ts',
        'src/lib/state/sources/search/words.ts',
        'tests/state/sources/search/search.test.ts',
        'tests/state/sources/repositories/diff/diff-view.test.ts',
        'tests/state/shared/instance-state-sources.test.ts',
        // named by the list, so never printed
        'src/lib/state/sources/search.svelte.ts',
        'src/lib/views/sources/search/Results.svelte',
        'src/lib/server/files/fs/replace.ts',
        'src/lib/state/sources/repositories/replace-preview.ts',
        'tests/routes/replace/preview.test.ts',
        'tests/checks/utils/outside-paths.test.ts',
        'utils/outside-paths.mjs'
    ].map((one) => `${root}${one}`);

    it('takes no folder named in a parenthesis, a clause or a paragraph of its prose as an entry', () => {
        const entries = entriesOf(sectionOf(brief) ?? '');
        for (const prose of [
            'state/',
            'tests/state/sources/',
            'tests/server/files/',
            'data/helpers/'
        ]) {
            // these folders stand in a parenthesis, a clause or a paragraph of the brief, as prose
            expect(entries).not.toContain(prose);
        }
    });

    it('prints the state/sources/search files, the moved test folder and the other paths it does not name', () => {
        const entries = entriesOf(sectionOf(brief) ?? '');
        expect(outside(changed, entries)).toEqual(
            [
                'src/lib/state/client/context.ts',
                'src/lib/state/shared/answers/answers.ts',
                'src/lib/state/sources/explorer/acts/undo.ts',
                'src/lib/state/sources/explorer/follow.ts',
                'src/lib/state/sources/search/hits.ts',
                'src/lib/state/sources/search/keys.ts',
                'src/lib/state/sources/search/search.svelte.ts',
                'src/lib/state/sources/search/search.ts',
                'src/lib/state/sources/search/walk.ts',
                'src/lib/state/sources/search/words.ts',
                'tests/state/shared/instance-state-sources.test.ts',
                'tests/state/sources/repositories/diff/diff-view.test.ts',
                'tests/state/sources/search/search.test.ts'
            ].map((one) => `${root}${one}`)
        );
    });
});

describe('the report that cannot compare', () => {
    it('exits 2 with a sentence for a brief with no such section', () => {
        const dir = repository(['src/a.ts']);
        const held = report(dir, brief(['`src/a.ts`'], '## Other things'));
        expect(held.status).toBe(2);
        expect(held.err).toContain('no "## Paths this step writes" section');
        expect(held.out).toEqual([]);
    });

    it('exits 2 with a sentence for a brief that cannot be read', () => {
        const dir = repository(['src/a.ts']);
        const held = report(dir, join(dir, 'no-such-brief.md'));
        expect(held.status).toBe(2);
        expect(held.err).toContain('the brief cannot be read');
    });

    it('exits 2 with a sentence for a base git does not know', () => {
        const dir = repository(['src/a.ts']);
        const held = report(dir, brief(['`src/a.ts`']), 'no-such-commit');
        expect(held.status).toBe(2);
        expect(held.err).toContain('git does not know the base: no-such-commit');
    });
});
