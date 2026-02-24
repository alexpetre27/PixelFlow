const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const MIN_FILL_TIME_MS = 2500;

type FieldKey = "name" | "email" | "message";
type FieldInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const initContactForm = (root: Element) => {
  const currentLang = document.documentElement.lang || "ro";
  const form = root as HTMLFormElement;

  if (form.dataset.contactInit === "true") return;

  const status = form.querySelector<HTMLElement>("[data-contact-status]");
  const submitButton = form.querySelector<HTMLButtonElement>(
    "[data-contact-submit]",
  );
  const startedAtField = form.querySelector<HTMLInputElement>(
    "[data-form-started-at]",
  );
  // Asigură-te că numele coincide cu cel din componenta .astro
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

  const errorEls: Partial<Record<FieldKey, HTMLElement>> = {
    name:
      form.querySelector<HTMLElement>('[data-contact-error-for="name"]') ??
      undefined,
    email:
      form.querySelector<HTMLElement>('[data-contact-error-for="email"]') ??
      undefined,
    message:
      form.querySelector<HTMLElement>('[data-contact-error-for="message"]') ??
      undefined,
  };

  const validators: Record<FieldKey, (value: string) => string> = {
    name: (v) =>
      v.trim().length < 2
        ? currentLang === "en"
          ? "Enter a valid name (min 2 characters)."
          : "Introdu un nume valid (minim 2 caractere)."
        : "",
    email: (v) =>
      !isValidEmail(v.trim())
        ? currentLang === "en"
          ? "Enter a valid email address."
          : "Introdu o adresă de email validă."
        : "",
    message: (v) =>
      v.trim().length < 10
        ? currentLang === "en"
          ? "Message must be at least 10 characters."
          : "Mesajul trebuie să aibă cel puțin 10 caractere."
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
    field.setAttribute("aria-invalid", hasError ? "true" : "false");
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

    if ((honeypot?.value || "").trim().length > 0) {
      updateStatus(
        currentLang === "en"
          ? "Could not process request."
          : "Nu am putut procesa trimiterea.",
        "error",
      );
      return;
    }

    const elapsed = Date.now() - Number(startedAtField.value || "0");
    if (elapsed < MIN_FILL_TIME_MS) {
      updateStatus(
        currentLang === "en"
          ? "Please check fields and try again."
          : "Te rugăm să verifici câmpurile și să încerci din nou.",
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
        currentLang === "en"
          ? "Please correct the highlighted fields."
          : "Completează corect câmpurile marcate.",
        "error",
      );
      return;
    }

    submitButton.disabled = true;
    const originalBtnText = submitButton.textContent;
    submitButton.textContent =
      currentLang === "en" ? "Sending..." : "Se trimite...";
    updateStatus(
      currentLang === "en"
        ? "Sending message to our team..."
        : "Trimitem mesajul către echipă...",
      "info",
    );

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.message ||
            (currentLang === "en" ? "Send failed." : "Trimiterea a eșuat."),
        );

      updateStatus(
        payload.message ||
          (currentLang === "en"
            ? "Success! We'll get back to you soon."
            : "Mesaj trimis cu succes. Revenim curând."),
        "success",
      );

      form.reset();
      startedAtField.value = String(Date.now());
      (Object.keys(validators) as FieldKey[]).forEach((key) =>
        setFieldError(key, fields[key], ""),
      );

      window.dispatchEvent(
        new CustomEvent("contact:submitted", {
          detail: { source: "contact-form" },
        }),
      );
      const dl = (window as any).dataLayer;
      if (Array.isArray(dl)) dl.push({ event: "contact_form_submit_success" });

      setTimeout(() => {
        updateStatus(
          currentLang === "en"
            ? "We usually respond within the same business day."
            : "Răspundem de obicei în aceeași zi lucrătoare.",
          "default",
        );
      }, 6000);
    } catch (error) {
      updateStatus(
        error instanceof Error
          ? error.message
          : currentLang === "en"
            ? "Error sending."
            : "Eroare la trimitere.",
        "error",
      );
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
