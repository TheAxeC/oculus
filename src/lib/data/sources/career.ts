// Layer 1, data. Reads the hub's career file, the one document the Focus board's foot panel is
// drawn from. Server side only: it reads the filesystem and no client module may import it.
//
// It parses and nothing else. What the sections mean is normalise.ts's, and whether a host status
// is one the vocabulary allows is validate.ts's. A file that is not there is null with no finding,
// since a hub need not keep a career plan; a file that is there and does not parse is a finding.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding } from '../model/index.ts';

/** The path on the hub today, which the config falls back to when it names none. */
export const CAREER_FILE = 'CAREER.yml';

/**
 * Read the career file. The map comes back as it parsed, with no key renamed and no value coerced,
 * so that a section this model does not name is still there for a later package to read.
 */
export function readCareer(
    hub: string,
    file: string,
    catalog: TextCatalog
): { career: Record<string, unknown> | null; findings: Finding[] } {
    const findings: Finding[] = [];
    const path = join(hub, file);
    let text: string;
    try {
        text = readFileSync(path, 'utf8');
    } catch {
        return { career: null, findings };
    }
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        findings.push({
            file: path,
            key: '',
            message: findingText(catalog, 'findings.file.does_not_parse', message)
        });
        return { career: null, findings };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        findings.push({
            file: path,
            key: '',
            message: findingText(catalog, 'findings.file.not_a_map')
        });
        return { career: null, findings };
    }
    return { career: parsed as Record<string, unknown>, findings };
}
