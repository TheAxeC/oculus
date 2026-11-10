// Layer 2, server test. The rules of the portfolio watcher's folder-glob handles
// (server/root/watch/portfolio/glob-drop.ts): which keys of the store of folder-glob matches one
// watch event drops, and whether it rebuilds the snapshot. The keys are taken over a walk that
// answers fixed matches, and each event says what its path is, so no folder is read.

import { describe, expect } from 'vitest';
import { folderGlobs } from '../../../../src/lib/data/sources/documents/folder-globs.ts';
import {
    droppedKeys,
    movedFolder,
    type PathNow
} from '../../../../src/lib/server/root/watch/portfolio/glob-drop.ts';
import { it } from '../../../fixtures/scratch.ts';

/** The folder the keys are walked under; no folder of the machine. */
const ROOT = '/fixture/hub';

/** A deck folder pattern, one that names the deck file, and one whose last segment is a glob. */
const FOLDERS = 'projects/**/present';
const FILES = 'projects/**/present.yml';
const SLIDES = 'slides/*';

/** The three keys, each held with the one match its walk answers. */
function held() {
    const answers: Record<string, string[]> = {
        [FOLDERS]: ['projects/active/a/present'],
        [FILES]: ['projects/active/a/present/present.yml'],
        [SLIDES]: ['slides/one']
    };
    const globs = folderGlobs({ walk: (pattern) => answers[pattern] ?? [] });
    globs.matches(ROOT, FOLDERS);
    globs.matches(ROOT, FILES);
    globs.matches(ROOT, SLIDES);
    return globs.held();
}

const BOTH = [`${ROOT}\n${FOLDERS}`, `${ROOT}\n${FILES}`];

/**
 * The folders the hubs' settings leave out of the watch, as segments: the code folder `code` of
 * `code_dir` and the folder `attic` of a hub's `audit.skip_folders`.
 */
const NEVER = [['code'], ['attic']];

type Row = {
    row: string;
    type: string;
    root?: string;
    path: string;
    now: PathNow;
    drops: string[];
};

const ROWS: Row[] = [
    {
        row: 'a folder made under the fixed part drops both',
        type: 'rename',
        path: 'projects/active/c',
        now: 'folder',
        drops: BOTH
    },
    {
        row: 'a folder name gone that was a held match drops both',
        type: 'rename',
        path: 'projects/active/a/present',
        now: 'gone',
        drops: BOTH
    },
    {
        row: 'a gone name that is an ancestor of a held match drops both',
        type: 'rename',
        path: 'projects/active/a',
        now: 'gone',
        drops: BOTH
    },
    {
        row: 'a write-file-atomic temporary name gone drops nothing',
        type: 'rename',
        path: 'projects/active/a/present/main.md.2215404123',
        now: 'gone',
        drops: []
    },
    {
        row: "a file renamed into place whose name is not the pattern's last segment drops nothing",
        type: 'rename',
        path: 'projects/active/a/present/main.md',
        now: 'file',
        drops: []
    },
    {
        row: 'a present.yml renamed into place drops the key of the present.yml pattern',
        type: 'rename',
        path: 'projects/active/b/present/present.yml',
        now: 'file',
        drops: [`${ROOT}\n${FILES}`]
    },
    {
        row: 'a change event drops nothing',
        type: 'change',
        path: 'projects/active/c',
        now: 'folder',
        drops: []
    },
    {
        row: 'a folder made under code/ drops nothing',
        type: 'rename',
        path: 'projects/active/a/code/present',
        now: 'folder',
        drops: []
    },
    {
        row: 'a folder made under attic/ drops nothing',
        type: 'rename',
        path: 'projects/active/a/attic/old',
        now: 'folder',
        drops: []
    },
    {
        row: 'a folder made outside the fixed part drops nothing',
        type: 'rename',
        path: 'deck/new',
        now: 'folder',
        drops: []
    },
    {
        row: 'a folder made under a dot folder the pattern does not name drops nothing',
        type: 'rename',
        path: 'projects/active/.cache/present',
        now: 'folder',
        drops: []
    },
    {
        row: 'a folder made under another root drops nothing',
        type: 'rename',
        root: '/fixture/other',
        path: 'projects/active/c',
        now: 'folder',
        drops: []
    },
    {
        row: 'the temporary name of a slide save under slides/* drops nothing',
        type: 'rename',
        path: 'slides/one/main.md.2215404123',
        now: 'gone',
        drops: []
    },
    {
        row: 'a slide file renamed into place under slides/* drops nothing',
        type: 'rename',
        path: 'slides/one/main.md',
        now: 'file',
        drops: []
    },
    {
        row: 'a present.yml renamed into slides/one/ drops the key of slides/*',
        type: 'rename',
        path: 'slides/one/present.yml',
        now: 'file',
        drops: [`${ROOT}\n${SLIDES}`]
    }
];

