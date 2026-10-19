// Layer 2, server. The files of a TCIA source: the collection's series from the NBIA API, the
// entry's `series` (instance UIDs) picked when it names any, each series one zip the API builds as
// it sends it. The zip's size and checksum are not known before it is sent, so a series reads
// present once its zip is on the disk.

import { z } from 'zod';
import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    getJson,
    isRefusal,
    picked,
    type ListAnswer,
    type ListDeps,
    type Listed
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'tcia' }>;

const SOURCE = 'tcia';

const API = 'https://services.cancerimagingarchive.net/nbia-api/services/v1';

/** A series instance UID: digits and dots. */
const UID = /^\d+(\.\d+)+$/;

const seriesShape = z.array(z.object({ SeriesInstanceUID: z.string().regex(UID) }));

/** The files of the source, or the refusal naming TCIA. */
export async function listTcia(source: Source, deps: ListDeps): Promise<ListAnswer> {
    const url = `${API}/getSeries?Collection=${encodeURIComponent(source.collection)}&format=json`;
    const read = await getJson(deps, SOURCE, url);
    if (isRefusal(read)) return read;
    const series = seriesShape.safeParse(read.body);
    if (!series.success) return { refused: 'answer', source: SOURCE };
    const byUid: Listed[] = series.data.map((one) => ({
        name: one.SeriesInstanceUID,
        size: null,
        checksum: null,
        url: `${API}/getImage?SeriesInstanceUID=${one.SeriesInstanceUID}`
    }));
    const chosen = picked(byUid, source.series, SOURCE);
    if (isRefusal(chosen)) return chosen;
    return chosen.map((one) => ({ ...one, name: `${one.name}.zip` }));
}
