const { defineConfig, loadEnv } = require("vite");
const path = require("path");
const { cpus } = require("os");
const Vue = require("@vitejs/plugin-vue");
const { default: Pages } = require("vite-plugin-pages");
const Components = require("unplugin-vue-components/vite");
const { default: ViteFonts } = require("vite-plugin-fonts");
const { default: dynamicImport } = require("vite-plugin-dynamic-import");
const { imagetools } = require("vite-imagetools");
const ImageMin = require("vite-plugin-imagemin");
const vueI18n = require("@intlify/unplugin-vue-i18n/vite");
const { VitePWA } = require("vite-plugin-pwa");
const { createHtmlPlugin } = require("vite-plugin-html");
const purgecss = require("rollup-plugin-purgecss");
const {
    VueUseComponentsResolver,
    VueUseDirectiveResolver,
} = require("unplugin-vue-components/resolvers");

const SILENT = Boolean(process.env.SILENT) ?? false;
const DEV = process.env.NODE_ENV === "development" || false;
const PACKAGE = require("./package.json");

const localDependencies = Object.keys(PACKAGE.dependencies ?? []).filter(
    (dependency) =>
        Object.keys(PACKAGE.devDependencies ?? []).includes(dependency) === false &&
        dependency !== "bulma" &&
        dependency !== "addeus-common-library" &&
        dependency !== "firebase" &&
        dependency.match(/^@types\//) === null
);

/**
 * This is the main configuration file for vitejs
 *
 * @see https://vitejs.dev/config
 */
module.exports.define = function (config = {}) {
    const currentDir = process.cwd();
    const outDir = path.join(
        currentDir,
        config.output !== undefined ? config.output : "dist"
    );
    const rootDir = path.join(currentDir, "src");
    const publicDir = path.join(currentDir, "public");
    const cacheDir = path.join(currentDir, "node_modules/.vite");
    //const cacheDir = path.join(os.tmpdir(), config.output);

    // Load app-level env vars to node-level env vars.
    process.env = {
        ...process.env,
        ...loadEnv(DEV ? "development" : "production", currentDir),
        VITE_APP: config.app,
    };

    return defineConfig(async () => {
        return {
            // Project root directory (where index.html is located).
            root: rootDir,
            // Base public path when served in development or production.
            // You also need to add this base like `history: createWebHistory('my-subdirectory')`
            // in ./src/router.ts
            // base: '/my-subdirectory/',
            mode: DEV ? "development" : "production",
            base: process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : "/",
            // Directory to serve as plain static assets.
            publicDir,
            // Adjust console output verbosity.
            logLevel: SILENT ? "error" : "info",
            clearScreen: false,
            cacheDir: cacheDir,

            css: {
                devSourcemap: config.map !== undefined ? config.map : DEV,
                preprocessorOptions: {
                    scss: {
                        additionalData: config.additionalScss,
                    },
                },
            },
            optimizeDeps: {
                include: localDependencies,
                exclude: [
                    "@commitlint/prompt-cli",
                    "~pages",
                    "@intlify/unplugin-vue-i18n/messages",
                    "firebase",
                    "bulma",
                    "addeus-common-library",
                ],
            },
            resolve: {
                alias: [
                    {
                        find: "/@src",
                        replacement: rootDir,
                    },
                ],
            },
            build: {
                minify: !DEV ? "esbuild" : false,
                reportCompressedSize: !DEV,
                sourcemap: config.map !== undefined ? config.map : !DEV,
                outDir: outDir,
                emptyOutDir: true,
                //chunkSizeWarningLimit: 3000,
                rollupOptions: {
                    maxParallelFileOps: Math.max(1, cpus().length - 1),
                    // manualChunks(id) {
                    //     if (id.includes("node_modules")) {
                    //         return "vendor";
                    //     }
                    // },
                    input: {
                        app: rootDir + "/index.html",
                        "service-worker": rootDir + "/workers/index.ts",
                    },
                    output: {
                        entryFileNames: (assetInfo) => {
                            return assetInfo.name === "service-worker"
                                ? DEV
                                    ? "[name].js"
                                    : "sw.js" // put service worker in root
                                : "assets/[name].js"; // others in `assets/js/`
                        },
                    },
                    //external: [/^virtual\:/],
                },
                /* watch: {
                    include: "../../lib/**",
                },*/
            },
            server: {
                host: true,
                port: config.port !== undefined ? config.port : 8018,
                strictPort: true,
                cors: {
                    origin: "*",
                    allowedHeaders: ["User-Agent", "Accept-Encoding"],
                    credentials: true,
                },
                fs: {
                    allow: [cacheDir, currentDir],
                },
                watch: {
                    ignored: [
                        path.join(currentDir, "node_modules"),
                        path.join(currentDir, "platforms"),
                        path.join(currentDir, "plugins"),
                        path.join(currentDir, ".firebase"),
                        path.join(currentDir, "*.log"),
                        path.join(currentDir, "*.0"),
                        path.join(currentDir, ".env"),
                    ],
                    awaitWriteFinish: {
                        stabilityThreshold: 500,
                        pollInterval: 100,
                    },
                },
                hmr: {
                    overlay: false,
                    timeout: 100,
                },
            },

            plugins: [
                // tsPlugin({
                //     // cwd: rootDir,
                //     // useTsconfigDeclarationDir: true,
                //     typescript: ttypescript,
                //     // tsconfig: path.resolve(currentDir, "tsconfig.json"),
                //     // exclude: "node_modules/**",
                //     // noForceEmit: true,
                //     // noEmitOnError: true,
                // }),

                // Firebase({
                //     projectId: "track2max",
                //     root: __dirname,
                //     materializeConfig: true,
                //     targets: [
                //         "functions",
                //         "auth",
                //         "firestore",
                //         "storage",
                //         "database",
                //         "pubsub",
                //     ],
                //     showUI: true,
                //     exportPath: "../firebaseExport",
                // }),
                /**
                 * plugin-vue plugin inject vue library and allow sfc files to work (*.vue)
                 *
                 * @see https://github.com/vitejs/vite/tree/main/packages/plugin-vue
                 */
                Vue({
                    include: [/\.vue$/],
                    isProduction: !DEV,
                }),

                createHtmlPlugin({
                    minify: !DEV,
                    inject: {
                        data: process.env,
                    },
                }),

                dynamicImport(),

                /**
                 * vite-plugin-vue-i18n plugin does i18n resources pre-compilation / optimizations
                 *
                 * @see https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
                 */
                vueI18n({
                    defaultSFCLang: "json",
                    globalSFCScope: true,
                    runtimeOnly: false,
                }),

                /**
                 * vite-plugin-pages plugin generate routes based on file system
                 *
                 * @see https://github.com/hannoeru/vite-plugin-pages
                 */
                Pages({
                    pagesDir: [
                        {
                            dir: path.join(rootDir, "pages", config.path),
                            baseRoute: "",
                        },
                    ],
                }),

                /**
                 * unplugin-vue-components plugin is responsible of autoloading components
                 * documentation and md file are loaded for elements and components sections
                 *
                 * @see https://github.com/antfu/unplugin-vue-components
                 */
                Components({
                    resolvers: [
                        VueUseComponentsResolver(),
                        VueUseDirectiveResolver(),
                        // {
                        //     type: "directive",
                        //     resolve(name) {
                        //         function lowerCamelCase(s) {
                        //             return s[0].toLowerCase() + s.slice(1);
                        //         }
                        //         const p = path.join(
                        //             rootDir,
                        //             `directives/${lowerCamelCase(name)}.ts`
                        //         );
                        //         if (fs.existsSync(p)) return p;
                        //         const libPath = path.join(
                        //             rootDir,
                        //             `./node_modules/addeus-common-library/directives/${lowerCamelCase(
                        //                 name
                        //             )}.ts`
                        //         );
                        //         if (fs.existsSync(libPath)) return libPath;
                        //         const libPath = path.join(
                        //             rootDir,
                        //             `./library/directives/${lowerCamelCase(name)}.ts`
                        //         );
                        //         if (fs.existsSync(libPath)) return libPath;
                        //     },
                        // },
                    ],
                    dirs: [
                        "components",
                        "directives",
                        path.join(process.cwd(), "node_modules/addeus-common-library/components"),
                        path.join(process.cwd(), "node_modules/addeus-common-library/layouts"),
                        path.join(process.cwd(), "node_modules/addeus-common-library/directives"),
                    ],
                    extensions: ["vue", "ts"],
                    dts: "components.d.ts",
                    deep: true,
                    allowOverrides: false,
                    //allowOverrides: true,
                    include: [
                        /\.vue$/,
                        /\.vue\?vue/,
                        /\.ts$/,
                        ///[\\/]node_modules[\\/]addeus-common-library[\\/]/,
                    ],
                    exclude: [
                        /[\\/]node_modules[\\/](?!addeus-common-library[\\/])/,
                        /[\\/]\.git[\\/]/,
                        /[\\/]\.nuxt[\\/]/,
                    ],
                    version: 3,
                }),

                /**
                 * vite-plugin-purge-icons plugin is responsible of autoloading icones from multiples providers
                 *
                 * @see https://icones.netlify.app/
                 * @see https://github.com/antfu/purge-icons/tree/main/packages/vite-plugin-purge-icons
                 */
                // PurgeIcons(),

                /**
                 * vite-plugin-fonts plugin inject webfonts from differents providers
                 *
                 * @see https://github.com/stafyniaksacha/vite-plugin-fonts
                 */
                ViteFonts({
                    google: {
                        families: [
                            {
                                name: "Fira Code",
                                styles: "wght@400;600",
                            },
                            {
                                name: "Montserrat",
                                styles: "wght@500;600;700;800;900",
                            },
                            {
                                name: "Roboto",
                                styles: "wght@300;400;500;600;700",
                            },
                        ],
                    },
                    // Custom fonts.
                    custom: {
                        families: config.customFonts,
                        display: "auto",
                        preload: true,
                        prefetch: false,
                        injectTo: "head-prepend",
                    },
                }),

                /**
                 * vite-plugin-pwa generate manifest.json and register services worker to enable PWA
                 *
                 * @see https://github.com/antfu/vite-plugin-pwa
                 */
                config.pwa !== undefined
                    ? VitePWA({
                          // base: "/",
                          mode: DEV ? "development" : "production",
                          strategies: "injectManifest",
                          injectRegister: "auto",
                          registerType: "autoUpdate",
                          outDir: outDir,
                          srcDir: DEV ? "workers" : outDir,
                          filename: DEV ? "index.ts" : "sw.js",
                          injectManifest: {
                              swDest: path.join(outDir, "sw.js"),

                              swSrc: path.join(rootDir, "workers/index.ts"),
                              //     //rollupFormat: "es",
                              //     //injectionPoint: true,
                          },
                          minify: !DEV,

                          devOptions: {
                              enabled: DEV,
                              type: "module",
                          },
                          includeAssets: [
                              "favicon.svg",
                              "favicon.ico",
                              "robots.txt",
                              "apple-touch-icon.png",
                          ],
                          workbox: {
                              maximumFileSizeToCacheInBytes: 3000000,
                          },
                          manifest: {
                              start_url: "/?utm_source=pwa",
                              display: "standalone",
                              icons: [
                                  {
                                      src: "pwa-192x192.png",
                                      sizes: "192x192",
                                      type: "image/png",
                                  },
                                  {
                                      src: "pwa-512x512.png",
                                      sizes: "512x512",
                                      type: "image/png",
                                  },
                                  {
                                      src: "pwa-512x512.png",
                                      sizes: "512x512",
                                      type: "image/png",
                                      purpose: "any maskable",
                                  },
                              ],
                              ...config.pwa,
                          },
                      })
                    : undefined,

                /**
                 * rollup-plugin-purgecss plugin is responsible of purging css rules
                 * that are not used in the bundle
                 *
                 * @see https://github.com/FullHuman/purgecss/tree/main/packages/rollup-plugin-purgecss
                 */
                !DEV &&
                    purgecss({
                        content: [path.join(rootDir, "**.vue")],
                        variables: false,
                        safelist: {
                            standard: [
                                /(autv|lnil|lnir|fas?)/,
                                /-(leave|enter|appear)(|-(to|from|active))$/,
                                /^(?!(|.*?:)cursor-move).+-move$/,
                                /^router-link(|-exact)-active$/,
                                /data-v-.*/,
                            ],
                        },
                        defaultExtractor(content) {
                            const contentWithoutStyleBlocks = content.replace(
                                /<style[^]+?<\/style>/gi,
                                ""
                            );
                            return (
                                contentWithoutStyleBlocks.match(
                                    /[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g
                                ) || []
                            );
                        },
                        output: undefined,
                    }),

                /**
                 * vite-imagetools plugin allow to perform transformation (blur, resize, crop, etc)
                 * on images at build time
                 *
                 * @see https://github.com/JonasKruckenberg/vite-imagetools
                 */
                imagetools({
                    silent: SILENT,
                }),

                /**
                 * vite-plugin-imagemin optimize all images sizes from public or asset folder
                 *
                 * @see https://github.com/anncwb/vite-plugin-imagemin
                 */
                !DEV &&
                    ImageMin({
                        verbose: !SILENT,
                        gifsicle: {
                            optimizationLevel: 7,
                            interlaced: false,
                        },
                        optipng: {
                            optimizationLevel: 7,
                        },
                        mozjpeg: {
                            quality: 60,
                        },
                        pngquant: {
                            quality: [0.8, 0.9],
                            speed: 11,
                        },
                        svgo: {
                            plugins: [
                                {
                                    name: "removeViewBox",
                                    active: false,
                                },
                                {
                                    name: "removeEmptyAttrs",
                                    active: false,
                                },
                            ],
                        },
                    }),
            ],
        };
    });
};
