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
		bezeichnung: string
		einheit: string
	}
}

const parent = document.getElementById("fakten-anzeige").querySelector("section")
const children = parent.querySelectorAll("data") as NodeListOf<HTMLDataElementFakt>

const laden = (li: HTMLDataElementFakt) => {
	observer.unobserve(li)
	faktAnzeigen(li)
}

const observer = new IntersectionObserver((eintraege, observer) => {
	eintraege.filter(eintrag => eintrag.isIntersecting).forEach(eintrag => {
		const li = eintrag.target as HTMLDataElementFakt;
		if (window.scrollY === 0) addEventListener("scroll", () => laden(li), {once: true})
		else laden(li)
	})
}, {
	rootMargin: '0px',
	threshold: 1.0
})

export default function fakten() {
	children.forEach(li => observer.observe(li))
}

function faktAnzeigen(data: HTMLDataElementFakt) {
	data.gesehen = true
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

export function fakt(bezeichnung: string, wertBerechnen: () => { wert: number, einheit?: string }, valide: boolean = true, anzahlNachkommastellen: number = 1) {
	const zeile = Array.from(children).find(data => data.dataset.bezeichnung === bezeichnung)
	zeile.wert = {
		wertBerechnen,
		valide,
		anzahlNachkommastellen
	}
	if (zeile.gesehen) faktAnzeigen(zeile)
}
