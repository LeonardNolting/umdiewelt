import {onValue, ref} from "firebase/database";
import {Datenbank} from "../firebase/datenbank/datenbank";

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

		// Saison gelöscht: allgemein/saisons/aktuell entfernen, allgemein/saisons/laufend entfernen, spezifisch löschen?
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
