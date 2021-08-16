import {getAuth, signInWithEmailAndPassword, User} from "firebase/auth";
import step from "../../step";
import FahrerAuthentifizierung from "./fahrerAuthentifizierung";
import load from "../../load";
import {adminEmail} from "../../konfiguration";
import Popup from "../../popup";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../../benachrichtigungen/benachrichtigungsLevel";
import admin from "../../inhalt/admin";

export abstract class Authentifizierung {
	protected constructor(readonly user: User) {
		step("Authentifiziert (" + this.constructor.name + ")")
	}

	abstract autorisiertEinzutragen: Boolean

	private static _authentifizierung: Authentifizierung | null = null
	static get authentifizierung() {
		if (!this.authentifiziert) this._authentifizierung = null
		return this._authentifizierung
	}

	private static _authentifiziert = () => false
	static get authentifiziert() {
		return this._authentifiziert()
	}

	protected static vorbereitet = false

	static vorbereiten() {
		if (this.vorbereitet) return

		FahrerAuthentifizierung.vorbereiten()
		AdminAuthentifizierung.vorbereiten()

		this.vorbereitet = true
		document.body.dispatchEvent(new Event("authentifizierung-vorbereitet"))
	}

	static async warteVorbereitet() {
		if (!this.vorbereitet) await load(new Promise(resolve =>
			document.body.addEventListener("authentifizierung-vorbereitet", () => resolve())
		))
	}

	protected static async auth(
		email: string,
		passwort: string,
		authentifizierung: (user: User) => Authentifizierung
	) {
		const auth = getAuth()
		this._authentifiziert = () => auth.currentUser !== null

		try {
			const {user} = await signInWithEmailAndPassword(auth, email, passwort);
			this._authentifizierung = authentifizierung(user);
			return this.authentifizierung;
		} catch (error) {
			const errorCode = error.code;
			const errorMessage = error.message;
			step("Konnte nicht anmelden: " + errorCode + " " + errorMessage);
			throw error;
		}
	}
}

/**
 * Nicht ausgelagert in eigene Datei wegen zirkulären Imports
 */
export class AdminAuthentifizierung extends Authentifizierung {
	constructor(user: User) {
		super(user)
	}

	static authentifizieren(passwort: string) {
		return this.auth(
			adminEmail,
			passwort,
			user => new AdminAuthentifizierung(user)
		)
	}

	static vorbereiten() {
		document.getElementById("admin").addEventListener("click", () => AdminAuthentifizierung.anmelden())
	}

	private static popup = document.getElementById("popup-anmelden-admin") as HTMLFormElement

	static async anmelden() {
		await this.warteVorbereitet()

		// TODO falls FahrerAuthentifizierung: ABMELDEN, dann weiter machen

		if (this.authentifizierung instanceof AdminAuthentifizierung) return

		return new Promise<void>((resolve, reject) => {
			if (this.authentifiziert) return resolve()

			const submit = this.popup["submit"]

			// TODO popup onclose reject

			this.popup.onsubmit = event => {
				// Wir machen's dynamisch!
				event.preventDefault()

				// Verhindert versehentliches doppeltes Bestätigen
				submit.disabled = true;

				const passwort = this.popup["passwort"].value

				this.authentifizieren(passwort)
					.then(user => {
						Popup.schliessen(this.popup)
						admin()
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

	autorisiertEinzutragen = false
}
