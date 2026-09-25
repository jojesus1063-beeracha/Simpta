const express = require('express');
const Milestone = require('../models/BillingMilestone');
const Task = require('../models/Task');
const Company = require('../models/Company');
const { protect, adminOnly } = require('../middleware/auth');
const { checkLicense } = require('../middleware/license');
const { fail, id, newMilestone, readiness, applyAction } = require('../utils/billing');

// Factory keeps authorization and tenant-scoping testable without a production database.
function createBillingRouter(deps = {}) {
  const M = deps.Milestone || Milestone, T = deps.Task || Task, C = deps.Company || Company;
  const router = express.Router();
  router.use(deps.protect || protect, deps.checkLicense || checkLicense, adminOnly);
  router.use(async (req, res, next) => {
    try {
      if (!req.user.company) fail('Workspace required.', 403);
      const company = await C.findById(req.user.company);
      if (!company || company.productType === 'school') fail('Billing readiness is available in task workspaces.', 403);
      next();
    } catch (e) { next(e); }
  });
  const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
  const find = async req => {
    if(!id(req.params.id)) fail('Invalid milestone ID.');
    const m = await M.findOne({ _id: req.params.id, company: req.user.company });
    if(!m) fail('Milestone not found.',404);
    return m;
  };
  const linkedTasks = (m, company) => T.find({ company, _id: { $in: m.taskIds } }).select('title status updatedAt');
  router.get('/', wrap(async (req,res) => {
    const milestones = await M.find({ company: req.user.company }).sort({ createdAt: -1 }).limit(500).lean();
    const tasks = await T.find({ company: req.user.company, _id: { $in: milestones.flatMap(m => m.taskIds) } }).select('title status updatedAt').lean();
    res.json(milestones.map(m => ({ ...m, ...readiness(m,tasks) })));
  }));
  router.post('/', wrap(async (req,res) => {
    const data = newMilestone(req.body);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.approverEmail)) fail('Enter a valid approver email.');
    const count = await T.countDocuments({ company: req.user.company, _id: { $in: data.taskIds } });
    if(count !== data.taskIds.length) fail('One or more tasks are not available in this workspace.');
    const m = await M.create({ ...data, company: req.user.company, history: [{ description: 'Created milestone', actor: String(req.user._id), at: new Date() }] });
    res.status(201).json(m);
  }));
  router.post('/:id/actions', wrap(async (req,res) => {
    const m = await find(req);
    if(!Number.isInteger(req.body.version) || req.body.version !== m.__v) fail('This milestone changed. Refresh before trying again.',409);
    const tasks = await linkedTasks(m, req.user.company);
    applyAction(m, req.body, tasks, String(req.user._id));
    await m.save();
    res.json({ ...m.toObject(), ...readiness(m,tasks) });
  }));
  router.get('/:id/package', wrap(async (req,res) => {
    const m = await find(req);
    const tasks = await linkedTasks(m, req.user.company);
    const state = readiness(m,tasks);
    if(state.status === 'blocked') fail('Resolve billing blockers before exporting the billing package.',409);
    res.json({ product: 'Simpta', exportedAt: new Date().toISOString(), currency: 'INR', milestone: m.toObject(), tasks, readiness: state, approvalMethod: 'Client approval manually recorded by workspace administrator; not an electronic signature.', note: 'Billing preparation record. This export is not a tax invoice.' });
  }));
  router.use((err,req,res,next) => {
    if(err.name === 'VersionError') return res.status(409).json({ message: 'This milestone changed. Refresh before trying again.' });
    if(err.status) return res.status(err.status).json({ message: err.message });
    console.error('Billing readiness error', err);
    res.status(500).json({ message: 'Could not complete the billing request. Please try again.' });
  });
  return router;
}
module.exports = createBillingRouter();
module.exports.createBillingRouter = createBillingRouter;
