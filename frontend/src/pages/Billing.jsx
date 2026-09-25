import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Billing.css';

const money = paise => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);
const empty = { projectName: '', clientName: '', title: '', scope: '', approverEmail: '', amount: '', dueDate: '', poRequired: true, taskIds: [] };
const label = { blocked: 'Needs attention', ready: 'Ready to bill', invoiced: 'Invoiced' };
function Field({ title, children }) { return <label className="br-field"><span>{title}</span>{children}</label>; }
function download(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function formatPackage(data) {
  const m = data.milestone;
  return ['SIMPTA · BILLING PACKAGE', '', `Project: ${m.projectName}`, `Client: ${m.clientName}`, `Milestone: ${m.title}`, `Amount (INR, before tax): ${money(m.amountPaise)}`, `Due: ${m.dueDate}`, `Status: ${label[data.readiness.status]}`, `PO: ${m.poReference || 'Not required'}`, `Invoice reference: ${m.invoiceReference || 'Not yet invoiced'}`, '', 'AGREED SCOPE', m.scope, '', 'DELIVERY EVIDENCE', ...m.evidence.map(e => `${e.note}\n${e.url || ''}\nRecorded ${e.addedAt} by ${e.addedBy}`), '', 'LINKED TASKS', ...data.tasks.map(t => `${t.title}: ${t.status}`), '', 'CLIENT APPROVAL (MANUALLY RECORDED)', `Designated contact: ${m.approverEmail}`, `Approver: ${m.approval?.name || ''}`, m.approval?.note || '', `Recorded: ${m.approval?.recordedAt || ''} by ${m.approval?.recordedBy || ''}`, data.approvalMethod, '', 'ACTIVITY HISTORY', ...m.history.map(h => `${h.at} · ${h.description} · ${h.actor}`), '', `Exported: ${data.exportedAt}`, data.note].join('\n');
}
export default function Billing() {
  const { companyStatus } = useAuth();
  const [items, setItems] = useState([]), [tasks, setTasks] = useState([]);
  const [selectedId, select] = useState(null), [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false), [form, setForm] = useState(empty);
  const [action, setAction] = useState(null), [actionForm, setActionForm] = useState({});
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = async () => {
    const [a,b] = await Promise.all([api.get('/billing'), api.get('/tasks')]);
    setItems(a.data); setTasks(b.data); setLoading(false);
  };
  useEffect(() => { load().catch(e => { setError(e.response?.data?.message || 'Could not load billing records. Retry below.'); setLoading(false); }); }, []);
  const selected = items.find(m => m._id === selectedId);
  const run = async (fn, success) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); setNotice(success); return true; }
    catch(e) { setError(e.response?.data?.message || 'Could not complete this action. Your input has been kept.'); return false; }
    finally { setBusy(false); }
  };
  const create = async e => {
    e.preventDefault();
    await run(async () => { const r = await api.post('/billing', form); setForm(empty); setShowCreate(false); select(r.data._id); await load(); }, 'Milestone created.');
  };
  const act = async (e, payload) => {
    e?.preventDefault();
    await run(async () => { await api.post(`/billing/${selected._id}/actions`, { ...payload, version: selected.__v }); setAction(null); setActionForm({}); await load(); }, 'Milestone updated.');
  };
  const start = type => { setAction(type); setActionForm({}); setError(''); };
  const exportPackage = () => run(async () => {
    const r = await api.get(`/billing/${selected._id}/package`);
    download(`simpta-billing-${selected._id}.txt`, formatPackage(r.data), 'text/plain;charset=utf-8');
  }, 'Billing package downloaded.');
  const draft = () => {
    const body = `To: ${selected.approverEmail}\nSubject: Approval requested — ${selected.projectName} / ${selected.title}\n\nHello,\n\nPlease review the completed milestone below and reply with your approval or requested changes.\n\nProject: ${selected.projectName}\nMilestone: ${selected.title}\nAgreed scope: ${selected.scope}\nMilestone value: ${money(selected.amountPaise)} before tax\n\nDelivery evidence:\n${selected.evidence.map(e => `${e.note}${e.url ? '\n' + e.url : ''}`).join('\n\n')}\n\nThank you.`;
    download('approval-request.txt', body, 'text/plain;charset=utf-8'); setNotice('Draft downloaded. Review it and send it through your email.');
  };
  if (companyStatus?.productType === 'school') return <Layout title="Billing readiness"><p>This module is for task-management workspaces.</p></Layout>;
  const visible = items.filter(m => filter === 'all' || m.status === filter);
  return <Layout title="Billing readiness"><div className="br">
    <div className="br-heading"><div><p className="br-kicker">SIMPTA / DELIVERY TO BILLING</p><h2>Make completed work count.</h2><p>Resolve the missing pieces between delivery and your next invoice.</p></div><button className="br-primary" disabled={busy} onClick={() => { setShowCreate(!showCreate); setError(''); }}>{showCreate ? 'Close form' : '+ New milestone'}</button></div>
    {error && <div role="alert" className="br-error">{error} <button disabled={busy} onClick={() => run(load, 'Records refreshed.')}>Refresh records</button></div>}
    {notice && <p role="status" className="br-notice">{notice}</p>}
    <div className="br-metrics">{['blocked','ready','invoiced'].map(status => <button key={status} className={`br-metric ${status}`} onClick={() => setFilter(status)}><span>{label[status]}</span><strong>{money(items.filter(m => m.status === status).reduce((s,m) => s+m.amountPaise,0))}</strong><small>{items.filter(m => m.status === status).length} milestones · before tax</small></button>)}</div>
    {showCreate && <form className="br-card br-create" onSubmit={create}><div className="br-section-head"><h3>New billing milestone</h3><span>INR · before tax</span></div><div className="br-form-grid">
      {[['projectName','Project name'],['clientName','Client name'],['title','Milestone name'],['approverEmail','Client approver email'],['amount','Milestone amount (₹)'],['dueDate','Target billing date']].map(([key,title]) => <Field key={key} title={title}><input required maxLength={key === 'amount' ? 16 : 300} type={key === 'dueDate' ? 'date' : key === 'approverEmail' ? 'email' : 'text'} inputMode={key === 'amount' ? 'decimal' : undefined} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} /></Field>)}
      <div className="br-wide"><Field title="Agreed scope and acceptance criteria"><textarea required maxLength={10000} rows={3} placeholder="Paste the agreed deliverables and what counts as acceptance." value={form.scope} onChange={e => setForm({...form,scope:e.target.value})}/></Field></div>
      <fieldset className="br-wide"><legend>Link existing tasks (optional)</legend><p className="br-muted">All linked tasks must be completed before this milestone is ready. Scope and task links are fixed after creation.</p><div className="br-task-picker">{tasks.length ? tasks.map(t => <label key={t._id}><input type="checkbox" checked={form.taskIds.includes(t._id)} onChange={e => setForm({...form,taskIds:e.target.checked ? [...form.taskIds,t._id] : form.taskIds.filter(id => id !== t._id)})}/><span>{t.title} <small>· {t.status}</small></span></label>) : <p>No tasks yet. You can confirm delivery manually.</p>}</div></fieldset>
      <label className="br-check br-wide"><input type="checkbox" checked={form.poRequired} onChange={e => setForm({...form,poRequired:e.target.checked})}/> Purchase order required before billing</label>
    </div><button className="br-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Create milestone'}</button></form>}
    <div className="br-workspace"><section className="br-card"><div className="br-section-head"><h3>Milestones</h3><label>View <select aria-label="Filter milestones" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All milestones</option>{Object.entries(label).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
      {loading ? <p className="br-empty">Loading milestones…</p> : !visible.length ? <div className="br-empty"><h3>{items.length ? 'No milestones in this view' : 'Your first milestone starts here'}</h3><p>{items.length ? 'Choose another view to see your work.' : 'Add a client, the agreed scope and a milestone value. Then link the tasks your team already uses.'}</p></div> : <div className="br-list">{visible.map(m => <button key={m._id} disabled={busy} className={`br-row ${selectedId === m._id ? 'selected' : ''}`} onClick={()=>{select(m._id);setAction(null);setActionForm({});}}><div className="br-row-top"><span className={`br-pill ${m.status}`}>{label[m.status]}</span><strong>{money(m.amountPaise)}</strong></div><h4>{m.title}</h4><p>{m.projectName} · {m.clientName}</p><div className="br-row-foot"><span>Due {m.dueDate}</span><span>{m.status === 'blocked' ? `${m.blockers.length} blockers` : m.status === 'ready' ? 'All checks complete' : m.invoiceReference}</span></div></button>)}</div>}
      <p className="br-footnote">Latest 500 milestones · amounts exclude tax</p></section>
      <section className="br-card br-detail" aria-label="Milestone details">{!selected ? <div className="br-empty"><span className="br-monogram">S</span><h3>A clear path to billing</h3><p>Select a milestone to review delivery, evidence, purchase order and client approval.</p></div> : <>
        <div className="br-section-head"><span className={`br-pill ${selected.status}`}>{label[selected.status]}</span><strong>{money(selected.amountPaise)}</strong></div><h3 className="br-detail-title">{selected.title}</h3><p className="br-muted">{selected.projectName} · {selected.clientName}</p><h4>Agreed scope</h4><p className="br-pre">{selected.scope}</p>
        <div className="br-checklist">{[['Delivery complete',selected.delivered],['Delivery evidence attached',selected.evidence.length>0],['Purchase order recorded',!selected.poRequired||!!selected.poReference],['Client approval current',!!selected.approval?.name&&!selected.blockers.some(b=>b.includes('fresh client approval'))]].map(([s,ok])=><div key={s}><span className={ok?'br-done':'br-todo'}>{ok?'✓':'—'}</span><span>{s}</span></div>)}</div>
        {selected.taskIds.length>0 && <div><h4>Linked tasks</h4>{selected.taskIds.map(id=>{const t=tasks.find(x=>x._id===id);return <p className="br-muted" key={id}>{t?.title || 'Task no longer available'} · {t?.status || 'Missing'}</p>;})}<a href="/tasks">Manage tasks →</a></div>}
        <div aria-label="Billing blockers">{selected.blockers.map(b=><p className="br-muted" key={b}>{b}</p>)}</div><h4>Delivery evidence</h4>{selected.evidence.length ? selected.evidence.map((e,i)=><div className="br-evidence" key={i}><p className="br-pre">{e.note}</p>{e.url&&<a href={e.url} target="_blank" rel="noreferrer">Open evidence ↗</a>}</div>) : <p className="br-muted">No evidence recorded.</p>}
        <h4>Purchase order</h4><p className="br-muted">{selected.poReference || (selected.poRequired?'Missing':'Not required')}</p>
        <h4>Client approval</h4><p className="br-muted">Designated contact: {selected.approverEmail}</p>{selected.approval?.name ? <div className="br-evidence"><strong>{selected.approval.name}</strong><p className="br-pre">{selected.approval.note}</p><small>Manually recorded {new Date(selected.approval.recordedAt).toLocaleString()}</small></div> : <p className="br-muted">Awaiting approval.</p>}
        {selected.status !== 'invoiced' && <><div className="br-actions"><button disabled={busy} onClick={()=>start('evidence')}>+ Add evidence</button>{!selected.taskIds.length&&<button disabled={busy} onClick={e=>act(e,{action:'delivery',confirmed:!selected.deliveryConfirmed})}>{selected.deliveryConfirmed?'Reopen delivery':'Confirm delivery'}</button>}{selected.poRequired&&<button disabled={busy} onClick={()=>start('po')}>Record PO</button>}<button disabled={busy||!selected.delivered||!selected.evidence.length} onClick={draft}>Download approval draft</button><button disabled={busy||!selected.delivered||!selected.evidence.length} onClick={()=>start('approval')}>{selected.approval?.name?'Update approval':'Record client approval'}</button>{selected.approval?.name&&<button disabled={busy} onClick={e=>act(e,{action:'revoke'})}>Clear approval</button>}</div>
          {action && <form className="br-action-form" onSubmit={e=>act(e,{action,...actionForm})}><h4>{ {evidence:'Add delivery evidence',po:'Record purchase order',approval:'Record received client approval',invoice:'Record invoice issued elsewhere'}[action]}</h4>{action==='evidence'&&<><Field title="What does this evidence show?"><textarea required maxLength={2000} value={actionForm.note||''} onChange={e=>setActionForm({...actionForm,note:e.target.value})}/></Field><Field title="Document or delivery link (optional)"><input type="url" maxLength={2048} value={actionForm.url||''} onChange={e=>setActionForm({...actionForm,url:e.target.value})}/></Field></>}{action==='approval'&&<><p className="br-muted">Record approval you have already received. This does not send a request or verify the client's identity.</p><Field title="Client approver name"><input required maxLength={200} value={actionForm.name||''} onChange={e=>setActionForm({...actionForm,name:e.target.value})}/></Field><Field title="Approval evidence / email reference"><textarea required maxLength={2000} value={actionForm.note||''} onChange={e=>setActionForm({...actionForm,note:e.target.value})}/></Field></>}{['po','invoice'].includes(action)&&<Field title={action==='po'?'PO reference':'Invoice number / reference'}><input required maxLength={300} value={actionForm.reference||''} onChange={e=>setActionForm({...actionForm,reference:e.target.value})}/></Field>}<div className="br-actions"><button className="br-primary" disabled={busy} type="submit">{busy?'Saving…':'Save record'}</button><button disabled={busy} type="button" onClick={()=>setAction(null)}>Cancel</button></div></form>}
        </>}
        <div className="br-bottom-actions"><button className="br-primary" disabled={busy||selected.status==='blocked'} onClick={exportPackage}>Download billing package</button>{selected.status==='ready'&&<button disabled={busy} onClick={()=>start('invoice')}>Mark invoiced</button>}</div><p className="br-footnote">The package includes scope, evidence links, task status and recorded approval. It is not a tax invoice.</p>
        <details className="br-history"><summary>Activity history ({selected.history.length})</summary>{[...selected.history].reverse().map((h,i)=><p key={i}><strong>{h.description}</strong><br/><small>{new Date(h.at).toLocaleString()} · {h.actor}</small></p>)}</details>
      </>}</section></div>
  </div></Layout>;
}
