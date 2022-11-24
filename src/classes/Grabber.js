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
		// if value is an object then don't reference
		if (typeof value === 'object')
			this.#memory[key] = JSON.parse(JSON.stringify(value))
		else
			this.#memory[key] = value
	}
	get(key) {
		return this.#memory[key]
	}
	delete(key) {
		delete this.#memory[key]
	}
}

export default class Grabber {
	#grabList
	#puppeteer
	#coreActions
	#customActions
	#memory

	constructor(options) {
		this.#puppeteer = new Puppeteer(options)
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
				if (key.startsWith('GRABBER_'))
					this.#memory.set(key.replace('GRABBER_', ''), value)
			}
			Chalk.write(Chalk.create([
				{text:'Grabber started', color:'green', style:'bold'}
			]))
			await this.#puppeteer.launch()
			// if grabList is empty then throw error
			getGrabList().forEach(grab => this.#grabList.addGrab(grab))
			if (this.#grabList.isEmpty())
				throw new Error('No grabs found')
			Chalk.write(Chalk.create([
				{text:'Grab configs loaded', color:'green', style:'bold'}
			]))
			this.#coreActions.load()
			this.#customActions.load()
			this.#coreActions.addCustomActions(this.#customActions)
			Chalk.write(Chalk.create([
				{text:'Actions loaded', color:'green', style:'bold'}
			]))
			await this.#coreActions.runAction('setCookiesDir', this.#memory)
			for (const grab of this.#grabList.list) {
				Chalk.write(Chalk.create([
					{text:`Grabbing ${grab.name}`, color:'green', style:'bold'}
				]))
				await this.#coreActions.runAction('resetCurrentDir', this.#memory)
				this.#memory.set('PARAMS', { dir: grab.name })
				await this.#coreActions.runAction('createDir', this.#memory)
				await this.#coreActions.runAction('setCurrentDir', this.#memory)
				this.#memory.set('IDENTATION', 0)
				for (const action of grab.actions) {
					this.#memory.set('PARAMS', action.params)
					await this.#coreActions.runAction(action.name, this.#memory, this.#puppeteer.page)
				}
			}
		} catch (error) {
			Chalk.write(Chalk.create([
				{text:`Error : ${error.message}`, color:'red', style:'bold'}
			]))
		}
		await this.#puppeteer.close()
		Chalk.write(Chalk.create([
			{text:'Grabber closed', color:'green', style:'bold'}
		]))
	}
}