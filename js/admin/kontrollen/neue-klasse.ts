import {onChildAdded, onValue, ref, Unsubscribe, update} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import {createUserWithEmailAndPassword, getAuth} from "firebase/auth";
import Kontrolle from "./kontrolle";

export default class NeueKlasseKontrolle extends Kontrolle {
	constructor() {
		super("neue-klasse", "Neue Klassen können nur eingetragen werden, wenn eine aktuelle Saison existiert.");
	}

	private aktuellListener: Unsubscribe
	private aktuell: string | undefined = undefined

	protected init() {
		return new Promise<void>(resolve =>
			this.aktuellListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
				this.aktuell = snap.val();
				this.erlaubt = this.aktuell !== null
				resolve()
			})
		)
	}

	async destroy() {
		this.aktuellListener?.()
	}

	protected async submit(): Promise<string> {
		const email = this.element("email").value;
		const password = this.element("password").value;
		const schule = this.element("schule").value;
		const klasse = this.element("name").value;
		const potAnzahlFahrer = parseInt(this.element("pot-anzahl-fahrer").value);

		const auth = getAuth();
		const admin = auth.currentUser

		// Neues Konto erstellen
		const {user} = await createUserWithEmailAndPassword(auth, email, password)
		// UID merken
		const {uid} = user
		// Zurück zum Admin-Konto wechseln
		await auth.updateCurrentUser(admin)

		const updates = {}
		updates["spezifisch/klassen/details/" + schule + "/" + klasse] = {email, uid, potAnzahlFahrer}
		updates["spezifisch/klassen/liste/" + schule + "/" + klasse] = true
		return update(ref(Datenbank.datenbank), updates)
			.then(() => "Neue Klasse erstellt 👍")
			// Wenn was nicht funktioniert, vorherigen Status wiederherstellen
			.catch(reason => user.delete().then(() => Promise.reject(reason)))
	}

	protected async vorbereiten() {
		this.element("schule").innerHTML = ""
		const aktuell = this.aktuell;
		if (aktuell === null || aktuell === undefined)
			throw new Error("Sollte eigentlich nicht vorkommen. Wenn aktuell === null, ist kontrolle.erlaubt = false. Wenn aktuell === undefined, wurde noch nicht initialisiert. In beiden Fällen sollte man hier nicht landen.")

		onChildAdded(
			ref(Datenbank.datenbank, "allgemein/saisons/details/" + aktuell + "/schulen/liste"),
			snap => this.element("schule").append(new Option(snap.key, snap.key))
		)

		this.element("generieren").addEventListener("click", () => {
			this.element("password").value = NeueKlasseKontrolle.passwortGenerieren()
		})
	}

	private static zifferGenerieren(): number {
		return Math.floor(Math.random() * 10)
	}
	private static passwortGenerieren(): string {
		return "UDW-" + this.zifferGenerieren() + this.zifferGenerieren() + "-" + this.zifferGenerieren() + this.zifferGenerieren() + "-" + this.zifferGenerieren()
	}
}
