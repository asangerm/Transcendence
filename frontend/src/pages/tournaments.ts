import { Tournaments } from '../components/Tournaments';

export function renderTournaments() {
	const app = document.getElementById('app');
	if (app) {
		app.innerHTML = '';
		
		const tourn = new Tournaments(app);
		tourn.init();
	}
}