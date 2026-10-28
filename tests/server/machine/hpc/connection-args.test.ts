// Layer 4, server test. The arguments a cluster's connection reaches ssh and rsync with: the host,
// this machine's user name and key file each one argument of ssh, and in the one word of rsync's
// `-e`, which rsync splits on spaces and in which it honours single quotes, each word in single
// quotes, so a value adds no option.

import { describe, expect, it } from 'vitest';
import { SSH_OPTIONS, sshArgs } from '../../../../src/lib/server/machine/hpc/ssh.ts';
import { copyVector } from '../../../../src/lib/server/machine/hpc/transfer.ts';

describe('the arguments of a cluster connection', () => {
    it('passes the host, the user name and the key file each as one argument, and neither of the two when the row names none (G7)', () => {
        expect(sshArgs({ host: 'utwente' })).toEqual([...SSH_OPTIONS, 'utwente']);
        expect(sshArgs({ host: 'utwente', user: 'axel', keyFile: '/home/me/.ssh/k b' })).toEqual([
            ...SSH_OPTIONS,
            '-l',
            'axel',
            '-i',
            '/home/me/.ssh/k b',
            '-o',
            'IdentitiesOnly=yes',
            'utwente'
        ]);
    });

    it("puts each word of the copy's ssh in single quotes in the one word of -e, and brackets an address with colons (G7)", () => {
        const vector = copyVector(
            { host: 'utwente', user: 'axel', keyFile: '/home/me/.ssh/k b' },
            '~/projects/p'
        );
        const word = vector[vector.indexOf('-e') + 1];
        expect(word).toBe(
            [
                "'ssh'",
                "'-o' 'ConnectTimeout=8' '-o' 'BatchMode=yes'",
                "'-o' 'ControlMaster=no' '-o' 'ControlPath=none'",
                "'-l' 'axel' '-i' '/home/me/.ssh/k b' '-o' 'IdentitiesOnly=yes'"
            ].join(' ')
        );
        expect(vector.at(-1)).toBe('utwente:~/projects/p/');
        expect(copyVector({ host: 'fe80::1' }, '~/p').at(-1)).toBe('[fe80::1]:~/p/');
        expect(copyVector({ host: 'utwente' }, '~/p')).not.toContain('-l');
    });
});
