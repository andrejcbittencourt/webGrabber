import 'dotenv/config'
import Grabber from './src/classes/Grabber.js'
import customize from './src/config/custom.js'
import options from './src/config/options.js'

const main = async () => {
	let grabber = new Grabber(options)
	customize(grabber)
	await grabber.init()
	await grabber.grab()
}

void main()
