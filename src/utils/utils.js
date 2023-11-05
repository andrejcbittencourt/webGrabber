import yaml from 'js-yaml'
import Chalk from '../classes/wrappers/Chalk.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import constants from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const INDENTKEY = 'INDENTATION'
const TABSIZE = 2

export const pathJoin = (...paths) => {
	return path.join(...paths)
}

export const basePathJoin = (...paths) => {
	return pathJoin(__dirname, ...paths)
}

export const fsOperation = (operation, location, ...args) => {
	const path = pathJoin(location)
	if (typeof fs[operation] === 'function') {
		return fs[operation](path, ...args)
	}
	throw new Error(`Invalid fs operation: ${operation}`)
}

// get all grab configs from grabs folder
export const getGrabList = () => {
	const files = fsOperation(constants.fsMethods.readdir, basePathJoin('../grabs'), 'utf8')
	const grabList = []
	files.forEach((file) => {
		try {
			let doc
			// if file has .yml or .yaml extension
			if (file.split('.').pop() === 'yml' || file.split('.').pop() === 'yaml')
				doc = yaml.load(
					fsOperation(constants.fsMethods.readFile, basePathJoin(`../grabs/${file}`), 'utf8'),
				)
			// if file has .json extension
			else if (file.split('.').pop() === 'json')
				doc = JSON.parse(
					fsOperation(constants.fsMethods.readFile, basePathJoin(`../grabs/${file}`), 'utf8'),
				)
			else return
			grabList.push(doc)
		} catch (e) {
			displayErrorAndExit(e)
		}
	})
	return grabList
}

export const displayError = (error) => {
	displayText([{ text: `ERROR: ${error.message}`, color: 'red', style: 'bold' }])
}

export const displayErrorAndExit = (error) => {
	displayError(error)
	// eslint-disable-next-line no-undef
	process.exit(1)
}

export const displayText = (textData, brain) => {
	if (!brain) Chalk.write(textData)
	else Chalk.write([{ text: ' '.repeat(brain.recall(INDENTKEY)) }, ...textData])
}

export const resetIndentation = (brain) => {
	brain.learn(INDENTKEY, 0)
}

export const incrementIndentation = (brain) => {
	brain.learn(INDENTKEY, brain.recall(INDENTKEY) + TABSIZE)
}

export const decrementIndentation = (brain) => {
	brain.learn(INDENTKEY, brain.recall(INDENTKEY) - TABSIZE)
}

export const sanitizeString = (string) => {
	// remove all non-alphanumeric characters and slashes
	return string.replace(/[^a-zA-Z0-9-_.:?@(), +!#$%&*;|'"=<>^]/g, '').trim()
}

export const interpolation = (params, brain) => {
	const newParams = { ...params }
	for (const [key, value] of Object.entries(newParams)) {
		if (typeof value === 'string') {
			const regex = /{{(.*?)}}/g
			const match = value.match(regex)
			if (match) {
				match.forEach((m) => {
					const variable = m.match(/{{(.*?)}}/)[1].trim()
					if (typeof brain.recall(variable) === 'object' || Array.isArray(brain.recall(variable)))
						newParams[key] = brain.recall(variable)
					else newParams[key] = newParams[key].replace(m, brain.recall(variable))
				})
			}
		} else if (Array.isArray(value)) {
			newParams[key] = value.map((item) => {
				if (typeof item === 'string' || Array.isArray(item)) {
					return interpolation({ temp: item }, brain).temp
				}
				return item
			})
		}
	}
	return newParams
}
