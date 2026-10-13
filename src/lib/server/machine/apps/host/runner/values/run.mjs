// Layer 2, server. The value classes of VS Code's tasks, debug adapters, file decorations and
// breakpoints as the host's object offers them: `Task` with its executions and groups, the three
// descriptors a debug adapter factory answers, `FileDecoration`, and the breakpoint classes. They
// hold the fields the API names and nothing else; the namespaces that take them read the fields
// when they cross to oculus. The runner imports it before it installs its import guard.

/** Where a task belongs when it has no workspace folder. */
export const TaskScope = Object.freeze({ Global: 1, Workspace: 2 });

export const TaskRevealKind = Object.freeze({ Always: 1, Silent: 2, Never: 3 });

export const TaskPanelKind = Object.freeze({ Shared: 1, Dedicated: 2, New: 3 });

/** A group of tasks: the Build or Test group, with whether the task is the default of it. */
export class TaskGroup {
    static Clean = new TaskGroup('clean', 'Clean');
    static Build = new TaskGroup('build', 'Build');
    static Rebuild = new TaskGroup('rebuild', 'Rebuild');
    static Test = new TaskGroup('test', 'Test');

    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.isDefault = undefined;
    }
}

/** A quoting of one argument of a shell execution. */
export const ShellQuoting = Object.freeze({ Escape: 1, Strong: 2, Weak: 3 });

/** A command line run by a shell, or a command with arguments that a shell runs. */
export class ShellExecution {
    constructor(commandLine, argsOrOptions, options) {
        if (Array.isArray(argsOrOptions)) {
            this.command = commandLine;
            this.args = argsOrOptions;
            this.options = options;
        } else {
            this.commandLine = commandLine;
            this.options = argsOrOptions;
        }
    }
}

/** A program run with its arguments and no shell. */
export class ProcessExecution {
    constructor(process, argsOrOptions, options) {
        this.process = process;
        if (Array.isArray(argsOrOptions)) {
            this.args = argsOrOptions;
            this.options = options;
        } else {
            this.args = [];
            this.options = argsOrOptions;
        }
    }
}

/** A task that runs in the host: the callback answers the pseudoterminal it is shown in. */
export class CustomExecution {
    constructor(callback) {
        this.callback = callback;
    }
}

/** A task as a provider answers it and `executeTask` takes it. */
export class Task {
    constructor(definition, scope, name, source, execution, problemMatchers) {
        this.definition = definition;
        this.scope = scope;
        this.name = name;
        this.source = source;
        this.execution = execution;
        this.problemMatchers =
            typeof problemMatchers === 'string' ? [problemMatchers] : (problemMatchers ?? []);
        this.isBackground = false;
        this.group = undefined;
        this.detail = undefined;
        this.presentationOptions = {};
        this.runOptions = {};
    }
}

/** The command line and `exec` of a debug adapter run as a child of the host. */
export class DebugAdapterExecutable {
    constructor(command, args = [], options = {}) {
        this.command = command;
        this.args = args;
        this.options = options;
    }
}

/** A debug adapter that listens on a port. */
export class DebugAdapterServer {
    constructor(port, host = '127.0.0.1') {
        this.port = port;
        this.host = host;
    }
}

/**
 * A debug adapter that runs inside the host: an object with `onDidSendMessage` and `handleMessage`.
 */
export class DebugAdapterInlineImplementation {
    constructor(implementation) {
        this.implementation = implementation;
    }
}

export const DebugConfigurationProviderTriggerKind = Object.freeze({ Initial: 1, Dynamic: 2 });

/** A badge, a tooltip and a colour for a file in the Files view. */
export class FileDecoration {
    constructor(badge, tooltip, color) {
        this.badge = badge;
        this.tooltip = tooltip;
        this.color = color;
        this.propagate = false;
    }
}

/** A breakpoint of the debug view as the host reads it. */
export class Breakpoint {
    constructor(enabled = true, condition, hitCondition, logMessage) {
        this.enabled = enabled;
        this.condition = condition;
        this.hitCondition = hitCondition;
        this.logMessage = logMessage;
    }
}

export class SourceBreakpoint extends Breakpoint {
    constructor(location, enabled, condition, hitCondition, logMessage) {
        super(enabled, condition, hitCondition, logMessage);
        this.location = location;
    }
}

export class FunctionBreakpoint extends Breakpoint {
    constructor(functionName, enabled, condition, hitCondition, logMessage) {
        super(enabled, condition, hitCondition, logMessage);
        this.functionName = functionName;
    }
}

/** How a terminal ended. */
export const TerminalExitReason = Object.freeze({
    Unknown: 0,
    Shutdown: 1,
    Process: 2,
    User: 3,
    Extension: 4
});

export const TerminalLocation = Object.freeze({ Panel: 1, Editor: 2 });
