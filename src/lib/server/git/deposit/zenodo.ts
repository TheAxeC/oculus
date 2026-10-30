// Layer 2, server. The two Zenodo actions of the Deposit view, For review and Publish, each a press
// behind the write token and the confirm dialog (deposit-routes.ts).
//
// For review sends the anonymised review copy of `code/` (zenodo-copy.ts) as one record whose
// metadata is public and whose files are open only through a share link: one organizational
// creator "Anonymous", the title and description with the terms replaced. With no
// `code_availability.doi` it makes a new record; with a `doi` under `zenodo_status: review-anon`
// it makes a new version of that record, keeping the DOI, and a share link when `review_link` is
// empty; under `zenodo_status: deposited` it is refused, naming the published DOI. A DOI with no
// Zenodo status goes on as under `review-anon` when the record's latest version is the review copy
// (`isReviewCopy`), and is refused before any draft exists when it is not. Publish sends the real
// files and authors (zenodo-meta.ts), public: a new version of the latest version of the concept
// the `doi` names, or a new record when there is none.
//
// `deposit.zenodo` is read from the settings of the project's own hub, the token from the machine's
// `downloads` rows. The concept DOI is read from the record (`GET /api/records/{id}`, its
// `conceptdoi`) and written the moment that answer arrives, with `zenodo_status` and `zenodo_date`;
// a new version keeps the `doi` it was made under, so no read stands between its publish and that
// write. The share link, built from the address, the record id and the link's token, is written
// after it as `review_link`. Neither action writes `status`, `date` or `url`, which are the GitHub
// repository's. A failure before the publish deletes the draft, with no run signal so a Cancel
// still deletes it, and names the call and Zenodo's status. The publish and every call after it
// run with no run signal too, since a Cancel cannot take a publish back: a publish that fails or
// gets no answer reads the draft first (`settled`), and a read after a new record's publish that
// fails writes nothing and names the record's page.

import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { zenodoSettings } from '../../../data/sources/config/settings/files.ts';
import { recordWrite, writeManifest } from '../../edit/writes.ts';
import { words } from '../../core/words.ts';
import { depositFor, done, failed, today, type Deposit, type DepositOptions } from './deposit.ts';
import type { Outcome } from './deposit-git.ts';
import { zenodoAccess, zenodoClient, type Answer, type ZenodoClient } from './zenodo-api.ts';
import { anonymised, replaceTerms, stagedFiles, termsOf, zipOf } from './zenodo-copy.ts';
import { creditsOf, type Creator, type FundingRow } from './zenodo-meta.ts';

/** The form of a Zenodo concept DOI, whose number is the concept's record id. */
const ZENODO_DOI = /^10\.5281\/zenodo\.(\d+)$/i;

/** The name of the creator a review copy names in place of its authors. */
const ANONYMOUS_NAME = 'Anonymous';

/** The creator a review copy names in place of its authors. */
const ANONYMOUS: Creator = { person_or_org: { type: 'organizational', name: ANONYMOUS_NAME } };

/** The two presses. */
type Kind = 'review' | 'publish';

/** An answer that is not a success. */
type Refused = Exclude<Answer, { ok: true }>;

/** What a press sends: the zip and its name, and the record's access and metadata. */
type Sending = {
    zip: Uint8Array;
    file: string;
    access: { record: 'public'; files: 'restricted' | 'public' };
    metadata: Record<string, unknown>;
};

/** For review: the anonymised copy as a record whose files open by a share link. */
export function zenodoReview(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    return press('review', id, text, options);
}

/** Publish: the real files and authors, public. */
export function zenodoPublish(
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    return press('publish', id, text, options);
}

/**
 * One press: every refusal that needs no request first (the token, the Zenodo state, the DOI, the
 * terms or the credits, the files), then the requests.
 */
