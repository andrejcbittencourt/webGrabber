/* eslint-disable no-unused-vars */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import ActionList from './ActionList.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default class CoreActions extends ActionList {

	constructor() {
		super()
	}

	async load(page) {
		this.addAction(page, 'setVariable', async (memory, _page) => {
			const params = memory.get('params')
			const { key, value } = params
			memory.set(key, value)
		})
		this.addAction(page, 'getVariable', async (memory, _page) => {
			const params = memory.get('params')
			const { key, index } = params
			memory.set('input', memory.get(key))
		})
		this.addAction(page, 'goTo', async (memory, page) => {
			const params = memory.get('params')
			const { url } = params
			await page.goto(url, {
				waitUntil: 'networkidle2',
			})
		})
		this.addAction(page, 'setCurrentDir', async (memory, _page) => {
			const params = memory.get('params')
			const { dir } = params
			memory.set('currentDir', path.join(memory.get('currentDir'), dir))
		})
		this.addAction(page, 'resetCurrentDir', async (memory, _page) => {
			memory.set('currentDir', path.join(__dirname, '../resources'))
		})
		this.addAction(page, 'setCookiesDir', async (memory, _page) => {
			memory.set('cookiesDir', path.join(__dirname, '../resources/cookies'))
		})
		this.addAction(page, 'backToParentDir', async (memory, _page) => {
			memory.set('currentDir', memory.get('currentDir').split('/').slice(0, -1).join('/'))
		})
		this.addAction(page, 'getElements', async (memory, page) => {
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
		this.addAction(page, 'login', async (memory, page) => {
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
				console.log('Cookies loaded...')
			} else {
				await this.runAction('goTo', params)
				console.log('Page loaded...')
				await page.waitForSelector(usernameSelector, { visible: true })
				await this.runAction('type', {selector: usernameSelector, text: username})
				await page.waitForSelector(passwordSelector, { visible: true })
				await this.runAction('type', {selector: passwordSelector, text: password})
				console.log('Credentials entered...')
				await this.runAction('click', {selector: submitSelector})
				console.log('Login submitted...')
				await page.waitForNavigation()
				const cookies = await page.cookies()
				fs.writeFileSync(`${cookiesDir}/${cookiesFile}.cookies.json}`, JSON.stringify(cookies), (err) => {
					if (err) throw err
					console.log('Cookies saved...')
				})
			}
		})
		this.addAction(page, 'createDir', async (memory, _page) => {
			const params = memory.get('params')
			let { dir } = params
			dir = dir.replace(/[^a-zA-Z0-9 ]/g, '').replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, '-')
			if (!fs.existsSync(`${memory.get('currentDir')}/${dir}`))
				fs.mkdirSync(`${memory.get('currentDir')}/${dir}`)
		})
		// this.addAction(page, "type", async (memory, page) => {
		// 	const { selector, text } = params
		// 	await page.waitForSelector(selector, { visible: true })
		// 	await page.type(selector, text)
		// })
		// this.addAction(page, "click", async (memory, page) => {
		// 	const { selector } = params
		// 	await page.waitForSelector(selector, { visible: true })
		// 	await page.click(selector)
		// })
		// this.addAction(page, "dowloadResource", async (memory, page) => {
		// 	const { url, filename } = params
		// 	const response = await fetch(url)
		// 	const buffer = await response.buffer()
		// 	fs.writeFileSync(`${this.currentDir}/${filename}`, buffer)
		// })
		// this.addAction(page, "testLog", async (memory, page) => {
		// 	const { text } = params
		// 	console.log(text)
		// })
		// // for each input variable run action
		// this.addAction(page, "forEach", async (memory, page) => {
		// 	const { inputVariable, action } = params
		// 	const input = await this.runAction("getVariable", { key: inputVariable })
		// 	for (let i = 0; i < input.length; i++) {
		// 		await this.runAction(action.name, action.memory[i])
		// 	}
		// })
	}
}
