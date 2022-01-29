import Popup from "./popup.ts";
import Datenbank from "./firebase/datenbank";
import {get, onChildAdded, onValue, push, ref, serverTimestamp, set, Unsubscribe} from "firebase/database";
import Route from "./model/route";
import {onAuthStateChanged, signOut} from "firebase/auth";
import benachrichtigung from "./benachrichtigungen/benachrichtigung";
import {adminEmail, koordinaten} from "./konfiguration";
import {auth, authentifizieren} from "./firebase/authentifizierung";
import Storage from "./storage";
import load from "./load";
import Cookies from "./cookies";
import m from "./formatierung/einheit/m";
import zahl from "./formatierung/zahl";
import {eintragenTextSetzen} from "./inhalt/eintragen";
import global from "./global"
import maps from "./maps";
import AutocompleteOptions = google.maps.places.AutocompleteOptions;
import Autocomplete = google.maps.places.Autocomplete;
import PlaceResult = google.maps.places.PlaceResult;

const emailVonKlasse = (schule: string, klasse: string) => new Promise<string>(resolve => {
	onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/email"), snap => {
		resolve(snap.val())
	}, {onlyOnce: true})
})

const adresseVonSchule = (schule: string) => new Promise<string>(resolve => {
	onValue(ref(Datenbank.datenbank, `allgemein/schulen/details/${schule}/adresse`), snap => {
		resolve(snap.val())
	}, {onlyOnce: true})
})

type PopupInfo = {
	element: HTMLFormElement,
	vorbereiten: (eintragung: Eintragung, element: HTMLFormElement) => void,
	vorbereitet: boolean
}

/**
 * Registriert ein bestehendes Popup des Eintragen-Prozesses mit der id "popup-eintragen-" + name
 * @param name
 * @param buttons Liste an Knöpfen; Key muss name-Attribut entsprechen; abbrechen ist optional und wir automatisch gehandled
 * @param vorbereiten
 */
