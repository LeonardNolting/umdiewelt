import {get, onChildAdded, onValue, ref, set, Unsubscribe, update} from "firebase/database";
import {Datenbank} from "../firebase/datenbank/datenbank";
import Popup from "../popup";
import benachrichtigung from "../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../benachrichtigungen/benachrichtigungsLevel";
import {createUserWithEmailAndPassword, getAuth} from "firebase/auth";

abstract class Kontrolle {
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
		await this.init()
		this.isInit = true
	}

	protected async abstract init(): Promise<void>

	async abstract destroy(): Promise<void>

	protected async abstract vorbereiten(): Promise<void>

	/**
	 *
	 * @returns Erfolgsnachricht
	 */
	protected async abstract submit(): Promise<string>

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
			this.submit()
				.then(erfolgsnachricht => {
					Popup.schliessen(this.popup)
					benachrichtigung(erfolgsnachricht, BenachrichtigungsLevel.ERFOLG)
				})
				.catch(reason => {
					console.error(reason)
					benachrichtigung("Konnte Aktion nicht ausführen: " + reason, BenachrichtigungsLevel.ALARM)
				})
		}
		Popup.oeffnen(this.popup)
	}
}

class NeueSaisonKontrolle extends Kontrolle {
	constructor() {
		super("neue-saison", "Neue Saisons können nur erstellt werden, wenn nicht schon eine Aktuelle existiert.");
	}

	private aktuellListener: Unsubscribe

	protected init() {
		return new Promise<void>(resolve =>
			this.aktuellListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
				this.erlaubt = snap.val() === null
				resolve()
			})
		)
	}

	async destroy() {
		this.aktuellListener?.()
	}

	private schulenListener: Unsubscribe
	private schulenUl = this.popup.querySelector(".schulen")
	private nameInput = this.element("name") as HTMLInputElement

	protected async vorbereiten() {
		let jahr = new Date().getFullYear()
		// Wenn noch in demselben Jahr, in dem eine Saison beendet wurde, eine Neue gestartet wird, soll diese für das nächste Jahr sein.
		// TODO nicht `get` benutzen
		while ((await get(ref(Datenbank.datenbank, "allgemein/saisons/liste/" + jahr))).exists()) jahr++
		this.nameInput.value = jahr.toString()

		this.schulenUl.innerHTML = ""

		this.schulenListener = onChildAdded(ref(Datenbank.datenbank, "allgemein/schulen/liste"), snap => {
			const schule = snap.key

			const li = document.createElement("li") as NeueSaisonKontrolle.SchuleLi
			li.classList.add("schule")

			const div = document.createElement("div")
			const checkbox = document.createElement("input")
			checkbox.type = "checkbox"
			checkbox.value = schule
			const checkboxId = "admin-neue-saison-schule-" + schule;
			checkbox.id = checkboxId
			const label = document.createElement("label")
			label.htmlFor = checkboxId
			label.textContent = schule
			div.append(checkbox, label)
			li.checkbox = checkbox

			const potAnzahlFahrerDiv = document.createElement("div")
			potAnzahlFahrerDiv.classList.add("pot-anzahl-fahrer")
			const potAnzahlFahrerInput = document.createElement("input")
			potAnzahlFahrerInput.type = "number"
			potAnzahlFahrerInput.step = "10"
			const potAnzahlFahrerInputId = "admin-neue-saison-schule-" + schule + "-pot-anzahl-fahrer"
			checkbox.addEventListener("change", () => {
				potAnzahlFahrerInput.required = checkbox.checked
				potAnzahlFahrerDiv.classList[checkbox.checked ? "add" : "remove"]("sichtbar")
			})
			const potAnzahlFahrerLabel = document.createElement("label")
			potAnzahlFahrerLabel.htmlFor = potAnzahlFahrerInputId
			potAnzahlFahrerLabel.textContent = "pot. Anzahl Teilnehmer:"
			potAnzahlFahrerDiv.append(potAnzahlFahrerLabel, potAnzahlFahrerInput)
			li.potAnzahlFahrerInput = potAnzahlFahrerInput

			li.append(div, potAnzahlFahrerDiv)
			this.schulenUl.append(li)
		})
	}

	protected async submit() {
		const teilnehmendeSchulen = (Array.from(this.schulenUl.children) as NeueSaisonKontrolle.SchuleLi[])
			.filter(li => li.checkbox.checked)
			.map(li => ({
				name: li.checkbox.value,
				potAnzahlFahrer: li.potAnzahlFahrerInput.value
			}))

		if (teilnehmendeSchulen.length === 0)
			return benachrichtigung("Bitte wählen Sie mindestens eine Schule aus.", BenachrichtigungsLevel.INFO)

		this.schulenListener()

		const name = this.nameInput.value
		const updates = {}
		updates["allgemein/saisons/liste/" + name] = true
		teilnehmendeSchulen.forEach(({name: schule, potAnzahlFahrer}) => {
			updates["allgemein/saisons/details/" + name + "/schulen/liste/" + schule] = true
			updates["allgemein/saisons/details/" + name + "/schulen/details/" + schule + "/potAnzahlFahrer"] = potAnzahlFahrer
			updates["allgemein/saisons/details/" + name + "/runden"] = parseInt(this.element("runden").value)
		})

		return update(ref(Datenbank.datenbank), updates)
			.then(() => "Saison erstellt 😎")
	}
}

