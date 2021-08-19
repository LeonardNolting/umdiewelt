import * as functions from "firebase-functions";
import {datenbank, region} from "../init";

export const teilnehmendeSchulen = functions.region(region).database.ref("allgemein/saisons/details/{saison}/schulen/liste/{schule}")
	.onCreate((snap, context) =>
		datenbank.ref("allgemein/schulen/details/" + context.params.schule + "/saisons/liste/" + context.params.saison).set(true))
