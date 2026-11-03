# Third-party programs

Oculus's own code is under the MIT license. The packages it installs keep their own licenses, each in its folder under `node_modules/`. One bundled program is under a copyleft license and is not linked into oculus's code: it is a separate program that oculus runs in a process of its own.

| Program | Version | License | What oculus uses it for | Source |
|---|---|---|---|---|
| 7z-wasm | 1.2.0 | LGPL-2.1 or later with the unRAR restriction, text in [licenses/LGPL-2.1.txt](licenses/LGPL-2.1.txt), terms in `node_modules/7z-wasm/License.txt` and `unRarLicense.txt` | Unpacks archives in Recover | <https://github.com/use-strict/7z-wasm>; 7-Zip's source is at <https://www.7-zip.org> |

The unRAR restriction: the unRAR code may not be used to re-create the RAR compression algorithm or to develop a RAR (WinRAR) compatible archiver.
