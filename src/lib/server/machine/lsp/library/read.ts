// Layer 2, server. The read of one library file for the page that was given its token. The page's
// `{ oculus: 'read', root, uri }` is answered with `{ oculus: 'file', root, uri, text }`, or with a
// `code` when the file may not be read; nothing is read until every check has passed, and the read
// is of the real path stored with the token and of nothing the message names.
//
// The checks, in order: the token is one this page was given, for this root and this channel's
// language (`unknown`); the root is still served (`not_served`); the stored path still resolves
// to a regular file (`not_file`) and to the same real path, since a folder of the stored path
// replaced by a link would otherwise read another file (`moved`); the file is not over the limit a
// source tab reads (`too_large`) and is text (`binary`). The stored path is the real path the
// server's name resolved to when the token was minted, so a link the server named and that is
// pointed elsewhere afterwards still reads the file it named then.

import { readFile, stat } from 'node:fs/promises';
import type { LspReadRefusal, LspToPage, LspToServer } from '../../../../data/model/index.ts';
import { TEXT_LIMIT } from '../../../../data/file-ops.ts';
import { isBinaryFile } from '../../../files/source/source.ts';
import { realPath } from '../../../core/paths.ts';
import { normal } from '../uris.ts';
import type { Library } from './tokens.ts';

type Read = Extract<LspToServer, { oculus: 'read' }>;
type File = Extract<LspToPage, { oculus: 'file' }>;

/** What a read needs of the page and the machine. */
export type ReadOf = {
    library: Library;
    /** The language of the channel the message came on. */
    language: string;
    /** Whether a root key names a root that is served now. */
    served: (root: string) => boolean;
};

/** The answer of a read: the file's text, or the code of the refusal. */
export async function readLibrary(message: Read, of: ReadOf): Promise<File> {
    const refuse = (code: LspReadRefusal): File => ({
        oculus: 'file',
        root: message.root,
        uri: message.uri,
        code
    });
    const token = of.library.get(message.uri);
    if (token === undefined) return refuse('unknown');
    if (token.root !== message.root || token.language !== of.language) return refuse('unknown');
    if (!of.served(token.root)) return refuse('not_served');
    const real = realPath(token.real, true);
    if (real === null) return refuse('not_file');
    if (normal(real) !== normal(token.real)) return refuse('moved');
    try {
        const found = await stat(real);
        if (!found.isFile()) return refuse('not_file');
        if (found.size > TEXT_LIMIT) return refuse('too_large');
        if (isBinaryFile(real)) return refuse('binary');
        const bytes = await readFile(real);
        if (bytes.length > TEXT_LIMIT) return refuse('too_large');
        return {
            oculus: 'file',
            root: message.root,
            uri: message.uri,
            text: bytes.toString('utf8')
        };
    } catch {
        return refuse('not_file');
    }
}
