# PROYECTO: Sistema de Control Financiero (Cuentas del Día)

## Estado Actual (Ficha Técnica)
- **Tecnología:** Angular v21.0.0 (Componentes Autónomos / Standalone Components) corriendo bajo Node.js + Bootstrap 5.
- **Meta:** Registrar merma, inversión, flujo de caja y ganancias netas diarias, con agregación de reportes mensuales y anuales para la gestión interna del negocio de Pozol tradicional (Variedades: Cacao, Cacahuate, Blanco).
- **Enfoque de trabajo:** Desarrollo estricto, desacoplado y paso a paso, utilizando la metodología de ramificación Git Flow con commits atómicos y descriptivos.
- **Métodos de guardado de trabajo:** Control de versiones gestionado a través de Git, utilizando la interfaz visual de SourceTree para garantizar un historial de repositorio limpio y trazable.
- **Reglas para programar con herramientas de IA:** No proporcionar bloques de código a menos que sea explícitamente solicitado por el operador. La IA actuará como un consultor técnico/arquitecto: sugiriendo soluciones óptimas a problemas de lógica, advirtiendo sobre cuellos de botella de rendimiento, fallos de arquitectura y evaluando vectores de riesgo o vulnerabilidades en el código.
- **Entorno de trabajo:** Arquitectura SPA (Single Page Application) modular y moderna sin el uso de módulos tradicionales (NgModule). Control de enrutamiento nativo (`app.routes.ts`) para una navegación optimizada y limpia entre las vistas de páginas (`pages/`) y los componentes globales reutilizables.

## Acuerdos de Arquitectura
- **Formularios:** Implementación obligatoria de `ReactiveFormsModule` de Angular (`FormGroup`, `FormArray`, `FormControl`) para asegurar la inmutabilidad de los datos del cliente, la validación síncrona/asíncrona en tiempo real y la reactividad del flujo financiero.
- **Persistencia y Capa de Datos:** Migración total de almacenamiento local a un enfoque en la nube mediante **Supabase** como infraestructura Backend-as-a-Service (BaaS), operando sobre una base de datos relacional **PostgreSQL**. Las interacciones con la base de datos se ejecutan de manera asíncrona mediante promesas nativas (`async/await`) aisladas en servicios inyectables de Angular (`@Injectable`). El `LocalStorage` queda estrictamente restringido a configuraciones efímeras de la interfaz de usuario (UI), como persistencia del tema visual.
- **Reglas sobre Bootstrap:** Restringir el uso de Bootstrap exclusivamente a la capa de presentación CSS (módulo de rejilla responsiva o Grid, utilidades de espaciado, paleta de colores corporativa y componentes visuales de formulario). No se permite la manipulación directa del DOM mediante scripts externos de JS que rompan el ciclo de vida de Angular.
- **Estructura del Schema de Datos (JSON Diario):**
```json
{
  "id": "uuid-v4-auto-generado",
  "fecha": "YYYY-MM-DD",
  "vasosCacao": 0,
  "precioCacao": 0.00,
  "vasosCacahuate": 0,
  "precioCacahuate": 0.00,
  "vasosBlanco": 0,
  "precioBlanco": 0.00,
  "ventaElectronica": 0.00,
  "merma": 0.00,
  "cajaInicial": 0.00,
  "inversionTotal": 0.00,
  "ventaBruta": 0.00,
  "libre": 0.00,
  "listaGastos": [
    {
      "concepto": "Insumo X",
      "costo": 0.00
    }
  ]
}
```
## Lógica del CRUD (Cuentas del Día)

El sistema gestionará los registros financieros diarios mediante transacciones asíncronas hacia las tablas relacionales de Supabase (PostgreSQL). Para asegurar la máxima integridad, trazabilidad y seguridad de los datos monetarios, se implementarán las siguientes directrices lógicas:

### 1. Crear (Reglas de Validación antes de Guardar)
- **Identificador Único y Llave Primaria:** Cada registro insertado contará con un identificador único (UUID v4) autogenerado por Postgres. La columna `fecha` contará con una restricción de unicidad estricta (`UNIQUE CONSTRAINT`) directamente en el motor de la base de datos, impidiendo a nivel físico la existencia de jornadas duplicadas.
- **Validación de Existencia Proactiva:** Antes de despachar la transacción al backend, el componente de Angular invocará asíncronamente al servicio financiero para comprobar la disponibilidad de la fecha seleccionada. En caso de colisión, se deshabilitará el botón de guardado y se alertará al usuario en pantalla que debe optar por la funcionalidad de "Modificar".
- **Cálculo Automático Reactivo:** El control correspondiente al campo `libre` (ganancia neta) se configurará en estado de solo lectura (`disabled: true`) en el `FormGroup`. Su valor se calculará dinámicamente suscribiéndose al flujo reactivo de cambios del formulario (`valueChanges`), ejecutando las siguientes ecuaciones de negocio:
```text
  Venta Bruta = (Vasos Cacao * Precio) + (Vasos Cacahuate * Precio) + (Vasos Blanco * Precio) + Venta Electrónica
  Ganancia Libre = Venta Bruta - Inversión Total - Merma - Caja Inicial
  ```
  
