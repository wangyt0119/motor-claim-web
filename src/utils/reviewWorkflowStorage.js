const STORAGE_KEY = 'motor-claim-review-workflow';

export const REVIEW_REQUEST_OPTIONS = [
  { key: 'police_report', label: 'Reupload police report', type: 'document' },
  { key: 'identity_document', label: 'Reupload identity document', type: 'document' },
  { key: 'driving_license', label: 'Reupload driving license', type: 'document' },
  { key: 'vehicle_ownership', label: 'Reupload vehicle ownership certificate', type: 'document' },
  { key: 'damage_photos', label: 'Reupload vehicle damage photos', type: 'document' },
  { key: 'repair_quote', label: 'Upload repair quotation', type: 'document' },
  { key: 'incident_description', label: 'Clarify incident description', type: 'text' },
  { key: 'accident_explanation', label: 'Provide accident explanation', type: 'text' },
];

export function mergeClaimsWithWorkflow(claims) {
  return claims.map(mergeClaimWithWorkflow);
}

export function mergeClaimWithWorkflow(claim) {
  const workflow = getReviewWorkflow(claim.id);

  if (!workflow) {
    return {
      ...claim,
      reviewWorkflow: null,
    };
  }

  return {
    ...claim,
    status: getDisplayStatus(claim, workflow),
    notes: [...(claim.notes || []), ...(workflow.internalNotes || [])],
    reviewWorkflow: workflow,
  };
}

export function getReviewWorkflow(claimId) {
  const store = readStore();
  return store[claimId] || null;
}

export function saveOfficerDecision(claimId, payload) {
  const store = readStore();
  const current = store[claimId] || createEmptyWorkflow(claimId);
  const next = {
    ...current,
    reviewStatus: payload.reviewStatus,
    decisionNote: payload.decisionNote || '',
    requestedItems: payload.requestedItems || [],
    dueDate: payload.dueDate || null,
    updatedAt: new Date().toISOString(),
    internalNotes: buildInternalNotes(payload),
    customerSubmission:
      payload.reviewStatus === 'pending_customer_action' ? null : current.customerSubmission,
    timeline: [
      ...(current.timeline || []),
      {
        id: `event-${Date.now()}`,
        actor: 'Officer',
        action: getOfficerActionLabel(payload.reviewStatus),
        note: payload.decisionNote || '',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  store[claimId] = next;
  writeStore(store);
  return next;
}

export async function saveCustomerSubmission(claimId, payload) {
  const store = readStore();
  const current = store[claimId] || createEmptyWorkflow(claimId);
  const next = {
    ...current,
    reviewStatus: 'customer_responded',
    customerSubmission: {
      note: payload.note || '',
      responses: payload.responses || [],
      submittedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
    timeline: [
      ...(current.timeline || []),
      {
        id: `event-${Date.now()}`,
        actor: 'Customer',
        action: 'Submitted requested information',
        note: payload.note || '',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  store[claimId] = next;
  writeStore(store);
  return next;
}

function getDisplayStatus(claim, workflow) {
  switch (workflow.reviewStatus) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'pending_customer_action':
      return 'Pending Customer Action';
    case 'customer_responded':
      return 'Customer Responded';
    default:
      return claim.status;
  }
}

function createEmptyWorkflow(claimId) {
  return {
    claimId,
    reviewStatus: 'manual_review',
    requestedItems: [],
    timeline: [],
    internalNotes: [],
    customerSubmission: null,
    updatedAt: null,
  };
}

function buildInternalNotes(payload) {
  if (!payload.decisionNote) {
    return [];
  }

  if (payload.reviewStatus === 'pending_customer_action') {
    return [`Officer requested customer action: ${payload.decisionNote}`];
  }

  if (payload.reviewStatus === 'approved') {
    return [`Officer approval note: ${payload.decisionNote}`];
  }

  if (payload.reviewStatus === 'rejected') {
    return [`Officer rejection note: ${payload.decisionNote}`];
  }

  return [payload.decisionNote];
}

function getOfficerActionLabel(reviewStatus) {
  switch (reviewStatus) {
    case 'approved':
      return 'Approved claim';
    case 'rejected':
      return 'Rejected claim';
    case 'pending_customer_action':
      return 'Requested customer update';
    default:
      return 'Updated review';
  }
}

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function writeStore(value) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
