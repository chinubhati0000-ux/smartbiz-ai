// Simple JSON-file database. No native modules, no compiling required --
// this is intentional so the app installs cleanly on any machine with
// just Node.js, without needing Visual Studio Build Tools or similar.
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'smartbiz-data.json');

const EMPTY_DB = {
  users: [],
  businesses: [],
  products: [],
  sales: [],
  expenses: [],
  counters: { users: 0, businesses: 0, products: 0, sales: 0, expenses: 0 }
};

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2));
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(data, collection) {
  data.counters[collection] += 1;
  return data.counters[collection];
}

function nowIso() {
  return new Date().toISOString();
}

// ---------- Users ----------
function findUserByEmail(email) {
  const data = load();
  return data.users.find((u) => u.email === email.toLowerCase()) || null;
}

function findUserById(id) {
  const data = load();
  return data.users.find((u) => u.id === Number(id)) || null;
}

function createUser({ name, email, hashedPassword }) {
  const data = load();
  const id = nextId(data, 'users');
  const user = { id, name, email: email.toLowerCase(), password: hashedPassword, created_at: nowIso() };
  data.users.push(user);
  save(data);
  return user;
}

// ---------- Businesses ----------
function findBusinessByUserId(userId) {
  const data = load();
  return data.businesses.find((b) => b.user_id === Number(userId)) || null;
}

function findBusinessById(id) {
  const data = load();
  return data.businesses.find((b) => b.id === Number(id)) || null;
}

function createBusiness({ userId, business_name, business_type, owner_name }) {
  const data = load();
  const id = nextId(data, 'businesses');
  const biz = {
    id,
    user_id: userId,
    business_name: business_name || '',
    business_type: business_type || '',
    owner_name: owner_name || '',
    phone: '',
    address: ''
  };
  data.businesses.push(biz);
  save(data);
  return biz;
}

function updateBusiness(userId, fields) {
  const data = load();
  const biz = data.businesses.find((b) => b.user_id === Number(userId));
  if (!biz) return null;
  Object.assign(biz, fields);
  save(data);
  return biz;
}

// ---------- Products ----------
function getProductsByBusiness(businessId) {
  const data = load();
  return data.products
    .filter((p) => p.business_id === Number(businessId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getProductById(id, businessId) {
  const data = load();
  return (
    data.products.find((p) => p.id === Number(id) && p.business_id === Number(businessId)) || null
  );
}

function createProduct(businessId, fields) {
  const data = load();
  const id = nextId(data, 'products');
  const product = {
    id,
    business_id: Number(businessId),
    name: fields.name,
    category: fields.category || 'General',
    cost_price: Number(fields.cost_price),
    selling_price: Number(fields.selling_price),
    stock_quantity: Number(fields.stock_quantity) || 0,
    low_stock_limit: Number(fields.low_stock_limit) || 5,
    created_at: nowIso()
  };
  data.products.push(product);
  save(data);
  return product;
}

function updateProduct(id, businessId, fields) {
  const data = load();
  const product = data.products.find(
    (p) => p.id === Number(id) && p.business_id === Number(businessId)
  );
  if (!product) return null;
  if (fields.name !== undefined) product.name = fields.name;
  if (fields.category !== undefined) product.category = fields.category;
  if (fields.cost_price !== undefined) product.cost_price = Number(fields.cost_price);
  if (fields.selling_price !== undefined) product.selling_price = Number(fields.selling_price);
  if (fields.stock_quantity !== undefined) product.stock_quantity = Number(fields.stock_quantity);
  if (fields.low_stock_limit !== undefined) product.low_stock_limit = Number(fields.low_stock_limit);
  save(data);
  return product;
}

function deleteProduct(id, businessId) {
  const data = load();
  const before = data.products.length;
  data.products = data.products.filter(
    (p) => !(p.id === Number(id) && p.business_id === Number(businessId))
  );
  save(data);
  return data.products.length < before;
}

function adjustProductStock(productId, delta) {
  const data = load();
  const product = data.products.find((p) => p.id === Number(productId));
  if (!product) return null;
  product.stock_quantity += delta;
  save(data);
  return product;
}

// ---------- Sales ----------
function getSalesByBusiness(businessId) {
  const data = load();
  return data.sales
    .filter((s) => s.business_id === Number(businessId))
    .map((s) => {
      const product = data.products.find((p) => p.id === s.product_id);
      return { ...s, product_name: product ? product.name : 'Unknown product' };
    })
    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
}

function createSale(businessId, productId, quantity, totalAmount) {
  const data = load();
  const id = nextId(data, 'sales');
  const sale = {
    id,
    business_id: Number(businessId),
    product_id: Number(productId),
    quantity: Number(quantity),
    total_amount: totalAmount,
    sale_date: nowIso()
  };
  data.sales.push(sale);
  const product = data.products.find((p) => p.id === Number(productId));
  if (product) product.stock_quantity -= Number(quantity);
  save(data);
  return sale;
}

// ---------- Expenses ----------
function getExpensesByBusiness(businessId) {
  const data = load();
  return data.expenses
    .filter((e) => e.business_id === Number(businessId))
    .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
}

function createExpense(businessId, fields) {
  const data = load();
  const id = nextId(data, 'expenses');
  const expense = {
    id,
    business_id: Number(businessId),
    category: fields.category,
    amount: Number(fields.amount),
    description: fields.description || '',
    expense_date: fields.expense_date || nowIso()
  };
  data.expenses.push(expense);
  save(data);
  return expense;
}

function deleteExpense(id, businessId) {
  const data = load();
  const before = data.expenses.length;
  data.expenses = data.expenses.filter(
    (e) => !(e.id === Number(id) && e.business_id === Number(businessId))
  );
  save(data);
  return data.expenses.length < before;
}

// ---------- Raw access (used by analytics/insights/predict for aggregation) ----------
function getAll() {
  return load();
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findBusinessByUserId,
  findBusinessById,
  createBusiness,
  updateBusiness,
  getProductsByBusiness,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustProductStock,
  getSalesByBusiness,
  createSale,
  getExpensesByBusiness,
  createExpense,
  deleteExpense,
  getAll
};
