const { createHash } = require('node:crypto');
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
const text = (value, label, max = 300, optional = false) => {
  if (optional && (value === undefined || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${label} is required (maximum ${max} characters).`);
  return value.trim();
};
const id = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
function newMilestone(body) {
  const amount = text(body.amount, 'Amount', 16);
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) fail('Enter a positive INR amount with at most two decimal places.');
  const date = text(body.dueDate, 'Due date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) fail('Enter a valid due date.');
  const taskIds = body.taskIds ?? [];
  if (!Array.isArray(taskIds) || taskIds.length > 100 || taskIds.some(x => !id(x)) || new Set(taskIds).size !== taskIds.length) fail('Choose up to 100 distinct tasks.');
  if (typeof body.poRequired !== 'boolean') fail('Choose whether a purchase order is required.');
  return { projectName: text(body.projectName, 'Project'), clientName: text(body.clientName, 'Client'), title: text(body.title, 'Milestone'), scope: text(body.scope, 'Agreed scope', 10000), approverEmail: text(body.approverEmail, 'Approver email', 254), amountPaise: Math.round(Number(amount) * 100), dueDate: date, taskIds, poRequired: body.poRequired };
}
function deliveryFingerprint(m, tasks) {
  return createHash('sha256').update(JSON.stringify(m.taskIds.map(taskId => {
    const t = tasks.find(task => String(task._id) === String(taskId));
    return [String(taskId), t?.status || 'missing', t?.updatedAt ? new Date(t.updatedAt).toISOString() : null];
  }))).digest('hex');
}
function readiness(m, tasks) {
  const blockers = [];
  const linked = m.taskIds.map(taskId => tasks.find(t => String(t._id) === String(taskId)));
  const delivered = m.taskIds.length ? linked.every(t => t && t.status === 'completed') : m.deliveryConfirmed;
  if (!delivered) blockers.push('Delivery incomplete');
  if (!m.evidence.length) blockers.push('Delivery evidence missing');
  if (m.poRequired && !m.poReference) blockers.push('Purchase order missing');
  if (!m.approval?.name) blockers.push('Client approval missing');
  else if (m.approval.deliveryFingerprint !== deliveryFingerprint(m, tasks)) blockers.push('Linked tasks changed; record fresh client approval');
  return { blockers, delivered: !!delivered, status: m.invoiceReference ? 'invoiced' : blockers.length ? 'blocked' : 'ready' };
}
function applyAction(m, body, tasks, actor, now = new Date()) {
  if (m.invoiceReference) fail('This milestone is already marked invoiced.', 409);
  let description;
  switch(body.action) {
    case 'evidence': {
      if(m.evidence.length >= 50) fail('Maximum 50 evidence records per milestone.');
      const note = text(body.note, 'Evidence description', 2000);
      const url = text(body.url, 'Evidence link', 2048, true);
      if (url) { try { if(!['http:', 'https:'].includes(new URL(url).protocol)) fail('Use an HTTP or HTTPS evidence link.'); } catch { fail('Use a valid HTTP or HTTPS evidence link.'); } }
      m.evidence.push({ note, url, addedBy: actor, addedAt: now }); description = 'Added delivery evidence'; break;
    }
    case 'delivery':
      if(m.taskIds.length) fail('Delivery follows the linked tasks. Update their status in Tasks.');
      if(typeof body.confirmed !== 'boolean') fail('Delivery confirmation must be true or false.');
      m.deliveryConfirmed = body.confirmed;
      if (!body.confirmed) m.approval = undefined;
      description = body.confirmed ? 'Confirmed delivery' : 'Reopened delivery and cleared approval'; break;
    case 'po': m.poReference = text(body.reference, 'Purchase order reference', 300); description = 'Recorded purchase order'; break;
    case 'approval': {
      if (!readiness(m, tasks).delivered || !m.evidence.length) fail('Complete delivery and add evidence before recording approval.');
      const name = text(body.name, 'Client approver', 200);
      const note = text(body.note, 'Approval evidence / reference', 2000);
      m.approval = { name, note, recordedBy: actor, recordedAt: now, deliveryFingerprint: deliveryFingerprint(m, tasks) }; description = `Recorded client approval from ${name}`; break;
    }
    case 'revoke': m.approval = undefined; description = 'Cleared client approval'; break;
    case 'invoice':
      if(readiness(m, tasks).status !== 'ready') fail('Resolve all billing blockers before marking invoiced.', 409);
      m.invoiceReference = text(body.reference, 'Invoice reference', 300); m.invoicedAt = now; description = `Marked invoiced: ${m.invoiceReference}`; break;
    default: fail('Unknown milestone action.');
  }
  m.history.push({ description, actor, at: now });
}
module.exports = { fail, id, newMilestone, readiness, applyAction };
