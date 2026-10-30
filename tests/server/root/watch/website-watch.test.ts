// Layer 2, server test. The portfolio watcher hears a change on disk to each of the website's three
// generated files and publishes the audit again without a restart (G125): a file the hub's files
// give that is not on disk is one finding saying it differs as a whole, and once a text that parses
// is written in its place, the finding of that file names the first place it differs at.
// @module-tag slow: the watcher builds the portfolio of a hub copy over the real folders.
//
// The hub is a copy of tests/fixtures/hubs/demo/ whose settings file names a website folder inside
// it, the user is a person of the demo's people file, and the watcher runs over the real folders; a
// case resumes on the audit it waits for and on no timer. Every directory here is under the system
// temporary directory.

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import type { AuditFinding, AuditPayload } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { Hub, type Sink } from '../../../../src/lib/server/core/channels.ts';
import {
    CV_FILE,
    INDUSTRY_FILE,
    PAPERS_FILE
} from '../../../../src/lib/server/content/audit/website/site.ts';
import {
    watchPortfolio,
    type PortfolioWatcher
} from '../../../../src/lib/server/root/watch/portfolio/portfolio.ts';
import { workspaceWith } from '../../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { copyHub } from '../../../data/hubs/hubs-fixture.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** The website's folder inside the hub, as the settings file names it. */
const FOLDER = 'site';

/** The three files the hub's files are written into, in the order a write takes them. */
const GENERATED = [CV_FILE, PAPERS_FILE, INDUSTRY_FILE];

/** The key of the demo's person who is the user here. */
const SELF = 'rivera-lab';

let watcher: PortfolioWatcher | undefined;

afterEach(() => {
    watcher?.close();
    watcher = undefined;
});

/**
 * Every audit the hub publishes from now on, and a wait for the first one `wanted` is, which the
 * wait hands back.
 */
function auditsOf(hub: Hub) {
    const heard: AuditPayload[] = [];
    let waiting: {
        wanted: (one: AuditPayload) => boolean;
        done: (one: AuditPayload) => void;
    } | null = null;
    const sink: Sink = {
        send: (text) => {
            const payload = (JSON.parse(text) as { payload: AuditPayload }).payload;
            heard.push(payload);
            if (waiting?.wanted(payload) === true) {
                waiting.done(payload);
                waiting = null;
            }
            return Promise.resolve();
        },
        close: () => undefined
    };
    hub.subscribe(sink, ['audit'], false);
    return {
        until: (wanted: (one: AuditPayload) => boolean): Promise<AuditPayload> => {
            const found = heard.find(wanted);
            return found !== undefined
                ? Promise.resolve(found)
                : new Promise((done) => {
                      waiting = { wanted, done };
                  });
        }
    };
}

/** The finding of the audit about one of the website's files, if there is one. */
function findingOf(audit: AuditPayload, name: string): AuditFinding | undefined {
    return audit.findings.find((one) => one.scope === 'website' && one.where === name);
}

/** Whether the audit says the file differs as a whole. */
function whole(audit: AuditPayload, name: string): boolean {
    return (
        findingOf(audit, name)?.message ===
        findingText(CATALOG, 'audit.msg_site_differs_whole', name)
    );
}

/** Whether the audit says the file differs at a place inside it. */
function atPlace(audit: AuditPayload, name: string): boolean {
    const mark = '\u0000';
    const [before, after] = findingText(CATALOG, 'audit.msg_site_differs', name, mark).split(mark);
    const message = findingOf(audit, name)?.message ?? '';
    return (
        message.length > before.length + after.length &&
        message.startsWith(before) &&
        message.endsWith(after)
    );
}

describe('the portfolio watcher over the website the primary hub names', () => {
    it('publishes the audit again for a change on disk to each of the three generated files', async () => {
        const dir = copyHub(scratchDir('oculus-website-watch-'), 'hub');
        appendFileSync(join(dir, HUB_FILE), `\nwebsite:\n  folder: ${FOLDER}\n`);
        const data = join(dir, FOLDER, '_data');
        mkdirSync(data, { recursive: true });
        const workspace = workspaceWith([{ name: 'hub', dir }], 'hub');
        const channels = new Hub();
        const audits = auditsOf(channels);
        watcher = watchPortfolio(
            channels,
            {
                engine: engineDir(),
                icons: { set: {} },
                host: { name: 'test', address: '127.0.0.1' },
                open: () => workspace.open(),
                settings: (hub) => loadConfig(engineDir(), { hub }),
                defaults: () => loadConfig(engineDir()),
                problems: () => [],
                self: () => SELF
            },
            { debounce: 20 }
        );
        const first = await audits.until((audit) => findingOf(audit, GENERATED[0]) !== undefined);
        expect(GENERATED.filter((name) => whole(first, name))).toEqual([...GENERATED]);
        for (const [at, name] of GENERATED.entries()) {
            writeFileSync(join(dir, FOLDER, name), 'written_by_hand: 1\n');
            const heard = await audits.until((audit) => atPlace(audit, name));
            const written = GENERATED.slice(0, at + 1);
            expect(GENERATED.filter((one) => atPlace(heard, one))).toEqual(written);
            expect(GENERATED.filter((one) => whole(heard, one))).toEqual(GENERATED.slice(at + 1));
        }
    });
});
