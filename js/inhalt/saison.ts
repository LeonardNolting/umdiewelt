import {child, onValue, ref} from "firebase/database";
import {Datenbank} from "../firebase/datenbank/datenbank";
import aktualisieren from "../aktualisieren";

export const saisonAuswahl = document.getElementById("saison-auswahl")
const ul = saisonAuswahl.querySelector("ul.jahre")
const lis = () => Array.from(ul.children) as HTMLLIElement[];
const li = (saison: string, elements: HTMLLIElement[] = lis()) => elements.find(li => li.textContent === saison)


export const bieteSaisonZurAuswahlAn = (saison: string) => {
	if (li(saison)) return
	const neuesLi = document.createElement("li")
	neuesLi.textContent = saison
	neuesLi.onclick = () => waehleSaisonAus(saison)
	ul.appendChild(neuesLi)
}

export const waehleSaisonAus = (saison: string) => {
	// Saisonauswahl
	const elements = lis()
	const auszuwaehlen = li(saison, elements)
	if (auszuwaehlen === undefined) throw new Error("Kann Saison " + saison + " nicht auswählen, da sie nicht zu Auswahl angeboten wurde.")
	const abzuwaehlen = ausgewaehlteSaisonLi(elements)
	abzuwaehlen?.classList.remove("ausgewaehlt")
	auszuwaehlen.classList.add("ausgewaehlt")
	const offset = elements.indexOf(auszuwaehlen)
	saisonAuswahl.style.setProperty("--offset", offset.toString())

	// Saisonanzeige
	ladeSaison(saison)
}

export const ausgewaehlteSaisonLi = (elements: HTMLLIElement[] = lis()) =>
	elements.find(li => li.classList.contains("ausgewaehlt"))

export const ausgewaehlteSaison = (elements: HTMLLIElement[] = lis()) =>
	ausgewaehlteSaisonLi(elements)?.textContent

export const markiereSaisonAlsNeu = (saison: string) => {
	li(saison).classList.add("neu")
}

/**
 * Zeigt eine Saison an
 * 1. Falls Start gegeben, Ende gegeben und Ende vor jetzt: Schlichte Anzeige, **nicht** live (da alte Saisons standardmäßig nicht bearbeitet werden)
 * 2. Falls Start gegeben und Ende nicht gegeben: Live-Anzeige, da dies die aktuelle Saison ist
 * 3. Falls Start gegeben und Start vor jetzt: Countdown zum Start
 * 4. Falls Start gegeben, Ende gegeben und Ende nach jetzt: Live-Anzeige, da dies die aktuelle Saison ist + Countdown zum Ende
 * 5. Falls Start nicht gegeben: Hinweis, dass bald gestartet wird und bisher eingetragene Klassen
 * @param saison
 */
const ladeSaison = (saison: string) => {
	const saisonRef = ref(Datenbank.datenbank, "saisons/" + saison)

	onValue(child(saisonRef, "strecke"), async snap => {
		const strecke = snap.val() || 0
		await aktualisieren(strecke)
		// TODO Anzeige der Saison auf Karte https://github.com/LeonardNolting/umdiewelt/projects/1#card-66445855
	})

	onValue(child(saisonRef, "zeit"), snap => {
		const jetzt = Date.now()
		const {start, ende}: {start: number | undefined, ende: number | undefined} = snap.val()

		const endeGegeben = !!ende
		const endeInZukunft = ende > jetzt
		const startInZukunft = start > jetzt

		if (start) {
			// Baldige/jetzige/alte Saison

			if (!endeGegeben || endeInZukunft) {
				// 2., 3., 4.
				// Aktuelle Saison

				if (startInZukunft) {
					// 3.
					// Countdown zu Start
				} else if (endeInZukunft) {
					// 4.
					// Countdown zu Ende
				}
			} else {
				// 1.
				// Historische Saison
			}
		} else {
			// 5.
			// Zukünftige Saison
		}
	})
}
