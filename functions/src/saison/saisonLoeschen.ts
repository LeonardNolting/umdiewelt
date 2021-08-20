import * as functions from "firebase-functions";
import {datenbank, region} from "../init";
import * as admin from "firebase-admin";

export const saisonLoeschen = functions.region(region).database.ref("allgemein/saisons/liste/{saison}")
	.onDelete(async (snap, context) => {
		const saison = context.params.saison

		// Aktiv
		{
			const aktiv = (await datenbank.ref("allgemein/saisons/aktiv").get()).val()
			if (aktiv === saison) {
				const saisons = Object.keys((await datenbank.ref("allgemein/saisons/liste").get()).val())
				await datenbank.ref("allgemein/saisons/aktiv").set(saisons[saisons.length - 1] || null)
			}
		}

		// Fakten
		{
			const updates: { [ref: string]: any } = {}
			await Promise.all(["strecke", "anzahlStrecken", "anzahlFahrer"].map(async fakt => {
				const saisonWert = (await datenbank.ref("allgemein/saisons/details/" + saison + "/" + fakt).get()).val()
				updates[fakt] = admin.database.ServerValue.increment(-saisonWert)
			}))
			await datenbank.ref("allgemein").update(updates)
		}

		// Teilnehmende Schulen
		{
			const teilnehmendeSchulen = Object.keys((await datenbank.ref("allgemein/saisons/details/" + saison + "/schulen/liste").get()).val())
			const updates: { [ref: string]: any } = {}
			await Promise.all(teilnehmendeSchulen.map(schule => updates[schule + "/saisons/liste/" + saison] = null))
			await datenbank.ref("allgemein/schulen/details").update(updates)
		}

		// Klassen (Accounts)
		{
			const promises: Promise<any>[] = []
			await datenbank.ref("spezifisch/klassen/details").get().then(schulenSnap => schulenSnap.forEach(schuleSnap => {
				schuleSnap.forEach(klasseSnap => {
					promises.push(klasseSnap.ref.remove())
				})
			}))
			await Promise.all(promises)
		}

		// Aktuell, laufend, anzahl
		{
			const aktuell = (await datenbank.ref("allgemein/saisons/laufend").get()).val()
			if (aktuell == saison) {
				// vor spezifisch, damit nicht andere Cloud Functions probieren die Fakten überall anzupassen...
				await datenbank.ref("allgemein/saisons").update({
					aktuell: null,
					laufend: null
				})
				await datenbank.ref("spezifisch").remove()
			} else await datenbank.ref("allgemein/saisons/anzahlHistorisch").set(admin.database.ServerValue.increment(-1))

			await datenbank.ref("allgemein/saisons/anzahl").set(admin.database.ServerValue.increment(-1))
		}
	})
