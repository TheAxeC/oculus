// Layer 2, server. `oculus.scm` of the host's object: `createSourceControl` and the
// `SourceControl`, its input box, resource groups and resource states, as VS Code's `scm` names
// them.
//
// A source control is created with oculus (`oculus/scm/create`) and from then on every change the
// host makes to it, to its input box, count, commands, groups or the states of a group, is sent as
// the whole source control (`oculus/scm/update`), once for the changes of one turn of the event
// loop. oculus draws it as a section of the Repositories view. What the reader does reaches the
// host as `oculus/scm/input` (the box's text as typed), `oculus/scm/accept` (the accept command
// runs), `oculus/scm/pressed` (a row's command runs, or the file opens), `oculus/scm/execute` (a
// menu command runs with the source control, group or states it was pressed on) and
// `oculus/scm/original` (the quick diff's original of a file).

import { NO_CANCEL } from '../values/events.mjs';
import { Uri } from '../values/uri.mjs';

/** A command as oculus reads it: its id, title and tooltip; the arguments stay in the host. */
function commandOf(command) {
    if (command === undefined || command === null || typeof command.command !== 'string') {
        return null;
    }
    return {
        command: command.command,
        title: String(command.title ?? ''),
        tooltip: String(command.tooltip ?? '')
    };
}

/** One resource state as oculus reads it. */
function resourceOf(state) {
    const decorations = state.decorations ?? {};
    return {
        uri: state.resourceUri.toString(),
        command: commandOf(state.command),
        contextValue: String(state.contextValue ?? ''),
        strikeThrough: decorations.strikeThrough === true,
        faded: decorations.faded === true,
        tooltip: typeof decorations.tooltip === 'string' ? decorations.tooltip : ''
    };
}

/**
 * The scm part.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 *   shell: { execute: (id: string, args: unknown[]) => Promise<unknown> },
 * }} link
 */
