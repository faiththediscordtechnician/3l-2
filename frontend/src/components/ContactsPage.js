import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import ContactForm from './ContactForm';
import ContactList from './ContactList';

function ContactsPage() {
  const [tab, setTab] = useState('list');
  const { fetchContacts } = useStore();

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div>
      <h2>👥 Networking Contacts</h2>

      <div className="tabs">
        <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
          📋 View Contacts
        </button>
        <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>
          ➕ Add Contact
        </button>
      </div>

      {tab === 'list' && <ContactList />}
      {tab === 'add' && <ContactForm onAdded={() => setTab('list')} />}
    </div>
  );
}

export default ContactsPage;
