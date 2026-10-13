// Layer 4, test helper. An app that declares a debugger `notes.dbg` whose adapter is a node program
// that speaks the debug protocol and records every request it is sent to a file. The same adapter
// logic runs behind the three descriptors a factory may answer: an executable (standard streams),
// a server (a port) and an inline implementation (an object in the host).
//
// Every folder is under the system temporary directory (tests/fixtures/scratch.ts).

import { existsSync, readFileSync } from 'node:fs';
import type { AppSpec } from './hosts-world.ts';

/**
 * What the scripted adapter declares in its answer to `initialize`. `oculusThread` is the id of the
 * program's one thread, 1 when absent.
 */
export type AdapterCaps = Record<string, unknown>;

/** An adapter that declares every capability a case of the debug client reads. */
export const EVERY_CAP: AdapterCaps = {
    supportsConfigurationDoneRequest: true,
    supportsConditionalBreakpoints: true,
    supportsHitConditionalBreakpoints: true,
    supportsLogPoints: true,
    supportsFunctionBreakpoints: true,
    supportsEvaluateForHovers: true,
    supportsSetVariable: true,
    supportsRestartRequest: true,
    supportsTerminateRequest: true,
    supportsCompletionsRequest: true,
    exceptionBreakpointFilters: [{ filter: 'all', label: 'All', default: true }]
};

/**
 * A wait on a condition that is looked at again each time `wake` is called: `until` resolves the
 * first time the condition holds, at the call itself or at a later wake.
 */
export function waiter(): { wake: () => void; until: (accepts: () => boolean) => Promise<void> } {
    const waiting = new Set<() => void>();
    return {
        wake() {
            for (const look of [...waiting]) look();
        },
        until: (accepts) =>
            new Promise((resolve) => {
                const look = (): void => {
                    if (!accepts()) return;
                    waiting.delete(look);
                    resolve();
                };
                waiting.add(look);
                look();
            })
    };
}

/** How the app's host gets the adapter started. */
export type DescriptorKind = 'executable' | 'server' | 'inline' | 'manifest';

/** The adapter's logic, in plain JavaScript that runs in a node program and in an ES module. */
const CORE = `
function createAdapter(caps, note, emit, state) {
  const thread = typeof caps.oculusThread === 'number' ? caps.oculusThread : 1;
  let program = '';
  let stopOnEntry = false;
  const respond = (request, body, success = true) =>
    emit({ type: 'response', request_seq: request.seq, success, command: request.command, body: body ?? {} });
  const event = (name, body) => emit({ type: 'event', event: name, body: body ?? {} });
  return (message) => {
    note(message);
    const args = message.arguments ?? {};
    switch (message.command) {
      case 'initialize':
        respond(message, caps);
        event('initialized');
        return;
      case 'launch':
      case 'attach':
        program = typeof args.program === 'string' ? args.program : '';
        stopOnEntry = args.stopOnEntry === true;
        respond(message);
        return;
      case 'setBreakpoints':
        respond(message, { breakpoints: (args.breakpoints ?? []).map((one) => ({ verified: true, line: one.line })) });
        return;
      case 'setFunctionBreakpoints':
        respond(message, { breakpoints: (args.breakpoints ?? []).map(() => ({ verified: true })) });
        return;
      case 'configurationDone':
        respond(message);
        if (stopOnEntry) event('stopped', { reason: 'entry', threadId: thread, allThreadsStopped: true });
        return;
      case 'threads':
        respond(message, { threads: [{ id: thread, name: 'main' }] });
        return;
      case 'stackTrace':
        respond(message, { stackFrames: [{ id: 1, name: 'main', line: 1, column: 1, source: { path: program } }], totalFrames: 1 });
        return;
      case 'scopes':
        respond(message, { scopes: [{ name: 'Locals', variablesReference: 1, expensive: false }] });
        return;
      case 'variables':
        respond(message, { variables: [{ name: 'x', value: '1', variablesReference: 0, type: 'int' }] });
        return;
      case 'evaluate':
        respond(message, { result: '42', variablesReference: 0 });
        return;
      case 'completions':
        respond(message, { targets: [{ label: 'x', text: 'x' }] });
        return;
      case 'setVariable':
        respond(message, { value: String(args.value) });
        return;
      case 'restart':
        respond(message);
        return;
      case 'continue':
        respond(message, { allThreadsContinued: true });
        return;
      case 'pause':
        respond(message);
        event('stopped', { reason: 'pause', threadId: args.threadId, allThreadsStopped: true });
        return;
      case 'terminate':
        respond(message);
        event('terminated');
        state.end?.();
        return;
      case 'disconnect':
        respond(message);
        state.end?.();
        return;
      default:
        respond(message, { error: 'unknown' }, true);
    }
  };
}
`;

