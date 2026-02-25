import { css } from '../../styled-system/css';

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'success' | 'secondary' | 'default';
  children: React.ReactNode;
  width?: string;
  disabled?: boolean;
}

export const ActionButton = ({ onClick, variant = 'default', children, width, disabled }: ActionButtonProps) => {
  const bgColors = {
    success: '#4CAF50',
    secondary: '#6c757d',
    default: '#217346',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ 
        backgroundColor: disabled ? '#555' : bgColors[variant], 
        width: width,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
      }}
      className={css({
        padding: '0.9rem 1.6rem',
        fontSize: '1rem',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        _hover: {
          opacity: 0.9,
        }
      })}
    >
      {children}
    </button>
  );
};
