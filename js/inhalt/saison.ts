import {
	child,
	DatabaseReference,
	DataSnapshot,
	get,
	increment,
	onChildAdded,
	onChildRemoved,
	onValue,
	ref,
	update
} from "firebase/database";
import Datenbank from "../firebase/datenbank";
import m from "../formatierung/einheit/m";
import {HTMLDataElementFakt, ladeFakt, zeigeFaktAn} from "./fakten";
import load from "../load";
import zahl from "../formatierung/zahl";

export const saisonAuswahl = document.getElementById("saison-auswahl")
const saisonsWrapper = document.getElementById("saisons-wrapper")
const lis = () => Array.from(saisonAuswahl.children) as HTMLLIElement[];
const li = (saison: string, elements: HTMLLIElement[] = lis()) => elements.find(li => li.textContent === saison)


export const bieteSaisonZurAuswahlAn = (saison: string) => {
	if (li(saison)) return
	saisonsWrapper.classList.remove("leer")
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
		container?.innerHTML = ""

		if (status.zukuenftig) {
			const p = document.createElement("p")
			p.classList.add("hinweis-zukuenftig")
			p.textContent = "Wird bald starten..."
			container.append(p)
		}

		// Fakten...
		// if (!status.zukuenftig) {
		if (status.laufend || status.historisch) {
			const div = document.createElement("div")
			div.classList.add("fakten", "horizontal", "container")

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

				const ladeFaktUndCallback = (snap: DataSnapshot) => {
					const wert = snap.val() || 0;
					const berechnet = berechnen(wert);
					ladeFakt(data, berechnet, true, 0)
					zeigeFaktAn(data);
					callback(wert, berechnet)
				}
				const faktRef = child(saisonRef, name)
				if (status.historisch) get(faktRef).then(ladeFaktUndCallback)
				else onValue(faktRef, ladeFaktUndCallback)

				return data
			}

			const fakten = [
				fakt("strecke", "Zu&shy;rück&shy;ge&shy;legte Strecke", wert => m(wert)),
				fakt("anzahlFahrer", "Teil&shy;nehmer"),
				fakt("anzahlStrecken", "Ein&shy;ge&shy;tragene Strecken")
			]
			div.append(...fakten)

			container.appendChild(div)
		}

		const countdown = (typ: "start" | "ende") => {
			const p = document.createElement("p")
			p.classList.add("countdown", typ)
			p.dataset.typ = typ
			const differenz = Math.floor((zeit[typ] - jetzt) / 1000)
			const formatieren = (number: number) => Math.round(number).toString().padStart(2, "0")
			if (60 * 60 * 24 > differenz) {
				let timer = differenz, stunden, minuten, sekunden
				const interval = setInterval(function () {
					sekunden = timer
					stunden = sekunden / 3600
					sekunden %= 3600
					minuten = sekunden / 60
					sekunden = sekunden % 60

					minuten = minuten < 10 ? "0" + minuten : minuten
					sekunden = sekunden < 10 ? "0" + sekunden : sekunden

					p.textContent = `${formatieren(stunden)}:${formatieren(minuten)}:${formatieren(sekunden)}`

					if (timer === 0) clearInterval(interval)
					timer--
				}, 1000);
				p.classList.add("monospace")
			} else {
				p.textContent = `${typ.charAt(0).toUpperCase() + typ.substr(1)} in ${formatieren(differenz / 3600 / 24)} Tagen`
			}
			container.append(p)
		}
		// Countdowns...
		if (zeit.start && zeit.start > jetzt) countdown("start")
		if (zeit.ende && zeit.ende > jetzt) countdown("ende")

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
						let timeout
						button.onclick = () => {
							button.disabled = true
							if (timeout) clearTimeout(timeout)
							timeout = setTimeout(() => button.disabled = false, 3000)

							update(schuleRef, {
								"angefeuert": increment(1)
							})
						}
						schuleContainer.append(button)
					}
					if (status.laufend || status.historisch) {
						const em = document.createElement("em")
						em.classList.add("angefeuert")
						const output = document.createElement("output")
						em.append(output, "x angefeuert")

						onValue(child(schuleRef, "angefeuert"), snap => {
							output.textContent = snap.val() || 0
						})

						schuleContainer.append(em)
					}
				}

				// TODO Klassen
				if (status.laufend) {
					const table = document.createElement("table"),
						head = table.createTHead(),
						body = table.createTBody(),
						headRow = head.insertRow()
					table.classList.add("klassen");

					type HTMLTableRowElementKlasse = HTMLTableRowElement & {
						dataset: {
							klasse: string
							strecke: number | undefined
						}
					}

					["Klasse", "Strecke", "Beteiligung"].forEach(label => {
						const cell = headRow.insertCell();
						cell.textContent = label
					})

					onChildAdded(ref(Datenbank.datenbank, "spezifisch/klassen/liste/" + schule), ({key: klasse}) => {
						const tr = body.insertRow() as HTMLTableRowElementKlasse
						tr.dataset.klasse = klasse
						{
							const td = tr.insertCell()
							td.textContent = klasse
						}
						// * Strecke
						{
							const td = tr.insertCell()
							onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/strecke"), snap => {
								const wert = snap.val() || 0
								tr.dataset.strecke = wert
								const meter = m(wert);
								td.textContent = zahl(meter.wert, 0) + meter.einheit

								// * Sortieren
								let before = null
								Array.from(body.rows).reverse().forEach((row: HTMLTableRowElementKlasse) => {
									if (!row.dataset.strecke || wert > row.dataset.strecke) before = row
								})
								tr.parentElement.insertBefore(tr, before)
							})
						}
						// * Beteiligung
						{
							const td = tr.insertCell()
							let anzahlFahrer, potAnzahlFahrer
							const probieren = () => {
								if (anzahlFahrer === undefined || potAnzahlFahrer === undefined) return
								if (potAnzahlFahrer < anzahlFahrer) return console.error("In Klasse " + klasse + " der Schule " + schule + " gibt es mehr Fahrer als möglich sind. (" + anzahlFahrer + "/" + potAnzahlFahrer + ")")
								let wert = potAnzahlFahrer === 0 ? 0 : (anzahlFahrer / potAnzahlFahrer)
								td.textContent = Math.round(Math.min(wert, 1) * 100) + "%"
							}
							onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/anzahlFahrer"), snap => {
								anzahlFahrer = snap.val() || 0
								probieren()
							})
							onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/potAnzahlFahrer"), snap => {
								potAnzahlFahrer = snap.val() || 0
								probieren()
							})
						}
					})
					onChildRemoved(ref(Datenbank.datenbank, "spezifisch/klassen/liste/" + schule), ({key: klasse}) =>
						Array.from(body.rows).find(row => row.dataset.klasse === klasse).remove())

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
			const p = document.createElement("p")
			p.classList.add("hinweis-teilnahme")
			p.textContent = "Teilnahme ist auf die oben gezeigten Schulen beschränkt."
			container.append(p)
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
