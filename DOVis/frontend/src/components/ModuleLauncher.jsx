import {
  AimOutlined,
  BorderOuterOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';

const icons = {
  iso: <DeploymentUnitOutlined />,
  hypoxia: <AimOutlined />,
};

const fallbackIcon = <BorderOuterOutlined />;

const ModuleLauncher = ({ modules, onOpen }) => {
  return (
    <nav className="module-dock" aria-label="Analysis modules">
      {modules.map((module) => (
        <button
          key={module.id}
          className="module-button"
          onClick={() => onOpen(module)}
          title={`Open ${module.title}`}
        >
          <span className="module-icon">{icons[module.id] || fallbackIcon}</span>
          <span>{module.title}</span>
        </button>
      ))}
    </nav>
  );
};

export default ModuleLauncher;
