export default () => {
	document.getElementById("admin-anmelden").onclick = () => import("../admin/admin").then(admin => admin.oeffnen())
}
