import {region} from "../init";
import {CloudTasksClient} from "@google-cloud/tasks";
import {Change} from "firebase-functions";
import {DataSnapshot} from "firebase-functions/lib/providers/database";

const project = JSON.parse(process.env.FIREBASE_CONFIG!).projectId
const queueName = 'countdowns'
const url = (functionName: string) => `https://${region}-${project}.cloudfunctions.net/${functionName}`
const seconds = (datum: number) => datum / 1000
export const setTask = async ({before, after}: Change<DataSnapshot>, functionName: string) => {
	const tasksClient = new CloudTasksClient()
	const queuePath = tasksClient.queuePath(project, region, queueName)

	// Bestehenden Task entfernen
	if (before.exists() && before.val() > Date.now()) await tasksClient.purgeQueue({name: queueName})

	// Neuen Task erstellen
	if (after.exists()) await tasksClient.createTask({
		parent: queuePath,
		task: {
			httpRequest: {url: url(functionName)},
			scheduleTime: {seconds: seconds(after.val())}
		}
	})
}
