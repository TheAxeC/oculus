// Layer 2, server. The source controls of an app's host (`oculus.scm.createSourceControl`), held
// for the Repositories view. The host creates one with a request (`oculus/scm/create`) and sends
// the whole of it again each time it changes (`oculus/scm/update`): the input box, the count, the
// accept and status bar commands, and the groups with their resource states. Each resource's URI
// is turned into a root and a path of the app's scope here, so a page opens it as any file of the
// workspace; a resource outside every workspace folder, or in a closed or private place, carries
// no root and no path and a page draws it by its URI and opens nothing.
//
// What the reader does is a call on the held control: typing in the input box (`input`), the accept
// command (`accept`), a press on a row (`pressed`: the row's command runs in the host, or the page
// is told to open the file), a menu command on the control, a group or rows (`execute`), and the
// quick diff's original of a file named by its root and path (`original`: the host names a file of
// the scope or a URI a content provider serves, and the answer is its text). A menu command on a
// change (`scm/change/title`) takes the file's URI, the changes of its quick diff and the index of
// the one it is run on, as VS Code's does. A control id starts with the app's name and a dot, and a
// second control of one id is refused `refused:registered`.

import { readFileSync, statSync } from 'node:fs';
import { z } from 'zod';
import { isWholeText } from '../../../../data/helpers/files/text-kind.ts';
import type { AppScmState } from '../../../../data/model/index.ts';
import { Refused, type HostHandler, type HostNotice } from '../host/connection.ts';
import type { HostTools } from './registry.ts';

/** The most resource states one group shows. */
const RESOURCES_MAX = 10_000;

const commandShape = z
    .object({
        command: z.string().max(500),
        title: z.string().max(500).default(''),
        tooltip: z.string().max(500).default('')
    })
    .nullable();

const stateShape = z.object({
    id: z.string(),
    label: z.string().max(500),
    rootUri: z.string(),
    input: z.object({
        value: z.string().max(1_000_000),
        placeholder: z.string().max(500),
        enabled: z.boolean(),
        visible: z.boolean(),
        writes: z.number().int().min(0)
    }),
    count: z.number().int().min(0).nullable(),
    acceptCommand: commandShape,
    statusCommands: z.array(commandShape.unwrap()).max(32),
    commitTemplate: z.string().max(100_000),
    quickDiff: z.boolean(),
    groups: z
        .array(
            z.object({
                id: z.string(),
                label: z.string().max(500),
                hideWhenEmpty: z.boolean(),
                resources: z.array(
                    z.object({
                        uri: z.string().max(4000),
                        command: commandShape,
                        contextValue: z.string().max(200),
                        strikeThrough: z.boolean(),
                        faded: z.boolean(),
                        tooltip: z.string().max(2000)
                    })
                )
            })
        )
        .max(64)
});

const createShape = z.object({
    id: z.string().min(1).max(200),
    label: z.string().max(500),
    rootUri: z.string()
});

/** A change of a file's quick diff a menu command is run on: the file and the diff's changes. */
type ScmChange = {
    root: string;
    path: string;
    changes: {
        originalStartLineNumber: number;
        originalEndLineNumber: number;
        modifiedStartLineNumber: number;
        modifiedEndLineNumber: number;
    }[];
    index: number;
};

/** What the source controls of one host answer to the registry and the routes. */
export type ScmHost = {
    handlers: Record<string, HostHandler>;
    notices: Record<string, HostNotice>;
    states(): AppScmState[];
    has(id: string): boolean;
    /** The box's text as the reader typed it. */
    input(id: string, value: string): void;
    accept(id: string): Promise<void>;
    /** A press on a row: whether the page opens the file. */
    pressed(id: string, group: string, uri: string): Promise<{ open: boolean }>;
    execute(
        id: string,
        command: string,
        scope: 'sourceControl' | 'group' | 'resource' | 'change',
        group: string,
        resources: string[],
        change?: ScmChange
    ): Promise<void>;
    /** The text of the original of a file for the quick diff, or null when the app gives none. */
    original(id: string, root: string, path: string): Promise<string | null>;
    stop(): void;
};

/**
 * The text a quick diff's original URI names: the file when it is in the app's scope and a whole
 * text within the size the tools read, else the text the app's content provider serves for it.
 * Null when neither gives one.
 */
