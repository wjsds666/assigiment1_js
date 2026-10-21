export const INITIAL_PRODUCTS = [
    {
        id: 1,
        name: 'Apple',
        description: 'Fresh and crispy red apple',
        price: 1.50,
        quantityAvailable: 15
    },
    {
        id: 2,
        name: 'Banana',
        description: 'Sweet and ripe Cavendish banana',
        price: 0.80,
        quantityAvailable: 20
    },
    {
        id: 3,
        name: 'Orange',
        description: 'Juicy Navel orange packed with Vitamin C',
        price: 1.20,
        quantityAvailable: 10
    },
    {
        id: 4,
        name: 'Mango',
        description: 'Tropical sweet Alphonso mango',
        price: 2.50,
        quantityAvailable: 5
    }
]

export function getInitialProducts () {
    return INITIAL_PRODUCTS.map((product) => ({ ...product }))
}