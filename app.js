import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import Grabber from './src/classes/Grabber.js'
import customize from './src/config/custom.js'
import options from './src/config/options.js'

// Initialize Express app
const app = express()
app.use(bodyParser.json())

// Set the default port or use the one from environment variables
const port = process.env.PORT || 3000

// Function to start the server
const startServer = () => {
	app.listen(port, () => console.log(`[webGrabber] Server started on port ${port}`))
}

// Function to run the grabber in local mode
const startLocalMode = async () => {
	await grabber.init()
	await grabber.grab()
}

// Define the root route with a welcome message
app.get('/', (req, res) => {
	const welcomePage = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Welcome to webGrabber</title>
			<style>
					body { 
							font-family: Arial, sans-serif; 
							margin: 0; 
							padding: 0; 
							height: 100vh; 
							display: flex; 
							justify-content: center; 
							align-items: flex-start; 
							background-color: #f4f4f4;
					}
					.card {
							margin-top: 40px;
							width: 430px;
							background-color: #fff;
							box-shadow: 0 4px 8px rgba(0,0,0,0.1);
							padding: 20px;
							border-radius: 8px;
							text-align: center;
					}
					h1 { 
							color: #4A90E2; 
							font-size: 24px;
					}
					p { 
							color: #555; 
							font-size: 16px;
					}
					.info {
							margin-top: 20px; 
							font-size: 14px; 
							color: #333;
					}
					.code { 
							background-color: #f5f5f5; 
							border-left: 3px solid #4A90E2; 
							padding: 10px; 
							margin: 10px 0; 
							word-wrap: break-word;
					}
			</style>
	</head>
	<body>
			<div class="card">
					<h1>Welcome to webGrabber</h1>
					<p>The robust, config-based web scraping and automation tool.</p>
					<div class="info">
							To run a grab configuration, send a <b>POST</b> request to the following endpoint:
							<div class="code">http://localhost:${port}/grab</div>
							Include your grab configuration in the request's JSON payload.<br>
							Check the documentation for more information.
					</div>
			</div>
	</body>
	</html>
	`
	res.send(welcomePage)
})

// Define the /grab endpoint for grabbing configurations
app.post('/grab', async (req, res) => {
	try {
		await grabber.init(req.body)
		await grabber.grab()
		res.status(200).send('Grab operation completed successfully')
	} catch (error) {
		console.error(`[webGrabber] Error during grab operation: ${error.message}`)
		res.status(500).send('Internal Server Error')
	}
})

// Determine the mode based on the command-line argument
const argv = process.argv.slice(2)[0]
const grabber = new Grabber(options)
customize(grabber)
if (argv === 'server') {
	console.log('[webGrabber] Launching in server mode...')
	startServer()
} else {
	console.log('[webGrabber] Launching in local mode...')
	startLocalMode()
}
