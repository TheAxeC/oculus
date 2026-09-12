// Layer 2, client state. A small pure highlighter for the source editor's YAML and Markdown mirror.
// It escapes all file text first and emits only its fixed span classes; every other extension is
// plain escaped text.

export type SourceLanguage = 'yml' | 'md' | 'plain';

/** Escape file text before it enters the mirror's HTML. */
export function escapeSource(value: string): string {
    return value.replace(/[&<>]/g, (character) => {
        if (character === '&') return '&amp;';
        if (character === '<') return '&lt;';
        return '&gt;';
    });
}

/** The editor language selected only by the file extension. */
export function languageFor(path: string): SourceLanguage {
    if (/\.ya?ml$/i.test(path)) return 'yml';
    if (/\.md$/i.test(path)) return 'md';
    return 'plain';
}

function yamlValue(value: string): string {
    const trimmed = value.trim();
    if (trimmed === '') return escapeSource(value);
    if (/^["']/.test(trimmed)) {
        return `<span class="source-string">${escapeSource(value)}</span>`;
    }
    if (/^(true|false|null|yes|no)$/i.test(trimmed)) {
        return `<span class="source-boolean">${escapeSource(value)}</span>`;
    }
    if (/^-?\d[\d.:-]*$/.test(trimmed)) {
        return `<span class="source-number">${escapeSource(value)}</span>`;
    }
    if (/^(?:\[|{)/.test(trimmed)) {
        return `<span class="source-flow">${escapeSource(value)}</span>`;
    }
    return escapeSource(value);
}

function yaml(text: string): string {
    return text
        .split('\n')
        .map((raw) => {
            if (raw.trim() === '') return escapeSource(raw);
            let body = raw;
            let comment = '';
            let quote: string | null = null;
            for (let at = 0; at < raw.length; at += 1) {
                const character = raw[at];
                if (quote !== null) {
                    if (character === quote) quote = null;
                } else if (character === '"' || character === "'") {
                    quote = character;
                } else if (character === '#' && (at === 0 || /\s/.test(raw[at - 1]))) {
                    body = raw.slice(0, at);
                    comment = raw.slice(at);
                    break;
                }
            }
            const key = /^(\s*(?:-\s+)?)([\w.\-/]+)(\s*:)(\s*)([\s\S]*)$/.exec(body);
            let line: string;
            if (key !== null) {
                line = `${escapeSource(key[1])}<span class="source-key">${escapeSource(key[2])}</span><span class="source-punctuation">${escapeSource(key[3])}</span>${escapeSource(key[4])}${yamlValue(key[5])}`;
            } else {
                const item = /^(\s*-\s+)([\s\S]*)$/.exec(body);
                line =
                    item === null ? escapeSource(body) : escapeSource(item[1]) + yamlValue(item[2]);
            }
            return (
                line +
                (comment === ''
                    ? ''
                    : `<span class="source-comment">${escapeSource(comment)}</span>`)
            );
        })
        .join('\n');
}

function markdown(text: string): string {
    return text
        .split('\n')
        .map((line) => {
            if (/^\s*#{1,6}\s/.test(line)) {
                return `<span class="source-heading">${escapeSource(line)}</span>`;
            }
            if (/^\s*(```|~~~)/.test(line)) {
                return `<span class="source-fence">${escapeSource(line)}</span>`;
            }
            return escapeSource(line)
                .replace(/(`[^`]+`)/g, '<span class="source-code">$1</span>')
                .replace(/(\*\*[^*]+\*\*)/g, '<span class="source-strong">$1</span>')
                .replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="source-link">$1</span>')
                .replace(/^(\s*)([-*+]|\d+\.)(\s)/, '$1<span class="source-marker">$2</span>$3');
        })
        .join('\n');
}

/** Highlight complete editor text and keep a final mirror line for the textarea's last line. */
export function highlight(text: string, language: SourceLanguage): string {
    const normal = text.replace(/\r\n?/g, '\n') + '\n';
    if (language === 'yml') return yaml(normal);
    if (language === 'md') return markdown(normal);
    return escapeSource(normal);
}
