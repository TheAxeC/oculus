// Layer 2, server. VS Code's `Uri` as the host's object offers it: `Uri.file`, `Uri.parse`,
// `Uri.joinPath` and `uri.with`, the components `scheme`, `authority`, `path`, `query` and
// `fragment`, `fsPath` and `toString`. A path in the API is a `Uri` of the `file:` scheme with a
// real absolute path; oculus turns it into a root and a path where it crosses to a page. It is
// plain JavaScript that the runner imports before it installs its import guard.

const PATTERN = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

/** The path with each segment percent-encoded and the slashes kept. */
function encodePath(path) {
    return path
        .split('/')
        .map((segment) => encodeURIComponent(segment).replace(/%3A/gi, ':'))
        .join('/');
}

/** A component percent-decoded; a value that is not valid encoding stays as it is. */
function decode(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export class Uri {
    #scheme;
    #authority;
    #path;
    #query;
    #fragment;

    constructor(scheme, authority = '', path = '', query = '', fragment = '') {
        this.#scheme = scheme || 'file';
        this.#authority = authority;
        this.#path =
            path.length > 0 && !path.startsWith('/') && authority !== '' ? `/${path}` : path;
        this.#query = query;
        this.#fragment = fragment;
    }

    get scheme() {
        return this.#scheme;
    }

    get authority() {
        return this.#authority;
    }

    get path() {
        return this.#path;
    }

    get query() {
        return this.#query;
    }

    get fragment() {
        return this.#fragment;
    }

    /** The path as a file system path: the path itself, since oculus runs on POSIX paths. */
    get fsPath() {
        return this.#authority !== '' && this.#path.length > 1 && this.#scheme === 'file'
            ? `//${this.#authority}${this.#path}`
            : this.#path;
    }

    /** A `file:` Uri of a path. */
    static file(path) {
        let value = String(path);
        let authority = '';
        if (value.startsWith('//')) {
            const end = value.indexOf('/', 2);
            authority = end === -1 ? value.slice(2) : value.slice(2, end);
            value = end === -1 ? '/' : value.slice(end);
        }
        return new Uri('file', authority, value.startsWith('/') ? value : `/${value}`);
    }

    /** The Uri a text names; a text with no scheme is read as a file path. */
    static parse(value) {
        const found = PATTERN.exec(String(value));
        if (found === null || found[2] === undefined) return Uri.file(String(value));
        return new Uri(
            found[2],
            decode(found[4] ?? ''),
            decode(found[5] ?? ''),
            decode(found[7] ?? ''),
            decode(found[9] ?? '')
        );
    }

    /** A Uri whose path is the base's with these segments joined on. */
    static joinPath(base, ...parts) {
        const joined = [base.path, ...parts]
            .join('/')
            .split('/')
            .reduce((kept, segment) => {
                if (segment === '..') kept.pop();
                else if (segment !== '.' && segment !== '') kept.push(segment);
                return kept;
            }, []);
        return base.with({ path: `/${joined.join('/')}` });
    }

    /** A Uri with some components replaced. */
    with(change) {
        const has = (key) => change !== null && typeof change === 'object' && key in change;
        return new Uri(
            has('scheme') ? change.scheme : this.#scheme,
            has('authority') ? change.authority : this.#authority,
            has('path') ? change.path : this.#path,
            has('query') ? change.query : this.#query,
            has('fragment') ? change.fragment : this.#fragment
        );
    }

    /** The Uri as text, its components percent-encoded unless `skipEncoding`. */
    toString(skipEncoding = false) {
        const path = skipEncoding ? this.#path : encodePath(this.#path);
        const authority = skipEncoding ? this.#authority : encodeURIComponent(this.#authority);
        let text = `${this.#scheme}:`;
        if (this.#authority !== '' || this.#scheme === 'file') text += `//${authority}`;
        text += path;
        if (this.#query !== '')
            text += `?${skipEncoding ? this.#query : encodeURIComponent(this.#query)}`;
        if (this.#fragment !== '') {
            text += `#${skipEncoding ? this.#fragment : encodeURIComponent(this.#fragment)}`;
        }
        return text;
    }

    toJSON() {
        return {
            $mid: 1,
            scheme: this.#scheme,
            authority: this.#authority,
            path: this.#path,
            query: this.#query,
            fragment: this.#fragment,
            fsPath: this.fsPath,
            external: this.toString()
        };
    }

    /** The Uri a JSON form (`toJSON`'s or any object with these components) stands for. */
    static from(value) {
        if (value instanceof Uri) return value;
        return new Uri(value.scheme, value.authority, value.path, value.query, value.fragment);
    }
}
