// Layer 2, server. The files of a PhysioNet source: the project's `SHA256SUMS.txt`, one line per
// file with its sha256, and each file's size from a GET of its first byte. A credentialed project
// answers 403 to a request without the `downloads` row's user and password, which is the refusal
// `access`, never an empty list. An `archive: true` source is the project's one zip, whose address
// PhysioNet redirects from `get-zip` to the file under its own name; that zip is checked by its
// size alone, since `SHA256SUMS.txt` does not list it.

import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    authHeader,
    getText,
    isRefusal,
    picked,
    sizeAt,
    sized,
    succeeded,
    type ListAnswer,
    type ListDeps,
    type Listed
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'physionet' }>;

const SOURCE = 'physionet';

/** The address of a project's files at a version. */
export function physionetBase(project: string, version: string): string {
    return `https://physionet.org/files/${encodeURIComponent(project)}/${encodeURIComponent(version)}/`;
}

/** A line of `SHA256SUMS.txt`: 64 hexadecimal digits, a space and the path. */
const SUM_LINE = /^([0-9a-f]{64}) +\*?(.+)$/;

/** The files of a `SHA256SUMS.txt`, or null when a line that is not blank reads as no file. */
function sumsOf(text: string): { name: string; sha256: string }[] | null {
    const files: { name: string; sha256: string }[] = [];
    for (const line of text.split('\n')) {
        if (line.trim() === '') continue;
        const found = SUM_LINE.exec(line.trimEnd());
        if (found === null) return null;
        files.push({ name: found[2], sha256: found[1] });
    }
    return files.length === 0 ? null : files;
}

/** The address of a file of the project, each part of its path encoded. */
function fileUrl(base: string, name: string): string {
    return base + name.split('/').map(encodeURIComponent).join('/');
}

/** The files of the source, or the refusal naming PhysioNet. */
export async function listPhysionet(source: Source, deps: ListDeps): Promise<ListAnswer> {
    const headers = authHeader(SOURCE, deps.downloads);
    const service = headers.authorization === undefined ? {} : ({ service: SOURCE } as const);
    if (source.archive === true) {
        const zip = `https://physionet.org/content/${encodeURIComponent(source.project)}/get-zip/${encodeURIComponent(source.version)}/`;
        const probe = await sizeAt(deps, SOURCE, zip, headers);
        if (isRefusal(probe)) return probe;
        const name = decodeURIComponent(new URL(probe.url).pathname.split('/').pop() ?? '');
        if (!name.endsWith('.zip')) return { refused: 'answer', source: SOURCE };
        return [{ name, size: probe.size, checksum: null, url: probe.url, ...service }];
    }
    const base = physionetBase(source.project, source.version);
    const answer = succeeded(await getText(deps, SOURCE, `${base}SHA256SUMS.txt`, headers), SOURCE);
    if (isRefusal(answer)) return answer;
    const sums = sumsOf(answer.text);
    if (sums === null) return { refused: 'answer', source: SOURCE };
    const listed: Listed[] = sums.map((one) => ({
        name: one.name,
        size: null,
        checksum: { kind: 'sha256', value: one.sha256 },
        url: fileUrl(base, one.name),
        ...service
    }));
    const chosen = picked(listed, source.files, SOURCE);
    return isRefusal(chosen) ? chosen : sized(deps, SOURCE, chosen, headers);
}
