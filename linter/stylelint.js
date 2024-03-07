function resolvePathFromModule(moduleName) {
    return require.resolve(moduleName);
}

function resolvePathFromArrayModule(moduleNames) {
    return moduleNames.map(resolvePathFromModule);
}

module.exports = function (cwd) {
    return {
        cache: true,
        extends: resolvePathFromArrayModule([
            "stylelint-config-standard",
            "stylelint-config-recommended-vue",
        ]),
        customSyntax: resolvePathFromModule("postcss-scss"),
        plugins: [
            ...resolvePathFromArrayModule(["stylelint-scss"]),
            "stylelint-prettier",
        ],
        overrides: [
            {
                files: ["*.vue", "**/*.vue"],
                customSyntax: resolvePathFromModule("postcss-html"),
            },
        ],
        ignorePattern: "!(src)/**/*",
        rules: {
            "prettier/prettier": [true, require("./prettier")],
            /** Font icons */
            "font-family-no-missing-generic-family-keyword": null,

            /** SCSS **/
            "at-rule-no-unknown": null,
            "no-descending-specificity": null,
            "scss/at-mixin-pattern": null,
            "keyframes-name-pattern": null,
            "selector-class-pattern": null,
            "custom-property-pattern": null,
            "import-notation": "string",
            "declaration-block-no-redundant-longhand-properties": null,

            /** Bulma **/
            "function-name-case": null,
            "scss/dollar-variable-pattern": null,
            "no-duplicate-selectors": null, // TODO

            /** Vuejs **/
            "value-keyword-case": null,
            "custom-property-empty-line-before": null,
            "selector-pseudo-element-no-unknown": [
                true,
                {
                    ignorePseudoElements: ["/^v-deep/"],
                },
            ],
            "selector-pseudo-class-no-unknown": [
                true,
                {
                    ignorePseudoClasses: ["/^deep/", "/^slotted/", "/^global/"],
                },
            ],
            "value-keyword-case": [
                "lower",
                {
                    ignoreFunctions: ["v-bind"],
                },
            ],
            "function-no-unknown": [
                true,
                {
                    ignoreFunctions: [
                        "findColorInvert",
                        "findLightColor",
                        "findDarkColor",
                        "powerNumber",
                        "colorLuminance",
                        "nth",
                        "v-bind",
                    ],
                },
            ],
            "no-invalid-position-at-import-rule": [
                true,
                {
                    ignoreAtRules: ["use", "charset", "layer"],
                },
            ],
        },
    };
};
