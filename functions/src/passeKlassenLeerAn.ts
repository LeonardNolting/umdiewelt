import {datenbank, region} from "./init";
import * as functions from "firebase-functions";

export const passeKlassenLeerAnRef = functions.region(region).database.ref("/spezifisch/klassen/liste")
	.onWrite(({after}) => datenbank.ref("/spezifisch/klassen/leer").set(after.numChildren() === 0))