// https://stackoverflow.com/a/54065283/11485145
namespace NeueSaisonKontrolle {
	export interface SchuleLi extends HTMLLIElement {
		checkbox: HTMLInputElement
		potAnzahlFahrerInput: HTMLInputElement
	}
}

class NeueKlasseKontrolle extends Kontrolle {
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

		const auth = getAuth();
		const admin = auth.currentUser

		// Neues Konto erstellen
		const {user} = await createUserWithEmailAndPassword(auth, email, password)
		// UID merken
		const {uid} = user
		// Zurück zum Admin-Konto wechseln
		await auth.updateCurrentUser(admin)

		const updates = {}
		updates["spezifisch/klassen/details/" + schule + "/" + klasse] = {email, uid}
		updates["spezifisch/klassen/liste/" + schule + "/" + klasse] = true
		await update(ref(Datenbank.datenbank), updates)
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
	}
}

class NeueSchuleKontrolle extends Kontrolle {
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
		await set(ref(Datenbank.datenbank, "allgemein/schulen/liste/" + name), true)
			.then(() => "Neue Schule erstellt 👍")
	}

	protected async vorbereiten(): Promise<void> {
	}
}

abstract class ZeitKontrolle extends Kontrolle {
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

	private min = new Date(Date.now() + 3600 * 1000)
	private max = new Date(Date.now() + 3600 * 1000 * 24 * 29)

	protected async vorbereiten() {
		this.input.step = "1800" // halbe Stunde
		this.input.min = this.min.toISOString() // min eine Stunde später
		this.input.max = this.max.toISOString() // höchstens 29 Tage in der Zukunft
	}

	protected async submit(): Promise<string> {
		const inputValue = this.inputValue

		if (inputValue < this.min.getTime())
			throw new Error("Datum muss mindestens eine Stunde in der Zukunft liegen.")
		if (inputValue > this.max.getTime())
			throw new Error("Datum darf nicht mehr als 29 Tage in der Zukunft liegen.")

		await set(ref(Datenbank.datenbank, "allgemein/saisons/countdowns/" + this.zeit + ""), this.inputValue)
			.then(() => "Saison" + this.zeit + " gesetzt 🥳")
	}
}

class SaisonstartKontrolle extends ZeitKontrolle {
	constructor() {
		super("start", "Der Saisonstart kann nur verändert werden, wenn eine aktuelle Saison existiert und diese noch nicht begonnen hat. Veränderungen müssen mindestens eine Stunde vor dem geplanten Saisonstart stattfinden.");
	}

	private aktuellListener: Unsubscribe
	private zeitListener: Unsubscribe
	private countdownListener: Unsubscribe
	private aktuell: string | undefined = undefined

