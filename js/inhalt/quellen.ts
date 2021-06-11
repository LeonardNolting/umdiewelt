import quellen from "../quellen";

const liste = document.getElementById("quellen-anzeige")
export default () => {
	Object.values(quellen).forEach(({name, url, was, wert}) => {
		const listenElement = document.createElement("li")

		const link = document.createElement("a")
		link.href = url
		link.innerHTML = name

		const span = document.createElement("span")
		span.innerHTML = was

		listenElement.append(span, link)
		liste.appendChild(listenElement)
	})
}
