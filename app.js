import 'dotenv/config'
import Grabber from './src/classes/Grabber.js'

const main = async () => {
	const grabber = new Grabber()
	// add custom actions here
	
	await grabber.grab()
}

void main()