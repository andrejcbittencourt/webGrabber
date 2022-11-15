import GrabList from './GrabList.js'
import Puppeteer from './Puppeteer.js'
import CoreActions from './CoreActions.js'
import CustomActions from './CustomActions.js'
import { getGrabList } from '../utils/utils.js'
import Chalk from './Chalk.js'

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

	addCustomAction(name, action) {
		this.#customActions.add(name, action)
	}

	async grab() {
		try {
			// for each process.env add to memory
			// eslint-disable-next-line no-undef
			for (const [key, value] of Object.entries(process.env)) {
				// if starts with GRABBER_ add to memory but remove GRABBER_
				if (key.startsWith('GRABBER_')) {
					this.#memory.set(key.replace('GRABBER_', ''), value)
				}
			}
			Chalk.write(Chalk.create([
				{text:'Grabber started', color:'green', style:'bold'}
			]))
			await this.#puppeteer.launch()
			getGrabList().forEach(grab => this.#grabList.addGrab(grab))
			Chalk.write(Chalk.create([
				{text:'Grab configs loaded', color:'green', style:'bold'}
			]))
			this.#coreActions.load()
			this.#customActions.load()
			Chalk.write(Chalk.create([
				{text:'Actions loaded', color:'green', style:'bold'}
			]))
			await this.#coreActions.runAction('setCookiesDir', this.#memory)
			for (const grab of this.#grabList.list) {
				await this.#coreActions.runAction('resetCurrentDir', this.#memory)
				this.#memory.set('params', { dir: grab.name })
				await this.#coreActions.runAction('createDir', this.#memory)
				await this.#coreActions.runAction('setCurrentDir', this.#memory)
				for (const action of grab.actions) {
					this.#memory.set('input', null)
					this.#memory.set('params', action.params)
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
			Chalk.write(Chalk.create([
				{text:error.message, color:'red', style:'bold'}
			]))
		}
		await this.#puppeteer.close()
		Chalk.write(Chalk.create([
			{text:'Grabber closed', color:'green', style:'bold'}
		]))
	}
}