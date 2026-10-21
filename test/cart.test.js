import { describe, it, expect, beforeEach } from 'vitest'
import { getInitialProducts } from '../src/products.js'
import {
  createCart,
  addToCart,
  calculateTotal,
  checkout,
  findProduct
} from '../src/cart.js'

describe('Shopping Cart Module', () => {
  let products
  let cart

  // Reset product state and empty cart before each test to guarantee complete isolation
  beforeEach(() => {
    products = getInitialProducts()
    cart = createCart()
  })

  describe('Adding items to the cart (addToCart)', () => {
    it('should successfully add a valid product to an empty cart', () => {
      // Product 1: Apple, price: 1.50, available: 15
      addToCart(cart, products, 1, 2)

      expect(cart).toHaveLength(1)
      expect(cart[0]).toEqual({
        productId: 1,
        quantity: 2,
        totalPrice: 3.00
      })
    })

    it('should accumulate quantity and recalculate totalPrice when adding the same product multiple times', () => {
      // Add 2 apples, then 3 more apples -> total 5 apples, price: 1.50 * 5 = 7.50
      addToCart(cart, products, 1, 2)
      addToCart(cart, products, 1, 3)

      expect(cart).toHaveLength(1)
      expect(cart[0]).toEqual({
        productId: 1,
        quantity: 5,
        totalPrice: 7.50
      })
    })

    it('should handle adding multiple distinct products to the cart', () => {
      addToCart(cart, products, 1, 2) // Apple: 1.50 * 2 = 3.00
      addToCart(cart, products, 2, 5) // Banana: 0.80 * 5 = 4.00

      expect(cart).toHaveLength(2)
      expect(cart[0].productId).toBe(1)
      expect(cart[1].productId).toBe(2)
    })

    it('should throw an error when attempting to add a non-existent product ID', () => {
      expect(() => {
        addToCart(cart, products, 999, 1)
      }).toThrowError(/not found/i)
    })

    it('should throw an error when requesting quantity exceeds available stock', () => {
      // Product 4: Mango, only 5 available
      expect(() => {
        addToCart(cart, products, 4, 6)
      }).toThrowError(/insufficient stock/i)
    })

    it('should throw an error when accumulated quantity in cart exceeds available stock', () => {
      // Mango has 5 available
      addToCart(cart, products, 4, 3)

      expect(() => {
        addToCart(cart, products, 4, 3) // 3 + 3 = 6 > 5
      }).toThrowError(/insufficient stock/i)

      // Ensure the existing cart item was not corrupted
      expect(cart[0].quantity).toBe(3)
    })

    it('should reject invalid quantities like 0, negative numbers, floats, or non-integers', () => {
      expect(() => addToCart(cart, products, 1, 0)).toThrowError(/invalid quantity/i)
      expect(() => addToCart(cart, products, 1, -2)).toThrowError(/invalid quantity/i)
      expect(() => addToCart(cart, products, 1, 1.5)).toThrowError(/invalid quantity/i)
      expect(() => addToCart(cart, products, 1, 'abc')).toThrowError(/invalid quantity/i)
    })
  })

  describe('Total cost calculation (calculateTotal)', () => {
    it('should return 0 for an empty cart', () => {
      expect(calculateTotal(cart)).toBe(0)
    })

    it('should accurately calculate total price across multiple products without floating point precision issues', () => {
      // Apple: 1.50 * 2 = 3.00
      // Orange: 1.20 * 3 = 3.60
      // Expected total: 6.60
      addToCart(cart, products, 1, 2)
      addToCart(cart, products, 3, 3)

      expect(calculateTotal(cart)).toBe(6.60)
    })
  })

  describe('Checkout process (checkout)', () => {
    it('should throw an error when attempting to checkout an empty cart', () => {
      expect(() => {
        checkout(cart, products)
      }).toThrowError(/empty cart/i)
    })

    it('should deduct available product inventory correctly upon checkout', () => {
      const apple = findProduct(products, 1)
      const initialStock = apple.quantityAvailable // 15

      addToCart(cart, products, 1, 3)
      const receipt = checkout(cart, products)

      expect(receipt.total).toBe(4.50)
      expect(apple.quantityAvailable).toBe(initialStock - 3) // 12
    })

    it('should empty the cart after a successful checkout', () => {
      addToCart(cart, products, 1, 2)
      addToCart(cart, products, 2, 3)

      const receipt = checkout(cart, products)

      expect(receipt.itemsPurchased).toHaveLength(2)
      expect(cart).toHaveLength(0) // Cart is reset
    })

    it('should correctly handle purchasing all remaining stock of an item', () => {
      const mango = findProduct(products, 4) // stock: 5

      addToCart(cart, products, 4, 5) // Buy all 5 mangoes
      const receipt = checkout(cart, products)

      expect(receipt.total).toBe(12.50)
      expect(mango.quantityAvailable).toBe(0) // Out of stock now
    })
  })
})
