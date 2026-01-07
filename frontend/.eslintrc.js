module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',

    // General rules
    'no-console': 'warn',
    'prefer-const': 'error',
  },
  ignorePatterns: ['.next/', 'node_modules/', 'out/', '*.config.js', '*.config.mjs'],
};
