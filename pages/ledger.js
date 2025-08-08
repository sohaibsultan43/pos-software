import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Ledger = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'credit', amount: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) fetchLedger(selectedCustomer);
    else setLedger([]);
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    const { data: customersData } = await supabase
      .from('customers')
      .select('id, name')
      .order('name');
    setCustomers(customersData || []);
  };

  const fetchLedger = async (customerId) => {
    setLoading(true);
    const { data: ledgerData } = await supabase
      .from('ledger')
      .select('*')
      .eq('customer_id', customerId)
      .order('entry_date', { ascending: false });
    setLedger(ledgerData || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedCustomer || !form.amount) {
      setError('Customer and amount are required.');
      return;
    }
    const { error: insertError } = await supabase
      .from('ledger')
      .insert([
        {
          customer_id: selectedCustomer,
          type: form.type,
          amount: parseFloat(form.amount),
          description: form.description,
        },
      ]);
    if (insertError) {
      setError('Failed to add transaction.');
      return;
    }
    setForm({ type: 'credit', amount: '', description: '' });
    fetchLedger(selectedCustomer);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Customer Ledger</h1>
      <div style={{ marginBottom: '1rem' }}>
        <select
          value={selectedCustomer}
          onChange={e => setSelectedCustomer(e.target.value)}
          required
        >
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {selectedCustomer && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="Amount"
          />
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          />
          <button type="submit">Add Transaction</button>
        </form>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.entry_date).toLocaleString()}</td>
                <td>{entry.type}</td>
                <td>{entry.amount}</td>
                <td>{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Ledger;
