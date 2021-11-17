import {User} from "firebase/auth";

const global: {
	/**
	 * angemeldet: User
	 * nicht angemeldet: null
	 * unbekannt: undefined
	 */
	user: User | null | undefined
} = {}

export default global
