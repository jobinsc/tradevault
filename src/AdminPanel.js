// src/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
} from './dataService';

function AdminPanel({ currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      alert('Error loading users: ' + error.message);
    }
    setLoading(false);
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (userId === currentUser.uid) {
      alert("You can't change your OWN status!");
      return;
    }
    
    const statusLabels = {
      active: 'ACTIVATE',
      suspended: 'SUSPEND',
      banned: 'BAN',
      pending: 'set as PENDING',
    };
    
    if (!window.confirm('Are you sure you want to ' + statusLabels[newStatus] + ' this user?')) {
      return;
    }
    
    setProcessing(userId);
    try {
      await updateUserStatus(userId, newStatus);
      await loadUsers();
      alert('User ' + statusLabels[newStatus] + 'd successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setProcessing(null);
  };

  const handleDelete = async (userId, email) => {
    if (userId === currentUser.uid) {
      alert("You can't delete YOUR OWN account!");
      return;
    }
    
    if (!window.confirm('DELETE user "' + email + '"? This will delete all their data. This CANNOT be undone!')) {
      return;
    }
    
    if (!window.confirm('Are you REALLY sure? This will delete "' + email + '" forever.')) {
      return;
    }
    
    setProcessing(userId);
    try {
      await deleteUser(userId);
      await loadUsers();
      alert('User "' + email + '" deleted permanently!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setProcessing(null);
  };

  const filteredUsers = users.filter(u => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const emailMatch = u.email && u.email.toLowerCase().includes(q);
      const nameMatch = u.name && u.name.toLowerCase().includes(q);
      if (!emailMatch && !nameMatch) return false;
    }
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  const getStatusColor = (status) => {
    if (status === 'active') return '#10b981';
    if (status === 'suspended') return '#f59e0b';
    if (status === 'banned') return '#ef4444';
    if (status === 'pending') return '#3b82f6';
    return '#64748b';
  };

  const getStatusEmoji = (status) => {
    if (status === 'active') return '✅';
    if (status === 'suspended') return '⏸️';
    if (status === 'banned') return '🚫';
    if (status === 'pending') return '⏳';
    return '❓';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #2a3150', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            👑 Admin Panel
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Manage all users of your TradeVault app
          </p>
        </div>
        <button onClick={onClose} style={{ padding: '10px 20px', background: '#1e293b', color: '#fff', border: '1px solid #2a3150', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          ← Back to App
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#1a1f35', padding: 20, borderRadius: 12, borderLeft: '4px solid #3b82f6', border: '1px solid #2a3150' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Users</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total}</div>
        </div>
        <div style={{ background: '#1a1f35', padding: 20, borderRadius: 12, borderLeft: '4px solid #10b981', border: '1px solid #2a3150' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>✅ Active</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{stats.active}</div>
        </div>
        <div style={{ background: '#1a1f35', padding: 20, borderRadius: 12, borderLeft: '4px solid #f59e0b', border: '1px solid #2a3150' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⏸️ Suspended</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{stats.suspended}</div>
        </div>
        <div style={{ background: '#1a1f35', padding: 20, borderRadius: 12, borderLeft: '4px solid #ef4444', border: '1px solid #2a3150' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🚫 Banned</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{stats.banned}</div>
        </div>
        <div style={{ background: '#1a1f35', padding: 20, borderRadius: 12, borderLeft: '4px solid #3b82f6', border: '1px solid #2a3150' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⏳ Pending</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{stats.pending}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 250, padding: '10px 16px', background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 10, color: '#fff', fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'active', 'suspended', 'banned', 'pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                background: filter === f ? '#3b82f6' : '#1a1f35',
                color: filter === f ? '#fff' : '#94a3b8',
                border: '1px solid #2a3150',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={loadUsers} style={{ padding: '10px 16px', background: '#1e293b', color: '#fff', border: '1px solid #2a3150', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>
          ⏳ Loading users...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 60 }}>👥</div>
          <h3>No users found</h3>
          <p>Try changing filters or search</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredUsers.map(user => (
            <div key={user.id} style={{ background: '#1a1f35', padding: 20, borderRadius: 12, border: '1px solid #2a3150', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', background: '#2a3150', flexShrink: 0 }}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                      {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{user.name || 'No name'}</span>
                    {user.id === currentUser.uid && (
                      <span style={{ fontSize: 10, padding: '3px 8px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', borderRadius: 6, fontWeight: 700 }}>
                        👑 YOU (Admin)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{user.email}</div>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: getStatusColor(user.status) }}>
                      {getStatusEmoji(user.status)} {user.status ? user.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <span style={{ color: '#475569' }}>•</span>
                    <span>Joined: {user.createdAt && user.createdAt.toDate ? format(user.createdAt.toDate(), 'dd MMM yyyy') : 'Unknown'}</span>
                    <span style={{ color: '#475569' }}>•</span>
                    <span>Capital: ₹{user.capital ? user.capital.toLocaleString('en-IN') : 0}</span>
                  </div>
                </div>
              </div>
              
              {user.id !== currentUser.uid && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {user.status !== 'active' && (
                    <button
                      onClick={() => handleStatusChange(user.id, 'active')}
                      disabled={processing === user.id}
                      style={{ padding: '8px 14px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#10b981' }}
                    >
                      ✅ Activate
                    </button>
                  )}
                  {user.status !== 'suspended' && (
                    <button
                      onClick={() => handleStatusChange(user.id, 'suspended')}
                      disabled={processing === user.id}
                      style={{ padding: '8px 14px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#f59e0b' }}
                    >
                      ⏸️ Suspend
                    </button>
                  )}
                  {user.status !== 'banned' && (
                    <button
                      onClick={() => handleStatusChange(user.id, 'banned')}
                      disabled={processing === user.id}
                      style={{ padding: '8px 14px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#ef4444' }}
                    >
                      🚫 Ban
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    disabled={processing === user.id}
                    style={{ padding: '8px 14px', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#7f1d1d' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;