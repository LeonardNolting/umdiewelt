import {onValue, ref, Unsubscribe} from "firebase/database";
import Datenbank from "../../../firebase/datenbank";
import ZeitKontrolle from "./zeit";

export default class SaisonstartKontrolle extends ZeitKontrolle {
	constructor() {
		super("start", "Der Saisonstart kann nur verändert werden, wenn eine aktuelle Saison existiert und diese noch nicht begonnen hat. Veränderungen müssen mindestens eine Stunde vor dem geplanten Saisonstart stattfinden.");
	}

	private aktuellListener: Unsubscribe
	private zeitListener: Unsubscribe
	private countdownListener: Unsubscribe
	private aktuell: string | undefined = undefined

	protected init() {
		return new Promise<void>(resolve =>
			this.aktuellListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/aktuell"), snap => {
				this.aktuell = snap.val();
				this.zeitListener?.()

				if (this.aktuell === null) {
					this.countdownListener?.()
					this.erlaubt = false
					resolve()
				} else this.zeitListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/details/" + this.aktuell + "/zeit/start"), snap => {
					if (snap.val() === null) {
						if (!this.countdownListener) this.countdownListener =
							onValue(ref(Datenbank.datenbank, "allgemein/saisons/countdowns/start"), snap => {
								this.countdown = snap.val();
								this.erlaubt = this.countdown === null || this.countdown > new Date(Date.now() + 3600 * 1000).getTime()
								resolve()
							})
					} else {
						this.erlaubt = false
						resolve()
					}
				})
			})
		)
	}

	async destroy() {
		this.aktuellListener?.()
		this.zeitListener?.()
		this.countdownListener?.()
	}
}
