// Layer 2, server. What the Markdown server is told of its client: the extensions that make a file
// Markdown, read from the `languages:` key of the merged config, and the settings it reads once
// after `initialized` (it never asks `workspace/configuration`). A link to a file that is not
// there is a warning; a link to a heading or to a reference is not checked, since the server
// would flag every link to a heading of a file the reader has not opened.

import { languageMap } from '../../../../../data/helpers/files/languages.ts';

/** The language the extensions are the endings of. */
const LANGUAGE = 'markdown';

/** The extensions of Markdown files in the merged configuration, without the dot. */
export function markdownExtensions(config: Record<string, unknown>): string[] {
    return [...languageMap(config)]
        .filter(([ending, language]) => language === LANGUAGE && ending.startsWith('.'))
        .map(([ending]) => ending.slice(1));
}

/** The settings, as the one `workspace/didChangeConfiguration` that carries them. */
export const MARKDOWN_SETTINGS = {
    markdown: {
        validate: {
            enabled: true,
            referenceLinks: { enabled: 'ignore' },
            fragmentLinks: { enabled: 'ignore' },
            fileLinks: { enabled: 'warning', markdownFragmentLinks: 'ignore' },
            ignoredLinks: [],
            unusedLinkDefinitions: { enabled: 'ignore' },
            duplicateLinkDefinitions: { enabled: 'ignore' }
        },
        suggest: { paths: { enabled: true } },
        occurrencesHighlight: { enabled: false },
        preferredMdPathExtensionStyle: 'auto'
    }
};
