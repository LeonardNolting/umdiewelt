import {region} from "./init";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const loescheAccount = functions.region(region).database.ref("/spezifisch/klassen/details/{schule}/{klasse}")
	.onDelete(snap => admin.auth().deleteUser(snap.child("uid").val()))
