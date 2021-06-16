export default () => {
	document.getElementById("eintragen-anzeige").addEventListener("submit", event => {
		event.preventDefault();
		console.log("eintragen submit");
	})
}
