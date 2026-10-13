// Layer 2, server. The value classes of VS Code's API that carry text and edits: `TextEdit`,
// `WorkspaceEdit`, `SnippetString`, `MarkdownString`, `ThemeColor`, `ThemeIcon`, `FileType`,
// `FileSystemError`, `Diagnostic` and the enums around them. The numbers of the enums are VS
// Code's, which differ from the protocol's for severities and kinds; `languages/convert.mjs`
// converts. The runner imports it before it installs its import guard.

import { Position, Range } from './position-range.mjs';

export const EndOfLine = Object.freeze({ LF: 1, CRLF: 2 });

export const FileType = Object.freeze({ Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 });

export const DiagnosticSeverity = Object.freeze({ Error: 0, Warning: 1, Information: 2, Hint: 3 });

export const DiagnosticTag = Object.freeze({ Unnecessary: 1, Deprecated: 2 });

export class TextEdit {
    constructor(range, newText) {
        this.range = range;
        this.newText = newText;
    }

    static replace(range, newText) {
        return new TextEdit(range, newText);
    }

    static insert(position, newText) {
        return new TextEdit(new Range(position, position), newText);
    }

    static delete(range) {
        return new TextEdit(range, '');
    }

    static setEndOfLine(eol) {
        const edit = new TextEdit(new Range(new Position(0, 0), new Position(0, 0)), '');
        edit.newEol = eol;
        return edit;
    }
}

export class WorkspaceEdit {
    /**
     * The entries in the order made: `{ uri, edit }` for a text edit, `{ kind, ... }` for a file.
     */
    #entries = [];

    get size() {
        return new Set(this.#entries.filter((one) => one.edit).map((one) => one.uri.toString()))
            .size;
    }

    replace(uri, range, newText) {
        this.#entries.push({ uri, edit: new TextEdit(range, newText) });
    }

    insert(uri, position, newText) {
        this.#entries.push({ uri, edit: TextEdit.insert(position, newText) });
    }

    delete(uri, range) {
        this.#entries.push({ uri, edit: TextEdit.delete(range) });
    }

    has(uri) {
        return this.#entries.some((one) => one.edit && one.uri.toString() === uri.toString());
    }

    set(uri, edits) {
        this.#entries = this.#entries.filter(
            (one) => !(one.edit && one.uri.toString() === uri.toString())
        );
        for (const edit of edits ?? []) this.#entries.push({ uri, edit });
    }

    get(uri) {
        return this.#entries
            .filter((one) => one.edit && one.uri.toString() === uri.toString())
            .map((one) => one.edit);
    }

    createFile(uri, options) {
        this.#entries.push({ kind: 'create', uri, options });
    }

    deleteFile(uri, options) {
        this.#entries.push({ kind: 'delete', uri, options });
    }

    renameFile(from, to, options) {
        this.#entries.push({ kind: 'rename', uri: from, to, options });
    }

    /** The text edits as [uri, edits] pairs, in the order each file was first edited. */
    entries() {
        const byFile = new Map();
        for (const one of this.#entries) {
            if (!one.edit) continue;
            const key = one.uri.toString();
            const held = byFile.get(key) ?? [one.uri, []];
            held[1].push(one.edit);
            byFile.set(key, held);
        }
        return [...byFile.values()];
    }

    /** The file operations in the order made. */
    fileOperations() {
        return this.#entries.filter((one) => one.kind !== undefined);
    }
}

export class SnippetString {
    constructor(value = '') {
        this.value = value;
    }

    appendText(text) {
        this.value += String(text).replace(/[$}\\]/g, '\\$&');
        return this;
    }

    appendTabstop(number = 1) {
        this.value += `$${number}`;
        return this;
    }

    appendPlaceholder(value, number = 1) {
        const text =
            typeof value === 'function' ? nested(value) : String(value).replace(/[$}\\]/g, '\\$&');
        this.value += `\${${number}:${text}}`;
        return this;
    }

    appendChoice(values, number = 1) {
        const list = values.map((one) => String(one).replace(/[$}\\,|]/g, '\\$&')).join(',');
        this.value += `\${${number}|${list}|}`;
        return this;
    }

    appendVariable(name, defaultValue) {
        const fallback =
            typeof defaultValue === 'function'
                ? nested(defaultValue)
                : defaultValue === undefined
                  ? undefined
                  : String(defaultValue).replace(/[$}\\]/g, '\\$&');
        this.value += fallback === undefined ? `\${${name}}` : `\${${name}:${fallback}}`;
        return this;
    }
}

/** The text a callback builds on a fresh snippet string. */
function nested(build) {
    const inner = new SnippetString();
    build(inner);
    return inner.value;
}

export class MarkdownString {
    constructor(value = '', supportThemeIcons = false) {
        this.value = value;
        this.supportThemeIcons = supportThemeIcons;
        this.isTrusted = false;
        this.supportHtml = false;
    }

    appendText(text) {
        this.value += String(text).replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
        return this;
    }

    appendMarkdown(text) {
        this.value += text;
        return this;
    }

    appendCodeblock(code, language = '') {
        this.value += `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
        return this;
    }
}

export class ThemeColor {
    constructor(id) {
        this.id = id;
    }
}

export class ThemeIcon {
    constructor(id, color) {
        this.id = id;
        this.color = color;
    }
}

export class FileSystemError extends Error {
    constructor(messageOrUri) {
        super(typeof messageOrUri === 'string' ? messageOrUri : String(messageOrUri));
        this.name = 'FileSystemError';
    }

    static FileNotFound(messageOrUri) {
        return Object.assign(new FileSystemError(messageOrUri), { code: 'FileNotFound' });
    }

    static FileExists(messageOrUri) {
        return Object.assign(new FileSystemError(messageOrUri), { code: 'FileExists' });
    }

    static FileNotADirectory(messageOrUri) {
        return Object.assign(new FileSystemError(messageOrUri), { code: 'FileNotADirectory' });
    }

    static FileIsADirectory(messageOrUri) {
        return Object.assign(new FileSystemError(messageOrUri), { code: 'FileIsADirectory' });
    }

    static NoPermissions(messageOrUri) {
        return Object.assign(new FileSystemError(messageOrUri), { code: 'NoPermissions' });
    }

    static Unavailable(messageOrUri) {
        return Object.assign(new FileSystemError(messageOrUri), { code: 'Unavailable' });
    }
}

export class DiagnosticRelatedInformation {
    constructor(location, message) {
        this.location = location;
        this.message = message;
    }
}

export class Diagnostic {
    constructor(range, message, severity = DiagnosticSeverity.Error) {
        this.range = range;
        this.message = message;
        this.severity = severity;
    }
}
