import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    setProducts(productsData || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price || !form.stock) {
      setError('Name, price, and stock are required.');
      return;
    }
    if (editingId) {
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseInt(form.stock, 10),
        })
        .eq('id', editingId);
      if (updateError) setError('Failed to update product.');
    } else {
      // Add product
      const { error: insertError } = await supabase
        .from('products')
        .insert([
          {
            name: form.name,
            description: form.description,
            price: parseFloat(form.price),
            stock: parseInt(form.stock, 10),
          },
        ]);
      if (insertError) setError('Failed to add product.');
    }
    setForm({ name: '', description: '', price: '', stock: '' });
    setEditingId(null);
    fetchProducts();
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
    });
    setEditingId(product.id);
  };

  const handleCancel = () => {
    setForm({ name: '', description: '', price: '', stock: '' });
    setEditingId(null);
    setError('');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Products</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Product Name"
        />
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          placeholder="Price"
        />
        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          required
          min="0"
          placeholder="Stock"
        />
        <button type="submit">{editingId ? 'Update' : 'Add'} Product</button>
        {editingId && <button type="button" onClick={handleCancel}>Cancel</button>}
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <button onClick={() => handleEdit(product)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Products;
