import {child, onValue, ref, update, increment} from "firebase/database";
import {Datenbank} from "../firebase/datenbank/datenbank";
import aktualisieren from "../aktualisieren";
import m from "../formatierung/einheit/m";

export const saisonAuswahl = document.getElementById("saison-auswahl")
const lis = () => Array.from(saisonAuswahl.children) as HTMLLIElement[];
const li = (saison: string, elements: HTMLLIElement[] = lis()) => elements.find(li => li.textContent === saison)


export const bieteSaisonZurAuswahlAn = (saison: string) => {
	if (li(saison)) return
	const neuesLi = document.createElement("li")
	neuesLi.textContent = saison
	neuesLi.onclick = () => waehleSaisonAus(saison)
	saisonAuswahl.appendChild(neuesLi)
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
	return ladeSaison(saison)
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
const ladeSaison = async (saison: string) => {
	// TODO document.body.progress = true
	const saisonRef = ref(Datenbank.datenbank, "saisons/" + saison)
	const saisonsContainer = document.getElementById("saisons")

	let saisonContainer
	const bestehenderSaisonContainer = (Array.from(saisonsContainer.children) as HTMLDivElement[]).find((child) =>
		child.dataset.saison === saison
	)

	if (bestehenderSaisonContainer) {
		saisonContainer = bestehenderSaisonContainer
	} else {
		// Initialisieren
		saisonContainer = document.createElement("div")
		saisonContainer.classList.add("saison")
		saisonContainer.dataset.saison = saison
		saisonContainer.style.setProperty("--saison", saison)

		// Listener hinzufügen
		await onValue(child(saisonRef, "zeit"), snap => {
			saisonContainer?.innerHTML = ""

			const jetzt = Date.now()
			const {start, ende}: { start: number | undefined, ende: number | undefined } = snap.val()

			const startGegeben = !!start
			const endeGegeben = !!ende
			const endeInZukunft = endeGegeben && ende > jetzt
			const startInZukunft = startGegeben && start > jetzt
			const historisch = endeGegeben && !endeInZukunft

			// "Wird bald starten..."
			if (!startGegeben) {

			}

			// Fakten...
			if (startGegeben) {
				const div = document.createElement("div")
				div.classList.add("fakten")

				const fakt = (
					name: string,
					html: string,
					berechnen: (wert: number) => {
						wert: number,
						einheit?: string
					} = (wert) => ({wert}),
					callback: (wert: number, berechnet: {
						wert: number,
						einheit?: string
					}) => void = () => {
					}
				) => {
					const data = document.createElement("data")
					data.innerHTML = html

					onValue(child(saisonRef, name), snap => {
						const wert = snap.val() || 0;
						const berechnet = berechnen(wert)
						data.value = berechnet.wert.toString()
						data.dataset.einheit = berechnet.einheit
						callback(wert, berechnet)
					}, {onlyOnce: historisch})

					return data
				}

				div.append(
					fakt("strecke", "Zurückgelegte Strecke", wert => m(wert), async wert => {
						await aktualisieren(wert)
						// TODO Anzeige der Saison auf Karte https://github.com/LeonardNolting/umdiewelt/projects/1#card-66445855
					}),
					fakt("anzahlStrecken", "Eingetragene Strecken"),
					fakt("anzahlFahrer", "Teilnehmer")
				)

				saisonContainer.appendChild(div)
			}

			// Countdowns...
			if (startInZukunft) {

			}
			if (endeInZukunft) {

			}

			// Schulen...
			{
				const schulenContainer = document.createElement("div")
				schulenContainer.classList.add("schulen")

				// nicht onChildAdded, da live-Funktionalität nicht benötigt (und onChildAdded immer weiter listenen würde)
				onValue(child(saisonRef, "schulen"), snap => {
					snap.forEach(childSnap => {
						const name = childSnap.key
						const schuleRef = child(saisonRef, "schulen/" + name)
						const schuleContainer = document.createElement("div")
						schuleContainer.classList.add("schule")
						schuleContainer.dataset.schule = name

						{
							const ueberschrift = document.createElement("h3")
							ueberschrift.textContent = name
							schuleContainer.append(ueberschrift)
						}

						// TODO setze background
						// TODO Saisons der Schule

						// TODO Fakten (inkl. Beteiligung in % (bei potFahrern))

						{
							const button = document.createElement("button")
							button.classList.add("anfeuern")
							button.textContent = "🔥 Anfeuern"
							button.onclick = () => {
								update(schuleRef, {
									"angefeuert": increment(1)
								})
							}

							const em = document.createElement("em")
							em.classList.add("angefeuert")
							const output = document.createElement("output")
							em.append(output, "x angefeuert")

							onValue(child(schuleRef, "angefeuert"), snap => {
								output.textContent = snap.val() || 0
							})

							schuleContainer.append(button, em)
						}

						// TODO Klassen

						schulenContainer.append(schuleContainer)
					})
				}, {onlyOnce: true})

				saisonContainer.append(schulenContainer)
			}

			if (startGegeben) {
				// * Baldige/jetzige/alte Saison

				if (!historisch) {
					// * 2., 3., 4.
					// * Aktuelle Saison

					if (startInZukunft) {
						// * 3.
						// Countdown zu Start
					} else if (endeInZukunft) {
						// * 4.
						// Countdown zu Ende
					}
				} else {
					// * 1.
					// * Historische Saison
				}
			} else {
				// * 5.
				// * Zukünftige Saison
			}

			// Wie teilnehmen
			if (!historisch) {
				const div = document.createElement("div")
				div.classList.add("mitmachen")

				div.append(...Object.entries({
					erklaerung:
						"Du willst mit deiner Klasse auch teilnehmen?<wbr>" +
						"Bitte fragt euren Klassenlehrer/eure Klassenlehrerin, ob er/sie mit Herrn Hipp Kontakt aufnehmen kann.",
					hinweis:
						"In dieser Saison können nur Klassen der oben gezeigten Schulen teilnehmen. <a href='#mitmachen'>Mehr Informationen</a>"
				}).map(([name, html]) => {
					const p = document.createElement("p")
					p.classList.add(name)
					p.innerHTML = html
					return p
				}))

				saisonContainer.append(div)
			}
		})

		saisonsContainer.append(saisonContainer)
	}

	// Timeout um obiges `append` abzuwarten - sonst funktioniert die transition von `ausgewaehlt` nicht 🤷‍
	setTimeout(() => {
		Array.from(saisonsContainer.children).find(child => child.classList.contains("ausgewaehlt"))?.classList?.remove("ausgewaehlt")
		saisonContainer.classList.add("ausgewaehlt")
	}, 0)
}
