// Layer 1, data. Reads the hub's career file, the one document the Focus board's career banner is
// drawn from. Server side only: it reads the filesystem and no client module may import it.
//
// It parses and nothing else. What the sections mean is normalise.ts's, and whether a section's
// value is the type the file's own `schema:` gives it is the schema check's
// (data/snapshot/schema/run.ts). A file that is not there is null with no finding, since a hub need
// not keep a career plan; a file that is there and does not parse is a finding.

import { join } from 'node:path';
import type { TextCatalog } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { readYamlMap } from '../yaml-file.ts';

/**
 * Read the career file. The map comes back as it parsed, with no key renamed and no value coerced,
 * so that a section the banner does not name stays in the map for the career editor to edit.
 */
export function readCareer(
    hub: string,
    file: string,
    catalog: TextCatalog
): { career: Record<string, unknown> | null; findings: Finding[] } {
    const findings: Finding[] = [];
    const path = join(hub, file);
    const career = readYamlMap(path, catalog, findings, () => null);
    return { career, findings };
}
