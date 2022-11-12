class Grab {
	#name
	#actions

	constructor(name, actions) {
		this.#name = name
		this.#actions = actions
	}

	get name() {
		return this.#name
	}

	get actions() {
		return this.#actions
	}
}

export default class GrabList {
	#list

	constructor() {
		this.#list = []
	}

	get list() {
		return this.#list
	}

	addGrab(grab) {
		this.#list.push(new Grab(grab.name, grab.actions))
	}
}
