// The models a Codex account's models_cache.json lists, read loosely: a list of models or a map
// holding one under `models`, each model named by `slug`, `id` or `model`. Compared whole.

import { describe, expect, it } from 'vitest';
import { cacheModels } from '../../../../src/lib/data/sources/config/agents.ts';

describe('cacheModels', () => {
    it.each([[3], ['x'], [null], [undefined], [{}], [{ models: 3 }], [{ models: {} }]])(
        'lists no model for %j',
        (raw) => {
            expect(cacheModels(raw)).toStrictEqual([]);
        }
    );

    it('names a model by the first of slug, id and model that is text, and shows its display name', () => {
        expect(
            cacheModels({
                models: [
                    3,
                    { slug: 3 },
                    { slug: 'a' },
                    { id: 'b', display_name: 'B' },
                    { model: ' c ', name: 'Cee' },
                    { slug: 'a' },
                    { slug: 'bad slug' },
                    { slug: '-x' },
                    { slug: ' ', id: 'q' },
                    null,
                    []
                ]
            })
        ).toStrictEqual([
            { id: 'a', label: 'a', pass: 'a' },
            { id: 'b', label: 'B', pass: 'b' },
            { id: 'c', label: 'Cee', pass: 'c' },
            { id: 'q', label: 'q', pass: 'q' }
        ]);
    });

    it('reads a list given at the top, trimming a display name and skipping a blank one', () => {
        expect(
            cacheModels([
                { slug: 'z', displayName: ' Zed ' },
                { slug: 'y', display_name: '  ', name: 'Why' }
            ])
        ).toStrictEqual([
            { id: 'z', label: 'Zed', pass: 'z' },
            { id: 'y', label: 'Why', pass: 'y' }
        ]);
    });
});
