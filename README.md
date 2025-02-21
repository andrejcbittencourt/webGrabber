<p align="center">
  <img src="assets/images/webGrabber.png" alt="webGrabber" width="300" height="300">
</p>

# webGrabber

webGrabber is a config-based web scraper and browser automation tool that makes it easy to extract data from websites and automate repetitive browsing tasks. With its flexible and powerful set of features, including custom actions, memory interpolation, and the ability to run specific grabs, webGrabber is the perfect solution for streamlining your web scraping and browser automation needs. Whether you are a data analyst, researcher, or web developer, webGrabber has something to offer for everyone.

## Installation

```bash
npm install
```

## Chromium on Mac

If you have trouble with chromium on Mac, you can try to install it using:

```bash
npx puppeteer browsers install chrome
```

Or you can add the executable path to Chrome in the options passed to Puppeteer through Grabber using the [options](src/config/options.js) file:

```js
export default {
	executablePath: '/path/to/Chrome',
}
```

## Usage

Create a grab config (json|yml|yaml) file in the _src/grabs_ directory of the project

Hello World example: _hello-world.json_

```json
{
	"name": "hello-world",
	"actions": [
		{
			"name": "log",
			"params": {
				"text": "Hello World!"
			}
		}
	]
}
```

Hello World example: _hello-world.yml_

```yml
name: hello-world
actions:
  - name: log
    params:
      text: 'Hello World!'
```

## Running the Application

### Local Mode

Run the app and all the grabs in the _src/grabs_ directory will be executed:

```bash
npm run start
```

Run a specific grab:

```bash
npm run start hello-world
```

### Server Mode

Run the app in server mode to start an HTTP server and receive grab configurations via API requests.
In server mode, the application exposes an HTTP POST endpoint to accept JSON payloads for grab configurations.

```bash
npm run start:server
```

#### Endpoint Details

- **Endpoint**: `/grab`
- **Method**: POST
- **Payload**: The endpoint expects a JSON payload containing the grab configuration.
- **Server Port**: The server runs on the port specified in the `PORT` environment variable, with a default fallback to port 3000 if not set.

Send a POST request with a JSON payload to this endpoint to trigger the grab process.

## Actions

A full list of actions can be found in [Actions](src/classes/actions/README.md)

## Custom Actions

An example of how to add custom actions is found in the [custom](src/config/custom.js) file

## Environment Variables

Environment variables can be set in a _.env_ file in the root of the project<br>
All variables prepended with _GRABBER\__ will be loaded into the memory and can be accessed in the config files

## Memory Interpolation

The memory can be accessed in the config files using the _{{variable}}_ syntax

## Return From Action

An action can return a value that can be used in the next action by using the _INPUT_ keyword

## Reserved Variable Names

The following variable names are reserved and should be used in the config files with caution:

- _INPUT_
- _PARAMS_
- _INDENTATION_
- _CURRENT_DIR_
- _BASE_DIR_
- _PAYLOAD_ID_
- _PAGES_
- _ACTIVE_PAGE_

## License

[MIT](https://choosealicense.com/licenses/mit/)
