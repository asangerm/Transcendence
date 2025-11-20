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
			this.usernameInput.addEventListener('input', () => {
				let userVerif = document.getElementById('userVerif') as HTMLDivElement;
				this.usernameInput.classList.remove('error-input');
				userVerif.classList.remove('scale-100');
				userVerif.classList.add('invisible', 'scale-0');
				if (this.usernameInput.value && this.usernameInput.value.includes(" ")) {
					userVerif.classList.add('scale-100');
					userVerif.classList.remove('invisible', 'scale-0');
					this.usernameInput.classList.add('error-input');
				}
			});
			this.usernameInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				if (this.formValidation.username) {
					let userVerif = document.getElementById('userVerif') as HTMLDivElement;
					userVerif.classList.remove('scale-100');
					userVerif.classList.add('invisible', 'scale-0');
				}
			});
		}

		if (this.emailInput) {
			this.emailInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				let emailVerif = document.getElementById('emailVerif') as HTMLDivElement;
				this.emailInput.classList.remove('error-input');
				emailVerif.classList.remove('scale-100');
				emailVerif.classList.add('invisible', 'scale-0');
				if (this.emailInput.value) {
					// Expression régulière simple pour vérifier le format email
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(this.emailInput.value)) {
						emailVerif.classList.add('scale-100');
						emailVerif.classList.remove('invisible', 'scale-0');
						this.emailInput.classList.add('error-input');
					}
					else {
						emailVerif.classList.remove('scale-100');
						emailVerif.classList.add('invisible', 'scale-0');
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
				this.pwdVerifContainer.classList.remove('invisible', 'scale-0');
				this.pwdVerifContainer.classList.add('scale-100');

				this.updatePasswordStrengthIndicator(this.pwdType);

                if (this.passwordInput.value === '') {
                    this.strengthBar?.style.setProperty('width', '0%');
					this.pwdVerifContainer.classList.remove('scale-100');
                    this.pwdVerifContainer.classList.add('invisible', 'scale-0');
                }
				if (this.passwordInput.value !== this.confirmPasswordInput.value) {
					this.confirmPasswVerif.classList.remove('invisible', 'error-text', 'success-text', 'scale-0');
					this.confirmPasswVerif.classList.add('scale-100');
					this.confirmPasswVerif.innerHTML = "Mot de passe différent !";
				} else {
					this.confirmPasswVerif.classList.add('invisible', 'scale-0');
					this.confirmPasswVerif.classList.remove('scale-100');
				}
            });
			this.passwordInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				if (this.formValidation.password) {
					this.pwdVerifContainer.classList.remove('scale-100');
					this.pwdVerifContainer.classList.add('invisible', 'scale-0');
				}
			});
        }

		if (this.confirmPasswordInput) {
			this.confirmPasswordInput.addEventListener('input', () => {
				this.confirmPasswordInput.classList.remove('error-input', 'scale-0');
				this.confirmPasswVerif.classList.remove('invisible', 'error-text', 'success-text');
				if (this.confirmPasswordInput.value !== this.passwordInput.value) {
					this.confirmPasswVerif.classList.remove('scale-0');
					this.confirmPasswVerif.classList.add('scale-100');
				}
				else if (this.confirmPasswordInput.value !== '' && this.confirmPasswordInput.value === this.passwordInput.value) {
					this.confirmPasswVerif.classList.remove('scale-100');
					this.confirmPasswVerif.classList.add('invisible', 'scale-0');
				}
				else {
					this.confirmPasswVerif.classList.remove('scale-100');
					this.confirmPasswVerif.classList.add('invisible', 'scale-0');
				}
			});
			this.confirmPasswordInput.addEventListener('blur', () => {
				this.verifyFormInputs();
				if (this.formValidation.confirmPassword) {
					this.confirmPasswVerif.classList.remove('scale-100');
					this.confirmPasswVerif.classList.add('invisible', 'scale-0');
				}
			});
		}
    }

    private updatePasswordStrengthIndicator(strength: PasswordStrength): void {
		if (strength === PasswordStrength.Short) {
			this.passwAdvertissment.classList.remove('error-border', 'warning-border', 'success-border');
			this.passwAdvertissment.classList.add('error-border');
			this.passwAdvertissment.innerHTML = "Trop court (8 min.)";
			this.strengthBar?.classList.add('red-500');
			this.strengthBar?.style.setProperty('width', '25%');
		}
		else if (strength === PasswordStrength.Weak) {
			this.passwAdvertissment.classList.remove('error-border', 'warning-border', 'success-border');
			this.passwAdvertissment.classList.add('error-border');
			this.passwAdvertissment.innerHTML = "(1Min, 1Maj, 1Chiffre)";
			this.strengthBar?.classList.add('red-500');
			this.strengthBar?.style.setProperty('width', '50%');
		}
		else if (strength === PasswordStrength.Common) {
			this.passwAdvertissment.classList.remove('error-border', 'warning-border', 'success-border');
			this.passwAdvertissment.classList.add('warning-border');
			this.passwAdvertissment.innerHTML = "Trop commun";
			this.strengthBar?.classList.add('warning-bg');
			this.strengthBar?.style.setProperty('width', '50%');
		}
		else if (strength === PasswordStrength.Ok) {
			this.passwAdvertissment.classList.remove('error-border', 'warning-border', 'success-border');
			this.passwAdvertissment.classList.add('success-border');
			this.passwAdvertissment.innerHTML = "MDP Sécurisé";
			this.strengthBar?.classList.add('success-bg');
			this.strengthBar?.style.setProperty('width', '75%');
		}
		else if (strength === PasswordStrength.Strong) {
			this.passwAdvertissment.classList.remove('error-border', 'warning-border', 'success-border');
			this.passwAdvertissment.classList.add('success-border');
			this.passwAdvertissment.innerHTML = "MDP Solide";
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
		if (!this.usernameInput.value.trim() || this.usernameInput.value.includes(" ")) {
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

    public validateForm(): boolean {
		// Réinitialiser les états d'erreur
		this.termsCheckbox.classList.remove('ring-2', 'ring-red-500');
		[this.usernameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
			input.classList.remove('error-input', 'shake-animation');
		});

		this.verifyFormInputs();

		if (this.formValidation.username && this.formValidation.email 
			&& this.formValidation.password && this.formValidation.confirmPassword 
			&& this.formValidation.terms) {
			return true;
		}
		else {
			this.displayFormErrors();
			return false;
		}
    }

    // Afficher un message de succès
    private showSuccessMessage(message: string): void {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Afficher un message d'erreur
    private showErrorMessage(message: string): void {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}