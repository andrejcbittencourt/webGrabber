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

	constructor() {
		this.#list = {}
	}

	addAction(name, action) {
		this.#list[name] = new Action(action)
	}

	hasAction(name) {
		return this.#list[name] ? true : false
	}

	async runAction(name, memory, page) {
		const input = memory.get('input')
		console.log(`Running action: ${name}${input ? ', with input:' : ''}`)
		if (input) console.log(input)
		await this.#list[name].run(memory, page)
	}
}
