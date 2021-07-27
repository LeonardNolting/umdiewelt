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

	/**
	 * E-Mail für Firebase Authentication-Konto
	 */
	email = "leonard.nolting@gymhoes.de",

	/**
	 * Verschiedene Zoom-Level, welche beim Klicken auf das Fahrrad zirkulär wechseln
	 */
	level = [3, 6, 10],

	/**
	 * Erdumfang am Äquator in m
	 */
	umfang = 40_075_017,

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
	},

	/**
	 * Wie viele Schritte bei Animationen gemacht werden, pro Sekunde
	 */
	animationFPS = 200,

	/**
	 * Zeit für Animationen in ms
	 */
	animationZeit = 400,

	/**
	 * Zeit, bis zu Fahrrad bewegt wird in ms
	 */
	verspaetungZuFahrrad = 1500,

	/**
	 * Wie lange die Bewegung zum Fahrrad braucht
	 * @param lat wie weit das Fahrrad ist (0-360)
	 */
	zeitZuFahrrad = (lat: number) => lat * 5 + 200,

	/**
	 * Wie viele Einträge der Bestenliste auf einmal geladen werden
	 */
	bestenlisteChunkGroesse = 10,

	koordinaten = {
		hoechstadt: {lat: 49.709576321528836, lng: 10.81265000522466},
	};
