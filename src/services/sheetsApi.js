const API_ENDPOINT = import.meta.env.VITE_SHEETS_API_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
const TOKEN_SEGURIDAD = 'ALPEZ_2026_SEGURIDAD_99'

if (!API_ENDPOINT || API_ENDPOINT.includes('YOUR_DEPLOYMENT_ID')) {
    console.warn('VITE_SHEETS_API_URL no está configurada o usa el valor de plantilla. Revisa .env')
}

async function fetchJson(url) {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) {
        throw new Error(`Error al conectar con Google Sheets: ${response.status}`)
    }

    const text = await response.text()
    if (!text) {
        return {}
    }
    if (text.startsWith('ERROR')) {
        throw new Error(text)
    }

    try {
        return JSON.parse(text)
    } catch (error) {
        throw new Error(`Respuesta inválida de Google Sheets: ${text}`)
    }
}

async function postAction(payload) {
    if (!API_ENDPOINT || API_ENDPOINT.includes('YOUR_DEPLOYMENT_ID')) {
        throw new Error('VITE_SHEETS_API_URL no está configurada correctamente en .env')
    }

    // Cambiamos el modo y el Content-Type para evitar errores de CORS con Google Scripts
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        mode: 'cors', // Google requiere cors para seguir redirecciones
        headers: {
            // Usar text/plain es el "truco" para que Google Apps Script acepte el POST sin fallos de CORS
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ token: TOKEN_SEGURIDAD, ...payload })
    })

    // Google Script siempre responde con una redirección (302), fetch la sigue automáticamente
    const text = await response.text()

    if (text.includes('ERROR_TOKEN')) {
        throw new Error('Token de seguridad inválido')
    }

    if (text.startsWith('ERROR')) {
        throw new Error(text)
    }

    return text
}

export async function fetchSheetsData() {
    const url = `${API_ENDPOINT}?token=${TOKEN_SEGURIDAD}`
    return fetchJson(url)
}

export async function createProduct(product) {
    const id = product.id || `${product.name}-${Date.now()}`
    return postAction({
        tipo: 'NUEVO_PRODUCTO',
        id,
        nombre: product.name,
        categoria: product.category,
        costo: product.cost,
        precio: product.price,
        stock: product.stock,
        imagen: product.image || '',
        material: product.material
    })
}

export async function editProduct(product) {
    return postAction({
        tipo: 'EDITAR_PRODUCTO',
        id: product.id,
        nombre: product.name,
        categoria: product.category,
        costo: product.cost,
        precio: product.price,
        stock: product.stock,
        imagen: product.image || '',
        material: product.material
    })
}

export async function deleteProduct(id) {
    return postAction({
        tipo: 'ELIMINAR_PRODUCTO',
        id
    })
}

export async function createSale(sale) {
    const detalles = sale.items.map((item) => ({ id: item.product.id, cantidad: item.quantity }))
    const productos = sale.items.map((item) => `${item.quantity}x ${item.product.name}`).join(' | ')
    const costoTotal = sale.items.reduce((sum, item) => sum + item.product.cost * item.quantity, 0)

    return postAction({
        tipo: 'VENTA',
        fecha: sale.date,
        cliente: sale.clientName,
        telefono: sale.contact,
        productos,
        total: sale.total,
        costoTotal,
        detalles
    })
}

export async function createExpense(expense) {
    return postAction({
        tipo: 'NUEVO_GASTO',
        fecha: expense.date,
        descripcion: expense.description,
        monto: expense.amount
    })
}

export async function closeCycleAndSave(cycle) {
    return postAction({
        tipo: 'CERRAR_CICLO',
        fechaInicio: cycle.fechaInicio,
        fechaFin: cycle.fechaFin,
        costoPedidoNuevo: cycle.costoPedidoNuevo || 0
    })
}
