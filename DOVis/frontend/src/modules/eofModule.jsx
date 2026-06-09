import EOFControlPanel from "../components/eofControlPanel";
import EOFResultPanel from "../components/eofResultPanel";
import useEOF from "../hooks/useEOF";

export default function EOFModule({ hidden }) {
  const eof = useEOF();

  const handleClose = () => {
    eof.reset(); // 归零数据，配合下方的条件渲染，会立刻触发 EOFResultPanel 卸载销毁
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

      <button
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: "transparent", border: "none", color: "#fff",
          fontSize: "20px", cursor: "pointer"
        }}
        onClick={handleClose}
      >
        ×
      </button>

      {/* 左侧控制区不变 */}
      <div style={{ width: 340, borderRight: "1px solid #444", padding: 10 }}>
        <EOFControlPanel {...eof} />
      </div>

      {/* 右侧渲染区：改造成条件渲染（方式A） */}
      <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
        {eof.loading || eof.result ? (
          <EOFResultPanel result={eof.result} loading={eof.loading} />
        ) : (
          <div style={{ padding: "40px", color: "#64748b", textAlign: "center", marginTop: "60px" }}>
            <h3 style={{ color: "#fff", marginBottom: "8px", fontSize: "16px" }}>EOF 结果分析看板</h3>
            <p style={{ fontSize: "13px" }}>请在左侧配置空间、时间序列等参数，并点击“运行 EOF 算法”启动后端求解器。</p>
          </div>
        )}
      </div>
    </div>
  );
}