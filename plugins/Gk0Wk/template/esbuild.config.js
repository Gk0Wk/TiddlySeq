/* Config here */
const distributingTiddlers = [
  {
    entryPoints: ["./src/index.ts"],
    outfile: "./dist/index.js",
  },
];
const defaultBuildingOptions = {
  bundle: true,
  // minify: true,
  // minifyWhitespace: true,
  // minifyIdentifiers: true,
  // minifySyntax: true,
  platform: "browser",
  format: "iife",
  treeShaking: true,
  target: "es2015", // es6
  external: ["$:/*"],
};

/* Build */
const esbuild = require("esbuild");
const promises = [];
distributingTiddlers.forEach((distributingTiddler) => {
  promises.push(
    esbuild.build({
      ...defaultBuildingOptions,
      ...distributingTiddler,
    })
  );
});
Promise.all(promises);
