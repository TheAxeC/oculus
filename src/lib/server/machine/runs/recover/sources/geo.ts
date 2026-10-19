// Layer 2, server. The files of a GEO source: the series' supplementary folder listing, an HTML
// index whose rows link each file, the entry's `files` picked from it, and each picked file's exact
// size from a GET of its first byte, since the listing rounds sizes (`113M`). GEO publishes no
// checksum, so each file is checked by its size alone.

import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    getText,
    isRefusal,
    picked,
    sized,
    succeeded,
    type ListAnswer,
    type ListDeps,
    type Listed
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'geo' }>;

const SOURCE = 'geo';

/** A series accession, `GSE` and its digits. */
const ACCESSION = /^GSE(\d+)$/;

/** The supplementary folder of a series: its digits but the last three as the `nnn` folder. */
function geoFolder(accession: string): string | null {
    const found = ACCESSION.exec(accession);
    if (found === null) return null;
    const head = found[1].length > 3 ? found[1].slice(0, -3) : '';
    return `https://ftp.ncbi.nlm.nih.gov/geo/series/GSE${head}nnn/${accession}/suppl/`;
}

/** A row of the index: a link whose text is the name it links. */
const ROW = /<a href="([^"/?#]+)">\1<\/a>/g;

/** The files of the source, or the refusal naming GEO. */
export async function listGeo(source: Source, deps: ListDeps): Promise<ListAnswer> {
    const folder = geoFolder(source.accession);
    if (folder === null) return { refused: 'answer', source: SOURCE };
    const answer = succeeded(await getText(deps, SOURCE, folder), SOURCE);
    if (isRefusal(answer)) return answer;
    if (!answer.text.includes('<title>Index of')) return { refused: 'answer', source: SOURCE };
    const listed: Listed[] = [...answer.text.matchAll(ROW)].map((row) => ({
        name: decodeURIComponent(row[1]),
        size: null,
        checksum: null,
        url: folder + row[1]
    }));
    const chosen = picked(listed, source.files, SOURCE);
    return isRefusal(chosen) ? chosen : sized(deps, SOURCE, chosen);
}
