// Локальные фотографии не меняют размеры карточки даже при ошибке загрузки.
document.querySelectorAll('.product-card__img').forEach((image) => {
  function showImageFallback() {
    image.hidden = true;
    image.nextElementSibling.hidden = false;
  }
  image.addEventListener('error', showImageFallback);
  if (image.complete && image.naturalWidth === 0) showImageFallback();
});

const orderDialog = document.getElementById('order-dialog');

if (orderDialog) {
  const orderForm = document.getElementById('order-form');
  const successPanel = document.getElementById('order-success');
  const errorSummary = document.getElementById('order-errors');
  const fields = Array.from(orderForm.querySelectorAll('input:not([type="hidden"]), select'));
  let openingButton = null;
  let submitted = false;

  function clearErrors() {
    fields.forEach((field) => {
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      document.getElementById(`${field.id}-error`).textContent = '';
    });
    errorSummary.textContent = '';
    submitted = false;
  }

  function validateField(field) {
    field.setCustomValidity('');
    let message = '';
    const value = field.value.trim();

    if (field.required && (field.type === 'checkbox' ? !field.checked : !value)) {
      const messages = {
        name: 'Введите ваше имя.',
        email: 'Введите адрес электронной почты.',
        phone: 'Введите номер телефона.',
        topic: 'Выберите тему заявки.',
        agreement: 'Подтвердите согласие на обработку данных.',
      };
      message = messages[field.name];
    } else if (field.name === 'email' && field.validity.typeMismatch) {
      message = 'Введите e-mail в формате name@example.com.';
    } else if (field.name === 'phone' && value) {
      const digits = value.replace(/\D/g, '');
      if (!/^[+\d\s()\-]+$/.test(value) || !/^[78]\d{10}$/.test(digits) || (value.includes('+') && !/^\+7[^+]*$/.test(value))) {
        message = 'Введите 11 цифр, начиная с +7 или 8. Пробелы, скобки и дефисы допустимы.';
      }
    } else if (field.name === 'date' && field.validity.rangeUnderflow) {
      message = 'Выберите сегодняшнюю или более позднюю дату.';
    }

    if (!message && !field.validity.valid) message = 'Проверьте значение в этом поле.';
    field.setCustomValidity(message);
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    document.getElementById(`${field.id}-error`).textContent = message;
    return !message;
  }

  function updateSummary() {
    const count = fields.filter((field) => field.getAttribute('aria-invalid') === 'true').length;
    errorSummary.textContent = count ? `Проверьте отмеченные поля: ${count}. Подсказки находятся под каждым полем.` : '';
  }

  document.querySelectorAll('.product-card__button[data-product]').forEach((button) => {
    button.addEventListener('click', () => {
      openingButton = button;
      orderForm.reset();
      clearErrors();
      orderForm.hidden = false;
      successPanel.hidden = true;
      document.getElementById('selected-product').value = button.dataset.product;
      document.getElementById('order-product-name').textContent = button.dataset.product;
      document.getElementById('order-product-price').textContent = button.closest('.product-card').querySelector('.product-card__price').textContent;
      const today = new Date();
      document.getElementById('order-date').min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      document.body.classList.add('dialog-open');
      // showModal делает фон недоступным для фокуса и поддерживает Escape.
      orderDialog.showModal();
      orderDialog.scrollTop = 0;
      document.getElementById('order-dialog-title').focus({ preventScroll: true });
    });
  });

  orderDialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => orderDialog.close());
  });

  orderDialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(orderDialog.querySelectorAll(
      'button, input:not([type="hidden"]), select, textarea, a[href]',
    )).filter((element) => !element.disabled && element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement.tabIndex === -1)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function isBackdrop(event) {
    const rect = orderDialog.getBoundingClientRect();
    return event.target === orderDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  }

  // Закрываем только если на фоне началось и закончилось нажатие.
  let pointerStartedOnBackdrop = false;
  orderDialog.addEventListener('pointerdown', (event) => {
    pointerStartedOnBackdrop = isBackdrop(event);
  });
  orderDialog.addEventListener('pointerup', (event) => {
    if (pointerStartedOnBackdrop && isBackdrop(event)) orderDialog.close();
    pointerStartedOnBackdrop = false;
  });
  orderDialog.addEventListener('pointercancel', () => { pointerStartedOnBackdrop = false; });

  orderDialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    openingButton?.focus({ preventScroll: true });
  });

  fields.forEach((field) => {
    const revalidate = () => {
      if (submitted || field.hasAttribute('aria-invalid')) {
        validateField(field);
        if (submitted) updateSummary();
      }
    };
    field.addEventListener('input', revalidate);
    field.addEventListener('change', revalidate);
  });

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitted = true;
    ['name', 'email', 'phone'].forEach((name) => {
      orderForm.elements.namedItem(name).value = orderForm.elements.namedItem(name).value.trim();
    });
    const invalidFields = fields.filter((field) => !validateField(field));
    updateSummary();
    if (invalidFields.length) {
      invalidFields[0].focus();
      return;
    }
    orderForm.hidden = true;
    successPanel.hidden = false;
    document.getElementById('success-message').focus();
  });
}
