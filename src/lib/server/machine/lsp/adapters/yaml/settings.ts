// Layer 2, server. What the YAML server is told of its client: the settings it reads through
// `workspace/configuration`, one answer for its `yaml` section. Validation, hover and completion
// are on; no schema comes from the schema store or the Kubernetes store, the schemas being the ones
// the entry hands it (requests.ts); formatting is left to the editor.

/** The sections the YAML server reads its settings from, as the one answer it is given. */
export const YAML_SETTINGS = {
    schemas: {},
    validate: true,
    hover: true,
    completion: true,
    schemaStore: { enable: false },
    kubernetesCRDStore: { enable: false },
    hoverSchemaSource: false,
    format: { enable: false },
    yamlVersion: '1.2'
};
