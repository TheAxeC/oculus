// Layer 4, test helper. The import graph of src as the checks over it read it: every module, and
// every import it makes at run time, resolved to the module it names.
//
// A runtime import is every `import`, `export ... from` and `import('...')` whose statement does
// not open with `import type` or `export type`, since those two leave nothing behind once the
// TypeScript is compiled and so cannot join two modules at run time; the cycle check reads those
// alone, and the folder order and the boundary test read the type-only ones too. A module is
// parsed, never matched as text, by bin/diagrams/imports.mjs, the one reader the diagrams call
// too, so a comment is never read as code. The boundary test, the cycle check, the folder order
// and the augmentation check all read their modules through sourceFiles(), their imports through
// runtimeImports() or augmentations(), and resolve a specifier through target(), so they agree on
// what a module is and which module an import names.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';
import { augmentationsOf, importsOf, moduleAt } from '../../../bin/diagrams/imports.mjs';

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

/** One import: the specifier as written, the module it names, and its line. */
export type RuntimeImport = { spec: string; id: string; line: number };

/**
 * Every import of one module's text that names a module of the tree, in the order its lines give,
 * as bin/diagrams/imports.mjs's importsOf() parses them: the runtime ones alone, or with `types`
 * the type-only ones as well, which is what the folder order holds, since a type is a dependency
 * of the design even when the built code keeps nothing of it. An `import()` whose specifier could
 * not be read names nothing here, and neither does an `import.meta.glob`, which names a pattern.
 */
export function runtimeImports(
    fileRel: string,
    text: string,
    lib = '',
    types = false
): RuntimeImport[] {
    const found: RuntimeImport[] = [];
    for (const one of importsOf(fileRel, text)) {
        if (one.spec === null || one.glob === true || (!types && one.typeOnly)) continue;
        const id = target(fileRel, one.spec, lib);
        if (id !== null) found.push({ spec: one.spec, id, line: one.line });
    }
    return found;
}

/**
 * Every `declare module` block and every `/// <reference path>` directive of one module's text
 * that names a module of the tree, with its line, as augmentationsOf() in
 * bin/diagrams/imports.mjs parses them. A package's own augmentation (`declare module
 * 'some-package'`) names no module of the tree and is not one; a directive's path is read as a
 * path beside the file, as the compiler reads it.
 */
export function augmentations(fileRel: string, text: string, lib = ''): RuntimeImport[] {
    const found: RuntimeImport[] = [];
    for (const one of augmentationsOf(fileRel, text)) {
        const spec = one.reference && !one.spec.startsWith('.') ? `./${one.spec}` : one.spec;
        const id = target(fileRel, spec, lib);
        if (id !== null) found.push({ spec: one.spec, id, line: one.line });
    }
    return found;
}

/**
 * The file a module id is, by moduleAt() of bin/diagrams/imports.mjs, which resolves an ending as
 * Vite does; the id itself, with the ending the specifier wrote, where no file answers, so an
 * import of a module that is not there still names where it points.
 */
export function moduleOf(root: string, id: string, spec = ''): string {
    const ending = /\.(ts|js)$/.exec(spec)?.[0] ?? '';
    const isFile = (path: string): boolean =>
        existsSync(join(root, path)) && statSync(join(root, path)).isFile();
    return moduleAt(`${id}${ending}`, isFile) ?? `${id}${ending}`;
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
