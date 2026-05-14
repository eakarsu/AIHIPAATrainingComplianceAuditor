// AI Feature Configuration with samples and resource dropdowns for all 25 AI features

const AI_CONFIG = {
  'generate-policy': {
    title: 'Policy Generator',
    description: 'Generate comprehensive HIPAA policy documents using AI.',
    fields: [
      { name: 'policyType', label: 'Policy Type', placeholder: 'e.g. Privacy, Security, Breach Notification' },
      { name: 'department', label: 'Department', type: 'resource_select', resource: 'departments', displayFn: (i) => i.name },
      { name: 'specificRequirements', label: 'Specific Requirements', type: 'textarea', placeholder: 'Any specific requirements...' },
    ],
    samples: [
      { label: 'Privacy - Cardiology', data: { policyType: 'Privacy Policy', department: 'Cardiology', specificRequirements: 'Focus on patient consent for cardiac monitoring data, telemetry data sharing with referring physicians, and cardiac rehabilitation program PHI handling.' } },
      { label: 'Security - IT Dept', data: { policyType: 'Information Security Policy', department: 'Information Technology', specificRequirements: 'Cover endpoint security, cloud infrastructure access controls, BYOD policies, and remote access VPN requirements for IT staff managing ePHI systems.' } },
      { label: 'Breach Notification', data: { policyType: 'Breach Notification Policy', department: 'Organization-wide', specificRequirements: 'Include 60-day notification timeline, HHS reporting for breaches over 500 individuals, media notification requirements, and state-specific laws.' } },
    ],
    fn: 'generatePolicy',
  },
  'generate-quiz': {
    title: 'Quiz Generator',
    description: 'Generate HIPAA training quizzes for employees.',
    fields: [
      { name: 'topic', label: 'Topic', placeholder: 'e.g. Privacy Rule, Breach Notification' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
      { name: 'questionCount', label: 'Number of Questions', type: 'number', placeholder: '10' },
    ],
    samples: [
      { label: 'Privacy Rule - Beginner', data: { topic: 'HIPAA Privacy Rule fundamentals including patient rights, minimum necessary standard, and Notice of Privacy Practices', difficulty: 'beginner', questionCount: '10' } },
      { label: 'Security Awareness', data: { topic: 'Cybersecurity awareness for healthcare: phishing, password hygiene, social engineering, and mobile device security', difficulty: 'intermediate', questionCount: '15' } },
      { label: 'Breach Response - Advanced', data: { topic: 'HIPAA Breach Notification Rule: 60-day timelines, risk assessment factors, HHS reporting, individual notification requirements, and media notification thresholds', difficulty: 'advanced', questionCount: '12' } },
    ],
    fn: 'generateQuiz',
  },
  'check-compliance': {
    title: 'Compliance Check',
    description: 'Analyze scenarios for HIPAA compliance issues.',
    fields: [
      { name: 'organizationDetails', label: 'Organization Details', type: 'textarea', placeholder: 'Describe your organization...' },
      { name: 'currentPractices', label: 'Current Practices', type: 'textarea', placeholder: 'Describe current compliance practices...' },
      { name: 'areasOfConcern', label: 'Areas of Concern', placeholder: 'Specific compliance areas to evaluate' },
    ],
    samples: [
      { label: 'Small Clinic Review', data: { organizationDetails: 'Small family medicine clinic with 12 staff members, 3 physicians, using cloud-based EHR (MedCloud). Annual revenue $2M. No dedicated IT staff.', currentPractices: 'Annual HIPAA training, basic password policies, paper sign-in sheets, encrypted email for PHI, locked filing cabinets for paper records.', areasOfConcern: 'No formal risk assessment done in 2 years, staff using personal phones for patient communication, no BAA with cleaning service' } },
      { label: 'Hospital IT Audit', data: { organizationDetails: 'Mid-size community hospital, 500 beds, 2000 employees, multiple EHR systems, telehealth platform, connected medical devices.', currentPractices: 'MFA on critical systems, quarterly access reviews, annual penetration testing, SIEM deployed, incident response team established.', areasOfConcern: 'Legacy systems running unsupported OS, medical IoT devices with default credentials, incomplete audit log coverage, shadow IT in clinical departments' } },
      { label: 'Telehealth Startup', data: { organizationDetails: 'Telehealth startup with 50 employees, fully remote workforce, AWS cloud infrastructure, mobile app for patients, serving 15,000 patients across 8 states.', currentPractices: 'SOC 2 Type II certified, end-to-end encryption on video calls, role-based access controls, automated compliance monitoring.', areasOfConcern: 'Multi-state regulatory compliance, patient data stored across multiple cloud regions, third-party API integrations not fully vetted, no physical security controls for remote workers' } },
    ],
    fn: 'checkCompliance',
  },
  'analyze-risk': {
    title: 'Risk Analysis',
    description: 'AI-driven risk analysis for HIPAA compliance.',
    fields: [
      { name: 'riskDescription', label: 'Risk Description', type: 'textarea', placeholder: 'Describe the risk scenario...' },
      { name: 'systemType', label: 'System Type', placeholder: 'e.g. EHR, Cloud Storage, Mobile App' },
      { name: 'dataTypes', label: 'Data Types', placeholder: 'e.g. PHI, PII, medical records' },
      { name: 'currentControls', label: 'Current Controls', type: 'textarea', placeholder: 'List existing security controls...' },
    ],
    samples: [
      { label: 'Ransomware on EHR', data: { riskDescription: 'Potential ransomware attack targeting our primary EHR system. Recent increase in phishing attempts targeting clinical staff. EHR contains records for 50,000 patients.', systemType: 'Cloud-hosted Electronic Health Record (MedCloud EHR)', dataTypes: 'Full patient medical records, diagnoses, medications, lab results, insurance information, SSNs', currentControls: 'Endpoint antivirus, email filtering, daily backups to separate cloud, MFA for admin accounts only, annual security training' } },
      { label: 'Mobile Device PHI', data: { riskDescription: 'Staff using personal mobile devices to access patient scheduling app and take photos of wound progression. Some devices not enrolled in MDM. Devices may be shared with family members.', systemType: 'Mobile devices (iOS and Android) with healthcare apps', dataTypes: 'Patient names, appointment schedules, clinical photographs, medication lists', currentControls: 'MDM policy exists but enforcement is inconsistent, app-level PIN required, no remote wipe capability on unenrolled devices' } },
      { label: 'Cloud Misconfiguration', data: { riskDescription: 'Recent cloud migration moved patient portal and claims processing to AWS. DevOps team discovered an S3 bucket with patient billing data was briefly publicly accessible for 48 hours during migration.', systemType: 'AWS cloud infrastructure (S3, RDS, EC2)', dataTypes: 'Patient billing records, insurance claims, payment card data, diagnosis codes', currentControls: 'AWS CloudTrail logging, basic IAM roles, encryption at rest enabled, no cloud security posture management tool, manual configuration reviews quarterly' } },
    ],
    fn: 'analyzeRisk',
  },
  'incident-response': {
    title: 'Incident Response Advisor',
    description: 'Get AI-guided incident response recommendations.',
    fields: [
      { name: 'incidentType', label: 'Incident Type', placeholder: 'e.g. Data breach, ransomware, unauthorized access' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the incident...' },
      { name: 'affectedSystems', label: 'Affected Systems', placeholder: 'List affected systems' },
    ],
    samples: [
      { label: 'Phishing Breach', data: { incidentType: 'Phishing / Credential Theft', severity: 'high', description: 'Three billing department staff clicked a phishing email that mimicked an internal IT notification. They entered their credentials on a spoofed login page. The attacker used one set of credentials to access the billing system and exported 2 months of patient billing records (approximately 3,400 records) before the access was detected.', affectedSystems: 'BillRight Medical Billing Platform, Email system, Active Directory' } },
      { label: 'Ransomware Attack', data: { incidentType: 'Ransomware', severity: 'critical', description: 'At 3:00 AM, the lab information system and radiology PACS became unavailable. Ransom note discovered on affected servers demanding 50 BTC. Malware appears to have spread through an unpatched VPN appliance. 12 servers affected, clinical operations disrupted.', affectedSystems: 'LabConnect LIS, RadImaging PACS, 3 file servers, VPN gateway, potentially EHR backup server' } },
      { label: 'Insider Unauthorized Access', data: { incidentType: 'Unauthorized PHI Access', severity: 'medium', description: 'Audit log review revealed that an ER nurse accessed medical records of a local politician who was admitted to a different department. The nurse has no treatment relationship with this patient. Access occurred 7 times over 3 days. No evidence of data exfiltration but records included sensitive mental health notes.', affectedSystems: 'MedCloud EHR' } },
    ],
    fn: 'incidentResponse',
  },
  'gap-analysis': {
    title: 'Gap Analysis',
    description: 'Identify HIPAA compliance gaps.',
    fields: [
      { name: 'currentState', label: 'Current State', type: 'textarea', placeholder: 'Describe current compliance practices...' },
      { name: 'desiredState', label: 'Desired State', type: 'textarea', placeholder: 'Describe target compliance level...' },
      { name: 'complianceAreas', label: 'Compliance Areas', placeholder: 'e.g. Privacy Rule, Security Rule, all' },
    ],
    samples: [
      { label: 'Privacy Rule Gaps', data: { currentState: 'We have a Notice of Privacy Practices posted in the lobby but haven\'t updated it since 2021. Patient access requests are handled on paper with no tracking system. No formal process for accounting of disclosures. Authorization forms are inconsistent across departments.', desiredState: 'Full Privacy Rule compliance with automated request tracking, updated NPP reflecting current practices, standardized authorization forms, and documented disclosure accounting process.', complianceAreas: 'Privacy Rule - Patient Rights, Notice of Privacy Practices, Authorizations, Accounting of Disclosures' } },
      { label: 'Security Rule Assessment', data: { currentState: 'Last risk assessment was 18 months ago. MFA only on admin accounts. No encryption on some legacy workstations. Audit logs reviewed annually. Patch management is ad-hoc. No formal incident response plan tested. Backup tested only once.', desiredState: 'Complete Security Rule compliance with annual risk assessments, universal MFA, full encryption, quarterly log reviews, automated patch management, tested incident response plan, and monthly backup verification.', complianceAreas: 'Security Rule - Administrative Safeguards, Physical Safeguards, Technical Safeguards' } },
      { label: 'Full HIPAA Review', data: { currentState: 'Mid-size healthcare org with basic compliance program. Training completion at 72%. 3 open incident investigations. BAAs with 15 vendors but 2 expired. No designated privacy officer (duties split between compliance and legal). Risk register not maintained.', desiredState: 'Comprehensive HIPAA compliance across all rules with 100% training, designated privacy and security officers, current BAAs, active risk management program, and clean audit record.', complianceAreas: 'All - Privacy Rule, Security Rule, Breach Notification Rule, Enforcement Rule, Omnibus Rule requirements' } },
    ],
    fn: 'gapAnalysis',
  },
  'training-recommendation': {
    title: 'Training Recommender',
    description: 'Get AI-powered training recommendations.',
    fields: [
      { name: 'employeeRole', label: 'Employee Role', type: 'resource_select', resource: 'employees', displayFn: (i) => `${i.first_name} ${i.last_name} - ${i.job_title}` },
      { name: 'department', label: 'Department', type: 'resource_select', resource: 'departments', displayFn: (i) => i.name },
      { name: 'currentCertifications', label: 'Current Certifications', type: 'textarea', placeholder: 'List current certifications...' },
      { name: 'knowledgeGaps', label: 'Knowledge Gaps', type: 'textarea', placeholder: 'Known areas for improvement...' },
    ],
    samples: [
      { label: 'New ER Nurse', data: { employeeRole: 'Emergency Room Nurse - new hire, 3 years general nursing experience', department: 'Emergency Medicine', currentCertifications: 'RN license, BLS, ACLS. No prior HIPAA-specific certification.', knowledgeGaps: 'No formal HIPAA training, unfamiliar with EHR privacy features, unclear on verbal disclosure rules in emergency settings, no breach reporting training' } },
      { label: 'IT Admin Upskill', data: { employeeRole: 'Systems Administrator managing EHR and network infrastructure', department: 'Information Technology', currentCertifications: 'CompTIA Security+, AWS Solutions Architect. Basic HIPAA awareness training completed 2023.', knowledgeGaps: 'HIPAA Security Rule technical safeguards deep dive needed, cloud security for healthcare, incident response procedures, security risk assessment methodology' } },
      { label: 'Billing Staff Refresher', data: { employeeRole: 'Medical Billing Specialist processing insurance claims daily', department: 'Billing & Coding', currentCertifications: 'CPC (Certified Professional Coder), annual HIPAA refresher completed but scored 68%.', knowledgeGaps: 'Minimum necessary standard application in billing, secure email practices for PHI transmission, handling patient billing inquiries, proper PHI disposal of printed claims' } },
    ],
    fn: 'trainingRecommendation',
  },
  'generate-audit-report': {
    title: 'Audit Report Generator',
    description: 'Generate formal HIPAA audit reports.',
    fields: [
      { name: 'auditScope', label: 'Audit Scope', placeholder: 'e.g. Comprehensive, IT Security, Privacy' },
      { name: 'auditPeriod', label: 'Audit Period', placeholder: 'e.g. Q1 2026' },
      { name: 'findings', label: 'Key Findings', type: 'textarea', placeholder: 'Enter audit findings...' },
      { name: 'department', label: 'Department/Area', type: 'resource_select', resource: 'departments', displayFn: (i) => i.name },
    ],
    samples: [
      { label: 'Annual Security Audit', data: { auditScope: 'Comprehensive HIPAA Security Rule Audit', auditPeriod: 'January - December 2025', findings: 'Finding 1: MFA not enforced on 3 legacy systems (HIGH). Finding 2: 23% of workforce missed annual security training deadline (MEDIUM). Finding 3: Patch management SLA exceeded by avg 12 days for critical patches (HIGH). Finding 4: Two workstations with ePHI had disabled screen lock (MEDIUM). Finding 5: DR test revealed 4-hour gap in backup for lab system (LOW). Finding 6: USB ports not disabled on 15 clinical workstations (MEDIUM).', department: 'Organization-wide' } },
      { label: 'Privacy Audit - ED', data: { auditScope: 'HIPAA Privacy Rule Compliance Audit', auditPeriod: 'Q3-Q4 2025', findings: 'Finding 1: Verbal PHI disclosures observed in hallways on 3 occasions (MEDIUM). Finding 2: Patient authorization forms missing for 5 of 20 sampled disclosures (HIGH). Finding 3: NPP not provided to 8% of new patients (LOW). Finding 4: Whiteboard in nursing station visible to visitors with patient names and diagnoses (HIGH). Finding 5: ED registration area lacks adequate privacy barriers (MEDIUM).', department: 'Emergency Medicine' } },
      { label: 'BAA Compliance Review', data: { auditScope: 'Business Associate Agreement Compliance Audit', auditPeriod: 'Full Year 2025', findings: 'Finding 1: 2 of 15 BAAs expired and not renewed (HIGH). Finding 2: 4 vendors have not provided annual security attestation (MEDIUM). Finding 3: One vendor (PharmTrack) failed security assessment with 3 critical findings (CRITICAL). Finding 4: No BAA in place for new janitorial service with clinical area access (HIGH). Finding 5: BAA template missing updated breach notification SLA language (MEDIUM).', department: 'Organization-wide' } },
    ],
    fn: 'generateAuditReport',
  },
  'security-assessment': {
    title: 'Security Assessment',
    description: 'AI-assisted HIPAA security assessment.',
    fields: [
      { name: 'systemDescription', label: 'System Description', type: 'textarea', placeholder: 'Describe your IT infrastructure...' },
      { name: 'networkArchitecture', label: 'Network Architecture', type: 'textarea', placeholder: 'Describe network setup...' },
      { name: 'currentMeasures', label: 'Current Security Measures', type: 'textarea', placeholder: 'List current security measures...' },
    ],
    samples: [
      { label: 'Hospital Network', data: { systemDescription: 'Community hospital with 500 beds, 3 buildings connected via fiber. MedCloud EHR (cloud-hosted), on-premise PACS, lab information system, pharmacy system. 400 workstations, 50 servers. Telehealth platform serving 200 daily sessions.', networkArchitecture: 'Segmented VLAN design: clinical network, admin network, guest WiFi, medical device network. Cisco firewalls at perimeter. VPN for remote access. DMZ for patient portal. No micro-segmentation within clinical network.', currentMeasures: 'Perimeter firewalls, IDS/IPS, endpoint antivirus (CrowdStrike), SIEM (Splunk), MFA for VPN and admin accounts, disk encryption on laptops, email encryption gateway, quarterly vulnerability scans, annual penetration test' } },
      { label: 'Cloud EHR Setup', data: { systemDescription: 'Fully cloud-based healthcare IT. AWS GovCloud for EHR (Epic), Azure for analytics platform, Google Workspace for email. 200 users across 5 clinic locations. All thin clients, no local data storage.', networkArchitecture: 'SD-WAN connecting 5 sites. Zero-trust network access (Zscaler). Direct cloud connectivity. No on-premise servers. All traffic encrypted in transit.', currentMeasures: 'Cloud-native security tools (AWS GuardDuty, Azure Sentinel), SSO with Okta, universal MFA, CASB for shadow IT detection, automated patching, DLP policies on email, SOC 2 Type II compliant infrastructure' } },
      { label: 'Small Practice IT', data: { systemDescription: 'Small orthopedic practice with 2 locations, 30 employees. Cloud EHR (Athenahealth), local file server for administrative documents, networked printer/scanner. Consumer-grade WiFi routers.', networkArchitecture: 'Flat network at both locations. ISP-provided router/firewall. No network segmentation. Staff and patient WiFi on same network. Site-to-site VPN between locations.', currentMeasures: 'Windows Defender antivirus, basic firewall rules, WPA2 WiFi password shared with staff, no MFA, nightly backup to external hard drive, screen lock after 15 minutes, no SIEM or logging solution' } },
    ],
    fn: 'securityAssessment',
  },
  'baa-review': {
    title: 'BAA Review',
    description: 'Review Business Associate Agreements for HIPAA compliance.',
    fields: [
      { name: 'associateName', label: 'Associate Name', type: 'resource_select', resource: 'baas', displayFn: (i) => `${i.associate_name} (${i.agreement_type})` },
      { name: 'agreementDetails', label: 'Agreement Details', type: 'textarea', placeholder: 'Paste BAA text or describe terms...' },
      { name: 'servicesProvided', label: 'Services Provided', type: 'textarea', placeholder: 'Describe services provided...' },
    ],
    samples: [
      { label: 'Cloud EHR Vendor', data: { associateName: 'MedCloud EHR Services', agreementDetails: 'Standard BAA with cloud hosting provisions. Includes data processing addendum, SLA of 99.9% uptime, 72-hour breach notification to covered entity, annual SOC 2 report provision, data deletion within 30 days of termination.', servicesProvided: 'Cloud-hosted EHR platform, data backup and disaster recovery, technical support, system updates and patches, API integrations with lab and pharmacy systems' } },
      { label: 'Billing Service', data: { associateName: 'BillRight Medical Billing', agreementDetails: 'BAA for medical billing outsourcing. Covers claims processing, payment posting, denial management. Includes workforce training requirements, subcontractor flow-down provisions, and indemnification clause.', servicesProvided: 'Full revenue cycle management including claims submission, payment processing, patient billing, collections, insurance verification, coding review' } },
      { label: 'IT Managed Services', data: { associateName: 'DataGuard Backup Solutions', agreementDetails: 'BAA covering managed backup and disaster recovery. Data stored in two geographically separate data centers. AES-256 encryption at rest and in transit. 4-hour RPO, 8-hour RTO. Annual DR test included.', servicesProvided: 'Offsite backup management, disaster recovery planning and testing, data restoration services, backup monitoring and alerting, encryption key management' } },
    ],
    fn: 'baaReview',
  },
  'analyze-employee': {
    title: 'Employee Training Analysis',
    description: 'Analyze an employee\'s training profile and get personalized recommendations.',
    fields: [
      { name: 'employeeName', label: 'Employee', type: 'resource_select', resource: 'employees', displayFn: (i) => `${i.first_name} ${i.last_name} - ${i.job_title}` },
      { name: 'jobTitle', label: 'Job Title', placeholder: 'e.g. Registered Nurse' },
      { name: 'department', label: 'Department', type: 'resource_select', resource: 'departments', displayFn: (i) => i.name },
      { name: 'trainingStatus', label: 'Training Status', type: 'select', options: ['completed', 'in_progress', 'pending', 'not_started'] },
      { name: 'certifications', label: 'Current Certifications', type: 'textarea', placeholder: 'List current certifications...' },
    ],
    samples: [
      { label: 'New Hire - No Training', data: { employeeName: 'Christine Clark - Triage Nurse', jobTitle: 'Triage Nurse', department: 'Emergency Medicine', trainingStatus: 'pending', certifications: 'RN license, BLS certification. No HIPAA-specific training completed yet. Start date: 2 weeks ago.' } },
      { label: 'Certified Employee', data: { employeeName: 'Emily Johnson - Registered Nurse', jobTitle: 'Registered Nurse', department: 'Cardiology', trainingStatus: 'completed', certifications: 'HIPAA Privacy certification (2024), HIPAA Security awareness (2024), PHI Handling course (score: 92%), Annual refresher completed. Certification expires March 2025.' } },
      { label: 'Behind on Training', data: { employeeName: 'Megan Davis - Neurologist', jobTitle: 'Neurologist', department: 'Neurology', trainingStatus: 'pending', certifications: 'MD board certified Neurology. No HIPAA training completed since hire date (April 2022). Two training reminders sent, no response. EHR access currently read-only pending training completion.' } },
    ],
    fn: 'analyzeEmployee',
  },
  'analyze-department': {
    title: 'Department Compliance Analysis',
    description: 'Analyze a department\'s HIPAA compliance posture.',
    fields: [
      { name: 'departmentName', label: 'Department', type: 'resource_select', resource: 'departments', displayFn: (i) => `${i.name} (Score: ${i.compliance_score}, Risk: ${i.risk_level})` },
      { name: 'headName', label: 'Department Head', placeholder: 'e.g. Dr. James Okafor' },
      { name: 'employeeCount', label: 'Employee Count', type: 'number', placeholder: '50' },
      { name: 'complianceScore', label: 'Compliance Score', type: 'number', placeholder: '85' },
      { name: 'riskLevel', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    ],
    samples: [
      { label: 'High-Risk Emergency', data: { departmentName: 'Emergency Medicine', headName: 'Dr. James Okafor', employeeCount: '65', complianceScore: '76.2', riskLevel: 'high' } },
      { label: 'Strong IT Dept', data: { departmentName: 'Information Technology', headName: 'Mr. Kevin Nguyen', employeeCount: '24', complianceScore: '82.3', riskLevel: 'medium' } },
      { label: 'Top Performer MedRec', data: { departmentName: 'Medical Records', headName: 'Ms. Patricia Evans', employeeCount: '18', complianceScore: '96.8', riskLevel: 'low' } },
    ],
    fn: 'analyzeDepartment',
  },
  'generate-course-content': {
    title: 'Course Content Generator',
    description: 'Generate complete HIPAA training course content.',
    fields: [
      { name: 'courseTitle', label: 'Course Title', type: 'resource_select', resource: 'courses', displayFn: (i) => i.title },
      { name: 'category', label: 'Category', type: 'select', options: ['Privacy', 'Security', 'Compliance', 'Breach Notification'] },
      { name: 'targetAudience', label: 'Target Audience', placeholder: 'e.g. Clinical staff, IT department' },
      { name: 'duration', label: 'Duration', placeholder: 'e.g. 2 hours' },
    ],
    samples: [
      { label: 'PHI Handling Course', data: { courseTitle: 'PHI Handling and Protection', category: 'Privacy', targetAudience: 'All clinical staff including nurses, physicians, and medical assistants who handle patient information daily', duration: '1.5 hours' } },
      { label: 'Security Awareness', data: { courseTitle: 'Security Awareness Training', category: 'Security', targetAudience: 'All workforce members including non-clinical staff, contractors, and volunteers with system access', duration: '2 hours' } },
      { label: 'Mobile Device Security', data: { courseTitle: 'Mobile Device Security', category: 'Security', targetAudience: 'Staff who use mobile devices for work purposes: physicians on rounds, home health nurses, telehealth providers', duration: '1.5 hours' } },
    ],
    fn: 'generateCourseContent',
  },
  'analyze-training-records': {
    title: 'Training Record Analysis',
    description: 'Analyze training records for performance insights.',
    fields: [
      { name: 'employeeName', label: 'Employee', type: 'resource_select', resource: 'employees', displayFn: (i) => `${i.first_name} ${i.last_name}` },
      { name: 'courseName', label: 'Course', type: 'resource_select', resource: 'courses', displayFn: (i) => i.title },
      { name: 'status', label: 'Status', type: 'select', options: ['completed', 'in_progress', 'not_started', 'failed'] },
      { name: 'score', label: 'Score', type: 'number', placeholder: '85' },
      { name: 'completionDate', label: 'Completion Date', type: 'date' },
    ],
    samples: [
      { label: 'High Score Privacy', data: { employeeName: 'Emily Johnson', courseName: 'HIPAA Privacy Rule Fundamentals', status: 'completed', score: '92', completionDate: '2024-01-10' } },
      { label: 'Failed Security Quiz', data: { employeeName: 'Amanda Lee', courseName: 'HIPAA Security Rule Essentials', status: 'completed', score: '62', completionDate: '2024-11-15' } },
      { label: 'Overdue Training', data: { employeeName: 'Megan Davis', courseName: 'Annual HIPAA Refresher', status: 'not_started', score: '', completionDate: '' } },
    ],
    fn: 'analyzeTrainingRecords',
  },
  'generate-assessment': {
    title: 'Assessment Framework Builder',
    description: 'Generate compliance assessment checklists and templates.',
    fields: [
      { name: 'departmentName', label: 'Department', type: 'resource_select', resource: 'departments', displayFn: (i) => i.name },
      { name: 'assessmentType', label: 'Assessment Type', type: 'select', options: ['Comprehensive HIPAA Audit', 'Privacy Rule Assessment', 'Security Rule Assessment', 'Breach Readiness', 'Physical Security'] },
      { name: 'focusAreas', label: 'Focus Areas', type: 'textarea', placeholder: 'Specific areas to focus on...' },
      { name: 'previousScore', label: 'Previous Score', type: 'number', placeholder: '80' },
    ],
    samples: [
      { label: 'Full Audit - ICU', data: { departmentName: 'ICU', assessmentType: 'Comprehensive HIPAA Audit', focusAreas: 'Patient monitoring data privacy, visitor access controls, shared workstation security, verbal orders documentation, end-of-life care information handling', previousScore: '79.6' } },
      { label: 'Security - Pharmacy', data: { departmentName: 'Pharmacy', assessmentType: 'Security Rule Assessment', focusAreas: 'Controlled substance system access, ePHI transmission security, automated dispensing cabinet logs, pharmacy network segmentation', previousScore: '91.3' } },
      { label: 'Breach Readiness', data: { departmentName: 'Information Technology', assessmentType: 'Breach Readiness', focusAreas: 'Incident detection capabilities, response team readiness, notification procedure testing, forensic investigation preparedness, communication templates', previousScore: '82.3' } },
    ],
    fn: 'generateAssessment',
  },
  'review-document': {
    title: 'Document Review',
    description: 'AI review of compliance documents.',
    fields: [
      { name: 'documentTitle', label: 'Document', type: 'resource_select', resource: 'documents', displayFn: (i) => `${i.title} (v${i.version})` },
      { name: 'category', label: 'Category', type: 'select', options: ['Policy', 'Procedure', 'Form', 'Template', 'Report', 'Training Material'] },
      { name: 'documentType', label: 'File Type', placeholder: 'e.g. PDF, DOCX' },
      { name: 'content', label: 'Content/Description', type: 'textarea', placeholder: 'Paste document content or describe...' },
    ],
    samples: [
      { label: 'Privacy Notice Review', data: { documentTitle: 'HIPAA Privacy Notice (NPP) v5.1', category: 'Policy', documentType: 'PDF', content: 'Notice of Privacy Practices for our hospital. Covers: uses and disclosures of PHI for treatment, payment, and healthcare operations; patient rights including access, amendment, restriction requests, confidential communications, and accounting of disclosures; our duties regarding PHI; complaint procedures. Last updated January 2024.' } },
      { label: 'Breach Letter Template', data: { documentTitle: 'Breach Notification Letter Template v3.0', category: 'Template', documentType: 'DOCX', content: 'Template letter for notifying affected individuals of a PHI breach per HIPAA Breach Notification Rule. Includes: description of breach, types of information involved, steps taken, steps individuals can take, contact information for questions. Placeholder fields for specific breach details, dates, and affected data types.' } },
      { label: 'IR Playbook Review', data: { documentTitle: 'Incident Response Playbook v3.5', category: 'Procedure', documentType: 'PDF', content: 'Step-by-step incident response playbook covering: initial detection and triage, containment procedures, evidence preservation, investigation steps, breach determination criteria, notification decision tree, remediation planning, post-incident review process. Includes role assignments, escalation procedures, and communication templates.' } },
    ],
    fn: 'reviewDocument',
  },
  'analyze-phi-risk': {
    title: 'PHI Risk Assessment',
    description: 'Assess risk for specific PHI data stores.',
    fields: [
      { name: 'dataType', label: 'PHI Record', type: 'resource_select', resource: 'phi-inventory', displayFn: (i) => `${i.data_type} - ${i.system_name}` },
      { name: 'storageLocation', label: 'Storage Location', placeholder: 'e.g. Cloud AWS, On-Premise' },
      { name: 'systemName', label: 'System Name', placeholder: 'e.g. MedCloud EHR' },
      { name: 'encryptionStatus', label: 'Encryption', type: 'select', options: ['encrypted', 'partial', 'not_encrypted'] },
      { name: 'accessLevel', label: 'Access Level', type: 'select', options: ['public', 'role_based', 'restricted', 'admin_only'] },
    ],
    samples: [
      { label: 'Unencrypted Pharmacy', data: { dataType: 'Pharmacy Records', storageLocation: 'On-Premise + Cloud Sync', systemName: 'PharmTrack RxSystem', encryptionStatus: 'partial', accessLevel: 'role_based' } },
      { label: 'Email PHI Exposure', data: { dataType: 'Email Communications with PHI', storageLocation: 'On-Premise Exchange Server', systemName: 'Microsoft Exchange', encryptionStatus: 'partial', accessLevel: 'role_based' } },
      { label: 'Paper Records Archive', data: { dataType: 'Paper Medical Records (Archive)', storageLocation: 'Physical - Records Room B2', systemName: 'N/A (Physical)', encryptionStatus: 'not_encrypted', accessLevel: 'restricted' } },
    ],
    fn: 'analyzePhiRisk',
  },
  'review-access-control': {
    title: 'Access Control Review',
    description: 'Review user access permissions for compliance.',
    fields: [
      { name: 'employeeName', label: 'Access Record', type: 'resource_select', resource: 'access-control', displayFn: (i) => `${i.employee_name} → ${i.system_name} (${i.access_level})` },
      { name: 'systemName', label: 'System Name', placeholder: 'e.g. MedCloud EHR' },
      { name: 'accessLevel', label: 'Access Level', type: 'select', options: ['read_only', 'read_write', 'admin', 'full_admin'] },
      { name: 'phiAccess', label: 'PHI Access', type: 'select', options: ['true', 'false'] },
      { name: 'justification', label: 'Justification', type: 'textarea', placeholder: 'Why is this access needed...' },
    ],
    samples: [
      { label: 'Admin EHR Access', data: { employeeName: 'Rachel Jackson', systemName: 'MedCloud EHR', accessLevel: 'admin', phiAccess: 'true', justification: 'Systems administrator requires admin access for system maintenance, user management, and configuration changes. Has access to all patient records through admin console.' } },
      { label: 'Read-Only Pending', data: { employeeName: 'Megan Davis', systemName: 'MedCloud EHR', accessLevel: 'read_only', phiAccess: 'true', justification: 'Neurologist granted read-only access pending HIPAA training completion. Full read-write access will be granted after training is verified.' } },
      { label: 'Revoked Access', data: { employeeName: 'Christine Clark', systemName: 'MedCloud EHR', accessLevel: 'read_write', phiAccess: 'true', justification: 'Access revoked due to termination following repeat privacy violations (social media PHI disclosure). Review whether access was properly terminated across all systems.' } },
    ],
    fn: 'reviewAccessControl',
  },
  'recommend-sanction': {
    title: 'Sanction Advisor',
    description: 'Get AI recommendation for appropriate sanctions.',
    fields: [
      { name: 'violationType', label: 'Violation Type', placeholder: 'e.g. Unauthorized PHI Disclosure' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the violation...' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['minor', 'moderate', 'major', 'severe'] },
      { name: 'employeeHistory', label: 'Employee History', type: 'textarea', placeholder: 'Prior violations, tenure, etc...' },
    ],
    samples: [
      { label: 'Social Media Post', data: { violationType: 'Unauthorized PHI Disclosure via Social Media', description: 'An ER nurse posted on Instagram about treating a celebrity patient, including details about the reason for visit and treatment provided. Post was public and received 2,000 views before being reported and removed. Screenshot captured by media outlet.', severity: 'major', employeeHistory: 'Employee hired 14 months ago. Completed HIPAA training with passing score. One prior verbal warning for discussing patient information in public hallway 6 months ago.' } },
      { label: 'Snooping - First Time', data: { violationType: 'Unauthorized PHI Access (Snooping)', description: 'Medical records specialist accessed the chart of their neighbor who was recently admitted. No treatment relationship exists. Two separate access events detected in audit log review. No evidence that information was shared.', severity: 'moderate', employeeHistory: 'Employee of 4 years with clean record. Excellent performance reviews. No prior compliance issues. Recently completed HIPAA refresher training with 98% score.' } },
      { label: 'Repeat Password Sharing', data: { violationType: 'Security Policy Violation - Credential Sharing', description: 'IT audit discovered a physician has been sharing their EHR login credentials with their medical assistant to "save time" during busy clinic hours. This is the second time this physician has been found sharing credentials after a written warning 8 months ago.', severity: 'major', employeeHistory: 'Senior physician, 12 years tenure. Written warning 8 months ago for same violation. Completed remedial security training after first incident. Department generates highest revenue.' } },
    ],
    fn: 'recommendSanction',
  },
  'prioritize-deadlines': {
    title: 'Deadline Prioritizer',
    description: 'AI analysis of compliance deadlines.',
    fields: [
      { name: 'deadlines', label: 'Deadlines', type: 'textarea', placeholder: 'List your upcoming deadlines...' },
      { name: 'organizationContext', label: 'Organization Context', type: 'textarea', placeholder: 'Team size, current workload...' },
    ],
    samples: [
      { label: 'Q1 Compliance Rush', data: { deadlines: '1. Breach notification to HHS for vendor data breach - Due: Oct 4 (OVERDUE)\n2. Annual policy review cycle - Due: Dec 31 (10 of 16 done)\n3. Annual HIPAA training for all staff - Due: Dec 31 (78% complete)\n4. Disaster recovery test - Due: Nov 15 (OVERDUE, postponed)\n5. OCR compliance checklist update - Due: Jan 31\n6. Mobile device policy update - Due: Feb 28\n7. Sanctions review - Due: Jan 15\n8. Board compliance report - Due: Mar 31', organizationContext: 'Compliance team of 3 people (CCO, compliance analyst, part-time coordinator). IT team of 6. Year-end budget constraints. Two team members on holiday Dec 20-Jan 5. CEO requested board report be moved up to March.' } },
      { label: 'Post-Breach Priorities', data: { deadlines: '1. Complete breach investigation - immediate\n2. Notify affected individuals (1,200) - 60-day deadline from discovery\n3. Submit HHS breach report - within 60 days\n4. Remediate vendor security findings - 30 days per SLA\n5. Update incident response plan - within 90 days\n6. Conduct workforce re-training - within 30 days\n7. Review all vendor BAAs - within 60 days\n8. Board notification of breach - next board meeting (2 weeks)', organizationContext: 'Major vendor data breach discovered 10 days ago. Breach response team activated (5 members). Legal counsel engaged. External forensics firm hired. Normal compliance work paused. PR team managing media inquiries.' } },
      { label: 'New Compliance Program', data: { deadlines: '1. Appoint Privacy Officer - immediate\n2. Conduct initial risk assessment - 60 days\n3. Develop all required policies (16) - 90 days\n4. Implement HIPAA training program - 90 days\n5. Execute BAAs with all 8 vendors - 60 days\n6. Set up audit logging - 45 days\n7. Implement access controls - 60 days\n8. Create incident response plan - 45 days\n9. Deploy encryption on all ePHI systems - 90 days\n10. First compliance assessment - 120 days', organizationContext: 'New healthcare startup that just received first patients. 50 employees, growing fast. No formal HIPAA compliance program exists yet. Recently hired a compliance consultant. Budget approved for compliance tooling. Board wants clean audit within 6 months.' } },
    ],
    fn: 'prioritizeDeadlines',
  },
  'analyze-audit-logs': {
    title: 'Audit Log Analysis',
    description: 'Detect anomalies in audit logs.',
    fields: [
      { name: 'logSummary', label: 'Log Summary', type: 'textarea', placeholder: 'Describe audit log activity...' },
      { name: 'timeframe', label: 'Timeframe', placeholder: 'e.g. Last 30 days' },
      { name: 'concernAreas', label: 'Concern Areas', type: 'textarea', placeholder: 'Specific concerns or patterns...' },
    ],
    samples: [
      { label: 'After-Hours Access', data: { logSummary: 'Audit log review for past month shows: 147 after-hours access events (10pm-6am), 23 unique users accessing records outside business hours, 3 users accessed 50+ records in single sessions, 1 user accessed records from an IP address not in our known range, 5 failed login attempts from external IPs targeting admin accounts, 2 bulk export events from the billing system.', timeframe: 'Last 30 days (March 2026)', concernAreas: 'After-hours access patterns, bulk data exports, unknown IP addresses, potential credential stuffing on admin accounts' } },
      { label: 'VIP Patient Monitoring', data: { logSummary: 'Following admission of a public figure, audit logs show: 34 unique users accessed this patient record in 48 hours, normal for this diagnosis is 8-12 users, 15 of the accessing users are not in the care team, access came from 4 different departments including billing (expected) and medical records (expected) but also radiology and pharmacy (patient had no radiology or pharmacy orders), 3 accesses occurred from the cafeteria WiFi network.', timeframe: 'Last 48 hours', concernAreas: 'Unauthorized VIP record access (snooping), access from non-care-team members, access from unusual network locations' } },
      { label: 'System Anomaly Detection', data: { logSummary: 'Automated monitoring flagged: 2,400% increase in database queries from the analytics service account, 3 new admin accounts created outside of change management process, audit logging was disabled on the pharmacy system for 4 hours during "maintenance", 500GB of data transferred to a new cloud storage endpoint, SSL certificate on patient portal expired and was not renewed for 12 hours.', timeframe: 'Last 7 days', concernAreas: 'Potential data exfiltration, unauthorized admin account creation, audit log tampering, certificate management failure' } },
    ],
    fn: 'analyzeAuditLogs',
  },
  'monitor-baa': {
    title: 'BAA Compliance Monitor',
    description: 'Monitor ongoing BAA compliance.',
    fields: [
      { name: 'associateName', label: 'Associate', type: 'resource_select', resource: 'baas', displayFn: (i) => `${i.associate_name} - ${i.compliance_status}` },
      { name: 'agreementType', label: 'Agreement Type', placeholder: 'e.g. Cloud Services, Billing' },
      { name: 'servicesProvided', label: 'Services', type: 'textarea', placeholder: 'Describe services...' },
      { name: 'complianceStatus', label: 'Status', type: 'select', options: ['compliant', 'non_compliant', 'under_review'] },
      { name: 'expirationDate', label: 'Expiration Date', type: 'date' },
    ],
    samples: [
      { label: 'Non-Compliant Vendor', data: { associateName: 'PharmTrack Systems', agreementType: 'Pharmacy Technology', servicesProvided: 'Pharmacy management system handling prescription data, patient medication histories, drug interaction checks. Interfaces with EHR and insurance systems.', complianceStatus: 'non_compliant', expirationDate: '2024-10-31' } },
      { label: 'Expiring BAA', data: { associateName: 'LabConnect Diagnostics', agreementType: 'Laboratory Services', servicesProvided: 'Lab results integration, specimen tracking, reference lab ordering, critical value alerting. Processes approximately 500 lab orders daily.', complianceStatus: 'compliant', expirationDate: '2024-08-31' } },
      { label: 'New Telehealth Vendor', data: { associateName: 'TeleMed Connect', agreementType: 'Telehealth Platform', servicesProvided: 'Video consultation platform, secure messaging, virtual waiting room, e-prescribing integration, session recording for quality assurance. Handles 200 daily telehealth sessions.', complianceStatus: 'compliant', expirationDate: '2025-03-14' } },
    ],
    fn: 'monitorBaa',
  },
  'investigate-incident': {
    title: 'Incident Investigation',
    description: 'AI-guided investigation framework for incidents.',
    fields: [
      { name: 'incidentTitle', label: 'Incident', type: 'resource_select', resource: 'incidents', displayFn: (i) => `${i.title} (${i.severity})` },
      { name: 'incidentType', label: 'Type', placeholder: 'e.g. Data breach, unauthorized access' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the incident...' },
      { name: 'affectedIndividuals', label: 'Affected Count', type: 'number', placeholder: '0' },
    ],
    samples: [
      { label: 'Vendor Data Breach', data: { incidentTitle: 'Third-Party Vendor Data Exposure', incidentType: 'Business Associate Breach', severity: 'critical', description: 'Our billing software vendor (BillRight) reported a data breach affecting their systems. Attacker exploited an unpatched vulnerability to access their database containing our patient billing records. Vendor notified us 5 days after discovery. Investigation ongoing to determine exact scope of exposure.', affectedIndividuals: '1200' } },
      { label: 'Lost Encrypted Laptop', data: { incidentTitle: 'Lost Laptop with ePHI', incidentType: 'Lost/Stolen Device', severity: 'high', description: 'A physician left their hospital-issued laptop in a taxi. Laptop had full disk encryption enabled and was MDM enrolled. Last MDM check-in was 6 hours ago. Laptop contained cached patient appointment data and medical notes for approximately 245 patients. Remote wipe command sent but not confirmed.', affectedIndividuals: '245' } },
      { label: 'Misdirected PHI Fax', data: { incidentTitle: 'Misdirected Fax Containing PHI', incidentType: 'Improper Disclosure', severity: 'medium', description: 'An ER nurse faxed patient discharge summaries for 3 patients to a wrong number. The recipient was an attorney\'s office who called to report receiving the documents. Fax contained patient names, diagnoses, medications, and treating physician information.', affectedIndividuals: '3' } },
    ],
    fn: 'investigateIncident',
  },
  'plan-risk-mitigation': {
    title: 'Risk Mitigation Planner',
    description: 'Create detailed risk mitigation strategies.',
    fields: [
      { name: 'riskTitle', label: 'Risk', type: 'resource_select', resource: 'risk-register', displayFn: (i) => `${i.title} (${i.risk_level})` },
      { name: 'riskLevel', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'category', label: 'Category', placeholder: 'e.g. Cybersecurity, Compliance' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the risk...' },
      { name: 'currentControls', label: 'Current Controls', type: 'textarea', placeholder: 'Existing controls...' },
    ],
    samples: [
      { label: 'Ransomware Mitigation', data: { riskTitle: 'Ransomware Attack on EHR System', riskLevel: 'critical', category: 'Cybersecurity', description: 'Our EHR system is the primary target for ransomware. A successful attack would disrupt patient care across all departments, potentially affecting 50,000 patient records. Recent industry reports show 67% increase in healthcare ransomware attacks.', currentControls: 'Endpoint antivirus (signature-based), daily backups to cloud (same provider as EHR), annual security training, basic email filtering, MFA on admin accounts only' } },
      { label: 'Insider Threat Program', data: { riskTitle: 'Insider Threat - Unauthorized PHI Access', riskLevel: 'high', category: 'Insider Threat', description: 'Multiple snooping incidents detected in past year. Current audit log review is annual and manual, making real-time detection impossible. 3 sanctions issued for unauthorized access in past 12 months.', currentControls: 'Annual audit log review, role-based access controls, HIPAA training with snooping awareness module, sanctions policy in place' } },
      { label: 'Legacy System Upgrade', data: { riskTitle: 'Legacy System Vulnerabilities', riskLevel: 'high', category: 'IT Infrastructure', description: 'Three clinical systems running on Windows Server 2012 R2 (end of life). Systems process ePHI but cannot be patched. Vendor no longer provides security updates. Systems are network-connected with limited segmentation.', currentControls: 'Firewall rules limiting access to legacy systems, antivirus (limited effectiveness on unpatched OS), manual monitoring of access logs, segregated VLAN (but not fully isolated)' } },
    ],
    fn: 'planRiskMitigation',
  },
  'validate-policy': {
    title: 'Policy Validator',
    description: 'Validate policies against HIPAA requirements.',
    fields: [
      { name: 'policyTitle', label: 'Policy', type: 'resource_select', resource: 'policies', displayFn: (i) => `${i.title} (v${i.version}, ${i.status})` },
      { name: 'category', label: 'Category', type: 'select', options: ['Privacy', 'Security', 'Compliance', 'Enforcement'] },
      { name: 'version', label: 'Version', placeholder: 'e.g. 3.2' },
      { name: 'content', label: 'Policy Summary', type: 'textarea', placeholder: 'Paste or summarize the policy...' },
    ],
    samples: [
      { label: 'Privacy Policy v3.2', data: { policyTitle: 'HIPAA Privacy Policy v3.2', category: 'Privacy', version: '3.2', content: 'Governs use and disclosure of PHI. Covers: permitted uses for TPO, minimum necessary standard, patient authorizations, de-identification standards, personal representatives, marketing restrictions. Effective Jan 2024, approved by CCO. Does not yet address reproductive health information final rule or information blocking provisions.' } },
      { label: 'Access Control v4.0', data: { policyTitle: 'Access Control Policy v4.0', category: 'Security', version: '4.0', content: 'Controls access to ePHI systems. Covers: role-based access, unique user identification, automatic logoff (15 min), emergency access procedure, MFA requirements (admin accounts only currently), access review schedule (annual), termination procedures. Does not address privileged access management or service account controls.' } },
      { label: 'Training Policy Draft', data: { policyTitle: 'HIPAA Training Policy v2.1 (DRAFT)', category: 'Compliance', version: '2.1', content: 'Requirements for HIPAA workforce training. Covers: new hire training within 30 days, annual refresher, role-specific training modules, passing score requirements (80%), sanctions for non-completion, training record retention. Draft status - pending approval. New additions: security awareness module, phishing simulation requirement, department-specific training tracks.' } },
    ],
    fn: 'validatePolicy',
  },

  // ── DB-context refactored tools (audit gap #1) ───────────────────────────
  'analyze-employee-deep': {
    title: 'Employee Deep Analysis (DB-backed)',
    description: 'Full DB-context HIPAA analysis using employee training records, sanctions, access permissions.',
    fields: [
      { name: 'employeeId', label: 'Employee', type: 'resource_select', resource: 'employees', displayFn: (i) => `${i.first_name} ${i.last_name} (${i.job_title})`, valueKey: 'id' },
    ],
    samples: [
      { label: 'Pull employee #1', data: { employeeId: 1 } },
      { label: 'Pull employee #2', data: { employeeId: 2 } },
    ],
    fn: 'analyzeEmployeeDeep',
  },
  'analyze-department-deep': {
    title: 'Department Deep Analysis (DB-backed)',
    description: 'Live department compliance analysis using actual employee/training counts and risk register.',
    fields: [
      { name: 'departmentId', label: 'Department', type: 'resource_select', resource: 'departments', displayFn: (i) => i.name, valueKey: 'id' },
    ],
    samples: [
      { label: 'Pull department #1', data: { departmentId: 1 } },
    ],
    fn: 'analyzeDepartmentDeep',
  },
  // ── Feature #2: Auto-enroll training ─────────────────────────────────────
  'auto-enroll-training': {
    title: 'AI Training Auto-Enroller',
    description: 'AI selects appropriate courses for an employee based on role + previous completions, then creates draft training records.',
    fields: [
      { name: 'employeeId', label: 'Employee', type: 'resource_select', resource: 'employees', displayFn: (i) => `${i.first_name} ${i.last_name} (${i.job_title})`, valueKey: 'id' },
      { name: 'dryRun', label: 'Dry Run (preview only)', type: 'select', options: ['true', 'false'] },
    ],
    samples: [
      { label: 'Preview for Employee #1', data: { employeeId: 1, dryRun: 'true' } },
      { label: 'Create for Employee #2', data: { employeeId: 2, dryRun: 'false' } },
    ],
    fn: 'autoEnrollTraining',
  },
  // ── Feature #3: Access anomaly detector ──────────────────────────────────
  'detect-access-anomalies': {
    title: 'PHI Access Anomaly Detector',
    description: 'AI scans recent audit logs for suspicious patterns. Optionally auto-creates an incident report.',
    fields: [
      { name: 'hours', label: 'Hours to Analyze', type: 'number', placeholder: '24' },
      { name: 'autoCreateIncident', label: 'Auto-create incident if anomaly?', type: 'select', options: ['false', 'true'] },
    ],
    samples: [
      { label: 'Last 24 hours', data: { hours: 24, autoCreateIncident: 'false' } },
      { label: 'Last 7 days w/ auto-incident', data: { hours: 168, autoCreateIncident: 'true' } },
    ],
    fn: 'detectAccessAnomalies',
  },
  // ── Feature #4: BAA renewal drafter ──────────────────────────────────────
  'draft-baa-renewal': {
    title: 'BAA Renewal Drafter',
    description: 'AI drafts a complete renewal BAA with all required §164.504(e) clauses.',
    fields: [
      { name: 'baaId', label: 'BAA', type: 'resource_select', resource: 'baas', displayFn: (i) => `${i.associate_name || i.name} (expires ${i.expiration_date})`, valueKey: 'id' },
    ],
    samples: [
      { label: 'Renew BAA #1', data: { baaId: 1 } },
    ],
    fn: 'draftBaaRenewal',
  },
  // ── Feature #5: Quiz remediation ─────────────────────────────────────────
  'generate-remediation': {
    title: 'AI Remediation Micro-Course',
    description: 'Builds a personalized micro-course from an employee\'s quiz mistakes.',
    fields: [
      { name: 'employeeId', label: 'Employee', type: 'resource_select', resource: 'employees', displayFn: (i) => `${i.first_name} ${i.last_name}`, valueKey: 'id' },
      { name: 'courseId', label: 'Course (optional)', type: 'resource_select', resource: 'courses', displayFn: (i) => i.title, valueKey: 'id' },
    ],
    samples: [
      { label: 'Remediation for #1', data: { employeeId: 1 } },
    ],
    fn: 'generateRemediation',
  },
  'vendor-security-assessment': {
    title: 'Vendor Security Assessment',
    description: 'Third-party / Business Associate security assessment with HIPAA-aligned scoring rubric.',
    fields: [
      { name: 'vendor_name', label: 'Vendor Name', placeholder: 'e.g. CloudHealth Analytics Inc.' },
      { name: 'services_provided', label: 'Services Provided', type: 'textarea', placeholder: 'Describe the services this vendor provides...' },
      { name: 'data_types', label: 'Data Types Accessed', placeholder: 'e.g. PHI, billing records, claims data' },
      { name: 'integration_method', label: 'Integration Method', placeholder: 'e.g. API, SFTP, manual upload' },
      { name: 'security_documentation', label: 'Security Documentation Provided', type: 'textarea', placeholder: 'List SOC 2 reports, HITRUST cert, ISO 27001, pen test results, etc.' },
    ],
    samples: [
      { label: 'Cloud EHR Vendor', data: { vendor_name: 'MedCloud EHR Provider', services_provided: 'Cloud-hosted electronic health records for 50,000 patients', data_types: 'Full PHI, medical records, lab results, prescriptions, billing', integration_method: 'HTTPS REST API + nightly SFTP exports', security_documentation: 'SOC 2 Type II (current), HITRUST CSF Certified, annual third-party pen test, BAA in place since 2022' } },
      { label: 'Marketing SaaS', data: { vendor_name: 'PatientReach Marketing', services_provided: 'Patient outreach email and SMS campaigns', data_types: 'Patient names, contact info, appointment dates', integration_method: 'API + CSV upload', security_documentation: 'SOC 2 Type I only, no HITRUST, no pen test, no BAA yet' } },
    ],
    fn: 'vendorSecurityAssessment',
  },
  'breach-simulation': {
    title: 'Breach Tabletop Simulation',
    description: 'Generate a tabletop breach exercise with injects, decision points, scoring rubric, and post-exercise actions.',
    fields: [
      { name: 'scenario_type', label: 'Scenario Type', placeholder: 'e.g. ransomware, phishing breach, insider data theft' },
      { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', placeholder: '60' },
      { name: 'participant_roles', label: 'Participant Roles', type: 'textarea', placeholder: 'List roles, e.g. CISO, Privacy Officer, Legal Counsel, IT Director, Communications Lead' },
      { name: 'organization_context', label: 'Organization Context', type: 'textarea', placeholder: 'Describe org size, systems, current incident response posture' },
    ],
    samples: [
      { label: 'Ransomware - Hospital', data: { scenario_type: 'Ransomware encrypting EHR and PACS', duration_minutes: 90, participant_roles: 'CISO, Privacy Officer, CIO, Chief Medical Officer, General Counsel, Communications Director', organization_context: '500-bed hospital, MedCloud EHR, 2000 employees, prior incident in 2023, IR plan last tested 18 months ago' } },
      { label: 'Insider Threat', data: { scenario_type: 'Insider unauthorized access to celebrity patient records', duration_minutes: 60, participant_roles: 'Privacy Officer, HR Director, Legal Counsel, Department Manager', organization_context: 'Large clinic network, audit logging in place, recent media interest in a high-profile patient' } },
    ],
    fn: 'breachSimulation',
  },
  'policy-gap-analysis': {
    title: 'Policy Gap Analysis (Pass 5)',
    description: 'Compare a pasted policy document against HIPAA Privacy/Security/Breach Notification rules and produce a redline-style gap report.',
    fields: [
      { name: 'policyTitle', label: 'Policy Title', placeholder: 'e.g. Mobile Device Use Policy' },
      { name: 'hipaaScope', label: 'HIPAA Scope (optional)', placeholder: 'Privacy + Security + Breach Notification' },
      { name: 'policyText', label: 'Policy Text', type: 'textarea', placeholder: 'Paste the full policy document here...' },
    ],
    samples: [],
    fn: 'policyGapAnalysis',
  },
  'adaptive-training-path': {
    title: 'Adaptive Training Path (Pass 5)',
    description: 'Generate a role/risk-aware adaptive training path with module sequencing.',
    fields: [
      { name: 'employeeId', label: 'Employee ID (optional)', type: 'number', placeholder: 'leave blank for free-form' },
      { name: 'role', label: 'Role', placeholder: 'e.g. Nurse, IT Admin, Front Desk' },
      { name: 'department', label: 'Department', placeholder: 'e.g. Cardiology' },
      { name: 'riskProfile', label: 'Risk Profile', placeholder: 'standard | elevated | high' },
      { name: 'recentQuizScores', label: 'Recent Quiz Scores', type: 'textarea', placeholder: 'e.g. Privacy Rule: 72%, Security Rule: 88%' },
      { name: 'knowledgeGaps', label: 'Known Knowledge Gaps', type: 'textarea', placeholder: 'e.g. minimum-necessary standard, mobile device policy' },
    ],
    samples: [],
    fn: 'adaptiveTrainingPath',
  },
  'continuous-compliance-narrative': {
    title: 'Continuous Compliance Narrative (Pass 5)',
    description: 'Synthesize the org\'s recent state into a compliance-program narrative report.',
    fields: [
      { name: 'window_days', label: 'Window (days)', type: 'number', placeholder: '30' },
    ],
    samples: [],
    fn: 'continuousComplianceNarrative',
  },
};

export default AI_CONFIG;
