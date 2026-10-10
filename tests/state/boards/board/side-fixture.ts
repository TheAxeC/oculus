// Layer 4, test helper. Synthetic side projects for the Personal board's cases: one read from a
// folder of the hub's side-projects tier, and one read from a repository's .oculus/project.yml.

import type { SideProject } from '../../../../src/lib/data/model/index.ts';

/** A side project of the hub tier, named by its slug, with every field a card draws empty. */
export function side(slug: string, over: Partial<SideProject> = {}): SideProject {
    return {
        id: `side:${slug}`,
        title: slug,
        status: 'idea',
        eli5: '',
        next: '',
        links: [],
        source: { kind: 'hub', folder: `side-projects/${slug}` },
        file: `/hub/side-projects/${slug}/project.yml`,
        folder: `side-projects/${slug}`,
        docs: [],
        ...over
    };
}

/** A side project read from the .oculus folder of the repository at `dir`, under the root `key`. */
export function rooted(key: string, dir: string, over: Partial<SideProject> = {}): SideProject {
    return side(key, {
        id: `root:${key}`,
        source: { kind: 'root', key, dir },
        file: `${dir}/.oculus/project.yml`,
        folder: dir,
        ...over
    });
}
