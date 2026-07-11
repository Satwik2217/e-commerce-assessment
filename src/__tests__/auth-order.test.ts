const test = require('node:test');
const assert = require('node:assert');
const { registerSchema, checkoutSchema } = require('../lib/validations');

// Business logic validator replicating stock verification in checkout API transactions
function validateInventory(
  orderItems: { productId: string; name: string; quantity: number }[],
  databaseProducts: { id: string; name: string; stockQuantity: number }[]
) {
  for (const item of orderItems) {
    const product = databaseProducts.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.name} not found`);
    }
    if (product.stockQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Only ${product.stockQuantity} items available.`
      );
    }
  }
  return true;
}

test('Authentication: registerSchema validates input constraints', () => {
  // Test password matching
  const mismatchResult = registerSchema.safeParse({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'securepassword123',
    confirmPassword: 'mismatchedpassword',
  });
  assert.strictEqual(mismatchResult.success, false);
  assert.strictEqual(mismatchResult.error.issues[0].message, 'Passwords do not match');

  // Test password length constraint
  const shortPassResult = registerSchema.safeParse({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: '123',
    confirmPassword: '123',
  });
  assert.strictEqual(shortPassResult.success, false);
  assert.match(shortPassResult.error.issues[0].message, /Password must be at least 8 characters/);

  // Test correct registration payload
  const validResult = registerSchema.safeParse({
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'securepassword123',
    confirmPassword: 'securepassword123',
  });
  assert.strictEqual(validResult.success, true);
});

test('Order Placement: checkoutSchema validates shipping parameter formats', () => {
  // Test missing fields
  const invalidResult = checkoutSchema.safeParse({
    shippingName: 'Jane Doe',
    shippingAddress: '',
  });
  assert.strictEqual(invalidResult.success, false);

  // Test valid payload
  const validResult = checkoutSchema.safeParse({
    shippingName: 'Jane Doe',
    shippingAddress: '123 Main Street',
    shippingCity: 'Mumbai',
    shippingPostal: '400001',
    shippingCountry: 'India',
  });
  assert.strictEqual(validResult.success, true);
});

test('Order Placement: stock transaction logic validates quantity boundaries', () => {
  const dbProducts = [
    { id: 'prod-1', name: 'Slim Fit Denim', stockQuantity: 5 },
    { id: 'prod-2', name: 'Polo Shirt', stockQuantity: 0 },
  ];

  // Test successful inventory checkout
  const successfulCart = [{ productId: 'prod-1', name: 'Slim Fit Denim', quantity: 2 }];
  assert.strictEqual(validateInventory(successfulCart, dbProducts), true);

  // Test out of stock trigger
  const outOfStockCart = [{ productId: 'prod-2', name: 'Polo Shirt', quantity: 1 }];
  assert.throws(
    () => validateInventory(outOfStockCart, dbProducts),
    /Insufficient stock for Polo Shirt/
  );

  // Test cart item exceeding stock
  const overLimitCart = [{ productId: 'prod-1', name: 'Slim Fit Denim', quantity: 10 }];
  assert.throws(
    () => validateInventory(overLimitCart, dbProducts),
    /Insufficient stock for Slim Fit Denim/
  );
});
