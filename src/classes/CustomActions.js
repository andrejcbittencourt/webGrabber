import ActionList from './ActionList.js'

export default class CustomActions extends ActionList {
	#actions

	constructor() {
		super()
		this.#actions = []
	}

	async load(page) {
		// for each custom action
		this.#actions.forEach(action => {
			this.addAction(page, action[0], action[1])
		})
	}

	async add(name, action) {
		this.#actions.push([name, action])
	}
}
