import Strecke from "../../model/strecke";
import streckeFormulierung from "./strecke/strecke"
import {prozent, vorStreckeGefahreneKilometer} from "../../verschieden";
import m from "../../formatierung/einheit/m";

const liste = document.getElementById("feed-anzeige") as HTMLUListElement

const neuesElement = (html: string, wichtig: boolean = false, referenz: Node | null) => {
	const listenElement = document.createElement("li")
	listenElement.innerHTML = html
	liste.insertBefore(listenElement, referenz)
	return listenElement
}
const neuesElementAnfang = (html: string, wichtig: boolean = false) => neuesElement(html, wichtig, liste.firstChild)
const neuesElementEnde = (html: string, wichtig: boolean = false) => neuesElement(html, wichtig, null)
const neuesElementVor = (html: string, wichtig: boolean = false, vor: Node) => neuesElement(html, wichtig, vor)
const neuesElementNach = (html: string, wichtig: boolean = false, nach: Node) => neuesElement(html, wichtig, nach.nextSibling)

const meilensteine = { // TODO
	// 10: "Die ersten 10 Kilometer haben wir ..."
}

export default (streckenNummer: string, strecke: Strecke) => {
	// Formulierung wählen
	// abhängig vom Timestamp -> nicht statisch in db, aber nicht beim neuladen völlig neu
	let element = neuesElementAnfang(streckeFormulierung(strecke))

	// TODO z.B. 50 Prozent besonders anzeigen
	const bisher = vorStreckeGefahreneKilometer(streckenNummer)
	const jetzt = bisher + strecke.laenge
	Object.entries(prozent).filter(([, punkt]) => punkt > bisher && punkt < jetzt).forEach(([faktor, punkt]) => {
		element = neuesElementNach(`Wir haben ${parseInt(faktor) * 100}% geschafft! Das entspricht ${m(punkt)}.`, true, element)
	})
}
