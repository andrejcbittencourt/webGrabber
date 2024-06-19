import cloneDeep from 'lodash/cloneDeep.js'
import GrabListFactory from './GrabList.js'
import PuppeteerPageFactory from './wrappers/Puppeteer.js'
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
	}

	learn(key, value) {
		// if value is an object then clone it
		this.#memory.set(key, typeof value === 'object' ? cloneDeep(value) : value)
	}
	recall(key) {
		return this.#memory.get(key)
	}
	forget(key) {
		this.#memory.delete(key)
	}
	sync(memories) {
		memories.forEach((value, key) => this.learn(key, value))
	}
	mimic(actions) {
		this.#muscleMemory = actions
	}
	async perform(name, page) {
		await this.#muscleMemory.run(name, this, page)
	}
}

class BrainFactory {
	static #memories
	static #actions

	static init(memories, actions) {
		this.#memories = memories
		this.#actions = actions
	}

	static create() {
		const brain = new Brain()
		brain.sync(this.#memories)
		brain.mimic(this.#actions)
		return brain
	}
}

export default class Grabber {
	#coreActionList
	#customActionList

	constructor() {
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

	async init(puppeteerOptions) {
		try {
			// for each process.env add to memory
			const memories = new Map()
			for (const [key, value] of Object.entries(process.env)) {
				// if starts with GRABBER_ add to memory but remove GRABBER_
				if (key.startsWith(constants.grabberPrefix))
					memories.set(key.replace(constants.grabberPrefix, ''), value)
			}
			const actions = new ActionListContainer()
			actions.add(this.#coreActionList)
			actions.add(this.#customActionList)
			BrainFactory.init(memories, actions)
			await PuppeteerPageFactory.init(puppeteerOptions)
			displayText([{ text: 'Grabber initialized', color: 'green', style: 'bold' }])
		} catch (error) {
			displayErrorAndExit(error)
		}
	}

	async loadGrabList(grabList) {
		try {
			getGrabList().forEach((grab) => grabList.add(grab))
			// if grabList is empty then throw error
			if (grabList.isEmpty()) throw new Error('No grabs found nor provided')
			displayText([{ text: 'Grab configs loaded', color: 'green', style: 'bold' }])
		} catch (error) {
			displayErrorAndExit(error)
		}
	}

	async grab(payload = null) {
		const brain = BrainFactory.create()
		const page = await PuppeteerPageFactory.create()
		const grabList = GrabListFactory.create()
		if (payload) {
			grabList.add(payload.body)
			brain.learn(constants.payloadIdKey, payload.id)
		} else await this.loadGrabList(grabList)
		try {
			const argv = process.argv.slice(2)[0]
			const asyncActions = []
			for (const grab of grabList.list) {
				if (argv && argv !== grab.name && !payload) continue
				displayText([{ text: `Grabbing ${grab.name}`, color: 'green', style: 'bold' }])
				resetIndentation(brain)
				brain.learn(constants.paramsKey, { dir: grab.name })
				await brain.perform('setBaseDir')
				await brain.perform('resetCurrentDir')
				for (const action of grab.actions) {
					brain.learn(constants.paramsKey, action.params || {})
					if (action['await'] === false) asyncActions.push(brain.perform(action.name, page))
					else await brain.perform(action.name, page)
				}
			}
			if (asyncActions.length > 0) {
				await Promise.all(asyncActions)
			}
		} catch (error) {
			displayError(error)
		}
		await page.close()
		displayText([{ text: 'Grabber finished', color: 'green', style: 'bold' }])
		if (!payload) {
			await PuppeteerPageFactory.close()
			displayText([{ text: 'Grabber closed', color: 'green', style: 'bold' }])
		} else return { result: brain.recall(constants.inputKey) }
	}
}
