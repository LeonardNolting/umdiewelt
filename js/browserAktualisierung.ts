// noinspection TypeScriptCheckImport
import browserUpdate from 'browser-update/update.npm.js';

export default () => browserUpdate({
	l: "de",
	container: document.getElementById("browser-aktualisierung"),
	shift_page_down: false
})
