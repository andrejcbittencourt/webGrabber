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
				{text: ' '.repeat(memory.get('IDENTATION'))},
				{text:'Running action :', color:'blue', style:'bold'},
				{text: name, color: 'whiteBright'}
			]))
			if(memory.get('PARAMS'))
				memory.set('PARAMS', interpolation(memory.get('PARAMS'), memory))
			await this.#list[name].run(memory, page)
		} else
			await this.#customActions.runAction(name, memory, page)
	}
}