- **Tipado Estricto y Sanitización:** Al recuperar los datos de los inputs del formulario, se forzará de manera explícita el casteo numérico (`Number()`) en TypeScript para neutralizar cualquier vulnerabilidad derivada de datos corruptos o cadenas de texto inválidas antes de efectuar operaciones aritméticas o persistencia en Supabase.

### 2. Borrar (Mutaciones Remotas Atómicas)
- La eliminación de una jornada financiera se ejecutará invocando el método `delete()` del cliente de Supabase, filtrando imperativamente mediante el `id` único o la `fecha` restrictiva del registro.
- Una vez que la base de datos devuelva una confirmación de éxito, el servicio mutará el estado de las variables reactivas en memoria (como arreglos locales que alimentan las vistas) excluyendo el registro borrado, lo que garantiza una actualización inmediata de la UI sin necesidad de forzar recargas totales de la página.

### 3. Modificar (Actualización Segura por Identificador)
- **Carga de Datos Hidratada:** Al activar la acción de edición en la interfaz, el objeto JSON recuperado de la base de datos poblará dinámicamente el `FormGroup` principal. Para el campo complejo de gastos detallados, se reconstruirá algorítmicamente el `FormArray` instanciando tantos sub-formularios como elementos existan en la lista.
- **Actualización Dirigida:** Al confirmar los cambios, se disparará una instrucción de actualización (`update()`) en Supabase apuntando al identificador unívoco (`id`) de la fila, reemplazando el registro viejo por el nuevo estado estructurado del formulario financiero.

### 4. Sincronización de Interfaz tras Mutaciones
- Toda operación que altere la base de datos (Crear, Modificar o Borrar) debe sincronizarse inmediatamente con las variables del estado de Angular mediante directrices reactivas fluidas (uso de Signals de Angular o Observables de RxJS). Se aprovechará la estrategia de detección de cambios del framework para optimizar el rendimiento y asegurar consistencia visual inmediata.

### 5. Integridad en las Operaciones Monetarias (Control de Decimales)
- **Precisión Numérica de Punto Flotante:** Para prevenir errores acumulativos de precisión matemática binaria en JavaScript, todos los cálculos automáticos de totales se procesarán aplicando un truncado/redondeo estricto a dos unidades decimales fijas (`.toFixed(2)` y posterior casteo a número). En la base de datos PostgreSQL de Supabase, las columnas financieras se definirán bajo el tipo de dato estricto `numeric(10,2)`.
- **Control de Efectivo Inicial (Fondo de Cambio):** El capital inyectado al inicio del día para operaciones de cambio (`cajaInicial`) se considerará un pasivo temporal en el flujo de caja. Se descuenta del cálculo de la ganancia neta libre para evaluar el rendimiento puro de las ventas del día, pero formará parte del balance total obligatorio para el arqueo final.
- **Conciliación y Auditoría de Métodos de Pago:** El control del formulario dividirá rigurosamente la entrada de capital en dos canales independientes: "Ventas en Efectivo" y "Ventas Electrónicas". Esto dota a la aplicación de capacidades de auditoría interna, facilitando el arqueo físico de la caja y la conciliación bancaria al término de la jornada laboral.

### 6. Control de Estados de Red y Concurrencia (Seguridad)
- **Manejo de Estados de Carga (Loading States):** Al iniciar cualquier ciclo de petición asíncrona hacia Supabase, los controles de acción del formulario financiero pasarán inmediatamente a estado bloqueado (`disabled = true`). Esto mitiga ataques de denegación de servicio por abuso de clics, previene la inserción de registros duplicados por latencia de red y mejora la UX mediante la visualización de indicadores de progreso (*spinners*).
- **Manejo de Excepciones y Resiliencia:** Toda transacción de red se encapsulará de forma obligatoria dentro de bloques de control de errores `try/catch` o mediante operadores de captura en tuberías de RxJS (`catchError`). En escenarios de caída del servidor o pérdida de conectividad a internet, el sistema no expondrá información interna de la infraestructura (*stack traces*); capturará la excepción con seguridad, protegerá el estado local de los datos del formulario y notificará el fallo al usuario mediante alertas de UI controladas y amigables.

## Estado Actual / Roadmap
- [x] Diseñar el Header y Footer en Angular.
- [x] Maquetar el formulario de "Cuentas del Día" con Bootstrap (Grid y Forms).
- [x] Conectar el formulario con la lógica de TypeScript.
- [ ] Inicializar el Dashboard en la consola de Supabase.
- [ ] Configurar las tablas relacionales y constraints en PostgreSQL.
- [ ] Integrar el cliente `@supabase/supabase-js` en los servicios de Angular.
- 