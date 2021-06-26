import step from "./step";
import Cookie from "./cookie";
import Popup from "./popup";

namespace Cookies {
	const popup = document.getElementById("popup-cookies");

	enum Einstellung {
		// "as any" erlaubt index access operator (CookieEinstellung[...])
		// s. https://stackoverflow.com/questions/62215454/how-to-get-enum-key-by-value-in-typescript

		ALLE = <any>"alle",
		NOTWENDIG = <any>"notwendig",
		KEINE = <any>"keine",
		UNDEFINED = 0
	}

	export let einstellung: Einstellung = Einstellung.UNDEFINED
	export let optional = () => einstellung === Einstellung.ALLE
	export let notwendig = () => einstellung === Einstellung.ALLE || einstellung === Einstellung.NOTWENDIG

	/**
	 *
	 * @param einstellung Null: Nichts ändern
	 */
	const setzen = (einstellung: Einstellung) => {
		if (einstellung === null) return
		Cookies.einstellung = einstellung
		if (notwendig()) Cookie.set("cookies", einstellung)
		step("Cookie-Einstellung gesetzt: " + einstellung)
		return einstellung
	}

	/**
	 * Zeigt Popup für Cookie Einverständnis und fügt events zu entsprechenden buttons hinzu.
	 * @return Promise<void> sobald eine Antwort vom Benutzer angeklickt wurde
	 */
	export const ueberpruefen = async (): Promise<Einstellung> => {
		step("Überprüft Cookie-Einstellung")

		const gespeichert = (Einstellung[Cookie.get<string>("cookies")] as Einstellung) || Einstellung.UNDEFINED;
		return gespeichert === Einstellung.UNDEFINED || gespeichert === Einstellung.KEINE ?
			// Kein/komischer gespeicherter Wert: fragen
			fragen() :
			// setzen() wird schon bei fragen() ausgeführt, deswegen dort nicht
			// nicht speichern, da ja schon gespeichert
			setzen(gespeichert);
	}

	/**
	 * Öffnet immer ein Popup um Einstellung evtl. zu überdenken
	 */
	export const fragen = (abbrechenMoeglich: boolean = false) => new Promise<Einstellung>(resolve => {
		step("Fragt nach Cookie-Einwilligung")

		const button = (
			einstellung: Einstellung,
			onclick: (event: MouseEvent) => void = () => {
			}
		) => {
			const element = document.getElementById("popup-cookies-" + (einstellung || "abbrechen")) as HTMLButtonElement
			element.onclick = event => {
				// Verhindere versehentliches doppeltes Klicken
				element.disabled = true
				Popup.schliessen(popup)
				popup.classList.remove("wichtig", "wird-resetten")
				onclick(event)
				element.disabled = false
				if (einstellung !== null) Cookie.killAll()
				resolve(setzen(einstellung))
			}
		}

		if (abbrechenMoeglich) button(null)
		button(Einstellung.ALLE)
		button(Einstellung.NOTWENDIG)
		button(Einstellung.KEINE, window.close)

		if (!abbrechenMoeglich) popup.classList.add("wichtig")
		if (Cookie.get("cookies")) popup.classList.add("wird-resetten")

		// Alles vorbereitet, jetzt öffnen ...
		Popup.oeffnen(popup)
	})

	/**
	 * TODO
	 * Öffnet Popup, falls bisherige Einstellung nicht reicht.
	 */
	export const fragenFallsNoetig = (noetigeEinstellung: Einstellung) => {
		// testen ob popup nötig...
		// TODO
	}
}

export default Cookies
