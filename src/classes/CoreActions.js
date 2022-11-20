import https from 'https'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import ActionList from './ActionList.js'
import Chalk from './Chalk.js'
import { sanitizeString } from '../utils/utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default class CoreActions extends ActionList {

	constructor() {
		super()
	}

	load() {
		this.addAction('setVariable', async (memory) => {
			const { key, value } = memory.get('PARAMS')
			memory.set(key, value)
		})
		this.addAction('getVariable', async (memory) => {
			const { key, index } = memory.get('PARAMS')
			const value = memory.get(key)
			memory.set('INPUT', index ? value[index] : value)
		})
		this.addAction('deleteVariable', async (memory) => {
			const { key } = memory.get('PARAMS')
			memory.delete(key)
		})
		this.addAction('goTo', async (memory, page) => {
			const { url, timeout } = memory.get('PARAMS')
			await page.goto(url, {
				waitUntil: 'networkidle0',
				timeout: timeout ? timeout : 30000
			})
		})
		this.addAction('count', async (memory) => {
			const { key } = memory.get('PARAMS')
			let count = memory.get(key)
			if (count === undefined || isNaN(count))
				count = 0
			else
				count++
			memory.set(key, count)
		})
		this.addAction('wait', async (memory) => {
			const { ms } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{text:`: Waiting ${ms} ms`, style:'italic'}
			]))
			await new Promise(resolve => setTimeout(resolve, ms))
		})
		this.addAction('setCurrentDir', async (memory) => {
			let { dir } = memory.get('PARAMS')
			dir = sanitizeString(dir)
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
		this.addAction('random', async (memory) => {
			const { min, max } = memory.get('PARAMS')
			// convert to number
			const minNumber = Number(min)
			const maxNumber = Number(max)
			memory.set('INPUT', Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber)
		})
		this.addAction('uuid', async (memory) => {
			memory.set('INPUT', uuidv4())
		})
		this.addAction('screenshot', async (memory, page) => {
			const { name, type } = memory.get('PARAMS')
			const validatedType = ['jpeg', 'png'].includes(type) ? type : 'png'
			const filename = `${sanitizeString(name)}.${validatedType}`
			const filePath = path.join(memory.get('CURRENT_DIR'), sanitizeString(filename))
			await page.screenshot({
				path: filePath,
				type: validatedType,
				fullPage: true,
			})
		})
		this.addAction('getElements', async (memory, page) => {
			const { selector, attribute } = memory.get('PARAMS')
			const elements = await page.$$(selector)
			let content = []
			for (let i = 0; i < elements.length; i++) {
				const element = elements[i]
				if (attribute)
					content.push(await page.evaluate((element, attribute) => element.getAttribute(attribute), element, attribute))
				else
					content.push(await page.evaluate((element) => element.textContent, element))
			}
			memory.set('INPUT', content)
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
			if (fs.existsSync(`${cookiesDir}/${cookiesFile}.cookies.json`)) {
				const cookies = JSON.parse(fs.readFileSync(`${cookiesDir}/${cookiesFile}.cookies.json`))
				await page.setCookie(...cookies)
				Chalk.write(Chalk.create([
					{text:': Cookies loaded', style:'italic'}
				]))
			} else {
				await this.runAction('goTo', memory, page)
				Chalk.write(Chalk.create([
					{text:': Page loaded', style:'italic'}
				]))
				await page.waitForSelector(usernameSelector, { visible: true })
				memory.set('PARAMS', {selector: usernameSelector, text: username})
				await this.runAction('type', memory, page)
				await page.waitForSelector(passwordSelector, { visible: true })
				memory.set('PARAMS', {selector: passwordSelector, text: password})
				await this.runAction('type', memory, page)
				Chalk.write(Chalk.create([
					{text:': Credentials entered', style:'italic'}
				]))
				await page.waitForSelector(submitSelector, { visible: true })
				memory.set('PARAMS', {selector: submitSelector})
				await this.runAction('click', memory, page)
				Chalk.write(Chalk.create([
					{text:': Login submitted', style:'italic'}
				]))
				await page.waitForNavigation({ waitUntil: 'networkidle2' })
				const cookies = await page.cookies()
				fs.writeFileSync(`${cookiesDir}/${cookiesFile}.cookies.json`, JSON.stringify(cookies), (err) => {
					if (err) throw err
					Chalk.write(Chalk.create([
						{text:': Cookies saved', style:'italic'}
					]))
				})
			}
		})
		this.addAction('createDir', async (memory) => {
			let { dir } = memory.get('PARAMS')
			dir = sanitizeString(dir)
			if (!fs.existsSync(`${memory.get('CURRENT_DIR')}/${dir}`))
				fs.mkdirSync(`${memory.get('CURRENT_DIR')}/${dir}`)
		})
		this.addAction('type', async (memory, page) => {
			const { selector, text } = memory.get('PARAMS')
			await page.waitForSelector(selector, { visible: true })
			await page.type(selector, text)
		})
		this.addAction('click', async (memory, page) => {
			const { selector } = memory.get('PARAMS')
			await page.waitForSelector(selector, { visible: true })
			await page.click(selector)
		})
		this.addAction('download', async (memory) => {
			const { url, filename, host } = memory.get('PARAMS')
			const sanitizedFilename = sanitizeString(filename)
			await new Promise((resolve, reject) => {
				const file = fs.createWriteStream(`${memory.get('CURRENT_DIR')}/${sanitizedFilename}`)
				// if url is a relative path, add the host
				https.get(url.startsWith('http') || url.startsWith('https') ? url : `${host}${url}`, (response) => {
					response.pipe(file)
					file.on('finish', () => {
						Chalk.write(Chalk.create([
							{text:': Downloaded ->', style:'italic'},
							{text:sanitizedFilename}
						]))
						file.close()
						resolve()
					})
				}).on('error', (err) => {
					fs.unlink(`${memory.get('CURRENT_DIR')}/${sanitizedFilename}`)
					reject(err)
				})
			})
		})
		this.addAction('log', async (memory) => {
			const { text, color, background } = memory.get('PARAMS')
			Chalk.write(Chalk.create([
				{ text:`: ${text}`, color, background, style:'italic' }
			]))
		})
		this.addAction('forEach', async (memory, page) => {
			const { key, actions } = memory.get('PARAMS')
			const value = memory.get(key)
			const valueLength = value.length
			for(let i = 0; i < value.length; i++) {
				Chalk.write(Chalk.create([
					{text:`: ${key}[${i+1}/${valueLength}]`, color:'yellow', style:'italic'},
					{text:`: ${sanitizeString(value[i])}`, color:'white', style:'italic'}
				]))
				memory.set('INPUT', value[i])
				for(let action of actions) {
					memory.set('PARAMS', action.params)
					await this.runAction(action.name, memory, page)
				}
			}
		})
	}
}