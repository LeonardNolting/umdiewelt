export const
	apiSchluessel = "AIzaSyD902IK8JZjokswY-3i-owOdzebC54dIFs",

	/**
	 * In your application you can specify release channels or version numbers:
	 *
	 * The weekly version is specified with `version=weekly`. This version is
	 * updated once per week, and is the most current.
	 *
	 * ```
	 * const loader = Loader({apiKey, version: 'weekly'});
	 * ```
	 *
	 * The quarterly version is specified with `version=quarterly`. This version
	 * is updated once per quarter, and is the most predictable.
	 *
	 * ```
	 * const loader = Loader({apiKey, version: 'quarterly'});
	 * ```
	 *
	 * The version number is specified with `version=n.nn`. You can choose
	 * `version=3.40`, `version=3.39`, or `version=3.38`. Version numbers are
	 * updated once per quarter.
	 *
	 * ```
	 * const loader = Loader({apiKey, version: '3.40'});
	 * ```
	 *
	 * If you do not explicitly specify a version, you will receive the
	 * weekly version by default.
	 */
	version = "quarterly",

	sprache = "de",
	region = "DE",

	zoom = 3,

	/**
	 * Längengrad, wie weit das Fahrrad gekommen ist
	 */
	fortschritt = 100,

	/**
	 * Breitengrad jeweils nach Nord und Süd von 0 aus, bei dem die Strecke beginnt und aufhört
	 * 0 entspricht Linie direkt auf Äquator
	 */
	spread = 4,

	/**
	 * Sekunden in denen sich jedes Icon auf dem Mittelstreifen um jeweils 100% bewegt
	 */
	mittelstreifenGeschwindigkeit = 1.2,
	/**
	 * Wie häufig die Positionen der Icons des Mittelstreifens aktualisiert werden sollen, pro Sekunde
	 */
	mittelstreifenFPS = 25,

	farben = {
		strasse: "#111111",
		progress: "#90c53a",
		mittelstreifen: "#DDDDDD"
	};
