import GrabList from './GrabList.js'
import Puppeteer from './Puppeteer.js'
import CoreActions from './CoreActions.js'
import CustomActions from './CustomActions.js'
import { getGrabList, interpolation } from '../utils/utils.js'

class Memory {
	#memory
	constructor() {
		this.#memory = {}
	}
	set(key, value) {
		this.#memory[key] = value
	}
	get(key) {
		return this.#memory[key]
	}
}

export default class Grabber {
	#grabList
	#puppeteer
	#coreActions
	#customActions
	#memory

	constructor(headless = true, stealth = true, adblocker = true) {
		this.#puppeteer = new Puppeteer(headless, stealth, adblocker)
		this.#coreActions = new CoreActions()
		this.#customActions = new CustomActions()
		this.#grabList = new GrabList()
		this.#memory = new Memory()
	}

	async addCustomAction(name, action) {
		this.#customActions.add(name, action)
	}

	async grab() {
		try {
			console.log('Grabber started')
			await this.#puppeteer.launch()
			getGrabList().forEach(grab => this.#grabList.addGrab(grab))
			console.log('Grab configs loaded...')
			this.#coreActions.load()
			this.#customActions.load()
			console.log('Actions loaded...')
			await this.#coreActions.runAction('setCookiesDir', this.#memory)
			for (const grab of this.#grabList.list) {
				await this.#coreActions.runAction('resetCurrentDir', this.#memory)
				this.#memory.set('params', { dir: grab.name })
				await this.#coreActions.runAction('createDir', this.#memory)
				await this.#coreActions.runAction('setCurrentDir', this.#memory)
				for (const action of grab.actions) {
					this.#memory.set('input', null)
					this.#memory.set('params', await interpolation(action.params))
					if (this.#coreActions.hasAction(action.name)) {
						await this.#coreActions.runAction(action.name, this.#memory, this.#puppeteer.page)
					} else if (this.#customActions.hasAction(action.name)) {
						await this.#customActions.runAction(action.name, this.#memory, this.#puppeteer.page)
					} else {
						throw new Error(`Action ${action.name} not found`)
					}
				}
			}
		} catch (error) {
			console.log('Error: ', error)
		}
		await this.#puppeteer.close()
	}
}