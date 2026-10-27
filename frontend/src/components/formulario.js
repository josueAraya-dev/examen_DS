import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * TODO [F3] Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
const TEXTO_GUARDAR = $btnGuardar.textContent;
const TEXTO_GUARDANDO = "Guardando…";

const cargarCategorias = async () => {
  const { data } = await listarCategorias();
  const opciones = data.map(({ id, nombre }) => {
    const $opcion = document.createElement("option");
    $opcion.setAttribute("value", id);
    $opcion.textContent = nombre;
    return $opcion;
  });
  $selectCategoria.append(...opciones);
};

const limpiarErrores = () => {
  $form.querySelectorAll("[data-error]").forEach(($p) => ($p.textContent = ""));
  $form.querySelectorAll("[aria-invalid]").forEach(($campo) => $campo.removeAttribute("aria-invalid"));
};

const leerDatos = () => {
  const datos = Object.fromEntries(new FormData($form));
  return {
    ...datos,
    categoria_id: Number(datos.categoria_id),
    costo_interno: Number(datos.costo_interno),
  };
};

const mostrarErrores = (errores) => {
  for (const [campo, [mensaje]] of Object.entries(errores)) {
    const $error = $form.querySelector(`[data-error="${campo}"]`);
    if ($error) $error.textContent = mensaje;
    $form.querySelector(`[name="${campo}"]`)?.setAttribute("aria-invalid", "true");
  }
};

export const iniciarFormulario = ({ alGuardar }) => {
  cargarCategorias();

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();

    $btnGuardar.disabled = true;
    $btnGuardar.textContent = TEXTO_GUARDANDO;

    try {
      const { data } = await crearEquipo(leerDatos());
      $form.reset();
      mostrarMensaje("exito", `Equipo ${data.codigo} registrado.`);
      alGuardar();
    } catch (error) {
      if (error.status === 422) {
        mostrarErrores(error.datos.errors ?? {});
      } else {
        mostrarMensaje("error", "No fue posible registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = TEXTO_GUARDAR;
    }
  });
};
