// Layer 1, data. The one rule that reads a glob in oculus: the Problems view's filter matches a
// term with it against a file's path, and the writing rules' skip and glyph lists match a file's
// path from its root with it. It is a pure helper with no I/O, so the page and the server read a
// glob the same way.

import picomatch from 'picomatch';

/**
 * A path test for a glob: the glob's, or equality with its text when it cannot be read. A glob
 * without a slash is tested on the file's name as well, since picomatch's `basename` option tests
 * only the name and would stop a glob with a slash from matching.
 */
export function globTest(glob: string): (path: string) => boolean {
    try {
        return picomatch(glob, { dot: true, basename: !glob.includes('/') });
    } catch {
        return (path) => path === glob;
    }
}
