import Chalk from '../wrappers/Chalk.js'
import { interpolation } from '../../utils/utils.js'

class Action {
	#action

	constructor(action) {
		this.#action = action
	}

	async run(memory, page) {
		await this.#action(memory, page)
	}
}

export class ActionList {
	#list

	constructor() {
		this.#list = {}
	}

	add(name, action) {
		this.#list[name] = new Action(action)
	}

	has(name) {
		return this.#list[name] ? true : false
	}

	async run(name, memory, page) {

		if (!this.has(name))
			throw new Error(`Action ${name} not found`)

		Chalk.write([
			{text: ' '.repeat(memory.get('IDENTATION'))},
			{text: 'Running action :', color: 'blue', style: 'bold'},
			{text: name, color: 'whiteBright'}
		])
		if (memory.get('PARAMS'))
			memory.set('PARAMS', interpolation(memory.get('PARAMS'), memory))
		await this.#list[name].run(memory, page)

	}

}

export class ActionListContainer {
	#container

	constructor() {
		this.#container = []
	}

	add(actionList) {
		this.#container.push(actionList)
	}

	async run(name, memory, page) {
		for (const actionList of this.#container) {
			if (actionList.has(name)) {
				await actionList.run(name, memory, page)
				return
			}
		}
	}

}