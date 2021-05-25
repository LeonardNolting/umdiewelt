export class Markierung {
	constructor(
		readonly url: string,
		readonly groesse: number,
		readonly position: google.maps.LatLngLiteral,
		readonly zentriert: boolean = true,
		readonly onClick: (marker: google.maps.Marker) => void = undefined,
		readonly cursor: string = undefined
	) {
	}

	/**
	 * Erstellt ein google.maps.Icon aus allen gegebenen Werten
	 */
	private icon: () => google.maps.Icon = () => ({
		url: this.url,
		scaledSize: new google.maps.Size(this.groesse, this.groesse),
		...(this.zentriert && {
			anchor: new google.maps.Point(this.groesse / 2, this.groesse / 2)
		})
	})

	/**
	 * Platziert Marker auf google.maps.Map & fügt onClick-Event hinzu
	 * @param karte Karte, auf der der Marker platziert werden soll
	 */
	aufKarte = (karte: google.maps.Map) => {
		const marker = new google.maps.Marker({
			position: this.position,
			icon: this.icon(),
			map: karte,
			cursor: this.cursor,
			clickable: !!this.onClick
		});
		marker.addListener("click", () => {
			if (this.onClick) this.onClick(marker)
		});
	}
}
