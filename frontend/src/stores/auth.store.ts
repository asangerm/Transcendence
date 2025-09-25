import { AuthService, User } from '../services/auth.service';

type Subscriber = (user: User | null) => void;

class AuthStoreClass {
  private user: User | null = null;
  private subscribers = new Set<Subscriber>();

  init() {
    // Hydrate depuis le localStorage au démarrage
    this.user = AuthService.getUser();

    // Sync multi-onglets
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        const next = AuthService.getUser();
        this.setUserInMemory(next, /*notify*/true);
      }
    });
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.user != null;
  }

  subscribe(fn: Subscriber) {
    this.subscribers.add(fn);
    // Retourne un unsubscribe
    return () => this.subscribers.delete(fn);
  }

  // A appeler quand on connaît le user (login/verify/me)
  setUser(user: User) {
    AuthService.setUser(user);
    this.setUserInMemory(user, true);
  }

  // A appeler à la déconnexion
  clear() {
    AuthService.logout();
    this.setUserInMemory(null, true);
  }

  private setUserInMemory(user: User | null, notify: boolean) {
    this.user = user;
    if (notify) {
      for (const fn of this.subscribers) fn(this.user);
    }
  }
}

export const AuthStore = new AuthStoreClass();