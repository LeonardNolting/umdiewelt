import {
	child,
	onValue,
	ref,
	update,
	increment,
	onChildAdded,
	get,
	DatabaseReference,
	DataSnapshot, onChildRemoved
} from "firebase/database";
import {Datenbank} from "../firebase/datenbank";
import m from "../formatierung/einheit/m";
import {bereiteFaktVor, HTMLDataElementFakt, ladeFakt} from "./fakten";
import load from "../load";

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
	return load(ladeSaison(saison))
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
	const saisonRef = ref(Datenbank.datenbank, "allgemein/saisons/details/" + saison)
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

		await maleSaison(saison, saisonRef, saisonContainer)

		saisonsContainer.append(saisonContainer)
	}

	// Timeout um obiges `append` abzuwarten - sonst funktioniert die transition von `ausgewaehlt` nicht 🤷‍
	setTimeout(() => {
		Array.from(saisonsContainer.children).find(child => child.classList.contains("ausgewaehlt"))?.classList?.remove("ausgewaehlt")
		saisonContainer.classList.add("ausgewaehlt")
	}, 0)
}

const berechneStatus = (saison: string, laufende: string, aktive: string, aktuelle: string) => {
	const laufend = laufende === saison
	const aktiv = aktive === saison
	const aktuell = aktuelle === saison
	const historisch = !aktuell
	const zukuenftig = aktuell && !aktiv
	// const
	return {laufend, aktiv, aktuell, historisch, zukuenftig}
}

const maleSaison = async (saison: string, saisonRef: DatabaseReference, container: HTMLDivElement) => {
	container.classList.add("saison")
	container.dataset.saison = saison
	container.style.setProperty("--saison", saison)

	const jetzt = Date.now()
	let zeit: { start: number | undefined, ende: number | undefined } | undefined = undefined,
		laufende: string | undefined | null = undefined,
		aktive: string | undefined | null = undefined,
		aktuelle: string | undefined | null = undefined,
		fertig = () => zeit !== undefined && laufende !== undefined && aktive !== undefined && aktuelle !== undefined

	const probieren = () => {
		if (!fertig()) return

		// Status der Saison steht fest ...
		const status = berechneStatus(saison, laufende, aktive, aktuelle)

		// Container leeren
		if (container != null) container.innerHTML = ""

		// "Wird bald starten..."
		if (status.zukuenftig) {

		}

		// Fakten...
		if (!status.zukuenftig) {
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
				const data = document.createElement("data") as HTMLDataElementFakt
				data.innerHTML = html
				data.classList.add("fakt")

				bereiteFaktVor(data)

				const ladeFaktUndCallback = (snap: DataSnapshot) => {
					const wert = snap.val() || 0;
					const berechnet = berechnen(wert);
					ladeFakt(data, berechnet)
					callback(wert, berechnet)
				}
				const faktRef = child(saisonRef, name)
				if (status.historisch) get(faktRef).then(ladeFaktUndCallback)
				else onValue(faktRef, ladeFaktUndCallback)

				return data
			}

			div.append(
				fakt("strecke", "Zu&shy;rück&shy;ge&shy;legte Strecke", wert => m(wert)),
				fakt("anzahlFahrer", "Teil&shy;nehmer"),
				fakt("anzahlStrecken", "Ein&shy;ge&shy;tragene Strecken")
			)

			container.appendChild(div)
		}

		// Countdowns...
		// TODO neue Zeitenstruktur
		if (zeit.start && zeit.start > jetzt) {
			// TODO
		}
		if (zeit.ende && zeit.ende > jetzt) {
			// TODO
		}

		// Schulen...
		{
			const schulenContainer = document.createElement("div")
			schulenContainer.classList.add("schulen")

			const maleSchule = (schule: string) => {
				const schuleRef = child(saisonRef, "schulen/details/" + schule)
				const schuleContainer = document.createElement("div")
				schuleContainer.classList.add("schule")
				schuleContainer.dataset.schule = schule

				{
					const ueberschrift = document.createElement("h3")
					ueberschrift.textContent = schule
					schuleContainer.append(ueberschrift)
				}

				// TODO setze background

				{
					const ul = document.createElement("ul")
					ul.classList.add("jahre")
					onChildAdded(ref(Datenbank.datenbank, "allgemein/schulen/details/" + schule + "/saisons/liste"), snap => {
						const li = document.createElement("li")
						li.textContent = snap.key
						ul.append(li)
					})
					schuleContainer.append(ul)
				}

				// TODO Fakten (inkl. Beteiligung in % (bei potFahrern))

				{
					if (status.laufend) {
						const button = document.createElement("button")
						button.classList.add("anfeuern")
						button.textContent = "🔥 Anfeuern"
						button.onclick = () => {
							update(schuleRef, {
								"angefeuert": increment(1)
							})
						}
						schuleContainer.append(button)
					}

					const em = document.createElement("em")
					em.classList.add("angefeuert")
					const output = document.createElement("output")
					em.append(output, "x angefeuert")

					onValue(child(schuleRef, "angefeuert"), snap => {
						output.textContent = snap.val() || 0
					})

					schuleContainer.append(em)
				}

				// TODO Klassen
				if (status.aktuell) {
					const table = document.createElement("table")
					table.classList.add("klassen")

					onChildAdded(ref(Datenbank.datenbank, "spezifisch/klassen/liste/" + schule), ({key: klasse}) => {
						const tr = table.insertRow()
						tr.dataset.klasse = klasse
						{
							const td = tr.insertCell()
							td.textContent = klasse
						}
						onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/strecke"), snap => {
							const wert = snap.val() || 0
							const td = tr.insertCell()
							td.textContent = wert
						})
						onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/anzahlStrecken"), snap => {
							const wert = snap.val() || 0
							const td = tr.insertCell()
							td.textContent = wert
						})
					})
					onChildRemoved(ref(Datenbank.datenbank, "spezifisch/klassen/liste/" + schule), ({key: klasse}) =>
						Array.from(table.rows).find(row => row.dataset.klasse === klasse).remove())

					schuleContainer.append(table)
				}

				schulenContainer.append(schuleContainer)
			}

			// nicht onChildAdded, da live-Funktionalität nicht benötigt (und onChildAdded immer weiter listenen würde)
			// zusätzlich: get -> einmal abfragen, dann offline (schnell)
			get(child(saisonRef, "schulen/liste")).then(snap =>
				snap.forEach(childSnap => maleSchule(childSnap.key)))

			container.append(schulenContainer)
		}

		if (!status.historisch) {
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

			container.append(div)
		}
	}

	onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
		if (laufende !== snap.val()) {
			laufende = snap.val()
			probieren()
		}
	})

	onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktiv"), snap => {
		if (aktive !== snap.val()) {
			aktive = snap.val()
			probieren()
		}
	})

	onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
		if (aktuelle !== snap.val()) {
			aktuelle = snap.val()
			probieren()
		}
	})

	onValue(child(saisonRef, "zeit"), snap => {
		zeit = snap.val() || {}
		probieren()
	})
}
