// Layer 2, server. The shell's part of the object a host's `activate(oculus)` receives: the
// namespaces `oculus.commands`, `oculus.window` and `oculus.workspace`, which follow VS Code's
// API by name, and the answers to the two messages oculus sends a host for them, `oculus/provide`
// (a command to run, the children or the item of a tree element, the check of an input box's
// value) and `oculus/event` (a setting changed, a view shown or hidden, a selection, an element
// expanded or collapsed, a panel closed, a progress cancelled).
//
// It is plain JavaScript that the runner (host-runner.mjs) imports before it installs its
// import guard, so it needs nothing of the app. The host talks to oculus through the connection the
// runner passes in; every contribution is registered with `oculus/register` and changed with the
// notification `oculus/changed`, and a refusal of oculus rejects the call that caused it.
//
// Elements of a tree stay in the host. A handle names one to oculus: the `id` of its TreeItem when
// it has one, else a counter. Asking for the children of a handle forgets the handles of the old
// children of that handle, so the host holds the elements of the rows oculus last read. An element
// crosses to oculus as `{ $treeViewId, $treeItemHandle }`, in a row's command arguments and in the
// argument the page gives a `view/item/context` command, and a command is called with the element
// again, as VS Code calls it.

/** The values of VS Code's enums that an app reads by name. */
const StatusBarAlignment = { Left: 1, Right: 2 };
const ProgressLocation = { Notification: 15, Window: 10 };
const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 };

/**
 * An event in VS Code's shape: calling `event(listener)` adds the listener and answers a
 * disposable. `listening` is called with the first listener added, so the host subscribes to the
 * events of that kind only when it has a listener.
 * @param {(() => void) | undefined} listening
 */
function emitter(listening) {
    const listeners = new Set();
    return {
        event(listener) {
            if (listeners.size === 0) listening?.();
            listeners.add(listener);
            return { dispose: () => listeners.delete(listener) };
        },
        fire(value, report) {
            for (const listener of [...listeners]) {
                try {
                    listener(value);
                } catch (error) {
                    report(error);
                }
            }
        }
    };
}

/** Whether an argument after a message is its options: an object that is not an item. */
function isOptions(value) {
    return value !== null && typeof value === 'object' && !('title' in value);
}

/** The title of an item of a message or a quick pick: a text, or an object with a `title`. */
function titleOf(item) {
    return typeof item === 'string' ? item : String(item?.title ?? item?.label ?? '');
}

/**
 * The shell part of the host's object.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 * }} link
 */
