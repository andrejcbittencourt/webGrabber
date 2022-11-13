import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

export default class Puppeteer {
	#headless
	#stealth
	#adblocker
	#page
	#browser

	constructor(headless, stealth, adblocker) {
		this.#headless = headless
		this.#stealth = stealth
		this.#adblocker = adblocker
	}

	async launch() {
		if (this.#stealth === true)
			puppeteer.use(StealthPlugin())
		if (this.#adblocker === true)
			puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
		this.#browser = await puppeteer.launch({ headless: this.#headless })
		this.#page = await this.#browser.newPage()
	}

	async close() {
		await this.#browser.close()
	}

	get page() {
		return this.#page
	}
}
