import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ customer_id: '', product_id: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch sales with customer name and product name
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, product, quantity, total_price, sale_date, customers(name), products(name)')
        .order('sale_date', { ascending: false });
      setSales(salesData || []);
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, stock');
      setProducts(productsData || []);
      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name');
      setCustomers(customersData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const product = products.find(p => p.id === form.product_id);
    const quantity = parseInt(form.quantity, 10);
    if (!product || quantity > product.stock) {
      setError('Insufficient stock or invalid product.');
      setSubmitting(false);
      return;
    }
    // Insert sale
    const total_price = product.price * quantity;
    const { error: saleError } = await supabase.from('sales').insert([
      {
        customer_id: form.customer_id,
        product: product.name,
        quantity,
        total_price,
      },
    ]);
    if (saleError) {
      setError('Failed to add sale.');
      setSubmitting(false);
      return;
    }
    // Update product stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', product.id);
    if (stockError) {
      setError('Failed to update stock.');
      setSubmitting(false);
      return;
    }
    // Refresh data
    const { data: salesData } = await supabase
      .from('sales')
      .select('id, product, quantity, total_price, sale_date, customers(name), products(name)')
      .order('sale_date', { ascending: false });
    setSales(salesData || []);
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, stock');
    setProducts(productsData || []);
    setForm({ customer_id: '', product_id: '', quantity: 1 });
    setSubmitting(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Sales Records</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select name="customer_id" value={form.customer_id} onChange={handleChange} required>
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="product_id" value={form.product_id} onChange={handleChange} required>
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
          ))}
        </select>
        <input
          type="number"
          name="quantity"
          min="1"
          max={form.product_id ? products.find(p => p.id === form.product_id)?.stock || 1 : 1}
          value={form.quantity}
          onChange={handleChange}
          required
          placeholder="Quantity"
        />
        <button type="submit" disabled={submitting}>Add Sale</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{new Date(sale.sale_date).toLocaleString()}</td>
                <td>{sale.customers ? sale.customers.name : 'N/A'}</td>
                <td>{sale.product}</td>
                <td>{sale.quantity}</td>
                <td>{sale.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Sales;
