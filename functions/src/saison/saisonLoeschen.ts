import * as functions from "firebase-functions";
import {datenbank, region} from "../init";
import * as admin from "firebase-admin";

export const saisonLoeschen = functions.region(region).database.ref("allgemein/saisons/liste/{saison}")
	.onDelete(async (snap, context) => {
		const saison = context.params.saison
		const updates: { [ref: string]: any } = {}
		const aktiv = (await datenbank.ref("allgemein/saisons/aktiv").get()).val() === saison

		// * Aktiv
		if (aktiv) {
			const saisons = Object.keys((await datenbank.ref("allgemein/saisons/liste").get()).val() || {})
			updates["allgemein/saisons/aktiv"] = saisons[saisons.length - 1] || null
		}

		// * Fakten
		await Promise.all(["strecke", "anzahlStrecken", "anzahlFahrer"].map(async fakt => {
			const saisonWert = (await datenbank.ref("allgemein/saisons/details/" + saison + "/" + fakt).get()).val()
			updates["allgemein/" + fakt] = admin.database.ServerValue.increment(-saisonWert)
		}))

		// * Teilnehmende Schulen
		const teilnehmendeSchulen = Object.keys((await datenbank.ref("allgemein/saisons/details/" + saison + "/schulen/liste").get()).val())
		teilnehmendeSchulen.map(schule => updates["allgemein/schulen/details/" + schule + "/saisons/liste/" + saison] = null)

		// * Klassen (Accounts)
		await datenbank.ref("spezifisch/klassen/details").get().then(schulenSnap => schulenSnap.forEach(schuleSnap => {
			schuleSnap.forEach(klasseSnap => {
				updates[`spezifisch/klassen/details/${(schuleSnap.key)}/${(klasseSnap.key)}`] = null
			})
		}))

		// * Details
		updates["allgemein/saisons/details/" + saison] = null

		try {
			await datenbank.ref().update(updates)

			// * Aktuell, laufend, spezifisch, anzahl
			try {
				await datenbank.ref().update({
					"allgemein/saisons/aktuell": null,
					"allgemein/saisons/laufend": null,
					"spezifisch": null,
					"allgemein/saisons/anzahl": admin.database.ServerValue.increment(-1),
				})
			} catch (e) {
				console.log("Saison löschen hat nicht funktioniert: Es fehlen folgende Änderungen: aktuell = null; laufend = null; spezifisch = null; saisons/anzahl -= 1;")
			}
		} catch (e) {
			console.log("Saison löschen hat nicht funktioniert: Keine Änderungen vorgenommen.")
		}
	})
