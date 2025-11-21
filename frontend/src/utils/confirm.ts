export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

function showPopup(options: ConfirmOptions, isConfirm: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const container = document.createElement('div');
        container.className =
            'fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center text-text dark:text-text-dark';

        const titleHtml = options.title
            ? `<h2 class="text-lg font-semibold">${options.title}</h2>`
            : '';

        const confirmLabel = options.confirmButtonText ?? 'Ok';
        const cancelLabel = options.cancelButtonText ?? 'Annuler';

        container.innerHTML = `
            <div class="confirm-container bg-background dark:bg-background-dark rounded-lg shadow-xl shadow-text/10 dark:shadow-text-dark/10 p-6 space-y-4">
                ${titleHtml}
                <pre class="text-sm font-sans">${options.message}</pre>
                <div class="flex items-center justify-end gap-3 mt-4">
                    ${
                        isConfirm
                            ? `<button data-confirm="false" class="text-sm px-2 py-0.5 rounded-md bg-muted/40 dark:bg-muted-dark/50 text-text dark:text-text-dark hover:bg-muted/20 dark:hover:bg-muted-dark/20 transition">
                                    ${cancelLabel}
                               </button>`
                            : ''
                    }
                    <button data-confirm="true" class=" text-sm px-2 py-0.5 rounded-md bg-red-500/100 text-white hover:bg-red-500/70 transition">
                        ${confirmLabel}
                    </button>
                </div>
            </div>
        `;

        const handleResult = (value: boolean) => {
            cleanup();
            resolve(value);
        };

        const onClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target === container) {
                // handleResult(isConfirm ? false : true);
                return;
            }

            const confirmBtn = target.closest('[data-confirm="true"]');
            const cancelBtn = target.closest('[data-confirm="false"]');

            if (confirmBtn) {
                handleResult(true);
            } else if (cancelBtn && isConfirm) {
                handleResult(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleResult(isConfirm ? false : true);
            } else if (event.key === 'Enter') {
                handleResult(true);
            }
        };

        const cleanup = () => {
            container.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKeyDown);
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };

        container.addEventListener('click', onClick);
        document.addEventListener('keydown', onKeyDown);

        document.body.appendChild(container);
    });
}

export function ft_alert(messageOrOptions: string | ConfirmOptions): Promise<void> {
    const options: ConfirmOptions =
        typeof messageOrOptions === 'string'
            ? { message: messageOrOptions }
            : messageOrOptions;

    return showPopup(options, false).then(() => undefined);
}

export function ft_confirm(messageOrOptions: string | ConfirmOptions): Promise<boolean> {
    const options: ConfirmOptions =
        typeof messageOrOptions === 'string'
            ? { message: messageOrOptions }
            : messageOrOptions;

    return showPopup(options, true);
}