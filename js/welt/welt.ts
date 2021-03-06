import {
	AdditiveBlending,
	BackSide,
	Group,
	Mesh,
	Path,
	PerspectiveCamera,
	Scene,
	ShaderMaterial,
	SphereGeometry,
	Texture,
	TextureLoader,
	Vector2,
	WebGLRenderer
} from "three";
import weltVertex from "../../shaders/welt/vertex.glsl";
import weltFragment from "../../shaders/welt/fragment.glsl";
import atmosphaereVertex from "../../shaders/atmosphaere/vertex.glsl";
import atmosphaereFragment from "../../shaders/atmosphaere/fragment.glsl";
import {MeshLine, MeshLineMaterial} from 'meshline';
import {gsap} from "gsap"
import Tween = gsap.core.Tween;
import {HTMLDataElementFakt, zeigeFaktAn} from "../inhalt/fakten";
import {umfang} from "../konfiguration";

// TODO in Konfiguration auslagern

/**
 * Jeder touch-Bewegungs-Vektor wird mit Faktor multipliziert
 */
const touchFaktor = 3
/**
 * Jeder maus-Bewegungs-Vektor wird mit Faktor multipliziert
 */
const mouseFaktor = 1
const radius = 6
const segments = 50
const atmosphaereScale = 1.02
const anfang = -Math.PI / 2 - .15
/**
 * Anfängliche Bewegung
 * matchMedia-Idee: https://stackoverflow.com/a/52854585/11485145
 */
const anfangOffset = Math.PI / 20 * (window.matchMedia("(any-hover: none)").matches ? touchFaktor : mouseFaktor)
const wegFarbe = 0xffffff;
const wegBreite = .1;
const wegAbstand = .1;
const wegStartWinkel = -.15
const wegEndWinkel = wegStartWinkel - 2 * Math.PI
let wegAngezeigt = false
let weg
let wegKreis

export const daten: {
	strecke: number | null,
	beteiligte: number | null
} = {strecke: null, beteiligte: null}

const fortschrittFarbe = 0xC2DC62
const fortschrittBreite = wegBreite * 2
const fortschrittAbstand = wegAbstand + wegBreite;
const fortschrittStartWinkel = wegStartWinkel
let fortschritt
let fortschrittKreis
const hoehe = 16;
const anfangLaenge = .05;
const anfangAbstand = fortschrittAbstand
const anfangBreite = fortschrittBreite;
const anfangFarbe = 0x111111;

let folgenGruppe
let bewegenGruppe
let offsetGruppe

const zeichneKreis = (kreis: Mesh<MeshLine, MeshLineMaterial>, positions: number[]) => {
	kreis.geometry.setPoints(positions)
	kreis.geometry.attributes["position"].needsUpdate = true
}

const positions = (
	abstand: number,
	start: number = 0,
	ende: number = 2 * Math.PI,
	anzahlSegmente: number = segments,
	map: (x: number, y: number) => [number, number, number] = (x, y) => [x, 0, y],
) => new Path()
	.absarc(0, 0, radius + abstand, start, ende, true)
	.getPoints(anzahlSegmente)
	.flatMap(({x, y}) => map(x, y))

const kreis = (
	farbe: number,
	breite: number,
	positions: number[] = [],
	anzeigen: boolean = true
): Mesh<MeshLine, MeshLineMaterial> => {
	const line = new MeshLine()
	line.setPoints(positions)

	const material = new MeshLineMaterial({
		resolution: undefined,
		color: farbe,
		lineWidth: breite
		/*side: BackSide,
		blending: AdditiveBlending*/
	});

	const mesh = new Mesh(line, material)
	offsetGruppe.add(mesh)
	return mesh
}

export function aktualisieren() {
	if (daten.beteiligte === null || daten.strecke === null || !wegAngezeigt) return

	const fortschrittEndWinkel = fortschrittStartWinkel - (daten.strecke / umfang * 360) / 360 * (2 * Math.PI)

	fortschritt = positions(fortschrittAbstand, fortschrittStartWinkel, fortschrittEndWinkel);
	fortschrittKreis = kreis(fortschrittFarbe, fortschrittBreite)

	zeichneKreis(fortschrittKreis, [])
	let i = 0;
	const fortschrittTimeout = 16
	const fortschrittSchritt = 3
	const fortschrittInterval = setInterval(() => {
		zeichneKreis(fortschrittKreis, fortschritt.slice(0, i))

		if (i === fortschritt.length) clearInterval(fortschrittInterval)
		i += fortschrittSchritt
	}, fortschrittTimeout)

	let zeit = fortschritt.length / fortschrittSchritt * fortschrittTimeout / 1000 * 1.5;
	gsap.to(offsetGruppe.rotation, {
		y: fortschrittEndWinkel - Math.PI / 2,
		duration: zeit,
		ease: "power2.inOut"
	})
	document.getElementById("fakten").querySelectorAll("data")
		.forEach((data: HTMLDataElementFakt) => zeigeFaktAn(data, Math.max(zeit * 1000, 600)))
}

