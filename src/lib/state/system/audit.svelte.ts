// Layer 2, client state. What the audit scan last said, split the way the view draws it: the
// findings the reader has not parked, in section order, and the ones they have.
//
// The split is here rather than in the view because the view's badge needs the open count too, and
// a count computed in two places is a count the two can disagree about.

import type { AuditFinding, AuditKind } from '../../data/model/index.ts';
import type { EntitiesStore } from '../shared/stores/shapes.ts';

// The two wire shapes the view draws, re-exported so a view names them without importing `data/`.
export type { AuditFinding, AuditKind };

/** One client's reader of the audit scan. */
export type AuditStore = {
    /** Every finding the scan reported, muted ones included, in the order it reported them. */
    findings: () => AuditFinding[];
    /** The signatures config/behavior.yml parks. */
    muted: () => string[];
    /** The findings the reader has not parked. */
    open: () => AuditFinding[];
    /** The findings the reader has parked. */
    parked: () => AuditFinding[];
    /** The open findings of one section. */
    section: (kind: AuditKind) => AuditFinding[];
    /** How many findings are open, which is what the view's badge counts. */
    openCount: () => number;
};

export function createAudit(entities: EntitiesStore): AuditStore {
    function findings(): AuditFinding[] {
        return entities.audit()?.findings ?? [];
    }

    function muted(): string[] {
        return entities.audit()?.muted ?? [];
    }

    function open(): AuditFinding[] {
        const parked = new Set(muted());
        return findings().filter((finding) => !parked.has(finding.signature));
    }

    function parked(): AuditFinding[] {
        const held = new Set(muted());
        return findings().filter((finding) => held.has(finding.signature));
    }

    function section(kind: AuditKind): AuditFinding[] {
        return open().filter((finding) => finding.kind === kind);
    }

    return {
        findings,
        muted,
        open,
        parked,
        section,
        openCount: () => open().length
    };
}
