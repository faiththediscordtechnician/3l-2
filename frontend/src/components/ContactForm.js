import React, { useState } from 'react';
import { useStore } from '../store';

function ContactForm({ onAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    firm: '',
    connected_by: '',
    notes: '',
    status: 'initial',
    follow_up_date: '',
  });

  const { addContact, loading } = useStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await addContact(formData);
    if (result) {
      setFormData({
        name: '',
        role: '',
        firm: '',
        connected_by: '',
        notes: '',
        status: 'initial',
        follow_up_date: '',
      });
      onAdded();
    }
  };

  return (
    <div className="card">
      <h3>Add Networking Contact</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g., Partner, Associate"
          />
        </div>

        <div className="form-group">
          <label>Firm/Organization</label>
          <input
            type="text"
            name="firm"
            value={formData.firm}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Connected By</label>
          <input
            type="text"
            name="connected_by"
            value={formData.connected_by}
            onChange={handleChange}
            placeholder="e.g., Malhotra"
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="initial">Initial Contact</option>
            <option value="engaged">Engaged</option>
            <option value="articling_offer">Articling Offer</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="form-group">
          <label>Follow-up Date</label>
          <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} />
        </div>

        <button type="submit" disabled={!formData.name || loading}>
          {loading ? 'Adding...' : '➕ Add Contact'}
        </button>
      </form>
    </div>
  );
}

export default ContactForm;
