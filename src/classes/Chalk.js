import chalk from 'chalk'

export default class Chalk {

	static create(templateArray) {
		let chalkText = ''
		// reverse the array so that the last element is the first to be styled
		templateArray.reverse()
		templateArray.forEach(template => {
			const { text, color, background, style } = template
			let tmpText = ''
			if(color && background && style) tmpText = chalk[color][background][style](text)
			else if(color && background) tmpText = chalk[color][background](text)
			else if(color && style) tmpText = chalk[color][style](text)
			else if(background && style) tmpText = chalk[background][style](text)
			else if(color) tmpText = chalk[color](text)
			else if(background) tmpText = chalk[background](text)
			else if(style) tmpText = chalk[style](text)
			else tmpText = chalk(text)
			chalkText = chalk(tmpText, chalkText)
		})
		return chalkText
	}
	
	static write(chalkText) {
		console.log(chalkText)
	}
}