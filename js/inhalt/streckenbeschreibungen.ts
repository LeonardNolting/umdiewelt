const container = document.getElementById("streckenbeschreibungen")
const anzeige = document.getElementById("streckenbeschreibungen-anzeige") as HTMLUListElement

const streckenbeschreibungen = {
	Adelsdorf: new URL("../../pdf/streckenbeschreibungen/Streckenbericht Adelsdorf.pdf", import.meta.url),
	Pommersfelden: new URL("../../pdf/streckenbeschreibungen/Streckenbericht Pommersfelden.pdf", import.meta.url),
	Hemhofen: new URL("../../pdf/streckenbeschreibungen/Streckenbericht Hemhofen.pdf", import.meta.url),
	Uehlfeld: new URL("../../pdf/streckenbeschreibungen/Streckenbericht Uehlfeld.pdf", import.meta.url),
	Weisendorf: new URL("../../pdf/streckenbeschreibungen/Streckenbericht Weisendorf.pdf", import.meta.url),
}

export default () => {
	anzeige.append(...Object.entries(streckenbeschreibungen).map(([stadt, url]) => {
		const li = document.createElement("li")
		const a = document.createElement("a")
		a.target = "_blank"
		a.href = url.toString()
		a.textContent = stadt
		li.append(a)
		return li
	}))
}
