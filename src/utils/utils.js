import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// get all grab configs from grabs folder
export const GetGrabList = () => {
  const files = fs.readdirSync(path.join(__dirname, '/../grabs'))
  const grabList = []
  files.forEach(file => {
    if(file !== ".gitkeep") {
      const rawdata = fs.readFileSync(path.join(__dirname, `/../grabs/${file}`))
      grabList.push(JSON.parse(rawdata))
    }
  })
  return grabList
}

export const Interpolation = async (params) => {
  const regex = /{{(.*?)}}/g
  
  // for each param
  const cloneParams = structuredCloneJSON.parse(JSON.stringify(params))
  for (const [key, value] of Object.entries(cloneParams)) {
    // if it's a string
    if (typeof value === 'string') {
      // replace env vars
      const match = value.match(regex)
      if (match) {
        match.forEach(string => {
          const expression = string.replace('{{', '').replace('}}', '')
          cloneParams[key] = eval(expression)
        })
      }
    }
  }
  return cloneParams
}