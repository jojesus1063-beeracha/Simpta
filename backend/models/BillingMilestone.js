const mongoose = require('mongoose');
const { Schema } = mongoose;
const schema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  projectName: { type: String, required: true },
  clientName: { type: String, required: true },
  title: { type: String, required: true },
  scope: { type: String, required: true },
  approverEmail: { type: String, required: true },
  amountPaise: { type: Number, required: true, min: 1 },
  dueDate: { type: String, required: true },
  taskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  deliveryConfirmed: { type: Boolean, default: false },
  poRequired: { type: Boolean, default: true },
  poReference: { type: String, default: '' },
  evidence: [{ note: String, url: String, addedBy: String, addedAt: Date }],
  approval: { type: new Schema({ name: String, note: String, recordedBy: String, recordedAt: Date, deliveryFingerprint: String }, { _id: false }), default: undefined },
  invoiceReference: { type: String, default: '' },
  invoicedAt: Date,
  history: [{ description: String, actor: String, at: Date }],
}, { timestamps: true, optimisticConcurrency: true });
schema.index({ company: 1, createdAt: -1 });
module.exports = mongoose.model('BillingMilestone', schema);