/** The text of the adapter program: its arguments are the log file, the capabilities, a port. */
export function adapterProgram(): string {
    return `${CORE}
const fs = require('node:fs');
const net = require('node:net');
const [log, capsText, portText] = process.argv.slice(2);
const caps = JSON.parse(capsText);
const note = (m) => fs.appendFileSync(log, JSON.stringify(m) + '\\n');
function serve(input, output, end) {
  let seq = 1;
  let buffer = Buffer.alloc(0);
  const emit = (m) => {
    const text = JSON.stringify({ seq: seq++, ...m });
    output.write('Content-Length: ' + Buffer.byteLength(text) + '\\r\\n\\r\\n' + text);
  };
  const handle = createAdapter(caps, note, emit, { end });
  input.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      const at = buffer.indexOf('\\r\\n\\r\\n');
      if (at < 0) return;
      const length = Number(/Content-Length: (\\d+)/.exec(buffer.subarray(0, at).toString())[1]);
      if (buffer.length < at + 4 + length) return;
      const message = JSON.parse(buffer.subarray(at + 4, at + 4 + length).toString());
      buffer = buffer.subarray(at + 4 + length);
      handle(message);
    }
  });
}
if (portText) {
  const server = net.createServer((socket) => serve(socket, socket, () => { socket.end(); server.close(); }));
  server.listen(Number(portText), '127.0.0.1', () => process.stdout.write('listening\\n'));
} else {
  serve(process.stdin, process.stdout, () => process.stdout.write('', () => process.exit(0)));
  process.stdin.on('end', () => process.exit(0));
}
`;
}

/** The factory source for a descriptor kind; the host file imports what it needs. */
function factorySource(kind: DescriptorKind, log: string, caps: AdapterCaps, port: number): string {
    const args = JSON.stringify([log, JSON.stringify(caps)]);
    if (kind === 'manifest') return '';
    if (kind === 'executable') {
        return `oculus.debug.registerDebugAdapterDescriptorFactory('notes.dbg', {
    createDebugAdapterDescriptor: () => new oculus.DebugAdapterExecutable(process.execPath, [fileURLToPath(new URL('./adapter.js', import.meta.url)), ...${args}], {})
  });`;
    }
    if (kind === 'server') {
        return `oculus.debug.registerDebugAdapterDescriptorFactory('notes.dbg', {
    createDebugAdapterDescriptor: async () => {
      const child = spawn(process.execPath, [fileURLToPath(new URL('./adapter.js', import.meta.url)), ...${args}, '${port}'], { stdio: ['ignore', 'pipe', 'ignore'] });
      await new Promise((resolve) => child.stdout.once('data', resolve));
      child.unref();
      child.stdout.unref();
      return new oculus.DebugAdapterServer(${port}, '127.0.0.1');
    }
  });`;
    }
    return `${CORE}
  oculus.debug.registerDebugAdapterDescriptorFactory('notes.dbg', {
    createDebugAdapterDescriptor: () => {
      const writer = new oculus.EventEmitter();
      let seq = 1;
      const note = (m) => appendFileSync(${JSON.stringify(log)}, JSON.stringify(m) + '\\n');
      const emit = (m) => writer.fire({ seq: seq++, ...m });
      const handle = createAdapter(${JSON.stringify(caps)}, note, emit, {});
      return new oculus.DebugAdapterInlineImplementation({
        onDidSendMessage: writer.event,
        handleMessage: (message) => handle(message),
        dispose: () => undefined
      });
    }
  });`;
}

/** What `debugApp` is asked for beyond the descriptor kind. */
export type DebugAppOver = {
    /** Source added to `activate`, after the factory is registered. */
    extra?: string;
    /** The `debuggers` entry beyond the type and label, as YAML lines indented by 6. */
    debuggerKeys?: string;
    /** More keys of `contributes`, as YAML lines indented by 2. */
    contributes?: string;
    /** The app names no host file; only the manifest's program runs. */
    hostless?: boolean;
};

/** The default launch properties the scripted debugger accepts. */
const ATTRIBUTES =
    '      configurationAttributes:\n        launch:\n          properties:\n            stopOnEntry:\n              type: boolean\n        attach:\n          properties:\n            processId:\n              type: number\n';

/** The app `notes` declaring the debugger `notes.dbg`, started by the given kind of descriptor. */
export function debugApp(
    kind: DescriptorKind,
    caps: AdapterCaps,
    log: string,
    port = 0,
    over: DebugAppOver = {}
): AppSpec {
    const manifestArgs =
        kind === 'manifest'
            ? `      program: adapter.js\n      runtime: node\n      args: ${JSON.stringify([log, JSON.stringify(caps)])}\n`
            : '';
    if (over.hostless === true) {
        return {
            host: null,
            keys: `contributes:\n  debuggers:\n    - type: notes.dbg\n      label: Notes Debug\n${manifestArgs}${ATTRIBUTES}`,
            files: { 'adapter.js': adapterProgram() }
        };
    }
    return {
        keys: `activation: ["onCommand:workbench.action.debug.start", "onCommand:notes.do"]\ncontributes:\n  debuggers:\n    - type: notes.dbg\n      label: Notes Debug\n      languages: [plaintext]\n${manifestArgs}${ATTRIBUTES}${over.debuggerKeys ?? ''}${over.contributes ?? ''}`,
        files: { 'adapter.js': adapterProgram() },
        host: `import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
export function activate(oculus) {
  ${factorySource(kind, log, caps, port)}
${over.extra ?? ''}}
`
    };
}

/** The requests the adapter was sent, in order. */
export function requestsTo(log: string): { command: string; arguments: Record<string, unknown> }[] {
    if (!existsSync(log)) return [];
    return readFileSync(log, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as { command: string; arguments: Record<string, unknown> });
}
