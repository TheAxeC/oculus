// Layer 2, client-state tests. The update notices the notice source posts from the portfolio's
// feed summary: a date a feed carried before the page read it posts nothing, a feed a hub's
// settings add later included, and a new date of a feed the page has read posts once.

import { describe, expect, it } from 'vitest';
import { createNoticeSources } from '../../../../src/lib/state/workbench/navigation/notice-sources.ts';
import type { HubTask } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The scout task of the hub `lab`, as the tray offers a row of its `update_tasks`. */
const SCOUT: HubTask = {
    task: 'scout',
    hub: 'lab',
    label: 'Scout',
    note: '',
    view: 'leads',
    lastRun: 'scout',
    file: '/lab/.oculus/config.yml',
    at: 'update_tasks[0]'
};

/** A notice source whose posts are kept, offering the scout task of `lab`. */
function source(): { hear: (scout: { lastRun: string | null } | null) => void; posts: string[] } {
    const posts: string[] = [];
    let version = 0;
    const sources = createNoticeSources(
        { post: (text) => posts.push(text) },
        {
            openSession: () => undefined,
            openView: () => undefined,
            offered: () => [SCOUT],
            saveWorkspace: () => undefined
        }
    );
    const hear = (scout: { lastRun: string | null } | null): void => {
        version += 1;
        const row = { hub: 'lab', radar: null, scout, linkedin: null };
        sources.heard({
            channel: 'portfolio',
            version,
            payload: { entities: { feeds: { byHub: [row] } } }
        });
    };
    return { hear, posts };
}

describe('the update notice of a feed of a hub', () => {
    it("posts nothing for the date a feed held when the hub's settings added it, then each new date", () => {
        const { hear, posts } = source();
        hear(null);
        hear({ lastRun: '2026-11-05' });
        expect(posts).toEqual([]);
        hear({ lastRun: '2026-11-09' });
        expect(posts).toEqual([t('statusbar.notice_update', 'Scout')]);
    });

    it('posts the first run of a feed that had never run', () => {
        const { hear, posts } = source();
        hear({ lastRun: null });
        hear({ lastRun: '2026-11-05' });
        expect(posts).toEqual([t('statusbar.notice_update', 'Scout')]);
    });
});
