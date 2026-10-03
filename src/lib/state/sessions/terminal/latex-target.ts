// Layer 2, client state, pure. The folder a LaTeX read or a LaTeX terminal is about: a project, by
// its id, whose main files sit in its `manuscript/` folder, or any folder of a served root, by the
// root's key and the path under it. The two forms are the two ways api/latex and the latex action
// of api/terminal take a folder, and `targetKey` is the key the page holds a folder's state under,
// so a project and a folder whose names happen to match can never share one.

/** A project by its id, or a folder of a served root by its root key and its path under it. */
export type LatexTarget = { id: string } | { root: string; path: string };

/** The part of a query key that names the target, for the query client and the wait lists. */
export function targetKey(target: LatexTarget): string[] {
    return 'id' in target ? ['project', target.id] : ['folder', target.root, target.path];
}

/** The fields of an api request that name the target. */
export function targetFields(target: LatexTarget): Record<string, string> {
    return 'id' in target ? { id: target.id } : { root: target.root, path: target.path };
}

/** Whether the target names nothing: a project with no id, or a folder of no root. */
export function emptyTarget(target: LatexTarget): boolean {
    return 'id' in target ? target.id === '' : target.root === '';
}
