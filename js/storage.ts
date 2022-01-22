import step from "./step";

namespace Storage {
	/**
	 * Gibt Wert eines Cookies zurück
	 * @param name Name des Cookies
	 * @param json Ob in JSON geparsed werden soll
	 * @return wert bzw. undefined wenn Cookie nicht vorhanden
	 */
	export function get<T>(name: string, json = true): T | undefined {
		const wert = localStorage.getItem(name);
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
		localStorage.setItem(name, wert)
	}

	/**
	 * Löscht einen Cookie
	 * @param name Name des Cookies
	 */
	export function kill(name) {
		localStorage.removeItem(name)
		step("Cookie '" + name + "' gelöscht")
	}

	/**
	 * Löscht alle Cookies
	 */
	export function killAll() {
		localStorage.clear()
		step("Cookies gelöscht")
	}
}

export default Storage
