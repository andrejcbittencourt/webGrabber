import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

class Puppeteer {
	#headless
	#stealth
	#adblocker
	#viewport
	#browser
	#executablePath

	constructor(options) {
		this.#headless = options?.headless ?? 'new'
		this.#stealth = options?.stealth ?? true
		this.#adblocker = options?.adblocker ?? true
		this.#viewport = options?.viewport ?? null
		this.#executablePath = options?.executablePath ?? null
	}

	async launch() {
		if (this.#stealth === true) puppeteer.use(StealthPlugin())
		if (this.#adblocker === true) puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
		const launchOptions = { headless: this.#headless, timeout: 0 }
		if (this.#executablePath) launchOptions.executablePath = this.#executablePath
		this.#browser = await puppeteer.launch(launchOptions)
	}

	get viewport() {
		return this.#viewport
	}

	get browser() {
		return this.#browser
	}

	async close() {
		await this.#browser.close()
	}
}

export default class PuppeteerPageFactory {
	static #puppeteer

	static async init(options) {
		this.#puppeteer = new Puppeteer(options)
		await this.#puppeteer.launch()
	}

	static async create() {
		const page = await this.#puppeteer.browser.newPage()
		const viewport = this.#puppeteer.viewport
		if (viewport) await page.setViewport(viewport)
		return page
	}

	static async close() {
		await this.#puppeteer.close()
	}
}