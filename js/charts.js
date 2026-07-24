// Gráfico de composición de cartera (torta/donut en SVG puro, sin librerías)

const PALETA_COMPOSICION = ['#c9a15f', '#5b7f9e', '#7a9169', '#b5754b', '#7c5f7c', '#3f7a74', '#a6763f', '#5f8fa6'];

// containerId: id del div destino
// items: [{ nombre, valor }]
// opts: { titulo, etiquetaCentro }
function renderComposicion(containerId, items, opts) {
  const cont = document.getElementById(containerId);
  const total = items.reduce((s, it) => s + it.valor, 0);
  if (!cont || !items.length || total <= 0) return;

  const titulo = (opts && opts.titulo) || 'Composición de cartera';
  const etiquetaCentro = (opts && opts.etiquetaCentro) || 'Posiciones';

  const cx = 110, cy = 110, rOuter = 100, rInner = 60;
  let anguloActual = -90; // arranca arriba
  const paths = [];
  const legendItems = [];

  items.forEach((it, i) => {
    const pct = it.valor / total;
    const color = PALETA_COMPOSICION[i % PALETA_COMPOSICION.length];
    const anguloBarrido = pct * 360;
    const anguloFin = anguloActual + anguloBarrido;

    paths.push(arcoSVG(cx, cy, rOuter, rInner, anguloActual, anguloFin, color));

    legendItems.push(`
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        <span class="legend-name">${it.nombre}</span>
        <span class="legend-pct">${(pct * 100).toFixed(1)}%</span>
      </div>
    `);

    anguloActual = anguloFin;
  });

  cont.innerHTML = `
    <h2 class="section-title">${titulo}</h2>
    <div class="chart-card">
      <svg viewBox="0 0 220 220" class="donut" role="img" aria-label="${titulo}">
        ${paths.join('')}
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="donut-center-label">${etiquetaCentro}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-center-value">${items.length}</text>
      </svg>
      <div class="legend">${legendItems.join('')}</div>
    </div>
  `;
}

// Genera un <path> de anillo (donut) entre dos ángulos, en grados
function arcoSVG(cx, cy, rOuter, rInner, anguloInicio, anguloFin, color) {
  // Si es una sola posición (100%), evitamos el bug de path degenerado usando un círculo casi completo
  const barrido = anguloFin - anguloInicio;
  if (barrido >= 359.999) anguloFin = anguloInicio + 359.999;

  const pOuterStart = puntoEnCirculo(cx, cy, rOuter, anguloInicio);
  const pOuterEnd = puntoEnCirculo(cx, cy, rOuter, anguloFin);
  const pInnerStart = puntoEnCirculo(cx, cy, rInner, anguloFin);
  const pInnerEnd = puntoEnCirculo(cx, cy, rInner, anguloInicio);
  const largeArc = (anguloFin - anguloInicio) % 360 > 180 ? 1 : 0;

  const d = [
    `M ${pOuterStart.x} ${pOuterStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${pOuterEnd.x} ${pOuterEnd.y}`,
    `L ${pInnerStart.x} ${pInnerStart.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${pInnerEnd.x} ${pInnerEnd.y}`,
    'Z'
  ].join(' ');

  return `<path d="${d}" fill="${color}" class="donut-slice"></path>`;
}

function puntoEnCirculo(cx, cy, r, anguloGrados) {
  const rad = (anguloGrados * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Gráfico de evolución en el tiempo (línea + área), SVG puro
function renderEvolucion(containerId, historial) {
  const cont = document.getElementById(containerId);
  if (!cont || !historial || historial.length < 2) return;

  const w = 760, h = 220, padL = 60, padR = 16, padT = 16, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const valores = historial.map(p => p.total);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const margen = (max - min) * 0.1 || max * 0.05;
  const yMin = min - margen;
  const yMax = max + margen;

  const x = i => padL + (i / (historial.length - 1)) * plotW;
  const y = v => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const linePts = historial.map((p, i) => `${x(i)},${y(p.total)}`).join(' ');
  const areaPts = `${padL},${padT + plotH} ${linePts} ${x(historial.length - 1)},${padT + plotH}`;

  // Gridlines horizontales (3) con etiqueta de valor
  const gridlines = [0, 0.5, 1].map(f => {
    const val = yMin + f * (yMax - yMin);
    const yy = padT + plotH - f * plotH;
    return `
      <line x1="${padL}" y1="${yy}" x2="${w - padR}" y2="${yy}" class="chart-grid"></line>
      <text x="${padL - 10}" y="${yy + 4}" text-anchor="end" class="chart-axis-label">${fmtUSDCompacto(val)}</text>
    `;
  }).join('');

  // Etiquetas de fecha: primera, última y ~2 intermedias
  const nEtiquetas = Math.min(4, historial.length);
  const idxEtiquetas = Array.from({ length: nEtiquetas }, (_, k) => Math.round(k * (historial.length - 1) / (nEtiquetas - 1)));
  const xLabels = [...new Set(idxEtiquetas)].map(i => `
    <text x="${x(i)}" y="${h - 6}" text-anchor="middle" class="chart-axis-label">${fmtFechaCorta(historial[i].fecha)}</text>
  `).join('');

  const ultimo = historial[historial.length - 1];

  cont.innerHTML = `
    <h2 class="section-title">Evolución del patrimonio total</h2>
    <svg viewBox="0 0 ${w} ${h}" class="evolucion-chart" role="img" aria-label="Evolución del patrimonio en el tiempo">
      ${gridlines}
      <polygon points="${areaPts}" class="evolucion-area"></polygon>
      <polyline points="${linePts}" class="evolucion-linea"></polyline>
      <circle cx="${x(historial.length - 1)}" cy="${y(ultimo.total)}" r="4" class="evolucion-punto"></circle>
      ${xLabels}
    </svg>
  `;
}

function fmtUSDCompacto(n) {
  return 'US$' + (n / 1000).toFixed(1) + 'k';
}

// Acorta "2026-07-22T00:00" o "22/07/2026" a "22/07"
function fmtFechaCorta(fecha) {
  if (!fecha) return '';
  if (fecha.includes('-') && fecha.includes('T')) {
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}`;
  }
  const partes = fecha.split('/');
  return partes.length >= 2 ? `${partes[0]}/${partes[1]}` : fecha;
}
