import {
	AdditiveBlending, BackSide, BufferAttribute, Group,
	Mesh, Path,
	PerspectiveCamera,
	Scene,
	ShaderMaterial,
	SphereGeometry,
	TextureLoader, Vector2,
	WebGLRenderer
} from "three";
import weltVertex from "../../shaders/welt/vertex.glsl";
import weltFragment from "../../shaders/welt/fragment.glsl";
import atmosphaereVertex from "../../shaders/atmosphaere/vertex.glsl";
import atmosphaereFragment from "../../shaders/atmosphaere/fragment.glsl";
import texture from "../../img/earth.png"
import {Line2, LineGeometry, LineMaterial} from "three-fatline";

export default async () => {
	const radius = 5
	const segments = 50
	const atmosphaereScale = .95
	const anfang = -Math.PI / 2 - .2
	const wegFarbe = 0xffffff;
	const wegBreite = 8;
	const wegAbstand = 1;
	const wegStartWinkel = Math.PI / 2
	const wegEndWinkel = wegStartWinkel - 2 * Math.PI
	const fortschritt = .1
	const fortschrittFarbe = 0x71c31e
	const fortschrittBreite = wegBreite * 1.5
	const fortschrittAbstand = wegAbstand + .15;
	const fortschrittStartWinkel = wegStartWinkel
	const fortschrittEndWinkel = fortschrittStartWinkel - fortschritt * (2 * Math.PI)
	const hoehe = 18;
	const anfangLaenge = .05;
	const anfangAbstand = fortschrittAbstand
	const anfangBreite = fortschrittBreite;
	const anfangFarbe = 0x111111;

	const container = document.getElementById("welt")
	const scene = new Scene()
	const camera = new PerspectiveCamera()
	const renderer = new WebGLRenderer({antialias: true})
	renderer.setPixelRatio(devicePixelRatio)

	// Welt
	const welt = new Mesh(
		new SphereGeometry(radius, segments, segments),
		new ShaderMaterial({
			vertexShader: weltVertex,
			fragmentShader: weltFragment,
			uniforms: {
				globeTexture: {
					value: new TextureLoader().load(texture)
				}
			}
		})
	)
	const folgenGruppe = new Group()
	const bewegenGruppe = new Group()
	const offsetGruppe = new Group()
	folgenGruppe.add(bewegenGruppe)
	bewegenGruppe.add(offsetGruppe)
	offsetGruppe.add(welt)
	scene.add(folgenGruppe)

	// Atmosphäre
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

	camera.position.z = hoehe

	// Weg & Fortschritt
	const kreise = []

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
	): Line2 => {
		const material = new LineMaterial({
			color: farbe,
			linewidth: breite
			/*side: BackSide,
			blending: AdditiveBlending*/
		});

		const geometry = new LineGeometry()
		const kreis = new Line2(geometry, material);

		const typedArray = new Float32Array(positions.length);
		geometry.setPositions(typedArray)
		// geometry.setAttribute("position", new BufferAttribute(typedArray, 3))

		// zeichneKreis(kreis, positions)
		// if (!anzeigen) geometry.setPositions(positions.slice(0, 6))
		bewegenGruppe.add(kreis);

		return kreis
	}
	const zeichneKreis = (kreis: Line2, positions: number[]) => {
		kreis.geometry.setPositions(positions)
		kreis.geometry.attributes["position"].needsUpdate = true

	}

	// Weg
	const weg = positions(wegAbstand, wegStartWinkel, wegEndWinkel);
	const wegPositions = [...weg.slice(0, 3), ...weg.slice(0, 3).map(position => position + 0.00001), ...weg.slice(3, weg.length)]
	const wegKreis = kreis(wegFarbe, wegBreite, wegPositions, false)

	// zeichneKreis(wegKreis, wegPositions.slice(0, 6))
	const pos = wegKreis.geometry.getAttribute("position")
	const pa = pos.array

	let i = 6; // zwei Punkte müssen mindestens gegeben sein
	const wegInterval = setInterval(() => {
		// zeichneKreis(wegKreis, wegPositions.slice(0, i))
		pa[6 * i] = wegPositions[6 * i];
		pa[6 * i + 1] = wegPositions[6 * i + 1];
		pa[6 * i + 2] = wegPositions[6 * i + 2];
		pa[6 * i + 4] = wegPositions[6 * i + 4];
		pa[6 * i + 5] = wegPositions[6 * i + 5];
		pa[6 * i + 6] = wegPositions[6 * i + 6];

		if (i === wegPositions.length) clearInterval(wegInterval)
		i += 3
	}, 20)
	kreise.push(wegKreis)
	wegKreis.computeLineDistances()
	pos.needsUpdate = true
	// wegKreis.geometry.getAttribute("positions").needsUpdate = true

	// Fortschritt
	/*const fortschrittPositions = positions(fortschrittAbstand, fortschrittStartWinkel, fortschrittEndWinkel);
	const fortschrittKreis = kreis(fortschrittFarbe, fortschrittBreite)
	kreise.push(fortschrittKreis)
	setSize()*/

	// Anfang
	const anfangKreis = kreis(anfangFarbe, anfangBreite, positions(anfangAbstand, anfangLaenge, -anfangLaenge, segments, (x, y) => [0, y, x]))
	kreise.push(anfangKreis)

	// Resizing
	const setSize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight);
		kreise.forEach(kreis => kreis.material.resolution = new Vector2(container.clientWidth, container.clientHeight))
	}
	setSize()
	const resizeObserver = new ResizeObserver(setSize)
	resizeObserver.observe(container, {box: "border-box"})

	// Folge cursor
	const cursorPosition = {x: 0, y: 0}
	addEventListener('mousemove', event => {
		// 1 bzw. -1 an den Ecken von container
		cursorPosition.x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1.5
		cursorPosition.y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1
		folgenGruppe.rotation.y = cursorPosition.x / 10
		folgenGruppe.rotation.x = -cursorPosition.y / 10
	})

	// Bewegen
	{
		const options = {passive: true}
		const listener = {
			down: () => addEventListener("mousemove", listener.move, options),
			move: (event: MouseEvent) => bewegenGruppe.rotation.y += event.movementX / 300,
			up: () => removeEventListener("mousemove", listener.move)
		}
		container.addEventListener("mousedown", listener.down)
		addEventListener("mouseup", listener.up)
	}

	// Animieren
	function animate() {
		requestAnimationFrame(animate)
		renderer.render(scene, camera)
	}

	offsetGruppe.rotation.y = anfang

	animate()

	container.append(renderer.domElement)
}

export const aktualisieren = (wert: number) => {

}
