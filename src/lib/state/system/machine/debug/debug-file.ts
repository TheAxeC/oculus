// Layer 2, client state. Add Configuration of the Debug view: open `.oculus/launch.yml` of a
// repository, making it first when it is absent.
//
// The file is made with the file operations store's create, which makes `.oculus/` and an empty
// file, and then written with the text of one configuration through the source write. The file is
// read back through GET /api/debug and its tab opens at the configuration; a read that lists any
// other than the one configuration or holds a finding opens the file and says the first finding as
// a notice. A file made between the read and the create is opened and written over by nothing.

import type { DebugLaunches } from '../../../../data/model/index.ts';
import { deepestHolding, joinPath } from '../../../../data/helpers/files/paths.ts';
import { refusalSentence, unreachableAnswer } from '../../../shared/answers/answers.ts';
import type { Queries } from '../../../shared/stores/shapes.ts';
import { t } from '../../../shared/words/text.ts';
import { readLaunches } from './debug-io.ts';
import { LAUNCH_TEXT } from './debug.ts';
import type { DebugDeps } from './debug.svelte.ts';

/** The file the launch configurations are kept in, relative to a repository. */
export const LAUNCH_FILE = '.oculus/launch.yml';

/** The line of a read's first configuration, or the top of the file. */
function firstLine(read: DebugLaunches | { error: string }): number {
    return 'error' in read ? 1 : (read.configurations.at(0)?.line ?? 1);
}

export async function addConfiguration(
    deps: DebugDeps,
    queries: Queries,
    path: string
): Promise<void> {
    const say = (message: string, tone: 'warning' | 'error' = 'warning'): void => {
        deps.notices.post(message, { tone });
    };
    const listed = await readLaunches(path);
    if ('error' in listed) {
        say(listed.error, 'error');
        return;
    }
    const place = deepestHolding(deps.served(), (root) => root.dir, path);
    if (place === null) {
        say(t('debug.frame_unserved', path));
        return;
    }
    if (listed.exists) {
        deps.openFile(path, LAUNCH_FILE, firstLine(listed));
        return;
    }
    const into = { root: place.item.key, path: place.path };
    const made = await deps.create(into, LAUNCH_FILE, false);
    if (!made.ok && made.error === 'exists') {
        deps.openFile(path, LAUNCH_FILE, 1);
        return;
    }
    if (!made.ok) {
        say(made.error === 'network' ? unreachableAnswer() : refusalSentence(made.error), 'error');
        return;
    }
    const wrote = await deps.saveText(
        place.item.key,
        joinPath(place.path, LAUNCH_FILE),
        LAUNCH_TEXT
    );
    if (!wrote.ok) {
        say(wrote.error, 'error');
        return;
    }
    queries.mark(['debug', path], 'replace');
    const read = await readLaunches(path);
    deps.openFile(path, LAUNCH_FILE, firstLine(read));
    const clean =
        !('error' in read) && read.configurations.length === 1 && read.findings.length === 0;
    if (clean) return;
    say('error' in read ? read.error : (read.findings.at(0)?.message ?? t('debug.refused')));
}
