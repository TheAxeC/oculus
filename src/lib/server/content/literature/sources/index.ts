// Layer 2, server. The eight sources, one adapter each, in the order the route lists them.

import type { LiteratureSource } from '../../../../data/model/index.ts';
import { arxiv } from './arxiv.ts';
import type { Adapter } from './common.ts';
import { crossref } from './crossref.ts';
import { europePmc } from './europe-pmc.ts';
import { openalex } from './openalex.ts';
import { pubmed } from './pubmed.ts';
import { scopus } from './scopus.ts';
import { semanticScholar } from './semantic-scholar.ts';
import { wos } from './wos.ts';

export const ADAPTERS: Record<LiteratureSource, Adapter> = {
    openalex,
    semantic_scholar: semanticScholar,
    crossref,
    pubmed,
    europe_pmc: europePmc,
    arxiv,
    wos,
    scopus
};
