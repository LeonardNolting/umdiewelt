import {onValue, ref, Unsubscribe} from "firebase/database";
import Datenbank from "../../../firebase/datenbank";
import ZeitKontrolle from "./zeit";

export default class SaisonendeKontrolle extends ZeitKontrolle {
	constructor() {
		super("ende", "Das Saisonende kann nur verändert werden, wenn eine laufende Saison existiert. Veränderungen müssen mindestens eine Stunde vor dem geplanten Saisonende stattfinden.");
	}

	private laufendListener: Unsubscribe
	private countdownListener: Unsubscribe
	private laufend: string | undefined = undefined

	protected init() {
		return new Promise<void>(resolve =>
			this.laufendListener = onValue(ref(Datenbank.datenbank, "allgemein/saisons/laufend"), snap => {
				this.laufend = snap.val()

				if (this.laufend === null) {
					this.countdownListener?.()
					this.erlaubt = false
					resolve()
				} else if (!this.countdownListener) this.countdownListener =
					onValue(ref(Datenbank.datenbank, "allgemein/saisons/countdowns/ende"), snap => {
						this.countdown = snap.val();
						this.erlaubt = this.countdown === null || this.countdown > new Date(Date.now() + 3600 * 1000).getTime()
						resolve()
					})
			})
		)
	}

	async destroy() {
		this.laufendListener?.()
		this.countdownListener?.()
	}
}
