import * as functions from "firebase-functions";
import {datenbank, region} from "../init";
import {project, queueName, seconds, url} from "./utils";

const {CloudTasksClient} = require('@google-cloud/tasks')

export const beendeSaison = functions.region(region).https.onRequest(async (request, response) => {
	// Testen, ob wirklich beendet werden kann (da Function öffentlich ist)
	if ((await datenbank.ref("/allgemein/saisons/zeit/ende").get()).val() > Date.now()) return response.sendStatus(409).end()

	await datenbank.ref("/allgemein/saisons").update({
		"aktuell": null,
		"laufend": null
	})
	response.sendStatus(200).end()

	// TODO allgemein/saisons/zeit löschen?
})

export const erstelleTaskZumBeendenDerSaison = functions.region(region).database.ref("/allgemein/saisons/zeit/ende")
	.onWrite(async ({before, after}) => {
		const tasksClient = new CloudTasksClient()
		const taskName = "saisonende"

		// Bestehenden Task entfernen
		if (before.exists()) await tasksClient.deleteTask({name: taskName})

		// Neuen Task erstellen
		if (after.exists()) {
			const queuePath = tasksClient.queuePath(project, region, queueName)
			await tasksClient.createTask({
				parent: queuePath,
				task: {
					httpRequest: {url: url("saisonende-beendeSaison")},
					scheduleTime: {seconds: seconds(after.val())},
					name: taskName
				}
			})
		}
	})
