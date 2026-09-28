// Layer 4, test fixture. The rail pages `config/layout.yml` ships, in the order the rail draws
// them, by arrangement key and by button label, for the suites that check the drawn rail and the
// catalogue headings against the one ruled order.

/** The arrangement key of each shipped rail page, top to bottom. */
export const SHIPPED_RAIL_KEYS = [
    'focus',
    'sessions',
    'projects',
    'incoming',
    'explorer',
    'academic',
    'pillars',
    'references',
    'present',
    'info',
    'help',
    'views'
];

/** The button label of each shipped rail page, which is also its catalogue group's heading. */
export const SHIPPED_RAIL_LABELS = [
    'Focus',
    'Sessions',
    'Projects',
    'Incoming',
    'Explorer',
    'Academic Life',
    'Pillars',
    'References',
    'Present',
    'System',
    'Help',
    'Views and Settings'
];
