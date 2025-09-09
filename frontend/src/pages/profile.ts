import { UserProfileComponent } from '../components/UserProfile';
import { AuthService } from '../services/auth.service';
import { navigateTo } from '../router';

export function renderProfile() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '';
        
        const currentUser = AuthService.getUser();
        
        if (!currentUser) {
            navigateTo('/login');
            return;
        }
        
        const profileComponent = new UserProfileComponent(app);
        profileComponent.init();
    }
}