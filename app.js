import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAHiFI5RlkYFGYUbGE9n4IdUUrLPZu5oDQ",
    authDomain: "argentinapa.firebaseapp.com",
    projectId: "argentinapa",
    storageBucket: "argentinapa.firebasestorage.app",
    messagingSenderId: "1053019758732",
    appId: "1:1053019758732:web:d931e30ffe3aa552e2dba9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let datosUsuario = {
    nombre: 'nombre',
    apellido: 'apellido',
    dni: '00.000.000',
    fotoURL: '',
    sexo: '-',
    nacionalidad: 'ARGENTINA',
    lugarNac: 'ARGENTINA',
    domicilio: 'domicilio',
    ejemplar: 'A',
    fechaNacimiento: '00 MES / MES 0000',
    fechaEmision: '00 MES / MES 0000',
    fechaVencimiento: '00 MES / MES 0000',
    tramite: 'tramite'
};

// ==============================================================
// Formatea una fecha YYYY-MM-DD a 'DD MES_ES/ MES_EN YYYY'
function formatearFechaDNIinput(fechaStr) {
    if (!fechaStr || fechaStr.length !== 10) return '';
    const [y, m, d] = fechaStr.split('-');
    const mesesES = { '01':'ENE', '02':'FEB', '03':'MAR', '04':'ABR', '05':'MAY', '06':'JUN', '07':'JUL', '08':'AGO', '09':'SEP', '10':'OCT', '11':'NOV', '12':'DIC' };
    const mesesEN = { '01':'JAN', '02':'FEB', '03':'MAR', '04':'APR', '05':'MAY', '06':'JUN', '07':'JUL', '08':'AUG', '09':'SEP', '10':'OCT', '11':'NOV', '12':'DEC' };
    return `${d} ${mesesES[m]}/ ${mesesEN[m]} ${y}`;
}
// LÓGICA PARA EL CÓDIGO MRZ DEL DORSO DEL DNI (MÁQUINA RENAPER)
// ==============================================================
function desformatearFechaDNI(fechaTexto) {
    if(!fechaTexto) return "";
    const mesesES = { 'ENE':'01', 'FEB':'02', 'MAR':'03', 'ABR':'04', 'MAY':'05', 'JUN':'06', 'JUL':'07', 'AGO':'08', 'SEP':'09', 'OCT':'10', 'NOV':'11', 'DIC':'12' };
    const matchDia = fechaTexto.match(/\d{1,2}/);
    const matchAno = fechaTexto.match(/\d{4}/);
    const matchMes = fechaTexto.toUpperCase().match(/[A-Z]{3}/);
    
    if (matchDia && matchAno && matchMes && mesesES[matchMes[0]]) {
        let dia = matchDia[0].padStart(2, '0');
        return `${matchAno[0]}-${mesesES[matchMes[0]]}-${dia}`;
    }
    return "";
}

function generarMRZ(datos) {
    const docNum = (datos.dni || '').replace(/\D/g, '').padEnd(9, '<').substring(0,9);
    
    const nac = desformatearFechaDNI(datos.fechaNacimiento || '');
    const nacStr = nac ? nac.substring(2,4) + nac.substring(5,7) + nac.substring(8,10) : "000000";
    
    const venc = desformatearFechaDNI(datos.fechaVencimiento || '');
    const vencStr = venc ? venc.substring(2,4) + venc.substring(5,7) + venc.substring(8,10) : "000000";
    
    const sexo = (datos.sexo || 'M').charAt(0).toUpperCase();
    
    const line1 = `IDARG${docNum}8<<<<<<<<<<<<<<<`;
    const line2 = `${nacStr}8${sexo}${vencStr}8ARG<<<<<<<<<<<`;
    
    const apellidos = (datos.apellido || '').toUpperCase().replace(/\s+/g, '<').padEnd(10, '<').substring(0, 10);
    const nombres = (datos.nombre || '').toUpperCase().replace(/\s+/g, '<').padEnd(16, '<').substring(0, 16);
    const line3 = `${apellidos}<<${nombres}`.padEnd(30, '<').substring(0, 30);
    
    return `${line1}\n${line2}\n${line3}`;
}
// ==============================================================

window.mostrar = function(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    
    const pantallaDestino = document.getElementById(id);
    if(pantallaDestino) {
        pantallaDestino.classList.add('activa');
    }
    
    if (id === 'dashboard' || id === 'documentos' || id === 'dniView' || id === 'tramites' || id === 'verDetalle') {
        actualizarInterfazDatos();
    }

    if (id === 'pinScreen') {
        document.getElementById('pinInput').value = ''; 
    }

    if (id === 'dniView') {
        actualizarFechaHora();
    }

    if (id === 'tramites') {
        setTimeout(ajustarCanvas, 50);
    }
    try { sessionStorage.setItem('lastScreen', id); } catch(e) {}
}

