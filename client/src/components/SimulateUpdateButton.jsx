import { useApp } from '../context/AppContext.jsx';
import { useLocation } from 'react-router-dom';
import { simulateAPI } from '../services/api.js';

export default function SimulateUpdateButton() {
  const { showNotification, user } = useApp();
  const location = useLocation();

  const simulateUpdate = async () => {
    try {
      // Call the API to reassign Chorus 2 lines 1 and 2 to Phil
      const result = await simulateAPI.reassignChorus2();
      
      // Show notification with the actual update message
      showNotification(result.message || 'Chorus 2 lines 1 and 2 reassigned to Phil');
      
      // If user is on a song detail page, reload the page to show the new assignment
      if (location.pathname.startsWith('/songs/')) {
        // Small delay before reload to let notification show
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error simulating update:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Failed to simulate update: ${errorMessage}`);
    }
  };

  return (
    <button
      onClick={simulateUpdate}
      className="simulate-update-btn"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '12px 20px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#1d4ed8';
        e.target.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#2563eb';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      🔔 Simulate Update
    </button>
  );
}

