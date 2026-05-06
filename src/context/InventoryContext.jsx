import { createContext, useEffect, useMemo, useState } from 'react'
import {
  fetchSheetsData,
  createProduct as apiCreateProduct,
  editProduct as apiEditProduct,
  deleteProduct as apiDeleteProduct,
  createSale as apiCreateSale,
  createExpense as apiCreateExpense,
  closeCycleAndSave as apiCloseCycleAndSave
} from '../services/sheetsApi'

export const InventoryContext = createContext(null)

function normalizeMaterial(rawMaterial) {
  const value = String(rawMaterial || '').trim()
  const lower = value.toLowerCase()

  if (lower.includes('plata')) {
    return 'Plata 925'
  }
  if (lower.includes('oro')) {
    return 'Oro Laminado'
  }

  return value || 'Otros'
}

function mapSheetProduct(raw) {
  return {
    id: String(raw.id || ''),
    name: String(raw.nombre || ''),
    category: String(raw.categoria || ''),
    material: normalizeMaterial(raw.material),
    cost: Number(raw.costo) || 0,
    price: Number(raw.precio) || 0,
    stock: Number(raw.stock) || 0,
    image: String(raw.imagen || '')
  }
}

function mapSheetSale(raw) {
  return {
    id: `${raw.fecha || ''}-${raw.cliente || ''}-${Math.random()}`,
    date: formatDateShort(raw.fecha || raw.date || ''),
    time: String(raw.hora || ''),
    clientName: String(raw.cliente || ''),
    contact: String(raw.telefono || ''),
    productsLabel: String(raw.productos || ''),
    total: Number(raw.total) || 0,
    cost: Number(raw.costo || raw.costototal || raw.costo_total || raw.costoTotal || 0) || 0,
    cycleId: String(raw.id_ciclo || '').trim(),
    items: raw.items || []
  }
}

function mapSheetExpense(raw) {
  return {
    id: `${raw.fecha || ''}-${raw.descripcion || ''}-${Math.random()}`,
    date: formatDateShort(raw.fecha || raw.date || ''),
    description: String(raw.descripcion || ''),
    amount: Number(raw.monto) || 0,
    cycleId: String(raw.id_ciclo || '').trim()
  }
}

function mapSheetCycle(raw) {
  return {
    id: String(raw.id_ciclo || raw.id || ''),
    fechaInicio: formatDateShort(raw.fecha_inicio || raw.fechainicio || ''),
    fechaFin: formatDateShort(raw.fecha_fin || raw.fechafin || ''),
    mesInicio: formatMonthName(raw.mes_inicio || raw.mesinicio || '' , raw.fecha_inicio || raw.fechainicio || ''),
    mesFin: formatMonthName(raw.mes_fin || raw.mesfin || '' , raw.fecha_fin || raw.fechafin || ''),
    totalVendido: Number(raw.total_vendido || raw.totalvendido || 0),
    gananciaVentas: Number(raw.ganancia_ventas || raw.gananciaventas || 0),
    costoProductos: Number(raw.costo_productos || raw.costoproductos || 0),
    totalGastos: Number(raw.total_gastos || raw.totalgastos || 0),
    costoPedidoNuevo: Number(raw.costo_pedido_nuevo || raw.costopedidonuevo || 0)
  }
}

