# webGrabber
Config based web crawler

## Installation

```bash
npm install
```

## Chromium on Mac

If you have trouble with chromium on Mac, you can try to install it using homebrew with no quarantine option:

```bash
brew install chromium --no-quarantine
```

## Usage
create a grab config json file in the *src/grabs* directory of the project

Hello World example: *hello-world.json*

```json
{
	"name": "hello-world",
	"actions" : [
		{
			"name" : "log",
			"params" : {
				"text" : "Hello World!"
			}
		}
	]
}
```

Run the app: 
```bash
npm run start
```

## Actions
A full list of actions can be found in the [CoreActions](src/classes/CoreActions.js) class

## Custom Actions
An example of how to add custom actions is found in the [app](app.js)

## Environment Variables
Environment variables can be set in a *.env* file in the root of the project<br>
All variables appended with *GRABBER_* will be loaded into the memory and can be accessed in the config files

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.