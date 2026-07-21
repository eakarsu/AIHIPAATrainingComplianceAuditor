import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Destructive demo seed refused. Set ALLOW_DEMO_SEED=true outside production.');
  }
  const client = await pool.connect();
  try {
    console.log('Connected to database. Starting seed...');

    // Drop all tables
    await client.query(`
      DROP TABLE IF EXISTS access_control CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS sanctions CASCADE;
      DROP TABLE IF EXISTS compliance_deadlines CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS risk_register CASCADE;
      DROP TABLE IF EXISTS phi_inventory CASCADE;
      DROP TABLE IF EXISTS business_associate_agreements CASCADE;
      DROP TABLE IF EXISTS incident_reports CASCADE;
      DROP TABLE IF EXISTS policies CASCADE;
      DROP TABLE IF EXISTS compliance_assessments CASCADE;
      DROP TABLE IF EXISTS training_records CASCADE;
      DROP TABLE IF EXISTS training_courses CASCADE;
      DROP TABLE IF EXISTS employees CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Dropped all existing tables.');

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR UNIQUE,
        password_hash VARCHAR,
        full_name VARCHAR,
        role VARCHAR DEFAULT 'employee',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        head_name VARCHAR,
        employee_count INT DEFAULT 0,
        compliance_score DECIMAL DEFAULT 0,
        risk_level VARCHAR DEFAULT 'low',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR,
        last_name VARCHAR,
        email VARCHAR UNIQUE,
        department_id INT REFERENCES departments(id),
        job_title VARCHAR,
        hire_date DATE,
        training_status VARCHAR DEFAULT 'pending',
        hipaa_certified BOOLEAN DEFAULT false,
        certification_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE training_courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        category VARCHAR,
        duration_hours DECIMAL,
        passing_score INT DEFAULT 80,
        is_mandatory BOOLEAN DEFAULT true,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE training_records (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employees(id),
        course_id INT REFERENCES training_courses(id),
        status VARCHAR DEFAULT 'not_started',
        score INT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        expires_at DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE compliance_assessments (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        department_id INT REFERENCES departments(id),
        assessor_name VARCHAR,
        assessment_date DATE,
        status VARCHAR DEFAULT 'pending',
        score DECIMAL,
        findings TEXT,
        recommendations TEXT,
        next_review_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE policies (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        category VARCHAR,
        description TEXT,
        content TEXT,
        version VARCHAR,
        status VARCHAR DEFAULT 'draft',
        effective_date DATE,
        review_date DATE,
        approved_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE incident_reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        incident_type VARCHAR,
        severity VARCHAR DEFAULT 'medium',
        description TEXT,
        reported_by VARCHAR,
        reported_date DATE,
        status VARCHAR DEFAULT 'open',
        affected_individuals INT DEFAULT 0,
        phi_involved BOOLEAN DEFAULT false,
        resolution TEXT,
        resolved_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE business_associate_agreements (
        id SERIAL PRIMARY KEY,
        associate_name VARCHAR,
        contact_email VARCHAR,
        agreement_type VARCHAR,
        status VARCHAR DEFAULT 'active',
        effective_date DATE,
        expiration_date DATE,
        phi_access_level VARCHAR,
        last_audit_date DATE,
        compliance_status VARCHAR DEFAULT 'compliant',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE phi_inventory (
        id SERIAL PRIMARY KEY,
        data_type VARCHAR,
        storage_location VARCHAR,
        system_name VARCHAR,
        department_id INT REFERENCES departments(id),
        encryption_status VARCHAR DEFAULT 'encrypted',
        access_level VARCHAR,
        retention_period VARCHAR,
        last_audit_date DATE,
        risk_level VARCHAR DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE risk_register (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        category VARCHAR,
        description TEXT,
        risk_level VARCHAR DEFAULT 'medium',
        likelihood INT DEFAULT 3,
        impact INT DEFAULT 3,
        risk_score DECIMAL,
        mitigation_plan TEXT,
        owner VARCHAR,
        status VARCHAR DEFAULT 'open',
        identified_date DATE,
        review_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR,
        entity_type VARCHAR,
        entity_id INT,
        user_email VARCHAR,
        details TEXT,
        ip_address VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE compliance_deadlines (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        category VARCHAR,
        due_date DATE,
        assigned_to VARCHAR,
        status VARCHAR DEFAULT 'pending',
        priority VARCHAR DEFAULT 'medium',
        reminder_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE sanctions (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR,
        violation_type VARCHAR,
        description TEXT,
        severity VARCHAR DEFAULT 'minor',
        sanction_type VARCHAR,
        sanction_date DATE,
        status VARCHAR DEFAULT 'active',
        corrective_action TEXT,
        follow_up_date DATE,
        imposed_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        category VARCHAR,
        description TEXT,
        file_type VARCHAR,
        version VARCHAR,
        status VARCHAR DEFAULT 'active',
        uploaded_by VARCHAR,
        upload_date DATE,
        review_date DATE,
        tags TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE access_control (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR,
        system_name VARCHAR,
        access_level VARCHAR,
        phi_access BOOLEAN DEFAULT false,
        granted_date DATE,
        last_review_date DATE,
        status VARCHAR DEFAULT 'active',
        approved_by VARCHAR,
        justification TEXT,
        expiration_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created all tables.');

    // Seed users
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role) VALUES
      ('admin@hipaa-auditor.com', '${adminHash}', 'Admin User', 'admin'),
      ('user@hipaa-auditor.com', '${userHash}', 'Jane Smith', 'employee');
    `);
    console.log('Seeded users.');

    // Seed departments
    await client.query(`
      INSERT INTO departments (name, head_name, employee_count, compliance_score, risk_level) VALUES
      ('Cardiology', 'Dr. Robert Chen', 42, 94.5, 'low'),
      ('Radiology', 'Dr. Sarah Mitchell', 28, 88.0, 'low'),
      ('Emergency Medicine', 'Dr. James Okafor', 65, 76.2, 'high'),
      ('Pharmacy', 'Dr. Linda Patel', 35, 91.3, 'low'),
      ('Oncology', 'Dr. Michael Torres', 31, 89.7, 'low'),
      ('Pediatrics', 'Dr. Angela White', 40, 93.1, 'low'),
      ('Neurology', 'Dr. David Kim', 22, 85.4, 'medium'),
      ('Orthopedics', 'Dr. Susan Carter', 27, 87.9, 'medium'),
      ('ICU', 'Dr. Thomas Brown', 50, 79.6, 'high'),
      ('Medical Records', 'Ms. Patricia Evans', 18, 96.8, 'low'),
      ('Information Technology', 'Mr. Kevin Nguyen', 24, 82.3, 'medium'),
      ('Human Resources', 'Ms. Diane Foster', 15, 90.0, 'low'),
      ('Billing & Coding', 'Ms. Rachel Adams', 20, 88.5, 'medium'),
      ('Laboratory Services', 'Dr. Mark Hernandez', 33, 91.7, 'low'),
      ('Surgical Services', 'Dr. Nancy Scott', 48, 84.2, 'medium');
    `);
    console.log('Seeded departments.');

    // Seed employees (18)
    await client.query(`
      INSERT INTO employees (first_name, last_name, email, department_id, job_title, hire_date, training_status, hipaa_certified, certification_date) VALUES
      ('Emily', 'Johnson', 'ejohnson@hospital.org', 1, 'Registered Nurse', '2021-03-15', 'completed', true, '2024-03-15'),
      ('Carlos', 'Rivera', 'crivera@hospital.org', 2, 'Radiology Technician', '2020-07-01', 'completed', true, '2024-07-01'),
      ('Amanda', 'Lee', 'alee@hospital.org', 3, 'Emergency Room Nurse', '2022-01-10', 'in_progress', false, NULL),
      ('Brian', 'Thompson', 'bthompson@hospital.org', 4, 'Clinical Pharmacist', '2019-05-20', 'completed', true, '2024-05-20'),
      ('Sophia', 'Martinez', 'smartinez@hospital.org', 5, 'Oncology Nurse Practitioner', '2021-09-14', 'completed', true, '2024-09-14'),
      ('Daniel', 'Wilson', 'dwilson@hospital.org', 6, 'Pediatric Physician', '2018-11-05', 'completed', true, '2025-01-05'),
      ('Megan', 'Davis', 'mdavis@hospital.org', 7, 'Neurologist', '2022-04-22', 'pending', false, NULL),
      ('Jason', 'Garcia', 'jgarcia@hospital.org', 8, 'Orthopedic Surgeon', '2017-08-30', 'completed', true, '2024-08-30'),
      ('Lauren', 'Anderson', 'landerson@hospital.org', 9, 'ICU Nurse', '2023-02-18', 'in_progress', false, NULL),
      ('Kevin', 'Thomas', 'kthomas@hospital.org', 10, 'Medical Records Specialist', '2020-06-10', 'completed', true, '2025-06-10'),
      ('Rachel', 'Jackson', 'rjackson@hospital.org', 11, 'Systems Administrator', '2021-12-01', 'completed', true, '2024-12-01'),
      ('Mark', 'White', 'mwhite@hospital.org', 12, 'HR Coordinator', '2022-07-25', 'completed', true, '2024-07-25'),
      ('Ashley', 'Harris', 'aharris@hospital.org', 13, 'Medical Billing Specialist', '2023-01-09', 'in_progress', false, NULL),
      ('James', 'Martin', 'jmartin@hospital.org', 14, 'Lab Technician', '2020-03-03', 'completed', true, '2024-03-03'),
      ('Brittany', 'Taylor', 'btaylor@hospital.org', 15, 'Surgical Nurse', '2019-10-17', 'completed', true, '2025-10-17'),
      ('Steven', 'Moore', 'smoore@hospital.org', 1, 'Cardiologist', '2016-06-15', 'completed', true, '2025-06-15'),
      ('Christine', 'Clark', 'cclark@hospital.org', 3, 'Triage Nurse', '2023-08-12', 'pending', false, NULL),
      ('Anthony', 'Lewis', 'alewis@hospital.org', 9, 'Critical Care Physician', '2015-04-28', 'completed', true, '2024-04-28');
    `);
    console.log('Seeded employees.');

    // Seed training courses (16)
    await client.query(`
      INSERT INTO training_courses (title, description, category, duration_hours, passing_score, is_mandatory, status) VALUES
      ('HIPAA Privacy Rule Fundamentals', 'Introduction to HIPAA Privacy Rule requirements and patient rights', 'Privacy', 2.0, 80, true, 'active'),
      ('HIPAA Security Rule Essentials', 'Overview of HIPAA Security Rule safeguards and technical controls', 'Security', 2.5, 80, true, 'active'),
      ('PHI Handling and Protection', 'Best practices for handling Protected Health Information in daily operations', 'Privacy', 1.5, 80, true, 'active'),
      ('Breach Notification Requirements', 'Understanding HIPAA Breach Notification Rule obligations and timelines', 'Compliance', 1.5, 85, true, 'active'),
      ('Security Awareness Training', 'Cybersecurity awareness including phishing, passwords, and social engineering', 'Security', 2.0, 80, true, 'active'),
      ('Minimum Necessary Standard', 'Applying the minimum necessary standard when accessing and disclosing PHI', 'Privacy', 1.0, 80, true, 'active'),
      ('Patient Rights Under HIPAA', 'Understanding and facilitating patient rights including access and amendment', 'Privacy', 1.5, 75, true, 'active'),
      ('Electronic PHI (ePHI) Security', 'Protecting electronic PHI through encryption, access controls, and audit trails', 'Security', 2.0, 85, true, 'active'),
      ('Business Associate Management', 'Managing business associate relationships and agreement requirements', 'Compliance', 1.0, 80, false, 'active'),
      ('HIPAA Enforcement and Penalties', 'Civil and criminal penalties for HIPAA violations and enforcement actions', 'Compliance', 1.0, 75, true, 'active'),
      ('Workforce Sanctions Policy', 'Hospital sanctions policy for workforce HIPAA violations', 'Compliance', 0.5, 80, true, 'active'),
      ('Mobile Device Security', 'Securing mobile devices that access or store ePHI', 'Security', 1.5, 85, true, 'active'),
      ('Social Media and HIPAA', 'Navigating social media use while maintaining HIPAA compliance', 'Privacy', 1.0, 80, true, 'active'),
      ('Incident Response Procedures', 'Responding to security incidents and potential PHI breaches', 'Security', 2.0, 85, true, 'active'),
      ('Third-Party Risk Management', 'Assessing and managing risks from vendors and third parties with PHI access', 'Security', 1.5, 80, false, 'active'),
      ('Annual HIPAA Refresher', 'Annual refresher covering key HIPAA concepts and recent updates', 'Compliance', 1.0, 80, true, 'active');
    `);
    console.log('Seeded training courses.');

    // Seed training records (20)
    await client.query(`
      INSERT INTO training_records (employee_id, course_id, status, score, started_at, completed_at, expires_at) VALUES
      (1, 1, 'completed', 92, '2024-01-10 09:00:00', '2024-01-10 11:00:00', '2025-01-10'),
      (1, 2, 'completed', 88, '2024-01-15 10:00:00', '2024-01-15 12:30:00', '2025-01-15'),
      (2, 1, 'completed', 95, '2024-02-05 09:00:00', '2024-02-05 11:00:00', '2025-02-05'),
      (2, 3, 'completed', 90, '2024-02-10 14:00:00', '2024-02-10 15:30:00', '2025-02-10'),
      (3, 1, 'in_progress', NULL, '2024-11-01 09:00:00', NULL, NULL),
      (3, 5, 'not_started', NULL, NULL, NULL, NULL),
      (4, 1, 'completed', 97, '2024-03-12 09:00:00', '2024-03-12 11:00:00', '2025-03-12'),
      (4, 9, 'completed', 85, '2024-03-20 13:00:00', '2024-03-20 14:00:00', '2025-03-20'),
      (5, 1, 'completed', 91, '2024-04-08 09:00:00', '2024-04-08 11:00:00', '2025-04-08'),
      (5, 4, 'completed', 88, '2024-04-15 10:00:00', '2024-04-15 11:30:00', '2025-04-15'),
      (6, 16, 'completed', 94, '2024-12-01 09:00:00', '2024-12-01 10:00:00', '2025-12-01'),
      (7, 1, 'not_started', NULL, NULL, NULL, NULL),
      (7, 2, 'not_started', NULL, NULL, NULL, NULL),
      (8, 1, 'completed', 89, '2024-05-20 09:00:00', '2024-05-20 11:00:00', '2025-05-20'),
      (9, 1, 'in_progress', NULL, '2024-11-15 09:00:00', NULL, NULL),
      (10, 1, 'completed', 98, '2024-06-10 09:00:00', '2024-06-10 11:00:00', '2025-06-10'),
      (10, 8, 'completed', 96, '2024-06-15 13:00:00', '2024-06-15 15:00:00', '2025-06-15'),
      (11, 2, 'completed', 93, '2024-07-08 09:00:00', '2024-07-08 11:30:00', '2025-07-08'),
      (13, 1, 'in_progress', NULL, '2024-10-20 09:00:00', NULL, NULL),
      (14, 14, 'completed', 87, '2024-08-12 09:00:00', '2024-08-12 11:00:00', '2025-08-12');
    `);
    console.log('Seeded training records.');

    // Seed compliance assessments (16)
    await client.query(`
      INSERT INTO compliance_assessments (title, department_id, assessor_name, assessment_date, status, score, findings, recommendations, next_review_date) VALUES
      ('Annual HIPAA Privacy Audit - Cardiology', 1, 'Dr. Helen Brooks', '2024-01-20', 'completed', 94.5, 'Strong privacy practices; minor documentation gaps noted.', 'Update patient authorization forms to reflect 2024 requirements.', '2025-01-20'),
      ('Security Risk Assessment - IT', 11, 'CyberAudit Partners LLC', '2024-02-15', 'completed', 82.3, 'Outdated firewall rules and insufficient MFA deployment.', 'Implement MFA for all ePHI systems; update firewall policies.', '2024-08-15'),
      ('PHI Access Review - Medical Records', 10, 'Patricia Evans', '2024-03-10', 'completed', 96.8, 'Excellent access controls; audit trails complete.', 'Continue quarterly access reviews.', '2024-09-10'),
      ('Privacy Compliance Assessment - Emergency', 3, 'Dr. Helen Brooks', '2024-03-25', 'completed', 76.2, 'High turnover leads to incomplete onboarding training; verbal PHI disclosures noted.', 'Mandate HIPAA training within first 30 days; enforce minimum necessary standard.', '2024-09-25'),
      ('Annual HIPAA Security Audit - Pharmacy', 4, 'SecureHealth Auditors', '2024-04-05', 'completed', 91.3, 'Good encryption practices; workstation timeout policies need enforcement.', 'Enforce automatic screen lock after 5 minutes; conduct phishing simulation.', '2025-04-05'),
      ('Risk Assessment - Oncology', 5, 'Dr. Helen Brooks', '2024-04-20', 'completed', 89.7, 'Proper handling of sensitive diagnoses; consent forms up to date.', 'Increase frequency of access log reviews.', '2025-04-20'),
      ('HIPAA Training Compliance Review - Pediatrics', 6, 'HR Compliance Team', '2024-05-12', 'completed', 93.1, 'Training completion rate at 97%; minor gaps in refresher timing.', 'Automate training reminders 30 days before expiry.', '2025-05-12'),
      ('Security Assessment - ICU', 9, 'CyberAudit Partners LLC', '2024-05-28', 'completed', 79.6, 'Shared login credentials found on two workstations; patch management delays.', 'Eliminate credential sharing; implement automated patch management.', '2024-11-28'),
      ('Privacy Audit - Billing & Coding', 13, 'Dr. Helen Brooks', '2024-06-15', 'completed', 88.5, 'Good data minimization practices; two instances of improper PHI transmission.', 'Encrypt all email containing PHI; retrain billing staff.', '2025-06-15'),
      ('Security Risk Assessment - Laboratory', 14, 'SecureHealth Auditors', '2024-07-08', 'completed', 91.7, 'Lab systems well secured; USB port controls need policy update.', 'Update removable media policy; restrict USB ports on lab systems.', '2025-07-08'),
      ('Annual Audit - Surgical Services', 15, 'Dr. Helen Brooks', '2024-07-22', 'completed', 84.2, 'Pre-op and post-op PHI handling mostly compliant; verbal disclosures in hallways noted.', 'Enforce private consultation spaces; update surgical team training.', '2025-07-22'),
      ('Workforce HIPAA Assessment - HR', 12, 'External Compliance Group', '2024-08-14', 'completed', 90.0, 'Policy distribution well managed; acknowledgment records complete.', 'Digitize policy acknowledgment system for easier tracking.', '2025-08-14'),
      ('Semi-Annual Privacy Review - Radiology', 2, 'Dr. Helen Brooks', '2024-09-05', 'in_progress', NULL, NULL, NULL, '2025-03-05'),
      ('Security Controls Assessment - Neurology', 7, 'CyberAudit Partners LLC', '2024-10-01', 'pending', NULL, NULL, NULL, '2025-04-01'),
      ('PHI Inventory Audit - Orthopedics', 8, 'Patricia Evans', '2024-10-20', 'pending', NULL, NULL, NULL, '2025-04-20'),
      ('Year-End HIPAA Compliance Review - All Departments', 1, 'External Compliance Group', '2024-12-10', 'in_progress', NULL, NULL, NULL, '2025-06-10');
    `);
    console.log('Seeded compliance assessments.');

    // Seed policies (16)
    await client.query(`
      INSERT INTO policies (title, category, description, content, version, status, effective_date, review_date, approved_by) VALUES
      ('HIPAA Privacy Policy', 'Privacy', 'Governs the use and disclosure of Protected Health Information', 'This policy establishes the procedures for protecting patient privacy in accordance with HIPAA regulations...', '3.2', 'active', '2024-01-01', '2025-01-01', 'Chief Compliance Officer'),
      ('Information Security Policy', 'Security', 'Establishes security requirements for all information systems', 'All workforce members must adhere to the following information security standards...', '2.5', 'active', '2024-01-01', '2025-01-01', 'Chief Information Security Officer'),
      ('Breach Notification Policy', 'Compliance', 'Procedures for reporting and responding to PHI breaches', 'Upon discovery of a potential PHI breach, the following steps must be taken within 24 hours...', '2.1', 'active', '2024-02-01', '2025-02-01', 'Chief Compliance Officer'),
      ('Access Control Policy', 'Security', 'Controls access to systems containing ePHI', 'Access to systems containing ePHI is granted on a role-based, minimum necessary basis...', '4.0', 'active', '2024-01-15', '2025-01-15', 'Chief Information Security Officer'),
      ('Workforce Sanctions Policy', 'Compliance', 'Defines sanctions for HIPAA violations by workforce members', 'Violations of HIPAA policies will result in sanctions commensurate with the severity of the violation...', '2.3', 'active', '2024-03-01', '2025-03-01', 'Chief HR Officer'),
      ('Mobile Device Security Policy', 'Security', 'Requirements for mobile devices accessing ePHI', 'All mobile devices that access ePHI must be enrolled in the MDM system and meet the following requirements...', '1.8', 'active', '2024-04-01', '2025-04-01', 'Chief Information Security Officer'),
      ('Business Associate Agreement Policy', 'Compliance', 'Requirements for executing and managing BAAs', 'A signed BAA must be in place before any business associate is permitted access to PHI...', '3.0', 'active', '2024-01-01', '2025-01-01', 'Chief Compliance Officer'),
      ('Minimum Necessary Standard Policy', 'Privacy', 'Ensures PHI access is limited to what is necessary', 'Workforce members must make reasonable efforts to limit PHI use, disclosure, and requests...', '2.0', 'active', '2024-02-15', '2025-02-15', 'Chief Compliance Officer'),
      ('Audit Log Review Policy', 'Security', 'Procedures for reviewing system audit logs', 'Audit logs for all systems containing ePHI must be reviewed at defined intervals...', '1.5', 'active', '2024-03-01', '2025-03-01', 'Chief Information Security Officer'),
      ('Encryption Policy', 'Security', 'Requirements for encrypting ePHI at rest and in transit', 'All ePHI stored or transmitted must be encrypted using FIPS 140-2 compliant encryption standards...', '2.2', 'active', '2024-01-01', '2025-01-01', 'Chief Information Security Officer'),
      ('Disaster Recovery Policy', 'Security', 'Procedures for recovering systems and data after a disaster', 'A comprehensive disaster recovery plan must be maintained and tested annually...', '3.1', 'active', '2024-05-01', '2025-05-01', 'Chief Information Officer'),
      ('Social Media Policy', 'Privacy', 'Guidelines for workforce social media use related to patient information', 'Workforce members are prohibited from posting any patient information on social media platforms...', '1.4', 'active', '2024-04-15', '2025-04-15', 'Chief Compliance Officer'),
      ('Vendor Risk Management Policy', 'Compliance', 'Assessment and monitoring of third-party vendors with PHI access', 'All vendors with access to PHI must undergo security assessment prior to engagement...', '2.0', 'active', '2024-06-01', '2025-06-01', 'Chief Compliance Officer'),
      ('Patient Rights Policy', 'Privacy', 'Procedures for responding to patient rights requests', 'Patients have the right to access, amend, and request restrictions on their PHI...', '2.7', 'active', '2024-01-01', '2025-01-01', 'Chief Compliance Officer'),
      ('Incident Response Policy', 'Security', 'Procedures for responding to security incidents', 'Security incidents must be reported to the Security Officer within one hour of discovery...', '3.3', 'active', '2024-02-01', '2025-02-01', 'Chief Information Security Officer'),
      ('HIPAA Training Policy', 'Compliance', 'Requirements for HIPAA workforce training', 'All workforce members must complete HIPAA training within 30 days of hire and annually thereafter...', '2.1', 'draft', '2025-01-01', '2026-01-01', NULL);
    `);
    console.log('Seeded policies.');

    // Seed incident reports (16)
    await client.query(`
      INSERT INTO incident_reports (title, incident_type, severity, description, reported_by, reported_date, status, affected_individuals, phi_involved, resolution, resolved_date) VALUES
      ('Unauthorized PHI Access - Medical Records', 'Unauthorized Access', 'high', 'A medical records clerk accessed patient records without a valid treatment relationship.', 'Patricia Evans', '2024-01-15', 'resolved', 1, true, 'Employee counseled and required to retake HIPAA training. Access revoked pending review.', '2024-01-22'),
      ('Lost Laptop with ePHI', 'Lost/Stolen Device', 'critical', 'A physician lost a laptop containing unencrypted patient appointment data.', 'Dr. Steven Moore', '2024-02-08', 'resolved', 245, true, 'Laptop remotely wiped. Breach notification sent to affected patients. Encryption policy enforced.', '2024-03-01'),
      ('Phishing Email Click - Billing Staff', 'Security Incident', 'high', 'A billing staff member clicked a phishing link and entered credentials on a spoofed site.', 'Ashley Harris', '2024-03-12', 'resolved', 0, false, 'Credentials reset, MFA enforced, phishing simulation training deployed.', '2024-03-15'),
      ('Misdirected Fax Containing PHI', 'Improper Disclosure', 'medium', 'Patient records were faxed to a wrong number at an attorney''s office.', 'Amanda Lee', '2024-03-28', 'resolved', 3, true, 'Contacted recipient and confirmed destruction. Patient notification sent.', '2024-04-05'),
      ('Verbal PHI Disclosure in Public Area', 'Improper Disclosure', 'low', 'A nurse discussed patient diagnosis in a hospital hallway where others could overhear.', 'Emily Johnson', '2024-04-10', 'resolved', 1, true, 'Verbal counseling provided. Department-wide reminder issued.', '2024-04-12'),
      ('Ransomware Attack on Lab System', 'Cyber Attack', 'critical', 'A ransomware attack encrypted laboratory information system files. System unavailable for 18 hours.', 'James Martin', '2024-04-22', 'resolved', 0, false, 'Systems restored from backup. Forensic investigation completed. No PHI exfiltration confirmed.', '2024-05-10'),
      ('Improper PHI Disposal', 'Improper Disposal', 'medium', 'Patient paper records found in regular trash rather than shred bin.', 'Mark White', '2024-05-14', 'resolved', 12, true, 'Documents retrieved and shredded. Staff retrained on disposal procedures.', '2024-05-16'),
      ('Unauthorized Social Media Post', 'Unauthorized Disclosure', 'high', 'An ER nurse posted details about a celebrity patient on a personal social media account.', 'Christine Clark', '2024-06-03', 'resolved', 1, true, 'Post removed. Employee suspended pending HR investigation. Formal sanction issued.', '2024-06-20'),
      ('EHR System Misconfiguration', 'System Vulnerability', 'high', 'EHR system update created a misconfiguration exposing patient list to unauthorized staff.', 'Rachel Jackson', '2024-06-18', 'resolved', 0, true, 'Misconfiguration corrected. Access logs audited. No evidence of unauthorized access.', '2024-06-20'),
      ('Missing Patient Authorization Form', 'Documentation Error', 'low', 'PHI disclosed to a patient''s family member without a signed authorization form on file.', 'Brian Thompson', '2024-07-02', 'resolved', 1, true, 'Authorization obtained retroactively. Staff reminded of authorization requirements.', '2024-07-05'),
      ('Stolen Mobile Phone with PHI', 'Lost/Stolen Device', 'medium', 'A pharmacist''s personal phone used for work had patient medication lists. Phone reported stolen.', 'Brian Thompson', '2024-07-20', 'open', 8, true, NULL, NULL),
      ('Third-Party Vendor Data Exposure', 'Business Associate Breach', 'critical', 'A billing software vendor reported a data breach exposing records of hospital patients.', 'Rachel Jackson', '2024-08-05', 'in_progress', 1200, true, NULL, NULL),
      ('Unauthorized Remote Access', 'Unauthorized Access', 'high', 'VPN logs show after-hours access from an unrecognized device using a shared service account.', 'Kevin Thomas', '2024-09-10', 'resolved', 0, false, 'Service account password reset. Shared account use prohibited. Individual accounts issued.', '2024-09-15'),
      ('Patient Complaint - Privacy Violation', 'Patient Complaint', 'medium', 'Patient filed complaint alleging their diagnosis was shared with employer without consent.', 'Patricia Evans', '2024-10-01', 'in_progress', 1, true, NULL, NULL),
      ('Physical Break-In to Medical Records Room', 'Physical Security', 'high', 'After-hours break-in to medical records storage. Filing cabinets tampered with.', 'Patricia Evans', '2024-10-18', 'resolved', 0, true, 'Physical security upgraded. Locks replaced. Security cameras installed.', '2024-11-01'),
      ('Email Sent to Wrong Patient', 'Improper Disclosure', 'medium', 'Automated appointment reminder email sent to wrong patient with another patient''s name and appointment details.', 'Rachel Jackson', '2024-11-05', 'open', 2, true, NULL, NULL);
    `);
    console.log('Seeded incident reports.');

    // Seed BAAs (15)
    await client.query(`
      INSERT INTO business_associate_agreements (associate_name, contact_email, agreement_type, status, effective_date, expiration_date, phi_access_level, last_audit_date, compliance_status, notes) VALUES
      ('MedCloud EHR Services', 'compliance@medcloud.com', 'Cloud Services', 'active', '2023-01-01', '2025-12-31', 'full', '2024-06-15', 'compliant', 'Primary EHR vendor. Annual security review completed.'),
      ('BillRight Medical Billing', 'legal@billright.com', 'Billing Services', 'active', '2023-06-01', '2025-05-31', 'full', '2024-07-20', 'compliant', 'Processes all patient billing data.'),
      ('LabConnect Diagnostics', 'privacy@labconnect.com', 'Laboratory Services', 'active', '2022-09-01', '2024-08-31', 'limited', '2024-01-10', 'compliant', 'Lab results integration partner.'),
      ('SecureShred Document Services', 'info@secureshred.com', 'Document Destruction', 'active', '2024-01-01', '2026-12-31', 'limited', '2024-03-05', 'compliant', 'Handles all paper PHI destruction.'),
      ('TeleMed Connect', 'compliance@telemedconnect.com', 'Telehealth Platform', 'active', '2023-03-15', '2025-03-14', 'full', '2024-05-22', 'compliant', 'Telemedicine platform for remote consultations.'),
      ('RadImaging Cloud', 'security@radimaging.com', 'Radiology Services', 'active', '2023-07-01', '2025-06-30', 'limited', '2024-08-01', 'compliant', 'PACS cloud storage for radiology images.'),
      ('PharmTrack Systems', 'legal@pharmtrack.com', 'Pharmacy Technology', 'active', '2022-11-01', '2024-10-31', 'limited', '2024-02-18', 'non_compliant', 'Pharmacy management system. Non-compliance noted in last audit - remediation in progress.'),
      ('CleanMed Janitorial Services', 'contracts@cleanmed.com', 'Facilities Services', 'active', '2024-04-01', '2025-03-31', 'incidental', '2024-04-01', 'compliant', 'Access to clinical areas during off-hours cleaning.'),
      ('DataGuard Backup Solutions', 'privacy@dataguard.com', 'IT Services', 'active', '2023-02-01', '2025-01-31', 'full', '2024-09-10', 'compliant', 'Manages offsite backup and disaster recovery.'),
      ('MedTranslate Services', 'info@medtranslate.com', 'Translation Services', 'active', '2023-10-01', '2025-09-30', 'limited', '2024-04-15', 'compliant', 'Medical interpretation and translation services.'),
      ('ChiroSoft EMR', 'compliance@chirosoft.com', 'Software Services', 'expired', '2021-01-01', '2023-12-31', 'full', '2023-06-01', 'non_compliant', 'BAA expired. System decommissioned - renewal not required.'),
      ('PatientPortal Pro', 'legal@patientportalpro.com', 'Patient Engagement', 'active', '2024-02-15', '2026-02-14', 'full', '2024-06-30', 'compliant', 'Patient portal and messaging platform.'),
      ('MedStaff Recruiters', 'hr@medstaffrecruiters.com', 'Staffing Services', 'active', '2023-05-01', '2025-04-30', 'limited', '2024-03-20', 'compliant', 'Temporary staffing with potential PHI access.'),
      ('CareAnalytics Inc', 'compliance@careanalytics.com', 'Analytics Services', 'active', '2024-01-15', '2026-01-14', 'full', '2024-07-05', 'compliant', 'Population health analytics platform.'),
      ('BioWaste Disposal LLC', 'contracts@biowaste.com', 'Waste Management', 'active', '2023-08-01', '2025-07-31', 'incidental', '2024-01-25', 'compliant', 'Handles medical waste from clinical areas.');
    `);
    console.log('Seeded business associate agreements.');

    // Seed PHI inventory (16)
    await client.query(`
      INSERT INTO phi_inventory (data_type, storage_location, system_name, department_id, encryption_status, access_level, retention_period, last_audit_date, risk_level, notes) VALUES
      ('Electronic Health Records', 'Cloud - AWS GovCloud', 'MedCloud EHR', 1, 'encrypted', 'role_based', '10 years', '2024-06-15', 'low', 'Primary EHR system with full audit logging enabled.'),
      ('Radiology Images (DICOM)', 'On-Premise PACS + Cloud Backup', 'RadImaging PACS', 2, 'encrypted', 'role_based', '7 years', '2024-08-01', 'low', 'Images encrypted at rest and in transit.'),
      ('Lab Results', 'On-Premise Database', 'LabConnect LIS', 14, 'encrypted', 'role_based', '10 years', '2024-01-10', 'medium', 'Local server. Backup to cloud nightly.'),
      ('Pharmacy Records', 'On-Premise + Cloud Sync', 'PharmTrack RxSystem', 4, 'partial', 'role_based', '5 years', '2024-02-18', 'high', 'Partial encryption noted in audit. Remediation in progress.'),
      ('Paper Medical Records (Archive)', 'Physical - Records Room B2', 'N/A (Physical)', 10, 'not_encrypted', 'restricted', '10 years', '2024-03-12', 'medium', 'Physical records in locked room. Transitioning to digital.'),
      ('Billing and Claims Data', 'Cloud - Azure', 'BillRight Platform', 13, 'encrypted', 'role_based', '7 years', '2024-07-20', 'low', 'Processed and stored by billing BAA vendor.'),
      ('ICU Patient Monitoring Data', 'On-Premise Servers', 'CareSentry Monitor System', 9, 'encrypted', 'restricted', '5 years', '2024-05-28', 'medium', 'Real-time monitoring data retained for 5 years.'),
      ('Employee Health Records', 'On-Premise HR System', 'HR HealthTrack', 12, 'encrypted', 'restricted', '30 years', '2024-08-14', 'low', 'Stored separately from patient records. Very limited access.'),
      ('Surgical Records', 'Cloud - AWS GovCloud', 'MedCloud EHR (Surgical Module)', 15, 'encrypted', 'role_based', '10 years', '2024-07-22', 'low', 'Integrated with main EHR; surgical team access only.'),
      ('Telemedicine Session Records', 'Cloud - TeleMed Connect', 'TeleMed Connect Platform', 1, 'encrypted', 'role_based', '7 years', '2024-05-22', 'low', 'Video and notes stored per BAA agreement.'),
      ('Email Communications with PHI', 'On-Premise Exchange Server', 'Microsoft Exchange', 11, 'partial', 'role_based', '7 years', '2024-09-01', 'high', 'Some staff still send unencrypted PHI email. Training and controls in progress.'),
      ('Patient Portal Data', 'Cloud - PatientPortal Pro', 'PatientPortal Pro', 10, 'encrypted', 'patient_controlled', '10 years', '2024-06-30', 'low', 'Patient-controlled access with MFA required.'),
      ('Research Data (De-identified)', 'On-Premise Research Server', 'ResearchDB', 5, 'encrypted', 'role_based', '10 years', '2024-04-05', 'low', 'De-identified per Safe Harbor method. IRB approved.'),
      ('Appointment Scheduling Data', 'Cloud - SchedulePro', 'SchedulePro System', 6, 'encrypted', 'role_based', '5 years', '2024-05-10', 'low', 'Includes patient name, DOB, and provider. Encrypted in transit and at rest.'),
      ('Pathology and Biopsy Records', 'On-Premise Pathology Server', 'PathSys LIS', 14, 'encrypted', 'restricted', '10 years', '2024-07-08', 'medium', 'Sensitive oncology data. Restricted to pathology and oncology staff.'),
      ('Mobile Device PHI Cache', 'Endpoint Devices (MDM Managed)', 'Jamf MDM', 11, 'encrypted', 'role_based', '90 days', '2024-09-15', 'medium', 'PHI temporarily cached on MDM-enrolled devices. Remote wipe capability active.');
    `);
    console.log('Seeded PHI inventory.');

    // Seed risk register (16)
    await client.query(`
      INSERT INTO risk_register (title, category, description, risk_level, likelihood, impact, risk_score, mitigation_plan, owner, status, identified_date, review_date) VALUES
      ('Ransomware Attack on EHR System', 'Cybersecurity', 'Threat of ransomware encrypting EHR and disrupting patient care', 'critical', 4, 5, 20.0, 'Implement offline backups, endpoint detection, regular patching, and staff phishing training.', 'Kevin Nguyen', 'open', '2024-01-15', '2024-07-15'),
      ('Unencrypted PHI on Mobile Devices', 'Data Security', 'Staff using personal devices to access or store PHI without encryption', 'high', 4, 4, 16.0, 'Enforce MDM enrollment for all devices accessing ePHI; provide encrypted work devices.', 'Kevin Nguyen', 'in_progress', '2024-02-01', '2024-08-01'),
      ('Phishing and Social Engineering Attacks', 'Cybersecurity', 'Workforce susceptibility to phishing emails leading to credential theft', 'high', 4, 4, 16.0, 'Deploy email filtering, conduct quarterly phishing simulations, enforce MFA.', 'Kevin Nguyen', 'open', '2024-01-20', '2024-07-20'),
      ('Inadequate Business Associate Oversight', 'Compliance', 'BA vendors not complying with HIPAA obligations, creating breach risk', 'high', 3, 5, 15.0, 'Conduct annual BA security assessments; update BAA templates with security requirements.', 'Chief Compliance Officer', 'open', '2024-03-01', '2024-09-01'),
      ('Insufficient HIPAA Training Compliance', 'Workforce', 'High-turnover departments with incomplete HIPAA training', 'medium', 4, 3, 12.0, 'Automate onboarding training; require completion before system access.', 'HR Department', 'in_progress', '2024-03-15', '2024-09-15'),
      ('Legacy System Vulnerabilities', 'IT Infrastructure', 'Outdated systems with known vulnerabilities running unsupported software', 'high', 3, 4, 12.0, 'Create system modernization roadmap; apply compensating controls for legacy systems.', 'Kevin Nguyen', 'open', '2024-04-01', '2024-10-01'),
      ('Insider Threat - Unauthorized PHI Access', 'Insider Threat', 'Employees accessing patient records outside their role', 'high', 3, 4, 12.0, 'Implement behavioral analytics; conduct periodic access reviews; enforce minimum necessary.', 'Chief Compliance Officer', 'open', '2024-02-15', '2024-08-15'),
      ('Physical Security - Unauthorized Access to Records', 'Physical Security', 'Risk of unauthorized physical access to areas containing PHI', 'medium', 2, 4, 8.0, 'Upgrade physical access controls; install security cameras; conduct physical security audits.', 'Facilities Manager', 'mitigated', '2024-05-01', '2025-05-01'),
      ('Cloud Misconfiguration Exposing ePHI', 'Cloud Security', 'Misconfigured cloud storage settings potentially exposing ePHI publicly', 'high', 3, 5, 15.0, 'Deploy cloud security posture management; conduct cloud configuration reviews quarterly.', 'Kevin Nguyen', 'open', '2024-05-15', '2024-11-15'),
      ('Lack of Disaster Recovery Testing', 'Business Continuity', 'DR plan exists but has not been tested; recovery capabilities unverified', 'medium', 3, 4, 12.0, 'Schedule bi-annual DR tests; document and address gaps found during testing.', 'Kevin Nguyen', 'in_progress', '2024-06-01', '2024-12-01'),
      ('Improper PHI Disposal by Staff', 'Privacy', 'Risk of PHI appearing in regular waste due to staff non-compliance', 'medium', 3, 3, 9.0, 'Increase availability of shred bins; conduct spot audits; reinforce disposal training.', 'Chief Compliance Officer', 'open', '2024-06-15', '2024-12-15'),
      ('Third-Party Data Breach Impacting Patients', 'Third-Party Risk', 'Vendor breach exposing patient data held by a BA', 'high', 3, 5, 15.0, 'Require vendor SOC 2 reports; include breach notification SLAs in BAAs.', 'Chief Compliance Officer', 'open', '2024-07-01', '2025-01-01'),
      ('Audit Log Review Deficiencies', 'Compliance', 'ePHI system audit logs not reviewed per policy, missing unauthorized access detection', 'medium', 3, 3, 9.0, 'Implement SIEM with automated alerting; assign review responsibilities per department.', 'Kevin Nguyen', 'in_progress', '2024-07-15', '2025-01-15'),
      ('Patient Portal Credential Compromise', 'Cybersecurity', 'Risk of patients'' portal credentials being compromised through credential stuffing', 'medium', 3, 3, 9.0, 'Implement account lockout policies; enable MFA for patient portal; monitor for anomalies.', 'Kevin Nguyen', 'open', '2024-08-01', '2025-02-01'),
      ('Delayed Breach Notification', 'Compliance', 'Risk of failing to meet 60-day breach notification deadline under HIPAA', 'high', 2, 5, 10.0, 'Implement breach response playbook; assign dedicated breach response team; conduct tabletop exercises.', 'Chief Compliance Officer', 'open', '2024-08-15', '2025-02-15'),
      ('Unsecured Email Transmission of PHI', 'Data Security', 'Staff emailing PHI without encryption to external parties', 'medium', 4, 3, 12.0, 'Deploy email encryption gateway; configure DLP rules to block unencrypted PHI email.', 'Kevin Nguyen', 'in_progress', '2024-09-01', '2025-03-01');
    `);
    console.log('Seeded risk register.');

    // Seed audit logs (20)
    await client.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, user_email, details, ip_address) VALUES
      ('LOGIN', 'user', 1, 'admin@hipaa-auditor.com', 'Admin user logged in successfully', '192.168.1.100'),
      ('VIEW', 'employee', 3, 'admin@hipaa-auditor.com', 'Viewed employee record: Amanda Lee', '192.168.1.100'),
      ('UPDATE', 'training_record', 5, 'admin@hipaa-auditor.com', 'Updated training status for employee ID 3 to in_progress', '192.168.1.100'),
      ('CREATE', 'incident_report', 1, 'admin@hipaa-auditor.com', 'Created new incident report: Unauthorized PHI Access - Medical Records', '192.168.1.100'),
      ('LOGIN', 'user', 2, 'user@hipaa-auditor.com', 'Standard user logged in successfully', '10.0.0.45'),
      ('VIEW', 'policy', 1, 'user@hipaa-auditor.com', 'Viewed policy: HIPAA Privacy Policy', '10.0.0.45'),
      ('EXPORT', 'compliance_assessment', 2, 'admin@hipaa-auditor.com', 'Exported compliance assessment report for IT department', '192.168.1.100'),
      ('UPDATE', 'incident_report', 2, 'admin@hipaa-auditor.com', 'Updated incident report status to resolved: Lost Laptop with ePHI', '192.168.1.100'),
      ('CREATE', 'policy', 16, 'admin@hipaa-auditor.com', 'Created new policy: HIPAA Training Policy v2.1', '192.168.1.100'),
      ('VIEW', 'phi_inventory', 4, 'admin@hipaa-auditor.com', 'Viewed PHI inventory item: Pharmacy Records', '192.168.1.100'),
      ('UPDATE', 'risk_register', 2, 'admin@hipaa-auditor.com', 'Updated risk status to in_progress: Unencrypted PHI on Mobile Devices', '192.168.1.100'),
      ('CREATE', 'sanction', 1, 'admin@hipaa-auditor.com', 'Created sanction record for policy violation', '192.168.1.100'),
      ('LOGIN_FAILED', 'user', NULL, 'unknown@external.com', 'Failed login attempt - invalid credentials', '203.45.67.89'),
      ('VIEW', 'audit_logs', NULL, 'admin@hipaa-auditor.com', 'Accessed audit log viewer', '192.168.1.100'),
      ('UPDATE', 'employee', 7, 'admin@hipaa-auditor.com', 'Updated training status for Megan Davis to pending', '192.168.1.100'),
      ('CREATE', 'compliance_deadline', 5, 'admin@hipaa-auditor.com', 'Created new compliance deadline: Annual Risk Assessment Due', '192.168.1.100'),
      ('DELETE', 'document', 3, 'admin@hipaa-auditor.com', 'Archived outdated HIPAA training document version 1.0', '192.168.1.100'),
      ('UPDATE', 'baa', 7, 'admin@hipaa-auditor.com', 'Flagged PharmTrack Systems BAA for non-compliance review', '192.168.1.100'),
      ('VIEW', 'incident_report', 12, 'user@hipaa-auditor.com', 'Viewed incident report: Third-Party Vendor Data Exposure', '10.0.0.45'),
      ('LOGOUT', 'user', 2, 'user@hipaa-auditor.com', 'User logged out', '10.0.0.45');
    `);
    console.log('Seeded audit logs.');

    // Seed compliance deadlines (16)
    await client.query(`
      INSERT INTO compliance_deadlines (title, description, category, due_date, assigned_to, status, priority, reminder_date, notes) VALUES
      ('Annual HIPAA Risk Assessment', 'Complete organization-wide HIPAA security risk assessment per 45 CFR 164.308(a)(1)', 'Security', '2024-03-31', 'Kevin Nguyen', 'completed', 'high', '2024-03-01', 'Completed on 2024-03-28. Report filed with compliance office.'),
      ('HIPAA Training Completion - New Hires Q1', 'Ensure all Q1 2024 new hires complete HIPAA training within 30 days', 'Training', '2024-04-30', 'HR Department', 'completed', 'high', '2024-04-15', 'All 8 Q1 new hires completed training.'),
      ('BAA Renewal - LabConnect Diagnostics', 'Renew expiring BAA with LabConnect Diagnostics', 'Compliance', '2024-08-31', 'Chief Compliance Officer', 'completed', 'medium', '2024-08-01', 'BAA renewed for 2 years effective 2024-09-01.'),
      ('Breach Notification - Third-Party Vendor', 'Complete HHS breach notification for vendor data breach (>500 individuals)', 'Breach Response', '2024-10-04', 'Chief Compliance Officer', 'in_progress', 'critical', '2024-09-20', 'Breach discovered 2024-08-05. 60-day notification deadline.'),
      ('Annual Policy Review Cycle', 'Review and update all active HIPAA policies', 'Policy Management', '2024-12-31', 'Chief Compliance Officer', 'in_progress', 'high', '2024-12-01', '10 of 16 policies reviewed so far.'),
      ('Security Patch Deployment - Q4', 'Deploy all critical and high security patches across ePHI systems', 'Security', '2024-11-30', 'Kevin Nguyen', 'completed', 'high', '2024-11-15', 'All critical patches deployed on schedule.'),
      ('HIPAA Training Completion - All Staff Annual', 'Annual HIPAA training renewal for all workforce members', 'Training', '2024-12-31', 'HR Department', 'in_progress', 'high', '2024-12-01', 'Currently at 78% completion. Targeting 100% by year end.'),
      ('Audit Log Review - Q3', 'Conduct quarterly ePHI system audit log review', 'Security', '2024-09-30', 'Kevin Nguyen', 'completed', 'medium', '2024-09-20', 'Review completed. Two anomalies investigated and resolved.'),
      ('Business Associate Security Survey', 'Send annual security questionnaire to all active BAs', 'Compliance', '2024-10-31', 'Chief Compliance Officer', 'completed', 'medium', '2024-10-15', 'All 13 active BAs responded. One non-compliance finding.'),
      ('Disaster Recovery Test', 'Conduct semi-annual DR test and document results', 'Business Continuity', '2024-11-15', 'Kevin Nguyen', 'overdue', 'high', '2024-11-01', 'Scheduled but postponed due to vendor availability. Rescheduling required.'),
      ('Physical Security Audit', 'Conduct audit of physical security controls for areas containing PHI', 'Physical Security', '2024-08-31', 'Facilities Manager', 'completed', 'medium', '2024-08-15', 'Audit completed. Security cameras installed in medical records area.'),
      ('HIPAA Refresher - Emergency Department', 'Conduct targeted HIPAA refresher for ED staff given recent compliance gaps', 'Training', '2024-07-31', 'HR Department', 'completed', 'high', '2024-07-15', 'Completed for all 65 ED staff members.'),
      ('OCR HIPAA Compliance Checklist Update', 'Update internal compliance checklist based on latest OCR guidance', 'Compliance', '2025-01-31', 'Chief Compliance Officer', 'pending', 'medium', '2025-01-15', 'Await publication of updated OCR guidance expected Q4 2024.'),
      ('Mobile Device Policy Update', 'Update mobile device security policy to address new BYOD risks', 'Policy Management', '2025-02-28', 'Kevin Nguyen', 'pending', 'medium', '2025-02-15', 'Draft in progress. Requires legal and HR review.'),
      ('Workforce Sanctions Review - Annual', 'Annual review of sanctions policy and all active sanctions', 'Compliance', '2025-01-15', 'Chief Compliance Officer', 'pending', 'medium', '2025-01-05', 'Review all 2024 sanctions for appropriateness and follow-up actions.'),
      ('HIPAA Compliance Report to Board', 'Prepare and present annual HIPAA compliance report to Board of Directors', 'Reporting', '2025-03-31', 'Chief Compliance Officer', 'pending', 'high', '2025-03-15', 'Compile full-year metrics, incidents, and audit results.');
    `);
    console.log('Seeded compliance deadlines.');

    // Seed sanctions (15)
    await client.query(`
      INSERT INTO sanctions (employee_name, violation_type, description, severity, sanction_type, sanction_date, status, corrective_action, follow_up_date, imposed_by) VALUES
      ('Christine Clark', 'Unauthorized PHI Disclosure', 'Posted patient information on personal social media account', 'major', 'Suspension - 3 days', '2024-06-10', 'active', 'Mandatory HIPAA retraining; social media policy review; written commitment to compliance.', '2024-07-10', 'Chief Compliance Officer'),
      ('Amanda Lee', 'Improper PHI Disclosure', 'Discussed patient case loudly in public hallway on two separate occasions', 'minor', 'Verbal Warning', '2024-04-15', 'resolved', 'Attended privacy refresher training; signed acknowledgment of privacy policy.', '2024-07-15', 'Department Manager'),
      ('Ashley Harris', 'Security Policy Violation', 'Clicked phishing link and entered work credentials on a spoofed website', 'moderate', 'Written Warning', '2024-03-20', 'active', 'Completed security awareness training; enrolled in ongoing phishing simulation program.', '2024-06-20', 'Chief Information Security Officer'),
      ('Unknown Staff Member', 'Improper PHI Disposal', 'Patient records found in regular trash bin in Billing department', 'moderate', 'Written Warning', '2024-05-20', 'resolved', 'Full department retrained on disposal procedures. Individual identified through investigation.', '2024-08-20', 'Chief Compliance Officer'),
      ('Lauren Anderson', 'Unauthorized Access', 'Accessed patient records of a personal acquaintance outside of care relationship', 'major', 'Suspension - 1 day', '2024-07-01', 'active', 'Mandatory HIPAA training completion; access privileges reviewed and restricted.', '2024-10-01', 'Chief Compliance Officer'),
      ('Megan Davis', 'Training Non-Compliance', 'Failed to complete mandatory annual HIPAA training by the required deadline', 'minor', 'Verbal Warning', '2024-09-01', 'resolved', 'Training completed within 5 business days of warning.', '2024-12-01', 'HR Department'),
      ('James Martin', 'Security Incident - Negligence', 'Opened suspicious email attachment leading to malware on lab workstation', 'moderate', 'Written Warning', '2024-05-05', 'resolved', 'Security awareness retraining; workstation access restricted pending full investigation.', '2024-08-05', 'Chief Information Security Officer'),
      ('Brian Thompson', 'Mobile Device Policy Violation', 'Used personal mobile device to store patient medication lists without MDM enrollment', 'moderate', 'Written Warning', '2024-08-01', 'active', 'Enrolled personal device in MDM; completed mobile device security training.', '2024-11-01', 'Chief Information Security Officer'),
      ('Rachel Jackson', 'System Misconfiguration', 'EHR system update misconfiguration resulted in unauthorized access exposure', 'major', 'Performance Improvement Plan', '2024-07-01', 'active', '90-day PIP with enhanced change management training; all changes require peer review.', '2024-10-01', 'Chief Information Officer'),
      ('Christine Clark', 'Repeat Privacy Violation', 'Second privacy violation within 12 months; continued failure to maintain patient confidentiality', 'severe', 'Termination', '2024-09-15', 'resolved', 'Employment terminated. Final paycheck processed. Access credentials deactivated.', NULL, 'Chief HR Officer'),
      ('Patricia Evans', 'Documentation Failure', 'Failed to document two PHI disclosures in required access log', 'minor', 'Verbal Warning', '2024-03-10', 'resolved', 'Retrained on documentation requirements; spot audits scheduled for 90 days.', '2024-06-10', 'Chief Compliance Officer'),
      ('Kevin Thomas', 'Access Control Violation', 'Shared login credentials with a temporary staff member to expedite access setup', 'moderate', 'Written Warning', '2024-04-05', 'resolved', 'Completed training; signed acceptable use agreement; credentials reset.', '2024-07-05', 'Chief Information Security Officer'),
      ('Daniel Wilson', 'Minimum Necessary Violation', 'Accessed comprehensive patient history when only current visit information was required', 'minor', 'Verbal Warning', '2024-02-20', 'resolved', 'Reviewed minimum necessary standard; updated access request workflow.', '2024-05-20', 'Department Manager'),
      ('Emily Johnson', 'Verbal PHI Disclosure', 'Discussed patient lab results in shared nursing station within earshot of visitors', 'minor', 'Verbal Warning', '2024-08-12', 'active', 'Reminded of private discussion requirements; department privacy refresher scheduled.', '2024-11-12', 'Department Manager'),
      ('Mark White', 'Policy Acknowledgment Failure', 'Failed to sign updated HIPAA policy acknowledgment forms for two consecutive policy cycles', 'minor', 'Verbal Warning', '2024-06-15', 'resolved', 'All outstanding policy acknowledgments signed; automated reminder system enrolled.', '2024-09-15', 'HR Department');
    `);
    console.log('Seeded sanctions.');

    // Seed documents (16)
    await client.query(`
      INSERT INTO documents (title, category, description, file_type, version, status, uploaded_by, upload_date, review_date, tags) VALUES
      ('HIPAA Privacy Notice (NPP)', 'Patient Notices', 'Notice of Privacy Practices provided to patients at first visit', 'PDF', '5.1', 'active', 'Chief Compliance Officer', '2024-01-05', '2025-01-05', 'npp,privacy,patient rights'),
      ('2024 HIPAA Security Risk Assessment Report', 'Risk Management', 'Comprehensive annual security risk assessment report', 'PDF', '2024.1', 'active', 'Kevin Nguyen', '2024-04-01', '2025-04-01', 'risk assessment,security,annual'),
      ('HIPAA Workforce Training Slides - 2024', 'Training Materials', 'Annual HIPAA training presentation for all workforce members', 'PPTX', '2024.2', 'active', 'HR Department', '2024-01-10', '2025-01-10', 'training,annual,workforce'),
      ('Breach Notification Letter Template', 'Templates', 'Template for notifying affected individuals of a PHI breach', 'DOCX', '3.0', 'active', 'Chief Compliance Officer', '2024-02-01', '2025-02-01', 'breach,notification,template'),
      ('Business Associate Agreement Template', 'Templates', 'Standard BAA template reviewed and approved by legal counsel', 'DOCX', '4.2', 'active', 'Chief Compliance Officer', '2024-01-15', '2025-01-15', 'baa,template,business associate'),
      ('HIPAA Compliance Program Overview', 'Program Documentation', 'High-level overview of the organization''s HIPAA compliance program', 'PDF', '2.3', 'active', 'Chief Compliance Officer', '2024-03-01', '2025-03-01', 'compliance program,overview'),
      ('IT Security Policies Manual', 'Policies', 'Compilation of all IT security policies and procedures', 'PDF', '6.1', 'active', 'Kevin Nguyen', '2024-01-20', '2025-01-20', 'security,policies,IT'),
      ('Incident Response Playbook', 'Procedures', 'Step-by-step playbook for responding to HIPAA security incidents', 'PDF', '3.5', 'active', 'Kevin Nguyen', '2024-02-15', '2025-02-15', 'incident response,playbook,security'),
      ('Patient Rights Request Form', 'Forms', 'Form for patients to submit HIPAA rights requests (access, amendment, etc.)', 'PDF', '2.1', 'active', 'Chief Compliance Officer', '2024-01-08', '2025-01-08', 'patient rights,form'),
      ('HIPAA Training Completion Log - 2024', 'Records', 'Log of workforce HIPAA training completions for 2024', 'XLSX', '2024.1', 'active', 'HR Department', '2024-12-15', '2025-12-15', 'training log,completion,2024'),
      ('PHI Data Flow Diagram', 'Technical Documentation', 'Diagram showing how PHI flows through hospital systems', 'VSDX', '1.8', 'active', 'Kevin Nguyen', '2024-04-10', '2025-04-10', 'data flow,PHI,architecture'),
      ('Sanction Policy Acknowledgment Form', 'Forms', 'Form acknowledging receipt and understanding of workforce sanction policy', 'PDF', '2.0', 'active', 'HR Department', '2024-03-01', '2025-03-01', 'sanctions,acknowledgment,workforce'),
      ('2023 HIPAA Compliance Audit Report', 'Audit Reports', 'Final audit report from 2023 annual HIPAA compliance assessment', 'PDF', '2023.final', 'active', 'External Compliance Group', '2024-01-30', '2025-01-30', 'audit,2023,compliance report'),
      ('Emergency Department HIPAA Quick Reference Card', 'Training Materials', 'Laminated quick reference card for ED staff on HIPAA essentials', 'PDF', '1.3', 'active', 'HR Department', '2024-07-20', '2025-07-20', 'ED,quick reference,training'),
      ('Media and Press HIPAA Guidelines', 'Policies', 'Guidelines for communications with media regarding patients', 'PDF', '1.5', 'active', 'Chief Compliance Officer', '2024-05-01', '2025-05-01', 'media,communications,privacy'),
      ('HIPAA Glossary of Terms', 'Reference Materials', 'Comprehensive glossary of HIPAA terminology for workforce reference', 'PDF', '3.0', 'active', 'Chief Compliance Officer', '2024-01-12', '2025-01-12', 'glossary,reference,terminology');
    `);
    console.log('Seeded documents.');

    // Seed access control (16)
    await client.query(`
      INSERT INTO access_control (employee_name, system_name, access_level, phi_access, granted_date, last_review_date, status, approved_by, justification, expiration_date) VALUES
      ('Emily Johnson', 'MedCloud EHR', 'read_write', true, '2021-03-15', '2024-03-15', 'active', 'Dr. Robert Chen', 'RN requires full read/write access for patient care documentation.', '2025-03-15'),
      ('Carlos Rivera', 'RadImaging PACS', 'read_write', true, '2020-07-01', '2024-07-01', 'active', 'Dr. Sarah Mitchell', 'Radiology tech requires access to all imaging records for job function.', '2025-07-01'),
      ('Brian Thompson', 'PharmTrack RxSystem', 'full_admin', true, '2019-05-20', '2024-05-20', 'active', 'Dr. Linda Patel', 'Clinical pharmacist requires admin access to manage pharmacy records.', '2025-05-20'),
      ('Rachel Jackson', 'MedCloud EHR', 'admin', true, '2021-12-01', '2024-12-01', 'active', 'Chief Information Officer', 'Systems administrator requires admin access for system maintenance.', '2025-12-01'),
      ('Rachel Jackson', 'Network Infrastructure', 'full_admin', false, '2021-12-01', '2024-12-01', 'active', 'Chief Information Officer', 'Systems administrator requires full network access.', '2025-12-01'),
      ('Kevin Thomas', 'MedCloud EHR', 'read_write', true, '2020-06-10', '2024-06-10', 'active', 'Patricia Evans', 'Medical records specialist requires access for records management.', '2025-06-10'),
      ('Ashley Harris', 'BillRight Platform', 'read_write', true, '2023-01-09', '2024-01-09', 'active', 'Rachel Adams', 'Billing specialist requires access to process claims.', '2025-01-09'),
      ('James Martin', 'LabConnect LIS', 'read_write', true, '2020-03-03', '2024-03-03', 'active', 'Dr. Mark Hernandez', 'Lab tech requires access to enter and review test results.', '2025-03-03'),
      ('Brittany Taylor', 'MedCloud EHR', 'read_write', true, '2019-10-17', '2024-10-17', 'active', 'Dr. Nancy Scott', 'Surgical nurse requires access to pre/post-op patient records.', '2025-10-17'),
      ('Steven Moore', 'MedCloud EHR', 'read_write', true, '2016-06-15', '2024-06-15', 'active', 'Dr. Robert Chen', 'Cardiologist requires access to cardiology patient records.', '2025-06-15'),
      ('Megan Davis', 'MedCloud EHR', 'read_only', true, '2022-04-22', '2024-04-22', 'active', 'Dr. David Kim', 'Neurologist granted read-only pending training completion.', '2025-04-22'),
      ('Lauren Anderson', 'CareSentry Monitor System', 'read_write', true, '2023-02-18', '2024-02-18', 'active', 'Dr. Thomas Brown', 'ICU nurse requires access to patient monitoring system.', '2025-02-18'),
      ('Christine Clark', 'MedCloud EHR', 'read_write', true, '2023-08-12', '2024-06-10', 'revoked', 'Chief Compliance Officer', 'Access revoked due to termination following repeat privacy violations.', NULL),
      ('Anthony Lewis', 'MedCloud EHR', 'read_write', true, '2015-04-28', '2024-04-28', 'active', 'Dr. Thomas Brown', 'Critical care physician requires full patient record access for ICU care.', '2025-04-28'),
      ('Mark White', 'HR HealthTrack', 'read_write', false, '2022-07-25', '2024-07-25', 'active', 'Diane Foster', 'HR coordinator requires access to manage employee records.', '2025-07-25'),
      ('Sophia Martinez', 'MedCloud EHR', 'read_write', true, '2021-09-14', '2024-09-14', 'active', 'Dr. Michael Torres', 'Oncology NP requires full access to oncology patient records.', '2025-09-14');
    `);
    console.log('Seeded access control.');

    // Log table counts
    const tables = [
      'users', 'departments', 'employees', 'training_courses', 'training_records',
      'compliance_assessments', 'policies', 'incident_reports', 'business_associate_agreements',
      'phi_inventory', 'risk_register', 'audit_logs', 'compliance_deadlines',
      'sanctions', 'documents', 'access_control'
    ];

    console.log('\n=== Table Row Counts ===');
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table}: ${result.rows[0].count} rows`);
    }
    console.log('======================\n');
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
