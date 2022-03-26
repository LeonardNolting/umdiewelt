import * as functions from "firebase-functions";
import {region} from "./init";
import * as admin from "firebase-admin";

export const meldeStrecke = functions.region(region).database.ref("spezifisch/strecken/{strecke}")
	.onCreate(async (snap, context) => {
		const id = context.params.strecke
		const fahrerId = snap.child("fahrer").val()
		const fahrer = admin.database().ref("spezifisch/fahrer/" + fahrerId)
		const klasse = (await fahrer.child("klasse").get()).val()
		const schule = (await fahrer.child("schule").get()).val()
		const name = (await fahrer.child("name").get()).val()
		const strecke: number = snap.child("strecke").val()
		const streckeKmFormatiert = Math.round(strecke / 100) / 10
		if (strecke > 100_000) {
			await admin.firestore().collection("mail").add({
				to: "hip@gy-ho.de",
				message: {
					subject: "Um Die Welt: Verdächtige Strecke eingetragen",
					text: `Name: ${name}\nSchule: ${schule}\nKlasse: ${klasse}\nLänge: ${streckeKmFormatiert}km\nID: ${id}\n\nUm die Strecke zurückzunehmen, öffnen Sie bitte die Website und melden sich als Admin an. Klicken Sie auf 'Strecke löschen' und geben Sie die ID ein. Die Strecke wird nun gelöscht.`,
				},
			})
		}
	})
