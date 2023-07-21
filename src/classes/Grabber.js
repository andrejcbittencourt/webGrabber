/* eslint-disable no-undef */
import GrabList from './GrabList.js'
import Puppeteer from './wrappers/Puppeteer.js'
import { ActionListContainer } from './actions/Actions.js'
import CoreActionList from './actions/CoreActionList.js'
import CustomActionList from './actions/CustomActionList.js'
import { getGrabList, displayError } from '../utils/utils.js'
import Chalk from './wrappers/Chalk.js'

class Brain {
	#memory
	#muscleMemory

	constructor() {
		this.#memory = new Memory()
		this.#muscleMemory = new MuscleMemory()
	}

	learn(key, value) {
		this.#memory.learn(key, value)
	}
	recall(key) {
		return this.#memory.recall(key)
	}
	forget(key) {
		this.#memory.forget(key)
	}
	train(actions) {
		this.#muscleMemory.train(actions)
	}
	async perform(name, page) {
		await this.#muscleMemory.perform(name, this, page)
	}
}

class MuscleMemory {
	#memory

	constructor() {
		this.#memory = new ActionListContainer()
	}

	train(actions) {
		this.#memory.add(actions)
	}
	async perform(name, brain, page) {
		await this.#memory.run(name, brain, page)
	}
}

class Memory {
	#memory

	constructor() {
		this.#memory = {}
	}

	learn(key, value) {
		// if value is an object then don't reference
		if(typeof value === 'object')
			this.#memory[key] = JSON.parse(JSON.stringify(value))
		else
			this.#memory[key] = value
	}
	recall(key) {
		return this.#memory[key]
	}
	forget(key) {
		delete this.#memory[key]
	}
}

export default class Grabber {
	#grabList
	#puppeteer
	#coreActionList
	#customActionList
	#brain
	
	constructor(options) {
		this.#brain = new Brain()
		this.#puppeteer = new Puppeteer(options)
		this.#grabList = new GrabList()
		this.#coreActionList = new CoreActionList()
		this.#customActionList = new CustomActionList()
	}

	addCustomAction(name, action) {
		try {
			if(typeof action !== 'function')
				throw new Error(`Action ${name} must be a function`)
			if(this.#coreActionList.has(name) || this.#customActionList.has(name))
				throw new Error(`Action ${name} already exists`)
			this.#customActionList.add(name, action)
		} catch (error) {
			displayError(error)
			process.exit(1)
		}
	}

	async grab() {
		try {
			// for each process.env add to memory
			for(const [key, value] of Object.entries(process.env)) {
				// if starts with GRABBER_ add to memory but remove GRABBER_
				if(key.startsWith('GRABBER_'))
					this.#brain.learn(key.replace('GRABBER_', ''), value)
			}
			Chalk.write([{text:'Grabber started', color:'green', style:'bold'}])
			await this.#puppeteer.launch()
			getGrabList().forEach(grab => this.#grabList.add(grab))
			// if grabList is empty then throw error
			if(this.#grabList.isEmpty())
				throw new Error('No grabs found')
			Chalk.write([{text:'Grab configs loaded', color:'green', style:'bold'}])
			this.#brain.train(this.#coreActionList)
			this.#brain.train(this.#customActionList)
			Chalk.write([{text:'Actions loaded', color:'green', style:'bold'}])
			for(const grab of this.#grabList.list) {
				const argv = process.argv.slice(2)[0]
				if(argv && argv !== grab.name)
					continue
				Chalk.write([{text:`Grabbing ${grab.name}`, color:'green', style:'bold'}])
				this.#brain.learn('PARAMS', { dir: grab.name })
				await this.#brain.perform('setBaseDir')
				await this.#brain.perform('resetCurrentDir')
				this.#brain.learn('IDENTATION', 0)
				for(const action of grab.actions) {
					this.#brain.learn('PARAMS', action.params || {})
					await this.#brain.perform(action.name, this.#puppeteer.page)
				}
			}
		} catch (error) {
			displayError(error)
		}
		await this.#puppeteer.close()
		Chalk.write([{text:'Grabber closed', color:'green', style:'bold'}])
	}
}