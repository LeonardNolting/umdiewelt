import * as functions from "firebase-functions";
import {region} from "./init";

export const melden = functions.region(region).database.ref("spezifisch/strecken/{strecke}")
	.onCreate((snap, context) => {
		const strecke: number = snap.val().child("strecke")
		if (strecke > 50000) {
			// TODO melden
		}
	})
