import LatLngLiteral = google.maps.LatLngLiteral;
import {karte} from "./initialisieren";

export class Markierung {
	position: LatLngLiteral

	marker: google.maps.Marker

	constructor(
		readonly url: string,
		readonly groesse: number,
		anfangsPosition: google.maps.LatLngLiteral,
		readonly zentriert: boolean = true,
		readonly onClick: (marker: google.maps.Marker) => void = undefined,
		readonly cursor: string = undefined,
		private readonly iconOptionen: () => {} = () => ({}),
		readonly title: string = undefined
	) {
		this.position = anfangsPosition
	}

	/**
	 * Erstellt ein google.maps.Icon aus allen gegebenen Werten
	 */
	private icon: () => google.maps.Icon = () => ({
		url: this.url,
		scaledSize: new google.maps.Size(this.groesse, this.groesse),
		...(this.zentriert && {
			anchor: new google.maps.Point(this.groesse / 2, this.groesse / 2)
		}),
		...this.iconOptionen()
	})

	/**
	 * Platziert Marker auf Karte & fügt onClick-Event hinzu
	 */
	aufKarte = () => {
		this.marker = new google.maps.Marker({
			position: this.position,
			icon: this.icon(),
			map: karte,
			cursor: this.cursor,
			clickable: !!this.onClick,
			visible: !!this.url,
			title: this.title
		});
		this.marker.addListener("click", () => {
			if (this.onClick) this.onClick(this.marker)
		});
	}

	bewegen = (neuePosition: LatLngLiteral) => {
		if (this.marker) this.marker.setPosition(neuePosition)
		this.position = neuePosition
	}
}
