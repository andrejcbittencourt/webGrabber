import 'dotenv/config'
import Grabber from './src/classes/Grabber.js'
import custom from './custom.js'

const main = async () => {
	let grabber = new Grabber()
	grabber = custom(grabber)
	await grabber.grab()
}

void main()