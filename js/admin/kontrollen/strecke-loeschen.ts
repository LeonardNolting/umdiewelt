import Kontrolle from "./kontrolle";
import {ref, remove} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";

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
		const id = this.element("id").value
		if (!id || id.length <= 0) return benachrichtigung("Bitte eine gültige ID eingeben.")
		return await remove(ref(Datenbank.datenbank, "spezifisch/strecken/" + id)).then(() => "Strecke gelöscht.")
	}

	protected async vorbereiten(): Promise<void> {
	}
}
