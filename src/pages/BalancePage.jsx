import { useContext, useEffect, useMemo, useState } from 'react'
import { InventoryContext } from '../context/InventoryContext'
import Toast from '../components/Toast'
import { formatCurrency } from '../utils/formatters'

function BalancePage() {
  const {
    products,
    sales,
    expenses,
    allSales,
    allExpenses,
    cycleHistory,
    closeCycle,
    calculateAvailableMoney,
    actionLoading,
    addExpense
  } = useContext(InventoryContext)
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [toast, setToast] = useState(null)
  const [showCloseCycleModal, setShowCloseCycleModal] = useState(false)
  const [newOrderCost, setNewOrderCost] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState('')

  const investment = useMemo(
    () => products.reduce((sum, product) => sum + product.cost * product.stock, 0),
    [products]
  )

  const totalSales = useMemo(
    () => sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0),
    [sales]
  )

  const totalCosts = useMemo(
    () =>
      sales.reduce(
        (sum, sale) => sum + (Number(sale.cost || sale.costo || sale.costoTotal) || 0),
        0
      ),
    [sales]
  )

  const profit = totalSales - totalCosts

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  )

  const availableMoney = useMemo(() => calculateAvailableMoney(), [sales, expenses])

  const filteredCycles = useMemo(() => cycleHistory, [cycleHistory])

  useEffect(() => {
    if (!filteredCycles.length) {
      setSelectedCycleId('')
      return
    }

    const stillExists = filteredCycles.some((cycle) => cycle.id === selectedCycleId)
    if (!stillExists) {
      setSelectedCycleId('')
    }
  }, [filteredCycles, selectedCycleId])

  const selectedCycle = useMemo(
    () => filteredCycles.find((cycle) => cycle.id === selectedCycleId) || null,
    [filteredCycles, selectedCycleId]
  )

  const monthNames = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ]

  const monthNameFrom = (raw) => {
    if (!raw) return ''
    const text = String(raw)
    const mmyyyy = text.match(/^(\d{1,2})\/(\d{4})$/)
    if (mmyyyy) {
      const m = Number(mmyyyy[1])
      return monthNames[m - 1] || text
    }
    const ddmmyyyy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (ddmmyyyy) {
      const m = Number(ddmmyyyy[2])
      return monthNames[m - 1] || text
    }
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (iso) {
      const m = Number(iso[2])
      return monthNames[m - 1] || text
    }
    return text
  }

  const formatCycleLabel = (cycle) => {
    const start = monthNameFrom(cycle.mesInicio || cycle.fechaInicio)
    const end = monthNameFrom(cycle.mesFin || cycle.fechaFin)
    if (start && end) return `${start} → ${end}`
    if (start) return start
    if (end) return end
    return cycle.id || ''
  }

  const selectedCycleSales = useMemo(() => {
    if (!selectedCycle) return []
    return allSales.filter((sale) => sale.cycleId === selectedCycle.id)
  }, [allSales, selectedCycle])

  const selectedCycleExpenses = useMemo(() => {
    if (!selectedCycle) return []
    return allExpenses.filter((expense) => expense.cycleId === selectedCycle.id)
  }, [allExpenses, selectedCycle])

  const handleAddExpense = async (event) => {
    event.preventDefault()
    if (!expenseDescription || !expenseAmount) {
      setToast({ message: 'Completa el gasto antes de registrarlo.', type: 'error' })
      return
    }

    const expense = {
      description: expenseDescription,
      amount: Number(expenseAmount),
      date: new Date().toLocaleDateString()
    }

    try {
      await addExpense(expense)
      setToast({ message: `Gasto de ${formatCurrency(expenseAmount)} registrado`, type: 'success' })
      setExpenseDescription('')
      setExpenseAmount('')
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
    }
  }

  const handleCloseCycle = async () => {
    if (!newOrderCost || Number(newOrderCost) <= 0) {
      setToast({ message: 'Ingresa el costo del nuevo pedido', type: 'error' })
      return
    }

    try {
      await closeCycle(Number(newOrderCost))
      setToast({ message: 'Ciclo cerrado y guardado en historial', type: 'success' })
      setShowCloseCycleModal(false)
      setNewOrderCost('')
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
    }
  }

  return (
    <section className="page-view">
      <div className="page-header">
        <div>
          <p className="section-label">Balance financiero</p>
        </div>
      </div>

      <div className="balance-grid">
        <div className="balance-metrics">
          <div className="metric-card">
            <h3>Inversión</h3>
            <p className="metric-value">{formatCurrency(investment)}</p>
          </div>

          <div className="metric-card">
            <h3>Ventas actuales</h3>
            <p className="metric-value">{formatCurrency(totalSales)}</p>
          </div>

          <div className="metric-card">
            <h3>Costos actuales</h3>
            <p className="metric-value">{formatCurrency(totalCosts)}</p>
          </div>

          <div className="metric-card profit">
            <h3>Ganancia actual</h3>
            <p className="metric-value">{formatCurrency(profit)}</p>
          </div>

          <div className="metric-card">
            <h3>Gastos actuales</h3>
            <p className="metric-value">{formatCurrency(totalExpenses)}</p>
          </div>

          <div className="metric-card available">
            <h3>Dinero disponible</h3>
            <p className="metric-value">{formatCurrency(availableMoney)}</p>
            <div className="metric-actions">
              <button className="primary-button" onClick={() => setShowCloseCycleModal(true)} disabled={actionLoading}>
                {actionLoading ? '⏳ Procesando...' : 'Cerrar ciclo y guardar'}
              </button>
            </div>
          </div>
        </div>

        <aside className="expenses-panel">
          <div className="panel-card">
            <h3>Registrar gasto</h3>
            <form onSubmit={handleAddExpense} className="expense-form">
              <label>
                Descripción
                <input
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Ej: Materiales, Transporte..."
                />
              </label>

              <label>
                Monto
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                />
              </label>

              <button type="submit" className="primary-button">
                Añadir gasto
              </button>
            </form>

            <div className="expenses-list">
              <h4>Gastos actuales</h4>
              {expenses.length === 0 ? (
                <p className="empty-state">No hay gastos registrados en el ciclo actual.</p>
              ) : (
                <ul>
                  {expenses.map((expense) => (
                    <li key={expense.id}>
                      <span>{expense.description}</span>
                      <span>{formatCurrency(expense.amount)}</span>
                      <small>{expense.date}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="panel-card balance-history-card">
        <div className="history-header">
          <div>
            <h3>Historial de balance</h3>
            <p className="section-description">
              Elige un ciclo de la lista para ver el resumen, las ventas y los gastos.
            </p>
          </div>
        </div>

        {filteredCycles.length > 0 && (
          <div className="cycle-picker-list">
            {filteredCycles.map((cycle) => (
              <button
                key={cycle.id}
                type="button"
                className={`cycle-picker-item ${selectedCycle?.id === cycle.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedCycleId(cycle.id)}
              >
                <strong>{formatCycleLabel(cycle)}</strong>
                <span>{cycle.id}</span>
              </button>
            ))}
          </div>
        )}

        {filteredCycles.length === 0 ? (
          <p className="empty-state">No hay ciclos que coincidan con esos meses.</p>
        ) : (
          <div className="cycles-container">
            {selectedCycle ? (
              <div className="cycle-detail-card">
                <div className="cycle-detail-top">
                  <div>
                    <h3>Detalle del ciclo</h3>
                    <p>{selectedCycle.id}</p>
                    <p>{formatCycleLabel(selectedCycle)}</p>
                  </div>
                  <div className="cycle-summary-grid">
                    <div>
                      <span>Ventas</span>
                      <strong>{formatCurrency(selectedCycle.totalVendido)}</strong>
                    </div>
                    <div>
                      <span>Costos</span>
                      <strong>{formatCurrency(selectedCycle.costoProductos)}</strong>
                    </div>
                    <div>
                      <span>Ganancia</span>
                      <strong>{formatCurrency(selectedCycle.gananciaVentas)}</strong>
                    </div>
                    <div>
                      <span>Gastos</span>
                      <strong>{formatCurrency(selectedCycle.totalGastos)}</strong>
                    </div>
                    <div>
                      <span>Pedido nuevo</span>
                      <strong>{formatCurrency(selectedCycle.costoPedidoNuevo)}</strong>
                    </div>
                  </div>
                </div>

                <div className="cycle-lists">
                  <div className="cycle-list-panel">
                    <h4>Ventas del ciclo</h4>
                    {selectedCycleSales.length === 0 ? (
                      <p className="empty-state">No se encontraron ventas para este ciclo.</p>
                    ) : (
                      <ul className="cycle-list">
                        {selectedCycleSales.map((sale) => (
                          <li key={sale.id}>
                            <div>
                              <strong>{sale.clientName}</strong>
                              <p>{sale.productsLabel}</p>
                              <small>{sale.date} {sale.time}</small>
                            </div>
                            <strong>{formatCurrency(sale.total)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="cycle-list-panel">
                    <h4>Gastos del ciclo</h4>
                    {selectedCycleExpenses.length === 0 ? (
                      <p className="empty-state">No se encontraron gastos para este ciclo.</p>
                    ) : (
                      <ul className="cycle-list">
                        {selectedCycleExpenses.map((expense) => (
                          <li key={expense.id}>
                            <div>
                              <strong>{expense.description}</strong>
                              <small>{expense.date}</small>
                            </div>
                            <strong>{formatCurrency(expense.amount)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="empty-state">Selecciona un ciclo para ver sus detalles.</p>
            )}
          </div>
        )}
      </div>

      {showCloseCycleModal && (
        <div className="modal-overlay" onClick={() => setShowCloseCycleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cerrar ciclo de inventario</h3>
            <p>Este cierre marcará las ventas y gastos sin `ID_Ciclo` como parte del ciclo actual y guardará el resumen en historial.</p>
            <label>
              Costo del nuevo pedido
              <input
                type="number"
                min="0"
                step="0.01"
                value={newOrderCost}
                onChange={(e) => setNewOrderCost(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <div className="modal-actions">
              <button className="primary-button" onClick={handleCloseCycle} disabled={actionLoading}>
                {actionLoading ? '⏳ Guardando...' : 'Confirmar cierre'}
              </button>
              <button className="tertiary-button" onClick={() => setShowCloseCycleModal(false)} disabled={actionLoading}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  )
}

export default BalancePage
