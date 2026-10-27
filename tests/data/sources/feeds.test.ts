// Layer 1, data tests. sources/documents/feeds.ts over a synthetic hub: every feed shape. The files
// are written under mkdtemp and every path is checked to be inside it before anything is written;
// nothing here touches the real hub.
//
// What this does NOT cover: the feed views themselves. This reads the counts and run dates the
// command center needs, and the Inbox, Lit Watch and Position Leads views read the entries.

import { describe, expect } from 'vitest';
import { readFeeds } from '../../../src/lib/data/sources/documents/feeds.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { FeedFiles } from '../../../src/lib/data/model/index.ts';
import { it, plantScratch, test } from '../../fixtures/scratch.ts';

/**
 * The config oculus ships, whose `statuses` say which lead statuses are closed, and the catalog the
 * findings are worded from, read out of it as the server reads it.
 */
const ENGINE = loadConfig(engineDir()).config;
const CATALOG = textCatalog(ENGINE);

const FILES: FeedFiles = {
    leads: '.oculus/data/academic/leads.yml',
    radar: '.oculus/data/literature/radar.yml',
    linkedin: 'site/_linkedin'
};

/** A hub of its own, with the given files written into it. */
function hub(files: Record<string, string>): string {
    const dir = plantScratch('oculus-feeds-', files);
    return dir;
}

/**
 * What readFeeds answers over a hub planted with the files, read by the block's own beforeAll from
 * the fixture, so a run that skips the block plants nothing.
 */
function readHub(files: Record<string, string>): ReturnType<typeof readFeeds> {
    const read = {} as ReturnType<typeof readFeeds>;
    test.beforeAll(() => {
        Object.assign(read, readFeeds(hub(files), FILES, CATALOG, ENGINE));
    });
    return read;
}

const LEADS = `meta:
  log:
    - "2026-09-02 scout (the Scout update task): an older pass"
    - "2026-09-09 scout (the Scout update task): the newest pass"
    - "2026-09-10 litwatch (the Lit Watch update task): a different task, not a run of this feed"
entries:
  - { title: "Postdoc AI", deadline: "20-09-2026 (2026-09-20)", status: open, fit: strong }
  - { title: "Closed one", deadline: "2026-09-30", status: applied }
  - { title: "Dismissed one", deadline: "2026-09-30", status: dismissed }
  - { title: "No date", status: open }
`;

const RADAR = `meta:
  last_run: 2026-09-07
entries: []
`;

const POST = `---
title: A post
date: 2026-08-01
---
body
`;

const NEWER = `---
title: A newer post
date: 2026-08-20
---
body
`;

const NEWEST = `---
title: The newest post, its suffix in capitals
date: 2026-09-02
---
body
`;

const IDEA = `---
title: An unposted idea
date: 2026-12-31
---
body
`;

describe('the three feeds, all present', () => {
    const read = readHub({
        '.oculus/data/academic/leads.yml': LEADS,
        '.oculus/data/literature/radar.yml': RADAR,
        'site/_linkedin/01-a.md': POST,
        'site/_linkedin/02-b.md': NEWER,
        'site/_linkedin/03-c.MD': NEWEST,
        'site/_linkedin/xx-idea.md': IDEA
    });

    it("takes the newest posted date, a post whose suffix is .MD among them and an idea's left out", () => {
        expect(read.feeds.linkedin).toEqual({ lastPost: '2026-09-02' });
    });

    it('keeps the live leads with the ISO date inside their deadline text, dismissed ones out', () => {
        expect(read.feeds.leads).toEqual([
            { title: 'Postdoc AI', deadline: '2026-09-20', status: 'open', fit: 'strong' },
            { title: 'No date', deadline: null, status: 'open', fit: null }
        ]);
    });
});
