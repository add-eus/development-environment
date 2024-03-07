// Patch imports for ESLint
require("@rushstack/eslint-patch/modern-module-resolution");
require("@rushstack/eslint-patch/custom-config-package-names");

const DEFAULT_CONFIG = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    //parser: "@typescript-eslint/parser",
    parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
        tsconfigRootDir: process.cwd(),
        project: "./tsconfig.json",
        extraFileExtensions: [".vue"],
    },
    extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:vue/vue3-recommended",
        "plugin:vue/vue3-essential",
        "plugin:vuejs-accessibility/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:prettier-vue/recommended",
        "prettier",
    ],
    plugins: ["@typescript-eslint", "prettier-vue", "prettier"],
    rules: {
        "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
        "no-unused-vars": process.env.NODE_ENV === "production" ? "error" : "warn",
        quotes: ["error", "double"],

        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unused-vars": ["error"],

        "@typescript-eslint/consistent-type-imports": [
            "error",
            {
                prefer: "type-imports",
                disallowTypeAnnotations: false,
            },
        ],
        //"prettier/prettier": ["error", require("./prettier")],
        "prettier-vue/prettier": ["error", require("./prettier")],
        "vue/no-multiple-template-root": ["error"],
        "vue/no-lifecycle-after-await": ["error"],
        "vue/no-expose-after-await": ["error"],
        "vue/no-use-computed-property-like-method": ["error"],
        "vue/no-restricted-props": ["error", "/^on[A-Z]/"],
    },
    overrides: [
        {
            files: ["*.md"],
            parser: "markdown-eslint-parser",
            extends: ["plugin:md/recommended"],
            rules: {
                "md/remark": "off",
                "prettier-vue/prettier": "off",
            },
        },
        {
            files: ["*.vue", "*.ts"],
            extends: [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:vue/vue3-recommended",
                "plugin:vuejs-accessibility/recommended",
                "plugin:prettier-vue/recommended",
                "prettier",
            ],
            rules: {
                "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
                "no-debugger": process.env.NODE_ENV === "production" ? "error" : "warn",
                eqeqeq: ["error", "always"],
                "no-unused-vars": "off",
                "no-warning-comments": [
                    "error",
                    { terms: ["todo", "fixme"], location: "start" },
                ],
                "spaced-comment": ["error", "always", { markers: ["/"] }],
                "no-dupe-else-if": "error",

                "@typescript-eslint/no-unused-vars": "error",
                "@typescript-eslint/strict-boolean-expressions": [
                    "error",
                    {
                        allowNullableEnum: true,
                        allowNullableNumber: true,
                        allowNullableString: true,
                        allowNullableBoolean: true,
                        allowNullableObject: true,
                        allowNullableNumber: true,
                    },
                ],
                "@typescript-eslint/no-floating-promises": "error",
                "@typescript-eslint/no-misused-promises": "error",
                "@typescript-eslint/restrict-plus-operands": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-inferrable-types": "off",
                "@typescript-eslint/restrict-template-expressions": "off",
                "@typescript-eslint/unbound-method": "off",

                "vue/no-export-in-script-setup": "off",
                "vue/no-expose-after-await": "off",
                "vue/script-setup-uses-vars": "error",
                "vue/multi-word-component-names": "off",
                "vuejs-accessibility/form-control-has-label": "off",
                "vuejs-accessibility/label-has-for": "off",
                "vuejs-accessibility/anchor-has-content": "off",
                "vue/multiline-html-element-content-newline": "off",
            },
        },
    ],
};

function mergeDeep(...objects) {
    const isObject = (obj) => obj && typeof obj === "object";

    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach((key) => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            } else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeep(pVal, oVal);
            } else if (prev[key] == undefined) {
                prev[key] = oVal;
            }
        });

        return prev;
    }, {});
}

module.exports = function (data) {
    return mergeDeep(data, DEFAULT_CONFIG);
};

module.exports.cloudFunction = function (path) {
    return mergeDeep(
        {
            parserOptions: {
                tsconfigRootDir: path,
                project: path + "/tsconfig.json",
            },
            env: {
                browser: false,
                node: true,
            },
        },
        DEFAULT_CONFIG,
    );
};

module.exports.web = function (path) {
    return mergeDeep(
        {
            parserOptions: {
                tsconfigRootDir: path,
                project: path + "/tsconfig.json",
            },
            env: {
                browser: true,
                node: false,
            },
        },
        DEFAULT_CONFIG,
    );
};
