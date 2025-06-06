import test from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const {
	pathJoin,
	basePathJoin,
	fsOperation,
	sanitizeString,
	interpolation,
	resetIndentation,
	incrementIndentation,
	decrementIndentation,
	displayText,
} = await import('../src/utils/utils.js')
const { default: constants } = await import('../src/utils/constants.js')

class Brain {
	constructor() {
		this.memory = new Map()
	}
	learn(key, value) {
		this.memory.set(key, value)
	}
	recall(key) {
		return this.memory.get(key)
	}
}

test('pathJoin joins paths', () => {
	const result = pathJoin('a', 'b', 'c.txt')
	assert.strictEqual(result, path.join('a', 'b', 'c.txt'))
})

test('basePathJoin joins with utils directory', () => {
	const utilsPath = path.dirname(fileURLToPath(new URL('../src/utils/utils.js', import.meta.url)))
	const result = basePathJoin('folder')
	assert.strictEqual(result, path.join(utilsPath, 'folder'))
})

test('fsOperation performs fs methods', () => {
	const tmp = fs.mkdtempSync(path.join(process.cwd(), 'tmp-'))
	const file = path.join(tmp, 'file.txt')
	fsOperation(constants.fsMethods.writeFile, file, 'hello')
	const content = fsOperation(constants.fsMethods.readFile, file, 'utf8')
	assert.strictEqual(content, 'hello')
	fs.rmSync(tmp, { recursive: true, force: true })
})

test('sanitizeString removes invalid characters', () => {
	const result = sanitizeString('a/b')
	assert.strictEqual(result, 'ab')
})

test('interpolation replaces values from brain', () => {
	const brain = new Brain()
	brain.learn('NAME', 'John')
	const params = { greeting: 'Hello {{ NAME }}!' }
	const result = interpolation(params, brain)
	assert.strictEqual(result.greeting, 'Hello John!')
})

test('indentation helpers modify brain memory', () => {
	const brain = new Brain()
	resetIndentation(brain)
	incrementIndentation(brain)
	incrementIndentation(brain)
	decrementIndentation(brain)
	assert.strictEqual(brain.recall(constants.indentationKey), 2)
})

test('displayText writes coloured text', async () => {
	const originalLog = console.log
	let output = ''
	console.log = (msg) => {
		output = msg
	}
	displayText([{ text: 'hello', color: 'red' }])
	console.log = originalLog
	assert.ok(output.includes('hello'))
	assert.ok(/\x1b\[31m/.test(output))
})
