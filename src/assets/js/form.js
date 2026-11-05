// Validación, contador y manejo de envío accesible del formulario de cotización
(function() {
  'use strict';

  const form = document.getElementById('quote-form');
  if (!form) return;

  const endpoint = form.getAttribute('data-endpoint') || '';
  const submitBtn = document.getElementById('form-submit');
  const btnLabel = submitBtn ? submitBtn.querySelector('.btn-label') : null;
  const errorsSummary = document.getElementById('form-errors');
  const errorsList = document.getElementById('form-errors-list');
  const resultAlert = document.getElementById('form-result');
  const textarea = document.getElementById('f-mensaje');
  const charCount = document.getElementById('f-mensaje-count');

  // Preselección de servicio desde URL (ej. contacto.html?servicio=rpbi)
  try {
    const params = new URLSearchParams(window.location.search);
    const servParam = params.get('servicio');
    const selectServ = document.getElementById('f-servicio');
    if (servParam && selectServ) {
      const exists = Array.from(selectServ.options).some(o => o.value === servParam);
      if (exists) {
        selectServ.value = servParam;
      }
    }
  } catch (e) {
    // Manejo pasivo en navegadores restringidos
  }

  // Contador de caracteres para el textarea de descripción
  if (textarea && charCount) {
    const updateCount = () => {
      const len = textarea.value.length;
      charCount.textContent = `${len} / 3000 caracteres`;
    };
    textarea.addEventListener('input', updateCount);
    updateCount();
  }

  // Reglas de validación
  const rules = {
    nombre: (val) => {
      if (!val.trim()) return 'El nombre es obligatorio.';
      if (val.trim().length < 3) return 'Escriba un nombre válido (al menos 3 caracteres).';
      return null;
    },
    empresa: (val) => {
      if (!val.trim()) return 'El nombre de la empresa u organización es obligatorio.';
      return null;
    },
    correo: (val) => {
      if (!val.trim()) return 'El correo electrónico es obligatorio.';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(val.trim())) return 'Ingrese un formato de correo electrónico válido (ej. usuario@dominio.com).';
      return null;
    },
    telefono: (val) => {
      if (!val.trim()) return 'El teléfono es obligatorio.';
      const digits = val.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) return 'Ingrese un número telefónico válido (entre 8 y 15 dígitos).';
      return null;
    },
    servicio: (val) => {
      if (!val) return 'Por favor seleccione un servicio de interés.';
      return null;
    },
    mensaje: (val) => {
      if (!val.trim()) return 'La descripción de su necesidad es obligatoria.';
      if (val.trim().length < 20) return 'Por favor describa con más detalle su requerimiento (al menos 20 caracteres).';
      return null;
    },
    privacidad: (val, el) => {
      if (!el.checked) return 'Debe aceptar el aviso de privacidad para continuar.';
      return null;
    }
  };

  // Limpiar error en tiempo real
  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    if (field) {
      const clearError = () => {
        const errorEl = document.getElementById(`f-${name}-error`);
        if (errorEl) errorEl.textContent = '';
        field.removeAttribute('aria-invalid');
      };
      field.addEventListener('input', clearError);
      field.addEventListener('change', clearError);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Verificación honeypot anti-spam
    const hp = document.getElementById('f-sitio');
    if (hp && hp.value) {
      console.warn('Bot detectado vía honeypot.');
      return;
    }

    // Resetear mensajes previos
    if (errorsSummary) errorsSummary.hidden = true;
    if (errorsList) errorsList.innerHTML = '';
    if (resultAlert) resultAlert.hidden = true;

    let hasErrors = false;
    let firstInvalidField = null;
    const errorMessages = [];

    for (const [name, validate] of Object.entries(rules)) {
      const field = form.elements[name];
      if (!field) continue;
      const errorMsg = validate(field.value, field);
      const errorEl = document.getElementById(`f-${name}-error`);

      if (errorMsg) {
        hasErrors = true;
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = errorMsg;
        if (!firstInvalidField) firstInvalidField = field;

        const label = form.querySelector(`label[for="${field.id}"]`);
        const labelText = label ? label.textContent.replace('*', '').trim() : name;
        errorMessages.push({ fieldId: field.id, text: `${labelText}: ${errorMsg}` });
      } else {
        field.removeAttribute('aria-invalid');
        if (errorEl) errorEl.textContent = '';
      }
    }

    if (hasErrors) {
      if (errorsSummary && errorsList) {
        errorsSummary.hidden = false;
        errorMessages.forEach((err) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${err.fieldId}`;
          a.textContent = err.text;
          a.addEventListener('click', (ev) => {
            ev.preventDefault();
            const target = document.getElementById(err.fieldId);
            if (target) target.focus();
          });
          li.appendChild(a);
          errorsList.appendChild(li);
        });
        errorsSummary.focus();
      } else if (firstInvalidField) {
        firstInvalidField.focus();
      }
      return;
    }

    // Validar si el endpoint está configurado
    if (!endpoint || endpoint.trim() === '') {
      if (resultAlert) {
        resultAlert.className = 'alert alert-warning';
        resultAlert.innerHTML = `
          <svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>
          <div>
            <strong>Formulario validado correctamente, pero no se envió.</strong>
            <p style="margin: .3em 0 0;">El sitio se encuentra en fase de configuración y aún no tiene conectado un servicio de recepción de correos o API de destino (<code>formEndpoint</code> no configurado en <code>site.config.json</code>). Por favor contacte directamente a GEA por los canales telefónicos o correo electrónico disponibles.</p>
          </div>
        `;
        resultAlert.hidden = false;
        resultAlert.focus();
      }
      return;
    }

    // Si hay endpoint configurado, proceder con envío real
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnLabel) btnLabel.textContent = 'Enviando solicitud...';
      }

      const formData = new FormData(form);
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        if (resultAlert) {
          resultAlert.className = 'alert alert-success';
          resultAlert.innerHTML = `
            <svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>
            <div>
              <strong>¡Solicitud enviada con éxito!</strong>
              <p style="margin: .3em 0 0;">Hemos recibido su información. Un asesor técnico de GEA Environment revisará su solicitud y se pondrá en contacto a la brevedad.</p>
            </div>
          `;
          resultAlert.hidden = false;
          resultAlert.focus();
        }
        form.reset();
        if (charCount) charCount.textContent = '0 / 3000 caracteres';
      } else {
        throw new Error(`Error en el servidor: ${res.status}`);
      }
    } catch (err) {
      if (resultAlert) {
        resultAlert.className = 'alert alert-error';
        resultAlert.innerHTML = `
          <svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>
          <div>
            <strong>Ocurrió un error al enviar el formulario.</strong>
            <p style="margin: .3em 0 0;">No fue posible transmitir su solicitud en este momento. Por favor intente más tarde o comuníquese directamente a nuestras líneas de atención.</p>
          </div>
        `;
        resultAlert.hidden = false;
        resultAlert.focus();
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Enviar solicitud';
      }
    }
  });

})();
