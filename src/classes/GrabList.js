class Grab {
	#name
	#description
	#actions

	constructor(grab) {
		this.#name = grab.name
		this.#description = grab.description || 'No description provided'
		this.#actions = grab.actions
	}

	get name() {
		return this.#name
	}

	get description() {
		return this.#description
	}

	get actions() {
		return this.#actions
	}
}

class GrabList {
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
		this.#list.push(new Grab(grab))
	}
}

export default class GrabListFactory {
	static create() {
		return new GrabList()
	}
}
