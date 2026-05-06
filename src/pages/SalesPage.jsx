import { useContext, useEffect, useMemo, useState } from 'react'
import { InventoryContext } from '../context/InventoryContext'
import Toast from '../components/Toast'
import { formatCurrency } from '../utils/formatters'

function SalesPage() {
  const { products, addSale, decreaseStock, actionLoading } = useContext(InventoryContext)
  const [clientName, setClientName] = useState('')
  const [contact, setContact] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState([])
  const [overrideTotal, setOverrideTotal] = useState('')
  const [toast, setToast] = useState(null)

  const availableProducts = useMemo(() => products.filter((product) => product.stock > 0), [products])
  const selectedProduct = availableProducts.find((product) => product.id === selectedProductId)

  useEffect(() => {
    if (!selectedProductId && availableProducts.length > 0) {
      setSelectedProductId(availableProducts[0].id)
    }
  }, [availableProducts, selectedProductId])

  const handleAddToCart = (event) => {
    event.preventDefault()
    if (!selectedProduct || quantity < 1) return

    const alreadyInCart = cart.reduce(
      (sum, item) => (item.product.id === selectedProduct.id ? sum + item.quantity : sum),
      0
    )

    const totalWouldBe = alreadyInCart + Number(quantity)

    if (totalWouldBe > selectedProduct.stock) {
      setToast({
        message: `Solo hay ${selectedProduct.stock} unidades disponibles. Ya tienes ${alreadyInCart} en el carrito.`,
        type: 'error'
      })
      return
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.product.id === selectedProduct.id)
      if (existing) {
        return currentCart.map((item) =>
          item.product.id === selectedProduct.id ? { ...item, quantity: item.quantity + Number(quantity) } : item
        )
      }
      return [...currentCart, { product: selectedProduct, quantity: Number(quantity), salePrice: selectedProduct.price }]
    })
    setQuantity(1)
  }

  const handleItemChange = (productId, field, value) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.product.id !== productId) return item
        if (field === 'quantity') {
          const product = products.find((product) => product.id === productId)
          const qty = Number(value)
          if (product && qty > product.stock) {
            setToast({ message: `No puedes vender más de ${product.stock} unidades.`, type: 'error' })
            return item
          }
          return { ...item, quantity: qty }
        }
        return { ...item, salePrice: Number(value) }
      })
    )
  }

  const handleRemove = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.product.id !== productId))
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
    [cart]
  )

  const finalTotal = overrideTotal ? Number(overrideTotal) : subtotal
  const totalCost = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.product.cost || 0) * item.quantity, 0),
    [cart]
  )

  const handleCompleteSale = async () => {
    if (!clientName || !contact || cart.length === 0) {
      setToast({ message: 'Completa los datos del cliente y agrega al menos un producto.', type: 'error' })
      return
    }

    const now = new Date()
    const sale = {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      clientName,
      contact,
      items: cart,
      total: finalTotal,
      costTotal: totalCost
    }

    try {
      await addSale(sale)
      cart.forEach((item) => {
        decreaseStock(item.product.id, item.quantity)
      })
      setToast({ message: `¡Venta exitosa a ${clientName}!`, type: 'success' })
      setClientName('')
      setContact('')
      setCart([])
      setOverrideTotal('')
    } catch (error) {
      setToast({ message: `Error en venta: ${error.message}`, type: 'error' })
    }
  }

  return (
    <section className="page-view">
      <div className="page-header">
        <div>
          <h2>Venta nueva</h2>
          <p className="section-description">
          </p>
        </div>
      </div>

      <div className="split-grid sales-grid">
        <div className="inventory-panel sales-panel">
          <form className="sales-form" onSubmit={handleAddToCart}>
            <label>
              Nombre del cliente
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre completo" />
            </label>

            <label>
              Contacto
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Número o WhatsApp" />
            </label>

            <label>
              Producto
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                {availableProducts.length === 0 ? (
                  <option value="">No hay productos disponibles</option>
                ) : (
                  availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {product.material}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            <button type="submit" className="primary-button" disabled={!availableProducts.length || actionLoading}>
              {actionLoading ? '⏳ Añadiendo...' : 'Añadir al carrito'}
            </button>
          </form>
        </div>

        <aside className="sidebar-panel sales-summary">
          <div className="panel-card">
            <h3>Carrito de venta</h3>
            {cart.length === 0 ? (
              <p className="empty-state">Agrega productos para ver el detalle de la venta.</p>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <div>
                      <strong>{item.product.name}</strong>
                      <p>{item.product.category} • {item.product.material}</p>
                    </div>
                    <div className="cart-controls">
                      <label>
                        Cantidad
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.product.id, 'quantity', e.target.value)}
                        />
                      </label>
                      <label>
                        Precio unitario
                        <input
                          type="number"
                          min="0"
                          value={item.salePrice}
                          onChange={(e) => handleItemChange(item.product.id, 'salePrice', e.target.value)}
                        />
                      </label>
                      <button type="button" className="tertiary-button" onClick={() => handleRemove(item.product.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="final-summary">
              <label>
                Precio final total
                <input
                  type="number"
                  min="0"
                  placeholder="Dejar vacío usa subtotal"
                  value={overrideTotal}
                  onChange={(e) => setOverrideTotal(e.target.value)}
                />
              </label>

              <div className="totals-row">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div className="totals-row final">
                <span>Total de venta</span>
                <strong>{formatCurrency(finalTotal)}</strong>
              </div>
              <div className="totals-row">
                <span>Costo de la venta</span>
                <strong>{formatCurrency(totalCost)}</strong>
              </div>

              <div className="sale-info">
                <p>
                  Cliente: <strong>{clientName || 'sin nombre'}</strong>
                </p>
                <p>
                  Contacto: <strong>{contact || 'sin contacto'}</strong>
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={handleCompleteSale}
                disabled={!clientName || !contact || cart.length === 0 || actionLoading}
              >
                {actionLoading ? '⏳ Procesando...' : 'Completar venta'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  )
}

export default SalesPage
