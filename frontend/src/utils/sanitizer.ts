import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Supprimer < et >
    .trim()
    .substring(0, 1000); // Limiter la longueur
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}