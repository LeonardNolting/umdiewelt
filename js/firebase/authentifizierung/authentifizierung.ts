import {getAuth, signInWithEmailAndPassword, User} from "firebase/auth";
import step from "../../step";
import FahrerAuthentifizierung from "./fahrerAuthentifizierung";
import load from "../../load";
import {Datenbank} from "../datenbank/datenbank";
import tabellen = Datenbank.tabellen;
import {adminEmail} from "../../konfiguration";

export abstract class Authentifizierung {
	protected constructor(readonly user: User) {
		step("Authentifiziert (" + this.constructor.name + ")")
	}

	abstract kannEintragen: Boolean

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
		if (!tabellen.schulen.geladen || !tabellen.klassen.geladen) return

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

	}

	static async anmelden() {
		await this.warteVorbereitet()


	}

	kannEintragen = false
}