export default function welt() {
	const scene = new Scene()
	const camera = new PerspectiveCamera()
	camera.position.z = hoehe
	camera.aspect = 1
	const renderer = new WebGLRenderer({antialias: true, alpha: true})
	// renderer.setClearColor(0x000000, 0)
	renderer.setPixelRatio(devicePixelRatio)

	folgenGruppe = new Group()
	bewegenGruppe = new Group()
	offsetGruppe = new Group()
	offsetGruppe.rotation.y = anfang + anfangOffset
	folgenGruppe.add(bewegenGruppe)
	bewegenGruppe.add(offsetGruppe)
	scene.add(folgenGruppe)

	// region Welt
	// let welt
	const texture = new Promise<Texture>(resolve => new TextureLoader().load(new URL(
		"../../img/Erde/Erde vereinfacht.jpg?as=webp&height=675&quality=20",
		import.meta.url
	).toString(), texture => {
		const welt = new Mesh(
			new SphereGeometry(radius, segments, segments),
			new ShaderMaterial({
				vertexShader: weltVertex,
				fragmentShader: weltFragment,
				uniforms: {
					globeTexture: {
						value: texture
					}
				}
			})
		)
		offsetGruppe.add(welt)
		resolve(texture)

		// region Bessere Textur nachladen
		// Experimental / non-standard
		// noinspection TypeScriptUnresolvedVariable
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		// noinspection TypeScriptUnresolvedVariable
		const type = connection?.type;
		const url = (type === "cellular" ? new URL(
			"../../img/Erde/Erde.jpg?as=webp&height=1350&quality=50",
			import.meta.url
		) : new URL(
			"../../img/Erde/Erde.jpg?as=webp&height=1510&quality=40",
			import.meta.url
		)).toString()
		new TextureLoader().load(url, texture => {
			welt.material = new ShaderMaterial({
				vertexShader: weltVertex,
				fragmentShader: weltFragment,
				uniforms: {
					globeTexture: {
						value: texture
					}
				}
			})
		})
		// endregion
	}))
	// endregion

	// region Atmosphäre
	const atmosphaere = new Mesh(
		new SphereGeometry(radius, segments, segments),
		new ShaderMaterial({
			vertexShader: atmosphaereVertex,
			fragmentShader: atmosphaereFragment,
			side: BackSide,
			blending: AdditiveBlending
		})
	)
	atmosphaere.scale.set(atmosphaereScale, atmosphaereScale, atmosphaereScale)
	scene.add(atmosphaere)
	// endregion

	// region Weg & Fortschritt

	// Weg
	weg = positions(wegAbstand, wegStartWinkel, wegEndWinkel);
	// const wegPositions = [...weg.slice(0, 3), ...weg.slice(0, 3).map(position => position + 0.00001), ...weg.slice(3, weg.length)]
	wegKreis = kreis(wegFarbe, wegBreite, [], false)

	// Anfang
	// const anfangKreis = kreis(anfangFarbe, anfangBreite, positions(anfangAbstand, anfangLaenge, -anfangLaenge, segments, (x, y) => [0, y, x]))
	// kreise.push(anfangKreis)
	// endregion

	return async function () {
		await texture

		const wrapper = document.querySelector("header")
		const section = document.getElementById("willkommen")
		const container = document.getElementById("welt")
		const anzeige = document.getElementById("anzeige")

		// Resizing
		const setSize = () => {
			const width = anzeige.clientWidth,
				height = anzeige.clientHeight
			const size = Math.min(width, height)

			camera.updateProjectionMatrix()
			// renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
			// const min =
			renderer.setSize(size, size);
			document.documentElement.style.setProperty("--erde-größe", size + "px")
			container.classList.add("geladen");
			[wegKreis, fortschrittKreis].forEach(kreis => {
				if (kreis) kreis.material.resolution = new Vector2(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
			})

			/*camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight
			camera.updateProjectionMatrix()
			console.log("resizing: ", renderer.domElement.clientWidth, renderer.domElement.clientHeight)
			// renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
			// const min =
			// renderer.setSize(min, min);
			kreise.forEach(kreis => kreis.material.resolution = new Vector2(renderer.domElement.clientWidth, renderer.domElement.clientHeight))*/
		}

		// container.insertBefore(renderer.domElement, container.firstChild)
		anzeige.append(renderer.domElement)

		setSize()
		const resizeObserver = new ResizeObserver(setSize)
		resizeObserver.observe(anzeige, {box: "border-box"})

		// Folge cursor
		const cursorPosition = {x: 0, y: 0}
		let mussFolgen = false
		addEventListener('mousemove', event => {
			mussFolgen = true
			// 1 bzw. -1 an den Ecken von container
			// cursorPosition.x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1.5
			// cursorPosition.y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1
			cursorPosition.x = (event.clientX / innerWidth - .5) * 4
			cursorPosition.y = -(event.clientY / innerHeight - .5) * 2

			gsap.to(section, {
				'--x': cursorPosition.x,
				'--y': cursorPosition.y,
				duration: 2
			})
			// document.documentElement.style.setProperty("--cursor-x", cursorPosition.x.toString())
			// document.documentElement.style.setProperty("--cursor-y", cursorPosition.y.toString())
		})

		// Bewegen
		{
			let tween: Tween | undefined
			const options = {passive: true}
			const last: { x: number | undefined, y: number | undefined } = {x: undefined, y: undefined}
			let scrolling: boolean | undefined = undefined
			const listener = {
				down: () => {
					addEventListener("mousemove", listener.mouseMove, options);
					addEventListener("touchmove", listener.touchMove, {passive: false});
					document.body.classList.add("moving");
				},
				touchDown: (event: TouchEvent) => {
					last.x = event.touches[0].pageX
					last.y = event.touches[0].pageY
					listener.down()
				},
				move: (movementX: number, movementY: number, faktor: number) => {
					bewegenGruppe.rotation.y += movementX * faktor / (400)
					bewegenGruppe.rotation.x += movementY * faktor / (400 * 5)
					if (tween) tween.kill()
				},
				mouseMove: (event: MouseEvent) => listener.move(event.movementX, event.movementY, mouseFaktor),
				touchMove: (event: TouchEvent) => {
					const newX = event.touches[0].pageX;
					const newY = event.touches[0].pageY;
					const movementX = newX - last.x;
					const movementY = newY - last.y;
					if (scrolling === undefined && Math.abs(movementY) > Math.abs(movementX)) {
						scrolling = true
						removeEventListener("touchmove", listener.touchMove)
						return
					} else {
						scrolling = false
						event.preventDefault()
						listener.move(movementX, movementY, touchFaktor)
						last.x = newX
						last.y = newY
					}
				},
				up: () => {
					removeEventListener("mousemove", listener.mouseMove);
					removeEventListener("touchmove", listener.touchMove)
					scrolling = undefined
					document.body.classList.remove("moving");
					tween = gsap.to(bewegenGruppe.rotation, {
						x: 0,
						duration: 1.2,
					})
				}
			}
			wrapper.addEventListener("mousedown", listener.down)
			wrapper.addEventListener("touchstart", listener.touchDown)
			addEventListener("mouseup", listener.up)
			addEventListener("touchend", listener.up)
			addEventListener("touchcancel", listener.up)
		}

		// Animieren
		function animate() {
			requestAnimationFrame(animate)
			renderer.render(scene, camera)
			if (mussFolgen) gsap.to(folgenGruppe.rotation, {
				y: cursorPosition.x / 12,
				x: -cursorPosition.y / 12,
				duration: 2
			})
		}

		animate()
		gsap.to(offsetGruppe.rotation, {
			y: anfang,
			duration: 2
		})

		setTimeout(() => {
			zeichneKreis(wegKreis, weg.slice(0, 6))

			let i = 6; // zwei Punkte müssen mindestens gegeben sein
			const wegInterval = setInterval(() => {
				zeichneKreis(wegKreis, weg.slice(0, i))

				if (i === weg.length) {
					clearInterval(wegInterval)
					wegAngezeigt = true
					aktualisieren()
				}
				i += 3
			}, 10)
		}, 1500)
	}
}
