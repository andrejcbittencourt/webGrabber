import fs from 'fs'
import path from 'path'
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
			const params = memory.get('params')
			const { key, value } = params
			memory.set(key, value)
		})
		this.addAction('getVariable', async (memory) => {
			const params = memory.get('params')
			const { key } = params
			memory.set('input', memory.get(key))
		})
		this.addAction('deleteVariable', async (memory) => {
			const params = memory.get('params')
			const { key } = params
			memory.delete(key)
		})
		this.addAction('goTo', async (memory, page) => {
			const params = memory.get('params')
			const { url } = params
			await page.goto(url, {
				waitUntil: 'networkidle2',
			})
		})
		this.addAction('setCurrentDir', async (memory) => {
			const params = memory.get('params')
			const { dir } = params
			memory.set('currentDir', path.join(memory.get('currentDir'), dir))
		})
		this.addAction('resetCurrentDir', async (memory) => {
			memory.set('currentDir', path.join(__dirname, '../resources'))
		})
		this.addAction('setCookiesDir', async (memory) => {
			memory.set('cookiesDir', path.join(__dirname, '../cookies'))
		})
		this.addAction('backToParentDir', async (memory) => {
			memory.set('currentDir', memory.get('currentDir').split('/').slice(0, -1).join('/'))
		})
		this.addAction('getElements', async (memory, page) => {
			const params = memory.get('params')
			const { selector } = params
			const elements = await page.$$(selector)
			let content = []
			for (let i = 0; i < elements.length; i++) {
				const element = elements[i]
				const text = await page.evaluate((element) => element.textContent, element)
				content.push(text)
			}
			memory.set('input', content)
		})
		this.addAction('login', async (memory, page) => {
			const params = memory.get('params')
			const { 
				usernameSelector, 
				username, 
				passwordSelector, 
				password, 
				submitSelector,
				cookiesFile
			} = params
			const cookiesDir = memory.get('cookiesDir')
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
				memory.set('params', {selector: usernameSelector, text: username})
				await this.runAction('type', memory, page)
				await page.waitForSelector(passwordSelector, { visible: true })
				memory.set('params', {selector: passwordSelector, text: password})
				await this.runAction('type', memory, page)
				Chalk.write(Chalk.create([
					{text:': Credentials entered', style:'italic'}
				]))
				await page.waitForSelector(submitSelector, { visible: true })
				memory.set('params', {selector: submitSelector})
				await this.runAction('click', memory, page)
				Chalk.write(Chalk.create([
					{text:': Login submitted', style:'italic'}
				]))
				await page.waitForNavigation()
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
			const params = memory.get('params')
			let { dir } = params
			dir = dir.replace(/[^a-zA-Z0-9 ]/g, '').replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, '-')
			if (!fs.existsSync(`${memory.get('currentDir')}/${dir}`))
				fs.mkdirSync(`${memory.get('currentDir')}/${dir}`)
		})
		this.addAction('type', async (memory, page) => {
			const params = memory.get('params')
			const { selector, text } = params
			await page.waitForSelector(selector, { visible: true })
			await page.type(selector, text)
		})
		this.addAction('click', async (memory, page) => {
			const params = memory.get('params')
			const { selector } = params
			await page.waitForSelector(selector, { visible: true })
			await page.click(selector)
		})
		this.addAction('dowloadResource', async (memory) => {
			const params = memory.get('params')
			const { url, filename } = params
			const response = await fetch(url)
			const buffer = await response.buffer()
			fs.writeFileSync(`${memory.get('currentDir')}/${filename}`, buffer)
		})
		this.addAction('log', async (memory) => {
			const params = memory.get('params')
			const { text, color, background } = params
			// sanitize text
			let sanitizedText = sanitizeString(text)
			Chalk.write(Chalk.create([
				{ text:`: ${sanitizedText}`, color, background, style:'italic' }
			]))
		})
		this.addAction('forEach', async (memory) => {
			const params = memory.get('params')
			const { key, action } = params
			const value = memory.get(key)
			for (let i = 0; i < value.length; i++) {
				Chalk.write(Chalk.create([
					{text:`: ${key}[${i+1}]`, color:'yellow', style:'italic'},
					{text:`: ${sanitizeString(value[i])}`, color:'white', style:'italic'}
				]))
				memory.set('input', value[i])
				memory.set('params', action.params)
				await this.runAction(action.name, memory)
			}
		})
	}
}
