# Simpta billing readiness — first version

An admin-only module for task-management workspaces at `/billing`. Existing sign-in, workspace isolation, license checks and tasks remain the foundation. The school product is excluded.

## Use the workflow

1. Sign in as an administrator with an active task workspace.
2. Open **Billing readiness**, then **New milestone**.
3. Enter the project, client, scope, client contact, INR amount before tax, target billing date and PO requirement. Optionally select existing tasks.
4. Complete linked tasks in Tasks, or confirm delivery manually when no tasks were linked.
5. Add delivery evidence as a note with an optional HTTP(S) document link. Existing document permissions remain in force.
6. Record the PO reference when required.
7. Download an approval-request draft, review it and send it using your email client.
8. Record the approval actually received, including the client's name and an email/evidence reference.
9. Download the billing package once all four checks pass.
10. Issue the invoice in your accounting system, then record its reference using **Mark invoiced**.

Approvals are manually recorded by an administrator. This is not an external client portal, identity-verified approval or electronic signature. No email is sent automatically. A linked task changing after approval requires fresh approval. Invoiced records are locked against further billing actions; linked task state may still change and is reflected in exports.

Scope, amount and task associations are fixed after creation in this first version. There is no archive, correction, file-upload, CSV-import, PDF-generation, tax calculation, payment collection, AI extraction or accounting integration. Delivery evidence uses notes and links; billing packages download as readable text. The screen lists the latest 500 milestones. This version is intended for a controlled pilot, not a complete commercial launch.

## Implementation and rollout

- Additive MongoDB collection: `billingmilestones`; no backfill or changes to existing records.
- Index: company and creation date. Standard Mongoose auto-index behavior applies; deployments disabling auto-index should provision the declared index separately.
- No new runtime variables or dependencies.
- Deploy backend and frontend together through the existing host. Deploy backend first if using separate deployments.
- Existing API URL configuration remains unchanged.
- Changes are prepared on a feature branch; no production deployment was performed.
- Roll back by redeploying the prior source. New milestone data remains in its separate collection.

## Validation

Run `node --test backend/tests/billing.test.js` and `cd frontend && npm run build`.

The 11 tests cover money/date validation, readiness gates, approval invalidation, evidence URL safety, authenticated admin access, license/product checks, workspace-scoped lookups, stale updates and exports. API tests use controlled model doubles, not a running MongoDB database.

Before enabling for pilot customers, use a staging database to smoke-test administrator creation, reload persistence, two-workspace isolation, linked-task changes and export. Browser QA and real-database integration testing have not been performed in this session. The live domain and hosting setup still need confirmation.
