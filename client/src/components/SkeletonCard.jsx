export default function SkeletonCard({ style }) {
  return (
    <div className="skeleton-card" style={style}>
      <div className="skeleton-line" style={{ width: '60%', height: '20px' }} />
      <div className="skeleton-line" style={{ width: '90%', height: '14px' }} />
      <div className="skeleton-line" style={{ width: '80%', height: '14px', marginTop: '8px' }} />
      <style>{`
        .skeleton-card {
          background-color: #f3f4f6;
          border-radius: 12px;
          padding: 20px;
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .skeleton-line {
          background-color: #e5e7eb;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}