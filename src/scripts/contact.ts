const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const MIN_FILL_TIME_MS = 2500;

type FieldKey = 'name' | 'email' | 'message';

type FieldInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const initContactForm = (root: Element) => {
  const form = root as HTMLFormElement;
  if (form.dataset.contactInit === 'true') return;

  const status = form.querySelector<HTMLElement>('[data-contact-status]');
  const submitButton = form.querySelector<HTMLButtonElement>('[data-contact-submit]');
  const startedAtField = form.querySelector<HTMLInputElement>('[data-form-started-at]');
  const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');
  if (!status || !submitButton || !startedAtField) return;

  form.dataset.contactInit = 'true';
  startedAtField.value = String(Date.now());

  const fields = {
    name: form.querySelector<HTMLInputElement>('input[name="name"]'),
    email: form.querySelector<HTMLInputElement>('input[name="email"]'),
    message: form.querySelector<HTMLTextAreaElement>('textarea[name="message"]'),
    company: form.querySelector<HTMLInputElement>('input[name="company"]'),
    budget: form.querySelector<HTMLSelectElement>('select[name="budget"]'),
  };

  const errorEls: Partial<Record<FieldKey, HTMLElement>> = {
    name: form.querySelector<HTMLElement>('[data-contact-error-for="name"]') ?? undefined,
    email: form.querySelector<HTMLElement>('[data-contact-error-for="email"]') ?? undefined,
    message: form.querySelector<HTMLElement>('[data-contact-error-for="message"]') ?? undefined,
  };

  const setFieldError = (key: FieldKey, field: FieldInput | null, message = '') => {
    if (!field) return;
    const hasError = message.length > 0;
    field.classList.toggle('is-invalid', hasError);
    field.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    const errorEl = errorEls[key];
    if (errorEl) errorEl.textContent = message;
  };

  const clearStatusToDefault = () => {
    status.textContent = 'Răspundem de obicei în aceeași zi lucrătoare.';
    status.classList.remove('text-rose-300', 'text-emerald-300', 'text-zinc-300');
    status.classList.add('text-zinc-400');
  };

  const validators: Record<FieldKey, (value: string) => string> = {
    name: (value) => (value.trim().length < 2 ? 'Introdu un nume valid (minim 2 caractere).' : ''),
    email: (value) => (!isValidEmail(value.trim()) ? 'Introdu o adresă de email validă.' : ''),
    message: (value) => (value.trim().length < 10 ? 'Mesajul trebuie să aibă cel puțin 10 caractere.' : ''),
  };

  (Object.keys(validators) as FieldKey[]).forEach((key) => {
    const field = fields[key];
    field?.addEventListener('input', () => {
      setFieldError(key, field, validators[key](field.value));
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if ((honeypot?.value || '').trim().length > 0) {
      status.textContent = 'Nu am putut procesa trimiterea.';
      status.classList.remove('text-zinc-400', 'text-emerald-300');
      status.classList.add('text-rose-300');
      return;
    }

    const filledTooFast = Date.now() - Number(startedAtField.value || '0') < MIN_FILL_TIME_MS;
    if (filledTooFast) {
      status.textContent = 'Te rugăm să verifici câmpurile și să încerci din nou.';
      status.classList.remove('text-zinc-400', 'text-emerald-300');
      status.classList.add('text-rose-300');
      return;
    }

    const name = fields.name?.value.trim() ?? '';
    const email = fields.email?.value.trim() ?? '';
    const message = fields.message?.value.trim() ?? '';
    const company = fields.company?.value.trim() ?? '';
    const budget = fields.budget?.value.trim() ?? '';

    const errors: Record<FieldKey, string> = {
      name: validators.name(name),
      email: validators.email(email),
      message: validators.message(message),
    };

    (Object.keys(errors) as FieldKey[]).forEach((key) => {
      setFieldError(key, fields[key], errors[key]);
    });

    const firstInvalidKey = (Object.keys(errors) as FieldKey[]).find((key) => errors[key]);
    if (firstInvalidKey) {
      fields[firstInvalidKey]?.focus();
      status.textContent = 'Completează corect câmpurile marcate pentru a trimite mesajul.';
      status.classList.remove('text-zinc-400', 'text-emerald-300');
      status.classList.add('text-rose-300');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Se trimite...';

    status.textContent = 'Trimitem mesajul către echipă...';
    status.classList.remove('text-zinc-400', 'text-rose-300', 'text-emerald-300');
    status.classList.add('text-zinc-300');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          company,
          budget,
          message,
          honeypot: honeypot?.value ?? '',
          startedAt: startedAtField.value,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || 'Trimiterea a eșuat.');
      }

      status.textContent = payload.message || 'Mesaj trimis cu succes. Revenim curând.';
      status.classList.remove('text-zinc-300', 'text-rose-300');
      status.classList.add('text-emerald-300');

      form.reset();
      startedAtField.value = String(Date.now());
      (Object.keys(validators) as FieldKey[]).forEach((key) => setFieldError(key, fields[key], ''));

      window.dispatchEvent(new CustomEvent('contact:submitted', { detail: { source: 'contact-form' } }));
      const trackedWindow = window as Window & { dataLayer?: unknown[] };
      if (Array.isArray(trackedWindow.dataLayer)) {
        trackedWindow.dataLayer.push({ event: 'contact_form_submit_success' });
      }

      window.setTimeout(() => {
        clearStatusToDefault();
      }, 6000);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Eroare la trimitere. Încearcă din nou.';
      status.textContent = messageText;
      status.classList.remove('text-zinc-300', 'text-zinc-400', 'text-emerald-300');
      status.classList.add('text-rose-300');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Trimite mesaj';
    }
  });
};

const setupContactForms = () => {
  document.querySelectorAll('[data-contact-form]').forEach((root) => initContactForm(root));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupContactForms, { once: true });
} else {
  setupContactForms();
}

document.addEventListener('astro:after-swap', setupContactForms);
