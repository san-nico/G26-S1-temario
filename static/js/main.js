async function fetchData() {
  const response = await fetch("/static/json/contenido.json");
  const data = await response.json();
  return data;
}

// Ahora soporta formato "dd-mm-yyyy"
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  const [dia, mes, anio] = fechaStr.split("-");
  return new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
}

// Normaliza la fecha a medianoche para comparar solo día/mes/año
function normalizarFecha(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function generarClases(data) {
  const ids = Object.keys(data.titulos);
  const hoy = normalizarFecha(new Date());

  // Construir todas las clases con su fecha
  const clases = ids.map((id) => {
    const fechaStr = data.fechas[id] || "";
    const fechaClase = fechaStr ? parseFecha(fechaStr) : null;

    return {
      correlativo: id,
      id: id,
      titulo: data.titulos[id] || "",
      diapositiva: data.diapositivas[id] || "",
      formulario: data.formularios[id] || "",
      fecha: fechaStr,
      modalidad: data.modalidades[id] || "",
      bloques: data.bloques[id] || [],
      ayudantia: data.ayudantias[id] || "",
      fechaClase: fechaClase ? normalizarFecha(fechaClase) : null,
      estado: "", // se asigna más abajo
    };
  });

  // Encontrar la clase pasada más reciente
  const pasadas = clases.filter((c) => c.fechaClase && c.fechaClase <= hoy);
  let vigenteId = null;
  if (pasadas.length) {
    const ultimaPasada = pasadas.reduce((a, b) =>
      a.fechaClase > b.fechaClase ? a : b,
    );
    vigenteId = ultimaPasada.id;
  }

  // Asignar estado a cada clase
  clases.forEach((c) => {
    if (!c.fechaClase) {
      c.estado = "sin_fecha";
    } else if (c.id === vigenteId) {
      c.estado = "vigente";
    } else if (c.fechaClase < hoy) {
      c.estado = "vencido";
    } else if (c.fechaClase > hoy) {
      c.estado = "futuro";
    }
  });

  return clases;
}

async function main() {
  const holder = document.querySelector(".clases");
  const datosJSON = await fetchData();
  const listaClases = generarClases(datosJSON);

  // Cargar template como texto
  const templateText = await (await fetch("/static/ejs/card.ejs")).text();

  // Renderizar todas las clases directamente
  holder.innerHTML = listaClases
    .map((clase) => ejs.render(templateText, clase))
    .join("");
}

main();