export function createScm(link) {
    const { connection, report, shell } = link;
    const controls = new Map();

    function create(id, label, rootUri) {
        if (controls.has(id)) throw new Error('refused:registered');
        const groups = new Map();
        const input = { value: '', placeholder: '', enabled: true, visible: true };
        let writes = 0;
        let count;
        let acceptInputCommand;
        let statusBarCommands = [];
        let commitTemplate = '';
        let quickDiffProvider;
        let queued = false;
        let over = false;

        const snapshot = () => ({
            id,
            label,
            rootUri: rootUri?.toString() ?? '',
            input: { ...input, writes },
            count: typeof count === 'number' ? count : null,
            acceptCommand: commandOf(acceptInputCommand),
            statusCommands: (statusBarCommands ?? []).map(commandOf).filter((one) => one !== null),
            commitTemplate,
            quickDiff: quickDiffProvider !== undefined,
            groups: [...groups.values()].map((group) => ({
                id: group.id,
                label: group.label,
                hideWhenEmpty: group.hideWhenEmpty === true,
                resources: (group.resourceStates ?? []).map(resourceOf)
            }))
        });
        const send = () => {
            if (queued || over) return;
            queued = true;
            queueMicrotask(() => {
                queued = false;
                if (over) return;
                void connection
                    .sendNotification('oculus/scm/update', { id, state: snapshot() })
                    .catch(report);
            });
        };

        const box = {
            get value() {
                return input.value;
            },
            set value(next) {
                input.value = String(next ?? '');
                writes += 1;
                send();
            },
            get placeholder() {
                return input.placeholder;
            },
            set placeholder(next) {
                input.placeholder = String(next ?? '');
                send();
            },
            get enabled() {
                return input.enabled;
            },
            set enabled(next) {
                input.enabled = next !== false;
                send();
            },
            get visible() {
                return input.visible;
            },
            set visible(next) {
                input.visible = next !== false;
                send();
            }
        };

        const control = {
            id,
            label,
            rootUri,
            inputBox: box,
            get count() {
                return count;
            },
            set count(next) {
                count = next;
                send();
            },
            get quickDiffProvider() {
                return quickDiffProvider;
            },
            set quickDiffProvider(next) {
                quickDiffProvider = next;
                send();
            },
            get commitTemplate() {
                return commitTemplate;
            },
            set commitTemplate(next) {
                commitTemplate = String(next ?? '');
                send();
            },
            get acceptInputCommand() {
                return acceptInputCommand;
            },
            set acceptInputCommand(next) {
                acceptInputCommand = next;
                send();
            },
            get statusBarCommands() {
                return statusBarCommands;
            },
            set statusBarCommands(next) {
                statusBarCommands = next ?? [];
                send();
            },
            createResourceGroup(groupId, groupLabel) {
                if (groups.has(groupId)) throw new Error('refused:registered');
                let states = [];
                let hide = false;
                let shown = groupLabel;
                const group = {
                    id: groupId,
                    get label() {
                        return shown;
                    },
                    set label(next) {
                        shown = String(next ?? '');
                        send();
                    },
                    get hideWhenEmpty() {
                        return hide;
                    },
                    set hideWhenEmpty(next) {
                        hide = next === true;
                        send();
                    },
                    get resourceStates() {
                        return states;
                    },
                    set resourceStates(next) {
                        states = Array.isArray(next) ? next : [];
                        send();
                    },
                    dispose() {
                        if (groups.get(groupId) !== group) return;
                        groups.delete(groupId);
                        send();
                    }
                };
                groups.set(groupId, group);
                send();
                return group;
            },
            dispose() {
                if (over) return;
                over = true;
                controls.delete(id);
                void connection.sendRequest('oculus/scm/dispose', { id }).catch(report);
            }
        };
        controls.set(id, { control, snapshot, groups, input });
        void connection
            .sendRequest('oculus/scm/create', { id, label, rootUri: rootUri?.toString() ?? '' })
            .then(() => send())
            .catch((error) => {
                over = true;
                controls.delete(id);
                report(error);
            });
        return control;
    }

    const held = (id) => {
        const found = controls.get(id);
        if (found === undefined) throw new Error('missing');
        return found;
    };

    connection.onNotification('oculus/scm/input', (params) => {
        const found = controls.get(params.id);
        if (found !== undefined) found.input.value = String(params.value ?? '');
    });

    connection.onRequest('oculus/scm/accept', async (params) => {
        const { control } = held(params.id);
        const command = control.acceptInputCommand;
        if (commandOf(command) === null) return null;
        await shell.execute(command.command, command.arguments ?? []);
        return null;
    });

    connection.onRequest('oculus/scm/pressed', async (params) => {
        const { groups } = held(params.id);
        const state = (groups.get(params.group)?.resourceStates ?? []).find(
            (one) => one.resourceUri.toString() === params.uri
        );
        const command = commandOf(state?.command);
        if (command === null) return { open: true };
        await shell.execute(command.command, state.command.arguments ?? []);
        return { open: false };
    });

    connection.onRequest('oculus/scm/execute', async (params) => {
        const { control, groups } = held(params.id);
        let args = [control];
        if (params.scope === 'group') args = [groups.get(params.group)];
        else if (params.scope === 'change') {
            args = [Uri.parse(params.uri), params.changes, params.index];
        } else if (params.scope === 'resource') {
            const states = groups.get(params.group)?.resourceStates ?? [];
            const wanted = new Set(params.resources ?? []);
            args = states.filter((one) => wanted.has(one.resourceUri.toString()));
        }
        await shell.execute(params.command, args);
        return null;
    });

    connection.onRequest('oculus/scm/original', async (params) => {
        const { control } = held(params.id);
        const provider = control.quickDiffProvider;
        if (typeof provider?.provideOriginalResource !== 'function') return null;
        const original = await provider.provideOriginalResource(Uri.parse(params.uri), NO_CANCEL);
        return original === undefined || original === null ? null : original.toString();
    });

    return {
        api: { createSourceControl: create },
        stop() {
            controls.clear();
        }
    };
}
