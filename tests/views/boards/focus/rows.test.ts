// Layer 4, test. The button a Focus board row keeps drawn when the pointer is elsewhere: a
// subtask's done, and on an entry's row the button of the status carrying `task_done` in the words
// of the entry's own hub, which is oculus's `done` unless the hub names another word; an entry of a
// hub in which two words carry the flag keeps none. The words are installed as the page installs
// them, oculus's own and one hub's, built in the case, so no file is read for them.

import { describe, expect, it } from 'vitest';
import { hubVocabs } from '../../../../src/lib/data/index.ts';
import type { HubVocab } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { TickerItem } from '../../../../src/lib/state/boards/ticker.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';
import { rowMaker } from '../../../../src/lib/views/boards/focus/rows.ts';

const { config } = loadConfig(engineDir());

setCatalog(textCatalog(config));

/** A hub's vocabulary holding `words` and nothing else of its own. */
function vocab(words: Record<string, unknown>): HubVocab {
    return {
        domains: {},
        venue_themes: [],
        data_themes: [],
        collections: [],
        list: { file: '', value: null },
        words,
        new_project_dir: {}
    };
}

/** A task entry's line of the hub `root`, whose collection offers `statuses`. */
function taskLine(root: string, statuses: string[]): TickerItem {
    return {
        kind: 'task',
        glyph: '',
        label: 'Write the letter',
        days: null,
        root,
        status: 'todo',
        target: { kind: 'entry', id: 'letter', collection: 'tasks', statuses, task: true },
        snoozed: false
    };
}

/** The id of the button the row drawn for `line` keeps. */
function keptOf(line: TickerItem): string | undefined {
    const rows = rowMaker('t');
    return rows.kept(rows.row(line, ''));
}

describe('the button a Focus board row keeps drawn', () => {
    setVocab(
        hubVocabs({ primary: null, folders: ['lab', 'twice'], own: config }, null, [
            {
                key: 'lab',
                vocab: vocab({ statuses: { todo: {}, closed: { task_done: true }, done: {} } })
            },
            {
                key: 'twice',
                vocab: vocab({
                    statuses: { closed: { task_done: true }, done: { task_done: true } }
                })
            }
        ])
    );
    const statuses = ['todo', 'closed', 'done'];

    it("keeps the status carrying task_done in the words of the entry's own hub (G13)", () => {
        expect(keptOf(taskLine('lab', statuses))).toBe('status:closed');
        expect(keptOf(taskLine('home', statuses))).toBe('status:done');
    });

    it('keeps no status button where two words of the hub carry task_done (G13)', () => {
        expect(keptOf(taskLine('twice', statuses))).toBe(undefined);
    });

    it("keeps a subtask's done whatever the hub's words (G13)", () => {
        const line = taskLine('twice', statuses);
        const subtask = {
            ...line,
            subtaskDo: 'Post it',
            target: { kind: 'entry' as const, id: 'letter', collection: 'tasks', subtask: 's1' }
        };
        expect(keptOf(subtask)).toBe('done');
    });
});
