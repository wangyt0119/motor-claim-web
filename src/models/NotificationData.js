// Model for notification data
class NotificationData {
  constructor({
    id,
    claimId,
    claimStatus,
    notificationType,
    dateSent,
    deliveryStatus,
    messagePreview,
    fullMessage,
    recipientContact,
    errorMessage = null
  }) {
    this.id = id;
    this.claimId = claimId;
    this.claimStatus = claimStatus;
    this.notificationType = notificationType;
    this.dateSent = dateSent;
    this.deliveryStatus = deliveryStatus;
    this.messagePreview = messagePreview;
    this.fullMessage = fullMessage;
    this.recipientContact = recipientContact;
    this.errorMessage = errorMessage;
  }
}

export default NotificationData;