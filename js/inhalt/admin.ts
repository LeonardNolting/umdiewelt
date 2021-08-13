import {onValue, ref} from "firebase/database";
import {Datenbank} from "../firebase/datenbank/datenbank";

export default async () => {
	document.body.classList.add("admin")

	const form = document.getElementById("admin-anzeige") as HTMLFormElement
	const fieldset = form.querySelector("fieldset") as HTMLFieldSetElement
	const button = (name: string) => form[name] as HTMLButtonElement

	await new Promise(resolve => {
		const knopf = button("neue-saison")
		knopf.disabled = true
		// * Neue Saison: nur wenn keine laufende Saison existiert
		onValue(ref(Datenbank.datenbank, "saisons/laufend"), snap => {
			if (snap.val() === null) knopf.disabled = false
			resolve()
		})
	})

	await new Promise(resolve => {
		const knopf = button("neue-klasse")
		knopf.disabled = true
		// * Klasse eintragen: nur wenn eine laufende Saison existiert
		onValue(ref(Datenbank.datenbank, "saisons/laufend"), async snap => {
			if (snap.val() !== null) knopf.disabled = false
			resolve()
		})
	})

	await new Promise(resolve => {
		const knopf = button("saisonstart")
		knopf.disabled = true
		// * Saisonstart festlegen/verändern: nur wenn noch keiner gegeben oder dieser noch verändert werden kann (nicht schon passiert ist)
		onValue(ref(Datenbank.datenbank, "saisons/laufend"), snap => {
			const laufend = snap.val();
			if (laufend !== null) {
				onValue(ref(Datenbank.datenbank, "saisons/details/" + laufend + "/zeit/start"), snap => {
					const start = snap.val();
					if (start === null || start > Date.now()) knopf.disabled = false
					resolve()
				})
			} else resolve()
		})
	})

	await new Promise(resolve => {
		const knopf = button("saisonende")
		knopf.disabled = true
		// * Saisonende festlegen/verändern: nur wenn noch keines gegeben oder dieses noch verändert werden kann (nicht schon passiert ist)
		onValue(ref(Datenbank.datenbank, "saisons/laufend"), snap => {
			const laufend = snap.val();
			if (laufend !== null) {
				onValue(ref(Datenbank.datenbank, "saisons/details/" + laufend + "/zeit/ende"), snap => {
					const ende = snap.val();
					if (ende === null || ende > Date.now()) knopf.disabled = false
					resolve()
				})
			} else resolve()
		})
	})

	await new Promise(resolve => {
		const knopf = button("saison-loeschen")
		knopf.disabled = true
		// * Saison löschen: nur wenn eine laufende Saison existiert
		onValue(ref(Datenbank.datenbank, "saisons/laufend"), async snap => {
			if (snap.val() !== null) knopf.disabled = false
			resolve()
			// TODO Neuladen empfehlen (nach Löschen einer Saison, da keine listener auf Saison onChildRemoved)
		})
	})

	await new Promise(resolve => {
		const knopf = button("strecke-loeschen")
		knopf.disabled = true
		onValue(ref(Datenbank.datenbank, "saisons/aktiv"), snap => {
			if (snap.val() !== null) knopf.disabled = false
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
