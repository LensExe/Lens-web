import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `dist` build output + vendored third-party design-system code (shadcn UI
  // primitives, ReUI data-grid, React Bits effects, shadcn use-mobile). We don't
  // author these — they follow upstream conventions that trip the React Compiler
  // / react-refresh rules. `tsc` still type-checks them.
  globalIgnores([
    'dist',
    'packages/ui/src/components/ui/**',
    'packages/ui/src/components/reui/**',
    'packages/ui/src/components/effects/**',
    'packages/ui/src/hooks/use-mobile.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
