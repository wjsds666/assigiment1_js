/**
 * Shopping Cart Business Logic Module.
 *
 * Implemented with clean separation of concerns:
 * - Data contract (CartItem) is defined explicitly at the top.
 * - Validation logic is isolated from the main flow.
 * - Pure functions with zero console I/O for direct unit testability.
 */

/**
 * Factory function representing the Cart Item data structure.
 * Every element inside the `cart` array strictly conforms to this contract.
 *
 * @param {number} productId - The product ID
 * @param {number} quantity - Quantity of the product
 * @param {number} unitPrice - Unit price of the product
 * @returns {{productId: number, quantity: number, totalPrice: number}}
 */
export function createCartItem (productId, quantity, unitPrice) {
  const numericId = Number(productId)
  const numericQty = Number(quantity)
  return {
    productId: numericId,
    quantity: numericQty,
    totalPrice: Math.round(numericQty * unitPrice * 100) / 100
  }
}

/**
 * Creates and returns a new empty shopping cart array.
 * @returns {Array<{productId: number, quantity: number, totalPrice: number}>}
 */
export function createCart () {
  return []
}

/**
 * Finds a product in the product catalog by ID.
 * @param {Array<Object>} products
 * @param {number} productId
 * @returns {Object|undefined}
 */
export function findProduct (products, productId) {
  return products.find((p) => p.id === Number(productId))
}

/**
 * Finds an item in the cart by product ID.
 * @param {Array<Object>} cart
 * @param {number} productId
 * @returns {Object|undefined}
 */
export function findItemInCart (cart, productId) {
  return cart.find((item) => item.productId === Number(productId))
}

/**
 * Validates quantity and stock availability before adding to cart.
 * Throws explicit errors if conditions are violated.
 */
function validateAddition (cart, product, productId, quantity) {
  const numericQty = Number(quantity)

  // 1. Quantity must be a positive integer
  if (!Number.isInteger(numericQty) || numericQty <= 0) {
    throw new Error(`Invalid quantity: "${quantity}". Quantity must be a positive integer.`)
  }

  // 2. Product must exist
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found.`)
  }

  // 3. (Current in cart + Requested) must not exceed available stock
  const existingItem = findItemInCart(cart, productId)
  const currentInCart = existingItem ? existingItem.quantity : 0
  const totalRequested = currentInCart + numericQty

  if (totalRequested > product.quantityAvailable) {
    throw new Error(
      `Insufficient stock for "${product.name}". Available: ${product.quantityAvailable}, in cart: ${currentInCart}, requested addition: ${numericQty}.`
    )
  }
}

/**
 * Adds a product to the cart.
 * If already in cart, increases its quantity and updates totalPrice.
 * Otherwise, appends a new CartItem.
 *
 * @param {Array<Object>} cart
 * @param {Array<Object>} products
 * @param {number} productId
 * @param {number} quantity
 * @returns {Array<Object>}
 */
export function addToCart (cart, products, productId, quantity) {
  const product = findProduct(products, productId)

  // Validate before making any changes
  validateAddition(cart, product, productId, quantity)

  const existingItem = findItemInCart(cart, productId)

  if (existingItem) {
    // Accumulate quantity and recalculate subtotal
    existingItem.quantity += Number(quantity)
    existingItem.totalPrice = Math.round(existingItem.quantity * product.price * 100) / 100
  } else {
    // Append new CartItem
    cart.push(createCartItem(productId, quantity, product.price))
  }

  return cart
}

/**
 * Calculates the total cost of all items currently in the cart.
 *
 * @param {Array<Object>} cart
 * @returns {number}
 */
export function calculateTotal (cart) {
  const rawSum = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  return Math.round(rawSum * 100) / 100
}

/**
 * Completes the checkout process with two-phase transactional safety:
 * 1. Pre-validation: ensure all items are available before mutating any state.
 * 2. Single-pass mutation: deduct inventory, accumulate total, and generate receipt items.
 *
 * @param {Array<Object>} cart
 * @param {Array<Object>} products
 * @returns {{total: number, itemsPurchased: Array<Object>}}
 */
export function checkout (cart, products) {
  if (!cart || cart.length === 0) {
    throw new Error('Cannot checkout with an empty cart.')
  }

  // Phase 1: Pre-validation loop for transactional safety (prevent partial deductions)
  for (const item of cart) {
    const product = findProduct(products, item.productId)
    if (!product || item.quantity > product.quantityAvailable) {
      throw new Error(`Cannot checkout: insufficient inventory for product ID ${item.productId}.`)
    }
  }

  // Phase 2: Mutation and receipt aggregation
  let rawTotal = 0
  const itemsPurchased = []

  for (const item of cart) {
    const product = findProduct(products, item.productId)
    product.quantityAvailable -= item.quantity
    rawTotal += item.totalPrice
    itemsPurchased.push({ ...item })
  }

  // Reset cart after purchase
  cart.length = 0

  return {
    total: Math.round(rawTotal * 100) / 100,
    itemsPurchased
  }
}
