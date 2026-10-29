// Layer 2, client state. A write posted with the write token whose answer the page tells in one
// sentence: none when it was written, else the route's own sentence of why not, or the sentence
// for an answer the page could not read or for a request that got no answer.

import { z } from 'zod';
import { readAs, readJson } from '../../../data/shapes/shapes.ts';
import { postWithToken, type TokenSource } from '../stores/token-post.ts';
import { unreachableAnswer, unreadableAnswer } from './answers.ts';

/** The part of a write's answer the page reads: the sentence of a refusal, when there is one. */
const refusalShape = z.object({ error: z.string().optional() });

/** Post `body` to `url` with the write token; null when it was written, else why not. */
export async function postForRefusal(
    url: string,
    body: unknown,
    writes: TokenSource
): Promise<string | null> {
    try {
        const response = await postWithToken(url, body, writes);
        const answer = readAs(refusalShape, await readJson(response));
        if (answer === null) return unreadableAnswer(response.status);
        if (!response.ok) return answer.error ?? unreadableAnswer(response.status);
        return null;
    } catch {
        return unreachableAnswer();
    }
}
