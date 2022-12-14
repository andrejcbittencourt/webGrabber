/* eslint-disable no-undef */
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import ActionList from './ActionList.js'
import Chalk from './Chalk.js'
import { sanitizeString } from '../utils/utils.js'
import robot from 'robotjs'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TABSIZE = 2
const WAITUNTIL = 'networkidle0'

export default class CoreActions extends ActionList {

	constructor() {
		super()
	}

	load() {
		this.addAction('setVariable', async (memory) => {
			const { key, value } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Setting variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			]))
			memory.set(key, value)
		})
		this.addAction('getVariable', async (memory) => {
			const { key, index } = memory.get('PARAMS')
			const value = memory.get(key)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Getting variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			]))
			memory.set('INPUT', index !== undefined ? value[index] : value)
		})
		this.addAction('deleteVariable', async (memory) => {
			const { key } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Deleting variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			]))
			memory.delete(key)
		})
		this.addAction('goTo', async (memory, page) => {
			const { url } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Going to ', color: 'white', style:'italic'},
				{text: url, color: 'gray', style:'italic'}
			]))
			await page.goto(`${url}`, {
				waitUntil: WAITUNTIL
			})
		})
		this.addAction('countStart', async (memory) => {
			const { key, value } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Starting count ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'},
				{text: ' with value ', color: 'white', style:'italic'},
				{text: value?value:0, color: 'gray', style:'italic'}
			]))
			if(!value)
				memory.set(key, 0)
			else
				memory.set(key, value)
		})
		this.addAction('userInput', async (memory) => {
			const { query } = memory.get('PARAMS')
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			})
	
			const prompt = (query) => new Promise((resolve) => rl.question(query, resolve))
			
			await (async() => {
				try {
					const input = await prompt(query)
					memory.set('INPUT', input)
					rl.close()
				} catch (e) {
					throw new Error(e)
				}
			})()
		})
		this.addAction('getExtension', async (memory) => {
			const { string } = memory.get('PARAMS')
			const extension = path.extname(string)
			memory.set('INPUT', extension)
		})
		this.addAction('countIncrement', async (memory) => {
			const { key } = memory.get('PARAMS')
			const count = memory.get(key) + 1
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Incrementing count ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'},
				{text: ' to ', color: 'white', style:'italic'},
				{text: count, color: 'gray', style:'italic'}
			]))
			memory.set(key, count)
		})
		this.addAction('countDecrement', async (memory) => {
			const { key } = memory.get('PARAMS')
			const count = memory.get(key) - 1
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Decrementing count ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'},
				{text: ' to ', color: 'white', style:'italic'},
				{text: count, color: 'gray', style:'italic'}
			]))
			memory.set(key, count)
		})
		this.addAction('waitForPageTimeout', async (memory, page) => {
			const { ms } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Waiting for ', color: 'white', style:'italic'},
				{text: ms, color: 'gray', style:'italic'},
				{text: ' ms', color: 'white', style:'italic'}
			]))
			await page.waitForTimeout(ms)
		})
		this.addAction('sleep', async (memory) => {
			const { ms } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Sleeping ', color: 'white', style:'italic'},
				{text: ms, color: 'gray', style:'italic'},
				{text: ' ms', color: 'white', style:'italic'}
			]))
			await new Promise(resolve => setTimeout(resolve, ms))
		})
		this.addAction('setCurrentDir', async (memory) => {
			let { dir } = memory.get('PARAMS')
			dir = sanitizeString(dir)
			// check if dir exists
			if(!fs.existsSync(path.join(memory.get('CURRENT_DIR'), dir)))
				throw new Error(`Directory ${dir} does not exist`)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Setting current dir to ', color: 'white', style:'italic'},
				{text: dir, color: 'gray', style:'italic'}
			]))
			memory.set('CURRENT_DIR', path.join(memory.get('CURRENT_DIR'), dir))
		})
		this.addAction('resetCurrentDir', async (memory) => {
			memory.set('CURRENT_DIR', path.join(__dirname, '../resources'))
		})
		this.addAction('setCookiesDir', async (memory) => {
			memory.set('COOKIES_DIR', path.join(__dirname, '../cookies'))
		})
		this.addAction('backToParentDir', async (memory) => {
			memory.set('CURRENT_DIR', memory.get('CURRENT_DIR').split('/').slice(0, -1).join('/'))
		})
		this.addAction('sanitizeString', async (memory) => {
			const { string } = memory.get('PARAMS')
			memory.set('INPUT', sanitizeString(string))
		})
		this.addAction('random', async (memory) => {
			const { min, max } = memory.get('PARAMS')
			// convert to number
			const minNumber = Number(min)
			const maxNumber = Number(max)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Generating random number between ', color: 'white', style:'italic'},
				{text: minNumber, color: 'gray', style:'italic'},
				{text: ' and ', color: 'white', style:'italic'},
				{text: maxNumber, color: 'gray', style:'italic'}
			]))
			memory.set('INPUT', Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber)
		})
		this.addAction('uuid', async (memory) => {
			const uuid = uuidv4()
			memory.set('INPUT', uuid)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Generating uuid ', color: 'white', style:'italic'},
				{text: uuid, color: 'gray', style:'italic'}
			]))
		})
		this.addAction('setUserAgent', async (memory, page) => {
			const { userAgent } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Setting user agent to ', color: 'white', style:'italic'},
				{text: userAgent, color: 'gray', style:'italic'}
			]))
			await page.setUserAgent(userAgent)
		})
		this.addAction('screenshot', async (memory, page) => {
			const { name, type } = memory.get('PARAMS')
			const validatedType = ['jpeg', 'png'].includes(type) ? type : 'png'
			const filename = `${sanitizeString(name)}.${validatedType}`
			const filePath = path.join(memory.get('CURRENT_DIR'), sanitizeString(filename))
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Taking screenshot ', color: 'white', style:'italic'},
				{text: name, color: 'gray', style:'italic'}
			]))
			await page.screenshot({
				path: filePath,
				type: validatedType,
				fullPage: true
			})
		})
		this.addAction('matchFromString', async (memory) => {
			const { regex, string } = memory.get('PARAMS')
			const regexMatch = new RegExp(regex, 'g')
			const match = regexMatch.exec(string)
			if (match)
				memory.set('INPUT', match[1])
			else
				memory.set('INPUT', '')
		})
		this.addAction('matchFromSelector', async (memory, page) => {
			const { selector, regex } = memory.get('PARAMS')
			const html = await page.$eval(selector, el => el.innerHTML)
			const regexMatch = new RegExp(regex, 'g')
			const matches = []
			let match = regexMatch.exec(html)
			while (match) {
				matches.push(match[0])
				match = regexMatch.exec(html)
			}
			memory.set('INPUT', matches)
		})
		this.addAction('elementExists', async (memory, page) => {
			const { selector } = memory.get('PARAMS')
			const element = await page.$(selector)
			memory.set('INPUT', element ? true : false)
		})
		this.addAction('getChildren', async (memory, page) => {
			const { selectorParent, selectorChild, attribute } = memory.get('PARAMS')
			// get children of parents that match selector
			const parents = await page.$$(selectorParent)
			const result = []
			for (const parent of parents) {
				const parentChildren = await parent.$$(selectorChild)
				if (parentChildren) {
					const children = []
					for (const child of parentChildren) {
						if(attribute)
							children.push(await page.evaluate((element, attribute) => element.getAttribute(attribute), child, attribute))
						else
							children.push(await page.evaluate((element) => element.textContent, child))
					}
					result.push(children)
				}
			}
			memory.set('INPUT', result)
		})
		this.addAction('getElements', async (memory, page) => {
			const { selector, attribute } = memory.get('PARAMS')
			let content = []
			const elements = await page.$$(selector)
			for (let i = 0; i < elements.length; i++) {
				const element = elements[i]
				if(attribute)
					content.push(await page.evaluate((element, attribute) => element.getAttribute(attribute), element, attribute))
				else
					content.push(await page.evaluate((element) => element.textContent, element))
			}
			memory.set('INPUT', content)
		})
		this.addAction('appendToVariable', async (memory) => {
			const { key, value } = memory.get('PARAMS')
			let content = memory.get(key)
			if(content === undefined)
				content = []
			content.push(value)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Appending to variable ', color: 'white', style:'italic'},
				{text: key, color: 'gray', style:'italic'}
			]))
			memory.set(key, content)
		})
		this.addAction('login', async (memory, page) => {
			const { 
				usernameSelector, 
				username, 
				passwordSelector, 
				password, 
				submitSelector,
				cookiesFile
			} = memory.get('PARAMS')
			const cookiesDir = memory.get('COOKIES_DIR')
			if(fs.existsSync(`${cookiesDir}/${cookiesFile}.cookies.json`)) {
				const cookies = JSON.parse(fs.readFileSync(`${cookiesDir}/${cookiesFile}.cookies.json`))
				await page.setCookie(...cookies)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Cookies loaded', style:'italic'}
				]))
			} else {
				await this.runAction('goTo', memory, page)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Page loaded', style:'italic'}
				]))
				await page.waitForSelector(usernameSelector, { visible: true })
				memory.set('PARAMS', {selector: usernameSelector, text: username})
				await this.runAction('type', memory, page)
				await page.waitForSelector(passwordSelector, { visible: true })
				memory.set('PARAMS', {selector: passwordSelector, text: password})
				await this.runAction('type', memory, page)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Credentials entered', style:'italic'}
				]))
				await page.waitForSelector(submitSelector, { visible: true })
				memory.set('PARAMS', {selector: submitSelector})
				await this.runAction('click', memory, page)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Login submitted', style:'italic'}
				]))
				await page.waitForNavigation({
					waitUntil: WAITUNTIL
				})
				const cookies = await page.cookies()
				fs.writeFileSync(`${cookiesDir}/${cookiesFile}.cookies.json`, JSON.stringify(cookies), (err) => {
					if(err) throw err
					Chalk.write(Chalk.create([
						{text: ' '.repeat(memory.get('IDENTATION'))},
						{text:': Cookies saved', style:'italic'}
					]))
				})
			}
		})
		this.addAction('createDir', async (memory) => {
			let { dir } = memory.get('PARAMS')
			dir = sanitizeString(dir)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Creating directory ', color: 'white', style:'italic'},
				{text: dir, color: 'gray', style:'italic'}
			]))
			if(!fs.existsSync(`${memory.get('CURRENT_DIR')}/${dir}`))
				fs.mkdirSync(`${memory.get('CURRENT_DIR')}/${dir}`)
		})
		this.addAction('type', async (memory, page) => {
			const { selector, text } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Typing ', color: 'white', style:'italic'},
				{text: text, color: 'gray', style:'italic'}
			]))
			await page.waitForSelector(selector, { visible: true })
			await page.type(selector, text)
		})
		this.addAction('if', async (memory, page) => {
			const { condition, actions } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Condition: ', style:'italic'},
				{text:condition, style:'bold'}
			]))
			if(eval(condition)) {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Condition is true', style:'italic'}
				]))
				memory.set('IDENTATION', memory.get('IDENTATION') + TABSIZE)
				for(let i = 0; i < actions.length; i++) {
					const action = actions[i]
					memory.set('PARAMS', action.params)
					await this.runAction(action.name, memory, page)
				}
				memory.set('IDENTATION', memory.get('IDENTATION') - TABSIZE)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': End of if', style:'italic'}
				]))
			} else {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Condition is false', style:'italic'}
				]))
			}
		})
		this.addAction('ifElse', async (memory, page) => {
			const { condition, actions, elseActions } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Condition: ', style:'italic'},
				{text:condition, style:'bold'}
			]))
			if(eval(condition)) {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Condition is true', style:'italic'}
				]))
				memory.set('IDENTATION', memory.get('IDENTATION') + TABSIZE)
				for(let i = 0; i < actions.length; i++) {
					const action = actions[i]
					memory.set('PARAMS', action.params)
					await this.runAction(action.name, memory, page)
				}
				memory.set('IDENTATION', memory.get('IDENTATION') - TABSIZE)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': End of if', style:'italic'}
				]))
			} else {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': Condition is false', style:'italic'}
				]))
				memory.set('IDENTATION', memory.get('IDENTATION') + TABSIZE)
				for(let i = 0; i < elseActions.length; i++) {
					const action = elseActions[i]
					memory.set('PARAMS', action.params)
					await this.runAction(action.name, memory, page)
				}
				memory.set('IDENTATION', memory.get('IDENTATION') - TABSIZE)
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:': End of if', style:'italic'}
				]))
			}
		})
		this.addAction('createFile', async (memory) => {
			const { filename } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Creating file ', style:'italic'},
				{text:`${memory.get('CURRENT_DIR')}/${filename}.txt`, style:'bold'}
			]))
			fs.appendFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, '')
		})
		this.addAction('setDefaultTimeout', async (memory, page) => {
			const { timeout } = memory.get('PARAMS')
			page.setDefaultNavigationTimeout(0)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Timeout set to ', style:'italic'},
				{text:timeout, style:'bold'}
			]))
		})
		this.addAction('click', async (memory, page) => {
			const { selector, attribute, text } = memory.get('PARAMS')
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
		this.addAction('waitForSelector', async (memory, page) => {
			const { selector } = memory.get('PARAMS')
			await page.waitForSelector(selector, { visible: true })
		})
		this.addAction('clickAll', async (memory, page) => {
			const { selector } = memory.get('PARAMS')
			const elements = await page.$$(selector)
			for (let i = 0; i < elements.length; i++) {
				const element = elements[i]
				// wait for element to be visible
				await page.waitForFunction((element) => {
					// scroll to element
					element.scrollIntoView()
					const { top, left, bottom, right } = element.getBoundingClientRect()
					return top >= 0 && left >= 0 && bottom <= (window.innerHeight || document.documentElement.clientHeight) && right <= (window.innerWidth || document.documentElement.clientWidth)
				}, {}, element)
				await element.click()
			}
		})
		this.addAction('readFromText', async (memory) => {
			const { key, filename } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Reading from file ', style:'italic'},
				{text: `${memory.get('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			]))
			const content = fs.readFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, 'utf8')
			memory.set(key, content)
		})
		this.addAction('fileExists', async (memory) => {
			const { filename } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Checking if file exists ', style:'italic'},
				{text: `${memory.get('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			]))
			const exists = fs.existsSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`)
			memory.set('INPUT', exists)
		})
		this.addAction('deleteFile', async (memory) => {
			const { filename } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Deleting file ', style:'italic'},
				{text: `${memory.get('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			]))
			// if file exists, delete it
			if(fs.existsSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`))
				fs.unlinkSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`)
		})
		this.addAction('deleteFolder', async (memory) => {
			const { foldername } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Deleting folder ', style:'italic'},
				{text: `${memory.get('CURRENT_DIR')}/${foldername}`, color: 'gray', style:'italic'}
			]))
			// if folder exists, delete it along with all its content
			if(fs.existsSync(`${memory.get('CURRENT_DIR')}/${foldername}`))
				fs.rmdirSync(`${memory.get('CURRENT_DIR')}/${foldername}`, { recursive: true })
		})
		this.addAction('moveMouse', async (memory) => {
			const { x, y } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Moving mouse to ', style:'italic'},
				{text: `${x}, ${y}`, color: 'gray', style:'italic'}
			]))
			robot.moveMouse(x, y)
		})
		this.addAction('checkStringInFile', async (memory) => {
			const { filename, string } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': Checking if string is in file ', style:'italic'},
				{text: `${memory.get('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
			]))
			const content = fs.readFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, 'utf8')
			memory.set('INPUT', content.includes(string))
		})
		this.addAction('saveToText', async (memory) => {
			const { key, filename } = memory.get('PARAMS')
			const content = memory.get(key)
			if(content) {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text: ': Saving ', color: 'white', style:'italic'},
					{text: `${memory.get('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
				]))
				if(Array.isArray(content))
					fs.writeFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, content.join('\n'))
				else
					fs.writeFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, content)
			}
		})
		this.addAction('appendToText', async (memory) => {
			const { key, filename } = memory.get('PARAMS')
			const content = memory.get(key)
			if(content) {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text: ': Appending to ', color: 'white', style:'italic'},
					{text: `${memory.get('CURRENT_DIR')}/${filename}.txt`, color: 'gray', style:'italic'}
				]))
				if(Array.isArray(content))
					fs.appendFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, content.join('\n'))
				else
					fs.appendFileSync(`${memory.get('CURRENT_DIR')}/${filename}.txt`, content+'\n')
			}
		})
		this.addAction('download', async (memory) => {
			const { url, filename, host } = memory.get('PARAMS')
			// if not filename, use the last part of the url
			const name = filename || url.split('/').pop()
			const sanitizedFilename = sanitizeString(name)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text: ': Downloading ', color: 'white', style:'italic'},
				{text: sanitizedFilename, color: 'gray', style:'italic'}
			]))
			await new Promise((resolve, reject) => {
				const file = fs.createWriteStream(`${memory.get('CURRENT_DIR')}/${sanitizedFilename}`)
				// if url is a relative path, add the host
				// use https and http depending on the host
				// log a progress bar
				const needsHost = !url.startsWith('http')
				const requestProtocol = needsHost ? (host.startsWith('https') ? https : http) : (url.startsWith('https') ? https : http)
				const request = requestProtocol.get(needsHost ? `${host}${url}` : url, (response) => {
					response.pipe(file)
					let len = parseInt(response.headers['content-length'], 10)
					let cur = 0
					let total = len / 1048576
					response.on('data', (chunk) => {
						cur += chunk.length
						Chalk.write(Chalk.create([
							{text: ' '.repeat(memory.get('IDENTATION'))},
							{text: ': Downloading ', color: 'white', style:'italic'},
							{text: sanitizedFilename, color: 'gray', style:'italic'},
							{text: ` ${Math.round(100.0 * cur / len)}% (${(cur / 1048576).toFixed(2)}MB/${total.toFixed(2)}MB)`, color: 'gray', style:'italic'}
						]))
					})
					response.on('end', () => {
						Chalk.write(Chalk.create([
							{text: ' '.repeat(memory.get('IDENTATION'))},
							{text: ': Downloaded ', color: 'green', style:'italic'},
							{text: sanitizedFilename, color: 'gray', style:'italic'}
						]))
						resolve()
					})
				})
				request.on('error', (err) => {
					Chalk.write(Chalk.create([
						{text: ' '.repeat(memory.get('IDENTATION'))},
						{text: ': Error downloading ', color: 'red', style:'italic'},
						{text: sanitizedFilename, color: 'gray', style:'italic'}
					]))
					reject(err)
				})
			})
		})
		this.addAction('log', async (memory) => {
			const { text, color, background } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{ text:`: ${text}`, color, background, style:'italic' }
			]))
		})
		this.addAction('forEach', async (memory, page) => {
			const { key, actions } = memory.get('PARAMS')
			const value = memory.get(key)
			const valueLength = value.length
			memory.set('IDENTATION', memory.get('IDENTATION') + TABSIZE)
			for(let i = 0; i < value.length; i++) {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:`: ${key}[${i+1}/${valueLength}]`, color:'yellow', style:'italic'},
					{text:`: ${sanitizeString(value[i])}`, color:'white', style:'italic'}
				]))
				memory.set('INPUT', value[i])
				for(let action of actions) {
					memory.set('PARAMS', action.params)
					await this.runAction(action.name, memory, page)
				}
			}
			memory.set('IDENTATION', memory.get('IDENTATION') - TABSIZE)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': End of forEach', color:'yellow', style:'italic'}
			]))
		})
		this.addAction('for', async (memory, page) => {
			const { from, until, step, actions } = memory.get('PARAMS')
			memory.set('IDENTATION', memory.get('IDENTATION') + TABSIZE)
			for(let i = from; i <= until; i+=step) {
				Chalk.write(Chalk.create([
					{text: ' '.repeat(memory.get('IDENTATION'))},
					{text:`: [${i}/${until}]`, color:'yellow', style:'italic'}
				]))
				memory.set('INPUT', i)
				for(let action of actions) {
					memory.set('PARAMS', action.params)
					await this.runAction(action.name, memory, page)
				}
			}
			memory.set('IDENTATION', memory.get('IDENTATION') - TABSIZE)
			Chalk.write(Chalk.create([
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:': End of for loop', color:'yellow', style:'italic'}
			]))
		})
	}
}