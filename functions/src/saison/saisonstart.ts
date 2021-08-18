import * as functions from "firebase-functions";
import {datenbank, region} from "../init";
import {project, queueName, seconds, url} from "./utils";

const {CloudTasksClient} = require('@google-cloud/tasks')

export const starteSaison = functions.region(region).https.onRequest(async (request, response) => {
	// Testen, ob wirklich gestartet werden kann (da Function öffentlich ist)
	if ((await datenbank.ref("/allgemein/saisons/zeit/start").get()).val() > Date.now()) return response.sendStatus(409).end()

	// Laufende Saison auf aktuelle Saison setzen
	await datenbank.ref("/allgemein/saisons/laufend").set((await datenbank.ref("/allgemein/saisons/aktuell").get()).val());
	response.sendStatus(200).end()

	// TODO allgemein/saisons/zeit löschen?
})

export const erstelleTaskZumStartenDerSaison = functions.region(region).database.ref("/allgemein/saisons/zeit/start")
	.onWrite(async ({before, after}) => {
		// Aktive Saison auf aktuelle Saison setzen
		await datenbank.ref("/allgemein/saisons/aktiv").set((await datenbank.ref("/allgemein/saisons/aktuell").get()).val());

		const tasksClient = new CloudTasksClient()
		const taskName = "saisonstart"

		// Bestehenden Task entfernen
		if (before.exists()) await tasksClient.deleteTask({name: taskName})

		// Neuen Task erstellen
		if (after.exists()) {
			const queuePath = tasksClient.queuePath(project, region, queueName)
			await tasksClient.createTask({
				parent: queuePath,
				task: {
					httpRequest: {url: url("saisonstart-starteSaison")},
					scheduleTime: {seconds: seconds(after.val())},
					name: taskName
				}
			})
		}
	})
