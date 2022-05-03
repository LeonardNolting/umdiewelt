import Kontrolle from "./kontrolle";
import {get, orderByChild, query, ref, remove, equalTo} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../../benachrichtigungen/benachrichtigungsLevel";

export default class FahrerLoeschenKontrolle extends Kontrolle {
	constructor() {
		super("fahrer-loeschen")
	}

	async destroy(): Promise<void> {
	}

	protected async init(): Promise<void> {
		this.erlaubt = true
	}

	protected async submit(): Promise<string> {
		const id = (this.element("id") as HTMLInputElement).value.trim()
		if (!id || id.length <= 0) return benachrichtigung("Bitte eine gültige ID eingeben.")

		const fahrerRef = ref(Datenbank.datenbank, "spezifisch/fahrer/" + id);
		const fahrer = await get(fahrerRef)
		if (!fahrer.exists()) return benachrichtigung("Der angegebene Fahrer konnte nicht gefunden werden. Bitte leiten Sie die E-Mail-Meldung an leonolting@gmail.com weiter.", BenachrichtigungsLevel.ALARM)
		const streckenIds = await get(query(ref(Datenbank.datenbank, "spezifisch/strecken/"), orderByChild("fahrer"), equalTo(id))).then(result => Object.keys(result.val()))
		await Promise.all(streckenIds.map(id => remove(ref(Datenbank.datenbank, "spezifisch/strecken/" + id))))
		await remove(fahrerRef)
		return "Fahrer gelöscht."
	}

	protected async vorbereiten(): Promise<void> {
	}
}
