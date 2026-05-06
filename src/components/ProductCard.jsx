import { useState } from 'react'
import { formatCurrency } from '../utils/formatters'

function ProductCard({ product, onEdit, onDelete, showConfirmDelete, loading }) {
  const handleDelete = () => {
    showConfirmDelete(product.id, product.name)
  }

  const isOutOfStock = product.stock === 0
  const imageUrl = String(product.image || '').split(',')[0]?.trim() || ''

  return (
    <article className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-image" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none' }}>
        {!imageUrl && <span className="image-fallback">Sin imagen</span>}
        {isOutOfStock && <span className="stock-badge">Sin stock</span>}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category}</p>
        <div className="product-prices">
          <span className="price-label">Venta</span>
          <strong>{formatCurrency(product.price)}</strong>
          <span className="price-label">Costo</span>
          <strong className="cost">{formatCurrency(product.cost)}</strong>
        </div>
        <div className="product-stock">
          <span className="stock-label">Stock:</span>
          <strong>{product.stock} unidades</strong>
        </div>
      </div>
      <div className="product-actions">
        <button className="btn-edit" onClick={() => onEdit(product)} title="Editar producto" disabled={loading}>
          {loading ? '⏳' : '✏️'}
        </button>
        <button className="btn-delete" onClick={handleDelete} title="Eliminar producto" disabled={loading}>
          {loading ? '⏳' : '🗑️'}
        </button>
      </div>
    </article>
  )
}

export default ProductCard
