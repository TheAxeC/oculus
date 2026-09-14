// sources/feeds.ts over a synthetic hub: every feed shape, a hub with none of them, and a broken
// one. The files are written under mkdtemp and every path is checked to be inside it before
// anything is written; nothing here touches the real hub.
//
// What this does NOT cover: the feed views themselves. This reads the counts and run dates the
// command center needs, and the Inbox, Lit Watch and Position Leads views read the entries.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readFeeds } from '../../src/lib/data/sources/feeds.ts';
import type { FeedFiles } from '../../src/lib/data/model.ts';

const FILES: FeedFiles = {
    inbox: 'feeds/inbox.yml',
    leads: 'feeds/position-leads.yml',
    radar: 'feeds/literature-radar.yml',
    linkedin: 'site/_linkedin'
};

/** A hub of its own, with the given files written into it. */
function hub(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-feeds-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    for (const [rel, body] of Object.entries(files)) {
        const full = join(dir, rel);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, body);
    }
    return dir;
}

const INBOX = `meta:
  run: 2026-09-09
entries:
  - { id: a, kind: reply, triaged: false }
  - { id: b, kind: action }
  - { id: c, kind: info }
  - { id: d, kind: reply, triaged: true }
`;

const LEADS = `meta:
  log:
    - "2026-09-02 (local /research-cockpit scout): an older pass"
    - "2026-09-09 (local /research-cockpit scout): the newest pass"
    - "2026-09-10 (local /research-cockpit litwatch): a different task, not a run of this feed"
entries:
  - { title: "Postdoc AI", deadline: "20-09-2026 (2026-09-20)", status: open, fit: strong }
  - { title: "Closed one", deadline: "2026-09-30", status: applied }
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

describe('the four feeds, all present', () => {
    const dir = hub({
        'feeds/inbox.yml': INBOX,
        'feeds/position-leads.yml': LEADS,
        'feeds/literature-radar.yml': RADAR,
        'site/_linkedin/01-a.md': POST,
        'site/_linkedin/02-b.md': NEWER,
        'site/_linkedin/xx-idea.md': IDEA
    });
    const { feeds, findings } = readFeeds(dir, FILES);

    it('reads the inbox run and counts only the untriaged reply and action threads', () => {
        expect(feeds.inbox).toEqual({ run: '2026-09-09', actionable: 2 });
    });

    it('keeps the live leads with the ISO date inside their deadline text', () => {
        expect(feeds.leads).toEqual([
            { title: 'Postdoc AI', deadline: '2026-09-20', status: 'open', fit: 'strong' },
            { title: 'No date', deadline: null, status: 'open', fit: null }
        ]);
    });

    it('takes the scout run date from the newest scout line of the leads log', () => {
        expect(feeds.scout).toEqual({ lastRun: '2026-09-09' });
    });

    it('reads the radar run date', () => {
        expect(feeds.radar).toEqual({ lastRun: '2026-09-07' });
    });

    it('takes the newest posted LinkedIn date and ignores the xx- ideas', () => {
        expect(feeds.linkedin).toEqual({ lastPost: '2026-08-20' });
    });

    it('reports nothing about a hub whose feeds are all well formed', () => {
        expect(findings).toEqual([]);
    });
});

describe('a hub with no feeds at all', () => {
    const dir = hub({});
    const { feeds, findings } = readFeeds(dir, FILES);

    it('answers null for every feed, which is not the same as an empty one', () => {
        expect(feeds).toEqual({
            inbox: null,
            leads: null,
            radar: null,
            scout: null,
            linkedin: null
        });
    });

    it('reports no finding, because the feeds are generated and a hub may have none', () => {
        expect(findings).toEqual([]);
    });
});

describe('a feed that is there and broken', () => {
    const dir = hub({
        'feeds/inbox.yml': 'meta: [this is: not a map\n',
        'feeds/literature-radar.yml': '- a list, not a map\n',
        'feeds/position-leads.yml': 'meta: {}\n'
    });
    const { feeds, findings } = readFeeds(dir, FILES);

    it('is a finding, and costs that feed alone', () => {
        expect(findings).toHaveLength(2);
        expect(findings.map((one) => one.message.split(':')[0]).sort()).toEqual([
            'does not parse',
            'is not a map of keys'
        ]);
        expect(feeds.inbox).toBeNull();
        expect(feeds.radar).toBeNull();
    });

    it('still answers for a feed that parsed but holds nothing', () => {
        expect(feeds.leads).toEqual([]);
        expect(feeds.scout).toEqual({ lastRun: null });
    });
});

describe('a LinkedIn folder with no dated post', () => {
    const dir = hub({ 'site/_linkedin/xx-idea.md': IDEA });
    const { feeds } = readFeeds(dir, FILES);

    it('says the folder is there and holds no post date', () => {
        expect(feeds.linkedin).toEqual({ lastPost: null });
    });
});
