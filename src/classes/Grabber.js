/* eslint-disable no-undef */
import GrabList from './GrabList.js'
import Puppeteer from './wrappers/Puppeteer.js'
import { ActionListContainer } from './actions/Actions.js'
import CoreActionList from './actions/CoreActionList.js'
import CustomActionList from './actions/CustomActionList.js'
import { getGrabList } from '../utils/utils.js'
import Chalk from './wrappers/Chalk.js'

class Memory {
	#memory
	constructor() {
		this.#memory = {}
	}
	set(key, value) {
		// if value is an object then don't reference
		if(typeof value === 'object')
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
	#actionListContainer
	#coreActionList
	#customActionList
	#memory

	constructor(options) {
		this.#memory = new Memory()
		this.#puppeteer = new Puppeteer(options)
		this.#grabList = new GrabList()
		this.#actionListContainer = new ActionListContainer()
		this.#coreActionList = new CoreActionList()
		this.#customActionList = new CustomActionList()
	}

	addCustomAction(name, action) {
		if(typeof action !== 'function')
			throw new Error('Action must be a function')
		if(this.#coreActionList.has(name) || this.#customActionList.has(name))
			throw new Error(`Action ${name} already exists`)
		if(!this.#actionListContainer.isEmpty())
			this.#actionListContainer.clear()
		this.#customActionList.add(name, action)
	}

	async grab() {
		try {
			// for each process.env add to memory
			for(const [key, value] of Object.entries(process.env)) {
				// if starts with GRABBER_ add to memory but remove GRABBER_
				if(key.startsWith('GRABBER_'))
					this.#memory.set(key.replace('GRABBER_', ''), value)
			}
			Chalk.write([{text:'Grabber started', color:'green', style:'bold'}])
			await this.#puppeteer.launch()
			getGrabList().forEach(grab => this.#grabList.add(grab))
			// if grabList is empty then throw error
			if(this.#grabList.isEmpty())
				throw new Error('No grabs found')
			Chalk.write([{text:'Grab configs loaded', color:'green', style:'bold'}])
			this.#actionListContainer.add(this.#coreActionList)
			this.#actionListContainer.add(this.#customActionList)
			Chalk.write([{text:'Actions loaded', color:'green', style:'bold'}])
			await this.#actionListContainer.run('setCookiesDir', this.#memory)
			for(const grab of this.#grabList.list) {
				const argv = process.argv.slice(2)[0]
				if(argv && argv !== grab.name)
					continue
				Chalk.write([{text:`Grabbing ${grab.name}`, color:'green', style:'bold'}])
				await this.#actionListContainer.run('resetCurrentDir', this.#memory)
				this.#memory.set('PARAMS', { dir: grab.name })
				await this.#actionListContainer.run('createDir', this.#memory)
				await this.#actionListContainer.run('setCurrentDir', this.#memory)
				this.#memory.set('IDENTATION', 0)
				for(const action of grab.actions) {
					this.#memory.set('PARAMS', action.params)
					await this.#actionListContainer.run(action.name, this.#memory, this.#puppeteer.page)
				}
			}
		} catch (error) {
			Chalk.write([{text:`Error : ${error.message}`, color:'red', style:'bold'}])
		}
		await this.#puppeteer.close()
		Chalk.write([{text:'Grabber closed', color:'green', style:'bold'}])
	}
}