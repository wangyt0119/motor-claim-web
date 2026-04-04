// Model for notification audit entries
class NotificationAuditEntry {
  constructor({
    id,
    claimId,
    customerName,
    contactMethod,
    statusUpdate,
    dateSent,
    deliveryStatus,
    recipientContact,
    messageTemplate,
    messageContent,
    errorMessage = null,
    retryCount,
    officerName,
    metadata
  }) {
    this.id = id;
    this.claimId = claimId;
    this.customerName = customerName;
    this.contactMethod = contactMethod;
    this.statusUpdate = statusUpdate;
    this.dateSent = dateSent;
    this.deliveryStatus = deliveryStatus;
    this.recipientContact = recipientContact;
    this.messageTemplate = messageTemplate;
    this.messageContent = messageContent;
    this.errorMessage = errorMessage;
    this.retryCount = retryCount;
    this.officerName = officerName;
    this.metadata = metadata;
  }
}

export default NotificationAuditEntry;