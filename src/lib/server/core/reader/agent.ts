// Layer 2, server. The User-Agent every request of the reader goes out with: oculus and the
// version of the app, read from its package manifest, so a service sees which program asks and
// the text holds no address.

import manifest from '../../../../../package.json';

/** `oculus/<version>`. */
export const READER_AGENT = `oculus/${manifest.version}`;
