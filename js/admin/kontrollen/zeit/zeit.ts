import {ref, set} from "firebase/database";
import Datenbank from "../../../firebase/datenbank";
import Kontrolle from "./../kontrolle";

export default abstract class ZeitKontrolle extends Kontrolle {
	protected constructor(
		protected readonly zeit: string,
		voraussetzungen?: string
	) {
		super("saison" + zeit, voraussetzungen);
	}

	protected input = this.element("zeit") as HTMLInputElement

	protected set inputValue(number: number | null) {
		let wert: string
		if (number === null) wert = ""
		else {
			const date = new Date(number)
			// *** Zeitzonen 😅
			wert = new Date(
				date.toDateString() + " " +
				// Zeitzone entfernen und behaupten es sei UTC
				date.toTimeString().slice(0, 8) + "Z"
			).toISOString()
				// datetime-local-kompatibel machen ("Z" entfernen)
				.slice(0, -1)
		}

		this.input.value = wert
	}

	protected get inputValue() {
		return new Date(this.input.value).getTime()
	}

	private _countdown: number | null | undefined = undefined
	protected set countdown(value: number | null) {
		this._countdown = value
		if (value && this.input.value === "") this.inputValue = value
	}

	protected get countdown() {
		return this._countdown
	}

	private min = new Date(Date.now() + 60 * 1000)
	private max = new Date(Date.now() + 3600 * 1000 * 24 * 29)

	protected async vorbereiten() {
		this.input.step = "60" // eine Minute
		this.input.min = this.min.toISOString() // min eine Minute später
		this.input.max = this.max.toISOString() // höchstens 29 Tage in der Zukunft
	}

	protected async submit(): Promise<string> {
		const inputValue = this.inputValue

		if (inputValue < this.min.getTime())
			throw new Error("Datum muss mindestens eine Minute in der Zukunft liegen.")
		if (inputValue > this.max.getTime())
			throw new Error("Datum darf nicht mehr als 29 Tage in der Zukunft liegen.")

		return set(ref(Datenbank.datenbank, "allgemein/saisons/countdowns/" + this.zeit + ""), this.inputValue)
			.then(() => "Saison" + this.zeit + " gesetzt 🥳")
	}
}
