/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: true,
    rules: {
      'require-unicode-regexp': 'off',
      'prefer-destructuring': 'off',
      'unicorn/consistent-existence-index-check': 'off',
      'import-x/order': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/prefer-string-raw': 'off'
    },
    space: true
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic'
        }
      ],
      '@typescript-eslint/no-restricted-types': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface']
    }
  }
]

export default xoConfig
