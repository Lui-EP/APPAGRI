// ===== CONFIG =====
const API_BASE = "https://api-agricola-4vmb.onrender.com/api";
const ENDPOINT_CLIENTES = `${API_BASE}/Clientes`;
const ENDPOINT_REGISTROS = `${API_BASE}/Registros`;

// ===== DATOS LOCALES =====
let clientes = [];
let registros = [];
let currentUser = null;

// ===== ALERTAS / TOAST =====
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

  try {
    const r = await fetch(url, opts); // ✅ corregido aquí
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`HTTP ${r.status} - ${txt}`);
    }
    return r.status === 204 ? null : await r.json();
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}


// ===== AUTENTICACIÓN =====
function iniciarSesion(username, password) {
    if (username === "admin" && password === "admin123") {
        currentUser = { nombre: username };
        localStorage.setItem("user", JSON.stringify(currentUser));
        document.getElementById("login-view").style.display = "none";
        document.getElementById("app-view").style.display = "block";
        document.getElementById("user-name").textContent = currentUser.nombre;
        init();
        return true;
    }
    return false;
}

function cerrarSesion() {
    localStorage.removeItem("user");
    currentUser = null;
    document.getElementById("login-view").style.display = "flex";
    document.getElementById("app-view").style.display = "none";
    document.getElementById("login-form").reset();
    toast("Sesión cerrada");
}

// ===== NAVEGACIÓN =====
function cambiarVista(vista) {
    document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
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
    } catch (err) {
        toast("Error al cargar clientes", "error");
        console.error(err);
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
    const select = document.getElementById("clienteSelect");
    const editarSelect = document.getElementById("editarClienteSelect");
    select.innerHTML = '<option value="">Seleccionar cliente</option>';
    editarSelect.innerHTML = '<option value="">Seleccionar cliente</option>';

    clientes.forEach(c => {
        const option = `<option value="${c.id}">${c.nombre} ${c.apellidos}</option>`;
        select.innerHTML += option;
        editarSelect.innerHTML += option;
    });
}

async function eliminarCliente(id) {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
        await api(`${ENDPOINT_CLIENTES}/${id}`, "DELETE");
        toast("Cliente eliminado");
        await cargarClientes();
        await cargarRegistros();
    } catch (err) {
        toast("No se pudo eliminar", "error");
        console.error(err);
    }
}

// ===== EDITAR CLIENTE (CORREGIDO) =====
function inicializarEdicionClientes() {
    const editarSelect = document.getElementById("editarClienteSelect");
    const formEditar = document.getElementById("form-editar-cliente");

    editarSelect.addEventListener("change", () => {
        const clienteId = parseInt(editarSelect.value);
        const cliente = clientes.find(c => c.id === clienteId);

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
        if (!id) {
            toast("Selecciona un cliente", "error");
            return;
        }

        const payload = {
            id, // incluir ID en el cuerpo
            nombre: document.getElementById("editarNombre").value,
            apellidos: document.getElementById("editarApellidos").value,
            telefono: document.getElementById("editarTelefono").value
        };

        try {
            await api(`${ENDPOINT_CLIENTES}/${id}`, "PUT", payload);
            toast("Cliente actualizado correctamente");
            await cargarClientes();
            formEditar.reset();
            editarSelect.value = "";
        } catch (err) {
            console.error(err);
            toast("Error al actualizar cliente", "error");
        }
    });
}

// ===== REGISTROS =====
async function cargarRegistros() {
    try {
        registros = await api(ENDPOINT_REGISTROS);
        actualizarListaRegistros();
        actualizarEstadisticas();
    } catch (err) {
        toast("Error al cargar registros", "error");
        console.error(err);
    }
}

function actualizarListaRegistros() {
    const lista = document.getElementById("lista-registros");
    const searchTerm = document.getElementById("search-registros").value.toLowerCase();
    const productoFilter = document.getElementById("filter-producto").value;

    let filtrados = registros;

    if (productoFilter !== "todos") {
        filtrados = filtrados.filter(r => r.producto === productoFilter);
    }

    if (searchTerm) {
        filtrados = filtrados.filter(r =>
            r.cliente?.nombre?.toLowerCase().includes(searchTerm) ||
            r.cliente?.apellidos?.toLowerCase().includes(searchTerm) ||
            r.producto?.toLowerCase().includes(searchTerm)
        );
    }

    if (filtrados.length === 0) {
        lista.innerHTML = '<div class="empty-state">No hay registros</div>';
        return;
    }

    lista.innerHTML = filtrados.map(r => {
        const clienteNombre = r.cliente ? `${r.cliente.nombre} ${r.cliente.apellidos}` : "—";
        const badgeClass = r.producto === "Maíz" ? "badge-maiz" : "badge-cacahuate";
        const pesoTotal = Number(r.pesoTotal ?? r.peso_total ?? 0).toFixed(2);
        const pesoCamion = Number(r.pesoCamion ?? r.peso_camion ?? 0).toFixed(2);
        const pesoNeto = Number(r.pesoNeto ?? r.peso_neto ?? (r.pesoTotal - r.pesoCamion) ?? 0).toFixed(2);

        return `
            <div class="list-item">
                <div style="flex: 1;">
                    <div class="item-info">
                        <h4>
                            ${clienteNombre}
                            <span class="badge ${badgeClass}">${r.producto ?? "-"}</span>
                        </h4>
                    </div>
                    <div class="registro-details">
                        <div class="detail-item"><span>Total:</span><span>${pesoTotal} kg</span></div>
                        <div class="detail-item"><span>Camión:</span><span>${pesoCamion} kg</span></div>
                        <div class="detail-item"><span>Neto:</span><span class="peso-neto">${pesoNeto} kg</span></div>
                    </div>
                </div>
                <button class="btn-delete" onclick="eliminarRegistro(${r.id})">Eliminar</button>
            </div>
        `;
    }).join("");
}

