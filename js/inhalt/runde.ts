const element = document.getElementById("runde")

export default (wert: number | null, max: number | null) => {
	element.dataset.wert = wert ? wert.toString() : null
	element.dataset.max = max ? max.toString() : null
}
