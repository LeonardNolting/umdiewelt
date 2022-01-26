import Kontrolle from "./kontrolle";

export default class TestnachrichtKontrolle extends Kontrolle {
	constructor() {
		super("testnachricht", "Diese Funktion wurde noch nicht implementiert.")
	}

	async destroy(): Promise<void> {
	}

	protected async init(): Promise<void> {
		this.erlaubt = false
	}

	protected async submit(): Promise<string> {
	}

	protected async vorbereiten(): Promise<void> {
	}
}
