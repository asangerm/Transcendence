import { checkPasswordStrength, PasswordStrength } from '../scripts/password-check';

interface FormValidation {
	username?: boolean;
	email?: boolean;
	password?: boolean;
	confirmPassword?: boolean;
	terms?: boolean;
}

export class RegisterFormHandler {
	private usernameInput: HTMLInputElement;
    private emailInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;
	private pwdType: PasswordStrength;
	private passwAdvertissment: HTMLParagraphElement;
	private pwdVerifContainer: HTMLDivElement;
    private confirmPasswordInput: HTMLInputElement;
	private confirmPasswVerif: HTMLParagraphElement;
    private termsCheckbox: HTMLInputElement;
	private strengthBar: HTMLDivElement;
	private formValidation: FormValidation;

    constructor() {
		this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.emailInput = document.getElementById('email') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;
		this.pwdType = PasswordStrength.Weak;
        this.confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
		this.confirmPasswVerif = document.getElementById('confirmPasswordVerif') as HTMLParagraphElement;
        this.termsCheckbox = document.getElementById('terms') as HTMLInputElement;
		this.strengthBar = document.getElementById('passwordStrengthBar') as HTMLDivElement;
		this.passwAdvertissment = document.getElementById('passwordVerif') as HTMLParagraphElement;
		this.pwdVerifContainer = document.getElementById('pwdVerifContainer') as HTMLDivElement;
		this.formValidation = {
			username: false,
			email: false,
			password: false,
			confirmPassword: false,
			terms: false,
		};
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
		if (this.usernameInput) {
			this.usernameInput.addEventListener('blur', () => {
				// Verifier si le nom d'utilisateur est deja pris
			});
		}

		if (this.emailInput) {
			this.emailInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				let emailVerif = document.getElementById('emailVerif') as HTMLParagraphElement;
				this.emailInput.classList.remove('error-input');
				emailVerif.classList.add('invisible');
				if (this.emailInput.value) {
					// Expression régulière simple pour vérifier le format email
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(this.emailInput.value)) {
						emailVerif.classList.remove('invisible');
						this.emailInput.classList.add('error-input');
					}
					else {
						emailVerif.classList.add('invisible');
						this.emailInput.classList.remove('error-input');
					}
				}
			});
		}

		if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => {
				this.passwordInput.classList.remove('error-input');
                this.pwdType = checkPasswordStrength(this.passwordInput.value);
                this.passwAdvertissment.classList.remove('error-text', 'warning-text', 'success-text');

                this.strengthBar?.classList.remove('error-bg', 'warning-bg', 'success-bg', 'invisible');
				this.pwdVerifContainer.classList.remove('invisible');

				this.updatePasswordStrengthIndicator(this.pwdType);

                if (this.passwordInput.value === '') {
                    this.strengthBar?.style.setProperty('width', '0%');
                    this.pwdVerifContainer.classList.add('invisible');
                }
            });
			this.passwordInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				if (this.formValidation.password) {
					this.pwdVerifContainer.classList.add('invisible');
				}
				if (this.passwordInput.value !== this.confirmPasswordInput.value) {
					this.confirmPasswVerif.classList.remove('invisible', 'error-text', 'success-text');
					this.confirmPasswVerif.classList.add('error-text');
					this.confirmPasswVerif.innerHTML = "❌ Les mots de passe ne correspondent pas";
				}
			});
        }

		if (this.confirmPasswordInput) {
			this.confirmPasswordInput.addEventListener('input', () => {
				this.confirmPasswordInput.classList.remove('error-input');
				this.confirmPasswVerif.classList.remove('invisible', 'error-text', 'success-text');
				if (this.confirmPasswordInput.value !== this.passwordInput.value) {
					this.confirmPasswVerif.classList.add('error-text');
					this.confirmPasswVerif.innerHTML = "❌ Les mots de passe ne correspondent pas";
				}
				else if (this.confirmPasswordInput.value !== '' && this.confirmPasswordInput.value === this.passwordInput.value) {
					this.confirmPasswVerif.classList.add('success-text');
					this.confirmPasswVerif.innerHTML = "✅ Les mots de passe correspondent";
				}
				else {
					this.confirmPasswVerif.classList.add('invisible');
				}
			});
			this.confirmPasswordInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				if (this.formValidation.confirmPassword) {
					this.confirmPasswVerif.classList.add('invisible');
				}
			});
		}
    }

    private updatePasswordStrengthIndicator(strength: PasswordStrength): void {
		if (strength === PasswordStrength.Short) {
			this.passwAdvertissment.classList.add('error-text');
			this.passwAdvertissment.innerHTML = "🚫 Trop court (minimum 8 caractères)";
			this.strengthBar?.classList.add('error-bg');
			this.strengthBar?.style.setProperty('width', '25%');
		}
		else if (strength === PasswordStrength.Weak) {
			this.passwAdvertissment.classList.add('warning-text');
			this.passwAdvertissment.innerHTML = "⚠️ Trop faible (1 majuscule, 1 chiffre, 1 caractère spécial)";
			this.strengthBar?.classList.add('warning-bg');
			this.strengthBar?.style.setProperty('width', '50%');
		}
		else if (strength === PasswordStrength.Common) {
			this.passwAdvertissment.classList.add('warning-text');
			this.passwAdvertissment.innerHTML = "⚠️ Trop commun";
			this.strengthBar?.classList.add('warning-bg');
			this.strengthBar?.style.setProperty('width', '50%');
		}
		else if (strength === PasswordStrength.Ok) {
			this.passwAdvertissment.classList.add('success-text');
			this.passwAdvertissment.innerHTML = "✅ Mot de passe acceptable";
			this.strengthBar?.classList.add('success-bg');
			this.strengthBar?.style.setProperty('width', '75%');
		}
		else if (strength === PasswordStrength.Strong) {
			this.passwAdvertissment.classList.add('success-text');
			this.passwAdvertissment.innerHTML = "🔒 Mot de passe très solide";
			this.strengthBar?.classList.add('success-bg');
			this.strengthBar?.style.setProperty('width', '100%');
		}
	}

	private displayFormErrors() : void {
		if (!this.formValidation.username) {
			this.usernameInput.classList.add('error-input', 'shake-animation');
			setTimeout(() => this.usernameInput.classList.remove('shake-animation'), 1000);
		}
		else if (!this.formValidation.email) {
			this.emailInput.classList.add('error-input', 'shake-animation');
			setTimeout(() => this.emailInput.classList.remove('shake-animation'), 1000);
		}
		else if (!this.formValidation.password) {
			this.passwordInput.classList.add('error-input', 'shake-animation');
			setTimeout(() => this.passwordInput.classList.remove('shake-animation'), 1000);
		}
		else if (!this.formValidation.confirmPassword) {
			this.confirmPasswordInput.classList.add('error-input', 'shake-animation');
			setTimeout(() => this.confirmPasswordInput.classList.remove('shake-animation'), 1000);
		}
		else if (!this.formValidation.terms) {
			const termsContainer = this.termsCheckbox.parentElement?.parentElement;
			termsContainer?.classList.add('shake-animation');
			this.termsCheckbox.classList.add('ring-2', 'ring-red-500');
			setTimeout(() => {
				termsContainer?.classList.remove('shake-animation');
			}, 1000);
		}
	}

	private verifyFormInputs() : void {
		// Username Input :
		if (!this.usernameInput.value.trim()) {
			this.formValidation.username = false;			
		}
		else {
			this.formValidation.username = true;	
		}

		// Email Input :
		if (!this.emailInput.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailInput.value)) {
			this.formValidation.email = false;	
		}
		else {
			this.formValidation.email = true;	
		}

		// Password Input :
		if (!this.passwordInput.value.trim() || (this.pwdType != PasswordStrength.Ok && this.pwdType != PasswordStrength.Strong)) {
			this.formValidation.password = false;
		}
		else {
			this.formValidation.password = true;
		}

		// ConfirmPassword Input :
		if (!this.confirmPasswordInput.value.trim() || this.confirmPasswordInput.value != this.passwordInput.value) {
			this.formValidation.confirmPassword = false;
		}
		else {
			this.formValidation.confirmPassword = true;
		}

		// CheckBox Terms Input :
		if (!this.termsCheckbox.checked) {
			this.formValidation.terms = false;
		}
		else {
			this.formValidation.terms = true;
		}
	}

    public validateForm(): void {
		// Réinitialiser les états d'erreur
		this.termsCheckbox.classList.remove('ring-2', 'ring-red-500');
		[this.usernameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
			input.classList.remove('error-input', 'shake-animation');
		});

		this.verifyFormInputs();

		if (this.formValidation.username && this.formValidation.email 
			&& this.formValidation.password && this.formValidation.confirmPassword 
			&& this.formValidation.terms) {
			// Envoyer la requete au backend
		}
		else {
			this.displayFormErrors();
		}
    }
}