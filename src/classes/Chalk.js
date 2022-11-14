import chalk from 'chalk'

export default class Chalk {

	static create(templateArray) {
		let chalkText = ''
		// reverse the array so that the last element is the first to be styled
		templateArray.reverse()
		templateArray.forEach(template => {
			const { text, color, background, style } = template
			if(color && background && style) chalkText = chalk[color][background][style](text, chalkText)
			else if(color && background) chalkText = chalk[color][background](text, chalkText)
			else if(color && style) chalkText = chalk[color][style](text, chalkText)
			else if(background && style) chalkText = chalk[background][style](text, chalkText)
			else if(color) chalkText = chalk[color](text, chalkText)
			else if(background) chalkText = chalk[background](text, chalkText)
			else if(style) chalkText = chalk[style](text, chalkText)
			else chalkText = chalk(text, chalkText)
		})
		return chalkText
	}
	
	static write(chalkText) {
		console.log(chalkText)
	}
}