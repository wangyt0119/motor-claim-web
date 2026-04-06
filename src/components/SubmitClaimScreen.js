import React, { useEffect, useState } from 'react';
import { 
  Form, Input, Button, DatePicker,
  Upload, message, Row, Col, Card, Typography, Modal,
  Divider, Alert, Checkbox, Spin, Empty
} from 'antd';
import { 
  CarOutlined, 
  CalendarOutlined, 
  UploadOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FolderOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { getMyCoverages } from '../services/coverageService';
import { createClaim } from '../services/claimService';
import { uploadFileToCloudinary } from '../services/cloudinaryService';

const { Title, Text } = Typography;

function SubmitClaimScreen({ onSubmit }) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({});
  const [selectedCoverage, setSelectedCoverage] = useState(null);
  const [incidentDateString, setIncidentDateString] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [coverageOptions, setCoverageOptions] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [submittedClaimData, setSubmittedClaimData] = useState(null);

  const MAX_TOTAL_UPLOAD_BYTES = 20 * 1024 * 1024;

  const vehicleClaimDocumentSections = {
    'Vehicle Damages': [
      {
        title: 'Core Documents',
        documents: [
          { key: 'policeReport', label: 'Police report' },
          { key: 'registrationCard', label: 'Registration card / Vehicle ownership certificate' }
        ]
      },
      {
        title: 'NRIC/Passport/Army/Police ID',
        documents: [
          { key: 'idFront', label: 'NRIC/Passport/Army/Police ID (Front)' },
          { key: 'idBack', label: 'NRIC/Passport/Army/Police ID (Back)' }
        ]
      },
      {
        title: 'Driving License',
        documents: [
          { key: 'licenseFront', label: 'Driving license (Front)' },
          { key: 'licenseBack', label: 'Driving License (Back)' }
        ]
      },
      {
        title: 'Vehicle Damages',
        documents: [
          { key: 'damageFrontLeft', label: 'Vehicle damages (Front left)' },
          { key: 'damageFrontRight', label: 'Vehicle damages (Front right)' },
          { key: 'damageRearLeft', label: 'Vehicle damages (Rear left)' },
          { key: 'damageRearRight', label: 'Vehicle damages (Rear right)' }
        ]
      }
    ],
    'Vehicle Got Stolen': [
      {
        title: 'Core Documents',
        documents: [
          { key: 'policeReport', label: 'Police report' },
          { key: 'registrationCard', label: 'Registration card / Vehicle ownership certificate' }
        ]
      },
      {
        title: 'NRIC/Passport/Army/Police ID',
        documents: [
          { key: 'idFront', label: 'NRIC/Passport/Army/Police ID (Front)' },
          { key: 'idBack', label: 'NRIC/Passport/Army/Police ID (Back)' }
        ]
      }
    ]
  };

  useEffect(() => {
    const loadCoverages = async () => {
      setCoverageLoading(true);

      try {
        const coverages = await getMyCoverages();
        setCoverageOptions(coverages);
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            error?.response?.data?.title ||
            'Unable to load your coverages from the backend.'
        );
      } finally {
        setCoverageLoading(false);
      }
    };

    loadCoverages();
  }, []);

  const getRequiredDocuments = (claimType) => {
    const sections = vehicleClaimDocumentSections[claimType] || [];
    return sections.flatMap((section) => section.documents);
  };

  const getTotalUploadSize = (filesMap) => {
    return Object.values(filesMap).flat().reduce((sum, file) => sum + (file?.size || 0), 0);
  };

  const handleDocumentUpload = (documentKey) => ({ fileList }) => {
    const normalizedList = fileList.slice(-1);
    const nextFiles = { ...documentFiles, [documentKey]: normalizedList };
    const totalSize = getTotalUploadSize(nextFiles);

    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      message.error('Total upload size cannot exceed 20MB');
      return;
    }

    setDocumentFiles(nextFiles);
  };

  const getDocumentPayload = async () => {
    const uploadedEntries = Object.entries(documentFiles);
    const payload = {};

    for (const [documentKey, fileList] of uploadedEntries) {
      const file = fileList?.[0];

      if (!file) {
        payload[documentKey] = null;
        continue;
      }

      const rawFile = file.originFileObj ?? file;
      payload[documentKey] = await uploadFileToCloudinary(rawFile);
    }

    return payload;
  };
  
  // Validate current step before proceeding
  const validateCurrentStep = async () => {
    try {
      switch (currentStep) {
        case 0:
          // Validate incident details
          await form.validateFields(['incidentDate']);
          if (!incidentDateString) {
            message.error('Please select the incident date');
            return false;
          }
          return true;
        case 1:
          if (!coverageOptions.length) {
            message.error('No coverage is available for claim submission.');
            return false;
          }
          if (!selectedCoverage) {
            message.error('Please select one coverage');
            return false;
          }
          return true;
        case 2: {
          const vehicleClaimType = form.getFieldValue('vehicleClaimType');
          if (!vehicleClaimType) {
            message.error('Please select a vehicle claim type');
            return false;
          }
          return true;
        }
        case 3: {
          if (!incidentDescription.trim()) {
            message.error('Please describe the incident in detail');
            return false;
          }
          const vehicleClaimType = form.getFieldValue('vehicleClaimType');
          const requiredDocs = getRequiredDocuments(vehicleClaimType);
          const missingDoc = requiredDocs.find((doc) => !(documentFiles[doc.key] && documentFiles[doc.key].length > 0));
          if (missingDoc) {
            message.error(`Please upload: ${missingDoc.label}`);
            return false;
          }
          return true;
        }
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  };
  
  // Handle previous button click
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Handle next button click
  const handleNext = async () => {
    try {
      // Validate current step fields
      const isValid = await validateCurrentStep();
      if (!isValid) {
        return;
      }
      
      // If validation passes, move to next step
      setCurrentStep(currentStep + 1);
      
      // Force form to update its internal values
      form.validateFields();
    } catch (error) {
      // Validation failed, stay on current step
      console.error("Validation failed:", error);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitError('');

      if (!termsAgreed) {
        message.warning('Please tick the confirmation checkbox before submitting your claim.');
        return;
      }

      const isValid = await validateCurrentStep();
      if (!isValid) {
        return;
      }

      const values = await form.validateFields();
      setSubmitting(true);

      const documentPayload = await getDocumentPayload();
      const motorClaimType = values.vehicleClaimType === 'Vehicle Damages' ? 1 : 2;
      const incidentDateIso = incidentDateString ? `${incidentDateString}T00:00:00` : null;

      if (!incidentDateIso) {
        throw new Error('Incident date could not be converted to the backend format.');
      }

      const claimPayload = {
        coverageId: selectedCoverage,
        incidentDate: incidentDateIso,
        allClaimType: 1,
        motorClaimType,
        incidentDescription: incidentDescription.trim(),
        policeReportDocument: documentPayload.policeReport ?? null,
        vehicleOwnershipCertificateDocument: documentPayload.registrationCard ?? null,
        identityDocumentFront: documentPayload.idFront ?? null,
        identityDocumentBack: documentPayload.idBack ?? null,
        drivingLicenseFront: documentPayload.licenseFront ?? null,
        drivingLicenseBack: documentPayload.licenseBack ?? null,
        vehicleDamageFrontLeftDocument: documentPayload.damageFrontLeft ?? null,
        vehicleDamageFrontRightDocument: documentPayload.damageFrontRight ?? null,
        vehicleDamageRearLeftDocument: documentPayload.damageRearLeft ?? null,
        vehicleDamageRearRightDocument: documentPayload.damageRearRight ?? null,
      };

      console.log('Create claim payload', claimPayload);

      const createdClaim = await createClaim(claimPayload);
      console.log('Create claim response', createdClaim);

      setSubmittedClaimData({
        ...createdClaim,
        type: values.vehicleClaimType,
        vehicleRegistration:
          coverageOptions.find((coverage) => coverage.coverageId === selectedCoverage)?.vehicleNo ||
          createdClaim.vehicleRegistration,
      });
      setSuccessModalOpen(true);

      form.resetFields();
      setCurrentStep(0);
      setTermsAgreed(false);
      setDocumentFiles({});
      setSelectedCoverage(null);
      setIncidentDateString('');
      setIncidentDescription('');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Form submission failed.';

      console.error('Create claim failed', error);
      setSubmitError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Build custom step indicator
  const buildStepIndicator = () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        {buildStepIndicatorItem({
          number: 1,
          title: "Incident Information",
          isActive: currentStep === 0,
          isCompleted: currentStep > 0
        })}
        
        {buildStepConnector({
          isCompleted: currentStep > 0
        })}
        
        {buildStepIndicatorItem({
          number: 2,
          title: "Select Coverages",
          isActive: currentStep === 1,
          isCompleted: currentStep > 1
        })}
        
        {buildStepConnector({
          isCompleted: currentStep > 1
        })}

        {buildStepIndicatorItem({
          number: 3,
          title: "Vehicle Claim Type",
          isActive: currentStep === 2,
          isCompleted: currentStep > 2
        })}
        
        {buildStepConnector({
          isCompleted: currentStep > 2
        })}

        {buildStepIndicatorItem({
          number: 4,
          title: "Supporting Documents",
          isActive: currentStep === 3,
          isCompleted: currentStep > 3
        })}
        
        {buildStepConnector({
          isCompleted: currentStep > 3
        })}
        
        {buildStepIndicatorItem({
          number: 5,
          title: "Review & Submit",
          isActive: currentStep === 4,
          isCompleted: currentStep > 4
        })}
      </div>
    );
  };
  
  // Build step indicator item
  const buildStepIndicatorItem = ({ number, title, isActive, isCompleted }) => {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div 
          style={{ 
            width: 30, 
            height: 30, 
            borderRadius: '50%', 
            backgroundColor: isCompleted 
              ? '#52c41a' // green
              : (isActive ? '#FF6600' : '#d9d9d9'), // orange or light gray
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isCompleted ? (
            <CheckOutlined style={{ color: 'white', fontSize: 16 }} />
          ) : (
            <span style={{ color: 'white', fontWeight: 'bold' }}>
              {number}
            </span>
          )}
        </div>
        <span 
          style={{ 
            marginLeft: 8,
            fontSize: 12,
            fontWeight: isActive ? 'bold' : 'normal',
            color: isActive ? '#FF6600' : '#6c757d',
            flex: 1
          }}
        >
          {title}
        </span>
      </div>
    );
  };
  
  // Build step connector
  const buildStepConnector = ({ isCompleted }) => {
    return (
      <div 
        style={{ 
          width: 20, 
          height: 2, 
          backgroundColor: isCompleted ? '#52c41a' : '#d9d9d9' 
        }}
      />
    );
  };
  
  // Build incident details step
  const buildIncidentDetailsStep = () => {
    return (
      <div>
        <Card 
          style={{ 
            borderRadius: 12,
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          <Title level={4}>When did it happen?</Title>
          <Divider />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="incidentDate"
                label="Incident Date"
                rules={[{ required: true, message: 'Please select the incident date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabledDate={current => current && current > moment().endOf('day')}
                  suffixIcon={<CalendarOutlined style={{ color: '#FF6600' }} />}
                  onChange={(_, dateString) => setIncidentDateString(dateString)}
                />
              </Form.Item>
            </Col>
            
          </Row>
        
        </Card>
      </div>
    );
  };
  
  // Build select coverage step
  const buildSelectCoverageStep = () => {
    const selectCoverage = (coverageId) => {
      setSelectedCoverage(coverageId);
      form.setFieldsValue({ selectedCoverage: coverageId });
    };

    const coverageCardStyle = (isSelected) => ({
      marginTop: 12,
      borderRadius: 16,
      border: isSelected ? '2px solid #FF6600' : '1px solid #e8e8e8',
      boxShadow: isSelected ? '0 4px 12px rgba(255,102,0,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer'
    });

    return (
      <div>
        <Card 
          style={{ 
            borderRadius: 12,
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          {/* Title */}
      <Title level={4} style={{ marginBottom: 0 }}>
        Choose which coverage to claim from
      </Title>
      <Text type="secondary">
        You can select one coverage
      </Text>

      <div style={{ marginTop: 8 }}>
        {coverageLoading ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <Spin />
          </div>
        ) : coverageOptions.length === 0 ? (
          <Empty description="No coverages found for this account" />
        ) : (
          <Row gutter={[16, 16]}>
            {coverageOptions.map((coverage, index) => {
              const isSelected = selectedCoverage === coverage.coverageId;
              return (
                <Col xs={24} lg={12} key={coverage.coverageId}>
                  <Card
                    style={coverageCardStyle(isSelected)}
                    styles={{ body: { padding: 16 } }}
                    onClick={() => selectCoverage(coverage.coverageId)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <Text type="secondary">Coverage {index + 1}</Text>
                        <Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>
                          {coverage.vehicleNo}
                        </Title>
                      </div>
                      <Checkbox checked={isSelected} />
                    </div>

                    <Row gutter={[16, 12]}>
                      <Col xs={24} md={12}>
                        <Text type="secondary">Insured Person Name</Text>
                        <div style={{ fontWeight: 600 }}>{coverage.insuredPersonName}</div>
                      </Col>

                      <Col xs={24} md={12}>
                        <Text type="secondary">Coverage Type</Text>
                        <div style={{ fontWeight: 600 }}>{coverage.coverageType}</div>
                      </Col>

                      <Col xs={24} md={12}>
                        <Text type="secondary">Effective Date</Text>
                        <div style={{ fontWeight: 600 }}>{moment(coverage.effectiveDate).format('DD MMM YYYY')}</div>
                      </Col>

                      <Col xs={24} md={12}>
                        <Text type="secondary">Expiry Date</Text>
                        <div style={{ fontWeight: 600 }}>{moment(coverage.expiryDate).format('DD MMM YYYY')}</div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
        </Card>
      </div>
    );
  };

  // Build vehicle claim type step
  const buildVehicleClaimTypeStep = () => {
    const selectedType = form.getFieldValue('vehicleClaimType');

    const optionCardStyle = (isSelected) => ({
      borderRadius: 20,
      border: isSelected ? '2px solid #FF6600' : '1px solid #d9d9d9',
      cursor: 'pointer',
      minHeight: 320,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isSelected ? '0 6px 16px rgba(255,102,0,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease'
    });

    const iconWrapStyle = {
      width: 96,
      height: 96,
      borderRadius: '50%',
      backgroundColor: '#FFF3E0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px'
    };

    return (
      <div>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          <Title level={4} style={{ marginBottom: 8 }}>
            Sorry to hear that. Please tell us what happened?
          </Title>
          <Text type="secondary">
            Choose one vehicle claim type to continue
          </Text>

          <div style={{ marginTop: 24 }}>
            <Row gutter={[20, 20]}>
              <Col xs={24} md={12}>
                <Card
                  hoverable
                  style={optionCardStyle(selectedType === 'Vehicle Damages')}
                  styles={{ body: { width: '100%' } }}
                  onClick={() => {
                    setDocumentFiles({});
                    form.setFieldsValue({ vehicleClaimType: 'Vehicle Damages' });
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={iconWrapStyle}>
                      <CarOutlined style={{ fontSize: 40, color: '#FFB300' }} />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>
                      Vehicle
                      <br />
                      Damages
                    </Title>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  hoverable
                  style={optionCardStyle(selectedType === 'Vehicle Got Stolen')}
                  styles={{ body: { width: '100%' } }}
                  onClick={() => {
                    setDocumentFiles({});
                    form.setFieldsValue({ vehicleClaimType: 'Vehicle Got Stolen' });
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={iconWrapStyle}>
                      <InboxOutlined style={{ fontSize: 40, color: '#333' }} />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>
                      Vehicle
                      <br />
                      Got Stolen
                    </Title>
                  </div>
                </Card>
              </Col>
            </Row>

            <Form.Item name="vehicleClaimType" hidden>
              <Input />
            </Form.Item>
          </div>
        </Card>
      </div>
    );
  };

  // Build documents step
  const buildDocumentsStep = () => {
    const selectedType = form.getFieldValue('vehicleClaimType');
    const documentSections = vehicleClaimDocumentSections[selectedType] || [];
    const requiredDocs = documentSections.flatMap((section) => section.documents);
    const uploadedCount = requiredDocs.filter((doc) => (documentFiles[doc.key] || []).length > 0).length;
    const totalSizeMB = (getTotalUploadSize(documentFiles) / (1024 * 1024)).toFixed(2);

    return (
      <div>
        <Card 
          style={{ 
            borderRadius: 12,
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          <Title level={4}>Tell us more about the incident</Title>
          <Form.Item
            name="incidentDescription"
            rules={[{ required: true, message: 'Please describe the incident in detail' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Please describe the incident in detail..."
              maxLength={1000}
              showCount
              value={incidentDescription}
              onChange={(event) => {
                setIncidentDescription(event.target.value);
                form.setFieldValue('incidentDescription', event.target.value);
              }}
            />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24 }}>Upload Document</Title>
          <Text type="secondary">
            Upload a copy or image of the following documents.
            Files will be uploaded securely to cloud storage. Total size must not exceed 20MB and accepted formats are JPG, PNG, PDF and HEIC.
          </Text>

          <Alert
            style={{ marginTop: 12, marginBottom: 16 }}
            type="info"
            showIcon
            message={`Uploaded ${uploadedCount}/${requiredDocs.length} required document(s) | Total size: ${totalSizeMB} MB / 20 MB`}
          />

          {documentSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              style={{
                marginBottom: sectionIndex === documentSections.length - 1 ? 0 : 16,
                border: '1px solid #f0f0f0',
                borderRadius: 10,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  padding: '10px 14px'
                }}
              >
                <Text strong style={{ fontSize: 14, color: '#333' }}>
                  {section.title}
                </Text>
              </div>

              <div style={{ padding: '4px 14px' }}>
                {section.documents.map((doc, docIndex) => {
                  const uploadedFile = (documentFiles[doc.key] || [])[0];
                  return (
                    <div
                      key={doc.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: docIndex === section.documents.length - 1 ? 'none' : '1px solid #f5f5f5'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <Text strong>{doc.label}</Text>
                        <div>
                          <Text
                            type={uploadedFile ? 'secondary' : 'danger'}
                            style={{
                              fontSize: 12,
                              display: 'block',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {uploadedFile ? `Uploaded: ${uploadedFile.name}` : 'Not uploaded'}
                          </Text>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        <Upload
                          fileList={documentFiles[doc.key] || []}
                          onChange={handleDocumentUpload(doc.key)}
                          beforeUpload={() => false}
                          maxCount={1}
                          accept=".jpg,.jpeg,.png,.pdf,.heic"
                          showUploadList={false}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            style={{ borderColor: '#FF6600', color: '#FF6600', minWidth: 98 }}
                          >
                            {uploadedFile ? 'Replace' : 'Upload'}
                          </Button>
                        </Upload>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  };
  
  // Build review section helper
  const buildReviewSection = ({ title, icon, items, labelWidth = 120 }) => {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
          <Text strong style={{ marginLeft: 8, fontSize: 16, color: '#333' }}>
            {title}
          </Text>
        </div>
        
        <div style={{ marginTop: 12 }}>
          {items.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                marginBottom: 8,
                paddingLeft: 26
              }}
            >
              <div style={{ width: labelWidth, minWidth: labelWidth }}>
                <Text type="secondary">{item.label}:</Text>
              </div>
              <div style={{ flex: 1 }}>
                <Text strong>{item.value || ''}</Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Build review step
  const buildReviewStep = () => {
    // Get the latest form values directly from form instance
    const formValues = form.getFieldsValue(true);
    const requiredDocs = getRequiredDocuments(formValues.vehicleClaimType);
    const selectedCoverageDetails = coverageOptions.find((coverage) =>
      coverage.coverageId === selectedCoverage
    );
    
    // Helper function to display file lists with names
    const renderFileList = (files = []) => {
      if (!files.length) return 'No file uploaded';
      return files.map((file) => file.name).join(', ');
    };
    
    return (
      <div>
        <Title level={4}>Review Your Claim</Title>
        <Text type="secondary">
          Please review all information before submitting your claim
        </Text>
        
        <Card style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 24 }}>
            {buildReviewSection({
              title: 'Incident Information',
              icon: <FileTextOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: [
                { 
                  label: 'Date',
                  value: incidentDateString || 'Not provided'
                },
                { 
                  label: 'Incident Details',
                  value: incidentDescription || 'Not provided'
                },
              ]
            })}
            
            <Divider style={{ margin: '16px 0' }} />
            
            {buildReviewSection({
              title: 'Select Coverage',
              icon: <CarOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: selectedCoverageDetails
                ? [{
                    label: 'Selected Coverage',
                    value: `${selectedCoverageDetails.insuredPersonName} | ${selectedCoverageDetails.vehicleNo} | ${selectedCoverageDetails.coverageType} | ${moment(selectedCoverageDetails.effectiveDate).format('DD MMM YYYY')} - ${moment(selectedCoverageDetails.expiryDate).format('DD MMM YYYY')}`
                  }]
                : [{ label: 'Selected Coverage', value: 'Not provided' }]
            })}
            
            <Divider style={{ margin: '16px 0' }} />
            
            {buildReviewSection({
              title: 'Vehicle Claim Type',
              icon: <CheckCircleOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: [
                {
                  label: 'Vehicle Claim Type',
                  value: formValues.vehicleClaimType || 'Not provided'
                }
              ]
            })}

            <Divider style={{ margin: '16px 0' }} />

            {buildReviewSection({
              title: 'Supporting Documents',
              icon: <FolderOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: requiredDocs.map((doc) => ({
                label: doc.label,
                value: renderFileList(documentFiles[doc.key] || [])
              })),
              labelWidth: 260
            })}
          </div>
          
          <Alert
            message="Please confirm that all information is correct"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Checkbox 
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.target.checked)}
          >
            I confirm that all information provided is accurate and complete. I understand that providing false information may result in my claim being rejected.
          </Checkbox>
        </Card>
      </div>
    );
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return buildIncidentDetailsStep();
      case 1:
        return buildSelectCoverageStep();
      case 2:
        return buildVehicleClaimTypeStep();
      case 3:
        return buildDocumentsStep();
      case 4:
        return buildReviewStep();
      default:
        return null;
    }
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <Modal
        open={successModalOpen}
        title={null}
        okText="Track My Claim"
        cancelText="Submit Another"
        centered
        width={520}
        onCancel={() => setSuccessModalOpen(false)}
        onOk={() => {
          setSuccessModalOpen(false);

          if (onSubmit && submittedClaimData) {
            onSubmit(submittedClaimData);
          }
        }}
      >
        <div style={{ textAlign: 'center', padding: '12px 8px 4px' }}>
          <div
            style={{
              width: 88,
              height: 88,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fff2e8 0%, #ffe7d1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(255, 102, 0, 0.18)',
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 42, color: '#FF6600' }} />
          </div>

          <Title level={3} style={{ marginBottom: 8 }}>
            Claim Submitted Successfully
          </Title>

          <Text style={{ display: 'block', color: '#5f6b76', fontSize: 15, lineHeight: 1.7 }}>
            Your motor claim has been sent to Etiqa and is now in the system.
          </Text>

          <div
            style={{
              marginTop: 20,
              padding: '16px 18px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #fffaf5 0%, #fff3e8 100%)',
              border: '1px solid #ffe0c2',
              textAlign: 'left',
            }}
          >
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#b45309' }}>
              What happens next
            </Text>
            <Text style={{ display: 'block', color: '#6b7280', marginBottom: 6 }}>
              Your claim will appear in the tracking area for status updates.
            </Text>
            <Text style={{ display: 'block', color: '#6b7280' }}>
              If more documents are needed, you will be notified in the customer portal.
            </Text>
          </div>

          {submittedClaimData?.id ? (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Claim ID</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16, letterSpacing: 0.4 }}>
                  {submittedClaimData.id}
                </Text>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div 
          style={{ 
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFF3E0',
            marginBottom: 16
          }}
        >
          <CarOutlined style={{ fontSize: 40, color: '#FF6600' }} />
        </div>
        <Title level={2} style={{ margin: 0 }}>Vehicle Claim</Title>
        <Text type="secondary">Complete all steps to submit your claim</Text>
      </div>
      
      {buildStepIndicator()}
      
      <div style={{ margin: '32px 0' }}>
        {submitError ? (
          <Alert
            type="error"
            showIcon
            message="Unable to submit claim"
            description={submitError}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            incidentDate: null,
            incidentTime: null,
            accidentType: undefined,
            vehicleClaimType: undefined,
            incidentDescription: '',
            location: '',
            vehicleRegistration: '',
            vehicleMake: undefined,
            vehicleModel: '',
            termsAgreed: false
          }}
        >
          {renderStepContent()}
        </Form>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {currentStep > 0 ? (
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handlePrevious}
          >
            Previous
          </Button>
        ) : (
          <div />
        )}
        
        <Button 
          type="primary" 
          icon={currentStep < 4 ? <ArrowRightOutlined /> : <CheckOutlined />}
          onClick={currentStep < 4 ? handleNext : handleSubmit}
          style={{ backgroundColor: '#FF6600', borderColor: '#FF6600' }}
          loading={submitting}
        >
          {currentStep < 4 ? 'Next' : 'Submit Claim'}
        </Button>
      </div>
    </div>
  );
}

export default SubmitClaimScreen;













