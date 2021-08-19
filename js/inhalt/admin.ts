import {get, onChildAdded, onValue, ref, update} from "firebase/database";
import {Datenbank} from "../firebase/datenbank/datenbank";
import Popup from "../popup";
import benachrichtigung from "../benachrichtigungen/benachrichtigung";
import BenachrichtigungsLevel from "../benachrichtigungen/benachrichtigungsLevel";

interface NeueSaisonSchuleLi extends HTMLLIElement {
	checkbox: HTMLInputElement
	potAnzahlFahrerInput: HTMLInputElement
}

export namespace Admin {
	export async function neueSaison() {
		const popup = document.getElementById("popup-admin-neue-saison")

		const nameInput = popup["name"];
		let jahr = new Date().getFullYear()
		// Wenn noch in demselben Jahr, in dem eine Saison beendet wurde, eine Neue gestartet wird, soll diese für das nächste Jahr sein.
		while ((await get(ref(Datenbank.datenbank, "allgemein/saisons/liste/" + jahr))).exists()) jahr++
		nameInput.value = jahr.toString()

		const schulenFieldset = popup["schulen"];
		schulenFieldset.innerHTML = ""
		const schulenUl = document.createElement("ul")
		schulenFieldset.append(schulenUl)

		// const schulenCheckboxen: HTMLInputElement[] = []
		const schulenListener = onChildAdded(ref(Datenbank.datenbank, "allgemein/schulen/liste"), snap => {
			const schule = snap.key

			const li = document.createElement("li") as NeueSaisonSchuleLi
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
			const potAnzahlFahrerInput = document.createElement("input")
			potAnzahlFahrerInput.type = "number"
			potAnzahlFahrerInput.step = "10"
			potAnzahlFahrerInput.value = "1000"
			const potAnzahlFahrerInputId = "admin-neue-saison-schule-" + schule + "-pot-anzahl-fahrer"
			checkbox.addEventListener("change", () => potAnzahlFahrerInput.required = checkbox.checked)
			const potAnzahlFahrerLabel = document.createElement("label")
			potAnzahlFahrerLabel.htmlFor = potAnzahlFahrerInputId
			potAnzahlFahrerLabel.textContent = "Potenzielle Anzahl Teilnehmer"
			potAnzahlFahrerDiv.append(potAnzahlFahrerLabel, potAnzahlFahrerInput)
			li.potAnzahlFahrerInput = potAnzahlFahrerInput

			li.append(div, potAnzahlFahrerDiv)
			schulenUl.append(li)
		})
		popup.onsubmit = async event => {
			event.preventDefault()
			const teilnehmendeSchulen = (Array.from(schulenUl.children) as NeueSaisonSchuleLi[])
				.filter(li => li.checkbox.checked)
				.map(li => ({
					name: li.checkbox.value,
					potAnzahlFahrer: li.potAnzahlFahrerInput.value
				}))

			if (teilnehmendeSchulen.length === 0)
				return benachrichtigung("Bitte wählen Sie mindestens eine Schule aus.", BenachrichtigungsLevel.INFO)

			schulenListener()

			const name = nameInput.value
			const updates = {}
			updates["allgemein/saisons/liste/" + name] = true
			teilnehmendeSchulen.forEach(({name: schule, potAnzahlFahrer}) => {
				updates["allgemein/saisons/details/" + name + "/schulen/liste/" + schule] = true
				updates["allgemein/saisons/details/" + name + "/schulen/details/" + schule + "/potAnzahlFahrer"] = potAnzahlFahrer
			})
			await update(ref(Datenbank.datenbank), updates)
				.then(() => {
					Popup.schliessen(popup)
					benachrichtigung("Saison erstellt 😎", BenachrichtigungsLevel.ERFOLG)
				})
				.catch(reason => {
					console.error(reason)
					benachrichtigung("Beim Erstellen der Saison ist ein Fehler aufgetreten: " + reason, BenachrichtigungsLevel.ALARM)
				})
		}
		popup["abbrechen"].onclick = () => {
			Popup.schliessen(popup)
		}
		Popup.oeffnen(popup)
	}
}

export default async () => {
	document.body.classList.add("admin")

	const form = document.getElementById("admin-anzeige") as HTMLFormElement
	const fieldset = form.querySelector("fieldset") as HTMLFieldSetElement
	const button = (name: string) => form[name] as HTMLButtonElement

	form.onsubmit = event => event.preventDefault()

	await new Promise(resolve => {
		const knopf = button("neue-saison")
		// * Neue Saison: nur wenn nicht schon eine aktuelle Saison existiert
		onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
			knopf.disabled = snap.val() !== null;
			resolve()
		})

		// Neue Saison: allgemein/saisons/aktuell setzen, aktuell leeren
		knopf.onclick = () => Admin.neueSaison()
	})

	await new Promise(resolve => {
		const knopf = button("neue-klasse")
		// * Klasse eintragen: nur wenn eine laufende Saison existiert
		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), async snap => {
			knopf.disabled = snap.val() === null;
			resolve()
		})
	})

	await new Promise(resolve => {
		const knopf = button("saisonstart")
		// TODO neue Zeitenstruktur
		// * Saisonstart festlegen/verändern: nur wenn noch keiner gegeben oder dieser noch verändert werden kann (nicht schon passiert ist)
		onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
			knopf.disabled = true
			const laufend = snap.val();
			if (laufend !== null) {
				onValue(ref(Datenbank.datenbank, "allgemein/saisons/details/" + laufend + "/zeit/start"), snap => {
					const start = snap.val();
					if (start === null || start > Date.now()) knopf.disabled = false
					resolve()
				})
			} else resolve()
		})

		// Saisonstart gesetzt: allgemein/saisons/aktiv setzen
		// Saisonstart passiert: allgemein/saisons/laufend setzen
	})

	await new Promise(resolve => {
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
		knopf.disabled = true
		resolve()
	})

	fieldset.disabled = false
}