async function press(
    kind: Kind,
    id: string,
    text: Record<string, string>,
    options: DepositOptions
): Promise<Outcome> {
    const deposit = depositFor(id, options, text);
    if (deposit === null) return failed(words(text, 'server.deposit.no_project', id));
    const settings = zenodoSettings(deposit.home.into.config.merged);
    const access = zenodoAccess(settings, options.downloads?.() ?? []);
    if ('missing' in access) return failed(words(text, 'server.zenodo.no_token', access.missing));
    const code = isMap(deposit.manifest.code_availability)
        ? deposit.manifest.code_availability
        : {};
    const doi = scalar(code.doi).trim();
    const state = scalar(code.zenodo_status).trim();
    if (kind === 'review' && state === 'deposited') {
        return failed(words(text, 'server.zenodo.deposited', doi));
    }
    const concept = doi === '' ? null : ZENODO_DOI.exec(doi)?.[1];
    if (concept === undefined) return failed(words(text, 'server.zenodo.doi_form', doi));
    const sending = await sendingOf(kind, deposit, code, text);
    if ('ok' in sending) return sending;
    const client = zenodoClient(settings, access.headers, options.fetch ?? fetch, options.signal);
    const linked =
        kind === 'review' && (concept === null || scalar(code.review_link).trim() === '');
    const unmarked = kind === 'review' && concept !== null && state !== 'review-anon';
    return send(client, { kind, deposit, doi, concept, linked, unmarked, sending }, text);
}

/** What a press sends, or the refusal of its terms, its credits or its files. */
async function sendingOf(
    kind: Kind,
    deposit: Deposit,
    code: Record<string, unknown>,
    text: Record<string, string>
): Promise<Sending | Outcome> {
    const terms = kind === 'review' ? termsOf(code.anonymize, text) : [];
    if ('refused' in terms) return terms.refused;
    let creators: Creator[] = [ANONYMOUS];
    let funding: FundingRow[] = [];
    if (kind === 'publish') {
        const credits = creditsOf(deposit.manifest, deposit.home.into, text);
        if ('error' in credits) return failed(credits.error);
        ({ creators, funding } = credits);
    }
    const staged = await stagedFiles(deposit.code, deposit.where, text);
    if ('refused' in staged) return staged.refused;
    const files = kind === 'review' ? anonymised(staged, terms, text) : staged;
    if ('refused' in files) return files.refused;
    const title = replaceTerms(scalar(deposit.manifest.title).trim(), terms);
    const description = replaceTerms(scalar(code.description).trim(), terms);
    return {
        zip: zipOf(files),
        file: `${replaceTerms(deposit.repo, terms)}.zip`,
        access: { record: 'public', files: kind === 'review' ? 'restricted' : 'public' },
        metadata: {
            resource_type: { id: 'software' },
            title,
            ...(description === '' ? {} : { description }),
            publication_date: today(),
            creators,
            ...(funding.length === 0 ? {} : { funding })
        }
    };
}

/** One press's requests and what it knows going in. */
type Plan = {
    kind: Kind;
    deposit: Deposit;
    /** The manifest's concept DOI, or the empty text for a new record. */
    doi: string;
    /** The concept's record id the DOI names, or null for a new record. */
    concept: string | null;
    /** Whether the press makes a share link. */
    linked: boolean;
    /** Whether a For review press names a DOI with no Zenodo status. */
    unmarked: boolean;
    sending: Sending;
};

/** Why a call before the publish failed, said for a press that holds a draft or none. */
function failure(
    text: Record<string, string>,
    answer: Refused,
    call: string,
    held: 'draft' | 'none'
): Outcome {
    if ('cancelled' in answer) {
        if (held === 'draft') return failed(words(text, 'server.zenodo.cancelled_draft', call));
        return failed(words(text, 'server.zenodo.cancelled_none', call));
    }
    if ('unanswered' in answer) {
        if (held === 'draft') return failed(words(text, 'server.zenodo.unanswered_draft', call));
        return failed(words(text, 'server.zenodo.unanswered_none', call));
    }
    if (held === 'draft') {
        return failed(words(text, 'server.zenodo.failed_draft', call, answer.status));
    }
    return failed(words(text, 'server.zenodo.failed_none', call, answer.status));
}

/** The text of a field of an answer's body, or the empty text. */
function textOf(body: unknown, name: string): string {
    return isMap(body) ? scalar(body[name]).trim() : '';
}

/**
 * Whether a record read is the review copy: its creators are `Anonymous` alone and its files are
 * restricted, as a record read gives them (`metadata.creators` by name, `metadata.access_right`).
 */
function isReviewCopy(body: unknown): boolean {
    const metadata = isMap(body) && isMap(body.metadata) ? body.metadata : {};
    const creators: unknown[] = Array.isArray(metadata.creators) ? metadata.creators : [];
    const only = creators.length === 1 ? creators[0] : null;
    return (
        isMap(only) &&
        scalar(only.name) === ANONYMOUS_NAME &&
        metadata.access_right === 'restricted'
    );
}

