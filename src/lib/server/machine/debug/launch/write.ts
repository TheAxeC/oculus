// Layer 2, server. The writes of the Debug view into the `configurations` list of
// `<repo>/.oculus/launch.yml`: Add Configuration appends one configuration, the file made when it
// is absent; Edit makes the changes the form sends to the configuration of a name, in its place;
// Delete takes the configuration of a name out. The write itself, with what it keeps of the file
// and what it refuses, is server/files/source/list-entries.ts's, shared with `.oculus/cpp.yml`; a
// configuration is found by its name, which the reader of the file holds unique.

import { editEntries, type Edited } from '../../../files/source/list-entries.ts';
import type { OpsTarget } from '../../../files/fs/ops.ts';

/** What a write came to: the line of the entry written, or the word of why nothing was written. */
export type Appended = Edited;

/**
 * One write of the list: a configuration appended; the configuration of `name` given `changes`,
 * each key set to its value or taken out by a null; or that configuration taken out when
 * `changes` is null.
 */
export type LaunchEdit =
    | { kind: 'add'; configuration: Record<string, unknown> }
    | { kind: 'set'; name: string; changes: Record<string, unknown> | null };

/**
 * Make one write of a repository's launch file. `repo` is the repository's real path, and it lies
 * under one of the roots of `into`.
 */
export function editLaunch(into: OpsTarget, repo: string, edit: LaunchEdit): Promise<Appended> {
    const file = { name: 'launch.yml', list: 'configurations' };
    if (edit.kind === 'add') {
        return editEntries(into, repo, file, { kind: 'add', entry: edit.configuration });
    }
    const found = { name: edit.name };
    return editEntries(
        into,
        repo,
        file,
        edit.changes === null
            ? { kind: 'delete', found }
            : { kind: 'set', found, changes: edit.changes }
    );
}
