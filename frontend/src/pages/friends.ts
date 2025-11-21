import { FriendsListComponent } from '../components/FriendList';
import { AuthService } from '../services/auth.service';
import { navigateTo } from '../router';

export function renderFriends(username: string) {
	const app = document.getElementById('app');
	if (app) {
		app.innerHTML = '';
		
		const currentUser = AuthService.getUser();
		
		if (!currentUser) {
			navigateTo('/login');
			return;
		}
		const FriendsComponent = new FriendsListComponent(app);
		FriendsComponent.init(username);
	}
}