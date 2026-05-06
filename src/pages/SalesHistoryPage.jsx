import { useContext } from 'react'
import { InventoryContext } from '../context/InventoryContext'
import { formatCurrency } from '../utils/formatters'

function SalesHistoryPage() {
  const { sales } = useContext(InventoryContext)

  const renderSaleItems = (sale) => {
    if (sale.items?.length) {
      return sale.items.map((item, index) => (
        <li key={index}>
          {item.quantity}x {item.product.name} ({item.product.category}) - {formatCurrency(item.salePrice)} c/u
        </li>
      ))
    }

    if (sale.productsLabel) {
      return <li>{sale.productsLabel}</li>
    }

    return <li>Sin detalles de productos</li>
  }

  return (
    <section className="page-view">
      <div className="page-header">
        <div>
          <p className="section-label">Historial de ventas</p>
        </div>
      </div>

      <div className="history-container">
        {sales.length === 0 ? (
          <div className="panel-card">
            <p className="empty-state">No hay ventas registradas todavía.</p>
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="sale-card">
              <div className="sale-header">
                <div className="sale-datetime">
                  <time className="sale-date">{sale.date}</time>
                  <time className="sale-time">{sale.time}</time>
                </div>
                <div className="sale-client">
                  <h4>{sale.clientName}</h4>
                  <p>{sale.contact}</p>
                </div>
              </div>

              <div className="sale-products">
                <h5>Productos vendidos:</h5>
                <ul>{renderSaleItems(sale)}</ul>
              </div>

              <div className="sale-total">
                <strong>Total: {formatCurrency(sale.total)}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default SalesHistoryPage