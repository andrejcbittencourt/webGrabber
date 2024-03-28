import cloneDeep from 'lodash/cloneDeep.js'
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
	resetIndentation,
} from '../utils/utils.js'
import constants from '../utils/constants.js'

class Brain {
	#memory
	#muscleMemory

	constructor() {
		this.#memory = new Map()
		this.#muscleMemory = new ActionListContainer()
	}

	learn(key, value) {
		// if value is an object then clone it
		if (typeof value === 'object') this.#memory.set(key, cloneDeep(value))
		else this.#memory.set(key, value)
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
	mimic(muscleMemory) {
		this.#muscleMemory = muscleMemory
	}
	clone() {
		const brain = new Brain()
		this.#memory.forEach((value, key) => brain.learn(key, value))
		brain.mimic(this.#muscleMemory)
		return brain
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
			if (typeof action !== 'function') throw new Error(`Action ${name} must be a function`)
			if (this.#coreActionList.has(name) || this.#customActionList.has(name))
				throw new Error(`Action ${name} already exists`)
			this.#customActionList.add(name, action)
		} catch (error) {
			displayErrorAndExit(error)
		}
	}

	async init() {
		try {
			// for each process.env add to memory
			for (const [key, value] of Object.entries(process.env)) {
				// if starts with GRABBER_ add to memory but remove GRABBER_
				if (key.startsWith(constants.grabberPrefix))
					this.#brain.learn(key.replace(constants.grabberPrefix, ''), value)
			}
			await this.#puppeteer.launch()
			// get grab from payload or from file
			this.#brain.train(this.#coreActionList)
			this.#brain.train(this.#customActionList)
			displayText([{ text: 'Actions loaded', color: 'green', style: 'bold' }])
		} catch (error) {
			displayErrorAndExit(error)
		}
	}

	async loadGrabList() {
		try {
			getGrabList().forEach((grab) => this.#grabList.add(grab))
			// if grabList is empty then throw error
			if (this.#grabList.isEmpty()) throw new Error('No grabs found nor provided')
			displayText([{ text: 'Grab configs loaded', color: 'green', style: 'bold' }])
		} catch (error) {
			displayErrorAndExit(error)
		}
	}

	async grab(payload = null) {
		const page = await this.#puppeteer.page
		const brain = payload ? this.#brain.clone() : this.#brain
		const grabList = payload ? this.#grabList.clone(payload) : this.#grabList
		try {
			displayText([{ text: 'Grabber started', color: 'green', style: 'bold' }])
			const argv = process.argv.slice(2)[0]
			for (const grab of grabList.list) {
				if (argv && argv !== grab.name && !payload) continue
				displayText([{ text: `Grabbing ${grab.name}`, color: 'green', style: 'bold' }])
				resetIndentation(brain)
				brain.learn(constants.paramsKey, { dir: grab.name })
				await brain.perform('setBaseDir')
				await brain.perform('resetCurrentDir')
				for (const action of grab.actions) {
					brain.learn(constants.paramsKey, action.params || {})
					await brain.perform(action.name, page)
				}
			}
		} catch (error) {
			displayError(error)
		}
		await page.close()
		displayText([{ text: 'Grabber finished', color: 'green', style: 'bold' }])
		if (!payload) {
			await this.#puppeteer.close()
			displayText([{ text: 'Grabber closed', color: 'green', style: 'bold' }])
		}
	}
}
