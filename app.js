import 'dotenv/config'
import Grabber from './src/classes/Grabber.js'
import customize from './src/config/custom.js'
import options from './src/config/options.js'

const main = async () => {
	let grabber = new Grabber(options)
	grabber = customize(grabber)
	await grabber.grab()
}

void main()