// The catalog: flattening on the server, lookup and interpolation on the client.

import { describe, expect, it } from 'vitest';
import { engineDir, flattenText, loadConfig, textCatalog } from '../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../src/lib/state/text.ts';

describe('flattenText', () => {
    it('turns a nested map into dotted keys', () => {
        expect(flattenText({ app: { title: 'oculus', tabs: { focus: 'Focus' } } })).toEqual({
            'app.title': 'oculus',
            'app.tabs.focus': 'Focus'
        });
    });
});

describe('textCatalog', () => {
    it('flattens the text key of the merged config', () => {
        expect(textCatalog({ text: { app: { title: 'oculus' } }, palette: ['teal'] })).toEqual({
            'app.title': 'oculus'
        });
    });

    it('is empty when the config holds no text', () => {
        expect(textCatalog({})).toEqual({});
    });

    it('reads the catalog out of the real config directory', () => {
        expect(textCatalog(loadConfig(engineDir()).config)['app.title']).toBe('oculus');
    });
});

describe('t', () => {
    it('interpolates by position', () => {
        setCatalog({ 'audit.count': '{0} findings in {1}' });
        expect(t('audit.count', 3, 'venues.yml')).toBe('3 findings in venues.yml');
    });

    it('throws on a key that is not in the catalog', () => {
        setCatalog({});
        expect(() => t('app.missing')).toThrow(/app\.missing/);
    });
});
