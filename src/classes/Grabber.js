/* eslint-disable no-undef */
import GrabList from './GrabList.js'
import Puppeteer from './wrappers/Puppeteer.js'
import { ActionListContainer } from './actions/Actions.js'
import CoreActionList from './actions/CoreActionList.js'
import CustomActionList from './actions/CustomActionList.js'
import { 
	getGrabList, 
	displayError, 
	displayErrorAndExit, 
	displayText,
	resetIndentation
} from '../utils/utils.js'
import cloneDeep from 'lodash/cloneDeep.js'

class Brain {
	#memory
	#muscleMemory

	constructor() {
		this.#memory = new Map()
		this.#muscleMemory = new ActionListContainer()
	}

	learn(key, value) {
		// if value is an object then clone it
		if(typeof value === 'object')
			this.#memory.set(key, cloneDeep(value))
		else
			this.#memory.set(key, value)
	}
	recall(key) {
		return this.#memory.get(key)
	}
	forget(key) {
		this.#memory.delete(key)
	}
	train(actions) {
		this.#muscleMemory.add(actions)
	}
	async perform(name, page) {
		await this.#muscleMemory.run(name, this, page)
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
			displayErrorAndExit(error)
		}
	}

	async init() {
		try {
			// for each process.env add to memory
			for(const [key, value] of Object.entries(process.env)) {
				// if starts with GRABBER_ add to memory but remove GRABBER_
				if(key.startsWith('GRABBER_'))
					this.#brain.learn(key.replace('GRABBER_', ''), value)
			}
			await this.#puppeteer.launch()
			getGrabList().forEach(grab => this.#grabList.add(grab))
			// if grabList is empty then throw error
			if(this.#grabList.isEmpty())
				throw new Error('No grabs found')
			displayText([{text:'Grab configs loaded', color:'green', style:'bold'}])
			this.#brain.train(this.#coreActionList)
			this.#brain.train(this.#customActionList)
			displayText([{text:'Actions loaded', color:'green', style:'bold'}])
		} catch (error) {
			displayErrorAndExit(error)
		}
	}

	async grab() {
		try {
			displayText([{text:'Grabber started', color:'green', style:'bold'}])
			const argv = process.argv.slice(2)[0]
			for(const grab of this.#grabList.list) {
				if(argv && argv !== grab.name)
					continue
				displayText([{text:`Grabbing ${grab.name}`, color:'green', style:'bold'}])
				this.#brain.learn('PARAMS', { dir: grab.name })
				await this.#brain.perform('setBaseDir')
				await this.#brain.perform('resetCurrentDir')
				resetIndentation(this.#brain)
				for(const action of grab.actions) {
					this.#brain.learn('PARAMS', action.params || {})
					await this.#brain.perform(action.name, this.#puppeteer.page)
				}
			}
		} catch (error) {
			displayError(error)
		}
		await this.#puppeteer.close()
		displayText([{text:'Grabber closed', color:'green', style:'bold'}])
	}
}