// ===== CONFIG =====
const API_BASE = "https://api-agricola-4vmb.onrender.com/api";
const ENDPOINT_CLIENTES = `${API_BASE}/Clientes`;
const ENDPOINT_REGISTROS = `${API_BASE}/Registros`;

let clientes = [];
let registros = [];

// ===== TEMA OSCURO / CLARO =====
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggleBtn = document.getElementById("toggle-theme");
  const savedTheme = localStorage.getItem("theme");

  // Aplicar tema guardado
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    toggleBtn.textContent = "🌞 Modo Claro";
  } else {
    toggleBtn.textContent = "🌓 Modo Oscuro";
  }

  // Escuchar clic del botón
  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toggleBtn.textContent = isDark ? "🌞 Modo Claro" : "🌓 Modo Oscuro";
  });
});


// ===== SEGURIDAD =====
document.addEventListener("DOMContentLoaded", async () => {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("user-name").textContent = usuario;

  await init();
});

// ===== CERRAR SESIÓN =====
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "login.html";
});

// ===== TOAST / ALERTAS =====
function toast(msg, type = "success") {
  const alerts = document.getElementById("alerts");
  const alert = document.createElement("div");
  alert.className = `alert ${type}`;
  alert.textContent = msg;
  alerts.appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}

// ===== API HELPER =====
async function api(url, method = "GET", body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : await res.json();
}

