import { useContext, useMemo, useState } from 'react'
import { InventoryContext } from '../context/InventoryContext'
import ProductCard from '../components/ProductCard'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

const categories = ['Cadena', 'Balines', 'Pulseras', 'Herrajes', 'Aretes']
const materials = ['Oro Laminado', 'Plata 925']

function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, actionLoading } = useContext(InventoryContext)
  const [form, setForm] = useState({
    name: '',
    category: 'Cadena',
    material: 'Oro Laminado',
    cost: '',
    price: '',
    stock: '',
    image: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const inventoryByMaterial = useMemo(
    () =>
      materials.map((material) => ({
        material,
        items: products.filter((product) => product.material === material && product.stock > 0)
      })),
    [products]
  )

  const outOfStockProducts = useMemo(
    () => products.filter((product) => product.stock === 0),
    [products]
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      material: product.material,
      cost: product.cost.toString(),
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image
    })
    setEditingId(product.id)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name || !form.cost || !form.price || !form.stock) {
      setToast({ message: 'Completa todos los campos antes de guardar.', type: 'error' })
      return
    }

    const productData = {
      name: form.name,
      category: form.category,
      material: form.material,
      cost: Number(form.cost),
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image
    }

    try {
      if (editingId) {
        await updateProduct(editingId, productData)
        setToast({ message: 'Producto actualizado exitosamente', type: 'success' })
        setEditingId(null)
      } else {
        await addProduct(productData)
        setToast({ message: 'Producto agregado exitosamente', type: 'success' })
      }
      setForm({ name: '', category: 'Cadena', material: 'Oro Laminado', cost: '', price: '', stock: '', image: '' })
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
    }
  }

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId)
      setToast({ message: 'Producto eliminado', type: 'success' })
      setConfirmDelete(null)
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
    }
  }

  const showConfirmDelete = (productId, productName) => {
    setConfirmDelete({ productId, productName })
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm({ name: '', category: 'Cadena', material: 'Oro Laminado', cost: '', price: '', stock: '', image: '' })
  }

  return (
    <section className="page-view">
      <div className="page-header">
        <div>
          <p className="section-label">Inventario</p>
        </div>
      </div>

      <div className="inventory-layout">
        <aside className="form-sidebar sticky-form">
          <div className="panel-card form-card">
            <h3>{editingId ? 'Editar producto' : 'Agregar producto'}</h3>
            <form onSubmit={handleSubmit} className="product-form">
              <label>
                Nombre
                <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre del producto" />
              </label>

              <label>
                Categoría
                <select name="category" value={form.category} onChange={handleChange}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Material
                <select name="material" value={form.material} onChange={handleChange}>
                  {materials.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Costo
                <input
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="Valor de costo"
                />
              </label>

              <label>
                Precio venta
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Precio de venta"
                />
              </label>

              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="Cantidad en inventario"
                />
              </label>

              <label>
                URLs de imágenes
                <textarea
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="/img/Plata5.jpg, /img/Plata5-2.jpg"
                  rows="2"
                />
              </label>

              <button type="submit" className="primary-button" disabled={actionLoading}>
                {actionLoading ? '⏳ Guardando...' : editingId ? 'Actualizar producto' : 'Añadir producto'}
              </button>

              {editingId && (
                <button type="button" className="tertiary-button" onClick={handleCancel}>
                  Cancelar edición
                </button>
              )}
            </form>
          </div>
        </aside>

        <div className="products-container">
          {inventoryByMaterial.map((section) => (
            <div key={section.material} className="inventory-section">
              <h3>{section.material}</h3>
              {section.items.length > 0 ? (
                <div className="cards-grid">
                  {section.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      showConfirmDelete={showConfirmDelete}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              ) : (
                <p className="empty-state">No hay productos en esta sección.</p>
              )}
            </div>
          ))}

          {outOfStockProducts.length > 0 && (
            <div className="inventory-section out-of-stock-section">
              <h3>Sin stock</h3>
              <div className="cards-grid">
                {outOfStockProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showConfirmDelete={showConfirmDelete}
                    loading={actionLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {inventoryByMaterial.every((section) => section.items.length === 0) && outOfStockProducts.length === 0 && (
            <div className="empty-inventory">
              <p className="empty-state">No hay productos todavía. Agrega uno usando el formulario.</p>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Estás seguro de que deseas eliminar "${confirmDelete.productName}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(confirmDelete.productId)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          isDanger
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  )
}

export default InventoryPage
