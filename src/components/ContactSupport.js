import React, { useState } from 'react';
import { Typography } from 'antd';
import '../styles/MainScreen.css';

const { Title, Text } = Typography;

const contacts = [
  {
    title: 'Customer Care',
    subtitle: 'Mon-Fri, 9am-5pm',
    phone: '1300-13-8888',
    icon: '📞',
    accent: '#A78BFA',
    bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    border: '#e9d5ff',
  },
  {
    title: '24/7 Roadside Assistance',
    subtitle: 'Immediate roadside support',
    phone: '1800-88-6491',
    icon: '🚗',
    accent: '#0EA5E9',
    bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '#bae6fd',
  },
  {
    title: 'Claims Careline',
    subtitle: 'Claims support and follow-up',
    phone: '1300-88-1007',
    icon: '🎧',
    accent: '#10B981',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '#bbf7d0',
  },
];

export default function ContactSupportScreen() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft" style={styles.profileMatchedHero}>
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Contact Support</span>
          <Title level={2} className="portal-dashboard-title">Contact Support</Title>
          <Text className="portal-dashboard-description">
            Choose the right careline for your needs - we're here around the clock.
          </Text>
        </div>
      </div>

      <div style={styles.grid}>
        {contacts.map((contact, index) => (
          <div
            key={contact.phone}
            style={{
              ...styles.card,
              background: contact.bg,
              borderColor: hovered === index ? contact.accent : contact.border,
              transform: hovered === index ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
              boxShadow: hovered === index
                ? `0 16px 40px ${contact.accent}22, 0 2px 8px rgba(0,0,0,0.06)`
                : '0 2px 12px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ ...styles.iconBox, background: `${contact.accent}18`, border: `1.5px solid ${contact.accent}33`, color: contact.accent }}>
              <span style={styles.iconText}>{contact.icon}</span>
            </div>
            <div style={styles.cardMeta}>
              <span style={styles.cardTitle}>{contact.title}</span>
              <span style={styles.cardSub}>{contact.subtitle}</span>
            </div>
            <div style={styles.divider} />
            <a
              href={`tel:${toTelHref(contact.phone)}`}
              style={{ ...styles.phone, color: contact.accent }}
              aria-label={`Call ${contact.title} at ${contact.phone}`}
            >
              {contact.phone}
            </a>
            <div style={{ ...styles.callChip, background: `${contact.accent}12`, color: contact.accent }}>
              <span style={styles.callDot(contact.accent)} />
              Hotline
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function toTelHref(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
    maxWidth: 1100,
  },
  profileMatchedHero: {
    background: '#fff3e8',
    borderColor: '#f3c8a7',
    boxShadow: '0 14px 32px rgba(234, 88, 12, 0.08)',
  },
  card: {
    borderRadius: 16,
    border: '1.5px solid',
    padding: '26px 24px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.3,
    color: '#111827',
  },
  cardSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 400,
  },
  divider: {
    height: 1,
    background: 'rgba(0,0,0,0.07)',
    margin: '4px 0',
  },
  phone: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
    lineHeight: 1.2,
    textDecoration: 'none',
    width: 'fit-content',
  },
  callChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    width: 'fit-content',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  callDot: (color) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    display: 'inline-block',
  }),
};
