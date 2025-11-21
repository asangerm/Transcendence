export class LoginFormHandler {
    private usernameInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;
    private checkedBox: HTMLInputElement;
    private isUserOK : boolean;
    private isPwdOK : boolean;

    constructor() {
        this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;
        this.checkedBox = document.getElementById('remember') as HTMLInputElement;
        this.isUserOK = false;
        this.isPwdOK = false;

        this.setupEventListeners();
    }

    private verifyFormInputs() : void {
        if (!this.usernameInput.value.trim()) {
            this.isUserOK = false;
        }
        else {
            this.isUserOK = true;
        }

        if (!this.passwordInput.value.trim()){
            this.isPwdOK = false;
        }
        else {
            this.isPwdOK = true;
        }
    }

    private setupEventListeners() : void {
        this.usernameInput.addEventListener('blur', () => {
            if (this.usernameInput.value.trim()) {
                this.usernameInput.classList.remove('error-input', 'shake-animation');
            }
        });
        this.passwordInput.addEventListener('blur', () => {
            if (this.passwordInput.value.trim()) {
                this.passwordInput.classList.remove('error-input', 'shake-animation');
            }
        });
    }

    private displayFormErrors() : void {
        if (!this.isUserOK) {
			this.usernameInput.classList.add('error-input', 'shake-animation');
			setTimeout(() => this.usernameInput.classList.remove('shake-animation'), 1000);
        }

        else if (!this.isPwdOK) {
			this.passwordInput.classList.add('error-input', 'shake-animation');
			setTimeout(() => this.passwordInput.classList.remove('shake-animation'), 1000);
        }
    }

    public validateForm() : void{
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.classList.remove('error-input', 'shake-animation');
        });

        this.verifyFormInputs();

        if (this.isUserOK && this.isPwdOK) {
            // Envoyer la requete au backend
        }
        else {
            this.displayFormErrors();
        }
    }
}