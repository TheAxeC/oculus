// Layer 2, client state. The source tab's file address, configured access mode, initial whole-text
// read, and whole-text save through the shared authenticated write sender.

import { send, type WriteAnswer } from './writes.svelte.ts';
import { instanceState, setInstanceState } from './ui.svelte.ts';
import { t } from './text.ts';

export type SourceAccess = 'editable' | 'read-only' | 'blocked';
export type SourceLoad = { ok: true; content: string } | { ok: false; error: string };
export type SourceTabState = { root: string; path: string; label: string };
export type SourceDraft = {
    text: string;
    saved: string;
    loaded: boolean;
    /** The page lifetime the disk was last read in; another value means the draft came from storage. */
    readIn?: string;
    error: string;
    message: string;
};

const reading = new Map<string, Promise<void>>();
/** One token per page lifetime: a draft carrying it was read from disk since the page loaded. */
const LIFETIME = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** Working and saved copies belong to the instance, not its currently mounted component. */
export function sourceDraft(id: string): SourceDraft {
    const value = instanceState(id);
    const held = (typeof value === 'object' && value !== null ? value : {}) as Partial<SourceDraft>;
    return {
        text: typeof held.text === 'string' ? held.text : '',
        saved: typeof held.saved === 'string' ? held.saved : '',
        loaded: held.loaded === true,
        readIn: typeof held.readIn === 'string' ? held.readIn : undefined,
        error: typeof held.error === 'string' ? held.error : '',
        message: typeof held.message === 'string' ? held.message : ''
    };
}

function updateDraft(id: string, changes: Partial<SourceDraft>): void {
    setInstanceState(id, { ...sourceDraft(id), ...changes });
}

/**
 * Read once per instance per page lifetime, sharing an unfinished read across tab switches. A draft
 * restored from the browser's storage after a reload is read again from disk: an unsaved edit is
 * kept as the working text over the disk's copy, a draft with no edit takes the disk's text.
 */
export async function loadSourceDraft(id: string, root: string, path: string): Promise<void> {
    if (sourceDraft(id).readIn === LIFETIME) return;
    const pending = reading.get(id);
    if (pending !== undefined) return pending;
    const request = loadSource(root, path).then((answer) => {
        if (answer.ok) {
            const held = sourceDraft(id);
            const edited = held.loaded && held.text !== held.saved;
            updateDraft(id, {
                text: edited ? held.text : answer.content,
                saved: answer.content,
                loaded: true,
                readIn: LIFETIME,
                error: ''
            });
        } else {
            updateDraft(id, { error: t('js.filters.cannot_open', answer.error) });
        }
    });
    reading.set(id, request);
    try {
        await request;
    } finally {
        reading.delete(id);
    }
}

/** Keep typing local to this instance until the user saves. */
export function editSourceDraft(id: string, text: string): void {
    updateDraft(id, { text, message: '' });
}

/** Cancel restores the last saved copy without closing the tab. */
export function cancelSourceDraft(id: string): void {
    updateDraft(id, { text: sourceDraft(id).saved, message: '' });
}

/** A save acknowledges the exact sent copy, even if more typing follows while it is pending. */
export async function saveSourceDraft(id: string, root: string, path: string): Promise<void> {
    const content = sourceDraft(id).text;
    updateDraft(id, { message: t('js.filters.saving') });
    const answer = await saveSource(root, path, content);
    if (answer.ok) {
        updateDraft(id, { saved: content, message: t('js.filters.saved') });
    } else {
        // A request that never reached the server (offline, a dropped socket) is the catalog's
        // save_failed; a server refusal carries its own words.
        updateDraft(id, {
            message: answer.network
                ? t('js.filters.save_failed')
                : t('js.common.x_prefix', answer.error || t('js.filters.failed'))
        });
    }
}

function extension(path: string): string {
    const name = path.split('/').at(-1) ?? '';
    const at = name.lastIndexOf('.');
    return at < 0 ? '' : name.slice(at).toLowerCase();
}

function configured(config: Record<string, unknown>, key: string): string[] {
    const value = config[key];
    if (!Array.isArray(value)) return [];
    return value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.toLowerCase());
}

/** Whether a path is writable, view-only, or outside both configured extension lists. */
export function sourceAccess(path: string, config: Record<string, unknown>): SourceAccess {
    const suffix = extension(path);
    if (configured(config, 'editable_extensions').includes(suffix)) return 'editable';
    if (configured(config, 'viewable_extensions').includes(suffix)) return 'read-only';
    return 'blocked';
}

/** The state that identifies one source tab and labels it with the file name. */
export function sourceTabState(root: string, path: string): SourceTabState {
    return { root, path, label: path.split('/').filter(Boolean).at(-1) ?? path };
}

/** The api/file URL, escaping each path segment without escaping its separators. */
export function sourceFileUrl(root: string, path: string): string {
    const parts = path
        .split('/')
        .filter((part) => part !== '')
        .map((part) => encodeURIComponent(part));
    return `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
}

/** Read one file's complete text from the existing file route. */
export async function loadSource(root: string, path: string): Promise<SourceLoad> {
    try {
        const response = await fetch(sourceFileUrl(root, path));
        if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
        return { ok: true, content: await response.text() };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/** Save one file's complete current text through POST /api/source. */
export async function saveSource(
    root: string,
    path: string,
    content: string
): Promise<WriteAnswer> {
    return send({ root, path, content }, '/api/source');
}
