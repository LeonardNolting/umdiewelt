import {User} from "firebase/auth";
import {Authentifizierung} from "./authentifizierung";
import Popup from "../../popup";
import {Datenbank} from "../datenbank/datenbank";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import {Unsubscribe, onChildAdded, onValue, ref} from "firebase/database";

export default class FahrerAuthentifizierung extends Authentifizierung {
	private constructor(user: User, readonly klasse: string) {
		super(user)
	}

	autorisiertEinzutragen = true

	// TODO klären was für E-Mail-Adressen benutzt werden
	private static email(klasse: string) {
		// const klasse = tabellen.fahrer.get(fahrer)
		// const email = tabellen.klassen.get(klasse).email
		return ""
	}

	protected static authentifizieren(passwort: string, klasse: string) {
		return this.auth(
			this.email(klasse),
			passwort,
			user => new FahrerAuthentifizierung(user, klasse)
		)
	}

	private static popup = document.getElementById("popup-anmelden")
	private static schuleSelect = FahrerAuthentifizierung.popup["schule"] as HTMLSelectElement
	private static klasseSelect = FahrerAuthentifizierung.popup["klasse"] as HTMLSelectElement & { listener: Unsubscribe }
	private static passwortInput = FahrerAuthentifizierung.popup["passwort"] as HTMLInputElement
	private static fehlgeschlagen = document.getElementById("anmelden-passwort-fehlgeschlagen")

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

		onValue(ref(Datenbank.datenbank, "saisons/laufend"), snap => {
			laufend = snap.val()
			probieren()
		})
		onValue(ref(Datenbank.datenbank, "aktuell/klassen/leer"), snap => {
			leer = snap.val() === null ? true : snap.val()
			probieren()
		})

		// dann Schulen und Klassen eintragen
		const klasseSelectFuellen = (schule: string) => {
			this.klasseSelect.innerHTML = ""
			this.klasseSelect.listener()
			this.klasseSelect.listener = onChildAdded(ref(Datenbank.datenbank, "aktuell/klassen/liste/" + schule), snap => {
				this.klasseSelect.add(new Option(snap.val(), snap.val()))
			})
		}

		onValue(ref(Datenbank.datenbank, "saisons/laufend"), snap => {
			const laufend = snap.val()
			onChildAdded(ref(Datenbank.datenbank, "saisons/details/" + laufend + "/schulen/liste"), snap => {
				// TODO standard?
				this.schuleSelect.add(new Option(snap.val(), snap.val()))
			})
		})
		/*tabellen.schulen.elemente.forEach(({key: id, value: schule}, index) => {
			const standard = index == 0
			this.schuleSelect.add(new Option(schule.name, id, standard, standard))
			if (standard) klasseSelectFuellen(id)
		})*/

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

				this.authentifizieren(passwort, klasse)
					.then(user => {
						Popup.schliessen(this.popup)

						// Falls nachher nochmal authentifizieren: Nicht fehlgeschlagen
						this.fehlgeschlagen.classList.remove("sichtbar")

						resolve()
					})
					.catch(error => {
						// Zeigt Benutzer Fehlernachricht an
						this.fehlgeschlagen.classList.add("sichtbar")
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