/** The page of a record on the site. */
function pageOf(client: ZenodoClient, draft: string): string {
    return `${client.site}/records/${draft}`;
}

/**
 * The requests: the draft (a new record, or a new version of the latest version of the concept
 * with this press's access and metadata), the zip, the publish, the record read for its concept
 * DOI and the manifest written, then the share link when the press makes one.
 */
async function send(
    client: ZenodoClient,
    plan: Plan,
    text: Record<string, string>
): Promise<Outcome> {
    const { sending } = plan;
    const body = { access: sending.access, files: { enabled: true }, metadata: sending.metadata };
    let draft: string;
    if (plan.concept === null) {
        const made = await client.call('POST', '/records', body);
        if (!made.ok) return failure(text, made, words(text, 'server.zenodo.call_create'), 'none');
        draft = textOf(made.body, 'id');
    } else {
        const opened = await versionOf(client, plan, text);
        if ('ok' in opened) return opened;
        draft = opened.draft;
        const put = await client.call('PUT', `/records/${draft}/draft`, body);
        if (!put.ok) {
            return dropped(client, draft, put, words(text, 'server.zenodo.call_metadata'), text);
        }
    }
    const sent = await upload(client, draft, sending, text);
    if (sent !== null) return sent;
    const publishing = `/records/${draft}/draft/actions/publish`;
    const published = await client.call('POST', publishing, undefined, null);
    if (!published.ok) return settled(client, plan, draft, published, text);
    return recorded(client, plan, draft, text);
}

/**
 * The new version's draft: the record the DOI names read and its `conceptdoi` checked against the
 * DOI, the latest version of that concept, which a DOI with no Zenodo status must find to be the
 * review copy, and a new version of it, which holds no files.
 */
async function versionOf(
    client: ZenodoClient,
    plan: Plan,
    text: Record<string, string>
): Promise<{ draft: string } | Outcome> {
    const concept = plan.concept ?? '';
    const read = await client.record(concept);
    if (!read.ok) {
        return failure(text, read, words(text, 'server.zenodo.call_read', concept), 'none');
    }
    const named = textOf(read.body, 'conceptdoi');
    if (named === '') return failed(words(text, 'server.zenodo.doi_no_concept', plan.doi));
    if (named.toLowerCase() !== plan.doi.toLowerCase()) {
        return failed(words(text, 'server.zenodo.doi_not_concept', plan.doi, named));
    }
    const record = textOf(read.body, 'id');
    const latest = await client.latest(record);
    if (!latest.ok) {
        return failure(text, latest, words(text, 'server.zenodo.call_latest', plan.doi), 'none');
    }
    if (plan.unmarked && !isReviewCopy(latest.body)) {
        return failed(words(text, 'server.zenodo.doi_published', plan.doi));
    }
    const newest = textOf(latest.body, 'id');
    const version = await client.call('POST', `/records/${newest}/versions`);
    if (!version.ok) {
        return failure(text, version, words(text, 'server.zenodo.call_version', newest), 'none');
    }
    return { draft: textOf(version.body, 'id') };
}

/** The zip into the draft: its file entry, its content and its commit; null when all three held. */
async function upload(
    client: ZenodoClient,
    draft: string,
    sending: Sending,
    text: Record<string, string>
): Promise<Outcome | null> {
    const key = encodeURIComponent(sending.file);
    const steps: [string, () => Promise<Answer>][] = [
        [
            words(text, 'server.zenodo.call_file', sending.file),
            () => client.call('POST', `/records/${draft}/draft/files`, [{ key: sending.file }])
        ],
        [
            words(text, 'server.zenodo.call_upload', sending.file),
            () => client.call('PUT', `/records/${draft}/draft/files/${key}/content`, sending.zip)
        ],
        [
            words(text, 'server.zenodo.call_commit', sending.file),
            () => client.call('POST', `/records/${draft}/draft/files/${key}/commit`)
        ]
    ];
    for (const [name, step] of steps) {
        const answer = await step();
        if (!answer.ok) return dropped(client, draft, answer, name, text);
    }
    return null;
}

/**
 * A press that ends with an unpublished draft: the draft is deleted with no run signal, so a Cancel
 * that ended the call still deletes it, and the sentence names the call and Zenodo's answer. A
 * draft Zenodo keeps is named, and a draft already gone (404) counts as deleted.
 */
