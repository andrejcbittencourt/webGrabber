import { interpolation, displayText } from '../../utils/utils.js'

class Action {
	#action

	constructor(action) {
		this.#action = action
	}

	async run(brain, page) {
		await this.#action(brain, page)
	}
}

export class ActionList {
	#list

	constructor() {
		this.#list = new Map()
	}

	add(name, action) {
		this.#list.set(name, new Action(action))
	}

	has(name) {
		return this.#list.has(name)
	}

	async run(name, brain, page) {
		displayText(brain, [
			{text: 'Running action :', color: 'blue', style: 'bold'},
			{text: name, color: 'whiteBright'}
		])
		if(brain.recall('PARAMS'))
			brain.learn('PARAMS', interpolation(brain.recall('PARAMS'), brain))
		await this.#list.get(name).run(brain, page)

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

	async run(name, brain, page) {
		const actionList = this.#container.find(list => list.has(name))
		if(!actionList) throw new Error(`Action ${name} not found`)
		await actionList.run(name, brain, page)
	}
}