describe('the keys one watch event drops (case C15)', () => {
    it.each(ROWS)('$row', ({ type, root, path, now, drops }) => {
        const event = { type, root: root ?? ROOT, path, now: () => now, manifest: () => false };
        expect(droppedKeys(event, held(), NEVER)).toEqual(drops);
    });
});

/** The scan folder of the rebuild rows, and the project folders the last snapshot names. */
const SCANNED = [`${ROOT}/projects/active`];
const PROJECTS = [`${ROOT}/projects/active/a`, `${ROOT}/projects/active/group/b`];

type MoveRow = {
    row: string;
    type?: string;
    path: string;
    now: PathNow;
    manifest?: boolean;
    rebuilds: boolean;
};

const MOVES: MoveRow[] = [
    {
        row: 'a folder made that holds a project manifest rebuilds',
        path: 'projects/active/c',
        now: 'folder',
        manifest: true,
        rebuilds: true
    },
    {
        row: 'a filing folder that holds a project below it, moved in, rebuilds',
        path: 'projects/active/filed',
        now: 'folder',
        manifest: true,
        rebuilds: true
    },
    {
        row: 'a folder made inside a project rebuilds nothing',
        path: 'projects/active/a/results/run1',
        now: 'folder',
        rebuilds: false
    },
    {
        row: 'a folder holding a manifest made inside a project of the snapshot rebuilds nothing',
        path: 'projects/active/a/copy',
        now: 'folder',
        manifest: true,
        rebuilds: false
    },
    {
        row: 'a project folder of the snapshot gone rebuilds',
        path: 'projects/active/a',
        now: 'gone',
        rebuilds: true
    },
    {
        row: 'a gone folder above a project folder of the snapshot rebuilds',
        path: 'projects/active/group',
        now: 'gone',
        rebuilds: true
    },
    {
        row: 'a gone folder inside a project that is no held match rebuilds nothing',
        path: 'projects/active/a/results/run1',
        now: 'gone',
        rebuilds: false
    },
    {
        row: 'a gone held match rebuilds',
        path: 'projects/active/a/present',
        now: 'gone',
        rebuilds: true
    },
    {
        row: 'a file renamed into place rebuilds nothing',
        path: 'projects/active/a/notes.txt',
        now: 'file',
        rebuilds: false
    },
    {
        row: 'a manifest folder made under code/ rebuilds nothing',
        path: 'projects/active/a/code/b',
        now: 'folder',
        manifest: true,
        rebuilds: false
    },
    {
        row: 'a manifest folder made under a dot folder rebuilds nothing',
        path: 'projects/active/.trash/b',
        now: 'folder',
        manifest: true,
        rebuilds: false
    },
    {
        row: 'a change event rebuilds nothing',
        type: 'change',
        path: 'projects/active/c',
        now: 'folder',
        manifest: true,
        rebuilds: false
    }
];

describe('the events that rebuild the snapshot, the rule of case C4', () => {
    it.each(MOVES)('$row', ({ type, path, now, manifest, rebuilds }) => {
        const event = {
            type: type ?? 'rename',
            root: ROOT,
            path,
            now: () => now,
            manifest: () => manifest === true
        };
        expect(movedFolder(event, held(), SCANNED, PROJECTS, NEVER)).toBe(rebuilds);
    });
});
