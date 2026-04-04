import React, { useState, useRef } from 'react';
import { 
  Form, Input, Button, Select, DatePicker, TimePicker, 
  Upload, message, Steps, Row, Col, Card, Typography, 
  Space, Divider, Alert, Checkbox
} from 'antd';
import { 
  CarOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined, 
  FileImageOutlined, 
  FilePdfOutlined, 
  UploadOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FolderOutlined,
  CloseOutlined,
  CameraOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import moment from 'moment';
import ClaimData from '../models/ClaimData';

const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;

function SubmitClaimScreen({ onSubmit }) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({});

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
  
  // Validate current step before proceeding
  const validateCurrentStep = async () => {
    try {
      switch (currentStep) {
        case 0:
          // Validate incident details
          await form.validateFields([
            'incidentDate'
          ]);
          return true;
        case 1:
          // Documents are optional
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
          await form.validateFields(['incidentDescription']);
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
      // Validate all fields
      const values = await form.validateFields();
      const selectedDocs = getRequiredDocuments(values.vehicleClaimType);
      
      // Create new claim with all form data
      const newClaim = {
        id: `CLM${Date.now().toString().substring(7)}`,
        date: new Date(),
        type: values.vehicleClaimType || values.accidentType,
        status: 'Submitted',
        location: values.location,
        vehicleModel: `${values.vehicleMake} ${values.vehicleModel}`,
        vehicleRegistration: values.vehicleRegistration,
        claimAmount: 0.0, // Will be determined later
        policyNumber: '', // Could be added to the form
        notes: ['New claim submitted by customer'],
        // Add file information
        documents: selectedDocs.flatMap((doc) =>
          (documentFiles[doc.key] || []).map((file) => ({
            type: doc.label,
            name: file.name,
            size: file.size,
            uploadDate: new Date()
          }))
        )
      };
      
      // Call the onSubmit callback with the new claim
      if (onSubmit) {
        onSubmit(newClaim);
      }
      
    } catch (error) {
      console.error("Form submission failed:", error);
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
                  format="DD/MM/YYYY"
                  disabledDate={current => current && current > moment().endOf('day')}
                  suffixIcon={<CalendarOutlined style={{ color: '#FF6600' }} />}
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

      {/* Coverage Card */}
      <Card
        style={{
          marginTop: 20,
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Name */}
        <Text type="secondary">Insured Person Name</Text>
        <Title level={4} style={{ marginTop: 0 }}>
          WANG YU TING
        </Title>

        {/* Info */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text type="secondary">Vehicle No.</Text>
            <div style={{ fontWeight: 600 }}>MDY1320</div>
          </Col>

          <Col span={12}>
            <Text type="secondary">Coverage Type</Text>
            <div style={{ fontWeight: 600 }}>Comprehensive</div>
          </Col>

          <Col span={12}>
            <Text type="secondary">Effective Date</Text>
            <div style={{ fontWeight: 600 }}>28 Mar 2026</div>
          </Col>

          <Col span={12}>
            <Text type="secondary">Expiry Date</Text>
            <div style={{ fontWeight: 600 }}>27 Mar 2027</div>
          </Col>
          </Row>
        
        </Card>
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
                  bodyStyle={{ width: '100%' }}
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
                  bodyStyle={{ width: '100%' }}
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
            />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24 }}>Upload Document</Title>
          <Text type="secondary">
            Upload a copy or image of the following documents.
            Total size must not exceed 20MB and accepted formats are JPG, PNG and HEIC only.
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
                          accept=".jpg,.jpeg,.png,.heic"
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
  const buildReviewSection = ({ title, icon, items }) => {
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
              <div style={{ width: 100 }}>
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
              title: 'When didi it happen?',
              icon: <FileTextOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: [
                { 
                  label: 'Date', 
                  value: formValues.incidentDate ? formValues.incidentDate.format('DD/MM/YYYY') : 'Not provided' 
                },
                { 
                  label: 'Time', 
                  value: formValues.incidentTime ? formValues.incidentTime.format('HH:mm') : 'Not provided' 
                },
                { 
                  label: 'Type', 
                  value: formValues.accidentType || 'Not provided' 
                },
                { 
                  label: 'Location', 
                  value: formValues.location || 'Not provided' 
                },
              ]
            })}
            
            <Divider style={{ margin: '16px 0' }} />
            
            {buildReviewSection({
              title: 'Vehicle Information',
              icon: <CarOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: [
                { 
                  label: 'Registration', 
                  value: formValues.vehicleRegistration || 'Not provided' 
                },
                { 
                  label: 'Make', 
                  value: formValues.vehicleMake || 'Not provided' 
                },
                { 
                  label: 'Model', 
                  value: formValues.vehicleModel || 'Not provided' 
                },
              ]
            })}
            
            <Divider style={{ margin: '16px 0' }} />
            
            {buildReviewSection({
              title: 'Claim Information',
              icon: <CheckCircleOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: [
                {
                  label: 'Vehicle Claim Type',
                  value: formValues.vehicleClaimType || 'Not provided'
                },
                {
                  label: 'Incident Details',
                  value: formValues.incidentDescription || 'Not provided'
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
              }))
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
          disabled={currentStep === 4 && !termsAgreed}
        >
          {currentStep < 4 ? 'Next' : 'Submit Claim'}
        </Button>
      </div>
    </div>
  );
}

export default SubmitClaimScreen;




















