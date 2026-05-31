import EOFControlPanel from "../components/eofControlPanel";
import EOFResultPanel from "../components/eofResultPanel";
import useEOF from "../hooks/useEOF";

export default function EOFModule({ hidden }) {
  const eof = useEOF();

  // 严格执行关闭原则：不仅隐藏看板，还要重置内部状态与可能的 Cesium 缓存
  const handleClose = () => {
    eof.reset(); 
    // 如果之后集成了 Cesium 接口，在这里显式清理三维球图层：cesiumApi.clearEOFDrawing();
    hidden();
  };

  return (
    <div style={{ 
      display: "flex", 
      height: "100%", 
      backgroundColor: "rgba(20, 20, 20, 0.85)", 
      color: "#fff",
      position: "relative" 
    }}>
      
      {/* 统一规范的透明关闭按钮 */}
      <button
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "20px",
          cursor: "pointer"
        }}
        onClick={handleClose}
      >
        ×
      </button>

      {/* 左侧控制区 */}
      <div style={{ width: 340, borderRight: "1px solid #444", padding: 10 }}>
        <EOFControlPanel {...eof} />
      </div>

      {/* 右侧渲染区 */}
      <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
        <EOFResultPanel result={eof.result} loading={eof.loading} />
      </div>
    </div>
  );
}

