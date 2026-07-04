import React, { useEffect, useRef, useState } from 'react';
import { 
  Form, Input, Button, DatePicker,
  Upload, message, Row, Col, Card, Typography, Modal,
  Divider, Alert, Checkbox, Spin, Empty, Tag, Table, Space
} from 'antd';
import { 
  CalendarOutlined, 
  CarOutlined,
  UploadOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FolderOutlined,
  EyeOutlined,
  CloseOutlined,
  ToolOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { getMyCoverages } from '../services/coverageService';
import { createClaim, getMyClaims } from '../services/claimService';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import { getActiveClaimForCoverage } from '../utils/claimEligibility';

const { Title, Text } = Typography;

const MOTOR_CLAIM_TYPES = {
  VehicleDamages: 1,
  Windscreen: 3,
};

const MAX_PARALLEL_CLOUDINARY_UPLOADS = 4;

const getCoverageEffectiveTime = (coverage) => {
  const effectiveDate = moment(coverage?.effectiveDate);
  return effectiveDate.isValid() ? effectiveDate.valueOf() : 0;
};

const sortCoveragesByLatestEffectiveDate = (coverages) => (
  [...coverages].sort((firstCoverage, secondCoverage) => (
    getCoverageEffectiveTime(secondCoverage) - getCoverageEffectiveTime(firstCoverage)
  ))
);

const motorClaimTypeOptions = [
  {
    value: MOTOR_CLAIM_TYPES.VehicleDamages,
    title: 'Vehicle Damage',
    description: 'For accident, collision, or body damage claims that need full vehicle damage evidence.',
    icon: <CarOutlined />,
  },
  {
    value: MOTOR_CLAIM_TYPES.Windscreen,
    title: 'Windscreen',
    description: 'For cracked or broken windscreen claims with one clear windscreen damage photo.',
    icon: <ToolOutlined />,
  },
];

const formatMoney = (amount) => `RM ${Number(amount || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

 function SubmitClaimScreen({ onSubmit }) {
  const [form] = Form.useForm();
  const smartFilesInputRef = useRef(null);
  const smartFolderInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({});
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [smartSelectedFiles, setSmartSelectedFiles] = useState([]);
  const [selectedMotorClaimType, setSelectedMotorClaimType] = useState(MOTOR_CLAIM_TYPES.VehicleDamages);
  const [selectedCoverage, setSelectedCoverage] = useState(null);
  const [incidentDateString, setIncidentDateString] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [coverageOptions, setCoverageOptions] = useState([]);
  const [existingClaims, setExistingClaims] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [smartApplySuccess, setSmartApplySuccess] = useState(null);
  const [submittedClaimData, setSubmittedClaimData] = useState(null);
  const [samplePreview, setSamplePreview] = useState(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState(null);

  const MAX_TOTAL_UPLOAD_BYTES = 20 * 1024 * 1024;
  const ACCEPTED_DOCUMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'pdf', 'heic']);

  const smartDocumentRules = {
    policeReport: {
      keywords: ['policereport', 'police_report', 'police-report', 'police report', 'report'],
      reason: 'Matched police report keywords',
    },
    idFront: {
      keywords: ['icfront', 'ic_front', 'ic-front', 'nricfront', 'nric_front', 'nric-front', 'identityfront', 'identity_front', 'identity-front'],
      reason: 'Matched front identity document keywords',
    },
    idBack: {
      keywords: ['icback', 'ic_back', 'ic-back', 'nricback', 'nric_back', 'nric-back', 'identityback', 'identity_back', 'identity-back'],
      reason: 'Matched back identity document keywords',
    },
    licenseFront: {
      keywords: ['licensefront', 'license_front', 'license-front', 'drivinglicensefront', 'driving_license_front', 'driving-license-front'],
      reason: 'Matched front driving license keywords',
    },
    licenseBack: {
      keywords: ['licenseback', 'license_back', 'license-back', 'drivinglicenseback', 'driving_license_back', 'driving-license-back'],
      reason: 'Matched back driving license keywords',
    },
    registrationCard: {
      keywords: ['ownership', 'vehicleownership', 'vehicle_ownership', 'vehicle-ownership', 'voc', 'grant', 'registration', 'registration-card', 'registration_card'],
      reason: 'Matched vehicle ownership keywords',
    },
    damageFrontLeft: {
      keywords: ['frontleft', 'front_left', 'front-left', 'damagefrontleft', 'damage_front_left', 'damage-front-left'],
      reason: 'Matched front-left damage keywords',
    },
    damageFrontRight: {
      keywords: ['frontright', 'front_right', 'front-right', 'damagefrontright', 'damage_front_right', 'damage-front-right'],
      reason: 'Matched front-right damage keywords',
    },
    damageRearLeft: {
      keywords: ['rearleft', 'rear_left', 'rear-left', 'damagerearleft', 'damage_rear_left', 'damage-rear-left'],
      reason: 'Matched rear-left damage keywords',
    },
    damageRearRight: {
      keywords: ['rearright', 'rear_right', 'rear-right', 'damagerearright', 'damage_rear_right', 'damage-rear-right'],
      reason: 'Matched rear-right damage keywords',
    },
    windscreenDamage: {
      keywords: ['windscreen', 'wind_screen', 'wind-screen', 'windshield', 'wind_shield', 'wind-shield', 'glass', 'crack', 'crackedglass', 'windscreendamage', 'windscreen_damage'],
      reason: 'Matched windscreen damage keywords',
    },
  };

  const vehicleDamageDocumentSections = [
      {
        title: 'Core Documents',
        documents: [
          {
            key: 'policeReport',
            label: 'Police report',
            sample: {
              title: 'SAMPLE POLICE REPORT',
              imagePath: '/assets/sample-police-report.jpg',
            },
          },
          {
            key: 'registrationCard',
            label: 'Registration card / Vehicle ownership certificate',
            sample: {
              title: 'SAMPLE REGISTRATION CARD',
              imagePath: '/assets/sample-registration-card.jpg',
            },
          }
        ]
      },
      {
        title: 'NRIC/Passport/Army/Police ID',
        documents: [
          {
            key: 'idFront',
            label: 'NRIC/Passport/Army/Police ID (Front)',
            sample: {
              title: 'SAMPLE NRIC',
              imagePath: '/assets/sample-ic.jpg',
            },
          },
          {
            key: 'idBack',
            label: 'NRIC/Passport/Army/Police ID (Back)',
            sample: {
              title: 'SAMPLE NRIC',
              imagePath: '/assets/sample-ic.jpg',
            },
          }
        ]
      },
      {
        title: 'Driving License',
        documents: [
          {
            key: 'licenseFront',
            label: 'Driving license (Front)',
            sample: {
              title: 'SAMPLE DRIVING LICENSE',
              imagePath: '/assets/sample-driving-license.jpg',
            },
          },
          {
            key: 'licenseBack',
            label: 'Driving License (Back)',
            sample: {
              title: 'SAMPLE DRIVING LICENSE',
              imagePath: '/assets/sample-driving-license.jpg',
            },
          }
        ]
      },
      {
        title: 'Vehicle Damages',
        documents: [
          {
            key: 'damageFrontLeft',
            label: 'Vehicle damages (Front left)',
            sample: {
              title: 'SAMPLE VEHICLE DAMAGE (FRONT LEFT)',
              imagePath: '/assets/sample-front-left.jpg',
            },
          },
          {
            key: 'damageFrontRight',
            label: 'Vehicle damages (Front right)',
            sample: {
              title: 'SAMPLE VEHICLE DAMAGE (FRONT RIGHT)',
              imagePath: '/assets/sample-front-right.jpg',
            },
          },
          {
            key: 'damageRearLeft',
            label: 'Vehicle damages (Rear left)',
            sample: {
              title: 'SAMPLE VEHICLE DAMAGE (REAR LEFT)',
              imagePath: '/assets/sample-rear-left.jpg',
            },
          },
          {
            key: 'damageRearRight',
            label: 'Vehicle damages (Rear right)',
            sample: {
              title: 'SAMPLE VEHICLE DAMAGE (REAR RIGHT)',
              imagePath: '/assets/sample-rear-right.jpg',
            },
          }
        ]
      }
  ];

  const windscreenDocumentSections = [
    {
      title: 'Core Documents',
      documents: [
        {
          key: 'registrationCard',
          label: 'Registration card / Vehicle ownership certificate',
          sample: {
            title: 'SAMPLE REGISTRATION CARD',
            imagePath: '/assets/sample-registration-card.jpg',
          },
        },
      ],
    },
    {
      title: 'NRIC/Passport/Army/Police ID',
      documents: [
        {
          key: 'idFront',
          label: 'NRIC/Passport/Army/Police ID (Front)',
          sample: {
            title: 'SAMPLE NRIC',
            imagePath: '/assets/sample-ic.jpg',
          },
        },
        {
          key: 'idBack',
          label: 'NRIC/Passport/Army/Police ID (Back)',
          sample: {
            title: 'SAMPLE NRIC',
            imagePath: '/assets/sample-ic.jpg',
          },
        },
      ],
    },
    {
      title: 'Driving License',
      documents: [
        {
          key: 'licenseFront',
          label: 'Driving license (Front)',
          sample: {
            title: 'SAMPLE DRIVING LICENSE',
            imagePath: '/assets/sample-driving-license.jpg',
          },
        },
        {
          key: 'licenseBack',
          label: 'Driving License (Back)',
          sample: {
            title: 'SAMPLE DRIVING LICENSE',
            imagePath: '/assets/sample-driving-license.jpg',
          },
        },
      ],
    },
    {
      title: 'Windscreen Damage',
      documents: [
        {
          key: 'windscreenDamage',
          label: 'Windscreen damage photo',
          sample: null,
        },
      ],
    },
  ];

  useEffect(() => {
    const loadCoverages = async () => {
      setCoverageLoading(true);

      try {
        const [coverages, claims] = await Promise.all([getMyCoverages(), getMyClaims()]);
        setCoverageOptions(sortCoveragesByLatestEffectiveDate(coverages));
        setExistingClaims(claims);
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

  const getDocumentSections = () => (
    selectedMotorClaimType === MOTOR_CLAIM_TYPES.Windscreen
      ? windscreenDocumentSections
      : vehicleDamageDocumentSections
  );

  const getSelectedClaimTypeOption = () => (
    motorClaimTypeOptions.find((option) => option.value === selectedMotorClaimType) || motorClaimTypeOptions[0]
  );

  const getRequiredDocuments = () => {
    return getDocumentSections().flatMap((section) => section.documents);
  };

  const getWindscreenRemainingAmount = (coverage) => Number(coverage?.windscreenRemainingCoverageAmount ?? 0);

  const isWindscreenCoverageUnavailable = (coverage) => (
    selectedMotorClaimType === MOTOR_CLAIM_TYPES.Windscreen && getWindscreenRemainingAmount(coverage) <= 0
  );

  const handleMotorClaimTypeChange = (claimType) => {
    if (claimType === selectedMotorClaimType) {
      return;
    }

    setSelectedMotorClaimType(claimType);
    setSelectedCoverage(null);
    form.setFieldsValue({ selectedCoverage: null });
    setDocumentFiles({});
    clearSmartSuggestions();
  };

  const getTotalUploadSize = (filesMap) => {
    return Object.values(filesMap).flat().reduce((sum, file) => sum + (file?.size || 0), 0);
  };

  const getMissingRequiredDocuments = () => {
    return getRequiredDocuments().filter((doc) => !(documentFiles[doc.key] && documentFiles[doc.key].length > 0));
  };

  const getDocumentLabel = (documentKey) => (
    getRequiredDocuments().find((doc) => doc.key === documentKey)?.label || documentKey
  );

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

  const handleSmartReplaceUpload = (documentKey) => ({ fileList }) => {
    const normalizedList = fileList.slice(-1);
    if (!normalizedList.length) {
      return;
    }

    const nextFiles = { ...documentFiles, [documentKey]: normalizedList };
    const totalSize = getTotalUploadSize(nextFiles);

    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      message.error('Total upload size cannot exceed 20MB');
      return;
    }

    setDocumentFiles(nextFiles);
    setSmartSuggestions((currentSuggestions) =>
      currentSuggestions.map((suggestion) =>
        suggestion.documentKey === documentKey
          ? {
              ...suggestion,
              file: normalizedList[0],
              confidence: 'Manual',
              reason: 'Manually selected for this document',
              accepted: true,
              rejected: false,
            }
          : suggestion
      )
    );
  };

  const handleSmartFilesSelected = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    buildSmartSuggestions(selectedFiles);
  };

  const buildSmartSuggestions = (files) => {
    if (!files.length) {
      return;
    }

    const validFiles = files.filter((file) => isAcceptedDocumentFile(file));
    const rejectedCount = files.length - validFiles.length;

    if (!validFiles.length) {
      message.error('No supported files found. Please choose JPG, PNG, PDF, or HEIC files.');
      return;
    }

    const usedFileKeys = new Set();
    const suggestions = getRequiredDocuments().map((doc) => {
      const suggestion = findBestFileSuggestion(doc, validFiles, usedFileKeys);

      if (suggestion?.file) {
        usedFileKeys.add(getSmartFileKey(suggestion.file));
      }

      return {
        documentKey: doc.key,
        documentLabel: doc.label,
        file: suggestion?.file || null,
        confidence: suggestion?.confidence || 'Missing',
        reason: suggestion?.reason || 'No filename keyword matched this document',
        accepted: Boolean(suggestion?.file),
        rejected: false,
      };
    });

    setSmartSelectedFiles(validFiles);
    setSmartSuggestions(suggestions);

    const matchedCount = suggestions.filter((suggestion) => suggestion.file).length;
    message.success(`Scanned ${validFiles.length} file(s). Suggested ${matchedCount}/${suggestions.length} document match(es).`);

    if (rejectedCount > 0) {
      message.warning(`${rejectedCount} unsupported file(s) were ignored.`);
    }
  };

  const acceptSmartSuggestion = (documentKey) => {
    const suggestion = smartSuggestions.find((item) => item.documentKey === documentKey);
    if (!suggestion?.file) {
      message.warning('No suggested file is available for this document.');
      return;
    }

    const nextFiles = { ...documentFiles, [documentKey]: [suggestion.file] };
    const totalSize = getTotalUploadSize(nextFiles);

    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      message.error('Total upload size cannot exceed 20MB');
      return;
    }

    setDocumentFiles(nextFiles);
    setSmartSuggestions((currentSuggestions) =>
      currentSuggestions.map((item) =>
        item.documentKey === documentKey
          ? { ...item, accepted: true, rejected: false }
          : item
      )
    );
  };

  const rejectSmartSuggestion = (documentKey) => {
    setSmartSuggestions((currentSuggestions) =>
      currentSuggestions.map((item) =>
        item.documentKey === documentKey
          ? { ...item, accepted: false, rejected: true }
          : item
      )
    );
  };

  const applyAcceptedSmartSuggestions = () => {
    const nextFiles = { ...documentFiles };
    let appliedCount = 0;

    smartSuggestions.forEach((suggestion) => {
      if (suggestion.accepted && !suggestion.rejected && suggestion.file) {
        nextFiles[suggestion.documentKey] = [suggestion.file];
        appliedCount += 1;
      }
    });

    const totalSize = getTotalUploadSize(nextFiles);

    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      message.error('Total upload size cannot exceed 20MB. Reject some suggestions or use smaller files.');
      return;
    }

    setDocumentFiles(nextFiles);
    clearSmartSuggestions();
    setSmartApplySuccess({
      appliedCount,
    });
  };

  const clearSmartSuggestions = () => {
    setSmartSelectedFiles([]);
    setSmartSuggestions([]);
  };

  const isAcceptedDocumentFile = (file) => {
    const extension = getFileExtension(file.name);
    return ACCEPTED_DOCUMENT_EXTENSIONS.has(extension);
  };

  const findBestFileSuggestion = (doc, files, usedFileKeys) => {
    const rule = smartDocumentRules[doc.key];

    if (!rule) {
      return null;
    }

    const candidates = files
      .filter((file) => !usedFileKeys.has(getSmartFileKey(file)))
      .map((file) => {
        const score = getFilenameMatchScore(file.name, rule.keywords);
        return {
          file: createUploadFileFromRawFile(file),
          rawFile: file,
          score,
        };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score);

    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      return null;
    }

    return {
      file: bestCandidate.file,
      confidence: bestCandidate.score >= 95 ? 'High' : bestCandidate.score >= 70 ? 'Medium' : 'Low',
      reason: `${rule.reason}: ${bestCandidate.rawFile.name}`,
    };
  };

  const getFilenameMatchScore = (fileName, keywords) => {
    const normalizedName = normalizeFileNameForMatching(fileName);

    return keywords.reduce((bestScore, keyword) => {
      const normalizedKeyword = normalizeFileNameForMatching(keyword);

      if (!normalizedKeyword || !normalizedName.includes(normalizedKeyword)) {
        return bestScore;
      }

      const exactNameMatch = normalizedName === normalizedKeyword;
      const strongKeyword = normalizedKeyword.length >= 8;
      const score = exactNameMatch ? 100 : strongKeyword ? 90 : 62;

      return Math.max(bestScore, score);
    }, 0);
  };

  const createUploadFileFromRawFile = (file) => ({
    uid: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'done',
    originFileObj: file,
  });

  const getSmartFileKey = (file) => {
    const rawFile = file?.originFileObj || file;
    return `${rawFile?.name || ''}-${rawFile?.size || 0}-${rawFile?.lastModified || 0}`;
  };

  const normalizeFileNameForMatching = (value) => String(value || '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '');

  const getFileExtension = (fileName) => {
    const segments = String(fileName || '').split('.');
    return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : '';
  };

  const openUploadedFilePreview = (uploadFile) => {
    const rawFile = uploadFile?.originFileObj || uploadFile;

    if (!rawFile) {
      return;
    }

    const previewUrl = URL.createObjectURL(rawFile);
    setUploadedFilePreview({
      name: uploadFile.name || rawFile.name || 'Uploaded file',
      type: rawFile.type || uploadFile.type || '',
      extension: getFileExtension(uploadFile.name || rawFile.name),
      url: previewUrl,
    });
  };

  const closeUploadedFilePreview = () => {
    if (uploadedFilePreview?.url) {
      URL.revokeObjectURL(uploadedFilePreview.url);
    }

    setUploadedFilePreview(null);
  };

  const isImagePreview = (preview) => (
    String(preview?.type || '').startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'heic'].includes(String(preview?.extension || '').toLowerCase())
  );

  const isPdfPreview = (preview) => (
    String(preview?.type || '').toLowerCase() === 'application/pdf' ||
    String(preview?.extension || '').toLowerCase() === 'pdf'
  );

  const getDocumentPayload = async () => {
    const uploadedEntries = Object.entries(documentFiles);
    const payload = {};
    const uploadTasks = [];

    for (const [documentKey, fileList] of uploadedEntries) {
      const file = fileList?.[0];

      if (!file) {
        payload[documentKey] = null;
        continue;
      }

      const rawFile = file.originFileObj ?? file;
      uploadTasks.push({
        documentKey,
        label: getDocumentLabel(documentKey),
        upload: () => uploadFileToCloudinary(rawFile),
      });
    }

    for (let index = 0; index < uploadTasks.length; index += MAX_PARALLEL_CLOUDINARY_UPLOADS) {
      const batch = uploadTasks.slice(index, index + MAX_PARALLEL_CLOUDINARY_UPLOADS);
      const batchResults = await Promise.all(
        batch.map(async (task) => {
          try {
            const url = await task.upload();
            return { documentKey: task.documentKey, url };
          } catch (error) {
            throw new Error(`Unable to upload ${task.label}. ${error?.message || 'Please try again.'}`);
          }
        })
      );

      batchResults.forEach(({ documentKey, url }) => {
        payload[documentKey] = url;
      });
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
          if (getActiveClaimForCoverage(existingClaims, selectedCoverage)) {
            message.error('This coverage already has an active claim. Wait until it is approved or rejected before submitting another claim.');
            return false;
          }
          if (isWindscreenCoverageUnavailable(coverageOptions.find((coverage) => coverage.coverageId === selectedCoverage))) {
            message.error('This coverage has no windscreen balance available.');
            return false;
          }
          return true;
        case 2: {
          await form.validateFields(['incidentDescription']);

          if (!incidentDescription.trim()) {
            message.error('Please describe the incident in detail');
            return false;
          }

          const missingDocs = getMissingRequiredDocuments();
          if (missingDocs.length > 0) {
            message.error(`Please upload all required documents. Missing: ${missingDocs[0].label}`);
            return false;
          }

          return true;
        }
        case 3: {
          await form.validateFields(['incidentDate', 'incidentDescription']);

          if (!incidentDateString) {
            message.error('Please select the incident date');
            return false;
          }

          if (!selectedCoverage) {
            message.error('Please select one coverage');
            return false;
          }

          if (getActiveClaimForCoverage(existingClaims, selectedCoverage)) {
            message.error('This coverage already has an active claim. Wait until it is approved or rejected before submitting another claim.');
            return false;
          }

          if (isWindscreenCoverageUnavailable(coverageOptions.find((coverage) => coverage.coverageId === selectedCoverage))) {
            message.error('This coverage has no windscreen balance available.');
            return false;
          }

          if (!incidentDescription.trim()) {
            message.error('Please describe the incident in detail');
            return false;
          }

          const missingDoc = getMissingRequiredDocuments()[0];
          if (missingDoc) {
            message.error(`Please upload all required documents. Missing: ${missingDoc.label}`);
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
      setSubmitStatus('');

      if (!termsAgreed) {
        message.warning('Please tick the confirmation checkbox before submitting your claim.');
        return;
      }

      const isValid = await validateCurrentStep();
      if (!isValid) {
        return;
      }

      await form.validateFields();
      setSubmitting(true);
      setSubmitStatus('Checking your latest claim status...');

      const latestClaims = await getMyClaims();
      setExistingClaims(latestClaims);

      const activeClaim = getActiveClaimForCoverage(latestClaims, selectedCoverage);
      if (activeClaim) {
        throw new Error(
          `This coverage already has active claim ${activeClaim.id || ''} (${activeClaim.status || 'in progress'}). Wait until it is approved or rejected before submitting another claim.`
        );
      }

      setSubmitStatus('Uploading documents securely...');
      const documentPayload = await getDocumentPayload();
      const incidentDateIso = incidentDateString ? `${incidentDateString}T00:00:00` : null;

      if (!incidentDateIso) {
        throw new Error('Incident date could not be converted to the backend format.');
      }

      const claimPayload = {
        coverageId: selectedCoverage,
        incidentDate: incidentDateIso,
        allClaimType: 1,
        motorClaimType: selectedMotorClaimType,
        incidentDescription: incidentDescription.trim(),
        policeReportDocument:
          selectedMotorClaimType === MOTOR_CLAIM_TYPES.VehicleDamages
            ? documentPayload.policeReport ?? null
            : null,
        vehicleOwnershipCertificateDocument: documentPayload.registrationCard ?? null,
        identityDocumentFront: documentPayload.idFront ?? null,
        identityDocumentBack: documentPayload.idBack ?? null,
        drivingLicenseFront: documentPayload.licenseFront ?? null,
        drivingLicenseBack: documentPayload.licenseBack ?? null,
        vehicleDamageFrontLeftDocument:
          selectedMotorClaimType === MOTOR_CLAIM_TYPES.Windscreen
            ? documentPayload.windscreenDamage ?? null
            : documentPayload.damageFrontLeft ?? null,
        vehicleDamageFrontRightDocument:
          selectedMotorClaimType === MOTOR_CLAIM_TYPES.VehicleDamages
            ? documentPayload.damageFrontRight ?? null
            : null,
        vehicleDamageRearLeftDocument:
          selectedMotorClaimType === MOTOR_CLAIM_TYPES.VehicleDamages
            ? documentPayload.damageRearLeft ?? null
            : null,
        vehicleDamageRearRightDocument:
          selectedMotorClaimType === MOTOR_CLAIM_TYPES.VehicleDamages
            ? documentPayload.damageRearRight ?? null
            : null,
      };

      console.log('Create claim payload', claimPayload);

      setSubmitStatus('Sending claim for OCR and validation...');
      const createdClaim = await createClaim(claimPayload);
      console.log('Create claim response', createdClaim);
      setExistingClaims((claims) => [createdClaim, ...claims]);

      setSubmittedClaimData({
        ...createdClaim,
        type: getSelectedClaimTypeOption().title,
        vehicleRegistration:
          coverageOptions.find((coverage) => coverage.coverageId === selectedCoverage)?.vehicleNo ||
          createdClaim.vehicleRegistration,
      });
      setSuccessModalOpen(true);

      form.resetFields();
      setCurrentStep(0);
      setTermsAgreed(false);
      setDocumentFiles({});
      setSmartSelectedFiles([]);
      setSmartSuggestions([]);
      setSelectedMotorClaimType(MOTOR_CLAIM_TYPES.VehicleDamages);
      setSelectedCoverage(null);
      setIncidentDateString('');
      setIncidentDescription('');
      setSubmitStatus('');
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
      setSubmitStatus('');
    }
  };
  
  // Build custom step indicator
  const buildStepIndicator = () => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 10,
          marginTop: 12,
          padding: '0 4px',
        }}
      >
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
          title: "Supporting Documents",
          isActive: currentStep === 2,
          isCompleted: currentStep > 2
        })}
        
        {buildStepConnector({
          isCompleted: currentStep > 2
        })}

        {buildStepIndicatorItem({
          number: 4,
          title: "Review & Submit",
          isActive: currentStep === 3,
          isCompleted: currentStep > 3
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

          {incidentDateString ? (
            <>
              <Divider />
              <Title level={4}>What do you want to claim?</Title>
              <Text type="secondary">
                Choose the motor claim type first so the portal can request the correct documents.
              </Text>
              <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                {motorClaimTypeOptions.map((option) => {
                  const isSelected = selectedMotorClaimType === option.value;
                  return (
                    <Col xs={24} md={12} key={option.value}>
                      <Card
                        hoverable
                        onClick={() => handleMotorClaimTypeChange(option.value)}
                        style={{
                          height: '100%',
                          borderRadius: 14,
                          border: isSelected ? '2px solid #FF6600' : '1px solid #e5e7eb',
                          background: isSelected ? '#fff7ed' : '#ffffff',
                          boxShadow: isSelected ? '0 10px 24px rgba(255, 102, 0, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                        styles={{ body: { padding: 16 } }}
                      >
                        <Space align="start" size={12}>
                          <span
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isSelected ? '#ffedd5' : '#f8fafc',
                              color: '#c2410c',
                              fontSize: 20,
                            }}
                          >
                            {option.icon}
                          </span>
                          <Space direction="vertical" size={4}>
                            <Text strong>{option.title}</Text>
                            <Text type="secondary">{option.description}</Text>
                            {isSelected ? <Tag color="orange">Selected</Tag> : null}
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </>
          ) : null}
        
        </Card>
      </div>
    );
  };
  
  // Build select coverage step
  const buildSelectCoverageStep = () => {
    const selectCoverage = (coverageId) => {
      const coverage = coverageOptions.find((item) => item.coverageId === coverageId);
      const activeClaim = getActiveClaimForCoverage(existingClaims, coverageId);
      if (activeClaim) {
        message.warning('This coverage already has an active claim. Wait until it is approved or rejected before submitting another claim.');
        return;
      }

      if (isWindscreenCoverageUnavailable(coverage)) {
        message.warning('This coverage has no windscreen balance available.');
        return;
      }

      setSelectedCoverage(coverageId);
      form.setFieldsValue({ selectedCoverage: coverageId });
    };

    const coverageCardStyle = (isSelected, isLocked) => ({
      marginTop: 12,
      borderRadius: 16,
      border: isSelected ? '2px solid #FF6600' : '1px solid #e8e8e8',
      boxShadow: isSelected ? '0 4px 12px rgba(255,102,0,0.12)' : '0 2px 8px rgba(0,0,0,0.05)',
      cursor: isLocked ? 'not-allowed' : 'pointer',
      opacity: isLocked ? 0.72 : 1
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
              const activeClaim = getActiveClaimForCoverage(existingClaims, coverage.coverageId);
              const isWindscreenUnavailable = isWindscreenCoverageUnavailable(coverage);
              const isLocked = Boolean(activeClaim) || isWindscreenUnavailable;
              return (
                <Col xs={24} lg={12} key={coverage.coverageId}>
                  <Card
                    style={coverageCardStyle(isSelected, isLocked)}
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
                      {activeClaim ? (
                        <Tag color="warning">Active claim in progress</Tag>
                      ) : isWindscreenUnavailable ? (
                        <Tag color="default">No windscreen balance</Tag>
                      ) : (
                        <Checkbox checked={isSelected} />
                      )}
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

                      {selectedMotorClaimType === MOTOR_CLAIM_TYPES.Windscreen ? (
                        <>
                          <Col xs={24} md={12}>
                            <Text type="secondary">Windscreen Balance</Text>
                            <div style={{ fontWeight: 700, color: getWindscreenRemainingAmount(coverage) > 0 ? '#237804' : '#8c8c8c' }}>
                              {formatMoney(coverage.windscreenRemainingCoverageAmount)}
                            </div>
                          </Col>

                          <Col xs={24} md={12}>
                            <Text type="secondary">Windscreen Limit</Text>
                            <div style={{ fontWeight: 600 }}>
                              {formatMoney(coverage.windscreenCoverageLimitAmount)}
                            </div>
                          </Col>
                        </>
                      ) : null}
                    </Row>

                    {activeClaim ? (
                      <Alert
                        style={{ marginTop: 14 }}
                        type="warning"
                        showIcon
                        message={
                          activeClaim.id
                            ? `Unavailable while claim ${activeClaim.id} is ${activeClaim.status || 'in progress'}`
                            : `Unavailable while the current claim is ${activeClaim.status || 'in progress'}`
                        }
                        description="You can use this coverage again after the current claim is approved or rejected."
                      />
                    ) : isWindscreenUnavailable ? (
                      <Alert
                        style={{ marginTop: 14 }}
                        type="info"
                        showIcon
                        message="No windscreen balance available"
                        description="Choose another coverage or submit a vehicle damage claim instead."
                      />
                    ) : null}
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

  // Build documents step
  const buildDocumentsStep = () => {
    const documentSections = getDocumentSections();
    const requiredDocs = getRequiredDocuments();
    const missingDocs = getMissingRequiredDocuments();
    const uploadedCount = requiredDocs.filter((doc) => (documentFiles[doc.key] || []).length > 0).length;
    const totalSizeMB = (getTotalUploadSize(documentFiles) / (1024 * 1024)).toFixed(2);
    const smartMatchedCount = smartSuggestions.filter((suggestion) => suggestion.file).length;
    const smartAcceptedCount = smartSuggestions.filter((suggestion) => suggestion.accepted && !suggestion.rejected && suggestion.file).length;

    const smartSuggestionColumns = [
      {
        title: 'Document Required',
        dataIndex: 'documentLabel',
        key: 'documentLabel',
        width: '30%',
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: 'Suggested File',
        key: 'file',
        width: '45%',
        render: (_, suggestion) => suggestion.file ? (
          <Text style={{ wordBreak: 'break-word' }}>{suggestion.file.name}</Text>
        ) : (
          <Text type="danger">No suggestion</Text>
        ),
      },
      {
        title: 'Use',
        key: 'use',
        width: '8%',
        align: 'center',
        render: (_, suggestion) => (
          <Checkbox
            disabled={!suggestion.file || suggestion.rejected}
            checked={Boolean(suggestion.accepted && !suggestion.rejected)}
            onChange={(event) => {
              if (event.target.checked) {
                acceptSmartSuggestion(suggestion.documentKey);
              } else {
                setSmartSuggestions((currentSuggestions) =>
                  currentSuggestions.map((item) =>
                    item.documentKey === suggestion.documentKey
                      ? { ...item, accepted: false }
                      : item
                  )
                );
              }
            }}
          />
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: '17%',
        render: (_, suggestion) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {suggestion.file && !suggestion.rejected ? (
              <Button size="small" onClick={() => rejectSmartSuggestion(suggestion.documentKey)}>
                Reject
              </Button>
            ) : null}
            <Upload
              fileList={documentFiles[suggestion.documentKey] || []}
              onChange={handleSmartReplaceUpload(suggestion.documentKey)}
              beforeUpload={() => false}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.pdf,.heic"
              showUploadList={false}
            >
              <Button size="small" type="link">
                Replace
              </Button>
            </Upload>
          </div>
        ),
      },
    ];

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

          <Title level={4} style={{ marginTop: 24 }}>Upload {getSelectedClaimTypeOption().title} Documents</Title>
          <Text type="secondary">
            Upload a copy or image of the following documents.
            Files will be uploaded securely to cloud storage. Total size must not exceed 20MB and accepted formats are JPG, PNG, PDF and HEIC.
          </Text>

          <Alert
            style={{ marginTop: 12, marginBottom: 16 }}
            type={missingDocs.length > 0 || !incidentDescription.trim() ? 'warning' : 'success'}
            showIcon
            message={`Uploaded ${uploadedCount}/${requiredDocs.length} required document(s) | Total size: ${totalSizeMB} MB / 20 MB`}
            description={
              missingDocs.length > 0 || !incidentDescription.trim()
                ? `Complete the incident description and upload every document before continuing. Missing documents: ${
                    missingDocs.map((doc) => doc.label).join(', ') || 'None'
                  }`
                : 'All required supporting information is complete.'
            }
          />

          <Card
            size="small"
            style={{
              marginBottom: 18,
              borderRadius: 12,
              border: '1px solid #f3d2b7',
              background: '#fffaf5',
            }}
          >
            <input
              ref={smartFilesInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.heic"
              onChange={handleSmartFilesSelected}
              style={{ display: 'none' }}
            />
            <input
              ref={smartFolderInputRef}
              type="file"
              multiple
              webkitdirectory="true"
              directory="true"
              accept=".jpg,.jpeg,.png,.pdf,.heic"
              onChange={handleSmartFilesSelected}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Title level={5} style={{ margin: 0 }}>Smart Document Upload Suggestions</Title>
                <Text type="secondary">
                  Select files or a folder first. The portal only scans the file names you choose and suggests document matches.
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button icon={<UploadOutlined />} onClick={() => smartFilesInputRef.current?.click()}>
                  Select Files
                </Button>
                <Button icon={<FolderOutlined />} onClick={() => smartFolderInputRef.current?.click()}>
                  Select Folder
                </Button>
              </div>
            </div>

            {smartSuggestions.length ? (
              <>
                <Alert
                  style={{ marginTop: 14, marginBottom: 12 }}
                  type={smartMatchedCount === requiredDocs.length ? 'success' : 'info'}
                  showIcon
                  message={`Suggested ${smartMatchedCount}/${requiredDocs.length} required document(s) from ${smartSelectedFiles.length} selected file(s)`}
                  description={`${smartAcceptedCount} suggestion(s) are currently selected for use. You can untick, reject, or replace any row before applying.`}
                />
                <Table
                  size="small"
                  dataSource={smartSuggestions}
                  columns={smartSuggestionColumns}
                  rowKey="documentKey"
                  pagination={false}
                  tableLayout="fixed"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <Button onClick={clearSmartSuggestions}>Clear Suggestions</Button>
                  <Button type="primary" onClick={applyAcceptedSmartSuggestions}>
                    Apply Accepted Suggestions
                  </Button>
                </div>
              </>
            ) : null}
          </Card>

          {documentSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              style={{
                marginBottom: sectionIndex === documentSections.length - 1 ? 0 : 16,
                border: '1px solid #e0c29c',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(191, 125, 61, 0.08)',
                backgroundColor: '#fffdfa',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #f7e2ca 0%, #f2d3b3 100%)',
                  borderBottom: '1px solid #e0c29c',
                  padding: '10px 14px'
                }}
              >
                <Text strong style={{ fontSize: 14, color: '#8a4b14', letterSpacing: 0.2 }}>
                  {section.title}
                </Text>
              </div>

              <div style={{ padding: '4px 14px', backgroundColor: '#fffdfa' }}>
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
                        borderBottom: docIndex === section.documents.length - 1 ? 'none' : '1px solid #f0dfcd'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <Text strong style={{ paddingRight: 8 }}>
                            {doc.label}
                          </Text>
                          {doc.sample ? (
                            <Button
                              type="link"
                              icon={<EyeOutlined />}
                              onClick={() => setSamplePreview(doc.sample)}
                              style={{
                                padding: 0,
                                height: 'auto',
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              View Sample
                            </Button>
                          ) : null}
                        </div>
                        <div>
                          {uploadedFile ? (
                            <Button
                              type="link"
                              onClick={() => openUploadedFilePreview(uploadedFile)}
                              style={{
                                padding: 0,
                                height: 'auto',
                                maxWidth: '100%',
                                fontSize: 12,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Uploaded: {uploadedFile.name}
                            </Button>
                          ) : (
                            <Text
                              type="danger"
                              style={{
                                fontSize: 12,
                                display: 'block',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Not uploaded
                            </Text>
                          )}
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
                {item.content || <Text strong>{item.value || ''}</Text>}
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
    const requiredDocs = getRequiredDocuments();
    const selectedCoverageDetails = coverageOptions.find((coverage) =>
      coverage.coverageId === selectedCoverage
    );
    
    const renderReviewFileList = (files = []) => {
      if (!files.length) {
        return <Text type="danger">No file uploaded</Text>;
      }

      return (
        <Space direction="vertical" size={4}>
          {files.map((file) => (
            <Button
              key={file.uid || file.name}
              type="link"
              onClick={() => openUploadedFilePreview(file)}
              style={{
                padding: 0,
                height: 'auto',
                textAlign: 'left',
                whiteSpace: 'normal',
              }}
            >
              {file.name}
            </Button>
          ))}
        </Space>
      );
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
              icon: <CalendarOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: selectedCoverageDetails
                ? [{
                    label: 'Claim Type',
                    value: getSelectedClaimTypeOption().title
                  }, {
                    label: 'Selected Coverage',
                    value: `${selectedCoverageDetails.insuredPersonName} | ${selectedCoverageDetails.vehicleNo} | ${selectedCoverageDetails.coverageType} | ${moment(selectedCoverageDetails.effectiveDate).format('DD MMM YYYY')} - ${moment(selectedCoverageDetails.expiryDate).format('DD MMM YYYY')}`
                  }]
                : [
                    { label: 'Claim Type', value: getSelectedClaimTypeOption().title },
                    { label: 'Selected Coverage', value: 'Not provided' },
                  ]
            })}
            
            <Divider style={{ margin: '16px 0' }} />
            
            {buildReviewSection({
              title: 'Supporting Documents',
              icon: <FolderOutlined style={{ color: '#FF6600', fontSize: 18 }} />,
              items: requiredDocs.map((doc) => ({
                label: doc.label,
                content: renderReviewFileList(documentFiles[doc.key] || [])
              })),
              labelWidth: 260
            })}
          </div>
          
          <Alert
            message={<Text strong>Please confirm that all information is correct</Text>}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid #f59e0b',
              background: '#fffbeb',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Checkbox
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                aria-label="Confirm claim declaration"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <Space direction="vertical" size={8}>
              <Text strong style={{ color: '#92400e' }}>
                I declare that all information and documents submitted are complete, accurate, genuine, and truthful.
              </Text>
              <Text>
                I understand that submitting false, misleading, incomplete, altered, or forged information, or attempting to make a fraudulent claim, may result in the immediate rejection or cancellation of my claim. It may also lead to further investigation, recovery of any amounts paid, suspension from future claims, and referral to the relevant authorities where applicable.
              </Text>
              <Text>
                By ticking this box and submitting the form, I confirm that I have reviewed my submission carefully and accept full responsibility for the information and documents provided.
              </Text>
              </Space>
            </div>
          </div>
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
        return buildDocumentsStep();
      case 3:
        return buildReviewStep();
      default:
        return null;
    }
  };
  
  return (
    <div className="portal-dashboard-stack">
      <Modal
        open={successModalOpen}
        title={null}
        okText="Track My Claim"
        cancelText="Submit Another"
        centered
        width={520}
        onCancel={() => setSuccessModalOpen(false)}
        onOk={async () => {
          setSuccessModalOpen(false);

          if (onSubmit && submittedClaimData) {
            await onSubmit(submittedClaimData);
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

      <Modal
        open={Boolean(smartApplySuccess)}
        title={null}
        centered
        width={460}
        okText="OK"
        cancelButtonProps={{ style: { display: 'none' } }}
        onOk={() => setSmartApplySuccess(null)}
        onCancel={() => setSmartApplySuccess(null)}
      >
        <div style={{ textAlign: 'center', padding: '14px 8px 4px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 18px',
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bbf7d0',
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 36, color: '#16a34a' }} />
          </div>
          <Title level={4} style={{ marginBottom: 8 }}>
            Smart Upload Applied Successfully
          </Title>
          <Text style={{ display: 'block', color: '#5f6b76', lineHeight: 1.7 }}>
            {smartApplySuccess?.appliedCount || 0} accepted file(s) have been placed into the matching upload field(s).
          </Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            You can still replace any file manually before submitting the claim.
          </Text>
        </div>
      </Modal>

      <Modal
        open={Boolean(samplePreview)}
        title={null}
        footer={null}
        centered
        width={760}
        closeIcon={<CloseOutlined style={{ fontSize: 18, position: 'relative', top: -4 }} />}
        onCancel={() => setSamplePreview(null)}
      >
        <div style={{ padding: '8px 4px' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: '#fff7e6',
              border: '1px solid #ffd591',
              marginBottom: 20,
            }}
          >
            <Text strong style={{ display: 'block', color: '#d46b08', marginBottom: 6 }}>
              Important Note
            </Text>
            <Text style={{ color: '#8c4a00', lineHeight: 1.7 }}>
              Before you proceed, do ensure that you have indicated "Submitted to Etiqa" in handwriting clearly on your original receipts.
            </Text>
          </div>

          <Title level={4} style={{ textAlign: 'center', marginBottom: 20 }}>
            {samplePreview?.title}
          </Title>

          {samplePreview?.imagePath ? (
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                textAlign: 'center',
              }}
            >
              <img
                src={samplePreview.imagePath}
                alt={samplePreview.title}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(uploadedFilePreview)}
        title={uploadedFilePreview?.name || 'Uploaded file'}
        footer={[
          <Button key="open" onClick={() => uploadedFilePreview?.url && window.open(uploadedFilePreview.url, '_blank', 'noopener,noreferrer')}>
            Open in New Tab
          </Button>,
          <Button key="close" type="primary" onClick={closeUploadedFilePreview}>
            Close
          </Button>,
        ]}
        centered
        width={820}
        onCancel={closeUploadedFilePreview}
      >
        {uploadedFilePreview ? (
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fafafa',
              minHeight: 220,
            }}
          >
            {isImagePreview(uploadedFilePreview) ? (
              <img
                src={uploadedFilePreview.url}
                alt={uploadedFilePreview.name}
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  background: '#fff',
                }}
              />
            ) : isPdfPreview(uploadedFilePreview) ? (
              <iframe
                title={uploadedFilePreview.name}
                src={uploadedFilePreview.url}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 0,
                  background: '#fff',
                }}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 42, color: '#FF6600', marginBottom: 12 }} />
                <Title level={5}>Preview is not available for this file type</Title>
                <Text type="secondary">Use Open in New Tab to view or download the selected file.</Text>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Submit Claim</span>
          <Title level={2} className="portal-dashboard-title">{getSelectedClaimTypeOption().title} Claim</Title>
          <Text className="portal-dashboard-description">
            Complete all steps to submit your claim.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Current Step</span>
              <span className="portal-dashboard-chip-value">{currentStep + 1}/4</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Coverages</span>
              <span className="portal-dashboard-chip-value">{coverageOptions.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Documents</span>
              <span className="portal-dashboard-chip-value">{Object.values(documentFiles).filter((files) => files?.length).length}</span>
            </div>
          </div>
        </div>
      </div>

      {buildStepIndicator()}
      
      <div style={{ margin: '6px 0 20px' }}>
        {submitError ? (
          <Alert
            type="error"
            showIcon
            message="Unable to submit claim"
            description={submitError}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {submitting && submitStatus ? (
          <Alert
            type="info"
            showIcon
            message={submitStatus}
            description="Document uploads now run in parallel; OCR and claim validation continue after the files are uploaded."
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            incidentDate: null,
            incidentDescription: '',
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
          icon={currentStep < 3 ? <ArrowRightOutlined /> : <CheckOutlined />}
          onClick={currentStep < 3 ? handleNext : handleSubmit}
          style={{ backgroundColor: '#FF6600', borderColor: '#FF6600' }}
          loading={submitting}
        >
          {currentStep < 3 ? 'Next' : 'Submit Claim'}
        </Button>
      </div>
    </div>
  );
}

export default SubmitClaimScreen;













