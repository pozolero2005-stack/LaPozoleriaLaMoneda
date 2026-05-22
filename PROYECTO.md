# PROYECTO: Sistema de Control Financiero (Cuentas del Día)
- **Tecnología:** Angular + Bootstrap 5 (Sin backend por ahora).
- **Meta:** Registrar merma, inversión y ganancias diarias, con reportes mensuales y anuales.
- **Enfoque de trabajo:** Estricto, paso a paso, usando Git Flow (commits limpios).

## Acuerdos de Arquitectura
- **Formularios:** Usar obligatoriamente `ReactiveFormsModule` de Angular.
- **Persistencia:** Guardar todo en el `LocalStorage` del navegador.
- **Estructura del JSON diario:**
  {
    "fecha": "YYYY-MM-DD",
    "inversion": 0.00,
    "merma": 0.00,
    "ganancias": 0.00,
    "libre": 0.00
  }

  ## Estado Actual
- [ ] Diseñar el Header y Footer en Angular.
- [ ] Maquetar el formulario de "Cuentas del Día" con Bootstrap (Grid y Forms).
- [ ] Conectar el formulario con la lógica de TypeScript.