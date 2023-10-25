/* eslint-disable no-undef */
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { ActionList } from './Actions.js'
import { 
	sanitizeString, 
	incrementIndentation, 
	decrementIndentation, 
	displayText 
} from '../../utils/utils.js'
import readline from 'readline'
import axios from 'axios'
import cliProgress from 'cli-progress'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const WAITUNTIL = 'networkidle0'

export default class CoreActionList extends ActionList {

	constructor() {
		super()
		this.load()
	}

	load() {
		super.add('setVariable', async (brain) => {
			const { key, value } = brain.recall('PARAMS')
			displayText([
				{text: ': Setting variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			], brain)
			brain.learn(key, value)
		})
		super.add('scrollWaitClick', async (brain, page) => {
			const { selector, ms = 2000 } = brain.recall('PARAMS')
			// scroll to element
			await page.evaluate((selector) => {
				const element = document.querySelector(selector)
				element.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'})
			}, selector)
			// wait for 2 seconds
			await page.waitForTimeout(ms)
			// Find the button and click it
			await page.click(selector)
		})
		super.add('transferVariable', async (brain) => {
			const { from, index, key, to } = brain.recall('PARAMS')
			let value = brain.recall(from)
			displayText([
				{text: ': Transferring variable ', color: 'white', style:'italic'},
				{text: from, color: 'gray', style:'italic'},
				{text: ' to ', color: 'white', style:'italic'},
				{text: to, color: 'gray', style:'italic'}
			], brain)
			if(index !== undefined)
				value = value[index]
			else if(key !== undefined) {
				value = typeof value === 'string' ? JSON.parse(value) : value
				value = value[key]
			}
			brain.learn(to, value)
		})
		super.add('getVariable', async (brain) => {
			const { key, index } = brain.recall('PARAMS')
			const value = brain.recall(key)
			displayText([
				{text: ': Getting variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			], brain)
			brain.learn('INPUT', index !== undefined ? value[index] : value)
		})
		super.add('deleteVariable', async (brain) => {
			const { key } = brain.recall('PARAMS')
			displayText([
				{text: ': Deleting variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			], brain)
			brain.forget(key)
		})
		super.add('puppeteer', async (brain, page) => {
			const { func, func2, ...params } = brain.recall('PARAMS')
			displayText([
				{text: ': Puppeteer ', color: 'white', style:'italic'},
				{text: func, color: 'gray', style:'italic'},
				{text: func2 ? '.' + func2 : '', color: 'gray', style:'italic'}
			], brain)
			let result
			if(func2)
				result = await page[func][func2](...Object.values(params))
			else
				result = await page[func](...Object.values(params))
			brain.learn('INPUT', result)
		})
		super.add('userInput', async (brain) => {
			const { query } = brain.recall('PARAMS')
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			})
	
			const prompt = (query) => new Promise((resolve) => rl.question(query, resolve))
			
			await (async() => {
				try {
					const input = await prompt(' '.repeat(brain.recall('INDENTATION')) + query)
					brain.learn('INPUT', input)
					rl.close()
				} catch (e) {
					throw new Error(e)
				}
			})()
		})
		super.add('getExtension', async (brain) => {
			const { string } = brain.recall('PARAMS')
			const extension = path.extname(string)
			brain.learn('INPUT', extension)
		})
		super.add('countStart', async (brain) => {
			const { key, value } = brain.recall('PARAMS')
			displayText([
				{text: ': Starting count ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'},
				{text: ' with value ', color: 'white', style:'italic'},
				{text: value?value:0, color: 'gray', style:'italic'}
			], brain)
			if(!value)
				brain.learn(key, 0)
			else
				brain.learn(key, value)
		})
		super.add('countIncrement', async (brain) => {
			const { key } = brain.recall('PARAMS')
			const count = brain.recall(key) + 1
			displayText([
				{text: ': Incrementing count ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'},
				{text: ' to ', color: 'white', style:'italic'},
				{text: count, color: 'gray', style:'italic'}
			], brain)
			brain.learn(key, count)
		})
		super.add('countDecrement', async (brain) => {
			const { key } = brain.recall('PARAMS')
			const count = brain.recall(key) - 1
			displayText([
				{text: ': Decrementing count ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'},
				{text: ' to ', color: 'white', style:'italic'},
				{text: count, color: 'gray', style:'italic'}
			], brain)
			brain.learn(key, count)
		})
		super.add('sleep', async (brain) => {
			const { ms } = brain.recall('PARAMS')
			displayText([
				{text: ': Sleeping ', color: 'white', style:'italic'},
				{text: ms, color: 'gray', style:'italic'},
				{text: ' ms', color: 'white', style:'italic'}
			], brain)
			await new Promise(resolve => setTimeout(resolve, ms))
		})
		super.add('setCurrentDir', async (brain) => {
			let { dir, useBaseDir = false } = brain.recall('PARAMS')
			dir = sanitizeString(dir)
			if(!fs.existsSync(path.join(brain.recall('CURRENT_DIR'), dir)))
				throw new Error(`Directory ${dir} does not exist`)
			displayText([
				{text: ': Setting current dir to ', color: 'white', style:'italic'},
				{text: dir, color: 'gray', style:'italic'}
			], brain)
			brain.learn('CURRENT_DIR', path.join(useBaseDir ? brain.recall('BASE_DIR') : brain.recall('CURRENT_DIR'), dir))
		})
		super.add('setBaseDir', async (brain) => {
			const { dir } = brain.recall('PARAMS')
			brain.learn('BASE_DIR', path.join(__dirname, `../../resources/${dir}`))
			if(!fs.existsSync(brain.recall('BASE_DIR')))
				fs.mkdirSync(brain.recall('BASE_DIR'))
		})
		super.add('resetCurrentDir', async (brain) => {
			brain.learn('CURRENT_DIR', brain.recall('BASE_DIR'))
		})
		super.add('backToParentDir', async (brain) => {
			if(brain.recall('CURRENT_DIR') === brain.recall('BASE_DIR'))
				return
			brain.learn('CURRENT_DIR', brain.recall('CURRENT_DIR').split('/').slice(0, -1).join('/'))
		})
		super.add('sanitizeString', async (brain) => {
			const { string } = brain.recall('PARAMS')
			brain.learn('INPUT', sanitizeString(string))
		})
		super.add('random', async (brain) => {
			const { min, max } = brain.recall('PARAMS')
			const minNumber = Number(min)
			const maxNumber = Number(max)
			displayText([
				{text: ': Generating random number between ', color: 'white', style:'italic'},
				{text: minNumber, color: 'gray', style:'italic'},
				{text: ' and ', color: 'white', style:'italic'},
				{text: maxNumber, color: 'gray', style:'italic'}
			], brain)
			brain.learn('INPUT', Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber)
		})
		super.add('uuid', async (brain) => {
			const uuid = uuidv4()
			brain.learn('INPUT', uuid)
			displayText([
				{text: ': Generating uuid ', color: 'white', style:'italic'},
				{text: uuid, color: 'gray', style:'italic'}
			], brain)
		})
		super.add('screenshot', async (brain, page) => {
			const { name, type, fullPage } = brain.recall('PARAMS')
			const validatedType = ['jpeg', 'png'].includes(type) ? type : 'png'
			const filename = `${sanitizeString(name)}.${validatedType}`
			const filePath = path.join(brain.recall('CURRENT_DIR'), filename)
			displayText([
				{text: ': Taking screenshot ', color: 'white', style:'italic'},
				{text: name, color: 'gray', style:'italic'}
			], brain)
			await page.screenshot({
				path: filePath,
				type: validatedType,
				fullPage: fullPage ? fullPage : true
			})
		})
		super.add('screenshotElement', async (brain, page) => {
			const { name, type, selector } = brain.recall('PARAMS')
			const validatedType = ['jpeg', 'png'].includes(type) ? type : 'png'
			const filename = `${sanitizeString(name)}.${validatedType}`
			const filePath = path.join(brain.recall('CURRENT_DIR'), filename)
			displayText([
				{text: ': Taking screenshot of element ', color: 'white', style:'italic'},
				{text: name, color: 'gray', style:'italic'}
			], brain)
			const elementHandle = await page.$(selector)

			const boxModel = await elementHandle.boxModel()
			const paddingLeft = boxModel.border[3].x - boxModel.margin[3].x
			const paddingRight = boxModel.margin[1].x - boxModel.border[1].x
			const paddingTop = boxModel.border[0].y - boxModel.margin[0].y
			const paddingBottom = boxModel.margin[2].y - boxModel.border[2].y
			const totalHeight = boxModel.height + paddingTop + paddingBottom

			await elementHandle.screenshot({
				path: filePath,
				clip: {
					x: boxModel.border[0].x,
					y: boxModel.border[0].y,
					width: boxModel.width - paddingLeft - paddingRight,
					height: totalHeight
				},
			})
		})
		super.add('replaceString', async (brain) => {
			const { string, search, replace } = brain.recall('PARAMS')
			brain.learn('INPUT', string.replace(search, replace))
		})
		super.add('matchFromString', async (brain) => {
			const { regex, string } = brain.recall('PARAMS')
			const regexMatch = new RegExp(regex, 'g')
			const match = regexMatch.exec(string)
			if(match)
				brain.learn('INPUT', match[0])
			else
				brain.learn('INPUT', '')
		})
		super.add('matchFromSelector', async (brain, page) => {
			const { selector, regex } = brain.recall('PARAMS')
			let html = ''
			try {
				html = await page.$eval(selector, el => el.innerHTML)
			} catch(e) {
				displayText([
					{text: ': No element found', color: 'gray', style:'italic'}
				], brain)
			}
			const regexMatch = new RegExp(regex, 'g')
			const matches = []
			let match = regexMatch.exec(html)
			while (match) {
				matches.push(match[0])
				match = regexMatch.exec(html)
			}
			brain.learn('INPUT', matches)
		})
		super.add('elementExists', async (brain, page) => {
			const { selector } = brain.recall('PARAMS')
			const element = await page.$(selector)
			brain.learn('INPUT', element ? true : false)
		})
		super.add('getChildren', async (brain, page) => {
			const { selectorParent, selectorChild, attribute } = brain.recall('PARAMS')
			const parents = await page.$$(selectorParent)
			const result = []
			for(const parent of parents) {
				const parentChildren = await parent.$$(selectorChild)
				if(parentChildren) {
					const children = []
					for(const child of parentChildren) {
						if(attribute)
							children.push(await page.evaluate((element, attribute) => element.getAttribute(attribute), child, attribute))
						else
							children.push(await page.evaluate((element) => element.textContent, child))
					}
					result.push(children)
				}
			}
			brain.learn('INPUT', result)
		})
		super.add('getElements', async (brain, page) => {
			const { selector, attribute } = brain.recall('PARAMS')
			let content = []
			const elements = await page.$$(selector)
			for(let i = 0; i < elements.length; i++) {
				const element = elements[i]
				if(attribute)
					content.push(await page.evaluate((element, attribute) => element.getAttribute(attribute), element, attribute))
				else
					content.push(await page.evaluate((element) => element.textContent, element))
			}
			brain.learn('INPUT', content)
		})
		super.add('appendToVariable', async (brain) => {
			const { key, value } = brain.recall('PARAMS')
			let content = brain.recall(key)
			if(content === undefined)
				content = []
			content.push(value)
			displayText([
				{text: ': Appending to variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			], brain)
			brain.learn(key, content)
		})
		super.add('login', async (brain, page) => {
			const { 
				url,
				usernameSelector, 
				username, 
				passwordSelector, 
				password, 
				submitSelector,
				cookieName
			} = brain.recall('PARAMS')
			incrementIndentation(brain)
			const cookiesDir = path.join(brain.recall('BASE_DIR'), 'cookies')
			if(fs.existsSync(`${cookiesDir}/cookies.json`)) {
				displayText([
					{text: ': Loading cookies', style:'italic'}
				], brain)
				const cookies = JSON.parse(fs.readFileSync(`${cookiesDir}/cookies.json`))
				const accessToken = cookieName ? cookies.find(cookie => cookie.name === cookieName) : cookies[0]
				if(new Date(accessToken.expires * 1000) > new Date()) {
					await page.setCookie(...cookies)
					displayText([
						{text: ': Cookies loaded', style:'italic'}
					], brain)
					decrementIndentation(brain)
					return
				} else {
					fs.unlinkSync(`${cookiesDir}/cookies.json`)
					displayText([
						{text: ': Cookies expired', style:'italic'}
					], brain)
				}
			}
			brain.learn('PARAMS', {url: url, func: 'goto', options: {waitUntil: WAITUNTIL}})
			await brain.perform('puppeteer', page)
			displayText([
				{text: ': Page loaded', style:'italic'}
			], brain)
			await page.waitForSelector(usernameSelector, { visible: true })
			brain.learn('PARAMS', {selector: usernameSelector, text: username})
			await brain.perform('type', page)
			await page.waitForSelector(passwordSelector, { visible: true })
			brain.learn('PARAMS', {selector: passwordSelector, text: password, secret: true})
			await brain.perform('type', page)
			displayText([
				{text: ': Credentials entered', style:'italic'}
			], brain)
			await page.waitForSelector(submitSelector, { visible: true })
			brain.learn('PARAMS', {selector: submitSelector})
			await brain.perform('click', page)
			displayText([
				{text: ': Login submitted', style:'italic'}
			], brain)
			await page.waitForNavigation({
				waitUntil: WAITUNTIL
			})
			const cookies = await page.cookies()
			if(cookies.length > 0) {
				// check if cookies dir exists
				if(!fs.existsSync(cookiesDir)){
					brain.learn('PARAMS', {dir: 'cookies', useBaseDir: true})
					await brain.perform('createDir', page)
				}
				fs.writeFileSync(`${cookiesDir}/cookies.json`, JSON.stringify(cookies), (err) => {
					if(err) throw err
					displayText([
						{text: ': Cookies saved', style:'italic'}
					], brain)
				})
			}
			decrementIndentation(brain)
		})
		super.add('createDir', async (brain) => {
			let { dir, useBaseDir = false } = brain.recall('PARAMS')
			dir = sanitizeString(dir)
			displayText([
				{text: ': Creating directory ', color: 'white', style:'italic'},
				{text: dir, color: 'gray', style:'italic'}
			], brain)
			const dirPath = path.join(useBaseDir ? brain.recall('BASE_DIR') : brain.recall('CURRENT_DIR'), dir)
			if(!fs.existsSync(dirPath))
				fs.mkdirSync(dirPath)
		})
		super.add('type', async (brain, page) => {
			const { selector, text, secret = false } = brain.recall('PARAMS')
			displayText([
				{text: ': Typing ', color: 'white', style:'italic'},
				{text: secret ? '•••••' : text, color: 'gray', style:'italic'},
			], brain)
			await page.waitForSelector(selector, { visible: true })
			await page.type(selector, text)
		})
		super.add('if', async (brain, page) => {
			const { condition, actions } = brain.recall('PARAMS')
			displayText([
				{text: ': Condition: ', style:'italic'},
				{text: condition, style:'bold'}
			], brain)
			if(eval(condition)) {
				displayText([
					{text: ': Condition is true', style:'italic'}
				], brain)
				incrementIndentation(brain)
				for(let i = 0; i < actions.length; i++) {
					const action = actions[i]
					brain.learn('PARAMS', action.params)
					await brain.perform(action.name, page)
				}
				decrementIndentation(brain)
				displayText([
					{text: ': End of if', style:'italic'}
				], brain)
			} else {
				displayText([
					{text: ': Condition is false', style:'italic'}
				], brain)
			}
		})
		super.add('ifElse', async (brain, page) => {
			const { condition, actions, elseActions } = brain.recall('PARAMS')
			displayText([
				{text: ': Condition: ', style:'italic'},
				{text: condition, style:'bold'}
			], brain)
			if(eval(condition)) {
				displayText([
					{text: ': Condition is true', style:'italic'}
				], brain)
				incrementIndentation(brain)
				for(let i = 0; i < actions.length; i++) {
					const action = actions[i]
					brain.learn('PARAMS', action.params)
					await brain.perform(action.name, page)
				}
				decrementIndentation(brain)
				displayText([
					{text: ': End of if', style:'italic'}
				], brain)
			} else {
				displayText([
					{text: ': Condition is false', style:'italic'}
				], brain)
				incrementIndentation(brain)
				for(let i = 0; i < elseActions.length; i++) {
					const action = elseActions[i]
					brain.learn('PARAMS', action.params)
					await brain.perform(action.name, page)
				}
				decrementIndentation(brain)
				displayText([
					{text: ': End of if', style:'italic'}
				], brain)
			}
		})
		super.add('createFile', async (brain) => {
			const { filename } = brain.recall('PARAMS')
			displayText([
				{text: ': Creating file ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}/${filename}.txt`, style:'bold'}
			], brain)
			fs.appendFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, '')
		})
		super.add('click', async (brain, page) => {
			const { selector, attribute, text } = brain.recall('PARAMS')
			if(attribute || text) {
				const elements = await page.$$(selector)
				for(let i = 0; i < elements.length; i++) {
					const element = elements[i]
					if(attribute && text) {
						const content = await page.evaluate((element, attribute) => element.getAttribute(attribute), element, attribute)
						if(content === text) {
							await element.click()
							break
						}
					} else if(text) {
						const content = await page.evaluate((element) => element.textContent, element)
						if(content === text) {
							await element.click()
							break
						}
					}
				}
			} else {
				await page.waitForSelector(selector, { visible: true })
				await page.click(selector)
			}
		})
		super.add('clickAll', async (brain, page) => {
			const { selector } = brain.recall('PARAMS')
			const elements = await page.$$(selector)
			for(let i = 0; i < elements.length; i++) {
				const element = elements[i]
				await page.waitForFunction((element) => {
					element.scrollIntoView()
					const { top, left, bottom, right } = element.getBoundingClientRect()
					return top >= 0 && left >= 0 && bottom <= (window.innerHeight || document.documentElement.clientHeight) && right <= (window.innerWidth || document.documentElement.clientWidth)
				}, {}, element)
				await element.click()
			}
		})
		super.add('readFromText', async (brain) => {
			const { filename, breakLine = false } = brain.recall('PARAMS')
			displayText([
				{text: ': Reading from file ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			], brain)
			const content = fs.readFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, 'utf8')
			if(breakLine) {
				// add to brain using an array
				brain.learn('INPUT', content.split('\n'))
			} else {
				// add to brain using a string
				brain.learn('INPUT', content)
			}
		})
		super.add('fileExists', async (brain) => {
			const { filename } = brain.recall('PARAMS')
			displayText([
				{text: ': Checking if file exists ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}/${filename}`, color: 'gray', style:'italic'}
			], brain)
			const exists = fs.existsSync(`${brain.recall('CURRENT_DIR')}/${filename}`)
			brain.learn('INPUT', exists)
		})
		super.add('deleteFile', async (brain) => {
			const { filename } = brain.recall('PARAMS')
			displayText([
				{text: ': Deleting file ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			], brain)
			if(fs.existsSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`))
				fs.unlinkSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`)
		})
		super.add('deleteFolder', async (brain) => {
			const { foldername } = brain.recall('PARAMS')
			displayText([
				{text: ': Deleting folder ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}/${foldername}`, color: 'gray', style:'italic'}
			], brain)
			if(fs.existsSync(`${brain.recall('CURRENT_DIR')}/${foldername}`))
				fs.rmdirSync(`${brain.recall('CURRENT_DIR')}/${foldername}`, { recursive: true })
		})
		super.add('listFolders', async (brain) => {
			displayText([
				{text: ': Listing folders ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}`, color: 'gray', style:'italic'}
			], brain)
			const folders = fs.readdirSync(brain.recall('CURRENT_DIR'), { withFileTypes: true })
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name)
			brain.learn('INPUT', folders)
		})
		super.add('checkStringInFile', async (brain) => {
			const { filename, string } = brain.recall('PARAMS')
			displayText([
				{text: ': Checking if string is in file ', style:'italic'},
				{text: `${brain.recall('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			], brain)
			const content = fs.readFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, 'utf8')
			brain.learn('INPUT', content.includes(string))
		})
		super.add('saveToText', async (brain) => {
			const { key, filename } = brain.recall('PARAMS')
			const content = brain.recall(key)
			if(content) {
				displayText([
					{text: ': Saving ', color: 'white', style:'italic'},
					{text: `${brain.recall('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
				], brain)
				if(Array.isArray(content))
					fs.writeFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, content.join('\n'))
				else
					fs.writeFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, content)
			}
		})
		super.add('appendToText', async (brain) => {
			const { key, filename } = brain.recall('PARAMS')
			const content = brain.recall(key)
			if(content) {
				displayText([
					{text: ': Appending to ', color: 'white', style:'italic'},
					{text: `${brain.recall('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
				], brain)
				if(Array.isArray(content))
					fs.appendFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, content.join('\n'))
				else
					fs.appendFileSync(`${brain.recall('CURRENT_DIR')}/${filename}.txt`, content+'\n')
			}
		})
		super.add('download', async (brain) => {
			const { url, filename, host } = brain.recall('PARAMS')
			const name = filename ?? url.split('/').pop()
			const sanitizedFilename = sanitizeString(name)
			const needsHost = !url.startsWith('http')

			displayText([
				{text: ': Downloading ', color: 'white', style:'italic'},
				{text: name, color: 'gray', style:'italic'}
			], brain)
			const response = await axios({
				url: needsHost ? `${host}${url}` : url,
				method: 'GET',
				responseType: 'stream'
			})

			const writer = fs.createWriteStream(`${brain.recall('CURRENT_DIR')}/${sanitizedFilename}`)

			const progressBar = new cliProgress.SingleBar({
				format: ' {bar} {percentage}% | {value}/{total} MB',
				barCompleteChar: '\u2588',
				barIncompleteChar: '\u2591',
				hideCursor: true,
				gracefulExit: true
			}, cliProgress.Presets.shades_classic)

			let current = 0

			progressBar.start(parseInt(response.headers['content-length'] / (1024 * 1024)), current)

			response.data.on('data', (chunk) => {
				current += (chunk.length / (1024 * 1024))
				progressBar.update(parseInt(current))
			})

			response.data.pipe(writer)

			return new Promise((resolve, reject) => {
				writer.on('finish', () => {
					progressBar.stop()
					resolve()
				})
				writer.on('error', reject)
			})
		})
		super.add('log', async (brain) => {
			const { text, color, background } = brain.recall('PARAMS')
			displayText([
				{text: `: ${text}`, color, background, style:'italic'}
			], brain)
		})
		super.add('forEach', async (brain, page) => {
			const { key, actions } = brain.recall('PARAMS')
			const value = brain.recall(key)
			const valueLength = value.length
			incrementIndentation(brain)
			for(let i = 0; i < value.length; i++) {
				displayText([
					{text: `: ${key}[${i+1}/${valueLength}]`, color:'yellow', style:'italic'},
					{text: `: ${sanitizeString(value[i])}`, color:'white', style:'italic'}
				], brain)
				brain.learn('INPUT', value[i])
				for(let action of actions) {
					brain.learn('PARAMS', action.params)
					await brain.perform(action.name, page)
				}
			}
			decrementIndentation(brain)
			displayText([
				{text: ': End of forEach', color:'yellow', style:'italic'}
			], brain)
		})
		super.add('for', async (brain, page) => {
			const { from, until, step, actions } = brain.recall('PARAMS')
			incrementIndentation(brain)
			for(let i = from; i <= until; i+=step) {
				displayText([
					{text: `: [${i}/${until}]`, color:'yellow', style:'italic'}
				], brain)
				brain.learn('INPUT', i)
				for(let action of actions) {
					brain.learn('PARAMS', action.params)
					await brain.perform(action.name, page)
				}
			}
			decrementIndentation(brain)
			displayText([
				{text: ': End of for loop', color:'yellow', style:'italic'}
			], brain)
		})
		super.add('while', async (brain, page) => {
			const { condition, actions } = brain.recall('PARAMS')
			incrementIndentation(brain)
			while(eval(condition)) {
				for(let action of actions) {
					brain.learn('PARAMS', action.params)
					await brain.perform(action.name, page)
				}
			}
			decrementIndentation(brain)
			displayText([
				{text: ': End of while loop', color:'yellow', style:'italic'}
			], brain)
		})
	}
}