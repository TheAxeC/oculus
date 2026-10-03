// Layer 2, client state. What the views read out of the bodies of the git endpoints they fetch: the
// branches the Changes tab lists, a commit's files, a diff, a page of the graph, the three sides of
// a conflict and the gutter's marks and blame. The views keep the `fetch` and its failure; each
// function here takes the status and the body `readJson` (data/shapes/shapes.ts) read, and answers
// what the view draws, so a body that is no JSON, a field of the wrong type or an item a list
// should not hold never reaches a view as the type the model declares for it.
//
// A list is read item by item: the list itself when every item passes, a new list of the items
// that pass otherwise. An item that passes is answered as it came. An `error` that is not text is
// the view's own failure sentence. They sit apart from repositories.ts, which builds the addresses
// of these reads, because the shapes here are held to the data model's types and nothing there
// reads a body.
//
// A diff pane's read is the one that is not always a GET of an address: the Replace Preview is a
// POST of the preview operation with the write token, since the hits it names have no limit and an
// address does. `diffRequest` says which request a pane's subject is read with, and `diffReader`
// keeps the answer of the newest read of a pane and none once the pane is closed.

import { z } from 'zod';
import { OPS_PATH, previewRequest } from '../../../data/file-ops.ts';
import type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitBranch,
    GitCommitFile,
    GitGraphCommit,
    GitGraphPage,
    GitLineMark,
    GitMergeSides
} from '../../../data/model/index.ts';
import {
    anyValueShape,
    optionalTextShape,
    readAs,
    readOr,
    survivorsShape,
    unchanged
} from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { diffUrl, type DiffState, type DiffSubject } from './repositories.ts';

/** One branch row, as the server sent it. */
const branchShape = unchanged(
    z.object({ name: z.string(), upstream: z.string(), current: z.boolean() })
) satisfies z.ZodType<GitBranch>;

/** One path a commit changed, as the server sent it. */
const commitFileShape = unchanged(
    z.object({ status: z.string(), path: z.string(), from: z.string() })
) satisfies z.ZodType<GitCommitFile>;

/** One file of a diff with its two whole texts, as the server sent it. */
const diffSidesShape = unchanged(
    z.object({
        oldPath: z.string(),
        newPath: z.string(),
        head: z.array(z.string()),
        binary: z.boolean(),
        encoded: z.boolean(),
        original: z.string(),
        modified: z.string()
    })
) satisfies z.ZodType<DiffSides>;

/** What git says of converting a file's text, as the server sent it. */
const diffAttributesShape = unchanged(
    z.object({
        filter: z.string(),
        text: z.string(),
        eol: z.string(),
        workingTreeEncoding: z.string(),
        ident: z.string(),
        autocrlf: z.string()
    })
) satisfies z.ZodType<DiffAttributes>;

/** One commit of the graph, as the server sent it. */
const graphCommitShape = unchanged(
    z.object({
        hash: z.string(),
        short: z.string(),
        subject: z.string(),
        when: z.string(),
        parents: z.array(z.string()),
        author: z.string(),
        refs: z.array(z.string()),
        tags: z.array(z.string()),
        head: z.boolean(),
        message: z.string()
    })
) satisfies z.ZodType<GitGraphCommit>;

/**
 * One page of the graph: its commits, the commits either side of the upstream, and the rest. A page
 * whose every commit passes is answered as it came; a page with a commit that fails is answered as
 * a new page of the commits that pass.
 */
const graphPageShape = z.union([
    unchanged(
        z.object({
            commits: z.array(graphCommitShape),
            more: z.boolean(),
            incoming: z.array(graphCommitShape),
            outgoing: z.array(graphCommitShape),
            base: z.string().optional()
        })
    ),
    z.object({
        commits: survivorsShape(graphCommitShape),
        more: z.boolean(),
        incoming: survivorsShape(graphCommitShape),
        outgoing: survivorsShape(graphCommitShape),
        base: z.string().optional()
    })
]) satisfies z.ZodType<GitGraphPage>;

