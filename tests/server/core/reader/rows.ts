// Layer 4, test helper. The fixture rows the reader's tests read: `rows.yml` beside this file,
// parsed as a hub's `.oculus/config.yml` is, and read by the readers of the four keys
// (data/sources/config/settings/rows/read.ts), so a test reads each row as oculus does.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {
    browserRow,
    linkRows,
    literatureRows,
    recoverRows
} from '../../../../src/lib/data/sources/config.ts';
import type { SettingProblem } from '../../../../src/lib/data/sources/config/settings/reader.ts';
import type {
    LinkRow,
    ReaderRow
} from '../../../../src/lib/data/sources/config/settings/rows/grammar.ts';

/** The fixture file as a hub's settings: `literature`, `recover`, `venues` and `links`. */
export const FIXTURE_CONFIG = parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'rows.yml'), 'utf8')
) as Record<string, unknown>;

/** The rows of the fixture, each key read, and every problem the readers found in them. */
export type FixtureRows = {
    literature: ReaderRow[];
    recover: ReaderRow[];
    browser: ReaderRow | null;
    links: LinkRow[];
    problems: SettingProblem[];
};

/** The fixture's rows, read once per call so a test may change what it is handed. */
export function fixtureRows(): FixtureRows {
    const problems: SettingProblem[] = [];
    return {
        literature: literatureRows(FIXTURE_CONFIG, problems),
        recover: recoverRows(FIXTURE_CONFIG, problems),
        browser: browserRow(FIXTURE_CONFIG, problems),
        links: linkRows(FIXTURE_CONFIG, problems),
        problems
    };
}
