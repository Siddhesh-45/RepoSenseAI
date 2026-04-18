import { useMemo } from 'react';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// Deterministic color from string
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 55%)`;
}

export default function SourceControlPanel({ commits }) {
  const grouped = useMemo(() => {
    if (!commits || commits.length === 0) return [];
    
    // Group commits by date
    const groups = {};
    for (const commit of commits) {
      const date = new Date(commit.date);
      const key = date.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(commit);
    }
    
    return Object.entries(groups);
  }, [commits]);

  if (!commits || commits.length === 0) {
    return (
      <div style={{
        padding: '2rem 1rem',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.8125rem',
        opacity: 0.5,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }}>
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
          <path d="M6 21V9a9 9 0 0 0 9 9"/>
        </svg>
        No commit history available
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* Summary */}
      <div style={{
        padding: '0.5rem 1rem 0.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        marginBottom: '0.25rem',
      }}>
        <span className="font-mono" style={{
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)',
        }}>
          {commits.length} commits
        </span>
      </div>

      {/* Commit groups */}
      {grouped.map(([dateLabel, dateCommits]) => (
        <div key={dateLabel}>
          {/* Date header */}
          <div style={{
            padding: '0.5rem 1rem 0.25rem',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-surface)',
            zIndex: 1,
          }}>
            <span className="font-mono" style={{
              fontSize: '0.625rem',
              color: 'var(--text-secondary)',
              opacity: 0.6,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              {dateLabel}
            </span>
          </div>

          {/* Commits for this date */}
          {dateCommits.map((commit, i) => (
            <div
              key={commit.hash || i}
              className="commit-item"
              style={{
                display: 'flex',
                gap: '0.625rem',
                padding: '0.5rem 1rem',
                position: 'relative',
                cursor: 'default',
              }}
            >
              {/* Timeline line */}
              {i < dateCommits.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: 27,
                  top: 32,
                  bottom: -4,
                  width: 1,
                  background: 'rgba(255,255,255,0.06)',
                }} />
              )}

              {/* Avatar */}
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: hashColor(commit.author || 'U'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.5rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
                zIndex: 1,
              }}>
                {getInitials(commit.author || 'Unknown')}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '2px',
                }}>
                  {commit.message}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span className="font-mono" style={{
                    fontSize: '0.625rem',
                    color: 'var(--accent-start)',
                    opacity: 0.8,
                  }}>
                    {commit.hash}
                  </span>
                  <span style={{
                    fontSize: '0.625rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.5,
                  }}>
                    {commit.author}
                  </span>
                  <span style={{
                    fontSize: '0.625rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.4,
                    marginLeft: 'auto',
                  }}>
                    {timeAgo(commit.date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
