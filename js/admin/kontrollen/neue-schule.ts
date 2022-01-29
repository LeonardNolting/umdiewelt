import {ref, set, update} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import Kontrolle from "./kontrolle";

export default class NeueSchuleKontrolle extends Kontrolle {
	constructor() {
		super("neue-schule");
	}

	async destroy(): Promise<void> {
	}

	protected async init(): Promise<void> {
		this.erlaubt = true
	}

	protected async submit(): Promise<string> {
		const name = this.element("name").value;
		const adresse = this.element("adresse").value;
		const updates = {}
		updates[`allgemein/schulen/details/${name}/adresse`] = adresse
		updates[`allgemein/schulen/liste/${name}`] = true
		return update(ref(Datenbank.datenbank), updates)
			.then(() => "Neue Schule erstellt 👍")
	}

	protected async vorbereiten(): Promise<void> {
	}
}
