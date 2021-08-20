import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {datenbank, region} from "../init";
import {setTask} from "./setTask";

export const beendeSaison = functions.region(region).https.onRequest(async (request, response) => {
	await datenbank.ref("allgemein/saisons/countdowns/endeTask").remove()

	// Testen, ob wirklich beendet werden kann (da Function öffentlich ist)
	const ende = (await datenbank.ref("/allgemein/saisons/countdowns/ende").get()).val()
	if (ende === null || ende > Date.now()) return response.sendStatus(409).end()

	const laufend = (await datenbank.ref("/allgemein/saisons/laufend").get()).val()
	const updates: { [ref: string]: any } = {}
	// Saison ist nicht mehr aktuell und läuft nicht mehr
	updates["allgemein/saisons/aktuell"] = null
	updates["allgemein/saisons/laufend"] = null
	// Countdown entfernen
	updates["allgemein/saisons/countdowns/ende"] = null
	// Ende einfügen
	updates["allgemein/saisons/details/" + laufend + "/zeit/ende"] = ende
	// Anzahl historisch erhöhen
	updates["allgemein/saisons/anzahlHistorisch"] = admin.database.ServerValue.increment(1)
	await datenbank.ref().update(updates)

	response.sendStatus(200).end()
})

export const erstelleTaskZumBeendenDerSaison = functions.region(region).database.ref("/allgemein/saisons/countdowns/ende")
	.onWrite(change => setTask(change, "saisonende-beendeSaison"))
