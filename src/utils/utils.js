import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import Chalk from '../classes/wrappers/Chalk.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// get all grab configs from grabs folder
export const getGrabList = () => {
	const files = fs.readdirSync(path.join(__dirname, '/../grabs'))
	const grabList = []
	files.forEach(file => {
		if(file !== '.gitkeep' && file !== '.DS_Store') {
			try {
				let doc
				// if file has .yml extension
				if(file.split('.').pop() === 'yml' || file.split('.').pop() === 'yaml')
					doc = yaml.load(fs.readFileSync(path.join(__dirname, `/../grabs/${file}`), 'utf8'))
				// if file has .json extension
				else 
					doc = fs.readFileSync(path.join(__dirname, `/../grabs/${file}`))
				grabList.push(doc)
			} catch (e) {
				console.log(e)
			}
		}
	})
	return grabList
}

export const displayError = (error) => {
	Chalk.write([{text: `ERROR: ${error.message}`, color: 'red', style: 'bold'}])
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
					const variable = m.match(/{{(.*?)}}/)[1]
					// remove trailing and leading spaces
					variable.trim()
					// if it's an array or object
					if (typeof brain.recall(variable) === 'object' || Array.isArray(brain.recall(variable)))
						params[key] = brain.recall(variable)
					else
						params[key] = params[key].replace(m, brain.recall(variable))
				})
			}
		}
	}
	return params
}