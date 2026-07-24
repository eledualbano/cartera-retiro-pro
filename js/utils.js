// Utilidades de formato y agrupación

function fmtUSD(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);
}

function fmtPct(n) {
  const v = n || 0;
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function pctClass(n) {
  return (n || 0) >= 0 ? 'gain' : 'loss';
}

// Agrupa las posiciones de la cartera por instrumento
function agruparCartera(cartera) {
  const grupos = {};
  (cartera || []).forEach(pos => {
    const key = pos.instrumento;
    if (!grupos[key]) {
      grupos[key] = {
        instrumento: key,
        cantidad: 0,
        invertidoUSD: 0,
        aportado: 0,
        valuacionMercado: 0,
        valorActual: pos.valorActual
      };
    }
    const g = grupos[key];
    g.cantidad += pos.cantidad;
    g.invertidoUSD += pos.invertidoUSD;
    g.aportado += pos.aportado;
    g.valuacionMercado += pos.valuacionMercado;
    g.valorActual = pos.valorActual; // se queda con el más reciente
  });

  return Object.values(grupos)
    .map(g => ({
      ...g,
      rendimientoPct: g.invertidoUSD > 0 ? ((g.valuacionMercado - g.invertidoUSD) / g.invertidoUSD) * 100 : 0
    }))
    .sort((a, b) => b.valuacionMercado - a.valuacionMercado);
}

// Agrupa las tenencias de Acciones/CEDEARs por ticker
function agruparAcciones(acciones) {
  const grupos = {};
  (acciones || []).forEach(pos => {
    const key = pos.ticker;
    if (!grupos[key]) {
      grupos[key] = {
        ticker: key,
        cantidad: 0,
        invertidoUSD: 0,
        valuacionUSD: 0,
        valorActualUSD: pos.valorActualUSD,
        mercado: pos.mercado
      };
    }
    const g = grupos[key];
    g.cantidad += pos.cantidad;
    g.invertidoUSD += pos.invertidoUSD;
    g.valuacionUSD += pos.valuacionUSD;
    g.valorActualUSD = pos.valorActualUSD;
    if (pos.mercado) g.mercado = pos.mercado;
  });

  return Object.values(grupos)
    .map(g => ({
      ...g,
      rendimientoPct: g.invertidoUSD > 0 ? ((g.valuacionUSD - g.invertidoUSD) / g.invertidoUSD) * 100 : 0
    }))
    .sort((a, b) => b.valuacionUSD - a.valuacionUSD);
}
