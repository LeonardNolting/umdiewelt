import step from "./step";

export namespace Cookie {
	/**
	 * Gibt Wert eines Cookies zurück
	 * @param name Name des Cookies
	 * @param json Ob in JSON geparsed werden soll
	 * @return wert bzw. undefined wenn Cookie nicht vorhanden
	 */
	export function get<T>(name: string, json = true): T | undefined {
		const matches = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)'),
			wert = matches ? matches[2] : null;
		if (wert === null) return undefined;
		return (json ? JSON.parse(wert) : wert) as T;
	}

	/**
	 * Setzt einen Cookie
	 * @param name Name des Cookies
	 * @param wert Wert des Cookies
	 * @param json Ob Wert in json konvertiert werden soll
	 * @param maxAge Standard: 1 Jahr
	 */
	export function set(name: string, wert: any, json = true, maxAge = 31536000) {
		wert = json ? JSON.stringify(wert) : wert;
		document.cookie = `${name}=${wert}; max-age=${maxAge}`;
	}

	/**
	 * Löscht einen Cookie
	 * @param name Name des Cookies
	 */
	export function kill(name) {
		document.cookie = `${name}=; expires=Sun, 24 Dec 0000 18:42:00 GMT`;
		step("Cookie '" + name + "' gelöscht")
	}

	/**
	 * Löscht alle Cookies
	 */
	export function killAll() {
		const cookies = document.cookie.split(";");

		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i],
				eqPos = cookie.indexOf("="),
				name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
			kill(name);
		}

		step(cookies.length + " Cookies gelöscht")
	}

	/**
	 * Gibt zurück, ob min. ein Cookie existiert
	 */
	export function empty(): boolean {
		return document.cookie.length == 0
	}
}