window.toggleDoc = function() {
    const content = document.getElementById('doc-content');
    const arrow = document.getElementById('doc-arrow');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
};

window.marcarNav = function(elemento, baseName) {
    const navs = elemento.parentElement.querySelectorAll('.nav-item');
    navs.forEach(nav => {
        nav.classList.remove('active');
        const img = nav.querySelector('img');
        if(img && img.dataset.base) {
            img.src = img.dataset.base + '_gris.png';
        }
    });
    
    elemento.classList.add('active');
    const currentImg = elemento.querySelector('img');
    if(currentImg) {
        currentImg.src = baseName + '_azul.png';
    }
}

window.toggleQR = function() {
    const content = document.getElementById('qr-content');
    const arrow = document.getElementById('qr-arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

window.validarPin = function() {
    const pin = document.getElementById('pinInput').value;
    if(pin.length === 6) {
        mostrar('dniView');
    }
}

function leerFechaTriplet(prefix) {
    const d = document.getElementById(prefix + '_dia')?.value;
    const m = document.getElementById(prefix + '_mes')?.value;
    const y = document.getElementById(prefix + '_anio')?.value;
    if (d && m && y) {
        // Mapas de meses
        const mesesES = {
            'JAN': 'ENE', 'FEB': 'FEB', 'MAR': 'MAR', 'APR': 'ABR', 'MAY': 'MAY', 'JUN': 'JUN',
            'JUL': 'JUL', 'AUG': 'AGO', 'SEP': 'SEP', 'OCT': 'OCT', 'NOV': 'NOV', 'DEC': 'DIC'
        };
        const mesesEN = {
            'ENE': 'JAN', 'FEB': 'FEB', 'MAR': 'MAR', 'ABR': 'APR', 'MAY': 'MAY', 'JUN': 'JUN',
            'JUL': 'JUL', 'AGO': 'AUG', 'SEP': 'SEP', 'OCT': 'OCT', 'NOV': 'NOV', 'DIC': 'DEC'
        };
        let mesES = m.toUpperCase();
        let mesEN = mesesEN[mesES] || mesES;
        // Si el usuario ingresa el mes en inglés, convertir a español
        if (mesesES[mesES]) mesES = mesesES[mesES];
        return `${d.padStart(2, '0')} ${mesES}/ ${mesEN} ${y}`;
    }
    return '';
}

function poblarFechaTriplet(prefix, val) {
    const d = document.getElementById(prefix + '_dia');
    const m = document.getElementById(prefix + '_mes');
    const y = document.getElementById(prefix + '_anio');
    if (!d || !m || !y || !val) return;
    const matchDia = val.match(/\d{1,2}/);
    const matchAno = val.match(/\d{4}/);
    const matchMes = val.toUpperCase().match(/[A-Z]{3}/);
    if (matchDia) d.value = matchDia[0];
    if (matchMes) m.value = matchMes[0];
    if (matchAno) y.value = matchAno[0];
}

window.registrar = async function() {
    try {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const nombreInput = document.getElementById('reg_editNombre')?.value;
        const apellidoInput = document.getElementById('reg_editApellido')?.value;
        const dniInput = document.getElementById('reg_editDni')?.value;
        const fileInput = document.getElementById('reg_editFoto');
        if (!email || !pass || !nombreInput || !apellidoInput || !dniInput) {
            alert("Por favor, completá todos los campos.");
            return;
        }
        await createUserWithEmailAndPassword(auth, email, pass);
        datosUsuario.nombre = nombreInput.toUpperCase();
        datosUsuario.apellido = apellidoInput.toUpperCase();
        datosUsuario.dni = formatearDNIConPuntos(dniInput);
        datosUsuario.domicilio = document.getElementById('reg_editDomicilio')?.value.toUpperCase() || '';
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            datosUsuario.fotoURL = URL.createObjectURL(fileInput.files[0]);
        }
        
        const fNac = leerFechaTriplet('reg_editNacimiento');
        const fNacRaw = document.getElementById('reg_editNacimiento_date')?.value;
        if (fNacRaw) datosUsuario.fechaNacimiento = formatearFechaDNIinput(fNacRaw);

        const fEmiRaw = document.getElementById('reg_editEmision_date')?.value;
        if (fEmiRaw) {
            datosUsuario.fechaEmision = formatearFechaDNIinput(fEmiRaw);
            // Automatizar vencimiento: sumar 15 años
            const [y, m, d] = fEmiRaw.split('-');
            const vtoY = (parseInt(y, 10) + 15).toString();
            datosUsuario.fechaVencimiento = formatearFechaDNIinput(`${vtoY}-${m}-${d}`);
        }
        
        try { document.getElementById('email').value = ''; } catch(e) {}
        try { document.getElementById('password').value = ''; } catch(e) {}
        try { document.getElementById('reg_editNombre').value = ''; } catch(e) {}
        try { document.getElementById('reg_editApellido').value = ''; } catch(e) {}
        try { document.getElementById('reg_editDni').value = ''; } catch(e) {}
        try { document.getElementById('reg_editDomicilio').value = ''; } catch(e) {}
        if (fileInput) try { fileInput.value = ''; } catch(e) {}
        
        actualizarInterfazDatos();
        mostrar('dashboard'); 
        alert("¡Datos de credencial guardados! Ya podés seguir ajustando lo que necesites acá mismo.");
    } catch (e) {
        alert("Error al registrar: " + e.message);
    }
}

window.login = async function() {
    try {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;

        if (!email || !pass) {
            alert("Ingresá tu correo y contraseña.");
            return;
        }

        await signInWithEmailAndPassword(auth, email, pass);
        
        actualizarInterfazDatos();
        mostrar('dashboard');

    } catch (e) {
        alert("Error al iniciar sesión: Verificá tus datos.");
    }
}

window.logout = async function() {
    try {
        await signOut(auth);
        
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPass').value = '';
        
        datosUsuario = { 
            nombre: 'Usuario', apellido: '---', dni: '---', fotoURL: '',
            sexo: 'M', nacionalidad: 'ARGENTINA', lugarNac: 'ARGENTINA', domicilio: '---', ejemplar: 'A',
            fechaNacimiento: '21 FEB/ FEB 2007', fechaEmision: '10 ABR/ APR 2025',
            fechaVencimiento: '10 ABR/ APR 2040', tramite: '00640409635\n4589'
        };
        
        mostrar('home');
    } catch (e) {
        alert("Error al cerrar sesión: " + e.message);
    }
}

window.guardarEdicion = function() {
    datosUsuario.nombre = document.getElementById('editNombre')?.value.toUpperCase() || datosUsuario.nombre;
    datosUsuario.apellido = document.getElementById('editApellido')?.value.toUpperCase() || datosUsuario.apellido;
    datosUsuario.dni = document.getElementById('editDni')?.value || datosUsuario.dni;
    datosUsuario.sexo = document.getElementById('editSexo')?.value || datosUsuario.sexo;
    datosUsuario.nacionalidad = document.getElementById('editNacionalidad')?.value.toUpperCase() || datosUsuario.nacionalidad;
    datosUsuario.lugarNac = document.getElementById('editLugarNac')?.value.toUpperCase() || datosUsuario.lugarNac;
    datosUsuario.domicilio = document.getElementById('editDomicilio')?.value.toUpperCase() || datosUsuario.domicilio;
    if(document.getElementById('editEjemplar')) datosUsuario.ejemplar = document.getElementById('editEjemplar').value;
    
    const fNac = leerFechaTriplet('editNacimiento');
    const fNacRaw = document.getElementById('editNacimiento_date')?.value;
    if (fNacRaw) datosUsuario.fechaNacimiento = formatearFechaDNIinput(fNacRaw);

    const fEmiRaw = document.getElementById('editEmision_date')?.value;
    if (fEmiRaw) {
        datosUsuario.fechaEmision = formatearFechaDNIinput(fEmiRaw);
        // Automatizar vencimiento: sumar 15 años
        const [y, m, d] = fEmiRaw.split('-');
        const vtoY = (parseInt(y, 10) + 15).toString();
        datosUsuario.fechaVencimiento = formatearFechaDNIinput(`${vtoY}-${m}-${d}`);
    }
    
    if(document.getElementById('editTramite')) datosUsuario.tramite = document.getElementById('editTramite').value;
    
    actualizarInterfazDatos();
    alert("¡Datos de credencial guardados! Ya podés seguir ajustando lo que necesites acá mismo.");
}

function formatearDNIConPuntos(dni) {
    if (!dni) return '';
    return dni.toString().replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
}

function vincularLivePreview() {
    const mapeo = [
        { in: 'editNombre', prev: 'prev_nombre', out: 'f_nombre' },
        { in: 'editApellido', prev: 'prev_apellido', out: 'f_apellido' },
        { in: 'editNacionalidad', prev: 'prev_nacionalidad', out: 'f_nacionalidad' }
    ];

    mapeo.forEach(item => {
        const input = document.getElementById(item.in);
        if (input) {
            input.addEventListener('input', (e) => {
                const valor = e.target.value.toUpperCase();
                if(document.getElementById(item.prev)) document.getElementById(item.prev).innerText = valor;
                if(document.getElementById(item.out)) document.getElementById(item.out).innerText = valor;
            });
        }
    });

    const regMap = [
        { in: 'reg_editNombre', prev: 'reg_prev_nombre' },
        { in: 'reg_editApellido', prev: 'reg_prev_apellido' },
        { in: 'reg_editNacionalidad', prev: 'reg_prev_nacionalidad' }
    ];

    regMap.forEach(item => {
        const input = document.getElementById(item.in);
        if (input) {
            input.addEventListener('input', (e) => {
                const valor = e.target.value.toUpperCase();
                if(document.getElementById(item.prev)) document.getElementById(item.prev).innerText = valor;
            });
        }
    });

    const dniInput = document.getElementById('editDni');
    if (dniInput) {
        dniInput.addEventListener('input', (e) => {
            const valorFormateado = formatearDNIConPuntos(e.target.value);
            if(document.getElementById('prev_documento')) document.getElementById('prev_documento').innerText = valorFormateado;
            if(document.getElementById('f_documento')) document.getElementById('f_documento').innerText = valorFormateado;
        });
    }

    const regDniInput = document.getElementById('reg_editDni');
    if (regDniInput) {
        regDniInput.addEventListener('input', (e) => {
            const valorFormateado = formatearDNIConPuntos(e.target.value);
            if(document.getElementById('reg_prev_documento')) document.getElementById('reg_prev_documento').innerText = valorFormateado;
        });
    }

    const sexoInput = document.getElementById('editSexo');
    if (sexoInput) {
        sexoInput.addEventListener('change', (e) => {
            const valor = e.target.value.toUpperCase();
            if(document.getElementById('prev_sexo')) document.getElementById('prev_sexo').innerText = valor;
            if(document.getElementById('f_sexo')) document.getElementById('f_sexo').innerText = valor;
        });
    }

    const inputFoto = document.getElementById('editFoto');
    if (inputFoto) {
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const fotoURL = URL.createObjectURL(file);
                datosUsuario.fotoURL = fotoURL; 
                
                if(document.getElementById('prev_foto_img')) document.getElementById('prev_foto_img').src = fotoURL;
                if(document.getElementById('dniFoto')) {
                    document.getElementById('dniFoto').src = fotoURL;
                    document.getElementById('dniFoto').style.display = 'block';
                }
                if(document.getElementById('det_foto')) document.getElementById('det_foto').src = fotoURL;
                if(document.getElementById('f_foto_img')) document.getElementById('f_foto_img').src = fotoURL;
            }
        });
    }

    const regFotoInput = document.getElementById('reg_editFoto');
    if (regFotoInput) {
        regFotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const fotoURL = URL.createObjectURL(file);
                if(document.getElementById('reg_prev_foto_img')) document.getElementById('reg_prev_foto_img').src = fotoURL;
            }
        });
    }

    // =========================================================
    // LÓGICA PARA ACTUALIZAR EL DORSO EN TIEMPO REAL
    // =========================================================
    const liveUpdateDorsoTramites = () => {
        const tempDatos = { ...datosUsuario };
        if(document.getElementById('editDni')) tempDatos.dni = document.getElementById('editDni').value;
        if(document.getElementById('editNombre')) tempDatos.nombre = document.getElementById('editNombre').value;
        if(document.getElementById('editApellido')) tempDatos.apellido = document.getElementById('editApellido').value;
        if(document.getElementById('editSexo')) tempDatos.sexo = document.getElementById('editSexo').value;
        if(document.getElementById('editDomicilio')) tempDatos.domicilio = document.getElementById('editDomicilio').value.toUpperCase();
        
        const fNac = leerFechaTriplet('editNacimiento');
        if (fNac) tempDatos.fechaNacimiento = fNac;
        
        const fEmi = leerFechaTriplet('editEmision');
        if (fEmi) {
            tempDatos.fechaEmision = fEmi;
            const y = parseInt(document.getElementById('editEmision_anio').value);
            if (!isNaN(y)) {
                const d = document.getElementById('editEmision_dia').value;
                const m = document.getElementById('editEmision_mes').value;
                tempDatos.fechaVencimiento = `${d.padStart(2,'0')} ${m.toUpperCase()}/ ${m.toUpperCase()} ${y + 15}`;
            }
        }
        
        document.querySelectorAll('[id="dni_domicilio_val"]').forEach(el => el.innerText = tempDatos.domicilio);
        document.querySelectorAll('[id="dni_mrz"]').forEach(el => el.innerText = generarMRZ(tempDatos));
    };

    ['editDni', 'editNombre', 'editApellido', 'editSexo', 'editDomicilio', 
     'editNacimiento_dia', 'editNacimiento_mes', 'editNacimiento_anio',
     'editEmision_dia', 'editEmision_mes', 'editEmision_anio'].forEach(id => {
         const el = document.getElementById(id);
         if(el) el.addEventListener('input', liveUpdateDorsoTramites);
     });

    const liveUpdateDorsoRegistro = () => {
        const tempDatos = { ...datosUsuario };
        if(document.getElementById('reg_editDni')) tempDatos.dni = document.getElementById('reg_editDni').value;
        if(document.getElementById('reg_editNombre')) tempDatos.nombre = document.getElementById('reg_editNombre').value;
        if(document.getElementById('reg_editApellido')) tempDatos.apellido = document.getElementById('reg_editApellido').value;
        if(document.getElementById('reg_editSexo')) tempDatos.sexo = document.getElementById('reg_editSexo').value;
        if(document.getElementById('reg_editDomicilio')) tempDatos.domicilio = document.getElementById('reg_editDomicilio').value.toUpperCase();
        
        const fNac = leerFechaTriplet('reg_editNacimiento');
        if (fNac) tempDatos.fechaNacimiento = fNac;
        
        const fEmi = leerFechaTriplet('reg_editEmision');
        if (fEmi) {
            tempDatos.fechaEmision = fEmi;
            const y = parseInt(document.getElementById('reg_editEmision_anio').value);
            if (!isNaN(y)) {
                const d = document.getElementById('reg_editEmision_dia').value;
                const m = document.getElementById('reg_editEmision_mes').value;
                tempDatos.fechaVencimiento = `${d.padStart(2,'0')} ${m.toUpperCase()}/ ${m.toUpperCase()} ${y + 15}`;
            }
        }
        
        document.querySelectorAll('[id="dni_domicilio_val"]').forEach(el => el.innerText = tempDatos.domicilio);
        document.querySelectorAll('[id="dni_mrz"]').forEach(el => el.innerText = generarMRZ(tempDatos));
    };

    ['reg_editDni', 'reg_editNombre', 'reg_editApellido', 'reg_editSexo', 'reg_editDomicilio', 
     'reg_editNacimiento_dia', 'reg_editNacimiento_mes', 'reg_editNacimiento_anio',
     'reg_editEmision_dia', 'reg_editEmision_mes', 'reg_editEmision_anio'].forEach(id => {
         const el = document.getElementById(id);
         if(el) el.addEventListener('input', liveUpdateDorsoRegistro);
     });
}

