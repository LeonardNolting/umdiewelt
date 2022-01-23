import zahl from "../formatierung/zahl";

export interface HTMLDataElementFakt extends HTMLDataElement {
	interval: number
	wert?: {
		berechnet: { wert: number, einheit?: string }
		valide: boolean
		anzahlNachkommastellen: number
	}
	dataset: {
		bezeichnung?: string
		einheit: string
	}
}

/**
 * Bereitet das Anzeigen eines Fakts vor
 * @param fakt
 */
export const bereiteFaktVor = (fakt: HTMLDataElement) => {}

/**
 * Bereitet das Anzeigen von Fakten vor
 * @param fakten
 */
export const bereiteFaktenVor = (...fakten: HTMLDataElement[]) => fakten.forEach(bereiteFaktVor)

export function zeigeFaktAn(data: HTMLDataElementFakt, zeit: number = 600) {
	if (!data.wert) return

	const set = (value: string, einheit: string = "") => {
		data.value = value
		data.dataset.einheit = einheit
	}

	if (!data.wert.valide) return set("N/A")

	const {wert, einheit = ""} = data.wert.berechnet,
		setWert = (wert: number) =>
			set(zahl(wert, data.wert.anzahlNachkommastellen, 0).toString(), einheit),
		fps = 50,
		anzahlSchritte = Math.ceil(Math.min(wert * 2, zeit * fps / 1000));

	if (anzahlSchritte < 1) {
		clearInterval(data.interval)
		setWert(wert)
		return
	}

	const schritt = wert / anzahlSchritte,
		intervalTime = zeit / anzahlSchritte;

	let i = anzahlSchritte - 1
	data.interval = setInterval(() => {
		setWert(wert - schritt * i)
		i--
		if (i < 0) clearInterval(data.interval)
	}, intervalTime)
}

/**
 * Zeigt einen Fakt an
 * @param data
 * @param berechnet
 * @param valide
 * @param anzahlNachkommastellen
 */
export function ladeFakt(data: HTMLDataElementFakt, berechnet: { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1)

/**
 * Zeigt einen Fakt an
 * @param bezeichnung
 * @param berechnet
 * @param valide
 * @param anzahlNachkommastellen
 */
export function ladeFakt(bezeichnung: string, berechnet: { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1)

/**
 * Zeigt einen Fakt an
 * @param bezeichnung
 * @param berechnet
 * @param valide
 * @param anzahlNachkommastellen
 */
export function ladeFakt(bezeichnung: string | HTMLDataElementFakt, berechnet: { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1) {
	const data = typeof bezeichnung === "string" ?
		document.querySelector("[data-bezeichnung='" + bezeichnung + "']") as HTMLDataElementFakt :
		bezeichnung
	data.wert = {berechnet, valide, anzahlNachkommastellen}
}
