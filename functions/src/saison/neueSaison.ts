import * as functions from "firebase-functions";
import {datenbank, region} from "../init";

export const neueSaison = functions.region(region).database.ref("allgemein/saisons/liste/{saison}")
	.onCreate((snap, context) =>
		datenbank.ref().update({
			"allgemein/saisons/aktuell": context.params.saison,
			"spezifisch": null
		}))
