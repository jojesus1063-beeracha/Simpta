const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { newMilestone, readiness, applyAction } = require('../utils/billing');
const { createBillingRouter } = require('../routes/billingRoutes');
const taskId = 'a'.repeat(24), milestoneId = 'b'.repeat(24);
const input = () => ({ projectName:'ERP rollout',clientName:'Client',title:'Go live',scope:'Production acceptance',approverEmail:'client@example.com',amount:'1234.56',dueDate:'2026-09-30',taskIds:[],poRequired:true });
const milestone = () => ({ _id:milestoneId,company:'tenant-a',__v:0,...newMilestone(input()),evidence:[],history:[],deliveryConfirmed:false,poReference:'',invoiceReference:'' });
function complete(m, tasks=[]) {
  if(!m.taskIds.length) applyAction(m,{action:'delivery',confirmed:true},tasks,'admin');
  applyAction(m,{action:'evidence',note:'Delivered and checked',url:'https://example.com/evidence'},tasks,'admin');
  applyAction(m,{action:'po',reference:'PO-1'},tasks,'admin');
  applyAction(m,{action:'approval',name:'Client contact',note:'Email approved 25 September'},tasks,'admin');
}
test('currency stays in integer paise and invalid amounts/dates are rejected',()=>{
  assert.equal(newMilestone(input()).amountPaise,123456);
  for(const amount of ['-1','0','1.234','Infinity',{},'1e3'])assert.throws(()=>newMilestone({...input(),amount}));
  assert.throws(()=>newMilestone({...input(),dueDate:'2026-02-30'}));
});
test('incomplete delivery cannot be approved, invoiced or considered ready',()=>{
  const m=milestone();assert.equal(readiness(m,[]).blockers.length,4);
  assert.throws(()=>applyAction(m,{action:'approval',name:'Client',note:'yes'},[],'admin'));
  assert.throws(()=>applyAction(m,{action:'invoice',reference:'INV-1'},[],'admin'));
});
test('complete evidence workflow unlocks invoicing, then locks further changes',()=>{
  const m=milestone();complete(m);assert.equal(readiness(m,[]).status,'ready');
  applyAction(m,{action:'invoice',reference:'INV-1'},[],'admin');assert.equal(readiness(m,[]).status,'invoiced');
  assert.throws(()=>applyAction(m,{action:'po',reference:'PO-2'},[],'admin'));assert.equal(m.history.length,5);
});
test('reopening manual delivery clears previous client approval',()=>{
  const m=milestone();complete(m);applyAction(m,{action:'delivery',confirmed:false},[],'admin');
  assert.equal(m.approval,undefined);assert.equal(readiness(m,[]).status,'blocked');
});
test('linked tasks cannot be bypassed; missing and later changed tasks block billing',()=>{
  const m=milestone();m.taskIds=[taskId];
  assert.throws(()=>applyAction(m,{action:'delivery',confirmed:true},[],'admin'));
  const tasks=[{_id:taskId,status:'completed',updatedAt:'2026-09-25T01:00:00Z'}];complete(m,tasks);
  assert.equal(readiness(m,tasks).status,'ready');assert.equal(readiness(m,[]).status,'blocked');
  tasks[0].updatedAt='2026-09-25T02:00:00Z';assert.equal(readiness(m,tasks).status,'blocked');
});
test('evidence rejects script URLs and does not mutate on invalid input',()=>{
  const m=milestone();assert.throws(()=>applyAction(m,{action:'evidence',note:'Test',url:'javascript:alert(1)'},[],'admin'));
  assert.equal(m.evidence.length,0);assert.equal(m.history.length,0);
});
async function request(options, method, path, body) {
  let saved=false;
  const m=options.m || milestone();m.save=async()=>{saved=true;};m.toObject=()=>({...m,save:undefined,toObject:undefined});
  const deps={
    protect:(req,res,next)=>{if(options.unauth)return res.status(401).end();req.user={_id:'actor',company:'tenant-a',role:options.role||'admin'};next();},
    checkLicense:(req,res,next)=>options.expired?res.status(402).end():next(),
    Company:{findById:async()=>({productType:options.school?'school':'tasks'})},
    Milestone:{findOne:async filter=>{assert.equal(filter.company,'tenant-a');return options.foreign?null:m;}},
    Task:{find:filter=>{assert.equal(filter.company,'tenant-a');return {select:async()=>[]};}},
  };
  const app=express();app.use(express.json());app.use('/billing',createBillingRouter(deps));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try {const r=await fetch(`http://127.0.0.1:${server.address().port}/billing${path}`,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,text:await r.text(),saved};}
  finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
}
test('API rejects anonymous, member, expired and school-workspace access',async()=>{
  for(const [o,status]of [[{unauth:true},401],[{role:'member'},403],[{expired:true},402],[{school:true},403]])assert.equal((await request(o,'GET',`/${milestoneId}/package`)).status,status);
});
test('API uses workspace-scoped lookup and rejects cross-workspace IDs',async()=>{
  assert.equal((await request({foreign:true},'GET',`/${milestoneId}/package`)).status,404);
});
test('API rejects stale concurrent actions without saving',async()=>{
  const r=await request({},'POST',`/${milestoneId}/actions`,{version:5,action:'delivery',confirmed:true});assert.equal(r.status,409);assert.equal(r.saved,false);
});
test('API prevents premature export and allows complete package',async()=>{
  assert.equal((await request({},'GET',`/${milestoneId}/package`)).status,409);
  const m=milestone();complete(m);const r=await request({m},'GET',`/${milestoneId}/package`);assert.equal(r.status,200);assert.match(r.text,/manually recorded/);
});
test('API action persists and invalid IDs fail cleanly',async()=>{
  const r=await request({},'POST',`/${milestoneId}/actions`,{version:0,action:'delivery',confirmed:true});assert.equal(r.status,200);assert.equal(r.saved,true);
  assert.equal((await request({},'GET','/invalid/package')).status,400);
});