const popup = (name: string, buttons: {
	abbrechen?: true,
	[button: string]: ((eintragung: Eintragung, element: HTMLFormElement) => Promise<void> | void) | true
}, vorbereiten: (eintragung: Eintragung, element: HTMLFormElement) => void = () => {
}): PopupInfo => {
	const element = document.getElementById("popup-eintragen-" + name) as HTMLFormElement;

	// Wenn dieses Popup geschlossen wird, beende die aktuelle Eintragung
	element.addEventListener("close", () => Eintragung.offen?.geschlossen())

	// Button-Klicks werden unten abgefangen
	element.addEventListener("submit", event => event.preventDefault());

	// Abbrechen-Button automatisch generieren
	if ("abbrechen" in buttons) {
		const button = document.createElement("input")
		button.type = "button"
		button.value = "Abbrechen"
		button.name = "abbrechen"
		button.classList.add("links", "leer")
		const buttons = element.querySelector("fieldset.buttons");
		buttons.insertBefore(button, buttons.firstChild)
	}

	Object.entries(buttons).forEach(([name, action]) =>
		element[name].addEventListener("click", () => {
			const eintragung = Eintragung.offen;
			if (name === "abbrechen")
				eintragung.schliessen()
			else if ((name === "zurueck" || element.reportValidity()) && action !== true)
				load(action(eintragung, element))
		}))

	return {
		element,
		vorbereiten,
		vorbereitet: false
	}
}
const popups = {
	authentifizierung: popup("authentifizierung", {
		weiter: async (eintragung, element) => {
			const data = Object.fromEntries(["schule", "klasse", "passwort"].map(it => [it, element[it].value])) as { schule: string, klasse: string, passwort: string }
			const email = await emailVonKlasse(data.schule, data.klasse)
			const adresse = adresseVonSchule(data.schule)

			eintragung.angemeldetBleiben = Cookies.optional() && (element["angemeldet-bleiben"] as HTMLInputElement).checked
			await authentifizieren(email, data.passwort, eintragung.angemeldetBleiben)
				.then(() => {
					eintragung.authentifizierungSetzen(data.schule, data.klasse)
					adresse.then(adresse => {
						if (adresse) Eintragung.berechnenStart.value = adresse
						eintragung.popupOeffnen(popups.name)
					})
				})
		}
	}, (eintragung, element) => new Promise(resolve => {
		const schulen = element["schule"] as HTMLSelectElement
		const klassen = element["klasse"] as HTMLSelectElement & { listener: Unsubscribe }

		const probieren = () => {
			if (Eintragung.laufend !== undefined && Eintragung.leer !== undefined) resolve()
		}

		const klassenFuellen = (schule: string) => {
			klassen.innerHTML = ""
			klassen.listener?.()
			klassen.listener = onChildAdded(ref(Datenbank.datenbank, "spezifisch/klassen/liste/" + schule), snap => {
				const klasse = snap.key
				const standard = schule === eintragung.schule && klasse === eintragung.klasse
				klassen.add(new Option(klasse, klasse, standard, standard))
			})
		}

		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
			Eintragung.laufend = snap.val()
			probieren()

			schulen.innerHTML = ""
			get(ref(Datenbank.datenbank, "allgemein/saisons/details/" + Eintragung.laufend + "/schulen/liste")).then(snap => {
				snap.forEach(childSnap => {
					const schule = childSnap.key
					schulen.add(new Option(schule, schule))
				})
				if (eintragung.schule) schulen.value = eintragung.schule
				else if (schulen.value) klassenFuellen(schulen.value)
			})
		})
		onValue(ref(Datenbank.datenbank, "spezifisch/klassen/leer"), snap => {
			Eintragung.leer = snap.val() === null ? true : snap.val()
			probieren()
		})

		schulen.addEventListener("change", () => klassenFuellen(schulen.value))
	})),
	name: popup("name", {
		abbrechen: true,
		direkt: async (eintragung, element) => {
			await eintragung.nameSetzen((element["name"] as HTMLInputElement).value)
			eintragung.optionSetzen("direkt")
		},
		berechnen: async (eintragung, element) => {
			await eintragung.nameSetzen((element["name"] as HTMLInputElement).value)
			eintragung.optionSetzen("berechnen")
		}
	}, (eintragung, element) => {
		const input = element["name"] as HTMLInputElement
		const nachrichtAnpassen = async () => {
			const name = input.value
			const [nachricht, reaktion] = name ? (
				name in eintragung.alleFahrer ? await (async () => {
						const anzahlStrecken = await new Promise(resolve => onValue(
							ref(Datenbank.datenbank, "spezifisch/fahrer/" + eintragung.alleFahrer[name] + "/anzahlStrecken"),
							snap => resolve(snap.val()),
							{onlyOnce: true}))
						const anzahlStreckenFormatiert = anzahlStrecken === 1 ? "eine Strecke" : anzahlStrecken + " Strecken"
						return [`Sie haben bereits ${anzahlStreckenFormatiert} eingetragen`, "😎"]
					})() :
					["Sie tragen ihre erste Strecke ein", "😊"]
			) : ["", ""]

			const anzeige = element.querySelector("p.nachricht") as HTMLParagraphElement
			anzeige.textContent = nachricht
			anzeige.dataset.reaktion = reaktion
		}
		input.addEventListener("input", nachrichtAnpassen)
	}),
	nameGegeben: popup("name-gegeben", {
		abbrechen: true,
		direkt: eintragung => eintragung.optionSetzen("direkt"),
		berechnen: eintragung => eintragung.optionSetzen("berechnen")
	}, async (eintragung, element) => {
		(element["abmelden"] as HTMLButtonElement).addEventListener("click", () => {
			signOut(auth)
			eintragung.schliessen()
		});
	}),
	berechnen: popup("berechnen", {
		abbrechen: true,
		zurueck: async eintragung => {
			await eintragung.nameSetzen(undefined)
			eintragung.optionSetzen(undefined)
		},
		weiter: async (eintragung) => {
			const meter = await eintragung.berechnen()
			if (meter === null) return benachrichtigung("Kann Strecke nicht berechnen. Bitte überprüfe deine Eingaben.")
			eintragung.meterSetzen(meter)
		}
	}, async () => {
		await maps()
		Eintragung.distanceMatrixService = new google.maps.DistanceMatrixService()
		const options: AutocompleteOptions = {
			fields: ["place_id", "geometry"],
			types: ["address"]
		}
		const number = .5
		Eintragung.autocompleteStart = new google.maps.places.Autocomplete(Eintragung.berechnenStart as HTMLInputElement, options)
		Eintragung.autocompleteAnkunft = new google.maps.places.Autocomplete(Eintragung.berechnenAnkunft as HTMLInputElement, {
			...options,
			bounds: {
				north: koordinaten.hoechstadt.lat + number,
				south: koordinaten.hoechstadt.lat - number,
				east: koordinaten.hoechstadt.lng + number,
				west: koordinaten.hoechstadt.lng - number,
			}
		});
		[[Eintragung.autocompleteStart, Eintragung.berechnenStart], [Eintragung.autocompleteAnkunft, Eintragung.berechnenAnkunft]].forEach(([autocomplete, element]) => {
			const placeChanged = () => Eintragung.placeChanged(element as HTMLInputElement, autocomplete as Autocomplete);
			(autocomplete as Autocomplete).addListener("place_changed", placeChanged)
			element.addEventListener("change", placeChanged)
		})
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
		abbrechen: true,
		zurueck: async eintragung => {
			await eintragung.nameSetzen(undefined)
			eintragung.optionSetzen(undefined)
		},
		weiter: (eintragung, element) =>
			eintragung.meterSetzen(parseInt((element["kilometer"] as HTMLInputElement).value) * 1000)
	}),
	datenschutz: popup("datenschutz", {
		abbrechen: true,
		zurueck: eintragung => eintragung.meterSetzen(undefined),
		weiter: eintragung => {
			eintragung.datenschutz = true
			return eintragung.speichern()
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

	angemeldetBleiben = false
	schule: string = undefined
	klasse: string = undefined
	name: string = undefined
	fahrer: string = undefined
	alleFahrer: { [name: string]: string } = {}
	meter: number = undefined
	datenschutz: boolean = false

	private constructor() {
		Eintragung.eintragungen.push(this)
	}

	static distanceMatrixService

	/**
	 * Wird gesetzt beim Vorbereiten von `popups.berechnen`
	 */
	static autocompleteStart

	/**
	 * Wird gesetzt beim Vorbereiten von `popups.berechnen`
	 */
	static autocompleteAnkunft

	static berechnenStart = document.getElementById("eintragen-suche-a") as HTMLInputElement
	static berechnenAnkunft = document.getElementById("eintragen-suche-b") as HTMLInputElement

	async oeffnen() {
		return benachrichtigung("Es können aktuell keine Eintragungen vorgenommen werden.")

		// Abbrechen falls schon eine Eintragung offen
		if (!!Eintragung.offen) return

		// Ist ja schon offen ...
		if (this.offen) return

		this.vorbereiten()

		// Auth state ist schon bekannt
		if (global.user !== undefined) {
			if (global.user !== null && global.user.email === adminEmail) {
				// Eingelogged aber als Admin...
				await signOut(auth)
				global.user = null // onAuthStateChanged ist evtl. etwas verspätet
			}

			if (global.user === null) {
				// Muss sich anmelden

				// Vorab vorbereiten, damit Eintragung.laufend und Eintragung.leer gesetzt werden
				await this.popupVorbereiten(popups.authentifizierung)

				// Keine Saison
				if (Eintragung.laufend === null) return benachrichtigung("Es können aktuell keine Eintragungen vorgenommen werden.")

				// Keine Klassen
				if (Eintragung.leer !== false) return benachrichtigung("Es wurden noch keine Klassen für die laufende Saison eingetragen.") // TODO "bitte s. #mitmachen ...

				await this.popupOeffnen(popups.authentifizierung)
			} else {
				const fahrer = Eintragung.fahrerAusCookie
				if (fahrer) {
					// Ist schon angemeldet
					this.angemeldetBleiben = true

					const {
						schule,
						klasse,
						name
					} = await datenVonFahrerBekommen(fahrer)

					this.authentifizierungSetzen(schule, klasse)
					await this.nameSetzen(name, fahrer)
					this.fahrer = fahrer

					await this.popupOeffnen(popups.nameGegeben)
				} else {
					// Ist schon angemeldet, es fehlt aber der Cookie, weshalb nicht klar ist, bei welcher Klasse der Nutzer angemeldet ist
					// Nutzer wollte wahrscheinlich angemeldet bleiben, da ja global.user !== null, deswegen angemeldet bleiben auf checked setzen
					(popups.authentifizierung.element["angemeldet-bleiben"] as HTMLInputElement).checked = true
					// TODO schule & klasse herausfinden durch querying -> wird automatisch ausgefüllt
					// this.schule =
					// this.klasse =
					await signOut(auth)
					await this.oeffnen()
				}
			}
		} else await load(new Promise(resolve => {
			// Sonst halt warten und nochmal probieren...
			const listener = onAuthStateChanged(auth, newUser => {
				listener()
				global.user = newUser
				resolve()
				this.oeffnen()
			})
		}))
	}

	vorbereiten() {
		Eintragung.berechnenReset()
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
		if (this.offenesPopup) Popup.schliessen(this.offenesPopup.element)
		else Popup.alleSchliessen()
	}

	async popupVorbereiten(popup: PopupInfo) {
		if (!popup.vorbereitet) {
			popup.vorbereitet = true
			await popup.vorbereiten(this, popup.element)
		}
	}

	async popupOeffnen(popup: PopupInfo) {
		await this.popupVorbereiten(popup)

		// Altes schließen, Neues öffnen
		if (this.offenesPopup) this.popupSchliessen()
		this.offenesPopup = popup
		this.offen = true
		Popup.oeffnen(popup.element)
	}

	async nameSetzen(name: string | undefined, fahrer: string | undefined = undefined) {
		this.name = name
		// Wenn der Fahrer schon existiert, ruhig jetzt schon speichern - aber sonst erst beim wirklichen Eintragen der Strecke auch den Fahrer erstellen, damit nicht ungenutzte Fahrer erstellt werden
		this.fahrer = fahrer || (name === undefined ? undefined : await fahrerBekommen(this.schule, this.klasse, name))
		if (this.angemeldetBleiben && this.fahrer) Storage.set("fahrer", this.fahrer, false);

		// Name-gegeben Popup anpassen
		const popup = popups.nameGegeben.element;
		["schule", "klasse", "name"].forEach(it => popup.querySelector("." + it).textContent = this[it])
		{
			const meter = m(this.fahrer ? await new Promise(resolve => onValue(
				ref(Datenbank.datenbank, "spezifisch/fahrer/" + this.fahrer + "/strecke"),
				snap => resolve(snap.val() || 0),
				{onlyOnce: true})) : 0);
			const roh = zahl(meter.wert, 0)
			popup.querySelector(".strecke").textContent = roh + meter.einheit
		}

		eintragenTextSetzen(this.name)
	}

	optionSetzen(option: "direkt" | "berechnen" | undefined) {
		this.option = option
		this.popupOeffnen(popups[option] || popups.name)
	}

	meterSetzen(wert: number) {
		this.meter = wert
		this.popupOeffnen(wert !== undefined ? popups.datenschutz : popups[this.option])
	}

	authentifizierungSetzen(schule: string, klasse: string) {
		this.schule = schule
		this.klasse = klasse

		// Fahrer autocomplete
		const datalist = (document.getElementById("eintragen-fahrer") as HTMLDataListElement)
		datalist.innerHTML = ""
		this.alleFahrer = {}
		onChildAdded(
			ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/fahrer"),
			snap => {
				datalist.append(new Option(undefined, snap.key))
				this.alleFahrer[snap.key] = snap.val()
			}
		)
	}

	async speichern() {
		if (!this.schule || !this.klasse) throw new Error("Noch nicht angemeldet.")
		if (!global.user) throw new Error("Authentifizierung abgelaufen.")
		if (!this.name) throw new Error("Name noch nicht eingetragen.")
		if (!this.meter) throw new Error("Länge noch nicht eingetragen.")
		if (!this.datenschutz) throw new Error("Datenschutzerklärung wurde noch nicht zugestimmt.")

		if (!this.fahrer) {
			this.fahrer = await fahrerErstellen(this.schule, this.klasse, this.name)
			if (this.angemeldetBleiben) Storage.set("fahrer", this.fahrer, false)
		}
		/*const strecke =*/ await streckeErstellen(this.fahrer, this.meter)

		/*if (route) {
			// TODO überlegen: sind immer beide Orte gegeben? entsprechend spezifisch/orte updaten...
			await routeErstellen(strecke, route)
		}*/

		await this.popupOeffnen(popups.fertig)
	}

	static eintragungen: Eintragung[] = []

	static get offen(): Eintragung | null {
		return Eintragung.eintragungen.find(eintragung => eintragung.offen)
	}

	static async eintragen(): Promise<Eintragung> {
		const eintragung = new Eintragung()
		await load(eintragung.oeffnen())
		return eintragung
	}

	static laufend: string | null | undefined = undefined
	static leer: boolean | undefined = undefined

	static get fahrerAusCookie() {
		return Storage.get<string>("fahrer", false)
	}

	static async vorbereiten() {
		const fahrerAusCookie = this.fahrerAusCookie;
		if (fahrerAusCookie) {
			const {name} = await datenVonFahrerBekommen(fahrerAusCookie)
			eintragenTextSetzen(name)
		}
	}

	static berechnenPlace(element: HTMLInputElement, place: PlaceResult) {
		if (!element.value) return null
		element.classList[place && place.geometry ? "remove" : "add"]("invalid")
		if (!place || !place.geometry) return null
		return place.place_id
	}

	static berechnenReset() {
		[this.berechnenStart, this.berechnenAnkunft].forEach(element => {
			element.value = ""
			element.classList.remove("invalid")
		})
	}

	static async berechnen(
		origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place,
		destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place
	): Promise<number | null> {
		return new Promise<number>(resolve => {
			this.distanceMatrixService.getDistanceMatrix({
				origins: [origin],
				destinations: [destination],
				travelMode: google.maps.TravelMode.BICYCLING,
				unitSystem: google.maps.UnitSystem.METRIC
			}, (response) => {
				if (response === null) throw new Error("Antwort von distance matrix war null")

				const element = response.rows[0].elements[0];
				if (element.status !== "OK") resolve(null)
				const distance = element.distance
				if (!distance) resolve(null)
				resolve(distance.value)
			})
		})
	}

	static placeChanged(element: HTMLInputElement, autocomplete: google.maps.places.Autocomplete) {
		const place = autocomplete.getPlace()
		const placeId = this.berechnenPlace(element, place)
		if (placeId !== null) {
			const anderesAutocomplete: Autocomplete = autocomplete === Eintragung.autocompleteStart ? Eintragung.autocompleteAnkunft : Eintragung.autocompleteStart
			if (!element.value) {
				anderesAutocomplete.setBounds({east: 180, west: -180, north: 90, south: -90})
			} else {
				/**
				 * 1 Breitengrad entspricht 111km
				 */
				const number = .5
				anderesAutocomplete.setBounds({
					north: place.geometry.location.lat() + number,
					south: place.geometry.location.lat() - number,
					east: place.geometry.location.lng() + number,
					west: place.geometry.location.lng() - number,
				})
			}
		}
	}

	async berechnen(): Promise<number | null> {
		const placeId1 = Eintragung.berechnenPlace(Eintragung.berechnenStart, Eintragung.autocompleteStart.getPlace())
		const placeId2 = Eintragung.berechnenPlace(Eintragung.berechnenAnkunft, Eintragung.autocompleteAnkunft.getPlace())
		if (placeId1 === null || placeId2 === null) {
			const start = Eintragung.berechnenStart.value
			const ankunft = Eintragung.berechnenAnkunft.value
			if (start !== "" && ankunft !== "") {
				return Eintragung.berechnen(start, ankunft)
			} else return null
		} else {
			return Eintragung.berechnen({placeId: placeId1}, {placeId: placeId2})
		}
	}
}

/**
 *
 * @param schule
 * @param klasse
 * @param name
 * @return id ID des existierenden Fahrers
 */
const fahrerBekommen = (schule: string, klasse: string, name: string) => new Promise<string | null>(resolve => onValue(
	ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "/fahrer/" + name),
	snap => resolve(snap.val()),
	{onlyOnce: true}))

/**
 *
 * @param schule
 * @param klasse
 * @param name
 * @return id ID des neuen Fahrers
 */
const fahrerErstellen = (schule: string, klasse: string, name: string) => push(
	ref(Datenbank.datenbank, "spezifisch/fahrer"),
	{schule, klasse, name}
).then(({key}) => key)

const datenVonFahrerBekommen = async (fahrer: string): Promise<{
	schule: string
	klasse: string
	name: string
	strecke: number
	anzahlStrecken: number
}> => (await get(ref(Datenbank.datenbank, "spezifisch/fahrer/" + fahrer))).val()

/**
 *
 * @param fahrer
 * @param strecke
 * @return id ID der neuen Strecke
 */
const streckeErstellen = (fahrer: string, strecke: number) => push(
	ref(Datenbank.datenbank, "spezifisch/strecken"),
	{fahrer, strecke, zeitpunkt: serverTimestamp()}
).then(({key}) => key)

// const routeErstellen = (strecke: string, route: Route) => set(ref(Datenbank.datenbank, "spezifisch/routen/" + strecke), route)
