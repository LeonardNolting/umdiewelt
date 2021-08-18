import * as functions from "firebase-functions";
import {datenbank, region} from "../init";
import {setTask} from "./setTask";

export const starteSaison = functions.region(region).https.onRequest(async (request, response) => {
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
	updates["allgemein/saisons/" + aktuell + "/zeit/start"] = start
	await datenbank.ref().update(updates)

	response.sendStatus(200).end()
})

export const erstelleTaskZumStartenDerSaison = functions.region(region).database.ref("/allgemein/saisons/countdowns/start")
	.onWrite(async (change) => {
		// Aktive Saison auf aktuelle Saison setzen
		await datenbank.ref("/allgemein/saisons/aktiv").set((await datenbank.ref("/allgemein/saisons/aktuell").get()).val());

		await setTask(change, "saisonstart-starteSaison")
	})
