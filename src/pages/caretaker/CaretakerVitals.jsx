import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeartbeat, FaLungs, FaClock } from 'react-icons/fa';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppContext } from '../../context/AppContext';
import { useVitals } from '../../hooks/useVitals';

const getRelativeTime = (timestamp) => {
  const ts =
    typeof timestamp?.toMillis === 'function'
      ? timestamp.toMillis()
      : typeof timestamp?.seconds === 'number'
        ? timestamp.seconds * 1000
        : Number(timestamp);
  if (!Number.isFinite(ts)) return 'No live update';
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hrs ago`;
};

const toNumber = (value, fallback = null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const CaretakerVitals = () => {
  const navigate = useNavigate();
  const { caretakerPatient } = React.useContext(AppContext);
  const [, setNow] = React.useState(Date.now());

  const vitalsCandidates = React.useMemo(
    () => [caretakerPatient?.id, caretakerPatient?.authUid, 'patient_demo'],
    [caretakerPatient?.id, caretakerPatient?.authUid]
  );
  const { vitals, latestVitals } = useVitals(vitalsCandidates);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const latest = latestVitals || {};
  const currentHr = toNumber(latest.heartRate ?? latest.hr ?? latest.heartRateAvg, null);
  const currentSpo2 = toNumber(latest.spO2 ?? latest.spo2 ?? latest.spo2Avg, null);
  const roomTemp = toNumber(latest.roomTemperature ?? latest.roomTemp ?? latest.ambientTemperature, null);
  const bodyTemp = toNumber(latest.bodyTemperature ?? latest.bodyTemp ?? latest.temperature ?? latest.temperatureAvg, null);
  const humidity = toNumber(latest.roomHumidity ?? latest.humidity ?? latest.relativeHumidity, null);
  const updatedAt = latest.timestamp || latest.createdAt || latest.updatedAt || latest.timestampMs;

  const chartData = [...(vitals || [])]
    .slice(0, 12)
    .reverse()
    .map((entry) => {
      const ts = entry.timestamp?.seconds
        ? new Date(entry.timestamp.seconds * 1000)
        : entry.timestampMs
          ? new Date(entry.timestampMs)
          : null;
      if (!ts || Number.isNaN(ts.getTime())) return null;
      return {
        day: ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        hr: toNumber(entry.heartRate ?? entry.hr ?? entry.heartRateAvg, null),
        spo2: toNumber(entry.spO2 ?? entry.spo2 ?? entry.spo2Avg, null)
      };
    })
    .filter(Boolean);

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '32px 24px 96px 24px', fontFamily: '"DM Sans", sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Patient Vitals</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{caretakerPatient?.name || 'Linked Patient'}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-light)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaHeartbeat size={24} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: '8px' }}>HEART RATE</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--danger)', marginBottom: '4px' }}>{currentHr !== null ? Math.round(currentHr) : '--'} bpm</div>
          <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>Live reading</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--info-light)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaLungs size={24} color="var(--info)" />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: '8px' }}>BLOOD OXYGEN</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--info)', marginBottom: '4px' }}>{currentSpo2 !== null ? Math.round(currentSpo2) : '--'}%</div>
          <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>Live reading</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--warning-light)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaClock size={24} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: '8px' }}>LAST SEEN</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{getRelativeTime(updatedAt)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Live Trend</h3>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', height: '220px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="hr"
                stroke="#E91E63"
                strokeWidth={3}
                dot={{ r: 4, fill: '#E91E63' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="spo2"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563EB' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Environment and Temperature</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Room Temp', val: roomTemp !== null ? `${roomTemp.toFixed(1)}°C` : '--' },
            { label: 'Body Temp', val: bodyTemp !== null ? `${bodyTemp.toFixed(1)}°C` : '--' },
            { label: 'Humidity', val: humidity !== null ? `${Math.round(humidity)}%` : '--' }
          ].map((entry, i) => (
            <div key={i} style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{entry.label}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{entry.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaretakerVitals;

