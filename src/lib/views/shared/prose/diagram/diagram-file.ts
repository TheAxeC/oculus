// Layer 3, shared view helper. The address a view fetches one diagram of oculus's own documents at,
// and the fetch itself.
//
// A document shows a diagram as an image of its file, `docs/diagrams/<name>.svg` from the engine's
// folder, which is the address a Markdown reader opening the file in place resolves. The server
// cuts each such image out of the document's answer as a diagram part (server/content/docs.ts,
// cutDiagrams), and Diagram.svelte draws it from the diagram route instead, in the page's own text
// colour.

import { refusedAnswer } from '$lib/state/shared/answers/answers';

/** The address the page fetches one diagram at: the diagram route, by file name. */
function diagramUrl(name: string): string {
    return `/api/diagrams/${name}.svg`;
}

/** One diagram as the page holds it: the diagram it is for, the file's text, or what went wrong. */
export type DiagramFile = { name: string; svg: string; error: string };

/** Fetch one diagram, or say why there is none; the signal stops the fetch. */
export async function loadDiagram(name: string, signal: AbortSignal): Promise<DiagramFile> {
    try {
        const response = await fetch(diagramUrl(name), { signal });
        if (!response.ok) return { name, svg: '', error: refusedAnswer(response.status) };
        return { name, svg: await response.text(), error: '' };
    } catch (error) {
        return { name, svg: '', error: error instanceof Error ? error.message : String(error) };
    }
}