// ===== NAVEGACIÓN =====
function cambiarVista(vista) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-view="${vista}"]`).classList.add("active");
  document.querySelectorAll(".view-content").forEach(v => v.classList.remove("visible"));
  document.getElementById(`view-${vista}`).classList.add("visible");
}

// ===== CLIENTES =====
async function cargarClientes() {
  try {
    clientes = await api(ENDPOINT_CLIENTES);
    actualizarListaClientes();
    actualizarSelectClientes();
    document.getElementById("client-count").textContent = clientes.length;
  } catch {
    toast("Error al cargar clientes", "error");
  }
}

function actualizarListaClientes() {
  const lista = document.getElementById("lista-clientes");
  const searchTerm = document.getElementById("search-clientes").value.toLowerCase();

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm) ||
    c.apellidos.toLowerCase().includes(searchTerm) ||
    c.telefono.includes(searchTerm)
  );

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="empty-state">No hay clientes registrados</div>';
    return;
  }

  
  lista.innerHTML = filtrados.map(c => `
    <div class="list-item" onclick="window.location.href='perfil.html?id=${c.id}'" style="cursor:pointer;">
      <div class="item-info">
        <h4>${c.nombre} ${c.apellidos}</h4>
        <p>📞 ${c.telefono}</p>
      </div>
      <button class="btn-delete" onclick="event.stopPropagation(); eliminarCliente(${c.id});">Eliminar</button>
    </div>
  `).join("");
}


function actualizarSelectClientes() {
  const datalistEditar = document.getElementById("listaClientesEditar");
  const inputEditar = document.getElementById("editarClienteSelect");

  const datalistRegistro = document.getElementById("listaClientesRegistro");
  const inputRegistro = document.getElementById("clienteInput");

  // 🔹 Vaciar listas
  datalistEditar.innerHTML = "";
  datalistRegistro.innerHTML = "";

  // 🔹 Cargar clientes en ambas listas
  clientes.forEach(c => {
    const optionHTML = `<option value="${c.nombre} ${c.apellidos}" data-id="${c.id}"></option>`;
    datalistEditar.innerHTML += optionHTML;
    datalistRegistro.innerHTML += optionHTML;
  });

  // ===== Lógica para campo de edición =====
  inputEditar.addEventListener("change", () => {
    const opcion = [...datalistEditar.options].find(o => o.value === inputEditar.value);
    if (opcion) {
      const clienteId = opcion.getAttribute("data-id");
      const cliente = clientes.find(c => c.id == clienteId);
      if (cliente) {
        document.getElementById("editarNombre").value = cliente.nombre;
        document.getElementById("editarApellidos").value = cliente.apellidos;
        document.getElementById("editarTelefono").value = cliente.telefono;
        inputEditar.setAttribute("data-id", cliente.id);
      }
    }
  });

  // ===== Lógica para campo de nuevo registro =====
  inputRegistro.addEventListener("change", () => {
    const opcion = [...datalistRegistro.options].find(o => o.value === inputRegistro.value);
    if (opcion) {
      const clienteId = opcion.getAttribute("data-id");
      inputRegistro.setAttribute("data-id", clienteId);
    }
  });
}



async function eliminarCliente(id) {
  if (!confirm("¿Eliminar cliente?")) return;
  await api(`${ENDPOINT_CLIENTES}/${id}`, "DELETE");
  toast("Cliente eliminado");
  await cargarClientes();
  await cargarRegistros();
}

function inicializarEdicionClientes() {
  const editarSelect = document.getElementById("editarClienteSelect");
  const formEditar = document.getElementById("form-editar-cliente");

  editarSelect.addEventListener("change", () => {
    const id = parseInt(editarSelect.value);
    const cliente = clientes.find(c => c.id === id);
    if (cliente) {
      document.getElementById("editarNombre").value = cliente.nombre;
      document.getElementById("editarApellidos").value = cliente.apellidos;
      document.getElementById("editarTelefono").value = cliente.telefono;
    } else {
      formEditar.reset();
    }
  });

  formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = parseInt(editarSelect.value);
    if (!id) return toast("Selecciona un cliente", "error");

    const payload = {
      id,
      nombre: document.getElementById("editarNombre").value,
      apellidos: document.getElementById("editarApellidos").value,
      telefono: document.getElementById("editarTelefono").value
    };

    await api(`${ENDPOINT_CLIENTES}/${id}`, "PUT", payload);
    toast("Cliente actualizado correctamente");
    await cargarClientes();
  });
}

// ===== REGISTROS =====
async function cargarRegistros() {
  registros = await api(ENDPOINT_REGISTROS);
  actualizarListaRegistros();
  actualizarEstadisticas();
}

function actualizarListaRegistros() {
  const lista = document.getElementById("lista-registros");
  const searchTerm = document.getElementById("search-registros").value.toLowerCase();
  const filtro = document.getElementById("filter-producto").value;

  let filtrados = registros;
  if (filtro !== "todos") filtrados = filtrados.filter(r => r.producto === filtro);
  if (searchTerm)
    filtrados = filtrados.filter(r =>
      r.cliente?.nombre?.toLowerCase().includes(searchTerm) ||
      r.cliente?.apellidos?.toLowerCase().includes(searchTerm) ||
      r.producto?.toLowerCase().includes(searchTerm)
    );

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="empty-state">No hay registros</div>';
    return;
  }

  lista.innerHTML = filtrados.map(r => `
    <div class="list-item">
      <div>
        <h4>${r.cliente?.nombre ?? "—"} ${r.cliente?.apellidos ?? ""}</h4>
        <p>${r.producto} - Neto: ${(r.pesoNeto ?? 0).toFixed(2)} kg</p>
      </div>
      <button class="btn-delete" onclick="eliminarRegistro(${r.id})">Eliminar</button>
    </div>
  `).join("");
}

function actualizarEstadisticas() {
  const total = registros.reduce((sum, r) => sum + (r.pesoNeto ?? 0), 0);
  const promedio = registros.length ? total / registros.length : 0;
  document.getElementById("registros-count").textContent = registros.length;
  document.getElementById("peso-total").textContent = `${total.toFixed(2)} kg`;
  document.getElementById("peso-promedio").textContent = `${promedio.toFixed(2)} kg`;
}

async function eliminarRegistro(id) {
  if (!confirm("¿Eliminar registro?")) return;
  await api(`${ENDPOINT_REGISTROS}/${id}`, "DELETE");
  toast("Registro eliminado");
  await cargarRegistros();
}

// ===== FORMULARIOS =====
document.getElementById("form-cliente").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api(ENDPOINT_CLIENTES, "POST", Object.fromEntries(fd.entries()));
  toast("Cliente guardado correctamente");
  e.target.reset();
  await cargarClientes();
});

document.getElementById("form-registro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const clienteInput = document.getElementById("clienteInput");
  const clienteId = parseInt(clienteInput.getAttribute("data-id"));
  const payload = {
    clienteId: clienteId,
    producto: fd.get("producto"),
    pesoTotal: parseFloat(fd.get("pesoTotal")),
    pesoCamion: parseFloat(fd.get("pesoCamion")),
    pesoNeto: parseFloat(fd.get("pesoNeto"))
  };
  await api(ENDPOINT_REGISTROS, "POST", payload);
  toast("Registro guardado correctamente");
  e.target.reset();
  await cargarRegistros();
});

// ===== CALCULAR PESO NETO =====
function calcularPesoNeto() {
  const form = document.getElementById("form-registro");
  const total = parseFloat(form.pesoTotal.value || 0);
  const camion = parseFloat(form.pesoCamion.value || 0);
  const neto = Math.max(0, total - camion);
  form.pesoNeto.value = neto.toFixed(2);
}

document.getElementById("form-registro").pesoTotal.addEventListener("input", calcularPesoNeto);
document.getElementById("form-registro").pesoCamion.addEventListener("input", calcularPesoNeto);

// ===== EVENTOS FILTRO =====
document.getElementById("search-clientes").addEventListener("input", actualizarListaClientes);
document.getElementById("search-registros").addEventListener("input", () => {
  actualizarListaRegistros();
  actualizarEstadisticas();
});
document.getElementById("filter-producto").addEventListener("change", () => {
  actualizarListaRegistros();
  actualizarEstadisticas();
});

// ===== INIT =====
async function init() {
  await cargarClientes();
  inicializarEdicionClientes();
  await cargarRegistros();
}

