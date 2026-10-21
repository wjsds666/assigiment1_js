import { askQuestion, noMoreQuestions } from './askQuestion.js'
import { getInitialProducts } from './products.js'
import {
  createCart,
  addToCart,
  calculateTotal,
  checkout,
  findProduct
} from './cart.js'

/**
 * Formats a number to USD representation ($X.XX).
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency (amount) {
  return `$${amount.toFixed(2)}`
}

/**
 * Displays available fruit catalog in a neat table.
 * @param {Array<Object>} products
 */
function displayCatalog (products) {
  console.log('\n================ Available Products ================')
  console.log('ID | Name   | Price  | In Stock | Description')
  console.log('---+--------+--------+----------+--------------------------------')
  for (const p of products) {
    const id = String(p.id).padEnd(2)
    const name = p.name.padEnd(6)
    const price = formatCurrency(p.price).padEnd(6)
    const stock = String(p.quantityAvailable).padEnd(8)
    console.log(`${id} | ${name} | ${price} | ${stock} | ${p.description}`)
  }
  console.log('====================================================')
}

/**
 * Displays current cart contents and total price.
 * @param {Array<Object>} cart
 * @param {Array<Object>} products
 */
function displayCart (cart, products) {
  console.log('\n---------------- Your Shopping Cart ----------------')
  if (cart.length === 0) {
    console.log('Your cart is currently empty.')
  } else {
    for (const item of cart) {
      const product = findProduct(products, item.productId)
      const name = product ? product.name : `Product #${item.productId}`
      console.log(`- ${name} x ${item.quantity} = ${formatCurrency(item.totalPrice)}`)
    }
    console.log(`Current Total: ${formatCurrency(calculateTotal(cart))}`)
  }
  console.log('----------------------------------------------------')
}

/**
 * Main application loop.
 */
async function main () {
  console.log('====================================================')
  console.log('  Welcome to the Node.js Fruit Shopping Cart System!')
  console.log('====================================================')

  const products = getInitialProducts()
  const cart = createCart()

  while (true) {
    displayCatalog(products)
    displayCart(cart, products)

    console.log('\nCommands:')
    console.log('  [1-4]    - Enter product ID to add item')
    console.log('  checkout - Finalize purchase and update stock')
    console.log('  exit     - Quit application')

    const action = (await askQuestion('\nEnter command or Product ID: ')).trim().toLowerCase()

    if (action === 'exit' || action === 'q') {
      console.log('\nThank you for shopping with us! Goodbye.')
      break
    }

    if (action === 'checkout' || action === 'c') {
      try {
        const receipt = checkout(cart, products)
        console.log('\n================ CHECKOUT RECEIPT ================')
        console.log('Payment successful! Purchased items:')
        for (const item of receipt.itemsPurchased) {
          const product = findProduct(products, item.productId)
          const name = product ? product.name : `Product #${item.productId}`
          console.log(`  * ${name} x ${item.quantity} = ${formatCurrency(item.totalPrice)}`)
        }
        console.log(`Total Paid: ${formatCurrency(receipt.total)}`)
        console.log('Inventory deducted. Cart is reset.')
        console.log('==================================================')
      } catch (err) {
        console.log(`\n[Checkout Error]: ${err.message}`)
      }
      continue
    }

    // Treat input as product ID
    const productId = Number(action)
    if (!Number.isInteger(productId) || productId <= 0) {
      console.log('\n[Input Error]: Please enter a valid product ID (1-4), "checkout", or "exit".')
      continue
    }

    const matchedProduct = findProduct(products, productId)
    if (!matchedProduct) {
      console.log(`\n[Input Error]: Product with ID "${productId}" does not exist.`)
      continue
    }

    if (matchedProduct.quantityAvailable <= 0) {
      console.log(`\n[Stock Alert]: "${matchedProduct.name}" is currently out of stock.`)
      continue
    }

    const qtyInput = (await askQuestion(`Enter quantity for "${matchedProduct.name}" (Available: ${matchedProduct.quantityAvailable}): `)).trim()
    const quantity = Number(qtyInput)

    try {
      addToCart(cart, products, productId, quantity)
      console.log(`\n[Success]: Added ${quantity} x "${matchedProduct.name}" to cart.`)
    } catch (err) {
      console.log(`\n[Cart Error]: ${err.message}`)
    }
  }

  noMoreQuestions()
}

main().catch((err) => {
  console.error('Application error:', err)
  noMoreQuestions()
})
