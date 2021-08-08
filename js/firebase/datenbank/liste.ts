import {child, query, ref, equalTo, DataSnapshot, onChildAdded, onChildChanged, onChildRemoved, onValue, push, DatabaseReference} from "firebase/database";
import {Tabelle} from "./tabelle";
import {Zeile} from "./zeile";

/**
 * Sortierung entspricht **nicht** unbedingt der der Datenbank!
 */
export default class Liste<V> implements Tabelle {
	private _ref: DatabaseReference
	name!: string
	elemente: Zeile<V>[] = []
	geladen = false

	constructor(
		private readonly onAdd?: (zeile: Zeile<V>) => void,
		private readonly onChange?: (zeile: Zeile<V>) => void,
		private readonly onRemove?: (key: string) => void,
		private readonly onLoad?: (elemente: Zeile<V>[]) => void
	) {
	}

	set ref(ref: DatabaseReference) {
		this._ref = ref

		if (this.onLoad) this.laden(this.onLoad)
		if (this.onAdd) onChildAdded(ref, data => this.onAdd({key: data.key, value: data.val()}))
		if (this.onChange) onChildChanged(ref, data => this.onChange({key: data.key, value: data.val()}))
		if (this.onRemove) onChildRemoved(ref, data => this.onRemove(data.key))
	}

	get ref() {
		return this._ref
	}

	laden(onLoad: (elemente: Zeile<V>[]) => void) {
		// Liste leeren https://stackoverflow.com/a/1232046/11485145
		this.elemente.length = 0

		onValue(this.ref, data => {
			const value = data.toJSON() as {[id: string]: V}
			const elemente = Object.entries(value || {}).map(([key, value]) => ({key, value}))
			this.elemente.push(...elemente)
			this.geladen = true
			onLoad(this.elemente)
		}, {
			onlyOnce: true
		})
	}

	ladeZeile(key: string, callback: (snapshot: DataSnapshot) => void) {
		onValue(child(this.ref, key), callback)
	}

	eintragen(value: V) {
		return push(this.ref, value)
	}

	get(id: string) {
		return this.elemente.find(zeile => zeile.key === id).value
	}
}
