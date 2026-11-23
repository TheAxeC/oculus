# Rulings on the first run of O189's cases

Read with the brief, whose text it replaces where the two differ. Both stay inside the step's part.

1. Item 1 and case 4, a locale name without the hyphen. On macOS a value names UTF-8 only as `UTF-8` with the hyphen, in either case, since macOS has no locale named without it (`env -i LANG=en_US.utf8 locale charmap` answers US-ASCII); on every other platform with or without it. So on macOS `LANG=en_US.utf8` and `LANG=C.utf8` count as no UTF-8 locale and the start carries `LANG=en_US.UTF-8`, with an empty `LC_ALL` or `LC_CTYPE` by the rule of item 1; on Linux they are carried as set. A well-formed name of a locale the machine lacks is carried as set.
2. Item 3, inverse text with a truecolor background of its own and the default text colour. The rule of `grid.css` is taken with its effect: that text is drawn in the panel's colour on the ink as well, whether the floor would recolour it or not. No private member of xterm is used.
3. The report's judgment calls 1 and 2 are accepted: the rule leaves out `.xterm-cursor-block`, dim inverse text takes half the panel's colour as xterm draws it now, and a locale pair goes through `tmuxValue`.
