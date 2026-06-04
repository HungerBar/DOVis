// 控制的是那个上面的按钮的格式

const ModuleLauncher = ({ modules, onOpen, hidden}) => {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: 8,
      background: 'rgba(15,23,42,0.9)',
      borderRadius: 8,
    }}>
      {modules.map(m => (
        <button
          key={m.id}
          onClick={() =>
            onOpen({
              id: m.id,
              Component: m.component,
              props: {
                ...(m.props || {}),
                
                hidden: () => hidden(m.id),
              },
            })
          }
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {m.title}
        </button>
      ))}
    </div>
  );
};

export default ModuleLauncher;