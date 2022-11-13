import ActionList from './ActionList.js'

export default class CustomActions extends ActionList {
	#actions

	constructor() {
		super()
		this.#actions = []
	}

	load() {
		// for each custom action
		this.#actions.forEach(action => {
			this.addAction(action[0], action[1])
		})
	}

	add(name, action) {
		this.#actions.push([name, action])
	}
}
