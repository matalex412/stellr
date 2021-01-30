module.exports = {
    parser: "babel-eslint",
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: ["eslint:recommended", "google"],
    rules: {
        "quotes": ["error", "double"],
        "indent": ["error", 4],
        "no-tabs": 0,
        "require-jsdoc": 0,
        "new-cap": 0,
    },
};
