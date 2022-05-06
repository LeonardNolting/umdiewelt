import Kontrolle from "./kontrolle";
import {equalTo, get, orderByChild, query, ref, remove} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../../benachrichtigungen/benachrichtigungsLevel";

export default class StreckeLoeschenKontrolle extends Kontrolle {
	constructor() {
		super("strecke-loeschen")
	}

	async destroy(): Promise<void> {
	}

	protected async init(): Promise<void> {
		this.erlaubt = true
	}

	protected async submit(): Promise<string> {
		const id = (this.element("id") as HTMLInputElement).value.trim()
		if (!id || id.length <= 0) return benachrichtigung("Bitte eine gültige ID eingeben.")

		const streckeRef = ref(Datenbank.datenbank, "spezifisch/strecken/" + id);
		const strecke = await get(streckeRef)
		if (!strecke.exists()) return benachrichtigung("Die angegebene Strecke konnte nicht gefunden werden. Bitte leiten Sie die E-Mail-Meldung an leonolting@gmail.com weiter.", BenachrichtigungsLevel.ALARM)

		const fahrerId = strecke["fahrer"];
		if (!fahrerId || fahrerId.length < 1) return benachrichtigung("Konnte Fahrer der Strecke nicht identifizieren.", BenachrichtigungsLevel.ALARM)
		const fahrerRef = ref(Datenbank.datenbank, "spezifisch/fahrer/" + fahrerId);

		// Wenn keine Strecken bei diesem Fahrer verbleiben, Fahrer auch löschen
		const streckenIds = await get(query(ref(Datenbank.datenbank, "spezifisch/strecken/"), orderByChild("fahrer"), equalTo(id))).then(result => Object.keys(result.val()))
		if (streckenIds.length === 0) await remove(fahrerRef)

		return await remove(streckeRef).then(() => "Strecke gelöscht.")
	}

	protected async vorbereiten(): Promise<void> {
	}
}
