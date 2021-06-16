export default () => {
	document.getElementById("#popup-hintergrund").addEventListener("click", () => {
		document.querySelectorAll("#popups > *:not(#popup-hintergrund)")
			.forEach(element => element.classList.remove("offen"))
	})
}