async function originalText(host: HostTools, uri: string): Promise<string | null> {
    const found = host.scope.resolve(host.app(), uri);
    if (found.ok) {
        try {
            if (statSync(found.file.real).size > host.scope.env.maxBytes()) return null;
            const bytes = readFileSync(found.file.real);
            return isWholeText(bytes) ? bytes.toString('utf8') : null;
        } catch {
            return null;
        }
    }
    try {
        const text = await host.request('oculus/workspace/content/provide', { uri });
        return typeof text === 'string' && text.length <= host.scope.env.maxBytes() ? text : null;
    } catch {
        return null;
    }
}

/** The source controls of one host. */
export function scmHost(host: HostTools): ScmHost {
    const held = new Map<string, AppScmState>();

    const known = (id: string): AppScmState => {
        const found = held.get(id);
        if (found === undefined) throw new Refused('missing');
        return found;
    };

    const handlers: Record<string, HostHandler> = {
        'oculus/scm/create': (params) => {
            const app = host.app();
            const read = createShape.safeParse(params);
            if (!read.success) throw new Refused('refused:params');
            const { id, label, rootUri } = read.data;
            if (!id.startsWith(`${app.row.name}.`)) throw new Refused('not_declared');
            if (held.has(id)) throw new Refused('refused:registered');
            const placed = host.scope.place(app, rootUri);
            held.set(id, {
                app: app.id,
                id,
                label,
                root: placed?.root ?? '',
                rootUri,
                input: { value: '', placeholder: '', enabled: true, visible: true, writes: 0 },
                count: null,
                acceptCommand: null,
                statusCommands: [],
                commitTemplate: '',
                quickDiff: false,
                groups: []
            });
            host.changed();
            return null;
        },
        'oculus/scm/dispose': (params) => {
            host.app();
            const id = (params as { id?: unknown } | null)?.id;
            if (typeof id === 'string' && held.delete(id)) host.changed();
            return null;
        }
    };

    const notices: Record<string, HostNotice> = {
        'oculus/scm/update': (params) => {
            const app = host.app();
            const id = (params as { id?: unknown } | null)?.id;
            const current = typeof id === 'string' ? held.get(id) : undefined;
            if (current === undefined) return;
            const read = stateShape.safeParse((params as { state?: unknown }).state);
            if (!read.success || read.data.id !== current.id) return;
            const state = read.data;
            held.set(current.id, {
                ...current,
                label: state.label,
                input: state.input,
                count: state.count,
                acceptCommand: state.acceptCommand,
                statusCommands: state.statusCommands.map((one) => ({ ...one })),
                commitTemplate: state.commitTemplate,
                quickDiff: state.quickDiff,
                groups: state.groups.map((group) => ({
                    id: group.id,
                    label: group.label,
                    hideWhenEmpty: group.hideWhenEmpty,
                    resources: group.resources.slice(0, RESOURCES_MAX).map((one) => {
                        const placed = host.scope.place(app, one.uri);
                        return {
                            ...one,
                            root: placed?.root ?? '',
                            path: placed?.path ?? '',
                            command:
                                one.command === null
                                    ? null
                                    : { command: one.command.command, title: one.command.title }
                        };
                    })
                }))
            });
            host.changed();
        }
    };

    return {
        handlers,
        notices,
        states: () => [...held.values()],
        has: (id) => held.has(id),
        input(id, value) {
            const current = known(id);
            held.set(id, { ...current, input: { ...current.input, value } });
            host.notify('oculus/scm/input', { id, value });
            host.changed();
        },
        async accept(id) {
            known(id);
            await host.request('oculus/scm/accept', { id });
        },
        async pressed(id, group, uri) {
            known(id);
            const answer = (await host.request('oculus/scm/pressed', { id, group, uri })) as {
                open?: unknown;
            } | null;
            return { open: answer?.open === true };
        },
        async execute(id, command, scope, group, resources, change) {
            known(id);
            const uri =
                change === undefined
                    ? null
                    : host.scope.uriFor(host.app(), change.root, change.path);
            if (scope === 'change' && (change === undefined || uri === null)) {
                throw new Refused('outside');
            }
            await host.request('oculus/scm/execute', {
                id,
                command,
                scope,
                group,
                resources,
                uri,
                changes: change?.changes ?? [],
                index: change?.index ?? 0
            });
        },
        async original(id, root, path) {
            const current = known(id);
            if (!current.quickDiff) return null;
            const uri = host.scope.uriFor(host.app(), root, path);
            if (uri === null) return null;
            const answer = await host.request('oculus/scm/original', { id, uri });
            return typeof answer === 'string' ? originalText(host, answer) : null;
        },
        stop() {
            held.clear();
        }
    };
}
