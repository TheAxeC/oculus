// Layer 4, test helper. The text catalog of the checkout's own config: the sentences a server
// function words its refusals from, passed as its `text`, so a case reads the sentence a reader
// would.

import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';

/** The catalog of the checkout's config/text files. */
export const TEXT: Record<string, string> = textCatalog(loadConfig(engineDir()).config);
