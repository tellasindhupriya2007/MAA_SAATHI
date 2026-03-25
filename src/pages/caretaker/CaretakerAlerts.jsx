import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaShieldAlt } from 'react-icons/fa';
import { AppContext } from '../../context/AppContext';

const CaretakerAlerts = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const { caretakerAlerts } = React.useContext(AppContext);
  const alerts = caretakerAlerts || [];

  const filteredAlerts = alerts.filter(a => 
    filter === 'All' || 
    (filter === 'Active' && a.status === 'Active') || 
    (filter === 'Resolved' && a.status === 'Resolved')
  );

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '32px 24px 96px 24px', fontFamily: '"DM Sans", sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          <FaArrowLeft />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Alert History</h1>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto' }}>
        {['All', 'Active', 'Resolved'].map(f => (
          <button 
            key={f} onClick={() => setFilter(f)}
            style={{ 
              padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
              background: filter === f ? 'var(--accent)' : 'var(--surface)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', color: 'var(--text-secondary)' }}>
            No alerts for selected filter.
          </div>
        )}
        {filteredAlerts.map(alert => (
          <div key={alert.id} style={{ 
            background: 'var(--surface)', borderLeft: `3px solid ${alert.color}`, 
            borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{alert.patient}</span>
               <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{alert.time}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: alert.color + '20', color: alert.color }}>
                  {alert.type}
               </div>
            </div>

            <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
               {alert.trigger}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: alert.status === 'Active' ? 'var(--danger)' : 'var(--success)' }}>
                  {alert.status === 'Resolved' && <FaCheckCircle />}
                  {alert.status === 'Active' ? <FaExclamationCircle /> : 'Resolved'}
               </div>
               {alert.status === 'Resolved' && (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{alert.resolvedDate}</span>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaretakerAlerts;
