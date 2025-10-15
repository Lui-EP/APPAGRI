const API_BASE = "https://api-agricola-4vmb.onrender.com/api";
const ENDPOINT_CLIENTES = `${API_BASE}/Clientes`;
const ENDPOINT_REGISTROS = `${API_BASE}/Registros`;
// ===== TEMA OSCURO / CLARO =====
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  if (!id) {
    document.body.innerHTML = "<h2 style='text-align:center;color:red;'>Cliente no especificado</h2>";
    return;
  }

  try {
    // ✅ Cargar todos los clientes y buscar el correspondiente
    const clientes = await fetch(ENDPOINT_CLIENTES).then(r => r.json());
    const cliente = clientes.find(c => c.id === id || c.idCliente === id);

    if (!cliente) {
      throw new Error(`Cliente con ID ${id} no encontrado`);
    }

    // ✅ Cargar todos los registros
    const registros = await fetch(ENDPOINT_REGISTROS).then(r => r.json());

    mostrarPerfil(cliente, registros);
  } catch (err) {
    console.error("Error cargando datos:", err);
    document.body.innerHTML = `
      <h2 style='text-align:center;color:red;'>Error al cargar datos</h2>
      <p style='text-align:center;color:#999;'>${err.message}</p>
    `;
  }
});

function mostrarPerfil(cliente, registros) {
  // ===== DATOS DEL CLIENTE =====
  const perfilDetalle = document.getElementById("perfil-detalle");
  perfilDetalle.innerHTML = `
    <div class="detail-item"><span>Nombre:</span><span>${cliente.nombre} ${cliente.apellidos}</span></div>
    <div class="detail-item"><span>Teléfono:</span><span>${cliente.telefono}</span></div>
    <div class="detail-item"><span>ID:</span><span>${cliente.id}</span></div>
  `;

  // ===== FILTRAR REGISTROS =====
  const registrosCliente = registros.filter(r => r.cliente?.id === cliente.id || r.clienteId === cliente.id);

  // ===== HISTORIAL =====
  const historial = document.getElementById("perfil-historial");
  if (registrosCliente.length === 0) {
    historial.innerHTML = `<div class="empty-state">No hay registros disponibles</div>`;
  } else {
    historial.innerHTML = registrosCliente.map(r => {
      const pesoTotal = Number(r.pesoTotal ?? r.peso_total ?? 0).toFixed(2);
      const pesoCamion = Number(r.pesoCamion ?? r.peso_camion ?? 0).toFixed(2);
      const pesoNeto = Number(r.pesoNeto ?? r.peso_neto ?? (r.pesoTotal - r.pesoCamion) ?? 0).toFixed(2);
      const badgeClass = r.producto === "Maíz" ? "badge-maiz" : "badge-cacahuate";
      const emoji = r.producto === "Maíz" ? "🌽" : "🥜";
      return `
        <div class="list-item">
          <div class="item-info">
            <h4>${emoji} ${r.producto} <span class="badge ${badgeClass}">${r.producto}</span></h4>
            <p>Total: ${pesoTotal} kg | Camión: ${pesoCamion} kg | Neto: ${pesoNeto} kg</p>
          </div>
        </div>
      `;
    }).join("");
  }

  // ===== ESTADÍSTICAS =====
  const totalRegistros = registrosCliente.length;
  const totalPesoNeto = registrosCliente.reduce((sum, r) =>
    sum + Number(r.pesoNeto ?? r.peso_neto ?? (r.pesoTotal - r.pesoCamion) ?? 0), 0);

  const promedio = totalRegistros > 0 ? totalPesoNeto / totalRegistros : 0;

  // 🌽 Totales por tipo de producto
  const totalMaiz = registrosCliente
    .filter(r => r.producto === "Maíz")
    .reduce((sum, r) => sum + (r.pesoNeto ?? r.peso_neto ?? (r.pesoTotal - r.pesoCamion)), 0);

  const totalCacahuate = registrosCliente
    .filter(r => r.producto === "Cacahuate")
    .reduce((sum, r) => sum + (r.pesoNeto ?? r.peso_neto ?? (r.pesoTotal - r.pesoCamion)), 0);

  // ===== MOSTRAR ESTADÍSTICAS =====
  const statsContainer = document.querySelector(".stats");
  statsContainer.innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Total Registros</span>
      <span class="stat-value">${totalRegistros}</span>
    </div>
    <div class="stat-card stat-amber">
      <span class="stat-label">Peso Neto Total</span>
      <span class="stat-value">${totalPesoNeto.toFixed(2)} kg</span>
    </div>
    <div class="stat-card stat-emerald">
      <span class="stat-label">Promedio Neto</span>
      <span class="stat-value">${promedio.toFixed(2)} kg</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Total Maíz 🌽</span>
      <span class="stat-value">${totalMaiz.toFixed(2)} kg</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Total Cacahuate 🥜</span>
      <span class="stat-value">${totalCacahuate.toFixed(2)} kg</span>
    </div>
  `;
}
