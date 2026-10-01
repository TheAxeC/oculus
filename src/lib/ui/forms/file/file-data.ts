// Layer 3, primitive. A chosen file's bytes as the page sends them: the file read to a data URL,
// and the base64 part of a data URL. A view that uploads a file reads it here, so the Memories wall
// and the Files view's Upload... share one reader.

/**
 * One file as a data URL (`data:<type>;base64,<bytes>`); the promise rejects when it cannot be
 * read.
 */
export function encoded(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('unreadable'));
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.readAsDataURL(file);
    });
}

/** The base64 text of a data URL, which is everything after its `base64,`. */
export function base64Of(url: string): string {
    const at = url.indexOf('base64,');
    return at < 0 ? '' : url.slice(at + 'base64,'.length);
}
