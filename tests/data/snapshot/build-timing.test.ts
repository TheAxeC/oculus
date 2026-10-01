// How long the readers of the hub take. It builds the demo hub's portfolio 200 times, reads its
// manifests 200 times and validates its raw portfolio 200 times, each pass after a warm-up, and
// prints the whole pass of each in milliseconds. It asserts what each pass produced and nothing
// about time: the figures are read by whoever compares two trees.
// @module-tag slow: the passes take seconds, so npm test leaves it out.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { readCareer } from '../../../src/lib/data/sources/career.ts';
import { readCollections } from '../../../src/lib/data/sources/collections.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { readFeeds } from '../../../src/lib/data/sources/feeds.ts';
import { readManifests } from '../../../src/lib/data/sources/manifests.ts';
import { readRegistries } from '../../../src/lib/data/sources/registries.ts';
import { validate } from '../../../src/lib/data/snapshot/validate.ts';
import type { RawPortfolio } from '../../../src/lib/data/model/index.ts';

const RUNS = 200;
const WARM_UP = 20;

const engine = engineDir();
const demo = join(engine, 'demo');
const config = portfolioConfigFrom(loadConfig(engine).config, engine);

/** The raw portfolio the demo hub reads as, without the documents and slides validate ignores. */
function rawDemo(): RawPortfolio {
    const manifests = readManifests(demo, config.scan, config.text);
    const registries = readRegistries(demo, config.registries, config.text);
    const collections = readCollections(demo, config.collections, config.text);
    const feeds = readFeeds(demo, config.feeds, config.text);
    const career = readCareer(demo, config.career, config.text);
    return {
        manifests: manifests.manifests,
        registries,
        collections: collections.collections,
        feeds: feeds.feeds,
        career: career.career,
        docs: {},
        present: {},
        findings: [
            ...manifests.findings,
            ...registries.findings,
            ...collections.findings,
            ...feeds.findings,
            ...career.findings
        ]
    };
}

/** The milliseconds `RUNS` calls take after `WARM_UP` calls, and the last answer. */
function timed<T>(label: string, run: () => T): T {
    let last = run();
    for (let at = 0; at < WARM_UP; at += 1) last = run();
    const start = performance.now();
    for (let at = 0; at < RUNS; at += 1) last = run();
    const ms = performance.now() - start;
    process.stderr.write(`build-timing ${label} ${RUNS}x ${ms.toFixed(1)} ms\n`);
    return last;
}

describe('the time the readers take over the demo hub', () => {
    it('builds the portfolio', () => {
        const snapshot = timed('buildPortfolio', () => buildPortfolio(demo, config));
        expect(snapshot.findings).toStrictEqual([]);
    });

    it('reads the manifests', () => {
        const read = timed('readManifests', () => readManifests(demo, config.scan, config.text));
        expect(read.findings).toStrictEqual([]);
        expect(read.manifests).toHaveLength(11);
    });

    it('validates the raw portfolio', () => {
        const raw = rawDemo();
        const rules = {
            schema: config.schema,
            vocab: config.vocab,
            careerFile: join(demo, config.career),
            datasetsFile: join(demo, config.registries.datasets),
            text: config.text
        };
        const found = timed('validate', () => validate(raw, rules));
        expect(found).toStrictEqual([]);
    });
});
