// Layer 2, client state. The schema of each channel's payload, keyed by channel. A payload is read
// on arrival through its channel's schema, which checks the payload type's top-level fields (a
// list is a list, a map a map, a scalar its type) and answers the payload itself, typed as the
// data model declares it; a frame whose payload fails is dropped as a malformed frame is. The
// items a list holds are read where the state layer reads them, so this checks no more than the
// top level and a payload of a hundred thousand rows costs the same as a small one.

import { z } from 'zod';
import { DEBUG_STATUSES } from '../../../data/model/index.ts';
import {
    anyNumberShape,
    debugAppendShape,
    mapShape,
    unchangedAs
} from '../../../data/shapes/shapes.ts';
import type { Payloads } from '../../shared/stores/shapes.ts';

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
        hubs: z.object({ primary: z.string().nullable(), lists: mapShape }),
        text: mapShape,
        icons: mapShape,
        codeThemeClasses: listShape,
        host: mapShape,
        findings: listShape,
        from: mapShape
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
        stale: z
            .object({
                recent: z.string().nullable().optional(),
                sinfo: z.string().nullable().optional()
            })
            .optional(),
        pollMin: anyNumberShape,
        retryMin: anyNumberShape.optional(),
        host: z.string()
    })
);

const recoverShape = unchangedAs<Payloads['recover']>(
    z.object({ runs: listShape, sessions: listShape.nullable() })
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

const scheduleShape = unchangedAs<Payloads['schedule']>(
    z.object({
        schedules: listShape,
        commands: listShape,
        folders: listShape,
        tasks: listShape.nullable(),
        unread: listShape,
        waiting: z.string().nullable()
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

const stateShape = unchangedAs<Payloads['state']>(
    z.object({
        layouts: mapShape.optional(),
        views: listShape.optional(),
        debug: mapShape.optional()
    })
);

const filesShape = unchangedAs<Payloads['files']>(
    z.object({
        root: z.string(),
        folders: z.array(z.string()).optional(),
        bookmarks: z.boolean().optional(),
        workspaces: z.boolean().optional()
    })
);

const appsShape = unchangedAs<Payloads['apps']>(
    z.object({ rows: listShape, findings: listShape, folders: z.array(z.string()) })
);

const debugShape: z.ZodType<Payloads['debug']> = z.object({
    status: z.enum(DEBUG_STATUSES),
    session: z
        .object({
            repo: z.string(),
            name: z.string(),
            program: z.string(),
            cwd: z.string(),
            pid: z.number(),
            number: z.number()
        })
        .nullable(),
    pause: z.object({ reason: z.string(), description: z.string() }).nullable(),
    frames: z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            path: z.string(),
            line: z.number(),
            column: z.number()
        })
    ),
    frame: z.number().nullable(),
    thread: z.number().nullable(),
    scopes: z.array(
        z.object({
            name: z.string(),
            reference: z.number(),
            variables: z.array(z.object({ name: z.string(), value: z.string() }))
        })
    ),
    watch: z.array(
        z.object({
            expression: z.string(),
            value: z.string().optional(),
            error: z.string().optional()
        })
    ),
    breakpoints: z.array(
        z.object({
            path: z.string(),
            breakpoints: z.array(
                z.object({
                    line: z.number(),
                    verified: z.boolean(),
                    message: z.string(),
                    condition: z.string(),
                    hitCondition: z.string(),
                    logMessage: z.string()
                })
            )
        })
    ),
    functions: z.array(
        z.object({
            name: z.string(),
            verified: z.boolean(),
            message: z.string(),
            condition: z.string(),
            hitCondition: z.string()
        })
    ),
    ended: z.string(),
    adapter: z.object({ type: z.string(), label: z.string(), app: z.string() }).nullable(),
    exceptions: z.array(
        z.object({
            filter: z.string(),
            label: z.string(),
            enabled: z.boolean(),
            supportsCondition: z.boolean(),
            condition: z.string()
        })
    ),
    declared: z.record(
        z.string(),
        z.object({
            conditions: z.boolean(),
            hitConditions: z.boolean(),
            logpoints: z.boolean(),
            functions: z.boolean(),
            functionConditions: z.boolean(),
            setVariable: z.boolean(),
            restart: z.boolean(),
            terminate: z.boolean(),
            hover: z.boolean(),
            completions: z.boolean(),
            loadedSources: z.boolean(),
            exceptionFilters: z.array(
                z.object({
                    filter: z.string(),
                    label: z.string(),
                    enabled: z.boolean(),
                    supportsCondition: z.boolean()
                })
            )
        })
    )
});

const debugConsoleShape: z.ZodType<Payloads['debug-console']> = debugAppendShape;

const appHostsShape = unchangedAs<Payloads['app-hosts']>(z.object({ rows: listShape }));

const appShellShape = unchangedAs<Payloads['app-shell']>(
    z.object({ hosts: listShape, requests: listShape })
);

const appToolsShape = unchangedAs<Payloads['app-tools']>(
    z.object({ hosts: listShape, decorations: z.object({ epoch: z.number() }).loose() })
);

const jumpShape: z.ZodType<Payloads['jump']> = z.object({
    owner: z.string().min(1),
    root: z.string().min(1),
    file: z.string().min(1),
    line: z.number().int().min(1),
    column: z.number().int().min(0).optional()
});

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
    recover: recoverShape,
    processes: processesShape,
    schedule: scheduleShape,
    calendar: calendarShape,
    inbox: inboxShape,
    usage: usageShape,
    audit: auditShape,
    files: filesShape,
    state: stateShape,
    apps: appsShape,
    debug: debugShape,
    'debug-console': debugConsoleShape,
    jump: jumpShape,
    changes: z.object({ at: z.string().min(1) }),
    'app-hosts': appHostsShape,
    'app-shell': appShellShape,
    'app-tools': appToolsShape
};
