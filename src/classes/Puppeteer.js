import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

export default class Puppeteer {
	#headless
	#stealth
	#adblocker
	#viewPort
	#page
	#browser

	constructor(options) {
		this.#headless = options?.headless ?? true
		this.#stealth = options?.stealth ?? true
		this.#adblocker = options?.adblocker ?? true
		this.#viewPort = options?.viewPort ?? null
	}

	async launch() {
		if (this.#stealth === true)
			puppeteer.use(StealthPlugin())
		if (this.#adblocker === true)
			puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
		this.#browser = await puppeteer.launch({ headless: this.#headless })
		this.#page = await this.#browser.newPage()
		if(this.#viewPort !== undefined && this.#viewPort !== null)
			await this.#page.setViewport(this.#viewPort)
	}

	async close() {
		await this.#browser.close()
	}

	get page() {
		return this.#page
	}
}
