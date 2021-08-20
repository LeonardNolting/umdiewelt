import {User} from "firebase/auth";
import {Authentifizierung} from "./authentifizierung";
import Popup from "../../popup";
import {Datenbank} from "../datenbank/datenbank";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import {Unsubscribe, onChildAdded, onValue, ref, get} from "firebase/database";
import BenachrichtigungsLevel from "../../benachrichtigungen/benachrichtigungsLevel";

export default class FahrerAuthentifizierung extends Authentifizierung {
	private constructor(user: User, readonly schule: string, readonly klasse: string) {
		super(user)
	}

	autorisiertEinzutragen = true

	private static email(schule: string, klasse: string) {
		return new Promise<string>(resolve =>
			onValue(ref(Datenbank.datenbank, "spezifisch/klassen/details/" + schule + "/" + klasse + "email"), snap => {
				resolve(snap.val())
			}, {onlyOnce: true}))
	}

	protected static async authentifizieren(passwort: string, schule: string, klasse: string) {
		return await this.auth(
			await this.email(schule, klasse),
			passwort,
			user => new FahrerAuthentifizierung(user, schule, klasse)
		)
	}

	private static popup = document.getElementById("popup-anmelden")
	private static schuleSelect = FahrerAuthentifizierung.popup["schule"] as HTMLSelectElement
	private static klasseSelect = FahrerAuthentifizierung.popup["klasse"] as HTMLSelectElement & { listener: Unsubscribe }
	private static passwortInput = FahrerAuthentifizierung.popup["passwort"] as HTMLInputElement

	private static kannEintragen = undefined
	private static kannEintragenNachricht = undefined

	static vorbereiten() {
		// Überhaupt möglich?
		let leer = undefined,
			laufend = undefined

		const probieren = () => {
			if (leer === undefined || laufend === undefined) return

			this.kannEintragen = true
			this.kannEintragenNachricht = null
			if (laufend === null) {
				this.kannEintragen = false
				this.kannEintragenNachricht = "Es können aktuell keine Eintragungen vorgenommen werden."
			} else if (leer !== false) {
				this.kannEintragen = false
				this.kannEintragenNachricht = "Es wurden noch keine Klassen für die laufende Saison eingetragen." // TODO "bitte s. #mitmachen ...
			}
		}

		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
			laufend = snap.val()
			probieren()
		})
		onValue(ref(Datenbank.datenbank, "spezifisch/klassen/leer"), snap => {
			leer = snap.val() === null ? true : snap.val()
			probieren()
		})

		// dann Schulen und Klassen eintragen
		const klasseSelectFuellen = (schule: string) => {
			this.klasseSelect.innerHTML = ""
			this.klasseSelect.listener?.()
			this.klasseSelect.listener = onChildAdded(ref(Datenbank.datenbank, "spezifisch/klassen/liste/" + schule), snap => {
				this.klasseSelect.add(new Option(snap.key, snap.key))
			})
		}

		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
			const laufend = snap.val()
			this.schuleSelect.innerHTML = ""
			get(ref(Datenbank.datenbank, "allgemein/saisons/details/" + laufend + "/schulen/liste")).then(snap => {
				// TODO erste entfernen, nicht nötig (ist standard)
				let erste = true
				snap.forEach(childSnap => {
					const schule = childSnap.key
					const standard = erste
					erste = false
					this.schuleSelect.add(new Option(schule, schule, standard, standard))
					if (standard) klasseSelectFuellen(schule)
				})
			})
		})

		this.schuleSelect.addEventListener("change", () => klasseSelectFuellen(this.schuleSelect.value))
	}

	static async anmelden() {
		await this.warteVorbereitet()

		if (!this.kannEintragen) {
			if (this.kannEintragenNachricht) benachrichtigung(this.kannEintragenNachricht)
			return Promise.reject()
		}

		return new Promise<void>((resolve, reject) => {
			// TODO falls AdminAuthentifizierung abmelden und dann weiter
			// falls FahrerAuthentifizierung return
			if (this.authentifiziert) return resolve()

			const submit = this.popup["submit"]

			// TODO popup onclose reject

			this.popup.onsubmit = event => {
				// Wir machen's dynamisch!
				event.preventDefault()

				// Verhindert versehentliches doppeltes Bestätigen
				submit.disabled = true;

				const schule = this.schuleSelect.value,
					klasse = this.klasseSelect.value,
					passwort = this.passwortInput.value

				this.authentifizieren(passwort, schule, klasse)
					.then(user => {
						Popup.schliessen(this.popup)
						resolve()
					})
					.catch(error => {
						// Zeigt Benutzer Fehlernachricht an
						benachrichtigung("Falsches Passwort. Bitte versuchen Sie es erneut.", BenachrichtigungsLevel.WARNUNG)
					})
					.finally(() => {
						// Offen für weitere Versuche
						submit.disabled = false;
					})
			}

			Popup.oeffnen(this.popup)
		})
	}
}
