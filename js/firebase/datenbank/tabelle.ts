import {DatabaseReference} from "firebase/database";

export interface Tabelle {
	ref: DatabaseReference
	name: string
}
