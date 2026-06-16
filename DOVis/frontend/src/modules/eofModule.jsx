import { useEffect } from "react";
import EOFControlPanel from "../components/eofControlPanel";
import EOFResultPanel from "../components/eofResultPanel";
import useEOF from "../hooks/useEOF";

export default function EOFModule({ registerCleanup }) {
  const eof = useEOF();
  const { reset } = eof;

  useEffect(() => {
    registerCleanup?.(() => reset());
  }, [registerCleanup, reset]);

  return (
    <div style={{
      display: "flex",
      height: "100%",
      backgroundColor: "rgba(38, 37, 35, 0.95)",
      color: "#F0F0F0",
      position: "relative"
    }}>

      {/* 左侧控制区不变 */}
      <div style={{ width: 340, borderRight: "1px solid rgba(218,217,215,0.08)", padding: 10 }}>
        <EOFControlPanel {...eof} />
      </div>

      {/* 右侧渲染区：改造成条件渲染（方式A） */}
      <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
        {eof.loading || eof.result ? (
          <EOFResultPanel result={eof.result} loading={eof.loading} />
        ) : (
          <div style={{ padding: "40px", color: "rgba(195,194,190,0.6)", textAlign: "center", marginTop: "60px" }}>
            <h3 style={{ color: "#F0F0F0", marginBottom: "8px", fontSize: "16px", fontFamily: "'Playfair Display', serif" }}>EOF 结果分析看板</h3>
            <p style={{ fontSize: "13px" }}>请在左侧配置空间、时间序列等参数，并点击“运行 EOF 算法”启动后端求解器。</p>
          </div>
        )}
      </div>
    </div>
  );
}
