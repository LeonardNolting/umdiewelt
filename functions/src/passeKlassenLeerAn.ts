import {datenbank} from "./init";
import * as functions from "firebase-functions";

export const passeKlassenLeerAnRef = functions.region("europe-west1").database.ref("/spezifisch/klassen/liste")
	.onWrite(({after}) => datenbank.ref("/spezifisch/klassen/leer").set(after.numChildren() === 0))
