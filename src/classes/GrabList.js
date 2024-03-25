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

	isEmpty() {
		return this.#list.length === 0
	}

	add(grab) {
		this.#list.push(new Grab(grab.name, grab.actions))
	}

	clone(grab) {
		const clone = new GrabList()
		clone.add(grab)
		return clone
	}
}
