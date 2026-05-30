import React, { useState, useMemo } from "react";

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

const C = {
  bg: "#f8f9fa", card: "#ffffff", border: "#dee2e6", text: "#212529",
  muted: "#6c757d", primary: "#1a1a2e", accent: "#0d6efd",
  green: "#198754", red: "#dc3545", yellow: "#f59e0b", blue: "#0d6efd",
};

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

  const s = {
    page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Arial, sans-serif", fontSize: 15 },
    header: { background: C.primary, color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    nav: { background: C.card, borderBottom: `2px solid ${C.border}`, padding: "0 24px", display: "flex" },
    navBtn: (a) => ({ padding: "14px 20px", fontSize: 14, fontWeight: aba === a ? "bold" : "normal", background: "none", border: "none", borderBottom: aba === a ? `3px solid ${C.accent}` : "3px solid transparent", color: aba === a ? C.accent : C.muted, cursor: "pointer" }),
    filterBar: { padding: "12px 24px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" },
    filterBtn: (a) => ({ padding: "6px 14px", fontSize: 13, borderRadius: 6, border: `1px solid ${filtro.periodo === a ? C.accent : C.border}`, background: filtro.periodo === a ? C.accent : "#fff", color: filtro.periodo === a ? "#fff" : C.text, fontWeight: filtro.periodo === a ? "bold" : "normal", cursor: "pointer" }),
    main: { padding: 24 },
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 },
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 },
    kpi: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 },
    kpiLabel: { fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    th: { padding: "10px 14px", textAlign: "left", fontSize: 12, color: C.muted, borderBottom: `1px solid ${C.border}`, background: "#f1f3f5" },
    td: { padding: "10px 14px", fontSize: 13, borderBottom: `1px solid ${C.border}` },
    btn: { background: C.accent, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 7, fontWeight: "bold", cursor: "pointer", fontSize: 13 },
    btnSm: { background: C.accent, color: "#fff", border: "none", padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 12 },
    btnGhost: { background: "none", border: `1px solid ${C.border}`, padding: "9px 18px", borderRadius: 7, cursor: "pointer", fontSize: 13, color: C.text },
    input: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 12px", fontSize: 14, width: "100%", boxSizing: "border-box", color: C.text },
    label: { fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: "bold" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
    modalBox: { background: "#fff", borderRadius: 12, width: "100%", maxWidth: 560, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" },
    modalHead: { padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
    badge: (s) => ({ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: "bold", background: s === "Pago" ? "#d1fae5" : s === "Pendente" ? "#fef3c7" : "#dbeafe", color: s === "Pago" ? "#065f46" : s === "Pendente" ? "#92400e" : "#1e40af" }),
  };

  const abas = [{ id: "dashboard", label: "Dashboard" }, { id: "vendas", label: "Vendas" }, { id: "fornecedores", label: "Fornecedores" }, { id: "relatorios", label: "Relatórios" }];

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 2, textTransform: "uppercase" }}>Sistema de Gestão</div>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>AGÊNCIA · FINANCEIRO</div>
        </div>
        <button onClick={() => { setNovaVenda(emptyVenda()); setModal("venda"); }} style={s.btn}>+ Nova Venda</button>
      </header>

      <nav style={s.nav}>
        {abas.map((a) => <button key={a.id} onClick={() => setAba(a.id)} style={s.navBtn(a.id)}>{a.label}</button>)}
      </nav>

      <div style={s.filterBar}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: "bold" }}>PERÍODO:</span>
        {["dia", "mes", "ano", "tudo"].map((p) => (
          <button key={p} onClick={() => setFiltro((f) => ({ ...f, periodo: p }))} style={s.filterBtn(p)}>
            {p === "dia" ? "Hoje" : p === "mes" ? "Mês" : p === "ano" ? "Ano" : "Tudo"}
          </button>
        ))}
        {filtro.periodo === "mes" && (
          <input type="month" value={filtro.mes} onChange={(e) => setFiltro((f) => ({ ...f, mes: e.target.value }))}
            style={{ ...s.input, width: 160 }} />
        )}
        {filtro.periodo === "ano" && (
          <input type="number" value={filtro.ano} min="2020" max="2030" onChange={(e) => setFiltro((f) => ({ ...f, ano: e.target.value }))}
            style={{ ...s.input, width: 100 }} />
        )}
      </div>

      <main style={s.main}>

        {aba === "dashboard" && (
          <>
            <div style={s.kpiGrid}>
              {[
                { label: "Vendas", val: metricas.qtd, color: C.text },
                { label: "Receita Total", val: fmt(metricas.totalVenda), color: C.green },
                { label: "Custo Total", val: fmt(metricas.totalCusto), color: C.red },
                { label: "Lucro Bruto", val: fmt(metricas.lucro), color: metricas.lucro >= 0 ? C.green : C.red },
                { label: "Comissão", val: fmt(metricas.totalComissao), color: C.yellow },
              ].map((k) => (
                <div key={k.label} style={s.kpi}>
                  <div style={s.kpiLabel}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: k.color }}>{k.val}</div>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: "bold", fontSize: 13, color: C.muted }}>RESUMO POR FORNECEDOR</div>
              {porFornecedor.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: C.muted }}>Nenhuma venda no período.</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Fornecedor", "Qtd", "Custo", "Venda", "Comissão"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>{porFornecedor.map(([nome, d]) => (
                    <tr key={nome}>
                      <td style={s.td}><b>{nome}</b></td>
                      <td style={s.td}>{d.qtd}</td>
                      <td style={{ ...s.td, color: C.red }}>{fmt(d.custo)}</td>
                      <td style={{ ...s.td, color: C.green }}>{fmt(d.venda)}</td>
                      <td style={{ ...s.td, color: C.yellow, fontWeight: "bold" }}>{fmt(d.comissao)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </>
        )}

        {aba === "vendas" && (
          <div style={s.card}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: 13, color: C.muted }}>VENDAS REGISTRADAS</span>
              <button onClick={() => { setNovaVenda(emptyVenda()); setModal("venda"); }} style={s.btn}>+ Nova Venda</button>
            </div>
            {vendasFiltradas.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Nenhuma venda no período.</div> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Data","Cliente","Fornecedor","Descrição","Custo","Venda","Comissão","Pgto Cliente","Pgto Forn.","NF"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>{vendasFiltradas.map((v) => {
                    const f = fornecedores.find((f) => f.id === Number(v.fornecedorId));
                    const comissao = Number(v.custo) * ((f?.comissao || 0) / 100);
                    return (
                      <tr key={v.id}>
                        <td style={s.td}>{fmtDate(v.data)}</td>
                        <td style={s.td}><b>{v.cliente}</b></td>
                        <td style={s.td}>{f?.nome}</td>
                        <td style={{ ...s.td, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.descricao}</td>
                        <td style={{ ...s.td, color: C.red }}>{fmt(v.custo)}</td>
                        <td style={{ ...s.td, color: C.green }}>{fmt(v.venda)}</td>
                        <td style={{ ...s.td, color: C.yellow, fontWeight: "bold" }}>{fmt(comissao)}</td>
                        <td style={s.td}><span style={s.badge(v.pgtoCliente)}>{v.pgtoCliente}</span></td>
                        <td style={s.td}><span style={s.badge(v.pgtoFornecedor)}>{v.pgtoFornecedor}</span></td>
                        <td style={s.td}>{v.nfEmitida ? <span style={{ color: C.green, fontWeight: "bold" }}>✓ Emitida</span> : <button onClick={() => emitirNF(v)} style={s.btnSm}>Emitir</button>}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {aba === "fornecedores" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={() => setModal("fornecedor")} style={s.btn}>+ Cadastrar Fornecedor</button>
            </div>
            <div style={s.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Fornecedor","CNPJ","Comissão s/ Custo","Vendas","Comissão Total"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{fornecedores.map((f) => {
                  const vf = vendasFiltradas.filter((v) => Number(v.fornecedorId) === f.id);
                  const total = vf.reduce((a, v) => a + Number(v.custo || 0) * (f.comissao / 100), 0);
                  return (
                    <tr key={f.id}>
                      <td style={s.td}><b>{f.nome}</b></td>
                      <td style={s.td}>{f.cnpj}</td>
                      <td style={{ ...s.td, color: C.yellow, fontWeight: "bold" }}>{f.comissao}%</td>
                      <td style={s.td}>{vf.length}</td>
                      <td style={{ ...s.td, color: C.green, fontWeight: "bold" }}>{fmt(total)}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </>
        )}

        {aba === "relatorios" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div style={s.card}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: "bold", fontSize: 13, color: C.muted }}>NF DE COMISSÃO PENDENTES</div>
              <div style={{ padding: 16 }}>
                {vendasFiltradas.filter((v) => !v.nfEmitida).length === 0 ? <p style={{ color: C.muted }}>Todas as NFs foram emitidas.</p> :
                  vendasFiltradas.filter((v) => !v.nfEmitida).map((v) => {
                    const f = fornecedores.find((f) => f.id === Number(v.fornecedorId));
                    return (
                      <div key={v.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div><div style={{ fontWeight: "bold" }}>{v.cliente}</div><div style={{ fontSize: 12, color: C.muted }}>{f?.nome} · {fmtDate(v.data)}</div></div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ color: C.yellow, fontWeight: "bold" }}>{fmt(Number(v.custo) * ((f?.comissao || 0) / 100))}</span>
                          <button onClick={() => emitirNF(v)} style={s.btnSm}>Emitir NF</button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div style={s.card}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: "bold", fontSize: 13, color: C.muted }}>RESUMO DO PERÍODO</div>
              <div style={{ padding: 16 }}>
                {[{ label: "Receita de Vendas", val: metricas.totalVenda, color: C.green }, { label: "Custo Total", val: metricas.totalCusto, color: C.red }, { label: "Lucro Bruto", val: metricas.lucro, color: metricas.lucro >= 0 ? C.green : C.red }, { label: "Comissão a Receber", val: metricas.totalComissao, color: C.yellow }].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                    <span style={{ color: C.muted }}>{r.label}</span>
                    <span style={{ fontWeight: "bold", color: r.color }}>{fmt(r.val)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14 }}>
                  <span style={{ color: C.muted }}>NFs Emitidas / Total</span>
                  <span style={{ fontWeight: "bold" }}>{vendasFiltradas.filter((v) => v.nfEmitida).length} / {vendasFiltradas.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {modal === "venda" && (
        <div style={s.overlay}>
          <div style={s.modalBox}>
            <div style={s.modalHead}>
              <span style={{ fontWeight: "bold", fontSize: 15 }}>Registrar Venda</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[{ label: "Data", key: "data", type: "date" }, { label: "Cliente", key: "cliente", type: "text", placeholder: "Nome completo" }, { label: "Descrição do Serviço", key: "descricao", type: "text", placeholder: "Ex: Pacote Lisboa 7 noites" }, { label: "Nº do Voucher", key: "voucher", type: "text", placeholder: "Código do voucher" }, { label: "Valor de Custo (R$)", key: "custo", type: "number", placeholder: "0,00" }, { label: "Valor de Venda (R$)", key: "venda", type: "number", placeholder: "0,00" }].map((f) => (
                <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={s.label}>{f.label}</span>
                  <input type={f.type} placeholder={f.placeholder} value={novaVenda[f.key]} onChange={(e) => setNovaVenda((p) => ({ ...p, [f.key]: e.target.value }))} style={s.input} />
                </label>
              ))}
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={s.label}>Fornecedor</span>
                <select value={novaVenda.fornecedorId} onChange={(e) => setNovaVenda((p) => ({ ...p, fornecedorId: e.target.value }))} style={s.input}>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome} ({f.comissao}%)</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={s.label}>Pgto Cliente</span>
                <select value={novaVenda.pgtoCliente} onChange={(e) => setNovaVenda((p) => ({ ...p, pgtoCliente: e.target.value }))} style={s.input}>
                  {STATUS_PGTO.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={s.label}>Pgto Fornecedor</span>
                <select value={novaVenda.pgtoFornecedor} onChange={(e) => setNovaVenda((p) => ({ ...p, pgtoFornecedor: e.target.value }))} style={s.input}>
                  {STATUS_PGTO.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {novaVenda.custo && (() => {
              const f = fornecedores.find((f) => f.id === Number(novaVenda.fornecedorId));
              const c = Number(novaVenda.custo) * ((f?.comissao || 0) / 100);
              return <div style={{ margin: "0 24px 16px", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 7, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>Comissão calculada: <b>{fmt(c)}</b> ({f?.comissao}% sobre o custo)</div>;
            })()}
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setModal(null)} style={s.btnGhost}>Cancelar</button>
              <button onClick={salvarVenda} style={s.btn}>Salvar Venda</button>
            </div>
          </div>
        </div>
      )}

      {modal === "fornecedor" && (
        <div style={s.overlay}>
          <div style={{ ...s.modalBox, maxWidth: 420 }}>
            <div style={s.modalHead}>
              <span style={{ fontWeight: "bold", fontSize: 15 }}>Cadastrar Fornecedor</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {[{ label: "Razão Social", key: "nome", placeholder: "Nome do fornecedor" }, { label: "CNPJ", key: "cnpj", placeholder: "00.000.000/0000-00" }, { label: "% Comissão sobre Custo", key: "comissao", placeholder: "Ex: 10" }].map((f) => (
                <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={s.label}>{f.label}</span>
                  <input type="text" placeholder={f.placeholder} value={novoForn[f.key]} onChange={(e) => setNovoForn((p) => ({ ...p, [f.key]: e.target.value }))} style={s.input} />
                </label>
              ))}
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setModal(null)} style={s.btnGhost}>Cancelar</button>
              <button onClick={salvarFornecedor} style={s.btn}>Cadastrar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "nf" && nfPreview && (
        <div style={s.overlay}>
          <div style={{ ...s.modalBox, maxWidth: 500 }}>
            <div style={s.modalHead}>
              <span style={{ fontWeight: "bold", fontSize: 15 }}>Emissão de NF de Comissão</span>
              <button onClick={() => { setNfPreview(null); setModal(null); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>Emitente</div><div style={{ fontWeight: "bold" }}>Agência de Turismo</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: C.muted }}>Data</div><div>{fmtDate(hoje())}</div></div>
                </div>
                <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase" }}>Destinatário</div><div style={{ fontWeight: "bold" }}>{nfPreview.fornecedor?.nome}</div><div style={{ color: C.muted, fontSize: 12 }}>CNPJ: {nfPreview.fornecedor?.cnpj}</div></div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Discriminação</div>
                  <div>Comissão de {nfPreview.fornecedor?.comissao}% sobre custo — Cliente: {nfPreview.venda.cliente}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>Serviço: {nfPreview.venda.descricao} · Voucher: {nfPreview.venda.voucher || "—"}</div>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: 11, color: C.muted }}>Base de cálculo</div><div>{fmt(nfPreview.venda.custo)}</div></div>
                  <div><div style={{ fontSize: 11, color: C.muted }}>Alíquota</div><div>{nfPreview.fornecedor?.comissao}%</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: C.muted }}>VALOR DA COMISSÃO</div><div style={{ fontSize: 24, fontWeight: "bold", color: C.yellow }}>{fmt(nfPreview.comissao)}</div></div>
                </div>
              </div>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => { setNfPreview(null); setModal(null); }} style={s.btnGhost}>Cancelar</button>
              <button onClick={confirmarNF} style={{ ...s.btn, background: C.green }}>✓ Confirmar Emissão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
