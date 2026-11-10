// Layer 2, server. The formatting options the TypeScript server asks for a document in
// (`workspace/configuration`, section `formattingOptions`): the indentation the editor's options
// give the document's language in its root, taken in the order a tab takes it when the tab has no
// choice of its own and the file no indentation of its own (data/helpers/editor/editor.ts
// `resolveEditor`): the record of the root's `.oculus/settings.yml`, `editor.languages`, the acting
// apps' defaults, then `editor.tab_size` and `editor.insert_spaces`. The server keeps the answer
// for a document for as long as it runs, so the relay starts it again when an answer it was given
// would now differ (held/requests/configuration.ts `settingsChange`): after a build of the merged
// configuration, a write in a root's own `.oculus/settings.yml` and a read of the apps.

import { resolveEditor } from '../../../../../data/helpers/editor/editor.ts';
import {
    appDefaults,
    type DefaultsRow
} from '../../../../../data/helpers/files/apps/tools/editor-defaults.ts';
import {
    editorOptions,
    parseRepoSettings
} from '../../../../../data/sources/config/editor-options.ts';
import { settingsText } from '../../../../files/fs.ts';
import type { Formatting } from '../entry.ts';

/** The key the one root is named by when its settings file is resolved. */
const ROOT = 'root';

/**
 * The indentation of a language's documents in the root at `root`, a real path, under the merged
 * configuration and the apps' rows; a language of null takes no record. Null when the
 * configuration holds no catalog.
 */
function formattingOptions(
    config: Record<string, unknown>,
    rows: readonly DefaultsRow[],
    language: string | null,
    root: string
): Formatting | null {
    const options = editorOptions(config);
    if (options === null) return null;
    const text = settingsText([{ key: ROOT, dir: root }], ROOT);
    const repo = text === null ? null : parseRepoSettings(text, config);
    const { indent } = resolveEditor({
        language: language ?? '',
        options: { ...options, defaults: appDefaults(rows) },
        root: repo?.kind === 'read' ? repo.languages : null,
        detected: null,
        tab: { indent: null, wrap: null }
    });
    return { tabSize: indent.size, insertSpaces: !indent.tabs };
}

/**
 * The relay's `indent` option: `formattingOptions` over the merged configuration the config cache
 * holds and the apps as they are held, both read at each ask.
 */
export function heldIndent(
    cache: { quiet: () => { config: Record<string, unknown> } },
    apps: () => readonly { row: DefaultsRow }[]
): (language: string | null, root: string) => Formatting | null {
    return (language, root) =>
        formattingOptions(
            cache.quiet().config,
            apps().map((one) => one.row),
            language,
            root
        );
}
