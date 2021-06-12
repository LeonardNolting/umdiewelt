import Strecke from "../../model/strecke";
import streckeFormulierung from "./strecke"
import prozentFormulierung from "./prozent"
import {prozent, vorStreckeGefahreneKilometer} from "../../verschieden";

const liste = document.getElementById("feed-anzeige") as HTMLUListElement

const neuesElement = (html: string, wichtig: boolean = false, referenz: Node | null) => {
	const listenElement = document.createElement("li")
	listenElement.innerHTML = html
	if (wichtig) listenElement.classList.add("wichtig")
	liste.insertBefore(listenElement, referenz)
	return listenElement
}
const neuesElementAnfang = (html: string, wichtig: boolean = false) => neuesElement(html, wichtig, liste.firstChild)
const neuesElementEnde = (html: string, wichtig: boolean = false) => neuesElement(html, wichtig, null)
const neuesElementVor = (html: string, wichtig: boolean = false, vor: Node) => neuesElement(html, wichtig, vor)
const neuesElementNach = (html: string, wichtig: boolean = false, nach: Node) => neuesElement(html, wichtig, nach.nextSibling)

export default (streckenNummer: string, strecke: Strecke) => {
	/**
	 * entspricht im Format dem Rückgabewert von `Math.random()`
	 *
	 * abhängig vom Timestamp -> nicht statisch in db, aber nicht beim neuladen völlig neu
	 */
	const random = strecke.zeitpunkt % 1000 / 1000,
		zufaelligerIndex = (length: number) => Math.floor(random * length)

	// Formulierung für Eintrag von Strecke
	const element = neuesElementAnfang(streckeFormulierung(strecke, zufaelligerIndex))

	// Formulierung für Eintrag von Prozentmeldungen
	// TODO z.B. 50 Prozent besonders anzeigen
	const bisher = vorStreckeGefahreneKilometer(streckenNummer),
		jetzt = bisher + strecke.laenge
	Object.entries(prozent).filter(([, punkt]) => punkt > bisher && punkt < jetzt).forEach(([prozent, punkt]) => {
		neuesElementNach(prozentFormulierung(prozent, punkt, zufaelligerIndex), true, element)
	})
}

// TODO Funktion um von unten nachladen zu können
