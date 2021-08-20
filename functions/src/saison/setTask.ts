import {datenbank, region} from "../init";
import {Change, logger} from "firebase-functions";
import {DataSnapshot} from "firebase-functions/lib/providers/database";

const {CloudTasksClient} = require("@google-cloud/tasks")

const project = process.env.GCLOUD_PROJECT
const queueName = 'countdowns'
const url = (functionName: string) => `https://${region}-${project}.cloudfunctions.net/${functionName}`
const seconds = (datum: number) => datum / 1000
export const setTask = async ({before, after}: Change<DataSnapshot>, functionName: string) => {
	const tasksClient = new CloudTasksClient()
	const queuePath = tasksClient.queuePath(project, region, queueName)

	// Bestehenden Task entfernen
	const taskNameRef = datenbank.ref("allgemein/saisons/countdowns/" + (before.key || after.key) + "Task");
	const taskNameSnap = await taskNameRef.get();
	if (taskNameSnap.exists()) {
		const taskName = taskNameSnap.val() as string
		await tasksClient.deleteTask({name: taskName}).catch((reason: any) => logger.warn("Konnte bestehenden Task entfernen: " + reason))
		await taskNameRef.remove()
	}

	// Neuen Task erstellen
	if (after.exists()) {
		const [task] = await tasksClient.createTask({
			parent: queuePath,
			task: {
				httpRequest: {url: url(functionName)},
				scheduleTime: {seconds: seconds(after.val())}
			}
		}).finally(() => tasksClient.close())
		await taskNameRef.set(task.name)
	}
}
