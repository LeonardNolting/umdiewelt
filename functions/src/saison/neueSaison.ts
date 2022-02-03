import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {datenbank, region} from "../init";

export const neueSaison = functions.region(region).database.ref("allgemein/saisons/liste/{saison}")
	.onCreate( async(snap, context) => {
		const updates: {[path: string]: any} = {
			"allgemein/saisons/aktuell": context.params.saison,
			"allgemein/saisons/anzahl": admin.database.ServerValue.increment(1),
			"spezifisch": null
		}
		const aktiv = (await datenbank.ref("allgemein/saisons/aktiv").get()).val()
		if (!aktiv) updates["allgemein/saisons/aktiv"] = context.params.saison
		return datenbank.ref().update(updates);
	})
