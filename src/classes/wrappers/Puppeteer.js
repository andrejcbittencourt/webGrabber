import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

export default class Puppeteer {
	#headless
	#stealth
	#adblocker
	#viewport
	#page
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
		if (this.#stealth === true)
			puppeteer.use(StealthPlugin())
		if (this.#adblocker === true)
			puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
		const launchOptions = { headless: this.#headless, timeout: 0 }
		if (this.#executablePath !== null)
			launchOptions.executablePath = this.#executablePath
		this.#browser = await puppeteer.launch(launchOptions)
		this.#page = await this.#browser.newPage()
		if(this.#viewport !== undefined && this.#viewport !== null)
			await this.#page.setViewport(this.#viewport)
	}

	async close() {
		await this.#browser.close()
	}

	get page() {
		return this.#page
	}
}
