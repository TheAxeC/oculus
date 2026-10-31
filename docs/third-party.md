# Third-party programs

Oculus's own code is under the MIT license. The packages it installs keep their own licenses, each in its folder under `node_modules/`. Two bundled programs are under a copyleft license and are not linked into oculus's code: they are separate programs that oculus runs in a process of its own.

| Program | Version | License | What oculus uses it for | Source |
|---|---|---|---|---|
| cloc | 2.6.0-cloc | GPL-2.0, text in [licenses/GPL-2.0.txt](licenses/GPL-2.0.txt) | Counts the lines shown in the Status view | The Perl script `node_modules/cloc/lib/cloc` is its own source; upstream is <https://github.com/AlDanial/cloc> |
| 7z-wasm | 1.2.0 | LGPL-2.1 or later with the unRAR restriction, text in [licenses/LGPL-2.1.txt](licenses/LGPL-2.1.txt), terms in `node_modules/7z-wasm/License.txt` and `unRarLicense.txt` | Unpacks archives in Recover | <https://github.com/use-strict/7z-wasm>; 7-Zip's source is at <https://www.7-zip.org> |

The unRAR restriction: the unRAR code may not be used to re-create the RAR compression algorithm or to develop a RAR (WinRAR) compatible archiver.