/** The three versions of a conflicted path and which side deleted it, as the server sent them. */
const mergeSidesShape = unchanged(
    z.object({
        base: z.string(),
        ours: z.string(),
        theirs: z.string(),
        deleted: z.enum(['', 'ours', 'theirs', 'both'])
    })
) satisfies z.ZodType<GitMergeSides>;

/** One change the gutter marks, as the server sent it. */
const lineMarkShape = unchanged(
    z.object({
        kind: z.enum(['added', 'modified', 'deleted']),
        line: z.number(),
        count: z.number()
    })
) satisfies z.ZodType<GitLineMark>;

/** One line of a blame, as the server sent it. */
const blameLineShape = unchanged(
    z.object({
        line: z.number(),
        hash: z.string(),
        short: z.string(),
        author: z.string(),
        when: z.string(),
        subject: z.string(),
        uncommitted: z.boolean()
    })
) satisfies z.ZodType<GitBlameLine>;

/** The branches an answer lists, and none when the field is no list. */
const branchesBodyShape = z.object({ branches: survivorsShape(branchShape).catch(() => []) });

/** The files an answer lists, and the reason it gives when it refused. */
const commitFilesBodyShape = z.object({
    files: survivorsShape(commitFileShape).catch(() => []),
    error: optionalTextShape
});

/** The refs an answer lists, by name. */
const refsBodyShape = z.object({
    refs: z.array(z.object({ name: z.string() })).catch(() => [])
});

/** The parts of a file's diff, each as the shape holds it or absent. */
const diffBodyShape = z.object({
    files: survivorsShape(diffSidesShape).nullable().catch(null),
    attributes: diffAttributesShape.nullable().catch(null),
    conflicted: z.boolean().catch(false),
    error: optionalTextShape
});

/** The page an answer carries, kept whole until `graphPageShape` reads it, and the reason. */
const graphBodyShape = z.object({ page: anyValueShape, error: optionalTextShape });

/** The sides an answer carries, kept whole until `mergeSidesShape` reads it, and the reason. */
const mergeBodyShape = z.object({ sides: anyValueShape, error: optionalTextShape });

/** The marks an answer lists. */
const marksBodyShape = z.object({ marks: survivorsShape(lineMarkShape).catch(() => []) });

/** The blame lines an answer lists. */
const linesBodyShape = z.object({ lines: survivorsShape(blameLineShape).catch(() => []) });

/** Whether a body was read: `readJson` answers undefined for a body that is no JSON or is null. */
function wasRead(body: unknown): boolean {
    return body !== undefined;
}

/** The branches an answer lists; a branch row that is malformed is left out. */
export function branchesOf(body: unknown): GitBranch[] {
    return readAs(branchesBodyShape, body)?.branches ?? [];
}

/**
 * The files a commit's answer lists, and the sentence it failed with, or the empty string when it
 * did not. The files are null when the body was not read, which leaves the view the files it holds.
 */
export function commitFilesOf(
    ok: boolean,
    body: unknown
): { files: GitCommitFile[] | null; failure: string } {
    const failed = t('repositories.graph_failed');
    if (!wasRead(body)) return { files: null, failure: failed };
    const held = readOr(commitFilesBodyShape, body, { files: [], error: undefined });
    return { files: held.files, failure: ok ? '' : (held.error ?? failed) };
}

/** What a diff read answered: whether the server took it and the parts of its body. */
export type DiffAnswer = {
    ok: boolean;
    /** The files of the diff, or null when the body holds no list of them. */
    files: DiffSides[] | null;
    attributes: DiffAttributes | null;
    /** Whether the path of a file's own diff is in conflict. */
    conflicted: boolean;
    /** The reason the server gave, when it gave one as text. */
    error: string | undefined;
};

/** The answer of a diff read. A body that was not read is a refusal that gave no reason. */
export function diffAnswerOf(ok: boolean, body: unknown): DiffAnswer {
    const held = readOr(diffBodyShape, body, {
        files: null,
        attributes: null,
        conflicted: false,
        error: undefined
    });
    return {
        ok: ok && wasRead(body),
        files: held.files,
        attributes: held.attributes,
        conflicted: held.conflicted,
        error: held.error
    };
}

