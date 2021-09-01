import {
	AdditiveBlending, BackSide, Group,
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
	const fortschritt = .1
	const fortschrittFarbe = 0x71c31e
	const fortschrittBreite = wegBreite * 1.5
	const fortschrittAbstand = wegAbstand + .15;
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
	const kreis = (
		farbe: number,
		breite: number,
		abstand: number,
		start: number = 0,
		ende: number = 2 * Math.PI,
		map: (x: number, y: number) => [number, number, number] = (x, y) => [x, 0, y]
	): Line2 => {
		const material = new LineMaterial({
			color: farbe,
			linewidth: breite
			/*side: BackSide,
			blending: AdditiveBlending*/
		});

		const positions = new Path()
			.absarc(0, 0, radius + abstand, start, ende, true)
			.getPoints(segments)
			.flatMap(({x, y}) => map(x, y))
		const geometry = new LineGeometry()
		const line = new Line2(geometry, material);

		geometry.setPositions(positions)
		bewegenGruppe.add(line);
		line.computeLineDistances();

		return line
	}

	// Weg
	const wegKreis = kreis(wegFarbe, wegBreite, wegAbstand, 0, 2 * Math.PI)

	// Fortschritt
	const fortschrittStartWinkel = Math.PI / 2
	const fortschrittEndWinkel = fortschrittStartWinkel - fortschritt * (2 * Math.PI)
	const fortschrittKreis = kreis(fortschrittFarbe, fortschrittBreite, fortschrittAbstand, fortschrittStartWinkel, fortschrittEndWinkel)

	// Anfang
	const anfangKreis = kreis(anfangFarbe, anfangBreite, anfangAbstand, anfangLaenge, -anfangLaenge, (x, y) => [0, y, x])

	const kreise = [wegKreis, fortschrittKreis, anfangKreis]

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
