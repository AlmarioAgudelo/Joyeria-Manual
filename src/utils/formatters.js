const moneyFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function formatCurrency(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) {
    return '$0'
  }

  return `$${moneyFormatter.format(Math.round(amount))}`
}
