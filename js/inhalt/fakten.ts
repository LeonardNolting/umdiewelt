import zahl from "../formatierung/zahl";

interface HTMLDataElementFakt extends HTMLDataElement {
	interval: number
	wert?: {
		wertBerechnen: () => { wert: number, einheit?: string }
		valide: boolean
		anzahlNachkommastellen: number
	}
	gesehen: boolean
	dataset: {
		bezeichnung?: string
		einheit: string
	}
}

const observer = new IntersectionObserver((eintraege, observer) => {
	eintraege.filter(eintrag => eintrag.isIntersecting).forEach(eintrag => {
		const data = eintrag.target as HTMLDataElementFakt;
		if (window.scrollY === 0) addEventListener("scroll", () => faktAnzeigen(data), {once: true})
		else faktAnzeigen(data)
	})
}, {
	rootMargin: '0px',
	threshold: 1.0
})

/**
 * Bereitet das Anzeigen eines Fakts vor
 * @param fakt
 */
export const faktVorbereiten = (fakt: HTMLDataElement) => observer.observe(fakt);

/**
 * Bereitet das Anzeigen von Fakten vor
 * @param fakten
 */
export default (...fakten: HTMLDataElement[]) => fakten.forEach(faktVorbereiten)

function faktAnzeigen(data: HTMLDataElementFakt) {
	data.gesehen = true
	observer.unobserve(data)

	if (!data.wert) return

	const set = (value: string, einheit: string = "") => {
		data.value = value
		data.dataset.einheit = einheit
	}

	if (!data.wert.valide) return set("N/A")

	const {wert, einheit = ""} = data.wert.wertBerechnen(),
		setWert = (wert: number) =>
			set(zahl(wert, data.wert.anzahlNachkommastellen, 0).toString(), einheit),
		zeit = 600,
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
 * @param wertBerechnen
 * @param valide
 * @param anzahlNachkommastellen
 */
export function fakt(data: HTMLDataElementFakt, wertBerechnen: () => { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1)

/**
 * Zeigt einen Fakt an
 * @param bezeichnung
 * @param wertBerechnen
 * @param valide
 * @param anzahlNachkommastellen
 */
export function fakt(bezeichnung: string, wertBerechnen: () => { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1)

/**
 * Zeigt einen Fakt an
 * @param bezeichnung
 * @param wertBerechnen
 * @param valide
 * @param anzahlNachkommastellen
 */
export function fakt(bezeichnung: string | HTMLDataElementFakt, wertBerechnen: () => { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1) {
	const data = typeof bezeichnung === "string" ?
		document.querySelector("[data-bezeichnung='" + bezeichnung + "']") as HTMLDataElementFakt :
		bezeichnung
	data.wert = {
		wertBerechnen,
		valide,
		anzahlNachkommastellen
	}
	if (data.gesehen) faktAnzeigen(data)
}
