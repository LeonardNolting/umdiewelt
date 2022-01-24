import {onValue, ref, remove, Unsubscribe} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import Kontrolle from "./kontrolle";

export default class SaisonLoeschenKontrolle extends Kontrolle {
	constructor() {
		super("saison-loeschen", "Es muss eine aktuelle Saison vorhanden sein, um diese löschen zu können.");
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
		// TODO Neuladen empfehlen (da keine listener auf Saison onChildRemoved)
		return remove(ref(Datenbank.datenbank, "allgemein/saisons/liste/" + this.aktuell))
			.then(() => "Saison gelöscht")
	}

	protected async vorbereiten() {
	}
}
