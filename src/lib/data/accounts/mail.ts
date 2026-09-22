// Layer 1, data. The mail connector's pure rules: how an account is named, which subjects say a
// thread is part of a chain, and how old a thread is.
//
// The subject test is one of the plate's three drops and is here rather than in the poller because
// both provider readers apply it and a test reaches it without a fetcher. The age is measured here
// and worded by the view, so the payload carries the moment the provider gave and the page draws
// how long ago that was; a payload that carried the words would age on screen without a publish.

import { connectKey } from './connect.ts';
import type { MailAccountConfig } from '../model/model-mail.ts';

/** How a mail account is named in its credential file, on the wire and in a thread's id. */
export function mailKey(account: MailAccountConfig): string {
    return connectKey(account);
}

/**
 * A subject that says the thread is an answer or a forward rather than something newly arrived.
 * The four prefixes the plate rule names are `Re:`, `RE:`, `Fwd:` and `FW:`, which is every casing
 * of the two words, so the test is case-insensitive over both and allows the space a client puts
 * before the colon.
 */
const CHAIN_SUBJECT = /^\s*(?:re|fwd|fw)\s*:/i;

/** Whether a subject marks the thread as a reply or a forward. */
export function isChainSubject(subject: string): boolean {
    return CHAIN_SUBJECT.test(subject);
}

/** How old a thread is, as a whole number and the unit it is counted in. */
export type Age = { value: number; unit: 'd' | 'h' | 'm' };

/**
 * The age of a thread at one moment: whole days once it is a day old, whole hours once it is an
 * hour old, and whole minutes below that. A received time that cannot be read, or one in the
 * future, is nothing, so a bad row draws no age rather than a negative one.
 */
export function ageOf(received: string, now: number): Age | null {
    const at = Date.parse(received);
    if (!Number.isFinite(at)) return null;
    const minutes = Math.floor((now - at) / 60000);
    if (minutes < 0) return null;
    if (minutes >= 1440) return { value: Math.floor(minutes / 1440), unit: 'd' };
    if (minutes >= 60) return { value: Math.floor(minutes / 60), unit: 'h' };
    return { value: minutes, unit: 'm' };
}
