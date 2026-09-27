import { useStore } from '../src/store/useStore';

console.log("Starting Validations...\n");

// Force clean store for testing
useStore.getState().clearData();
const store = useStore.getState();

// Add demo brand
store.addBrand({
  id: 'b1',
  name: 'Brand A',
  category: 'Whisky',
  bottleSize: '750ml',
  defaultPrice: 500,
  active: true,
  createdAt: '',
  updatedAt: ''
});

store.addBrand({
  id: 'b2',
  name: 'Brand B',
  category: 'Vodka',
  bottleSize: '750ml',
  defaultPrice: 750,
  active: true,
  createdAt: '',
  updatedAt: ''
});

// Seed an initial opening stock using the internal store method trick (mock start new day logic manually or directly manipulate array for setup)
useStore.setState({
  dailyInventory: [
    { date: store.currentDate, brandId: 'b1', openingStock: 100, stockIn: 0, stockOut: 0, presentStock: 100 },
    { date: store.currentDate, brandId: 'b2', openingStock: 50, stockIn: 0, stockOut: 0, presentStock: 50 }
  ]
});

// Refresh state instance
let state = useStore.getState();

// TEST 1: Opening 100, Stock In 20, Stock Out 15 -> Present 105
state.addStockIn({ id: 't1', date: state.currentDate, time: '10:00', brandId: 'b1', quantity: 20, price: 500 });
state = useStore.getState();
state.addStockOut({ id: 't2', date: state.currentDate, time: '10:30', brandId: 'b1', quantity: 15, priceAtSale: 500 });
state = useStore.getState();

let invB1 = state.dailyInventory.find(i => i.brandId === 'b1');
console.log(`TEST 1 (Present Stock = 105): ${invB1?.presentStock === 105 ? 'PASSED' : 'FAILED'} (Got ${invB1?.presentStock})`);

// TEST 2: Price ₹500, Stock Out 15 -> Sales ₹7,500
let sales = state.stockOutTransactions.filter(t => t.brandId === 'b1').reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);
console.log(`TEST 2 (Sales = 7500): ${sales === 7500 ? 'PASSED' : 'FAILED'} (Got ${sales})`);

// TEST 3: Two brands different prices, Grand Total uses individual prices
state.addStockIn({ id: 't3', date: state.currentDate, time: '11:00', brandId: 'b2', quantity: 10, price: 750 });
state = useStore.getState();
state.addStockOut({ id: 't4', date: state.currentDate, time: '11:30', brandId: 'b2', quantity: 8, priceAtSale: 750 });
state = useStore.getState();

let invB2 = state.dailyInventory.find(i => i.brandId === 'b2');
let b2Sales = state.stockOutTransactions.filter(t => t.brandId === 'b2').reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);
let grandSales = sales + b2Sales; // 7500 + (8*750=6000) = 13500
console.log(`TEST 3 (Grand Sales = 13500): ${grandSales === 13500 ? 'PASSED' : 'FAILED'} (Got ${grandSales})`);

// TEST 4: Block transaction if quantity > present stock
let errorCaught = false;
try {
  state.addStockOut({ id: 't5', date: state.currentDate, time: '12:00', brandId: 'b1', quantity: 200, priceAtSale: 500 });
} catch (err: any) {
  errorCaught = err.message.includes('Insufficient');
}
console.log(`TEST 4 (Block invalid transaction): ${errorCaught ? 'PASSED' : 'FAILED'}`);

// TEST 5: Change brand price, old transactions stay the same
state.updateBrand('b1', { defaultPrice: 600 });
state = useStore.getState();
let oldSales = state.stockOutTransactions.filter(t => t.brandId === 'b1').reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);
console.log(`TEST 5 (Old transaction price unaltered, still 7500): ${oldSales === 7500 ? 'PASSED' : 'FAILED'} (Got ${oldSales})`);

// TEST 11: Start new day logic
let tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
let newDateStr = tomorrow.toISOString().split('T')[0];
state.startNewDay(newDateStr);
state = useStore.getState();

let newDayInvB1 = state.dailyInventory.find(i => i.brandId === 'b1' && i.date === newDateStr);
console.log(`TEST 11 (Rollover b1 opening stock = 105): ${newDayInvB1?.openingStock === 105 ? 'PASSED' : 'FAILED'} (Got ${newDayInvB1?.openingStock})`);

console.log("\nAll logic tests completed!");
