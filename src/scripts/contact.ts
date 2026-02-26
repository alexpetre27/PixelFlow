const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const MIN_FILL_TIME_MS = 2500;

type FieldKey = "name" | "email" | "message";
type FieldInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Helper pentru a accesa Turnstile fără erori de tip
const getTurnstile = () => (window as any).turnstile;

const initContactForm = (root: Element) => {
  const form = root as HTMLFormElement;
  if (form.dataset.contactInit === "true") return;

  const getLang = () => {
    const urlPath = window.location.pathname;
    return urlPath.includes("/en/") || urlPath.startsWith("/en") ? "en" : "ro";
  };

  const status = form.querySelector<HTMLElement>("[data-contact-status]");
  const submitButton = form.querySelector<HTMLButtonElement>(
    "[data-contact-submit]",
  );
  const startedAtField = form.querySelector<HTMLInputElement>(
    "[data-form-started-at]",
  );
  const honeypot = form.querySelector<HTMLInputElement>(
    'input[name="honeypot"]',
  );

  if (!status || !submitButton || !startedAtField) return;

  form.dataset.contactInit = "true";
  startedAtField.value = String(Date.now());

  const fields = {
    name: form.querySelector<HTMLInputElement>('input[name="name"]'),
    email: form.querySelector<HTMLInputElement>('input[name="email"]'),
    message: form.querySelector<HTMLTextAreaElement>(
      'textarea[name="message"]',
    ),
    company: form.querySelector<HTMLInputElement>('input[name="company"]'),
    budget: form.querySelector<HTMLSelectElement>('select[name="budget"]'),
  };

  const errorEls: Record<FieldKey, HTMLElement | null> = {
    name: form.querySelector<HTMLElement>('[data-contact-error-for="name"]'),
    email: form.querySelector<HTMLElement>('[data-contact-error-for="email"]'),
    message: form.querySelector<HTMLElement>(
      '[data-contact-error-for="message"]',
    ),
  };

  const validators: Record<FieldKey, (value: string) => string> = {
    name: (v) =>
      v.trim().length < 2
        ? getLang() === "en"
          ? "Name is too short."
          : "Numele este prea scurt."
        : "",
    email: (v) =>
      !isValidEmail(v.trim())
        ? getLang() === "en"
          ? "Please enter a valid email."
          : "Introdu o adresă de email validă."
        : "",
    message: (v) =>
      v.trim().length < 10
        ? getLang() === "en"
          ? "Message is too short."
          : "Mesajul este prea scurt."
        : "",
  };

  const setFieldError = (
    key: FieldKey,
    field: FieldInput | null,
    message = "",
  ) => {
    if (!field) return;
    const hasError = message.length > 0;
    field.classList.toggle("is-invalid", hasError);
    const errorEl = errorEls[key];
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle("hidden", !hasError);
    }
  };

  const updateStatus = (
    text: string,
    type: "error" | "success" | "info" | "default",
  ) => {
    status.textContent = text;
    status.classList.remove(
      "text-rose-300",
      "text-emerald-300",
      "text-zinc-300",
      "text-zinc-400",
    );
    if (type === "error") status.classList.add("text-rose-300");
    else if (type === "success") status.classList.add("text-emerald-300");
    else if (type === "info") status.classList.add("text-zinc-300");
    else status.classList.add("text-zinc-400");
  };

  (Object.keys(validators) as FieldKey[]).forEach((key) => {
    fields[key]?.addEventListener("input", () => {
      setFieldError(key, fields[key], validators[key](fields[key]!.value));
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const L = getLang();

    const formData = new FormData(form);
    const turnstileResponse = formData.get("cf-turnstile-response");

    if (!turnstileResponse) {
      updateStatus(
        L === "en"
          ? "Please complete the Captcha."
          : "Te rugăm să completezi Captcha.",
        "error",
      );
      return;
    }

    if ((honeypot?.value || "").trim().length > 0) {
      updateStatus(
        L === "en" ? "Request denied." : "Cerere respinsă.",
        "error",
      );
      return;
    }

    const timeDiff = Date.now() - Number(startedAtField.value || "0");
    if (timeDiff < MIN_FILL_TIME_MS) {
      updateStatus(
        L === "en"
          ? "Please fill the form naturally."
          : "Te rugăm să verifici câmpurile.",
        "error",
      );
      return;
    }

    const data = {
      name: fields.name?.value.trim() ?? "",
      email: fields.email?.value.trim() ?? "",
      message: fields.message?.value.trim() ?? "",
      company: fields.company?.value.trim() ?? "",
      budget: fields.budget?.value.trim() ?? "",
      honeypot: honeypot?.value ?? "",
      startedAt: Number(startedAtField.value),
      "cf-turnstile-response": turnstileResponse,
    };

    const errors: Record<FieldKey, string> = {
      name: validators.name(data.name),
      email: validators.email(data.email),
      message: validators.message(data.message),
    };

    (Object.keys(errors) as FieldKey[]).forEach((key) =>
      setFieldError(key, fields[key], errors[key]),
    );

    const firstInvalid = (Object.keys(errors) as FieldKey[]).find(
      (key) => errors[key],
    );
    if (firstInvalid) {
      fields[firstInvalid]?.focus();
      updateStatus(
        L === "en" ? "Correct the errors." : "Corectează erorile.",
        "error",
      );
      return;
    }

    submitButton.disabled = true;
    const originalBtnText = submitButton.textContent;
    submitButton.textContent = L === "en" ? "Sending..." : "Se trimite...";
    updateStatus(L === "en" ? "Sending..." : "Trimitem...", "info");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || (L === "en" ? "Error." : "Eroare."));

      updateStatus(
        payload.message || (L === "en" ? "Message sent!" : "Mesaj trimis!"),
        "success",
      );
      form.reset();

      const ts = getTurnstile();
      if (ts) ts.reset();

      startedAtField.value = String(Date.now());
      (Object.keys(validators) as FieldKey[]).forEach((key) =>
        setFieldError(key, fields[key], ""),
      );

      setTimeout(() => {
        updateStatus(
          L === "en" ? "We reply within 24h." : "Răspundem în 24h.",
          "default",
        );
      }, 6000);
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : "Error.", "error");
      const ts = getTurnstile();
      if (ts) ts.reset();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalBtnText;
    }
  });
};

const setupContactForms = () => {
  document.querySelectorAll("[data-contact-form]").forEach(initContactForm);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupContactForms, {
    once: true,
  });
} else {
  setupContactForms();
}

document.addEventListener("astro:after-swap", setupContactForms);
