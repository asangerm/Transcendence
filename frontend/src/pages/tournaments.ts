import { Tournaments } from '../components/Tournaments';
// import le authstore pour l'id du mec connecte
// import le tournament service 

export function renderTournaments() {
	const app = document.getElementById('app');
	if (app) {
		app.innerHTML = '';

		const tourn = new Tournaments(app);
		tourn.init();
	}
}