// Layer 4, test helper. The import graph of src as the checks over it read it: every module, and
// every import it makes at run time, resolved to the module it names.
//
// A runtime import is every `import`, `export ... from` and `import('...')` whose statement does
// not open with `import type` or `export type`, since those two leave nothing behind once the
// TypeScript is compiled and so cannot join two modules at run time; the cycle check reads those
// alone. The folder order reads the type-only ones too, and each `declare module` block that
// augments a module of the tree, since an augmentation names the module it adds to as surely as an
// import does and would otherwise carry a dependency past the order. The boundary test, the cycle
// check and the folder order all read their modules through sourceFiles() and resolve a specifier
// through target(), so the three agree on what a module is and which module an import names.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';

/** Every .ts and .svelte file under a root, as paths relative to it with forward slashes. */
export function sourceFiles(root: string, prefix = ''): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) found.push(...sourceFiles(root, rel));
        else if (/\.(ts|svelte)$/.test(entry.name)) found.push(rel);
    }
    return found.sort();
}

/**
 * The root-relative module a specifier names, without a `.ts` or `.js` ending, or null when it
 * names a package or something above the root. `$lib/` is the `lib` folder of the root when the
 * root is src, and the root itself when the root is src/lib, which is what `lib` says.
 */
export function target(fileRel: string, spec: string, lib = ''): string | null {
    let id: string | null = null;
    if (spec.startsWith('$lib/')) id = `${lib}${spec.slice('$lib/'.length)}`;
    else if (spec.startsWith('.')) {
        const joined = normalize(join(dirname(fileRel), spec))
            .split(sep)
            .join('/');
        id = joined.startsWith('..') ? null : joined;
    }
    if (id === null) return null;
    return id.replace(/\.(ts|js)$/, '');
}

/**
 * One runtime import: the specifier as written, the module it names, and its line; `augments` when
 * it is a `declare module` block adding to that module rather than an import of it.
 */
export type RuntimeImport = { spec: string; id: string; line: number; augments?: boolean };

/** A `declare module` block naming a module by a specifier, which augments that module. */
const AUGMENT = /\bdeclare\s+module\s+['"]([^'"]+)['"]/g;

/**
 * An import or re-export statement, or a dynamic import of a literal specifier. bin/diagrams/
 * source.mjs reads imports with the same pattern, its RUNTIME, which the diagrams test holds to it.
 */
export const STATEMENT =
    /(?<![\w$.])(?:(import|export)\s+(type\s+)?(?:[^'"`;]*?\s+from\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g;

/** The line an index of a text falls on, from 1. */
function lineAt(text: string, index: number): number {
    return text.slice(0, index).split('\n').length;
}

/**
 * Every runtime import of one module's text, in the order it makes them; with `types`, every
 * type-only import and every `declare module` augmentation of a module of the tree as well, which
 * is what the folder order holds, since a type is a dependency of the design even when the built
 * code keeps nothing of it.
 */
export function runtimeImports(
    fileRel: string,
    text: string,
    lib = '',
    types = false
): RuntimeImport[] {
    const found: RuntimeImport[] = [];
    for (const match of text.matchAll(STATEMENT)) {
        if (!types && /^(?:import|export)\s+type\s/.test(match[0])) continue;
        const id = target(fileRel, match[3], lib);
        if (id === null) continue;
        found.push({ spec: match[3], id, line: lineAt(text, match.index) });
    }
    if (!types) return found;
    for (const match of text.matchAll(AUGMENT)) {
        const id = target(fileRel, match[1], lib);
        if (id === null) continue;
        found.push({ spec: match[1], id, line: lineAt(text, match.index), augments: true });
    }
    return found.sort((a, b) => a.line - b.line);
}

/**
 * The file a module id is, trying the endings an import leaves off, in the order the bundler tries
 * them; the id itself where no file answers, so an import of a module that is not there still
 * names where it points. A specifier that writes its own `.ts` or `.js` ending names that file and
 * no other, as the bundler reads it, so `../model.ts` is never taken for `../model/index.ts`.
 */
export function moduleOf(root: string, id: string, spec = ''): string {
    const ending = /\.(ts|js)$/.exec(spec);
    if (ending !== null) return `${id}${ending[0]}`;
    for (const tail of ['', '.ts', '.js', '/index.ts']) {
        if (existsSync(join(root, id + tail)) && /\.(ts|js|svelte)$/.test(id + tail)) {
            return id + tail;
        }
    }
    return id;
}

/**
 * The import graph of a root: every module, and the modules it imports, by file. Runtime imports
 * alone unless `types` asks for the type-only ones too.
 */
export function importGraph(root: string, lib = '', types = false): Map<string, RuntimeImport[]> {
    const graph = new Map<string, RuntimeImport[]>();
    for (const fileRel of sourceFiles(root)) {
        const text = readFileSync(join(root, fileRel), 'utf8');
        const imports = runtimeImports(fileRel, text, lib, types).map((one) => ({
            ...one,
            id: moduleOf(root, one.id, one.spec)
        }));
        graph.set(fileRel, imports);
    }
    return graph;
}

/**
 * Every cycle of runtime imports between modules, each named by its modules in the order the
 * imports run, the first module repeated at the end: `a -> b -> c -> a`.
 *
 * The cycles are the strongly connected components of more than one module (Tarjan's algorithm).
 * A module importing itself is not one: that is how a Svelte component draws itself recursively
 * (the pane tree's SplitView and PageLeaf), and nothing of it is read while it loads. Each cycle
 * is written as one closed walk through it, starting at its first module by name and taking at
 * each step the first import, by name, that leads back to the start inside the component, so the
 * same tree always names a cycle the same way.
 */
export function findCycles(graph: Map<string, RuntimeImport[]>): string[] {
    const next = (module: string): string[] =>
        [...new Set((graph.get(module) ?? []).map((one) => one.id))]
            .filter((id) => graph.has(id))
            .sort();
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const stack: string[] = [];
    const held = new Set<string>();
    const components: string[][] = [];
    let counter = 0;
    const visit = (module: string): void => {
        index.set(module, counter);
        low.set(module, counter);
        counter += 1;
        stack.push(module);
        held.add(module);
        for (const to of next(module)) {
            if (!index.has(to)) {
                visit(to);
                low.set(module, Math.min(low.get(module) ?? 0, low.get(to) ?? 0));
            } else if (held.has(to)) {
                low.set(module, Math.min(low.get(module) ?? 0, index.get(to) ?? 0));
            }
        }
        if (low.get(module) !== index.get(module)) return;
        const component: string[] = [];
        for (let top = stack.pop(); top !== undefined; top = stack.pop()) {
            held.delete(top);
            component.push(top);
            if (top === module) break;
        }
        if (component.length > 1) components.push(component);
    };
    for (const module of [...graph.keys()].sort()) if (!index.has(module)) visit(module);
    return components.map((component) => walk(component.sort(), next)).sort();
}

/** One closed walk through a component from its first module back to it, as `a -> b -> a`. */
function walk(component: string[], next: (module: string) => string[]): string {
    const start = component[0];
    const inside = new Set(component);
    const seen = new Set<string>();
    const path = [start];
    const step = (module: string): boolean => {
        for (const to of next(module)) {
            if (!inside.has(to)) continue;
            if (to === start) return true;
            if (seen.has(to)) continue;
            seen.add(to);
            path.push(to);
            if (step(to)) return true;
            path.pop();
        }
        return false;
    };
    step(start);
    return [...path, start].join(' -> ');
}
