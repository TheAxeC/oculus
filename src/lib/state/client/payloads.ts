// Layer 2, client state. The schema of each channel's payload, keyed by channel. A payload is read
// on arrival through its channel's schema, which checks the payload type's top-level fields (a
// list is a list, a map a map, a scalar its type) and answers the payload itself, typed as the
// data model declares it; a frame whose payload fails is dropped as a malformed frame is. The
// items a list holds are read where the state layer reads them, so this checks no more than the
// top level and a payload of a hundred thousand rows costs the same as a small one.

import { z } from 'zod';
import { anyNumberShape, mapShape, unchangedAs } from '../../data/shapes/shapes.ts';
import type { Payloads } from '../shared/stores/shapes.ts';

/** A list; its items are checked where they are read. */
const listShape = z.instanceof(Array);

const snapshotShape = unchangedAs<Payloads['portfolio']>(
    z.object({
        version: anyNumberShape,
        entities: mapShape,
        relations: mapShape,
        findings: listShape
    })
);

const configShape = unchangedAs<Payloads['config']>(
    z.object({
        config: mapShape,
        text: mapShape,
        icons: mapShape,
        host: mapShape,
        findings: listShape
    })
);

const sessionsShape = unchangedAs<Payloads['sessions']>(
    z.object({ records: listShape, workspaces: listShape, terminals: listShape.optional() })
);

const feedsShape = unchangedAs<Payloads['feeds']>(
    z.object({ radar: mapShape, leads: mapShape, linkedin: mapShape })
);

const gitShape = unchangedAs<Payloads['git']>(mapShape);

const hpcShape = unchangedAs<Payloads['hpc']>(
    z.object({
        status: z.string(),
        hint: z.string().optional(),
        jobs: listShape,
        running: anyNumberShape,
        pending: anyNumberShape,
        total: anyNumberShape,
        recent: listShape,
        sinfo: listShape,
        quota: listShape,
        updated: z.string(),
        lastOk: z.string().optional(),
        pollMin: anyNumberShape,
        retryMin: anyNumberShape.optional(),
        host: z.string()
    })
);

const processesShape = unchangedAs<Payloads['processes']>(
    z.object({
        status: z.enum(['ok', 'failed']),
        updated: z.string(),
        rows: listShape,
        agents: anyNumberShape,
        projects: anyNumberShape,
        error: z.string().optional()
    })
);

const calendarShape = unchangedAs<Payloads['calendar']>(
    z.object({
        status: z.string(),
        accounts: listShape,
        events: listShape,
        updated: z.string(),
        pollMin: anyNumberShape,
        retryMin: anyNumberShape,
        daysBack: anyNumberShape,
        daysAhead: anyNumberShape
    })
);

const inboxShape = unchangedAs<Payloads['inbox']>(
    z.object({
        status: z.string(),
        accounts: listShape,
        threads: listShape,
        updated: z.string(),
        pollMin: anyNumberShape,
        retryMin: anyNumberShape,
        notesRun: z.string().nullable(),
        notesError: z.string().optional()
    })
);

const usageShape = unchangedAs<Payloads['usage']>(
    z.object({ accounts: listShape, days: listShape, builtAt: z.string() })
);

const auditShape = unchangedAs<Payloads['audit']>(
    z.object({ findings: listShape, muted: listShape })
);

const filesShape = unchangedAs<Payloads['files']>(
    z.object({ root: z.string(), bookmarks: z.boolean().optional() })
);

/**
 * The schema of each channel the page types, each held to the payload type the data model declares
 * for it. A channel not named here has a reader of its own.
 */
export const payloadShapes: { [K in keyof Payloads]: z.ZodType<Payloads[K]> } = {
    portfolio: snapshotShape,
    config: configShape,
    sessions: sessionsShape,
    feeds: feedsShape,
    git: gitShape,
    hpc: hpcShape,
    processes: processesShape,
    calendar: calendarShape,
    inbox: inboxShape,
    usage: usageShape,
    audit: auditShape,
    files: filesShape
};
