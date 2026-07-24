(async () => {
  const app = document.getElementById('app');
  const tickerTrack = document.getElementById('tickerTrack');

  try {
    const data = await getData();

    renderKPIs(data);
    renderEvolucion('evolucionWrap', data.historial);
    const gruposOns = renderTablaOns(data.cartera);
    renderTicker(gruposOns.concat(agruparAcciones(data.acciones).map(a => ({
      instrumento: a.ticker, rendimientoPct: a.rendimientoPct
    }))));

    renderComposicion('composicionOnsWrap', gruposOns.map(g => ({ nombre: g.instrumento, valor: g.valuacionMercado })), {
      titulo: 'Composición · ONs',
      etiquetaCentro: 'Instrumentos'
    });

    const gruposAcc = renderTablaAcciones(data.acciones);
    if (gruposAcc.length) {
      renderComposicion('composicionAccWrap', gruposAcc.map(g => ({ nombre: g.ticker, valor: g.valuacionUSD })), {
        titulo: 'Composición · Acciones/CEDEARs',
        etiquetaCentro: 'Tickers'
      });
    }
  } catch (e) {
    app.innerHTML = `<div class="state-error">No se pudo cargar la cartera.<br>${e}</div>`;
  }

  function renderKPIs(data) {
    const rentClass = pctClass(data.rentabilidad);
    const tieneAcciones = data.acciones && data.acciones.length;
    const rentAccClass = pctClass(data.accionesRentabilidad);

    const patrimonioTotal = data.patrimonio + (tieneAcciones ? data.accionesPatrimonio : 0);
    const invertidoTotal = data.invertido + (tieneAcciones ? data.accionesInvertido : 0);
    const rendimientoTotal = invertidoTotal > 0 ? ((patrimonioTotal - invertidoTotal) / invertidoTotal) * 100 : 0;
    const rentTotalClass = pctClass(rendimientoTotal);

    app.innerHTML = `
      <div class="hero">
        <div class="hero-label">Patrimonio total</div>
        <div class="hero-value">${fmtUSD(patrimonioTotal)}</div>
        <div class="hero-sub">
          <span>ONs ${fmtUSD(data.patrimonio)}</span>
          ${tieneAcciones ? `<span>· Acc/CEDEARs ${fmtUSD(data.accionesPatrimonio)}</span>` : ''}
          <span class="${rentTotalClass}">· ${fmtPct(rendimientoTotal)}</span>
        </div>
      </div>

      <div id="evolucionWrap"></div>

      <div class="kpis">
        <div class="kpi"><div class="kpi-label">Patrimonio ONs</div><div class="kpi-value">${fmtUSD(data.patrimonio)}</div></div>
        <div class="kpi"><div class="kpi-label">Invertido</div><div class="kpi-value">${fmtUSD(data.invertido)}</div></div>
        <div class="kpi"><div class="kpi-label">Aportado</div><div class="kpi-value">${fmtUSD(data.aportado)}</div></div>
        <div class="kpi"><div class="kpi-label">Rendimiento</div><div class="kpi-value ${rentClass}">${fmtPct(data.rentabilidad)}</div></div>
      </div>

      <h2 class="section-title">Cartera ONs · por instrumento</h2>
      <div id="tablaOnsWrap"></div>
      <div id="composicionOnsWrap"></div>

      ${tieneAcciones ? `
        <div class="kpis kpis-secundario">
          <div class="kpi"><div class="kpi-label">Patrimonio Acc/CEDEARs</div><div class="kpi-value">${fmtUSD(data.accionesPatrimonio)}</div></div>
          <div class="kpi"><div class="kpi-label">Invertido</div><div class="kpi-value">${fmtUSD(data.accionesInvertido)}</div></div>
          <div class="kpi"><div class="kpi-label">Rendimiento</div><div class="kpi-value ${rentAccClass}">${fmtPct(data.accionesRentabilidad)}</div></div>
        </div>
        <h2 class="section-title">Acciones / CEDEARs · por ticker</h2>
        <div id="tablaAccWrap"></div>
        <div id="composicionAccWrap"></div>
      ` : ''}
    `;
  }

  function renderTablaOns(cartera) {
    const wrap = document.getElementById('tablaOnsWrap');
    const grupos = agruparCartera(cartera);
    if (!grupos.length) { wrap.innerHTML = '<div class="state-loading">No hay posiciones cargadas.</div>'; return grupos; }

    const totalInvertido = grupos.reduce((s, g) => s + g.invertidoUSD, 0);
    const totalValuacion = grupos.reduce((s, g) => s + g.valuacionMercado, 0);
    const totalRendimiento = totalInvertido > 0 ? ((totalValuacion - totalInvertido) / totalInvertido) * 100 : 0;

    const filas = grupos.map(g => `
      <tr>
        <td class="instrumento">${g.instrumento}</td>
        <td>${g.cantidad.toLocaleString('es-AR')}</td>
        <td>${fmtUSD(g.invertidoUSD)}</td>
        <td>${g.valorActual ? g.valorActual.toFixed(4) : '—'}</td>
        <td>${fmtUSD(g.valuacionMercado)}</td>
        <td class="${pctClass(g.rendimientoPct)}">${fmtPct(g.rendimientoPct)}</td>
      </tr>
    `).join('');

    wrap.innerHTML = `
      <table>
        <thead><tr><th>Instrumento</th><th>Cantidad</th><th>Invertido</th><th>Precio act.</th><th>Valuación</th><th>Rend.</th></tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr><td>Total</td><td></td><td>${fmtUSD(totalInvertido)}</td><td></td><td>${fmtUSD(totalValuacion)}</td><td class="${pctClass(totalRendimiento)}">${fmtPct(totalRendimiento)}</td></tr></tfoot>
      </table>
    `;
    return grupos;
  }

  function renderTablaAcciones(acciones) {
    const wrap = document.getElementById('tablaAccWrap');
    const grupos = agruparAcciones(acciones);
    if (!wrap) return grupos;
    if (!grupos.length) { wrap.innerHTML = '<div class="state-loading">No hay posiciones cargadas.</div>'; return grupos; }

    const totalInvertido = grupos.reduce((s, g) => s + g.invertidoUSD, 0);
    const totalValuacion = grupos.reduce((s, g) => s + g.valuacionUSD, 0);
    const totalRendimiento = totalInvertido > 0 ? ((totalValuacion - totalInvertido) / totalInvertido) * 100 : 0;

    const filas = grupos.map(g => `
      <tr>
        <td class="instrumento">${g.ticker}${g.mercado ? `<span class="ticker-mercado"> · ${g.mercado}</span>` : ''}</td>
        <td>${g.cantidad.toLocaleString('es-AR')}</td>
        <td>${fmtUSD(g.invertidoUSD)}</td>
        <td>${g.valorActualUSD ? fmtUSD(g.valorActualUSD) : '—'}</td>
        <td>${fmtUSD(g.valuacionUSD)}</td>
        <td class="${pctClass(g.rendimientoPct)}">${fmtPct(g.rendimientoPct)}</td>
      </tr>
    `).join('');

    wrap.innerHTML = `
      <table>
        <thead><tr><th>Ticker</th><th>Cantidad</th><th>Invertido</th><th>Precio act.</th><th>Valuación</th><th>Rend.</th></tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr><td>Total</td><td></td><td>${fmtUSD(totalInvertido)}</td><td></td><td>${fmtUSD(totalValuacion)}</td><td class="${pctClass(totalRendimiento)}">${fmtPct(totalRendimiento)}</td></tr></tfoot>
      </table>
    `;
    return grupos;
  }

  function renderTicker(items) {
    if (!items.length) return;
    const html = items.map(it => `
      <span class="ticker-item">${it.instrumento} <span class="${pctClass(it.rendimientoPct)}">${fmtPct(it.rendimientoPct)}</span></span>
    `).join('');
    tickerTrack.innerHTML = html + html;
  }
})();
