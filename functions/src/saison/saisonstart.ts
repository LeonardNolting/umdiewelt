import * as functions from "firebase-functions";
import {datenbank, region} from "../init";
import {setTask} from "./setTask";

export const starteSaison = functions.region(region).https.onRequest(async (request, response) => {
	await datenbank.ref("allgemein/saisons/countdowns/startTask").remove()

	// Testen, ob wirklich gestartet werden kann (da Function öffentlich ist)
	const start = (await datenbank.ref("/allgemein/saisons/countdowns/start").get()).val()
	if (start === null || start > Date.now()) return response.sendStatus(409).end()

	const aktuell = (await datenbank.ref("/allgemein/saisons/aktuell").get()).val()
	const updates: { [ref: string]: any } = {}
	// Laufende Saison auf aktuelle Saison setzen
	updates["allgemein/saisons/laufend"] = aktuell
	// Countdown entfernen
	updates["allgemein/saisons/countdowns/start"] = null

	// Start einfügen
	// updates["allgemein/saisons/details/" + aktuell + "/zeit/start"] = start
	// wurde schon beim Erstellen des tasks gemacht!

	await datenbank.ref().update(updates)

	response.sendStatus(200).end()
})

export const erstelleTaskZumStartenDerSaison = functions.region(region).database.ref("/allgemein/saisons/countdowns/start")
	.onWrite(async (change) => {
		const aktuell = (await datenbank.ref("/allgemein/saisons/aktuell").get()).val();

		// Aktive Saison auf aktuelle Saison setzen
		if (!change.before.exists()) await datenbank.ref("/allgemein/saisons/aktiv")
			.set(aktuell);

		await datenbank.ref("allgemein/saisons/details/" + aktuell + "/zeit/start").set(change.after.val());

		await setTask(change, "saisonstart-starteSaison")
	})
