import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', contact: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    setCustomers(customersData || []);
    setLoading(false);
  };

  const fetchSales = async (customerId) => {
    const { data: salesData } = await supabase
      .from('sales')
      .select('id, product, quantity, total_price, sale_date')
      .eq('customer_id', customerId)
      .order('sale_date', { ascending: false });
    setSales(salesData || []);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) {
      setError('Name is required.');
      return;
    }
    if (editingId) {
      // Update customer
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: form.name, contact: form.contact })
        .eq('id', editingId);
      if (updateError) setError('Failed to update customer.');
    } else {
      // Add customer
      const { error: insertError } = await supabase
        .from('customers')
        .insert([{ name: form.name, contact: form.contact }]);
      if (insertError) setError('Failed to add customer.');
    }
    setForm({ name: '', contact: '' });
    setEditingId(null);
    fetchCustomers();
  };

  const handleEdit = (customer) => {
    setForm({ name: customer.name, contact: customer.contact });
    setEditingId(customer.id);
  };

  const handleCancel = () => {
    setForm({ name: '', contact: '' });
    setEditingId(null);
    setError('');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Customers</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Customer Name"
        />
        <input
          type="text"
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="Contact"
        />
        <button type="submit">{editingId ? 'Update' : 'Add'} Customer</button>
        {editingId && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Actions</th>
              <th>Purchase History</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.contact}</td>
                <td>
                  <button onClick={() => handleEdit(customer)}>Edit</button>
                  <button onClick={() => fetchSales(customer.id)} style={{ marginLeft: '0.5rem' }}>View Purchases</button>
                </td>
                <td>
                  {sales.length > 0 && sales[0].customer_id === customer.id && (
                    <ul>
                      {sales.map((sale) => (
                        <li key={sale.id}>
                          {sale.product} x{sale.quantity} - {sale.total_price} ({new Date(sale.sale_date).toLocaleDateString()})
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Customers;
