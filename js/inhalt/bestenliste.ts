import Datenbank from "../firebase/datenbank";
import {
	DataSnapshot,
	endAt,
	limitToLast,
	onChildAdded,
	onChildChanged,
	onChildRemoved,
	onValue,
	orderByChild,
	query,
	ref,
	Unsubscribe
} from "firebase/database";
import step from "../step";
import m from "../formatierung/einheit/m";
import zahl from "../formatierung/zahl";
import {observer} from "./inhalt";

// @ts-ignore
import images from "../../img/bicyclists/*.png";

const anzeige = document.getElementById("bestenliste-anzeige") as HTMLUListElement
const container = anzeige.parentElement as HTMLDivElement
const mehrLadenKnopf = container.querySelector("button") as HTMLButtonElement

const liste: { [fahrer: string]: Werte } = {}
const sortieren = () => Object.entries(liste).sort(([, {strecke: a}], [, {strecke: b}]) => (b || 0) - (a || 0))

const raenge = {1: "gold", 2: "silber", 3: "bronze"}
const rangKlassen = Object.values(raenge)

const aktualisieren = () => {
	step("Aktualisiert Bestenliste")
	const sortiert = sortieren()
	anzeige.style.setProperty("--anzahl", sortiert.length.toString())

	const [, {strecke: max}] = sortiert[0]
	sortiert.forEach(([fahrer, werte], index) => {
		const element = bestehendesElement(fahrer) ?? neuesElement(fahrer, werte)
		const rang = index + 1

		const klasse = raenge[rang]
		if (klasse) {
			element.classList.remove(...rangKlassen.filter(it => it !== klasse))
			element.classList.add(klasse)
		} else element.classList.remove(...rangKlassen)

		element.style.setProperty("--rang", rang.toString())
		element.style.setProperty("--prozent", werte.strecke ? (werte.strecke / max * 100).toString() : "0")

		const formatiert = m(werte.strecke || 0)
		element.inhalt.dataset.strecke = zahl(formatiert.wert, 0) + formatiert.einheit

		if (!element.isConnected) anzeige.append(element)
	})
}

const elementId = (fahrer: string) => "bestenliste-fahrer-" + fahrer

const bestehendesElement = (fahrer: string) => document.getElementById(elementId(fahrer)) as BestenlisteElement | null
const neuesElement = (fahrer: string, werte: Werte): BestenlisteElement => {
	const li = document.createElement("li") as BestenlisteElement;
	li.id = elementId(fahrer)
	li.classList.add("verspaetet")
	observer.observe(li)

	const inhalt = document.createElement("div") as BestenlisteInhaltElement
	inhalt.classList.add("inhalt")
	li.inhalt = inhalt
	li.append(inhalt)

	const name = document.createElement("span")
	name.classList.add("name")
	inhalt.name = name
	const schule = document.createElement("span")
	schule.classList.add("schule")
	inhalt.schule = schule
	inhalt.append(name, schule)

	li.style.setProperty("--url", "url('" + images[Math.floor(Math.random() * 9) + 1] + "')")

	passeElementAn(fahrer, werte, li)

	return li
}
const passeElementAn = (fahrer: string, werte: Werte, element: BestenlisteElement = bestehendesElement(fahrer)) => {
	element.inhalt.name.textContent = werte.name
	element.inhalt.schule.textContent = werte.schule
}

let anzahlFahrer: number | undefined = undefined

export default () => {
	let anzahlFahrerListener: Unsubscribe | undefined
	onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
		const laufend = snap.val()
		anzahlFahrerListener?.()
		anzahlFahrerListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/details/" + laufend + "/anzahlFahrer"), snap => {
			anzahlFahrer = snap.val() || 0
			kannGeladenWerdenUeberpruefen()
		})
	})

	mehrLadenKnopf.addEventListener("click", () => laden(10))

	laden(10)
}

const setze = (fahrer: string, werte: Werte) => {
	liste[fahrer] = werte
	aktualisieren()
	kannGeladenWerdenUeberpruefen()
}

const setzeAusSnapshot = (snap: DataSnapshot) => setze(snap.key, snap.val())

export const laden = (anzahl: number) => {
	const sortiert = sortieren();
	const reference = sortiert.length > 0 ?
		query(ref(Datenbank.datenbank, "spezifisch/fahrer"), limitToLast(anzahl), endAt(sortiert[sortiert.length - 1][1].strecke || 0, sortiert[sortiert.length - 2][0]), orderByChild("strecke")) :
		query(ref(Datenbank.datenbank, "spezifisch/fahrer"), limitToLast(anzahl), orderByChild("strecke"))

	onChildAdded(reference, setzeAusSnapshot)
	onChildRemoved(reference, setzeAusSnapshot)
	onChildChanged(reference, snap => {
		setzeAusSnapshot(snap)
		passeElementAn(snap.key, snap.val())
	})
}

const kannGeladenWerdenUeberpruefen = () =>
	mehrLadenKnopf.disabled = anzahlFahrer <= Object.keys(liste).length

interface BestenlisteElement extends HTMLLIElement {
	inhalt: BestenlisteInhaltElement
}

interface BestenlisteInhaltElement extends HTMLDivElement {
	name: HTMLSpanElement
	schule: HTMLSpanElement
	dataset: {
		strecke: string
	}
}

interface Werte {
	schule: string
	klasse: string
	name: string
	strecke: number
}

/*interface Meta {
	schule: string
	klasse: string
	name: string
}*/

/*const tabelle = document.querySelector("#bestenliste-anzeige > table") as HTMLTableElement,
	mehrLaden = document.querySelector("#bestenliste-anzeige > button")

const emojis = ["🥇", "🥈", "🥉", "🏅"]

let naechsterChunk = 1

function ladeChunk(chunk: number) {
	const zeilen = tabelle.rows,
		min = chunk * bestenlisteChunkGroesse,
		max = min + bestenlisteChunkGroesse

	for (let i = min; i <= max; i++) {
		if (zeilen.length > i) {
			zeilen.item(i).classList.remove("versteckt")
			mehrLaden.classList.remove("versteckt")
		} else mehrLaden.classList.add("versteckt")
	}
}

export default () => {
	/!*Object.entries(fahrer).forEach(([name, strecke], index) => {
		const rang = index + 1,
			zeile = tabelle.insertRow(),
			emoji = emojis[Math.min(index, emojis.length - 1)],
			{wert, einheit} = m(strecke)

		zeile.classList.add("versteckt")

		zeile.insertCell().innerHTML = `${rang}. ${emoji} ${name}`
		zeile.insertCell().innerHTML =
			zahl(wert, 2, 0) + " " + einheit
	})

	ladeChunk(0)

	mehrLaden.addEventListener("click", () => {
		ladeChunk(naechsterChunk)
		naechsterChunk++
	})*!/
}*/
