import 'dotenv/config'
import Grabber from './src/Entities/Grabber.js'

const main = async () => {
	const grabber = new Grabber()
	await grabber.grab()
}

void main()