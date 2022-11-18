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
			const rawdata = fs.readFileSync(path.join(__dirname, `/../grabs/${file}`))
			grabList.push(JSON.parse(rawdata))
		}
	})
	return grabList
}

export const sanitizeString = (string) => {
	// remove all non-alphanumeric characters except dots and dashes
	return string.replace(/[^a-zA-Z0-9.-]/g, '')
}

export const interpolation = (params, memory) => {
	// for each param
	for (const [key, value] of Object.entries(params)) {
		// if it's a string
		if (typeof value === 'string') {
			const regex = /{{(.*?)}}/g
			const match = value.match(regex)
			if (match) {
				match.forEach(string => {
					const variable = string.match(/{{(.*?)}}/)[1]
					// if is array or object
					if (typeof memory.get(variable) === 'object' || Array.isArray(memory.get(variable)))
						params[key] = memory.get(variable)
					else
						params[key] = value.replace(string, memory.get(variable))
				})
			}
		}
	}
	return params
}