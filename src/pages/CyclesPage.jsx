import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { InventoryContext } from '../context/InventoryContext'
import { formatCurrency } from '../utils/formatters'

function CyclesPage() {
  const navigate = useNavigate()
  const { cycleHistory } = useContext(InventoryContext)

  return (
    <section className="page-view">
      <div className="page-header">
        <div>
          <p className="section-label">Ciclos anteriores</p>
          <h2>Historial de ciclos de inventario</h2>
          <p className="section-description">
            Consulta los resúmenes de ciclos anteriores: ventas, ganancias y gastos.
          </p>
        </div>
      </div>

      {cycleHistory.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p>No hay ciclos registrados aún.</p>
          <button className="primary-button" onClick={() => navigate('/balance')} style={{ marginTop: '16px' }}>
            Ir a Balance
          </button>
        </div>
      ) : (
        <div className="cycles-container">
          <div className="cycles-table-wrapper">
            <table className="cycles-table">
              <thead>
                <tr>
                  <th>Ciclo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Total Vendido</th>
                  <th>Costos</th>
                  <th>Ganancia</th>
                  <th>Gastos</th>
                  <th>Costo Pedido</th>
                </tr>
              </thead>
              <tbody>
                {cycleHistory.map((cycle) => (
                  <tr key={cycle.id}>
                    <td>{cycle.id}</td>
                    <td>{cycle.mesInicio || cycle.fechaInicio}</td>
                    <td>{cycle.mesFin || cycle.fechaFin}</td>
                    <td>{formatCurrency(cycle.totalVendido)}</td>
                    <td>{formatCurrency(cycle.costoProductos)}</td>
                    <td className="profit">{formatCurrency(cycle.gananciaVentas)}</td>
                    <td>{formatCurrency(cycle.totalGastos)}</td>
                    <td>{formatCurrency(cycle.costoPedidoNuevo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="primary-button" onClick={() => navigate('/balance')} style={{ marginTop: '24px' }}>
            Volver a Balance
          </button>
        </div>
      )}
    </section>
  )
}

export default CyclesPage
