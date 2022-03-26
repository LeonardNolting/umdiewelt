import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import Popup from "../../popup";
import BenachrichtigungsLevel from "../../benachrichtigungen/benachrichtigungsLevel";
import load from "../../load";

export default abstract class Kontrolle {
	_erlaubt: boolean = false
	set erlaubt(value: boolean) {
		this._erlaubt = value
		this.knopf.classList[value ? "add" : "remove"]("erlaubt")
		if (!value && this.popup.classList.contains("offen")) {
			benachrichtigung("Die aktuelle Aktion ist nicht länger möglich, da sich Daten in der Datenbank geändert haben.")
			Popup.schliessen(this.popup)
		}
	}

	get erlaubt() {
		return this._erlaubt
	}

	static form = document.getElementById("admin-anzeige") as HTMLFormElement
	static fieldset = Kontrolle.form.querySelector("fieldset") as HTMLFieldSetElement
	static knopf = (name: string) => Kontrolle.form[name] as HTMLButtonElement

	knopf: HTMLButtonElement
	popup: HTMLFormElement

	protected element(name: string) {
		return this.popup[name]
	}

	protected constructor(
		readonly name: string,
		readonly voraussetzungen?: string
	) {
		this.popup = document.getElementById("popup-admin-" + name) as HTMLFormElement
		this.knopf = Kontrolle.knopf(name)
		this.knopf.onclick = () => this.ausfuehren(true)
	}

	isInit = false

	async initialisieren() {
		if (this.isInit) return
		this.isInit = true
		await this.init()
	}

	protected abstract async init(): Promise<void>

	abstract async destroy(): Promise<void>

	protected abstract async vorbereiten(): Promise<void>

	/**
	 * Rückgabewert:
	 * - String: Erfolgsnachricht
	 * - true: erfolgreich, Popup schließen usw.
	 * - false: nicht erfolgreich, Popup nicht schließen usw.
	 */
	protected abstract async submit(): Promise<string | boolean>

	async ausfuehren(mitWarnung: boolean = true) {
		if (!this.isInit) return benachrichtigung("Bitte warten Sie noch einen Moment. Die Admin-Kontrollen werden gerade initialisiert.")
		if (!this.erlaubt) {
			if (mitWarnung && this.voraussetzungen) benachrichtigung(this.voraussetzungen)
			return
		}

		await this.vorbereiten()
			.catch(reason => {
				benachrichtigung("Beim Vorbereiten der Aktion ist ein Fehler aufgetreten: " + reason, BenachrichtigungsLevel.ALARM)
				return
			})

		this.popup["abbrechen"].onclick = () => Popup.schliessen(this.popup)
		this.popup.onsubmit = event => {
			event.preventDefault()
			if (!this.erlaubt) return // normalerweise schon vorher Popup geschlossen (s. set erlaubt)
			load(this.submit()
				.then(value => {
					if (value === false) return
					Popup.schliessen(this.popup)
					this.popup.reset()
					if (typeof value === "string") benachrichtigung(value, BenachrichtigungsLevel.ERFOLG)
				})
				.catch(reason => {
					console.error(reason)
					benachrichtigung("Konnte Aktion nicht ausführen: " + reason, BenachrichtigungsLevel.ALARM)
				}))
		}
		Popup.oeffnen(this.popup)
	}
}
