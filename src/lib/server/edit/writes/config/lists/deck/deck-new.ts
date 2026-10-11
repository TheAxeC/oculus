// Layer 2, server. The acts that make a deck: a deck in a folder of a served root, and a deck made
// of the level-1 headings of a Markdown file.
//
// Both write the deck's `present.yml` and its slide files as new files and no other; a folder that
// already holds a `present.yml` is refused, and a file that is there is never written over. The
// title is one line (a break in it becomes a space) and is written as a single-quoted YAML scalar.
// Each file is one record holding its text before (empty) and after, under one key, so History
// takes the act back as one step (deck-undo.ts), which also removes the folder an outline made.

import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, posix } from 'node:path';
import { TEXT_LIMIT } from '../../../../../../data/file-ops.ts';
import { DECK_FILE } from '../../../../../../data/sources/deck/read.ts';
import { outlineOf } from '../../../../../../data/sources/deck/outline.ts';
import {
    closingText,
    oneLine,
    presentText
} from '../../../../../../data/sources/deck/slide-text.ts';
import { writeTextAtomic } from '../../../../../core/json.ts';
import { words } from '../../../../../core/words.ts';
import { resolveRootPath } from '../../../../../files/files.ts';
import { actKey, recordFor, type ActOutcome } from './deck-files.ts';
import type { WriteTarget } from '../../../../writes.ts';

/** The slide files a deck made from an outline holds besides its `present.yml`. */
const SLIDES = 'slides.md';
const CLOSING = 'closing.md';

/** The refusal of an act that names a path rather than an open deck. */
function refused(path: string, reason: string): ActOutcome {
    return { changed: [], refused: [{ field: path, reason }] };
}

/** A deck in the folder `folder` of the served root `root`, with a closing slide. */
export function createDeck(
    into: WriteTarget,
    request: { root: string; folder: string; title: string }
): ActOutcome {
    const roots = into.files?.roots();
    if (roots === undefined) return { error: 'unwritable' };
    const { root, folder } = request;
    const at = resolveRootPath(roots, root, folder);
    if ('error' in at) {
        const reason =
            at.error === 'outside'
                ? words(into.config.text, 'server.deck_edit.outside')
                : words(into.config.text, 'server.deck_edit.no_folder', folder);
        return refused(folder, reason);
    }
    if (!statSync(at.path).isDirectory()) {
        return refused(folder, words(into.config.text, 'server.deck_edit.no_folder', folder));
    }
    if (existsSync(join(at.path, DECK_FILE))) {
        return refused(folder, words(into.config.text, 'server.deck_edit.has_deck', folder));
    }
    const title = oneLine(request.title);
    if (title === '')
        return refused(folder, words(into.config.text, 'server.deck_edit.title_empty'));
    const act = actKey();
    const records: ReturnType<typeof recordFor>[] = [];
    const changed: string[] = [];
    const put = (name: string, text: string): void => {
        const file = join(at.path, name);
        writeTextAtomic(file, text);
        records.push(recordFor({ into, act }, 'create', file, '', text));
        changed.push(posix.join(folder === '.' ? '' : folder, name));
    };
    put(DECK_FILE, presentText(title, [CLOSING]));
    if (!existsSync(join(at.path, CLOSING))) put(CLOSING, closingText(title));
    return { changed, refused: [], records, id: folder };
}

/**
 * A deck beside a Markdown file, in a new folder `<stem>-slides` (then `-2` and on): the file's
 * outline as its slides, and a closing slide. The Markdown file is not changed.
 */
export function outlineDeck(
    into: WriteTarget,
    request: { root: string; file: string }
): ActOutcome {
    const roots = into.files?.roots();
    if (roots === undefined) return { error: 'unwritable' };
    const { root, file } = request;
    const at = resolveRootPath(roots, root, file);
    if ('error' in at) {
        const reason =
            at.error === 'outside'
                ? words(into.config.text, 'server.deck_edit.outside')
                : words(into.config.text, 'server.deck_edit.no_file', file);
        return refused(file, reason);
    }
    if (!/\.md$/i.test(at.path) || !statSync(at.path).isFile()) {
        return refused(file, words(into.config.text, 'server.deck_edit.not_markdown', file));
    }
    if (statSync(at.path).size > TEXT_LIMIT)
        return refused(file, words(into.config.text, 'server.deck_edit.file_large', file));
    const stem = basename(at.path).replace(/\.md$/i, '');
    const outline = outlineOf(readFileSync(at.path, 'utf8'), stem);
    const title = oneLine(outline.title) === '' ? stem : oneLine(outline.title);
    const parent = dirname(at.path);
    let name = `${stem}-slides`;
    for (let held = 2; existsSync(join(parent, name)); held += 1) name = `${stem}-slides-${held}`;
    const folder = join(parent, name);
    mkdirSync(folder);
    const under = posix.join(
        posix.dirname(file.replaceAll('\\', '/')) === '.'
            ? ''
            : posix.dirname(file.replaceAll('\\', '/')),
        name
    );
    const act = actKey();
    const records: ReturnType<typeof recordFor>[] = [];
    const changed: string[] = [];
    const put = (leaf: string, text: string): void => {
        const target = join(folder, leaf);
        writeTextAtomic(target, text);
        records.push(recordFor({ into, act }, 'outline', target, '', text));
        changed.push(posix.join(under, leaf));
    };
    put(DECK_FILE, presentText(title, [SLIDES, CLOSING]));
    put(SLIDES, outline.slides);
    put(CLOSING, closingText(title));
    return { changed, refused: [], records, id: under };
}
