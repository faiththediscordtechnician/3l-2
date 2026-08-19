import React, { useState } from 'react';
import { useStore } from '../store';

function ContactList() {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const { contacts, loading, updateContact } = useStore();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading contacts...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#999' }}>
          No contacts yet. Add your networking connections!
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      initial: '#FFD700',
      engaged: '#87CEEB',
      articling_offer: '#90EE90',
      closed: '#D3D3D3',
    };
    return colors[status] || '#e0e0e0';
  };

  const handleEdit = (contact) => {
    setEditingId(contact.id);
    setEditData(contact);
  };

  const handleSave = async () => {
    await updateContact(editingId, editData);
    setEditingId(null);
  };

  return (
    <div>
      {contacts.map((contact) => (
        <div key={contact.id} className="card">
          {editingId === contact.id ? (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <option value="initial">Initial</option>
                  <option value="engaged">Engaged</option>
                  <option value="articling_offer">Articling Offer</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                />
              </div>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditingId(null)} className="secondary">
                Cancel
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{contact.name}</h3>
                  {contact.role && <p>{contact.role}</p>}
                  {contact.firm && <p style={{ fontSize: '12px', color: '#666' }}>{contact.firm}</p>}
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                    Connected by: {contact.connected_by || 'N/A'}
                  </p>
                </div>
                <div
                  style={{
                    background: getStatusColor(contact.status),
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {contact.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              {contact.notes && <p style={{ marginTop: '10px', fontSize: '13px' }}>📝 {contact.notes}</p>}
              {contact.follow_up_date && (
                <p style={{ marginTop: '5px', fontSize: '12px', color: '#999' }}>
                  Follow-up: {new Date(contact.follow_up_date).toLocaleDateString()}
                </p>
              )}
              <button onClick={() => handleEdit(contact)} className="secondary" style={{ marginTop: '10px' }}>
                ✏️ Edit
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default ContactList;
