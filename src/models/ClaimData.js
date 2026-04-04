class ClaimData {
  constructor({
    id,
    date,
    type,
    status,
    location,
    vehicleModel = 'Not specified',
    vehicleRegistration = 'Not specified',
    claimAmount = 0.0,
    policyNumber = '',
    notes = [],
    paymentStatus = null,
    paymentDate = null,
    paymentMethod = null,
    paymentReference = null,
  }) {
    this.id = id;
    this.date = date;
    this.type = type;
    this.status = status;
    this.location = location;
    this.vehicleModel = vehicleModel;
    this.vehicleRegistration = vehicleRegistration;
    this.claimAmount = claimAmount;
    this.policyNumber = policyNumber;
    this.notes = notes;
    this.paymentStatus = paymentStatus;
    this.paymentDate = paymentDate;
    this.paymentMethod = paymentMethod;
    this.paymentReference = paymentReference;
  }
}

export default ClaimData;