// Helpers para normalizar fechas
function tryParseDate(value) {
  if (!value && value !== 0) return null
  if (value instanceof Date) return value
  const s = String(value || '').trim()
  if (!s) return null
  // ISO o Date.parse
  const iso = Date.parse(s)
  if (!isNaN(iso)) return new Date(iso)
  // dd/MM/yyyy
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (dmy) {
    let year = Number(dmy[3])
    if (year < 100) year += 2000
    return new Date(year, Number(dmy[2]) - 1, Number(dmy[1]))
  }
  // MM/yyyy
  const my = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (my) {
    return new Date(Number(my[2]), Number(my[1]) - 1, 1)
  }
  return null
}

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function formatDateShort(raw) {
  const d = tryParseDate(raw)
  if (!d) return String(raw || '')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const monthNamesCapital = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

function formatMonthName(rawMonthField, rawDateField) {
  const s = String(rawMonthField || '').trim()
  if (s) {
    const m = s.match(/^(\d{1,2})\/(\d{4})$/)
    if (m) {
      const month = Number(m[1])
      return monthNamesCapital[month - 1] || s
    }
  }
  const d = tryParseDate(rawDateField || '')
  if (d) return monthNamesCapital[d.getMonth()]
  return String(rawMonthField || rawDateField || '')
}

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([])
  const [rawSales, setRawSales] = useState([])
  const [rawExpenses, setRawExpenses] = useState([])
  const [cycleHistory, setCycleHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const currentSales = rawSales.filter((sale) => !sale.cycleId)
  const currentExpenses = rawExpenses.filter((expense) => !expense.cycleId)
  const historicalSales = rawSales.filter((sale) => sale.cycleId)
  const historicalExpenses = rawExpenses.filter((expense) => expense.cycleId)

  const refreshData = async () => {
    const data = await fetchSheetsData()
    setProducts((data.inventario || []).map(mapSheetProduct))
    setRawSales((data.ventas || []).map(mapSheetSale))
    setRawExpenses((data.gastos || []).map(mapSheetExpense))
    setCycleHistory((data.historialciclos || []).map(mapSheetCycle))
  }

  useEffect(() => {
    async function loadData() {
      try {
        await refreshData()
      } catch (error) {
        console.warn('No se pudo cargar datos de Google Sheets:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const addProduct = async (product) => {
    const id = product.id || `${product.name}-${Date.now()}`
    try {
      setActionLoading(true)
      await apiCreateProduct({ ...product, id })
      setProducts((prev) => [...prev, { ...product, id }])
    } finally {
      setActionLoading(false)
    }
  }

  const updateProduct = async (productId, updatedData) => {
    try {
      setActionLoading(true)
      await apiEditProduct({ id: productId, ...updatedData })
      setProducts((prev) =>
        prev.map((product) => (product.id === productId ? { ...product, ...updatedData } : product))
      )
    } finally {
      setActionLoading(false)
    }
  }

  const deleteProduct = async (productId) => {
    try {
      setActionLoading(true)
      await apiDeleteProduct(productId)
      setProducts((prev) => prev.filter((product) => product.id !== productId))
    } finally {
      setActionLoading(false)
    }
  }

  const decreaseStock = (productId, quantity) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, stock: Math.max(0, product.stock - quantity) } : product
      )
    )
  }

  const addSale = async (sale) => {
    try {
      setActionLoading(true)
      await apiCreateSale(sale)
      const saleCost = Number(sale.cost || sale.costo || sale.costoTotal || sale.costTotal || 0)
      setRawSales((prev) => [
        ...prev,
        {
          ...sale,
          cost: saleCost,
          cycleId: '',
          id: `${sale.date || ''}-${sale.clientName || ''}-${Date.now()}`
        }
      ])
    } finally {
      setActionLoading(false)
    }
  }

  const addExpense = async (expense) => {
    await apiCreateExpense(expense)
    setRawExpenses((prev) => [
      ...prev,
      { ...expense, cycleId: '', id: `${expense.date}-${expense.description}-${Date.now()}` }
    ])
  }

  const calculateAvailableMoney = () => {
    const totalSales = currentSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
    const totalExpenses = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    return totalSales - totalExpenses
  }

  const closeCycle = async (costOfNewOrder) => {
    try {
      setActionLoading(true)
      await apiCloseCycleAndSave({
        costoPedidoNuevo: costOfNewOrder
      })
      await refreshData()
    } finally {
      setActionLoading(false)
    }
  }

  const value = useMemo(
    () => ({
      products,
      sales: currentSales,
      expenses: currentExpenses,
      allSales: rawSales,
      allExpenses: rawExpenses,
      historicalSales,
      historicalExpenses,
      cycles: cycleHistory,
      cycleHistory,
      loading,
      actionLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      decreaseStock,
      addSale,
      addExpense,
      closeCycle,
      calculateAvailableMoney,
      refreshData
    }),
    [products, currentSales, currentExpenses, rawSales, rawExpenses, historicalSales, historicalExpenses, cycleHistory, loading, actionLoading]
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
