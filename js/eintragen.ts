import {koordinaten} from "./konfiguration";
import Popup from "./popup";

type PopupInfo = {
	element: HTMLFormElement,
	vorbereiten: (eintragung: Eintragung, element: HTMLFormElement) => void,
	vorbereitet: boolean
}

const popup = (name: string, buttons: {
	[button: string]: (eintragung: Eintragung, element: HTMLFormElement) => void
}, vorbereiten: (eintragung: Eintragung, element: HTMLFormElement) => void = () => {
}): PopupInfo => {
	const element = document.getElementById("popup-eintragen-" + name) as HTMLFormElement;

	// Wenn dieses Popup geschlossen wird, beende die aktuelle Eintragung
	element.addEventListener("close", () => Eintragung.offen?.geschlossen())

	// Button-Klicks werden unten abgefangen
	element.addEventListener("submit", event => event.preventDefault());

	// Immer auf Button-Klicks vorbereitet sein
	(Array.from(element.querySelectorAll("fieldset.buttons input")) as HTMLInputElement[])
		.forEach(button => button.addEventListener("click", () => {
			const name = button.name,
				eintragung = Eintragung.offen

			// Wenn Abbrechen geklickt wird, Eintragung schließen
			if (name === "abbrechen") eintragung.schliessen()
			// Sonst weitergeben (und falls nicht gerade zurück gegangen wird, auch schauen, ob weiter gehen erlaubt ist)
			else if (name === "zurueck" || element.checkValidity()) buttons[button.name](eintragung, element)
		}))

	return {
		element,
		vorbereiten,
		vorbereitet: false
	}
}
const popups = {
	name: popup("name", {
		direkt: (eintragung, element) => eintragung.optionUndNameSetzen(element["name"], "direkt"),
		berechnen: (eintragung, element) => eintragung.optionUndNameSetzen(element["name"], "berechnen")
	}),
	berechnen: popup("berechnen", {
		zurueck: eintragung => eintragung.optionUndNameSetzen(undefined, undefined),
		weiter: eintragung => eintragung.meterSetzen(1000) // TODO berechnete meter benutzen
	}, () => {
		/*(document.getElementById("eintragen-karte-knopf") as HTMLDetailsElement)
			.addEventListener("toggle", () => new google.maps.Map(document.getElementById("eintragen-karte"), {
				center: koordinaten.hoechstadt,
				mapTypeControl: false,
				clickableIcons: false,
				fullscreenControl: false,
				keyboardShortcuts: false,
				rotateControl: false,
				streetViewControl: false,
				zoom: 11
			}), {once: true})*/
	}),
	direkt: popup("direkt", {
		zurueck: eintragung => eintragung.optionUndNameSetzen(undefined, undefined),
		weiter: eintragung => eintragung.meterSetzen(1000) // TODO eingegebene meter benutzen
	}),
	datenschutz: popup("datenschutz", {
		zurueck: eintragung => eintragung.meterSetzen(undefined),
		weiter: eintragung => {
			eintragung.datenschutz = true
			eintragung.eintragen()
		}
	}),
	fertig: popup("fertig", {
		schliessen: eintragung => eintragung.schliessen()
	})
}

export class Eintragung {
	option: "berechnen" | "direkt" = undefined
	offen: boolean = false
	offenesPopup: PopupInfo = undefined

	name: string = undefined
	meter: number = undefined
	datenschutz: boolean = false

	constructor() {
		Eintragung.eintragungen.push(this)
	}

	oeffnen() {
		// Abbrechen falls schon eine Eintragung offen
		if (!!Eintragung.offen) return

		// Ist ja schon offen ...
		if (this.offen) return

		this.popupOeffnen(popups.name)
	}

	schliessen() {
		this.popupSchliessen()
		this.geschlossen()
	}

	geschlossen() {
		this.offen = false
		this.offenesPopup = undefined
	}

	popupSchliessen() {
		Popup.schliessen(this.offenesPopup.element)
	}

	async popupOeffnen(popup: PopupInfo) {
		// Vorbereiten
		if (!popup.vorbereitet) {
			popup.vorbereitet = true
			await popup.vorbereiten(this, popup.element)
		}

		// Altes schließen, Neues öffnen
		if (this.offenesPopup) this.popupSchliessen()
		this.offenesPopup = popup
		this.offen = true
		Popup.oeffnen(popup.element)
	}

	optionUndNameSetzen(name: string, option: "direkt" | "berechnen") {
		this.name = name
		this.option = option
		this.popupOeffnen(popups[option] || popups.name)
	}

	meterSetzen(wert: number) {
		this.meter = wert
		this.popupOeffnen(wert !== undefined ? popups.datenschutz : popups[this.option])
	}

	eintragen() {
		if (!this.name) throw new Error("Name noch nicht eingetragen.")
		if (!this.meter) throw new Error("Länge noch nicht eingetragen.")
		if (!this.datenschutz) throw new Error("Datenschutzerklärung wurde noch nicht zugestimmt.")

		// Datenbank ...

		this.popupOeffnen(popups.fertig)
	}

	static eintragungen: Eintragung[] = []
	static get offen (): Eintragung | null { return Eintragung.eintragungen.find(eintragung => eintragung.offen) }
}
