import {limitToLast, onChildAdded, onValue, orderByKey, query, ref, Unsubscribe, update} from "firebase/database";
import Datenbank from "../../firebase/datenbank";
import benachrichtigung from "../../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../../benachrichtigungen/benachrichtigungsLevel";
import Kontrolle from "./kontrolle";

export default class NeueSaisonKontrolle extends Kontrolle {
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
		// * Wenn noch in demselben Jahr, in dem eine Saison beendet wurde, eine Neue gestartet wird, soll diese für das nächste Jahr sein.
		let jahrGesetzt = false
		onValue(query(ref(Datenbank.datenbank, "allgemein/saisons/liste"), orderByKey(), limitToLast(1)), snap => {
			if (jahrGesetzt) {
				this.erlaubt = false
				return
			}
			if (snap.val()) jahr = snap.val()
			jahrGesetzt = true
		})
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
				potAnzahlFahrer: parseInt(li.potAnzahlFahrerInput.value)
			}))

		if (teilnehmendeSchulen.length === 0) {
			benachrichtigung("Bitte wählen Sie mindestens eine Schule aus.", BenachrichtigungsLevel.INFO)
			return false
		}

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
export namespace NeueSaisonKontrolle {
	export interface SchuleLi extends HTMLLIElement {
		checkbox: HTMLInputElement
		potAnzahlFahrerInput: HTMLInputElement
	}
}
