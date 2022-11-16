import Chalk from './Chalk.js'
import { interpolation } from '../utils/utils.js'

class Action {
	#action

	constructor(action) {
		this.#action = action
	}

	async run(memory, page) {
		await this.#action(memory, page)
	}
}

export default class ActionList {
	#list
	#customActions

	constructor() {
		this.#list = {}
	}

	addAction(name, action) {
		this.#list[name] = new Action(action)
	}

	hasAction(name) {
		return this.#list[name] ? true : false
	}

	addCustomActions(customActions) {
		this.#customActions = customActions
	}

	async runAction(name, memory, page) {
		if(!this.hasAction(name) && ((this.#customActions && !this.#customActions.hasAction(name)) || !this.#customActions))
			throw new Error(`Action ${name} not found`)

		if(this.hasAction(name)) {
			Chalk.write(Chalk.create([
				{text:'Running action :', color:'blue', style:'bold'},
				{text: name, color: 'white'}
			]))
			// if params in memory is not undefined or null
			if(memory.get('params'))
				memory.set('params', interpolation(memory.get('params'), memory))
			await this.#list[name].run(memory, page)
		} else
			await this.#customActions.runAction(name, memory, page)
	}
}