export function createShell(link) {
    const { connection, report } = link;
    const register = (kind, id, options = {}) =>
        connection.sendRequest('oculus/register', { kind, id, options });
    const unregister = (kind, id) => connection.sendRequest('oculus/unregister', { kind, id });
    const changed = (kind, id, options) =>
        connection.sendNotification('oculus/changed', { kind, id, options });
    const subscribe = (kind, id = '') => {
        void connection.sendRequest('oculus/subscribe', { kind, id }).catch(report);
    };
    const note = (promise) => promise.catch(report);

    let appName = '';
    let values = {};
    const commandHandlers = new Map();
    let validator = null;
    const cancels = new Map();
    const trees = new Map();
    const panels = new Map();
    const settingsEvents = emitter(() => subscribe('settings'));

    const commands = {
        registerCommand(id, handler) {
            if (commandHandlers.has(id)) throw new Error('refused:registered');
            commandHandlers.set(id, handler);
            const registered = register('command', id);
            registered.catch((error) => {
                if (commandHandlers.get(id) === handler) commandHandlers.delete(id);
                report(error);
            });
            return {
                registered,
                dispose() {
                    if (commandHandlers.get(id) !== handler) return;
                    commandHandlers.delete(id);
                    note(unregister('command', id));
                }
            };
        },
        executeCommand: (id, ...args) =>
            connection.sendRequest('oculus/commands/execute', { id, args })
    };

    /** Ask oculus to show a message and answer with the item the reader pressed. */
    const message =
        (tone) =>
        async (text, ...rest) => {
            const at = rest.findIndex(isOptions);
            const options = at === -1 ? {} : rest.splice(at, 1)[0];
            const answer = await connection.sendRequest('oculus/ui', {
                kind: 'message',
                tone,
                message: String(text),
                items: rest.map(titleOf),
                modal: options.modal === true
            });
            return typeof answer === 'string'
                ? rest.find((item) => titleOf(item) === answer)
                : undefined;
        };

    /** The pick items as oculus draws them. */
    const pickOf = (item) =>
        typeof item === 'string'
            ? { label: item }
            : {
                  label: String(item.label ?? ''),
                  description: item.description ?? '',
                  detail: item.detail ?? '',
                  picked: item.picked === true
              };

    /** The id a progress is known by, and the share its reports add up to. */
    const progressOf = async (options, task) => {
        const location = options?.location;
        const inWindow = location === ProgressLocation.Window || location === 'window';
        const { id } = await connection.sendRequest('oculus/ui', {
            kind: 'progress',
            location: inWindow ? 'window' : 'notification',
            title: String(options?.title ?? ''),
            cancellable: options?.cancellable === true
        });
        const cancelled = emitter();
        const token = {
            isCancellationRequested: false,
            onCancellationRequested: cancelled.event
        };
        cancels.set(id, () => {
            token.isCancellationRequested = true;
            cancelled.fire(undefined, report);
        });
        let done = 0;
        const progress = {
            report(value) {
                if (typeof value?.increment === 'number')
                    done = Math.min(100, done + value.increment);
                changed('progress', id, {
                    message: typeof value?.message === 'string' ? value.message : undefined,
                    percent: typeof value?.increment === 'number' ? done : undefined
                });
            }
        };
        try {
            return await task(progress, token);
        } finally {
            cancels.delete(id);
            changed('progress', id, { done: true });
        }
    };

    /** A status bar item whose fields are sent to oculus together after the host sets them. */
    const statusItem = (id, alignment, priority) => {
        const left = alignment === StatusBarAlignment.Left || alignment === 'left';
        const fields = {
            visible: false,
            text: '',
            tooltip: '',
            command: '',
            name: '',
            background: '',
            accessibility: ''
        };
        let queued = false;
        const send = () => {
            if (queued) return;
            queued = true;
            queueMicrotask(() => {
                queued = false;
                changed('statusItem', id, fields);
            });
        };
        note(register('statusItem', id, { alignment: left ? 'left' : 'right', priority }));
        const setter = (key) => (value) => {
            fields[key] = value;
            send();
        };
        const tone = (value) => {
            const text = typeof value === 'string' ? value : String(value?.id ?? '');
            if (text.includes('error')) return 'error';
            return text.includes('warning') ? 'warning' : '';
        };
        const item = {
            id,
            alignment: left ? StatusBarAlignment.Left : StatusBarAlignment.Right,
            priority,
            show: () => setter('visible')(true),
            hide: () => setter('visible')(false),
            dispose: () => note(unregister('statusItem', id))
        };
        const read = (key, wrap = (value) => value) => ({
            get: () => fields[key],
            set: (value) => setter(key)(wrap(value)),
            enumerable: true
        });
        Object.defineProperties(item, {
            text: read('text', String),
            tooltip: read('tooltip', (value) => String(value?.value ?? value ?? '')),
            command: read('command', (value) => String(value?.command ?? value ?? '')),
            name: read('name', String),
            backgroundColor: read('background', tone),
            accessibilityInformation: read('accessibility', (value) => String(value?.label ?? ''))
        });
        return item;
    };

    /** A TreeItem as oculus draws it; `mark` gives each command argument as it crosses. */
    const itemOf = (handle, item, mark) => {
        const label = typeof item.label === 'object' ? item.label?.label : item.label;
        return {
            handle,
            label: String(label ?? ''),
            description: typeof item.description === 'string' ? item.description : '',
            tooltip: String(item.tooltip?.value ?? item.tooltip ?? ''),
            iconPath: typeof item.iconPath === 'string' ? item.iconPath : '',
            collapsibleState: item.collapsibleState ?? TreeItemCollapsibleState.None,
            command:
                item.command === undefined
                    ? null
                    : {
                          command: String(item.command.command ?? ''),
                          arguments: (item.command.arguments ?? []).map(mark)
                      },
            contextValue: item.contextValue ?? '',
            resource: item.resourceUri ?? null
        };
    };

    /** The binding of a tree view: its provider, and the elements oculus holds handles of. */
    const bindTree = (view, provider, options) => {
        const byHandle = new Map();
        const byElement = new Map();
        const children = new Map();
        let counter = 0;
        const forget = (handle) => {
            for (const child of children.get(handle) ?? []) {
                forget(child);
                byElement.delete(byHandle.get(child));
                byHandle.delete(child);
            }
            children.delete(handle);
        };
        const mark = (value) =>
            byElement.has(value)
                ? { $treeViewId: view, $treeItemHandle: byElement.get(value) }
                : value;
        const handleFor = (item) => {
            let handle = typeof item.id === 'string' && item.id !== '' ? item.id : '';
            if (handle === '' || byHandle.has(handle)) {
                counter += 1;
                handle = `h${counter}`;
            }
            return handle;
        };
        const binding = {
            view,
            options,
            held: { selection: [], visible: false },
            async children(handle) {
                const parent = handle === '' ? undefined : byHandle.get(handle);
                if (handle !== '' && parent === undefined) throw new Error('missing');
                const elements = (await provider.getChildren?.(parent)) ?? [];
                forget(handle);
                const made = [];
                const items = [];
                for (const element of elements) {
                    const item = await provider.getTreeItem(element);
                    const child = handleFor(item);
                    byHandle.set(child, element);
                    byElement.set(element, child);
                    made.push(child);
                    items.push(item);
                }
                children.set(handle, made);
                return items.map((item, at) => itemOf(made[at], item, mark));
            },
            async item(handle) {
                const element = byHandle.get(handle);
                if (element === undefined) throw new Error('missing');
                return itemOf(handle, await provider.getTreeItem(element), mark);
            },
            elements: (handles) => handles.map((handle) => byHandle.get(handle)).filter(Boolean),
            handleOf: (element) => byElement.get(element),
            element: (handle) => byHandle.get(handle)
        };
        const listener = provider.onDidChangeTreeData?.((element) => {
            const handle = element === undefined || element === null ? '' : byElement.get(element);
            if (handle === undefined) return;
            changed('tree', view, { handles: handle === '' ? null : [handle] });
        });
        binding.stop = () => listener?.dispose?.();
        return binding;
    };

    const windowApi = {
        ProgressLocation,
        StatusBarAlignment,
        TreeItemCollapsibleState,
        showInformationMessage: message('info'),
        showWarningMessage: message('warning'),
        showErrorMessage: message('error'),
        async showQuickPick(items, options = {}) {
            const list = await items;
            const answer = await connection.sendRequest('oculus/ui', {
                kind: 'quickPick',
                items: list.map(pickOf),
                title: options.title ?? '',
                placeHolder: options.placeHolder ?? '',
                canPickMany: options.canPickMany === true,
                matchOnDescription: options.matchOnDescription === true,
                matchOnDetail: options.matchOnDetail === true
            });
            if (!Array.isArray(answer)) return undefined;
            const picked = answer.map((at) => list[at]).filter((one) => one !== undefined);
            return options.canPickMany === true ? picked : picked[0];
        },
        async showInputBox(options = {}) {
            const mine = typeof options.validateInput === 'function' ? options.validateInput : null;
            validator = mine;
            try {
                const answer = await connection.sendRequest('oculus/ui', {
                    kind: 'inputBox',
                    title: options.title ?? '',
                    prompt: options.prompt ?? '',
                    value: options.value ?? '',
                    placeHolder: options.placeHolder ?? '',
                    password: options.password === true,
                    validate: mine !== null
                });
                return typeof answer === 'string' ? answer : undefined;
            } finally {
                if (validator === mine) validator = null;
            }
        },
        withProgress: progressOf,
        createStatusBarItem: statusItem,
        registerTreeDataProvider(view, provider) {
            return windowApi.createTreeView(view, { treeDataProvider: provider });
        },
        createTreeView(view, options) {
            const registered = register('tree', view, {
                canSelectMany: options.canSelectMany === true,
                showCollapseAll: options.showCollapseAll === true
            });
            note(registered);
            const binding = bindTree(view, options.treeDataProvider, options);
            trees.set(view, binding);
            const selection = emitter(() => subscribe('selection', view));
            const expand = emitter(() => subscribe('expand', view));
            const collapse = emitter(() => subscribe('collapse', view));
            const visibility = emitter(() => subscribe('visibility', view));
            binding.fire = { selection, expand, collapse, visibility };
            /** What the page last sent and what the host last set, read back by the view. */
            const held = binding.held;
            const set = (key) => (value) => {
                held[key] = value;
                changed('tree', view, { [key]: value ?? null });
            };
            const tree = {
                registered,
                get selection() {
                    return held.selection;
                },
                get visible() {
                    return held.visible;
                },
                onDidChangeSelection: selection.event,
                onDidExpandElement: expand.event,
                onDidCollapseElement: collapse.event,
                onDidChangeVisibility: visibility.event,
                reveal(element) {
                    const handle = binding.handleOf(element);
                    if (handle === undefined) return Promise.reject(new Error('missing'));
                    changed('tree', view, { reveal: handle });
                    return Promise.resolve();
                },
                dispose() {
                    binding.stop();
                    trees.delete(view);
                    note(unregister('tree', view));
                }
            };
            for (const key of ['title', 'description', 'message']) {
                Object.defineProperty(tree, key, {
                    set: set(key),
                    get: () => held[key],
                    enumerable: true
                });
            }
            Object.defineProperty(tree, 'badge', {
                set: set('badge'),
                get: () => held.badge,
                enumerable: true
            });
            return tree;
        },
        createWebviewPanel(viewType, title, options = {}) {
            const id = `panel-${viewType}-${panels.size + 1}-${Date.now()}`;
            const disposed = emitter();
            const registered = register('panel', id, {
                viewType,
                title,
                entry: options.entry ?? '',
                preserveFocus: options.preserveFocus === true
            });
            note(registered);
            const panel = {
                id,
                viewType,
                registered,
                onDidDispose: disposed.event,
                reveal: () => changed('panel', id, { reveal: true }),
                dispose() {
                    panels.delete(id);
                    note(unregister('panel', id));
                    disposed.fire(undefined, report);
                }
            };
            Object.defineProperty(panel, 'title', {
                get: () => title,
                set: (value) => {
                    title = String(value);
                    changed('panel', id, { title });
                },
                enumerable: true
            });
            panels.set(id, { disposed, panel });
            return panel;
        }
    };

    /** The configuration of a section: the values the app declares, read at once. */
    const getConfiguration = (section = '') => {
        const whole = (key) => (section === '' ? key : `${section}.${key}`);
        const own = (key) => {
            if (!whole(key).startsWith(`${appName}.`)) throw new Error('not_declared');
        };
        return {
            get(key, fallback) {
                own(key);
                return Object.hasOwn(values, whole(key)) ? values[whole(key)] : fallback;
            },
            has(key) {
                own(key);
                return Object.hasOwn(values, whole(key));
            }
        };
    };

    const workspace = {
        getConfiguration,
        onDidChangeConfiguration: settingsEvents.event
    };

    /** The element a `{ $treeViewId, $treeItemHandle }` argument names; another argument as is. */
    const elementOf = (value) => {
        if (typeof value?.$treeViewId !== 'string' || typeof value?.$treeItemHandle !== 'string') {
            return value;
        }
        const element = trees.get(value.$treeViewId)?.element(value.$treeItemHandle);
        if (element === undefined) throw new Error('missing');
        return element;
    };

    /** Answer an `oculus/provide`. */
    const provide = async (params) => {
        if (params.kind === 'command') {
            const handler = commandHandlers.get(params.id);
            if (handler === undefined) throw new Error('missing');
            return handler(...(params.args ?? []).map(elementOf));
        }
        if (params.kind === 'validateInput') {
            if (validator === null) return null;
            const said = await validator(String(params.value ?? ''));
            return typeof said === 'string' && said !== '' ? said : null;
        }
        const tree = trees.get(params.view);
        if (tree === undefined) throw new Error('missing');
        if (params.kind === 'children') return tree.children(String(params.handle ?? ''));
        if (params.kind === 'item') return tree.item(String(params.handle ?? ''));
        throw new Error('missing');
    };

    /** Take an `oculus/event`. */
    const event = (params) => {
        const tree = trees.get(params.view);
        if (params.kind === 'settings') {
            values = params.values ?? values;
            const keys = params.keys ?? [];
            settingsEvents.fire(
                {
                    keys,
                    affectsConfiguration: (section) =>
                        keys.some((key) => key === section || key.startsWith(`${section}.`))
                },
                report
            );
        } else if (params.kind === 'cancel') {
            cancels.get(params.id)?.();
        } else if (params.kind === 'dispose') {
            const held = panels.get(params.id);
            panels.delete(params.id);
            held?.disposed.fire(undefined, report);
        } else if (tree !== undefined) {
            fireTree(tree, params);
        }
    };

    /** Fire the event of a tree view a page reported. */
    const fireTree = (tree, params) => {
        const { fire } = tree;
        if (params.kind === 'visibility') {
            tree.held.visible = params.visible === true;
            fire.visibility.fire({ visible: tree.held.visible }, report);
        } else if (params.kind === 'selection') {
            tree.held.selection = tree.elements(params.handles ?? []);
            fire.selection.fire({ selection: tree.held.selection }, report);
        } else if (params.kind === 'expand') {
            fire.expand.fire({ element: tree.element(String(params.handle ?? '')) }, report);
        } else if (params.kind === 'collapse') {
            fire.collapse.fire({ element: tree.element(String(params.handle ?? '')) }, report);
        }
    };

    return {
        api: { commands, window: windowApi, workspace },
        provide,
        event,
        /** Hold the app's name and its resolved setting values from the first activation. */
        start(name, held) {
            appName = name;
            values = held ?? {};
        }
    };
}
