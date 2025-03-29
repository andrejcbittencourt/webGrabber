# Actions

This document lists all core actions defined in `CoreActionList`,
along with the parameters.

---
### `appendToText`
**Parameters:** `key, filename`

---

### `appendToVariable`
**Parameters:** `key, value`

---

### `backToParentDir`
**Parameters:** `None`

---

### `checkStringInFile`
**Parameters:** `filename, string`

---

### `click`
**Parameters:** `selector, attribute, text`

---

### `clickAll`
**Parameters:** `selector`

---

### `closePage`
**Parameters:** `pageKey`

---

### `countDecrement`
**Parameters:** `key`

---

### `countIncrement`
**Parameters:** `key`

---

### `countStart`
**Parameters:** `key, value`

---

### `createDir`
**Parameters:** `None`

---

### `createFile`
**Parameters:** `filename`

---

### `deleteFile`
**Parameters:** `filename`

---

### `deleteFolder`
**Parameters:** `foldername`

---

### `deleteVariable`
**Parameters:** `key`

---

### `download`
**Parameters:** `url, filename, host`

---

### `elementExists`
**Parameters:** `selector`

---

### `fileExists`
**Parameters:** `filename`

---

### `for`
**Parameters:** `from, until, step, actions`

---

### `forEach`
**Parameters:** `key, actions`

---

### `getChildren`
**Parameters:** `selectorParent, selectorChild, attribute`

---

### `getElements`
**Parameters:** `selector, attribute`

---

### `getExtension`
**Parameters:** `string`

---

### `getVariable`
**Parameters:** `key, index`

---

### `if`
**Parameters:** `condition, actions`

---

### `ifElse`
**Parameters:** `condition, actions, elseActions`

---

### `listFolders`
**Parameters:** None

---

### `log`
**Parameters:** `text, color, background`

---

### `login`
**Parameters:** `url, usernameSelector, username, passwordSelector, password, submitSelector, cookieName,`

---

### `matchFromSelector`
**Parameters:** `selector, regex`

---

### `matchFromString`
**Parameters:** `regex, string`

---

### `newPage`
**Parameters:** `pageKey`

---

### `puppeteer`
**Parameters:** `func, func2, ...rest`

---

### `random`
**Parameters:** `min, max`

---

### `readFromText`
**Parameters:** `filename, breakLine = false`

---

### `replaceString`
**Parameters:** `string, search, replace`

---

### `resetCurrentDir`
**Parameters:** None

---

### `sanitizeString`
**Parameters:** `string`

---

### `saveToText`
**Parameters:** `key, filename`

---

### `screenshot`
**Parameters:** `name, type, fullPage`

---

### `screenshotElement`
**Parameters:** `name, type, selector`

---

### `scrollWaitClick`
**Parameters:** `selector, ms = 2000`

---

### `setBaseDir`
**Parameters:** `dir`

---

### `setCurrentDir`
**Parameters:** `None`

---

### `setVariable`
**Parameters:** `key, value`

---

### `sleep`
**Parameters:** `ms`

---

### `switchPage`
**Parameters:** `pageKey`

---

### `transferVariable`
**Parameters:** `from, index, key, to`

---

### `type`
**Parameters:** `selector, text, secret = false`

---

### `userInput`
**Parameters:** `query`

---

### `uuid`
**Parameters:** `None`

---

### `while`
**Parameters:** `condition, actions`