function actualizarEstadisticas() {
    const searchTerm = document.getElementById("search-registros").value.toLowerCase();
    const productoFilter = document.getElementById("filter-producto").value;

    let filtrados = registros;
    if (productoFilter !== "todos") {
        filtrados = filtrados.filter(r => r.producto === productoFilter);
    }
    if (searchTerm) {
        filtrados = filtrados.filter(r =>
            r.cliente?.nombre?.toLowerCase().includes(searchTerm) ||
            r.cliente?.apellidos?.toLowerCase().includes(searchTerm) ||
            r.producto?.toLowerCase().includes(searchTerm)
        );
    }

    const totalPesoNeto = filtrados.reduce((sum, r) => {
        const neto = Number(r.pesoNeto ?? r.peso_neto ?? (r.pesoTotal - r.pesoCamion) ?? 0);
        return sum + neto;
    }, 0);

    const promedio = filtrados.length > 0 ? totalPesoNeto / filtrados.length : 0;

    document.getElementById("registros-count").textContent = filtrados.length;
    document.getElementById("peso-total").textContent = totalPesoNeto.toFixed(2) + " kg";
    document.getElementById("peso-promedio").textContent = promedio.toFixed(2) + " kg";
}

async function eliminarRegistro(id) {
    if (!confirm("¿Eliminar registro de pesaje?")) return;
    try {
        await api(`${ENDPOINT_REGISTROS}/${id}`, "DELETE");
        toast("Registro eliminado");
        await cargarRegistros();
    } catch (err) {
        toast("No se pudo eliminar el registro", "error");
        console.error(err);
    }
}

function calcularPesoNeto() {
    const form = document.getElementById("form-registro");
    const pesoTotal = parseFloat(form.pesoTotal.value || 0);
    const pesoCamion = parseFloat(form.pesoCamion.value || 0);
    const pesoNeto = Math.max(0, pesoTotal - pesoCamion);
    form.pesoNeto.value = pesoNeto.toFixed(2);
}

// ===== EVENTOS =====
document.addEventListener("DOMContentLoaded", () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById("login-view").style.display = "none";
        document.getElementById("app-view").style.display = "block";
        document.getElementById("user-name").textContent = currentUser.nombre;
        init();
    }

    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        if (iniciarSesion(username, password)) toast("¡Bienvenido!");
        else toast("Credenciales inválidas", "error");
    });

    document.getElementById("form-cliente").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
            await api(ENDPOINT_CLIENTES, "POST", payload);
            toast("Cliente guardado correctamente");
            e.target.reset();
            await cargarClientes();
        } catch (err) {
            toast("Error al guardar cliente", "error");
            console.error(err);
        }
    });

    document.getElementById("form-registro").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            clienteId: parseInt(fd.get("clienteId")),
            producto: fd.get("producto"),
            pesoTotal: parseFloat(fd.get("pesoTotal")),
            pesoCamion: parseFloat(fd.get("pesoCamion")),
            pesoNeto: parseFloat(fd.get("pesoNeto") || 0)
        };
        try {
            await api(ENDPOINT_REGISTROS, "POST", payload);
            toast("Registro guardado correctamente");
            e.target.reset();
            e.target.pesoNeto.value = "0.00";
            await cargarRegistros();
        } catch (err) {
            toast("Error al guardar registro", "error");
            console.error(err);
        }
    });

    const formRegistro = document.getElementById("form-registro");
    formRegistro.pesoTotal.addEventListener("input", calcularPesoNeto);
    formRegistro.pesoCamion.addEventListener("input", calcularPesoNeto);

    document.getElementById("search-clientes").addEventListener("input", actualizarListaClientes);
    document.getElementById("search-registros").addEventListener("input", () => {
        actualizarListaRegistros();
        actualizarEstadisticas();
    });
    document.getElementById("filter-producto").addEventListener("change", () => {
        actualizarListaRegistros();
        actualizarEstadisticas();
    });
});

// ===== INIT =====
async function init() {
    await cargarClientes();
    inicializarEdicionClientes(); // <--- se llama después de cargar clientes
    await cargarRegistros();
}

// ===== MODO OSCURO / CLARO =====
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-theme");
    const body = document.body;
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        body.classList.add("dark-mode");
        toggleBtn.textContent = "🌞 Modo Claro";
    }

    toggleBtn.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDark = body.classList.contains("dark-mode");
        toggleBtn.textContent = isDark ? "🌞 Modo Claro" : "🌓 Modo Oscuro";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
});

// ===== MODO OSCURO LOGIN =====
document.addEventListener("DOMContentLoaded", () => {
    const toggleLoginTheme = document.getElementById("login-theme-toggle");
    const body = document.body;
    if (!toggleLoginTheme) return;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        body.classList.add("dark-mode");
        toggleLoginTheme.textContent = "🌞 Modo Claro";
    }

    toggleLoginTheme.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDark = body.classList.contains("dark-mode");
        toggleLoginTheme.textContent = isDark ? "🌞 Modo Claro" : "🌓 Modo Oscuro";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
});

