module.exports = {
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module'
	},
	env: {
		node: true,
		es6: true
	},
	rules: {
		'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
		'no-undef': 'error',
		'prefer-const': 'error',
		'no-var': 'error',
		semi: ['error', 'never'],
		quotes: ['error', 'single', { allowTemplateLiterals: true }],
		indent: ['error', 'tab'],
		'template-curly-spacing': ['error', 'always']
	}
}