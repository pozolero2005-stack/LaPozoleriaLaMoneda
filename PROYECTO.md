# PROYECTO: Sistema de Control Financiero (Cuentas del Día)
- **Tecnología:** Angular + Bootstrap 5 (Sin backend por ahora).
- **Meta:** Registrar merma, inversión y ganancias diarias, con reportes mensuales y anuales.
- **Enfoque de trabajo:** Estricto, paso a paso, usando Git Flow (commits limpios).
- **metodos de guardado de trabajo** utilizo git con sourcetree, para guardar mi trabajo.
- **Reglas para programar con herramiemtas de IA** no proporcionar codigo exepto cuando se indique explicitamente,sugerir soluciones a problemas y avisar sobre futuros problemas o errores.
- **Entorno de trabajo** Este proyecto utiliza una arquitectura moderna de Angular version 21.0.0 (Componentes Autónomos / Standalone Components) corriendo bajo Node.js. El control de rutas maneja navegación limpia entre las vistas de páginas y componentes globales sin módulos tradicionales.

## Acuerdos de Arquitectura
- **Formularios:** Usar obligatoriamente `ReactiveFormsModule` de Angular.
- **Persistencia:** Guardar todo en el `LocalStorage` del navegador.
- **reglas sobre bootstrap** usa Bootstrap únicamente para el CSS (diseño, colores, columnas)
- **Estructura del JSON diario:**
  {
    "fecha": "YYYY-MM-DD",
    "inversion": 0.00,
    "merma": 0.00,
    "vendido": 0.00,
    "libre": 0.00
  }
  ## Lógica del CRUD (Cuentas del Día)

El sistema gestionará los registros financieros diarios en un Array de objetos JSON almacenado en `LocalStorage`. Para asegurar la integridad de los datos, se implementarán las siguientes reglas lógicas:

### 1. Crear (Reglas de Validación antes de Guardar)
- **Identificador Único:** La `fecha` (YYYY-MM-DD) actuará como la llave primaria del sistema. No se permitirán fechas duplicadas en el Array.
- **Validación de Existencia:** Antes de realizar el guardado (`push`), el sistema buscará si la fecha seleccionada ya existe. Si existe, se bloqueará el registro y se notificará al usuario que debe usar la opción "Modificar".
- **Cálculo Automático:** El campo `libre` será de solo lectura en la interfaz y su valor se calculará en tiempo real mediante la fórmula: `vendido - inversion - merma`.
- **Tipado Estricto:** Al recuperar los valores de los inputs, se forzará la conversión de tipo (`string` a `number`) antes de realizar la operación matemática.

### 2. Borrar (Lógica de Filtrado)
- Para eliminar un registro, se utilizará la `fecha` elegida para filtrar el Array.
- Se aplicará un método de filtrado (`filter`) que generará una nueva lista excluyendo únicamente el objeto que coincida con esa fecha.
- El nuevo Array filtrado se serializará a texto y sobreescribirá el `LocalStorage`.

### 3. Modificar (Buscar y Reemplazar)
- **Carga de Datos:** Al seleccionar "Editar", los valores del objeto JSON seleccionado se inyectarán en los controles del `FormGroup` para su edición.
- **Localización por Índice:** Al confirmar los cambios, se buscará la posición exacta (índice) del registro en el Array usando la `fecha` como referencia.
- **Reemplazo Directo:** Se sustituirá el objeto viejo en ese índice específico por el nuevo estado del formulario y se actualizará el almacenamiento local.
### 4. Sincronización de interfaz tras mutaciones (Borrar y Modificar)

- **Regla sugerida** Toda función que altere el estado del Array (Borrar/Modificar) deberá actualizar inmediatamente la variable interna que alimenta la vista (tabla o historial) y disparar la detección de cambios de Angular, garantizando consistencia visual instantánea sin requerir la recarga manual de la página.

### 5. Integridad en las operaciones monetarias (Control de decimales)
- **Regla sugerida** Los cálculos automáticos del campo libre y los futuros reportes acumulados deberán aplicar un redondeo estricto a dos unidades decimales fijas mediante funciones nativas de formateo numérico antes de su renderizado o persistencia.

- **Control de Efectivo Inicial** El sistema registrará las ventas netas del día mediante la fórmula: Venta Neta = Efectivo Final - Efectivo Inicial de Cambio. El dinero destinado a cambio no debe sumarse al campo de inversión.

- **Conciliación de Métodos de Pago:** El campo "vendido" representará la suma total de ingresos, pero la lógica del formulario deberá permitir la separación entre "Ventas en Efectivo" y "Ventas Electrónicas" para facilitar el arqueo de caja física al final de la jornada.


  ## Estado Actual
- [x] Diseñar el Header y Footer en Angular.
- [ ] Maquetar el formulario de "Cuentas del Día" con Bootstrap (Grid y Forms).
- [ ] Conectar el formulario con la lógica de TypeScript.
- 