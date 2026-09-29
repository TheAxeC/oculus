// sources/feeds.ts over a synthetic hub: every feed shape, a hub with none of them, and a broken
// one. The files are written under mkdtemp and every path is checked to be inside it before
// anything is written; nothing here touches the real hub.
//
// What this does NOT cover: the feed views themselves. This reads the counts and run dates the
// command center needs, and the Inbox, Lit Watch and Position Leads views read the entries.

import { describe, expect } from 'vitest';
import { readFeeds } from '../../../src/lib/data/sources/feeds.ts';
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

    it('takes the scout run date from the newest scout line of the leads log', () => {
        expect(read.feeds.scout).toEqual({ lastRun: '2026-09-09' });
    });

    it('reads the radar run date', () => {
        expect(read.feeds.radar).toEqual({ lastRun: '2026-09-07' });
    });

    it('takes the newest posted LinkedIn date and ignores the xx- ideas', () => {
        expect(read.feeds.linkedin).toEqual({ lastPost: '2026-08-20' });
    });

    it('reports nothing about a hub whose feeds are all well formed', () => {
        expect(read.findings).toEqual([]);
    });
});

describe('a hub with no feeds at all', () => {
    const read = readHub({});

    it('answers null for every feed, which is not the same as an empty one', () => {
        expect(read.feeds).toEqual({
            leads: null,
            radar: null,
            scout: null,
            linkedin: null
        });
    });

    it('reports no finding, because the feeds are generated and a hub may have none', () => {
        expect(read.findings).toEqual([]);
    });
});

describe('a feed that is there and broken', () => {
    const read = readHub({
        'feeds/literature-radar.yml': '- a list, not a map\n',
        'feeds/position-leads.yml': 'meta: {}\n'
    });

    it('is a finding, and costs that feed alone', () => {
        expect(read.findings).toHaveLength(1);
        expect(read.findings.map((one) => one.message.split(':')[0])).toEqual([
            'is not a map of keys'
        ]);
        expect(read.feeds.radar).toBeNull();
    });

    it('still answers for a feed that parsed but holds nothing', () => {
        expect(read.feeds.leads).toEqual([]);
        expect(read.feeds.scout).toEqual({ lastRun: null });
    });
});

describe('a LinkedIn folder with no dated post', () => {
    const read = readHub({ 'site/_linkedin/xx-idea.md': IDEA });

    it('says the folder is there and holds no post date', () => {
        expect(read.feeds.linkedin).toEqual({ lastPost: null });
    });
});