async function dropped(
    client: ZenodoClient,
    draft: string,
    answer: Refused,
    call: string,
    text: Record<string, string>
): Promise<Outcome> {
    const gone = await client.call('DELETE', `/records/${draft}/draft`, undefined, null);
    if (!gone.ok && !('status' in gone && gone.status === 404)) {
        const why = failure(text, answer, call, 'none').error;
        return failed(words(text, 'server.zenodo.draft_kept', why, draft));
    }
    return failure(text, answer, call, 'draft');
}

/**
 * A publish that failed or got no answer: the draft is read before anything is deleted. A record
 * Zenodo holds as published goes on as a publish that answered, a draft it holds unpublished is
 * deleted, and when neither reads nothing is deleted or written and the sentence names the page.
 */
async function settled(
    client: ZenodoClient,
    plan: Plan,
    draft: string,
    answer: Refused,
    text: Record<string, string>
): Promise<Outcome> {
    const held = await client.call('GET', `/records/${draft}/draft`, undefined, null);
    if (held.ok && !(isMap(held.body) && held.body.is_published === true)) {
        return dropped(client, draft, answer, words(text, 'server.zenodo.call_publish'), text);
    }
    if (held.ok) return recorded(client, plan, draft, text);
    const read = await client.call('GET', `/records/${draft}`, undefined, null);
    if (read.ok) return recorded(client, plan, draft, text);
    return failed(words(text, 'server.zenodo.publish_unknown', pageOf(client, draft)));
}

/**
 * After the publish: the concept DOI, the one a new version was made under or a new record's read,
 * written with the Zenodo status and date the moment it is known, then the share link when the
 * press makes one. A read that fails writes nothing and names the record's page, from which the
 * user writes the DOI.
 */
async function recorded(
    client: ZenodoClient,
    plan: Plan,
    draft: string,
    text: Record<string, string>
): Promise<Outcome> {
    const page = pageOf(client, draft);
    let doi = plan.doi;
    if (doi === '') {
        const read = await client.call('GET', `/records/${draft}`, undefined, null);
        doi = read.ok ? textOf(read.body, 'conceptdoi') : '';
        if (doi === '') {
            const call = words(text, 'server.zenodo.call_read', draft);
            if ('unanswered' in read || 'cancelled' in read) {
                return failed(words(text, 'server.zenodo.unanswered_unread', page, call));
            }
            return failed(words(text, 'server.zenodo.failed_unread', page, call, read.status));
        }
    }
    const written = await write(plan, text, {
        'code_availability.doi': doi,
        'code_availability.zenodo_status': plan.kind === 'review' ? 'review-anon' : 'deposited',
        'code_availability.zenodo_date': today()
    });
    if (written !== null) {
        return failed(words(text, 'server.zenodo.manifest_refused', doi, written));
    }
    if (plan.linked) {
        const asked = { permission: 'view' };
        const link = await client.call('POST', `/records/${draft}/access/links`, asked, null);
        const token = link.ok ? textOf(link.body, 'token') : '';
        if (token === '') {
            const call = words(text, 'server.zenodo.call_link');
            if ('unanswered' in link || 'cancelled' in link) {
                return failed(words(text, 'server.zenodo.unanswered_published', doi, call));
            }
            return failed(words(text, 'server.zenodo.failed_published', doi, call, link.status));
        }
        const refused = await write(plan, text, {
            'code_availability.review_link': `${page}?token=${encodeURIComponent(token)}`
        });
        if (refused !== null) {
            return failed(words(text, 'server.zenodo.manifest_refused', doi, refused));
        }
    }
    if (plan.kind === 'review') return done(words(text, 'server.zenodo.reviewed', doi));
    return done(words(text, 'server.zenodo.published', doi));
}

/**
 * Write fields of the manifest as values oculus computed and record the write in History; the
 * first field refused, or null.
 */
async function write(
    plan: Plan,
    text: Record<string, string>,
    given: Record<string, string>
): Promise<string | null> {
    const { into, id } = plan.deposit.home;
    const outcome = writeManifest(into.hub, into.config, id, given, 'machine');
    if (!outcome.found) return words(text, 'server.deposit.no_project', plan.deposit.id);
    await recordWrite(outcome, 'manifest', into);
    return outcome.refused.length > 0 ? outcome.refused[0].field : null;
}
