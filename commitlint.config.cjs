const { RuleConfigSeverity } = require("@commitlint/types");

function generateConfig(scopes) {
    return {
        extends: ["@commitlint/config-conventional"],
        ignores: [(commit) => commit.startsWith("WIP: ")],

        rules: {
            "scope-enum": [RuleConfigSeverity.Error, "always", scopes],
        },
    };
}
module.exports = generateConfig([]);
module.exports.generateConfig = generateConfig;
