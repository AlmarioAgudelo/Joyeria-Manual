function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Eliminar', cancelText = 'Cancelar', isDanger = false }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button onClick={onCancel} className="btn-cancel">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`btn-confirm ${isDanger ? 'danger' : ''}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
