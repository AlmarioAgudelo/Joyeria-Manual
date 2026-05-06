// 1. LLAVE MAESTRA
const TOKEN_SEGURIDAD = 'ALPEZ_2026_SEGURIDAD_99'

function validarToken(token) {
  return token === TOKEN_SEGURIDAD
}

function normalizarTexto(valor) {
  return String(valor || '').toLowerCase().trim()
}

function leerHoja(sheet) {
  if (!sheet || sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    return []
  }

  const datos = sheet.getDataRange().getValues()
  if (!datos.length) {
    return []
  }

  const headers = datos.shift().map((header) => normalizarTexto(header))
  return datos.map((fila) => {
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = fila[index]
    })
    return obj
  })
}

function parseFechaFlexible(valor) {
  if (valor instanceof Date) {
    return valor
  }

  const texto = String(valor || '').trim()
  if (!texto) {
    return null
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  }

  const partes = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (partes) {
    let year = Number(partes[3])
    if (year < 100) {
      year += 2000
    }
    return new Date(year, Number(partes[2]) - 1, Number(partes[1]))
  }

  const fechaLibre = new Date(texto)
  if (isNaN(fechaLibre.getTime())) {
    return null
  }
  return fechaLibre
}

function formatearFecha(fecha) {
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'dd/MM/yyyy')
}

function formatearMes(fecha) {
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'MM/yyyy')
}

function asegurarColumna(sheet, nombreColumna) {
  const objetivo = normalizarTexto(nombreColumna)
  const lastColumn = sheet.getLastColumn()

  if (lastColumn === 0) {
    sheet.getRange(1, 1).setValue(nombreColumna)
    return 1
  }

  const encabezados = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map((item) => normalizarTexto(item))
  const existente = encabezados.indexOf(objetivo)
  if (existente !== -1) {
    return existente + 1
  }

  sheet.insertColumnAfter(lastColumn)
  sheet.getRange(1, lastColumn + 1).setValue(nombreColumna)
  return lastColumn + 1
}

function asegurarEncabezadosSiVacio(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  }
}

function asegurarHojaHistorial(ss) {
  const headers = [
    'ID_Ciclo',
    'FechaInicio',
    'FechaFin',
    'MesInicio',
    'MesFin',
    'TotalVendido',
    'CostoProductos',
    'GananciaVentas',
    'TotalGastos',
    'CostoPedidoNuevo',
    'CantidadVentas',
    'CantidadGastos'
  ]

  let sheet = ss.getSheetByName('HistorialCiclos')
  if (!sheet) {
    sheet = ss.insertSheet('HistorialCiclos')
  }
  asegurarEncabezadosSiVacio(sheet, headers)
  headers.forEach((header) => asegurarColumna(sheet, header))
  return sheet
}

function obtenerCostoVenta(venta) {
  return Number(venta.costototal || venta.costo_total || venta.costo || 0)
}

function etiquetarFilasConCiclo(sheet, cycleId, indiceColumnaCiclo) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) {
    return
  }

  const cantidadFilas = lastRow - 1
  const valores = sheet.getRange(2, indiceColumnaCiclo, cantidadFilas, 1).getValues()
  let requiereActualizacion = false

  for (let i = 0; i < valores.length; i++) {
    if (!normalizarTexto(valores[i][0])) {
      valores[i][0] = cycleId
      requiereActualizacion = true
    }
  }

  if (requiereActualizacion) {
    sheet.getRange(2, indiceColumnaCiclo, cantidadFilas, 1).setValues(valores)
  }
}