setTimeout(vincularLivePreview, 100);

const canvas = document.getElementById('firma-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let dibujando = false;

if (canvas) {
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    canvas.addEventListener('mousedown', iniciarDibujo);
    canvas.addEventListener('mousemove', dibujar);
    canvas.addEventListener('mouseup', detenerDibujo);
    canvas.addEventListener('mouseout', detenerDibujo);

    canvas.addEventListener('touchstart', iniciarDibujoTouch);
    canvas.addEventListener('touchmove', dibujarTouch);
    canvas.addEventListener('touchend', detenerDibujo);
}

const regCanvas = document.getElementById('reg_firma_canvas');
const regCtx = regCanvas ? regCanvas.getContext('2d') : null;
let regDibujando = false;

if (regCanvas) {
    regCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    regCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    regCanvas.addEventListener('mousedown', iniciarDibujoRegistro);
    regCanvas.addEventListener('mousemove', dibujarRegistro);
    regCanvas.addEventListener('mouseup', detenerDibujoRegistro);
    regCanvas.addEventListener('mouseout', detenerDibujoRegistro);

    regCanvas.addEventListener('touchstart', iniciarDibujoTouchRegistro);
    regCanvas.addEventListener('touchmove', dibujarTouchRegistro);
    regCanvas.addEventListener('touchend', detenerDibujoRegistro);
}

function iniciarDibujoRegistro(e) { regDibujando = true; regCtx.beginPath(); regCtx.moveTo(e.offsetX, e.offsetY); }
function dibujarRegistro(e) { if (!regDibujando) return; regCtx.lineTo(e.offsetX, e.offsetY); regCtx.stroke(); }
function iniciarDibujoTouchRegistro(e) {
    regDibujando = true;
    const rect = regCanvas.getBoundingClientRect();
    regCtx.beginPath();
    regCtx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
}
function dibujarTouchRegistro(e) {
    if (!regDibujando) return;
    const rect = regCanvas.getBoundingClientRect();
    regCtx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    regCtx.stroke();
}
function detenerDibujoRegistro() { regDibujando = false; regCtx.closePath(); }

window.limpiarFirmaRegistro = function() {
    if(!regCanvas) return;
    regCtx.clearRect(0, 0, regCanvas.width, regCanvas.height);
    if(document.getElementById('reg_prev_firma_img')) document.getElementById('reg_prev_firma_img').src = "";
};

window.guardarFirmaRegistro = function() {
    if(!regCanvas) return;
    const dataURL = regCanvas.toDataURL('image/png');
    if(document.getElementById('reg_prev_firma_img')) document.getElementById('reg_prev_firma_img').src = dataURL;
};

function ajustarCanvas() {
    if(!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    if (regCanvas) {
        regCanvas.width = regCanvas.offsetWidth;
        regCanvas.height = regCanvas.offsetHeight;
        regCtx.lineWidth = 2;
        regCtx.lineCap = 'round';
        regCtx.strokeStyle = '#000000';
    }
}

function iniciarDibujo(e) { dibujando = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); }
function dibujar(e) { if (!dibujando) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); }
function iniciarDibujoTouch(e) {
    dibujando = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
}
function dibujarTouch(e) {
    if (!dibujando) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    ctx.stroke();
}
function detenerDibujo() { dibujando = false; ctx.closePath(); }

