import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import Grabber from './src/classes/Grabber.js'
import customize from './src/config/custom.js'
import options from './src/config/options.js'

const argv = process.argv.slice(2)[0]

const main = async () => {
	if (argv === 'server') {
		const app = express()
		app.use(bodyParser.json())

		app.post('/grab', async (req, res) => {
			try {
				const grabber = new Grabber(options)
				customize(grabber)
				await grabber.init(req.body)
				await grabber.grab()
				res.status(200).send('Grab operation completed')
			} catch (error) {
				console.error(error)
				res.status(500).send('Internal Server Error')
			}
		})

		const port = process.env.PORT || 3000
		app.listen(port, () => console.log(`Server running on port ${port}`))
	} else {
		const grabber = new Grabber(options)
		customize(grabber)
		await grabber.init()
		await grabber.grab()
	}
}

void main()