	protected init() {
		return new Promise<void>(resolve =>
			this.aktuellListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
				this.aktuell = snap.val();
				this.zeitListener?.()

				if (this.aktuell === null) {
					this.countdownListener?.()
					this.erlaubt = false
					resolve()
				} else this.zeitListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/details/" + this.aktuell + "/zeit/start"), snap => {
					if (snap.val() === null) {
						if (!this.countdownListener) this.countdownListener =
							onValue(ref(Datenbank.datenbank, "allgemein/saisons/countdowns/start"), snap => {
								this.countdown = snap.val();
								this.erlaubt = this.countdown === null || this.countdown > new Date(Date.now() + 3600 * 1000).getTime()
								resolve()
							})
					} else {
						this.erlaubt = false
						resolve()
					}
				})
			})
		)
	}

	async destroy() {
		this.aktuellListener?.()
		this.zeitListener?.()
		this.countdownListener?.()
	}
}

class SaisonendeKontrolle extends ZeitKontrolle {
	constructor() {
		super("ende", "Das Saisonende kann nur verändert werden, wenn eine laufende Saison existiert. Veränderungen müssen mindestens eine Stunde vor dem geplanten Saisonende stattfinden.");
	}

	private laufendListener: Unsubscribe
	private countdownListener: Unsubscribe
	private laufend: string | undefined = undefined

	protected init() {
		return new Promise<void>(resolve =>
			this.laufendListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
				this.laufend = snap.val()

				if (this.laufend === null) {
					this.countdownListener?.()
					this.erlaubt = false
					resolve()
				} else if (!this.countdownListener) this.countdownListener =
					onValue(ref(Datenbank.datenbank, "allgemein/saisons/countdowns/ende"), snap => {
						this.countdown = snap.val();
						this.erlaubt = this.countdown === null || this.countdown > new Date(Date.now() + 3600 * 1000).getTime()
						resolve()
					})
			})
		)
	}

	async destroy() {
		this.laufendListener?.()
		this.countdownListener?.()
	}
}

export default async () => {
	document.body.classList.add("admin")
	Kontrolle.form.onsubmit = event => event.preventDefault()

	const kontrollen = [
		new NeueSaisonKontrolle(),
		new NeueKlasseKontrolle(),
		new NeueSchuleKontrolle(),
		new SaisonstartKontrolle(),
		new SaisonendeKontrolle(),
	]

	await Promise.all(kontrollen.map(kontrolle => kontrolle.initialisieren()))

	Kontrolle.fieldset.disabled = false

	/*await new Promise(resolve => {
		const knopf = button("saisonende")
		// TODO neue Zeitenstruktur
		// * Saisonende festlegen/verändern: nur wenn noch keines gegeben oder dieses noch verändert werden kann (nicht schon passiert ist)
		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
			knopf.disabled = true
			const laufend = snap.val();
			if (laufend !== null) {
				onValue(ref(Datenbank.datenbank, "allgemein/saisons/details/" + laufend + "/zeit/ende"), snap => {
					const ende = snap.val();
					if (ende === null || ende > Date.now()) knopf.disabled = false
					resolve()
				})
			} else resolve()
		})

		// Saisonende passiert: allgemein/saisons/laufend entfernen, allgemein/saisons/aktuell entfernen
	})

	await new Promise(resolve => {
		const knopf = button("saison-loeschen")
		// * Saison löschen: nur wenn eine aktuelle Saison existiert
		onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), async snap => {
			knopf.disabled = snap.val() === null;
			resolve()
			// TODO Neuladen empfehlen (nach Löschen einer Saison, da keine listener auf Saison onChildRemoved)
		})

		// Saison gelöscht: allgemein/saisons/aktuell entfernen, allgemein/saisons/laufend entfernen, allgemein/saisons/aktiv ggf. ändern, spezifisch löschen?
	})

	await new Promise(resolve => {
		const knopf = button("strecke-loeschen")
		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
			knopf.disabled = snap.val() === null;
			resolve()
		})
	})

	await new Promise(resolve => {
		const knopf = button("testnachricht")
		resolve()
	})

	await new Promise(resolve => {
		const knopf = button("neue-schule")
		knopf.onclick = () => Admin.neueSchule()
		resolve()
	})

	fieldset.disabled = false*/
}
