import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/**
 * TODO [F2] Listado y paginación.
 *
 * cargarPagina(pagina):
 *  - Marque la lista como ocupada (aria-busy="true") mientras carga y desmárquela al terminar.
 *  - Obtenga la página con listarEquipos(pagina, POR_PAGINA).
 *  - Vacíe la lista y, por cada equipo, clone #tpl-equipo y llene:
 *      .codigo, .nombre, .categoria (nombre de la categoría), .fecha (con formatearFecha)
 *      .estado  -> texto del estado y atributo data-estado="<estado>" (el CSS le da color)
 *      li       -> atributo data-id="<id>"
 *    Use SIEMPRE textContent con los datos de la API (nunca innerHTML).
 *  - Si no hay equipos, muestre un <li class="vacio"> con "No hay equipos registrados."
 *  - #resumen:      "Mostrando <from>–<to> de <total>"
 *  - #pagina-actual: "Página <current_page> de <last_page>"
 *  - Deshabilite #btn-anterior en la primera página y #btn-siguiente en la última.
 *  - Si falla, muestre el error con mostrarMensaje("error", ...).
 */
const crearTarjeta = (equipo) => {
  const $tarjeta = $plantilla.content.cloneNode(true).querySelector(".tarjeta");
  $tarjeta.setAttribute("data-id", equipo.id);

  $tarjeta.querySelector(".codigo").textContent = equipo.codigo;
  $tarjeta.querySelector(".nombre").textContent = equipo.nombre;
  $tarjeta.querySelector(".categoria").textContent = equipo.categoria.nombre;
  $tarjeta.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);

  const $estado = $tarjeta.querySelector(".estado");
  $estado.textContent = equipo.estado;
  $estado.setAttribute("data-estado", equipo.estado);

  return $tarjeta;
};

const crearVacio = () => {
  const $vacio = document.createElement("li");
  $vacio.classList.add("vacio");
  $vacio.textContent = "No hay equipos registrados.";
  return $vacio;
};

const actualizarPaginacion = ({ from, to, total, current_page, last_page }) => {
  paginaActual = current_page;
  ultimaPagina = last_page;

  $resumen.textContent = `Mostrando ${from}–${to} de ${total}`;
  $paginaActual.textContent = `Página ${current_page} de ${last_page}`;
  $btnAnterior.disabled = paginaActual <= 1;
  $btnSiguiente.disabled = paginaActual >= ultimaPagina;
};

export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");

  try {
    const { data, meta } = await listarEquipos(pagina, POR_PAGINA);
    const elementos = data.length > 0 ? data.map(crearTarjeta) : [crearVacio()];

    $lista.replaceChildren(...elementos);
    actualizarPaginacion(meta);
  } catch (error) {
    mostrarMensaje("error", `No fue posible cargar el inventario: ${error.message}`);
  } finally {
    $lista.setAttribute("aria-busy", "false");
  }
};

/**
 * TODO [F4] Eliminación con manejo de reglas de negocio.
 *
 * Use DELEGACIÓN DE EVENTOS: un solo listener en $lista que detecte clics en .btn-eliminar.
 *  - Pida confirmación con confirm().
 *  - Llame a eliminarEquipo(id).
 *  - 204: muestre "Equipo eliminado." y recargue la página actual
 *         (si era el último de la página y no es la primera, vaya a la anterior).
 *  - 409: muestre el mensaje que envía la API (error.datos.mensaje).
 *  - Otro error: muestre un mensaje general.
 */
// Si se borró la única tarjeta de una página que no es la primera, retrocede una
const paginaTrasEliminar = () => {
  const quedoVacia = $lista.querySelectorAll(".tarjeta").length === 1;
  return quedoVacia && paginaActual > 1 ? paginaActual - 1 : paginaActual;
};

const alHacerClicEnLista = async (evento) => {
  const $boton = evento.target.closest(".btn-eliminar");
  if (!$boton) return;

  if (!confirm("¿Desea eliminar este equipo?")) return;

  const $tarjeta = $boton.closest(".tarjeta");
  try {
    await eliminarEquipo($tarjeta.getAttribute("data-id"));
    mostrarMensaje("exito", "Equipo eliminado.");
    await cargarPagina(paginaTrasEliminar());
  } catch (error) {
    const mensaje = error.status === 409 ? error.datos.mensaje : "No fue posible eliminar el equipo.";
    mostrarMensaje("error", mensaje);
  }
};

// Parcialmente implementado: complete el TODO de los botones de paginación.
export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  $btnAnterior.addEventListener("click", () => cargarPagina(paginaActual - 1));
  $btnSiguiente.addEventListener("click", () => cargarPagina(paginaActual + 1));

  cargarPagina(1);
};
