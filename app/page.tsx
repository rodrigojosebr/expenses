export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1>gastos-kv-mvp</h1>
      <p>Endpoints:</p>
      <ul>
        <li><code>POST /api/gasto</code> (header <code>x-api-key</code>, JSON: <code>{`{"text":"uber 32,90 nubank"}`}</code>)</li>
        <li><code>GET /api/export.csv?month=YYYY-MM&amp;key=API_KEY</code></li>
      </ul>
    </main>
  );
}
