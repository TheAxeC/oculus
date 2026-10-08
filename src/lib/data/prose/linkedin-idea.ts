// Layer 1, data. The stub a new LinkedIn idea file starts as: the front matter a post carries, then
// a blank line, then the empty line the body is written on. The server writes it and the LinkedIn
// view opens the file at its body line, so both read the stub from here.

/** The front-matter lines of a new idea, from its title, category and local calendar date. */
function frontMatter(title: string, category: string, date: string): string[] {
    return [
        '---',
        'layout: post',
        `title: ${JSON.stringify(title)}`,
        `category: ${JSON.stringify(category)}`,
        'publish: True',
        `date: ${date}`,
        '---'
    ];
}

/** The text of a new idea file; its body is the line after the front matter and a blank line. */
export function ideaStub(title: string, category: string, date: string): string {
    return [...frontMatter(title, category, date), '', ''].join('\n');
}

/** The line, counted from 1, that a new idea file's body starts on. */
export const IDEA_BODY_LINE = frontMatter('', '', '').length + 2;
