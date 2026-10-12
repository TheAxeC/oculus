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

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const FILES: FeedFiles = {
    leads: 'feeds/position-leads.yml',
    radar: 'feeds/literature-radar.yml',
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
        Object.assign(read, readFeeds(hub(files), FILES, CATALOG));
    });
    return read;
}

const LEADS = `meta:
  log:
    - "2026-09-02 (local /research-cockpit scout): an older pass"
    - "2026-09-09 (local /research-cockpit scout): the newest pass"
    - "2026-09-10 (local /research-cockpit litwatch): a different task, not a run of this feed"
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

const IDEA = `---
title: An unposted idea
date: 2026-12-31
---
body
`;

describe('the three feeds, all present', () => {
    const read = readHub({
        'feeds/position-leads.yml': LEADS,
        'feeds/literature-radar.yml': RADAR,
        'site/_linkedin/01-a.md': POST,
        'site/_linkedin/02-b.md': NEWER,
        'site/_linkedin/xx-idea.md': IDEA
    });

    it('keeps the live leads with the ISO date inside their deadline text, dismissed ones out', () => {
        expect(read.feeds.leads).toEqual([
            { title: 'Postdoc AI', deadline: '2026-09-20', status: 'open', fit: 'strong' },
            { title: 'No date', deadline: null, status: 'open', fit: null }
        ]);
    });
});
