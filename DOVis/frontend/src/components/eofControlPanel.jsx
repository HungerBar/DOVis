export default function EOFControlPanel() {
  return (
    <div>
      <h2>EOF Analysis</h2>

      <div>
        <label>Mode</label>

        <select>
          <option value="horizontal">
            Horizontal
          </option>

          <option value="section">
            Section
          </option>
        </select>
      </div>

      <button>
        Run EOF
      </button>
    </div>
  );
}