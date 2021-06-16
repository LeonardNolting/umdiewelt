import step from "./step";
import Cookie from "./cookie";

namespace Cookies {
	const popup = document.getElementById("popup-cookies")

	enum Einstellung {
		// "as any" erlaubt index access operator (CookieEinstellung[...])
		// s. https://stackoverflow.com/questions/62215454/how-to-get-enum-key-by-value-in-typescript

		ALLE = <any>"alle",
		NOTWENDIG = <any>"notwendig",
		KEINE = <any>"keine",
		UNDEFINED = 0
	}

	export let einstellung: Einstellung = Einstellung.UNDEFINED

	const setzen = (einstellung: Einstellung, speichern: boolean) => {
		Cookies.einstellung = einstellung
		if (speichern) Cookie.set("cookies", einstellung)
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
			setzen(gespeichert, false);
	}

	/**
	 * Öffnet immer ein Popup um Einstellung evtl. zu überdenken
	 */
	export const fragen = () => new Promise<Einstellung>(resolve => {
		step("Fragt nach Cookie-Einwilligung")

		const button = (
			einstellung: Einstellung,
			speichern: boolean,
			onclick: (event: MouseEvent) => void = () => {
			}
		): HTMLButtonElement => {
			const name = Einstellung[einstellung],
				element = document.getElementById("popup-cookies-" + name) as HTMLButtonElement
			element.onclick = event => {
				// Verhindere versehentliches doppeltes Klicken
				element.disabled = true;

				// Popup schließen
				popup.classList.remove("offen")

				onclick(event)

				element.disabled = false;

				resolve(setzen(einstellung, speichern))
			}
			return element
		}

		button(Einstellung.ALLE, true)
		button(Einstellung.NOTWENDIG, true)
		button(Einstellung.KEINE, false, window.close)

		// Alles vorbereitet, jetzt öffnen ...
		popup.classList.add("offen")
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
