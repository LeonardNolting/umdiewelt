import quellen from "../quellen";
import Popup from "../popup";

const liste = document.getElementById("quellen-anzeige")
const popup = document.getElementById("popup-quellen")
export default () => {
	document.getElementById("popup-quellen-fertig").addEventListener("click", () => Popup.schliessen(popup))
	document.getElementById("quellen").addEventListener("click",
		() => Popup.oeffnen(popup)
	)

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
