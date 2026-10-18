// Layer 2, client state. The requests the LaTeX store makes of /api/latex that hold no state of
// their own: the root a source file builds through, the files a root depends on, the citations of
// its bibliographies, the formatting of a text, the two directions of SyncTeX and texdoc. Each
// answers its data or the sentence of the server's refusal (state/shared/answers/answers.ts),
// never a thrown error, so a caller shows the reason and goes on.
//
// A GET is read through `fetch` and a POST carries the write token, which is renewed once when the
// server answers 403, as every write of the page is. A GET over a root the workspace no longer
// serves is not made, and answers the sentence saying so.

import { z } from 'zod';
import { readAs, readJson } from '../../../data/shapes/shapes.ts';
import { failedAnswer } from '../../shared/answers/answers.ts';
import { t } from '../../shared/words/text.ts';
import type { WritesStore } from '../../shared/stores/shapes.ts';
import { postWithToken } from '../../shared/stores/token-post.ts';
import {
    citesBodyShape,
    packagesBodyShape,
    dependenciesBodyShape,
    forwardBodyShape,
    formatBodyShape,
    inverseBodyShape,
    rootBodyShape,
    type LatexAnswer,
    type LatexCites,
    type LatexPackages,
    type LatexFormat,
    type LatexRoot,
    type SyncForward,
    type SyncInverse
} from './latex-state.ts';

/** The part of a refusal's body that names it. */
const wordShape = z.object({ error: z.string().catch('') });

/** The files a root depends on with the time each was written, or none when no main is found. */
type Dependencies = { path: string; main: string; files: Map<string, number> } | null;

/** The reads and posts of /api/latex that carry no state. */
export type LatexCalls = {
    /** The main file a source file builds through and the rule that found it. */
    rootOf: (root: string, file: string) => Promise<LatexRoot>;
    /** The main a PDF is the build of, or null when none is. */
    rootOfPdf: (root: string, pdf: string) => Promise<LatexRoot>;
    /** The files the main file `file` builds through depends on, with their modification times. */
    dependencies: (root: string, file: string) => Promise<Dependencies>;
    /** The citations of the bibliographies of the main file `file` builds through. */
    cites: (root: string, file: string) => Promise<LatexCites>;
    /** The packages the documents of the main file `file` builds through load. */
    packages: (root: string, file: string) => Promise<LatexPackages>;
    /** A text formatted by the formatter `latex.formatter` chooses. */
    format: (text: string, file: string) => Promise<LatexFormat>;
    /** The places a line of a source file was typeset at in the PDF of its root. */
    forward: (root: string, file: string, line: number, column: number) => Promise<SyncForward>;
    /** The source line a place on a page of a PDF came from. */
    inverse: (
        root: string,
        pdf: string,
        page: number,
        x: number,
        y: number
    ) => Promise<SyncInverse>;
    /** Open the documentation of a package in this machine's PDF application. */
    texdoc: (name: string) => Promise<LatexAnswer>;
};

/** What a request came to: its body, or the sentence of its refusal with the refusal's word. */
type Answered = { body: unknown } | { reason: string; word?: string };

/** The refusal word of a failed body, or the empty string. */
function wordOf(raw: unknown): string {
    const found = readAs(wordShape, raw);
    return found === null ? '' : found.error;
}

