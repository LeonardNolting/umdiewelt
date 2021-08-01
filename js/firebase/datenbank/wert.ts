import {onValue, DatabaseReference, set} from "firebase/database";
import {Tabelle} from "./tabelle";

export class Wert<V> implements Tabelle {
	private _wert: V
	name!: string

	set wert(wert: V) {
		// this._wert = wert
		set(this.ref, wert)
	}

	get wert() {
		return this._wert
	}

	private _ref: DatabaseReference

	constructor(
		private readonly onChange: (value: V) => void,
		private readonly standard: V,
		private readonly nehmeStandard: (wert: any) => boolean
	) {
	}

	set ref(ref: DatabaseReference) {
		this._ref = ref

		onValue(ref, data => {
			const value = data.val()
			const wert = this.nehmeStandard(value) ? this.standard : value
			this._wert = wert
			this.onChange(wert)
		})
	}

	get ref() {
		return this._ref
	}
}
