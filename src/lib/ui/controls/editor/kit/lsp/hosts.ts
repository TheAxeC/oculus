// Layer 3, primitive. The language server kit of a page: one client per language, made when the
// first model of the language registers, and what the page shares between them. It holds the
// peek models, the commands a server runs (registered with Monaco once per id and run by whichever
// language's client holds the document the command names), the opener that takes a go-to-definition
// or a link press to a source tab through the services, and the answer to which models a server
// serves, which the brace folding of C and C++ reads so that clangd's ranges are used while it
// serves a model and the braces' while it does not.
//
// Pyright serves `python`, clangd `c` and `cpp`; a model of any other language registers with no
// client and is never sent anywhere.

import type * as Monaco from 'monaco-editor';
import { LanguageHost, clientClassOf, type LspHandle, type Registration } from './client';
import { createPeeks } from './peeks';
import type { LspServices } from './services';
import { Signal } from './signal';
import { placeOfResource } from './uris';

/** The languages a server serves, by the name of the Monaco language a model is made under. */
export const SERVED_LANGUAGES: readonly string[] = ['python', 'c', 'cpp'];

/** Which models a server serves now, and the call that hears it change. */
type Served = {
    has(model: Monaco.editor.ITextModel): boolean;
    onChange(listener: () => void): { dispose(): void };
};

/** The language server kit of a page. */
export type LspKit = {
    /**
     * Register a model with its language's client; null for a language no server serves. The model
     * is the server's until the handle's `dispose`.
     */
    register(
        services: LspServices,
        model: Monaco.editor.ITextModel,
        reg: Registration
    ): LspHandle | null;
    served: Served;
};

/** What the kit reads of the page. */
export type LspKitParts = {
    ensureLanguage: (name: string) => Promise<void>;
    /** The lookup strings the theme in force paints semantic tokens by. */
    ruled: () => ReadonlySet<string>;
    /** Hear every paint that changed the theme, which colours semantic tokens afresh. */
    onPainted: (listener: () => void) => { dispose(): void };
    now?: () => number;
};

/** One command id registered with Monaco, and the clients whose servers run it. */
type Command = { hosts: Set<LanguageHost>; command: { dispose(): void } };

/** Make the kit of one Monaco. */
export function createLspKit(monaco: typeof Monaco, parts: LspKitParts): LspKit {
    const hosts = new Map<string, LanguageHost>();
    const commands = new Map<string, Command>();
    const changed = new Signal();
    const peeks = createPeeks(monaco, parts.ensureLanguage);
    const ClientClass = clientClassOf(monaco);
    const now = parts.now ?? (() => Date.now());
    let services: LspServices | null = null;

    /** Run a command through the first client whose document the arguments name. */
    function run(id: string, args: readonly unknown[]): void {
        for (const host of commands.get(id)?.hosts ?? []) {
            const running = host.run(id, args);
            if (running === null) continue;
            running.catch(() => undefined);
            return;
        }
    }

    function registerCommand(id: string, host: LanguageHost): { dispose(): void } {
        let held = commands.get(id);
        if (held === undefined) {
            held = {
                hosts: new Set(),
                command: monaco.editor.registerCommand(id, (_accessor, ...args: unknown[]) =>
                    run(id, args)
                )
            };
            commands.set(id, held);
        }
        held.hosts.add(host);
        const command = held;
        return {
            dispose: () => {
                command.hosts.delete(host);
                if (command.hosts.size > 0) return;
                command.command.dispose();
                commands.delete(id);
            }
        };
    }

    /** The file a resource shows: a registered model's, or a peek model's in the page's form. */
    function placeOf(resource: Monaco.Uri): ReturnType<typeof placeOfResource> {
        const model = monaco.editor.getModel(resource);
        if (model !== null) {
            for (const host of hosts.values()) {
                const place = host.placeOf(model);
                if (place !== null) return place;
            }
        }
        return placeOfResource(resource);
    }

    monaco.editor.registerEditorOpener({
        openCodeEditor(source, resource, at) {
            if (services === null) return false;
            const own = source.getModel();
            if (own !== null && own.uri.toString() === resource.toString()) return false;
            const place = placeOf(resource);
            if (place === null) return false;
            const position = at === undefined ? null : 'startLineNumber' in at ? at : null;
            const point = at === undefined ? null : 'lineNumber' in at ? at : null;
            services.open(
                place.root,
                place.path,
                position?.startLineNumber ?? point?.lineNumber ?? 1,
                position?.startColumn ?? point?.column ?? 1
            );
            // The file opens in a tab of its own, so Monaco is told no editor of its own opened it:
            // an opener's true makes Monaco go on in the source editor as if it showed the file,
            // and Next Problem then looks for the next problem from there again, without end.
            return false;
        }
    });
    monaco.editor.registerLinkOpener({
        open(resource) {
            const place = placeOfResource(resource);
            if (place === null || services === null) return false;
            services.open(place.root, place.path, 1, 1);
            return true;
        }
    });

    return {
        register(given, model, reg) {
            const language = model.getLanguageId();
            if (!SERVED_LANGUAGES.includes(language)) return null;
            services ??= given;
            let host = hosts.get(language);
            if (host === undefined) {
                host = new LanguageHost({
                    monaco,
                    services: given,
                    peeks,
                    language,
                    ClientClass,
                    ruled: parts.ruled,
                    onPainted: parts.onPainted,
                    registerCommand,
                    changed,
                    now
                });
                hosts.set(language, host);
            }
            return host.register(model, reg);
        },
        served: {
            has: (model) => [...hosts.values()].some((host) => host.serves(model)),
            onChange: (listener) => changed.event(listener)
        }
    };
}
