// Layer 2, server. The deterministic scan of what the hub is missing: open markers left in a
// document, a manifest field a live project has not filled in, a folder that is not the one the
// tier standard names, a status chip the project's own tier and type contradict, a field long
// enough to stop being a glance, and the public website's publication list against the portfolio.
//
// It is not the Findings view's list and does not repeat it. Findings is what
// data/snapshot/validate.ts found wrong in the files themselves, a bad id or an unknown chip; this
// is what is true of the files and still wants doing. The two kinds the data layer already reports,
// the manifest schema errors and the references that resolve to nothing, are therefore not scanned
// again here.
//
// Every finding carries a signature, twelve hex characters of a sha1 over its scope, its place, its
// kind, the catalog key of its message and the arguments that fill it. It is what the mute list in
// config/behavior.yml holds, so a muted finding is still muted after a rebuild, and rewording a
// message in the catalog keeps every mute.
//
// The scan reads the disk (a document's text, whether a folder is there), so it runs once per
// rebuild in the portfolio watcher and never per request. It is pure over its arguments: the hub
// path, the projects and collections of the snapshot, the rules read out of the configuration, and
// the text catalog the messages are written in.

import type { AuditFinding, AuditKind } from '../../../data/model/index.ts';
import { markers, gaps, conformance, guardrails, readability, collections } from './projects.ts';
import { publications } from './publications.ts';
import { type AuditInput, collector } from './rules.ts';

/** The order the Audit view draws the sections in, and the order the findings come back in. */
const KINDS: AuditKind[] = ['todo', 'data', 'conform', 'manifest', 'readability', 'publink'];

/**
 * The whole scan: every rule over the hub on disk and the snapshot's entities, the findings in
 * section order and, inside a section, by the project or collection they are about.
 */
export function auditFindings(input: AuditInput): AuditFinding[] {
    const { found, add } = collector(input.catalog);
    markers(input, add);
    gaps(input, add);
    conformance(input, add);
    guardrails(input, add);
    readability(input, add);
    collections(input, add);
    publications(input, add);
    return found.sort(
        (left, right) =>
            KINDS.indexOf(left.kind) - KINDS.indexOf(right.kind) ||
            left.scope.localeCompare(right.scope) ||
            left.where.localeCompare(right.where) ||
            left.message.localeCompare(right.message)
    );
}

export {
    type AuditInput,
    type AuditRules,
    SIGNATURE,
    auditRules,
    mutedSignatures,
    signatureOf
} from './rules.ts';
export { AUDIT_PATHS, firstMarker } from './projects.ts';
export { jaccard, normalTitle, titleWords } from './publications.ts';