function doGet(e) {
  const token = e.parameter.token
  if (!validarToken(token)) {
    return ContentService.createTextOutput('ERROR_TOKEN').setMimeType(ContentService.MimeType.TEXT)
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const respuesta = {}

  const sheetInventario = ss.getSheetByName('Inventario')
  const sheetVentas = ss.getSheetByName('Ventas')
  const sheetGastos = ss.getSheetByName('Gastos')
  const sheetHistorial = asegurarHojaHistorial(ss)

  if (sheetVentas) asegurarColumna(sheetVentas, 'ID_Ciclo')
  if (sheetGastos) asegurarColumna(sheetGastos, 'ID_Ciclo')

  respuesta.inventario = sheetInventario ? leerHoja(sheetInventario) : []
  respuesta.ventas = sheetVentas ? leerHoja(sheetVentas) : []
  respuesta.gastos = sheetGastos ? leerHoja(sheetGastos) : []
  respuesta.historialciclos = sheetHistorial ? leerHoja(sheetHistorial) : []

  return ContentService.createTextOutput(JSON.stringify(respuesta)).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const payloadText = e.postData && e.postData.contents ? e.postData.contents : '{}'
  let params = {}

  try {
    params = JSON.parse(payloadText)
  } catch (error) {
    return ContentService.createTextOutput('ERROR_PARSE').setMimeType(ContentService.MimeType.TEXT)
  }

  if (!validarToken(params.token)) {
    return ContentService.createTextOutput('ERROR_TOKEN').setMimeType(ContentService.MimeType.TEXT)
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet()

  if (params.tipo === 'VENTA') {
    const sheetVentas = ss.getSheetByName('Ventas')
    const sheetInv = ss.getSheetByName('Inventario')
    if (!sheetVentas || !sheetInv) {
      return ContentService.createTextOutput('ERROR_HOJA').setMimeType(ContentService.MimeType.TEXT)
    }

    asegurarColumna(sheetVentas, 'ID_Ciclo')
    sheetVentas.appendRow([
      params.fecha,
      params.cliente,
      params.telefono,
      params.productos,
      params.total,
      params.costoTotal,
      ''
    ])

    const invData = sheetInv.getDataRange().getValues()
    params.detalles.forEach((item) => {
      for (let i = 1; i < invData.length; i++) {
        if (invData[i][0] == item.id) {
          const actual = Number(invData[i][5]) || 0
          sheetInv.getRange(i + 1, 6).setValue(Math.max(0, actual - Number(item.cantidad)))
          break
        }
      }
    })

    return ContentService.createTextOutput('OK_VENTA').setMimeType(ContentService.MimeType.TEXT)
  }

  if (params.tipo === 'NUEVO_GASTO') {
    const sheetGastos = ss.getSheetByName('Gastos')
    if (!sheetGastos) {
      return ContentService.createTextOutput('ERROR_HOJA').setMimeType(ContentService.MimeType.TEXT)
    }

    asegurarColumna(sheetGastos, 'ID_Ciclo')
    sheetGastos.appendRow([params.fecha, params.descripcion, params.monto, ''])
    return ContentService.createTextOutput('OK_GASTO').setMimeType(ContentService.MimeType.TEXT)
  }

  if (params.tipo === 'NUEVO_PRODUCTO') {
    const sheetInv = ss.getSheetByName('Inventario')
    if (!sheetInv) {
      return ContentService.createTextOutput('ERROR_HOJA').setMimeType(ContentService.MimeType.TEXT)
    }

    sheetInv.appendRow([params.id, params.nombre, params.categoria, params.costo, params.precio, params.stock, params.imagen, params.material])
    return ContentService.createTextOutput('OK_PRODUCTO').setMimeType(ContentService.MimeType.TEXT)
  }

  if (params.tipo === 'ELIMINAR_PRODUCTO') {
    const sheetInv = ss.getSheetByName('Inventario')
    if (!sheetInv) {
      return ContentService.createTextOutput('ERROR_HOJA').setMimeType(ContentService.MimeType.TEXT)
    }

    const invData = sheetInv.getDataRange().getValues()
    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] == params.id) {
        sheetInv.deleteRow(i + 1)
        return ContentService.createTextOutput('OK_ELIMINADO').setMimeType(ContentService.MimeType.TEXT)
      }
    }
  }

  if (params.tipo === 'EDITAR_PRODUCTO') {
    const sheetInv = ss.getSheetByName('Inventario')
    if (!sheetInv) {
      return ContentService.createTextOutput('ERROR_HOJA').setMimeType(ContentService.MimeType.TEXT)
    }

    const invData = sheetInv.getDataRange().getValues()
    for (let i = 1; i < invData.length; i++) {
      if (invData[i][0] == params.id) {
        sheetInv.getRange(i + 1, 2).setValue(params.nombre)
        sheetInv.getRange(i + 1, 3).setValue(params.categoria)
        sheetInv.getRange(i + 1, 4).setValue(params.costo)
        sheetInv.getRange(i + 1, 5).setValue(params.precio)
        sheetInv.getRange(i + 1, 6).setValue(params.stock)
        sheetInv.getRange(i + 1, 8).setValue(params.material)
        if (params.imagen) {
          sheetInv.getRange(i + 1, 7).setValue(params.imagen)
        }
        return ContentService.createTextOutput('OK_EDITADO').setMimeType(ContentService.MimeType.TEXT)
      }
    }
  }

  if (params.tipo === 'CERRAR_CICLO') {
    const sheetVentas = ss.getSheetByName('Ventas')
    const sheetGastos = ss.getSheetByName('Gastos')
    const sheetHistorial = asegurarHojaHistorial(ss)

    if (!sheetVentas || !sheetGastos) {
      return ContentService.createTextOutput('ERROR_HOJA').setMimeType(ContentService.MimeType.TEXT)
    }

    const idColVentas = asegurarColumna(sheetVentas, 'ID_Ciclo')
    const idColGastos = asegurarColumna(sheetGastos, 'ID_Ciclo')
    const cycleId = 'ciclo-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Date.now()

    etiquetarFilasConCiclo(sheetVentas, cycleId, idColVentas)
    etiquetarFilasConCiclo(sheetGastos, cycleId, idColGastos)

    const ventasData = leerHoja(sheetVentas).filter((fila) => normalizarTexto(fila.id_ciclo) === normalizarTexto(cycleId))
    const gastosData = leerHoja(sheetGastos).filter((fila) => normalizarTexto(fila.id_ciclo) === normalizarTexto(cycleId))

    const fechas = []
    ventasData.forEach((fila) => {
      const fecha = parseFechaFlexible(fila.fecha)
      if (fecha) fechas.push(fecha)
    })
    gastosData.forEach((fila) => {
      const fecha = parseFechaFlexible(fila.fecha)
      if (fecha) fechas.push(fecha)
    })

    const fechaInicio = fechas.length ? new Date(Math.min.apply(null, fechas.map((fecha) => fecha.getTime()))) : new Date()
    const fechaFin = fechas.length ? new Date(Math.max.apply(null, fechas.map((fecha) => fecha.getTime()))) : new Date()

    const totalVendido = ventasData.reduce((sum, fila) => sum + (Number(fila.total) || 0), 0)
    const costoProductos = ventasData.reduce((sum, fila) => sum + obtenerCostoVenta(fila), 0)
    const totalGastos = gastosData.reduce((sum, fila) => sum + (Number(fila.monto) || 0), 0)
    const gananciaVentas = totalVendido - costoProductos
    const costoPedidoNuevo = Number(params.costoPedidoNuevo) || 0

    sheetHistorial.appendRow([
      cycleId,
      formatearFecha(fechaInicio),
      formatearFecha(fechaFin),
      formatearMes(fechaInicio),
      formatearMes(fechaFin),
      totalVendido,
      costoProductos,
      gananciaVentas,
      totalGastos,
      costoPedidoNuevo,
      ventasData.length,
      gastosData.length
    ])

    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK_CICLO_CERRADO',
      cycleId,
      totalVendido,
      costoProductos,
      gananciaVentas,
      totalGastos,
      costoPedidoNuevo
    })).setMimeType(ContentService.MimeType.JSON)
  }

  return ContentService.createTextOutput('ERROR_TIPO').setMimeType(ContentService.MimeType.TEXT)
}
