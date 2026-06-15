module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Zod v4 uses `export * as ns` which the RN preset doesn't transform.
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
    // react-native-reanimated/plugin must be listed last.
    'react-native-reanimated/plugin',
  ],
};