window.limpiarFirma = function() {
    if(!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(document.getElementById('prev_firma_img')) document.getElementById('prev_firma_img').src = "";
    if(document.getElementById('f_firma_final')) document.getElementById('f_firma_final').src = "";
};

window.guardarFirma = function() {
    if(!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    if(document.getElementById('prev_firma_img')) document.getElementById('prev_firma_img').src = dataURL;
    if(document.getElementById('f_firma_final')) document.getElementById('f_firma_final').src = dataURL;
};

window.movePrevPhoto = function(direction) {
    const el = document.getElementById('prev_foto_img');
    if (!el) return;
    const step = 2; 
    const style = window.getComputedStyle(el);
    const top = parseFloat(style.top) || 0;
    const left = parseFloat(style.left) || 0;
    let newTop = top;
    let newLeft = left;
    if (direction === 'up') newTop = top - step;
    if (direction === 'down') newTop = top + step;
    if (direction === 'left') newLeft = left - step;
    if (direction === 'right') newLeft = left + step;
    el.style.top = newTop + 'px';
    el.style.left = newLeft + 'px';

    const final = document.getElementById('f_foto_img');
    if (final) { final.style.top = el.style.top; final.style.left = el.style.left; }

    datosUsuario.fotoPos = { top: newTop, left: newLeft };
};

function aplicarPosicionFoto() {
    if (!datosUsuario || !datosUsuario.fotoPos) return;
    const prev = document.getElementById('prev_foto_img');
    const final = document.getElementById('f_foto_img');
    if (prev) { prev.style.top = datosUsuario.fotoPos.top + 'px'; prev.style.left = datosUsuario.fotoPos.left + 'px'; }
    if (final) { final.style.top = datosUsuario.fotoPos.top + 'px'; final.style.left = datosUsuario.fotoPos.left + 'px'; }
}

window.changePrevPhotoSize = function(action) {
    const el = document.getElementById('prev_foto_img');
    if (!el) return;
    const step = 8; 
    const curW = parseFloat(el.style.width) || parseFloat(window.getComputedStyle(el).width) || 80;
    const curH = parseFloat(el.style.height) || parseFloat(window.getComputedStyle(el).height) || 100;
    const ratio = curW / curH || 0.8;
    let newW = curW + (action === 'increase' ? step : -step);
    if (newW < 40) newW = 40;
    const newH = Math.round(newW / ratio);
    el.style.width = newW + 'px';
    el.style.height = newH + 'px';
    const final = document.getElementById('f_foto_img');
    if (final) { final.style.width = newW + 'px'; final.style.height = newH + 'px'; }
    datosUsuario.fotoSize = { width: newW, height: newH };
};

function aplicarPosicionYTamanoFoto() {
    if (!datosUsuario) return;
    const prev = document.getElementById('prev_foto_img');
    const final = document.getElementById('f_foto_img');
    if (datosUsuario.fotoPos && prev) {
        prev.style.top = datosUsuario.fotoPos.top + 'px'; prev.style.left = datosUsuario.fotoPos.left + 'px';
    }
    if (datosUsuario.fotoPos && final) {
        final.style.top = datosUsuario.fotoPos.top + 'px'; final.style.left = datosUsuario.fotoPos.left + 'px';
    }
    if (datosUsuario.fotoSize && prev) {
        prev.style.width = datosUsuario.fotoSize.width + 'px'; prev.style.height = datosUsuario.fotoSize.height + 'px';
    }
    if (datosUsuario.fotoSize && final) {
        final.style.width = datosUsuario.fotoSize.width + 'px'; final.style.height = datosUsuario.fotoSize.height + 'px';
    }
}

function actualizarInterfazDatos() {
    if (document.getElementById('dashNombre')) {
        const rawNombre = datosUsuario.nombre || '';
        let nombreCapitalizado = '';
        if (rawNombre.trim()) {
            nombreCapitalizado = rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1).toLowerCase();
        } else {
            nombreCapitalizado = 'Usuario';
        }
        document.getElementById('dashNombre').innerText = nombreCapitalizado;
    }

    if(document.getElementById('docDniNum')) document.getElementById('docDniNum').innerText = formatearDNIConPuntos(datosUsuario.dni);
    if(document.getElementById('docVencimiento')) document.getElementById('docVencimiento').innerText = datosUsuario.fechaVencimiento;
    if(document.getElementById('docNombrePila')) document.getElementById('docNombrePila').innerText = datosUsuario.nombre;
    if(document.getElementById('docApellidoPila')) document.getElementById('docApellidoPila').innerText = datosUsuario.apellido;

    if(document.getElementById('prev_documento')) document.getElementById('prev_documento').innerText = formatearDNIConPuntos(datosUsuario.dni);
    if(document.getElementById('prev_nombre')) document.getElementById('prev_nombre').innerText = datosUsuario.nombre;
    if(document.getElementById('prev_apellido')) document.getElementById('prev_apellido').innerText = datosUsuario.apellido;
    if(document.getElementById('prev_sexo')) document.getElementById('prev_sexo').innerText = datosUsuario.sexo;
    if(document.getElementById('prev_nacionalidad')) document.getElementById('prev_nacionalidad').innerText = datosUsuario.nacionalidad;
    if(document.getElementById('prev_ejemplar')) document.getElementById('prev_ejemplar').innerText = datosUsuario.ejemplar;
    if(document.getElementById('prev_nacimiento')) document.getElementById('prev_nacimiento').innerText = datosUsuario.fechaNacimiento;
    if(document.getElementById('prev_emision')) document.getElementById('prev_emision').innerText = datosUsuario.fechaEmision;
    if(document.getElementById('prev_vencimiento')) document.getElementById('prev_vencimiento').innerText = datosUsuario.fechaVencimiento;
    if(document.getElementById('prev_tramite')) document.getElementById('prev_tramite').innerText = datosUsuario.tramite;

    // Poblar formulario de Trámites
    if(document.getElementById('editNombre')) {
        document.getElementById('editNombre').value = datosUsuario.nombre;
        document.getElementById('editApellido').value = datosUsuario.apellido;
        document.getElementById('editDni').value = datosUsuario.dni.replace(/\./g, '');
        document.getElementById('editSexo').value = datosUsuario.sexo;
        if(document.getElementById('editNacionalidad')) document.getElementById('editNacionalidad').value = datosUsuario.nacionalidad;
        if(document.getElementById('editLugarNac')) document.getElementById('editLugarNac').value = datosUsuario.lugarNac;
        if(document.getElementById('editDomicilio')) document.getElementById('editDomicilio').value = datosUsuario.domicilio;
        if(document.getElementById('editEjemplar')) document.getElementById('editEjemplar').value = datosUsuario.ejemplar;
        poblarFechaTriplet('editNacimiento', datosUsuario.fechaNacimiento);
        poblarFechaTriplet('editEmision', datosUsuario.fechaEmision);
        if(document.getElementById('editTramite')) document.getElementById('editTramite').value = datosUsuario.tramite;
    }

    if(document.getElementById('fullNameHeader')) document.getElementById('fullNameHeader').innerText = `${datosUsuario.nombre} ${datosUsuario.apellido}`;
    
    // Poblar DNI Final
    if(document.getElementById('f_apellido')) document.getElementById('f_apellido').innerText = datosUsuario.apellido;
    if(document.getElementById('f_nombre')) document.getElementById('f_nombre').innerText = datosUsuario.nombre;
    if(document.getElementById('f_sexo')) document.getElementById('f_sexo').innerText = datosUsuario.sexo;
    if(document.getElementById('f_nacionalidad')) document.getElementById('f_nacionalidad').innerText = datosUsuario.nacionalidad;
    if(document.getElementById('f_ejemplar')) document.getElementById('f_ejemplar').innerText = datosUsuario.ejemplar;
    if(document.getElementById('f_nacimiento')) document.getElementById('f_nacimiento').innerText = datosUsuario.fechaNacimiento;
    if(document.getElementById('f_emision')) document.getElementById('f_emision').innerText = datosUsuario.fechaEmision;
    if(document.getElementById('f_vencimiento')) document.getElementById('f_vencimiento').innerText = datosUsuario.fechaVencimiento;
    if(document.getElementById('f_documento')) document.getElementById('f_documento').innerText = datosUsuario.dni;
    if(document.getElementById('f_tramite')) document.getElementById('f_tramite').innerText = datosUsuario.tramite;
    
    // Dorso: Domicilio y Código MRZ
    document.querySelectorAll('[id="dni_domicilio_val"]').forEach(el => el.innerText = datosUsuario.domicilio);
    document.querySelectorAll('[id="dni_mrz"]').forEach(el => el.innerText = generarMRZ(datosUsuario));

    // Ver Detalles
    if(document.getElementById('det_dni')) document.getElementById('det_dni').innerText = datosUsuario.dni.replace(/\./g, '');
    if(document.getElementById('det_tramite')) document.getElementById('det_tramite').innerText = datosUsuario.tramite.split('\n')[0]; 
    if(document.getElementById('det_emision')) document.getElementById('det_emision').innerText = ParsearFechaParaDetalle(datosUsuario.fechaEmision);
    if(document.getElementById('det_vencimiento')) document.getElementById('det_vencimiento').innerText = ParsearFechaParaDetalle(datosUsuario.fechaVencimiento);
    if(document.getElementById('det_nombre')) document.getElementById('det_nombre').innerText = datosUsuario.nombre;
    if(document.getElementById('det_apellido')) document.getElementById('det_apellido').innerText = datosUsuario.apellido;
    if(document.getElementById('det_sexo')) document.getElementById('det_sexo').innerText = datosUsuario.sexo;
    if(document.getElementById('det_nacimiento')) document.getElementById('det_nacimiento').innerText = ParsearFechaParaDetalle(datosUsuario.fechaNacimiento);
    if(document.getElementById('det_nacionalidad')) document.getElementById('det_nacionalidad').innerText = datosUsuario.nacionalidad.substring(0, 2);
    if(document.getElementById('det_lugarNac')) document.getElementById('det_lugarNac').innerText = datosUsuario.lugarNac;
    if(document.getElementById('det_domicilio')) document.getElementById('det_domicilio').innerText = datosUsuario.domicilio;

    if (datosUsuario.fotoURL) {
        if(document.getElementById('dniFoto')) {
            document.getElementById('dniFoto').src = datosUsuario.fotoURL;
            document.getElementById('dniFoto').style.display = 'block';
        }
        if(document.getElementById('f_foto_img')) {
            document.getElementById('f_foto_img').src = datosUsuario.fotoURL;
        }
        if(document.getElementById('prev_foto_img')) document.getElementById('prev_foto_img').src = datosUsuario.fotoURL;
        if(document.getElementById('reg_prev_foto_img')) document.getElementById('reg_prev_foto_img').src = datosUsuario.fotoURL;
        if(document.getElementById('det_foto')) document.getElementById('det_foto').src = datosUsuario.fotoURL;
    } else {
        if (document.getElementById('dniFoto')) document.getElementById('dniFoto').style.display = 'none';
    }
    
    aplicarPosicionYTamanoFoto();
}

function ParsearFechaParaDetalle(fechaTexto) {
    if(!fechaTexto) return "";
    const meses = { 'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04', 'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12', 'JAN': '01', 'APR': '04', 'AUG': '08', 'DEC': '12' };
    const matchDia = fechaTexto.match(/\d{1,2}/);
    const matchAno = fechaTexto.match(/\d{4}/);
    const matchMes = fechaTexto.toUpperCase().match(/[A-Z]{3}/);

    if (matchDia && matchAno && matchMes && meses[matchMes[0]]) {
        let dia = matchDia[0].padStart(2, '0');
        return `${dia}/${meses[matchMes[0]]}/${matchAno[0]}`;
    }
    return fechaTexto; 
}

function actualizarFechaHora() {
    let fechaTransformada = ParsearFechaParaDetalle(datosUsuario.fechaEmision);
    
    if(document.getElementById('lblUltimaAct')) {
        const partes = fechaTransformada.split('/');
        if(partes.length === 3) {
            fechaTransformada = `${parseInt(partes[0])}/${parseInt(partes[1])}/${partes[2]}`;
        }
        document.getElementById('lblUltimaAct').innerText = `Última actualización: ${fechaTransformada}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const last = (() => { try { return sessionStorage.getItem('lastScreen'); } catch(e) { return null; } })();
    if (last) mostrar(last);
    else mostrar('dashboard');
});
