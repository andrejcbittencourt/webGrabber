import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// get all grab configs from grabs folder
export const getGrabList = () => {
	const files = fs.readdirSync(path.join(__dirname, '/../grabs'))
	const grabList = []
	files.forEach(file => {
		if(file !== '.gitkeep') {
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

export const sanitizeString = (string) => {
	// remove all non-alphanumeric characters except dots, dashes, underscores and spaces but remove spaces at the beginning and end
	return string.replace(/[^a-zA-Z0-9.-_ ]/g, '').trim()
}

export const interpolation = (params, memory) => {
	// for each param
	for (const [key, value] of Object.entries(params)) {
		// if it's a string
		if (typeof value === 'string') {
			const regex = /{{(.*?)}}/g
			const match = value.match(regex)
			if (match) {
				match.forEach(m => {
					const variable = m.match(/{{(.*?)}}/)[1]
					// if it's an array or object
					if (typeof memory.get(variable) === 'object' || Array.isArray(memory.get(variable)))
						params[key] = memory.get(variable)
					else
						params[key] = params[key].replace(m, memory.get(variable))
				})
			}
		}
	}
	return params
}