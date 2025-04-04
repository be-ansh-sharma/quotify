module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            utils: "./utils",
            components: "./components",
            app: "./app",
            stores: "./stores",
            styles: "./styles",
          },
        },
      ],
    ],
  };
};
