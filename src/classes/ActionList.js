class Action {
	#action
	#page

	constructor(action, page) {
		this.#action = action
		this.#page = page
	}

	async run(memory) {
		await this.#action(memory, this.#page)
	}
}

export default class ActionList {
	#list

	constructor() {
		this.#list = {}
	}

	addAction(page, name, action) {
		this.#list[name] = new Action(action, page)
	}

	hasAction(name) {
		return this.#list[name] ? true : false
	}

	async runAction(name, memory) {
		const input = memory.get('input')
		console.log(`Running action: ${name}${input ? ', with input:' : ''}`)
		if (input) console.log(input)
		await this.#list[name].run(memory)
	}
}