/** What a request's reason reads as when it threw. */
function thrown(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function createCalls(
    writes: WritesStore,
    served: (root: string) => boolean = () => true
): LatexCalls {
    /** The answer of a GET: its body when it succeeded, else the reason it did not. */
    async function get(query: string): Promise<Answered> {
        if (typeof fetch !== 'function') return { reason: '' };
        const root = new URLSearchParams(query).get('root');
        if (root !== null && !served(root)) return { reason: t('latex.unserved', root) };
        try {
            const response = await fetch(`/api/latex?${query}`);
            const raw = await readJson(response);
            if (response.ok) return { body: raw };
            return { reason: failedAnswer(response, raw), word: wordOf(raw) };
        } catch (error) {
            return { reason: thrown(error) };
        }
    }

    /** The answer of a POST of one action with the write token, renewed once on a 403. */
    async function post(body: unknown): Promise<Answered> {
        if (typeof fetch !== 'function') return { reason: '' };
        try {
            const response = await postWithToken('/api/latex', body, writes);
            const raw = await readJson(response);
            if (response.ok) return { body: raw };
            return { reason: failedAnswer(response, raw), word: wordOf(raw) };
        } catch (error) {
            return { reason: thrown(error) };
        }
    }

    /** A body read through its shape, or null when the request failed or the body is no map. */
    function read<T>(shape: z.ZodType<T>, answer: Answered): T | null {
        return 'body' in answer ? readAs(shape, answer.body) : null;
    }

    function rootBody(root: string, answer: Answered): LatexRoot {
        const found = read(rootBodyShape, answer);
        if (found?.main == null) return null;
        return {
            root: found.root === '' ? root : found.root,
            path: found.path,
            main: found.main,
            pdf: found.pdf,
            log: found.log,
            how: found.how
        };
    }

    async function rootOf(root: string, file: string): Promise<LatexRoot> {
        const query = `root=${encodeURIComponent(root)}&file=${encodeURIComponent(file)}`;
        return rootBody(root, await get(query));
    }

    async function rootOfPdf(root: string, pdf: string): Promise<LatexRoot> {
        const query = `root=${encodeURIComponent(root)}&pdf=${encodeURIComponent(pdf)}`;
        return rootBody(root, await get(query));
    }

    async function dependencies(root: string, file: string): Promise<Dependencies> {
        const query = `root=${encodeURIComponent(root)}&file=${encodeURIComponent(file)}&deps=1`;
        const answer = await get(query);
        const found = read(dependenciesBodyShape, answer);
        if (found?.main == null) return null;
        return {
            path: found.path,
            main: found.main,
            files: new Map(found.files.map((one) => [one.path, one.time]))
        };
    }

    async function cites(root: string, file: string): Promise<LatexCites> {
        const query = `root=${encodeURIComponent(root)}&file=${encodeURIComponent(file)}&cites=1`;
        const answer = await get(query);
        const found = read(citesBodyShape, answer);
        if (found === null) {
            return { entries: [], unread: [], error: 'reason' in answer ? answer.reason : '' };
        }
        return { entries: found.entries, unread: found.unread, error: '' };
    }

    async function packages(root: string, file: string): Promise<LatexPackages> {
        const query = `root=${encodeURIComponent(root)}&file=${encodeURIComponent(file)}&packages=1`;
        const answer = await get(query);
        const found = read(packagesBodyShape, answer);
        if (found === null) return { names: [], error: 'reason' in answer ? answer.reason : '' };
        return { names: found.packages, error: '' };
    }

    async function format(text: string, file: string): Promise<LatexFormat> {
        const answer = await post({ action: 'format', text, file });
        const found = read(formatBodyShape, answer);
        if ('reason' in answer) return { text: null, error: answer.reason };
        return { text: found?.text ?? null, error: '' };
    }

    async function forward(
        root: string,
        file: string,
        line: number,
        column: number
    ): Promise<SyncForward> {
        const answer = await post({ action: 'forward', root, file, line, column });
        if ('reason' in answer) {
            return { places: [], error: answer.reason, unbuilt: answer.word === 'synctex-no-file' };
        }
        return { places: read(forwardBodyShape, answer)?.places ?? [], error: '', unbuilt: false };
    }

    async function inverse(
        root: string,
        pdf: string,
        page: number,
        x: number,
        y: number
    ): Promise<SyncInverse> {
        const answer = await post({ action: 'inverse', root, pdf, page, x, y });
        if ('reason' in answer) return { source: null, error: answer.reason };
        const found = read(inverseBodyShape, answer)?.source ?? null;
        if (found === null) return { source: null, error: '' };
        const column = found.column === undefined ? {} : { column: found.column };
        return { source: { file: found.file, line: found.line, ...column }, error: '' };
    }

    async function texdoc(name: string): Promise<LatexAnswer> {
        const answer = await post({ action: 'texdoc', name });
        return 'reason' in answer ? { ok: false, error: answer.reason } : { ok: true, error: '' };
    }

    return { rootOf, rootOfPdf, dependencies, cites, packages, format, forward, inverse, texdoc };
}
