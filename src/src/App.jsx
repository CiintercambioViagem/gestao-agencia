import { useState, useMemo } from "react";

const FORNECEDORES_INIT = [
  { id: 1, nome: "Azul Viagens", cnpj: "12.345.678/0001-90", comissao: 10 },
  { id: 2, nome: "CVC Operadora", cnpj: "98.765.432/0001-11", comissao: 12 },
  { id: 3, nome: "Hotéis Premium", cnpj: "55.555.555/0001-55", comissao: 8 },
];

const STATUS_PGTO = ["Pendente", "Pago", "Parcial"];

function fmt(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}
function hoje() {
  return new Date().toISOString().split("T")[0];
}

let _id = 100;
const uid = () => ++_id;

export default function App() {
  const [aba, setAba] = useState("dashboard");
  const [vendas, setVendas] = useState([]);
  const [fornecedores, setFornecedores] = useState(FORNECEDORES_INIT);
  const [modal, setModal] = useState(null);
  const [filtro, setFiltro] = useState({ periodo: "mes", mes: hoje().slice(0, 7), ano: hoje().slice(0, 4) });
  const [novaVenda, setNovaVenda] = useState(emptyVenda());
  const [novoForn, setNovoForn] = useState({ nome: "", cnpj: "", comissao: "" });
  const [nfPreview, setNfPreview] = useState(null);

  function emptyVenda() {
    return { data: hoje(), cliente: "", fornecedorId: 1, descricao: "", custo: "", venda: "", pgtoCliente: "Pendente", pgtoFornecedor: "Pendente", voucher: "", nfEmitida: false };
  }

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((v) => {
      if (filtro.periodo === "dia") return v.data === hoje();
      if (filtro.periodo === "mes") return v.data.startsWith(filtro.mes);
      if (filtro.periodo === "ano") return v.data.startsWith(filtro.ano);
      return true;
    });
  }, [vendas, filtro]);

  const metricas = useMemo(() => {
    const totalVenda = vendasFiltradas.reduce((a, v) => a + Number(v.venda || 0), 0);
    const totalCusto = vendasFiltradas.reduce((a, v) => a + Number(v.custo || 0), 0);
    const totalComissao = vendasFiltradas.reduce((a, v) => {
      const f = fornecedores.find((f) => f.id === Number(v.fornecedorId));
      return a + Number(v.custo || 0) * ((f?.comissao || 0) / 100);
    }, 0);
    return { totalVenda, totalCusto, totalComissao, lucro: totalVenda - totalCusto, qtd: vendasFiltradas.length };
  }, [vendasFiltradas, fornecedores]);

  function salvarVenda() {
    if (!novaVenda.cliente || !novaVenda.custo || !novaVenda.venda) return;
    setVendas((prev) => [...prev, { ...novaVenda, id: uid(), fornecedorId: Number(novaVenda.fornecedorId) }]);
    setNovaVenda(emptyVenda());
    setModal(null);
  }

  function salvarFornecedor() {
    if (!novoForn.nome || !novoForn.cnpj) return;
    setFornecedores((prev) => [...prev, { ...novoForn, id: uid(), comissao: Number(novoForn.comissao) }]);
    setNovoForn({ nome: "", cnpj: "", comissao: "" });
    setModal(null);
  }

  function emitirNF(venda) {
    const f = fornecedores.find((f) => f.id === Number(venda.fornecedorId));
    setNfPreview({ venda, fornecedor: f, comissao: Number(venda.custo) * ((f?.comissao || 0) / 100) });
    setModal("nf");
  }

  function confirmarNF() {
    setVendas((prev) => prev.map((v) => (v.id === nfPreview.venda.id ? { ...v, nfEmitida: true } : v)));
    setNfPreview(null);
    setModal(null);
  }

  const porFornecedor = useMemo(() => {
    const map = {};
    vendasFiltradas.forEach((v) => {
      const f = fornecedores.find((f) => f.id === Number(v.fornecedorId));
      const nome = f?.nome || "Desconhecido";
      if (!map[nome]) map[nome] = { custo: 0, venda: 0, comissao: 0, qtd: 0 };
      map[nome].custo += Number(v.custo || 0);
      map[nome].venda += Number(v.venda || 0);
      map[nome].comissao += Number(v.custo || 0) * ((f?.comissao || 0) / 100);
      map[nome].qtd++;
    });
    return Object.entries(map);
  }, [vendasFiltradas, fornecedores]);

  const abas = [{ id: "dashboard", label: "Dashboard" }, { id: "vendas", label: "Vendas" }, { id: "fornecedores", label: "Fornecedores" }, { id: "relatorios", label: "Relatórios" }];

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "'IBM Plex Mono', monospace" }}>
      <header style={{ borderBottom: "1px solid #27272a", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "#52525b", letterSpacing: 4, textTransform: "uppercase" }}>Sistema de Gestão</div>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>AGÊNCIA · FINANCEIRO</div>
        </div>
        <button onClick={() => { setNovaVenda(emptyVenda()); setModal("venda"); }}
          style={{ background: "white", color: "black", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>
          + Nova Venda
        </button>
      </header>

      <nav style={{ borderBottom: "1px solid #18181b", padding: "0 24px", display: "flex" }}>
        {abas.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ padding: "12px 20px", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, background: "none", border: "none", borderBottom: aba === a.id ? "2px solid white" : "2px solid transparent", color: aba === a.id ? "white" : "#71717a", cursor: "pointer" }}>
            {a.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 24px", borderBottom: "1px solid #18181b", display: "flex", gap: 8, alignItems: "center" }}>
        {["dia", "mes", "ano", "tudo"].map((p) => (
          <button key={p} onClick={() => setFiltro((f) => ({ ...f, periodo: p }))}
            style={{ padding: "4px 12px", fontSize: 11, borderRadius: 4, border: "none", background: filtro.periodo === p ? "white" : "transparent", color: filtro.periodo === p ? "black" : "#71717a", fontWeight: filtro.periodo === p ? "bold" : "normal", cursor: "pointer" }}>
            {p === "dia" ? "Hoje" : p === "mes" ? "Mês" : p === "ano" ? "Ano" : "Tudo"}
          </button>
        ))}
        {filtro.periodo === "mes" && (
          <input type="month" value={filtro.mes} onChange={(e) => setFiltro((f) => ({ ...f, mes: e.target.value }))}
            style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 4, padding: "4px 8px", color: "white", fontSize: 11 }} />
        )}
      </div>

      <main style={{ padding: 24 }}>
        {aba === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {[
                { label: "Vendas", val: metricas.qtd, color: "white" },
                { label: "Receita", val: fmt(metricas.totalVenda), color: "#34d399" },
                { label: "Custo", val: fmt(metricas.totalCusto), color: "#f87171" },
                { label: "Lucro", val: fmt(metricas.lucro), color: metricas.lucro >= 0 ? "#34d399" : "#f87171" },
                { label: "Comissão", val: fmt(metricas.totalComissao), color: "#fbbf24" },
              ].map((k) => (
                <div key={k.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 3 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: k.color, marginTop: 4 }}>{k.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a", fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 3 }}>Por Fornecedor</div>
              {porFornecedor.length === 0 ? <div style={{ padding: 24, color: "#52525b", textAlign: "center" }}>Nenhuma venda no período.</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ color: "#52525b", fontSize: 11 }}>
                    {["Fornecedor", "Qtd", "Custo", "Venda", "Comissão"].map((h) => <th key={h} style={{ padding: "8px 16px", textAlign: h === "Fornecedor" ? "left" : "right" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{porFornecedor.map(([nome, d]) => (
                    <tr key={nome} style={{ borderTop: "1px solid #27272a" }}>
                      <td style={{ padding: "10px 16px" }}>{nome}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "#a1a1aa" }}>{d.qtd}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "#f87171" }}>{fmt(d.custo)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "#34d399" }}>{fmt(d.venda)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "#fbbf24" }}>{fmt(d.comissao)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {aba === "vendas" && (
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, overflow: "auto" }}>
            {vendasFiltradas.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#52525b" }}>
                Nenhuma venda registrada.
                <br />
                <button onClick={() => { setNovaVenda(emptyVenda()); setModal("venda"); }}
                  style={{ marginTop: 12, background: "none", border: "1px solid #3f3f46", color: "white", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                  + Registrar venda
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ color: "#52525b", fontSize: 11, borderBottom: "1px solid #27272a" }}>
                  {["Data","Cliente","Fornecedor","Descrição","Custo","Venda","Comissão","Pgto Cliente","Pgto Forn.","NF"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{vendasFiltradas.map((v) => {
                  const f = fornecedores.find((f) => f.id === Number(v.fornecedorId));
                  const comissao = Number(v.custo) * ((f?.comissao || 0) / 100);
                  return (
                    <tr key={v.id} style={{ borderTop: "1px solid #27272a" }}>
                      <td style={{ padding: "8px 12px", color: "#a1a1aa" }}>{fmtDate(v.data)}</td>
                      <td style={{ padding: "8px 12px" }}>{v.cliente}</td>
                      <td style={{ padding: "8px 12px", color: "#d4d4d8" }}>{f?.nome}</td>
                      <td style={{ padding: "8px 12px", color: "#a1a1aa", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{v.descricao}</td>
                      <td style={{ padding: "8px 12px", color: "#f87171", textAlign: "right" }}>{fmt(v.custo)}</td>
                      <td style={{ padding: "8px 12px", color: "#34d399", textAlign: "right" }}>{fmt(v.venda)}</td>
                      <td style={{ padding: "8px 12px", color: "#fbbf24", textAlign: "right" }}>{fmt(comissao)}</td>
                      <td style={{ padding: "8px 12px" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: v.pgtoCliente === "Pago" ? "#064e3b" : "#78350f", color: v.pgtoCliente === "Pago" ? "#34d399" : "#fbbf24" }}>{v.pgtoCliente}</span></td>
                      <td style={{ padding: "8px 12px" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: v.pgtoFornecedor === "Pago" ? "#064e3b" : "#78350f", color: v.pgtoFornecedor === "Pago" ? "#34d399" : "#fbbf24" }}>{v.pgtoFornecedor}</span></td>
                      <td style={{ padding: "8px 12px" }}>{v.nfEmitida ? <span style={{ color: "#34d399", fontSize: 11 }}>✓ Emitida</span> : <button onClick={() => emitirNF(v)} style={{ background: "none", border: "none", color: "#fbbf24", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Emitir</button>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        )}

        {aba === "fornecedores" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setModal("fornecedor")} style={{ background: "white", color: "black", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>+ Cadastrar Fornecedor</button>
            </div>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ color: "#52525b", fontSize: 11, borderBottom: "1px solid #27272a" }}>
                  {["Fornecedor","CNPJ","Comissão s/ Custo","Vendas","Comissão Total"].map((h) => <th key={h} style={{ padding: "8px 16px", textAlign: "left" }}>{h}</th>)}
                </tr></thead>
                <tbody>{fornecedores.map((f) => {
                  const vf = vendasFiltradas.filter((v) => Number(v.fornecedorId) === f.id);
                  const total = vf.reduce((a, v) => a + Number(v.custo || 0) * (f.comissao / 100), 0);
                  return (
                    <tr key={f.id} style={{ borderTop: "1px solid #27272a" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "bold" }}>{f.nome}</td>
                      <td style={{ padding: "12px 16px", color: "#a1a1aa" }}>{f.cnpj}</td>
                      <td style={{ padding: "12px 16px", color: "#fbbf24" }}>{f.comissao}%</td>
                      <td style={{ padding: "12px 16px", color: "#a1a1aa" }}>{vf.length}</td>
                      <td style={{ padding: "12px 16px", color: "#34d399" }}>{fmt(total)}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {aba === "relatorios" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>NF de Comissão Pendentes</div>
              {vendasFiltradas.filter((v) => !v.nfEmitida).length === 0 ? <p style={{ color: "#52525b", fontSize: 13 }}>Todas emitidas.</p> :
                vendasFiltradas.filter((v) => !v.nfEmitida).map((v) => {
                  const f = fornecedores.find((f) => f.id === Number(v.fornecedorId));
                  return (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #27272a" }}>
                      <div><div style={{ fontSize: 13 }}>{v.cliente}</div><div style={{ fontSize: 11, color: "#52525b" }}>{f?.nome} · {fmtDate(v.data)}</div></div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ color: "#fbbf24", fontSize: 13 }}>{fmt(Number(v.custo) * ((f?.comissao || 0) / 100))}</span>
                        <button onClick={() => emitirNF(v)} style={{ fontSize: 10, background: "#27272a", border: "none", color: "white", padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}>Emitir NF</button>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>Resumo do Período</div>
              {[{ label: "Receita", val: metricas.totalVenda, color: "#34d399" }, { label: "Custo", val: metricas.totalCusto, color: "#f87171" }, { label: "Lucro", val: metricas.lucro, color: metricas.lucro >= 0 ? "#34d399" : "#f87171" }, { label: "Comissão a Receber", val: metricas.totalComissao, color: "#fbbf24" }].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>
                  <span style={{ color: "#71717a" }}>{r.label}</span>
                  <span style={{ fontWeight: "bold", color: r.color }}>{fmt(r.val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal === "venda" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 12, width: "100%", maxWidth: 560 }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 3 }}>Registrar Venda</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#71717a", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Data", key: "data", type: "date" },
                { label: "Cliente", key: "cliente", type: "text", placeholder: "Nome completo" },
                { label: "Descrição", key: "descricao", type: "text", placeholder: "Ex: Pacote Lisboa 7 noites" },
                { label: "Nº Voucher", key: "voucher", type: "text", placeholder: "Código do voucher" },
                { label: "Valor de Custo (R$)", key: "custo", type: "number", placeholder: "0,00" },
                { label: "Valor de Venda (R$)", key: "venda", type: "number", placeholder: "0,00" },
              ].map((f) => (
                <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 2 }}>{f.label}</span>
                  <input type={f.type} placeholder={f.placeholder} value={novaVenda[f.key]} onChange={(e) => setNovaVenda((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "8px 12px", color: "white", fontSize: 13, fontFamily: "monospace" }} />
                </label>
              ))}
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 2 }}>Fornecedor</span>
                <select value={novaVenda.fornecedorId} onChange={(e) => setNovaVenda((p) => ({ ...p, fornecedorId: e.target.value }))}
                  style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "8px 12px", color: "white", fontSize: 13 }}>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome} ({f.comissao}%)</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 2 }}>Pgto Cliente</span>
                <select value={novaVenda.pgtoCliente} onChange={(e) => setNovaVenda((p) => ({ ...p, pgtoCliente: e.target.value }))}
                  style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "8px 12px", color: "white", fontSize: 13 }}>
                  {STATUS_PGTO.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 2 }}>Pgto Fornecedor</span>
                <select value={novaVenda.pgtoFornecedor} onChange={(e) => setNovaVenda((p) => ({ ...p, pgtoFornecedor: e.target.value }))}
                  style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "8px 12px", color: "white", fontSize: 13 }}>
                  {STATUS_PGTO.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={salvarVenda} style={{ background: "white", color: "black", border: "none", padding: "8px 24px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "fornecedor" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 12, width: "100%", maxWidth: 400 }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 3 }}>Cadastrar Fornecedor</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#71717a", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {[{ label: "Razão Social", key: "nome", placeholder: "Nome do fornecedor" }, { label: "CNPJ", key: "cnpj", placeholder: "00.000.000/0000-00" }, { label: "% Comissão sobre Custo", key: "comissao", placeholder: "Ex: 10" }].map((f) => (
                <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: 2 }}>{f.label}</span>
                  <input type="text" placeholder={f.placeholder} value={novoForn[f.key]} onChange={(e) => setNovoForn((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "8px 12px", color: "white", fontSize: 13, fontFamily: "monospace" }} />
                </label>
              ))}
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={salvarFornecedor} style={{ background: "white", color: "black", border: "none", padding: "8px 24px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "nf" && nfPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 12, width: "100%", maxWidth: 500 }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 3 }}>NF de Comissão</span>
              <button onClick={() => { setNfPreview(null); setModal(null); }} style={{ background: "none", border: "none", color: "#71717a", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, padding: 20, fontSize: 13, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: 12 }}>
                  <div><div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Emitente</div><div style={{ fontWeight: "bold" }}>Agência de Turismo</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#52525b" }}>Data</div><div>{fmtDate(hoje())}</div></div>
                </div>
                <div><div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Destinatário</div><div style={{ fontWeight: "bold" }}>{nfPreview.fornecedor?.nome}</div><div style={{ color: "#71717a", fontSize: 11 }}>CNPJ: {nfPreview.fornecedor?.cnpj}</div></div>
                <div style={{ borderTop: "1px solid #27272a", paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", marginBottom: 6 }}>Discriminação</div>
                  <div style={{ color: "#d4d4d8", fontSize: 12 }}>Comissão de {nfPreview.fornecedor?.comissao}% sobre custo — Cliente: {nfPreview.venda.cliente}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 11 }}>Serviço: {nfPreview.venda.descricao} · Voucher: {nfPreview.venda.voucher || "—"}</div>
                </div>
                <div style={{ borderTop: "1px solid #27272a", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: 10, color: "#52525b" }}>Base de cálculo</div><div>{fmt(nfPreview.venda.custo)}</div></div>
                  <div><div style={{ fontSize: 10, color: "#52525b" }}>Alíquota</div><div>{nfPreview.fornecedor?.comissao}%</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#52525b" }}>VALOR DA COMISSÃO</div><div style={{ fontSize: 22, fontWeight: "bold", color: "#fbbf24" }}>{fmt(nfPreview.comissao)}</div></div>
                </div>
              </div>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => { setNfPreview(null); setModal(null); }} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={confirmarNF} style={{ background: "#f59e0b", color: "black", border: "none", padding: "8px 24px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>✓ Confirmar Emissão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
