import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import Chalk from '../classes/wrappers/Chalk.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TABSIZE = 2

// get all grab configs from grabs folder
export const getGrabList = () => {
	const files = fs.readdirSync(path.join(__dirname, '/../grabs'))
	const grabList = []
	files.forEach(file => {
		if(file !== '.gitkeep' && file !== '.DS_Store') {
			try {
				let doc
				// if file has .yml or .yaml extension
				if(file.split('.').pop() === 'yml' || file.split('.').pop() === 'yaml')
					doc = yaml.load(fs.readFileSync(path.join(__dirname, `/../grabs/${file}`), 'utf8'))
				// if file has .json extension
				else
					doc = JSON.parse(fs.readFileSync(path.join(__dirname, `/../grabs/${file}`), 'utf8'))
				grabList.push(doc)
			} catch (e) {
				displayErrorAndExit(e)
			}
		}
	})
	return grabList
}

export const displayError = (error) => {
	displayText(null, [{text: `ERROR: ${error.message}`, color: 'red', style: 'bold'}])
}

export const displayErrorAndExit = (error) => {
	displayError(error)
	// eslint-disable-next-line no-undef
	process.exit(1)
}

export const displayText = (brain, textData) => {
	if(!brain)
		Chalk.write(textData)
	else
		Chalk.write([
			{text: ' '.repeat(brain.recall('INDENTATION'))},
			...textData
		])
}

export const incrementIndentation = (brain) => {
	brain.learn('INDENTATION', brain.recall('INDENTATION') + TABSIZE)
}

export const decrementIndentation = (brain) => {
	brain.learn('INDENTATION', brain.recall('INDENTATION') - TABSIZE)
}

export const sanitizeString = (string) => {
	// remove all non-alphanumeric characters and slashes
	return string.replace(/[^a-zA-Z0-9-_.:?@(), +!#$%&*;|'"=<>^]/g, '').trim()
}

export const interpolation = (params, brain) => {
	// for each param
	for (const [key, value] of Object.entries(params)) {
		// if it's a string
		if (typeof value === 'string') {
			const regex = /{{(.*?)}}/g
			const match = value.match(regex)
			if (match) {
				match.forEach(m => {
					const variable = m.match(/{{(.*?)}}/)[1].trim()
					// if it's an array or object
					if (typeof brain.recall(variable) === 'object' || Array.isArray(brain.recall(variable)))
						params[key] = brain.recall(variable)
					else
						params[key] = params[key].replace(m, brain.recall(variable))
				})
			}
		} else if (Array.isArray(value)) { // if it's an array
			params[key] = value.map(item => {
				if (typeof item === 'string' || Array.isArray(item)) {
					return interpolation({temp: item}, brain).temp
				}
				return item
			})
		}
	}
	return params
}