/** One request of a diff read: the address and, for a POST, how it is made. */
export type DiffRequest = {
    url: string;
    init?: { method: 'POST'; headers: Record<string, string>; body: string };
};

/** The request that reads one diff pane's subject; `token` is the page's write token. */
export function diffRequest(state: DiffSubject, token: string): DiffRequest {
    const { replace } = state;
    if (replace === undefined || state.against !== undefined || (state.save ?? '') !== '') {
        return { url: diffUrl(state) };
    }
    return {
        url: OPS_PATH,
        init: {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': token },
            body: JSON.stringify(previewRequest(state, replace))
        }
    };
}

/** What a pane does with the answer of a read it took, or with a read that threw. */
type DiffDraw = { answered: (read: DiffAnswer) => void; failed: () => void };

/** The reads of one pane, whose newest answer is the one drawn. */
type DiffReader = {
    /** Read a subject and draw its answer; true when this read was the one drawn. */
    load: (state: DiffState, draw: DiffDraw) => Promise<boolean>;
    /** The pane is closed: no read in flight is drawn. */
    close: () => void;
};

/**
 * A reader over `read`, which answers one subject; `nextRead` hands out each read's check, which
 * says whether that read is still the newest (diff/compare.ts's `latestRead`).
 */
export function diffReader(
    read: (state: DiffState) => Promise<DiffAnswer>,
    nextRead: () => () => boolean
): DiffReader {
    let closed = false;
    return {
        async load(state, draw) {
            const current = nextRead();
            try {
                const answer = await read(state);
                if (!current() || closed) return false;
                draw.answered(answer);
            } catch {
                if (!current() || closed) return false;
                draw.failed();
            }
            return true;
        },
        close() {
            closed = true;
        }
    };
}

/** The page of the graph an answer carries, or the sentence it failed with. */
export function graphPageOf(
    ok: boolean,
    body: unknown
): { page: GitGraphPage | null; failure: string } {
    const failed = t('repositories.graph_failed');
    if (!wasRead(body)) return { page: null, failure: failed };
    const held = readOr(graphBodyShape, body, { page: undefined, error: undefined });
    if (!ok || held.page === undefined) return { page: null, failure: held.error ?? failed };
    const page = readAs(graphPageShape, held.page);
    return page === null ? { page: null, failure: failed } : { page, failure: '' };
}

/** The names of the refs an answer lists, or null when it was refused or not read. */
export function refNamesOf(ok: boolean, body: unknown): string[] | null {
    if (!ok || !wasRead(body)) return null;
    return readOr(refsBodyShape, body, { refs: [] }).refs.map((one) => one.name);
}

/** The three sides of a conflict an answer carries, or the sentence it failed with. */
export function mergeSidesOf(
    ok: boolean,
    body: unknown
): { sides: GitMergeSides | null; failure: string } {
    const failed = t('repositories.merge_failed');
    if (!wasRead(body)) return { sides: null, failure: failed };
    const held = readOr(mergeBodyShape, body, { sides: undefined, error: undefined });
    if (!ok || held.sides === undefined) return { sides: null, failure: held.error ?? failed };
    const sides = readAs(mergeSidesShape, held.sides);
    return sides === null ? { sides: null, failure: failed } : { sides, failure: '' };
}

/** The marks the gutter's answer lists, and none for an answer the server refused. */
export function listOf(ok: boolean, body: unknown, key: 'marks'): GitLineMark[];
/** The blame lines the gutter's answer lists, and none for an answer the server refused. */
export function listOf(ok: boolean, body: unknown, key: 'lines'): GitBlameLine[];
export function listOf(
    ok: boolean,
    body: unknown,
    key: 'marks' | 'lines'
): GitLineMark[] | GitBlameLine[] {
    if (!ok) return [];
    if (key === 'marks') return readAs(marksBodyShape, body)?.marks ?? [];
    return readAs(linesBodyShape, body)?.lines ?? [];
}
