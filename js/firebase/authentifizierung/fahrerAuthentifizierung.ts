import {User} from "firebase/auth";
import {Authentifizierung} from "./authentifizierung";
import Popup from "../../popup";
import {Datenbank} from "../datenbank/datenbank";
import tabellen = Datenbank.tabellen;
import benachrichtigungen from "../../benachrichtigungen";

export default class FahrerAuthentifizierung extends Authentifizierung {
	private constructor(user: User, readonly klasse: string) {
		super(user)
	}

	kannEintragen = true

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
	private static klasseSelect = FahrerAuthentifizierung.popup["klasse"] as HTMLSelectElement
	private static passwortInput = FahrerAuthentifizierung.popup["passwort"] as HTMLInputElement
	private static fehlgeschlagen = document.getElementById("anmelden-passwort-fehlgeschlagen")

	static vorbereiten() {
		const klasseSelectFuellen = (schule: string) => {
			this.klasseSelect.innerHTML = ""
			console.log(this.klasseSelect.value, "sollte leer sein (vor allem nach Auswählen einer anderen Schule)")
			const klassen = tabellen.klassen.elemente.filter(({value: klasse}) => klasse.schule === schule)
			klassen.forEach(({key, value: klasse}) => this.klasseSelect.add(new Option(klasse.name, key)))
		}

		tabellen.schulen.elemente.forEach(({key: id, value: schule}, index) => {
			const standard = index == 0
			this.schuleSelect.add(new Option(schule.name, id, standard, standard))
			if (standard) klasseSelectFuellen(id)
		})

		this.schuleSelect.addEventListener("change", () => klasseSelectFuellen(this.schuleSelect.value))
	}

	static async anmelden() {
		await this.warteVorbereitet()

		// TODO Testen, ob eingetragen werden kann
		if (tabellen.schulen.elemente.length === 0 || tabellen.klassen.elemente.length === 0) {
			benachrichtigungen.tip("Es sind aktuell keine Schulen angemeldet.")
			return Promise.reject()
		}

		return new Promise<void>((resolve, reject) => {
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
