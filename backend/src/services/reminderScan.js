// Shared reminder scan: generates reminder rows for overdue compliance
// deadlines, expiring HIPAA certifications, and expiring BAAs.
// Used by the opt-in scheduler in server.js and the manual
// POST /api/ai/run-reminder-job endpoint.
import pool from '../db.js';

async function insertReminder({ type, entityType, entityId, message, severity, matchOnType }) {
  // Skip when an unacknowledged reminder already exists for the same entity
  // (and same type, when several reminder types can target that entity).
  const result = matchOnType
    ? await pool.query(
        `INSERT INTO reminders (type, entity_type, entity_id, message, severity)
         SELECT $1::varchar, $2::varchar, $3::integer, $4::text, $5::varchar
         WHERE NOT EXISTS (
           SELECT 1 FROM reminders
           WHERE entity_type = $2 AND entity_id = $3 AND type = $1 AND acknowledged = false
         )`,
        [type, entityType, entityId, message, severity]
      )
    : await pool.query(
        `INSERT INTO reminders (type, entity_type, entity_id, message, severity)
         SELECT $1::varchar, $2::varchar, $3::integer, $4::text, $5::varchar
         WHERE NOT EXISTS (
           SELECT 1 FROM reminders
           WHERE entity_type = $2 AND entity_id = $3 AND acknowledged = false
         )`,
        [type, entityType, entityId, message, severity]
      );
  return result.rowCount;
}

export async function runReminderScan() {
  const summary = {
    overdue_deadlines: 0,
    expiring_certifications: 0,
    expiring_baas: 0,
    reminders_created: 0,
    errors: [],
  };

  // Overdue compliance deadlines
  try {
    const overdue = await pool.query(
      `SELECT id, title FROM compliance_deadlines WHERE due_date < NOW() AND status != 'completed' LIMIT 50`
    );
    summary.overdue_deadlines = overdue.rows.length;
    for (const r of overdue.rows) {
      summary.reminders_created += await insertReminder({
        type: 'overdue_deadline',
        entityType: 'compliance_deadlines',
        entityId: r.id,
        message: `Overdue deadline: ${r.title}`,
        severity: 'high',
      });
    }
  } catch (err) {
    summary.errors.push(`overdue_deadlines: ${err.message}`);
  }

  // Expiring certifications (within 30 days of the 1-year mark)
  try {
    const expiringCerts = await pool.query(
      `SELECT id, first_name, last_name FROM employees
       WHERE certification_date IS NOT NULL
         AND certification_date + INTERVAL '11 months' <= CURRENT_DATE
         AND certification_date + INTERVAL '12 months' > CURRENT_DATE LIMIT 100`
    );
    summary.expiring_certifications = expiringCerts.rows.length;
    for (const r of expiringCerts.rows) {
      summary.reminders_created += await insertReminder({
        type: 'cert_expiring',
        entityType: 'employees',
        entityId: r.id,
        message: `HIPAA certification expiring soon: ${r.first_name} ${r.last_name}`,
        severity: 'medium',
        matchOnType: true,
      });
    }
  } catch (err) {
    summary.errors.push(`expiring_certifications: ${err.message}`);
  }

  // Expiring BAAs (90 days)
  try {
    const expiringBAAs = await pool.query(
      `SELECT id, associate_name FROM business_associate_agreements
       WHERE expiration_date <= CURRENT_DATE + 90 AND expiration_date >= CURRENT_DATE LIMIT 50`
    );
    summary.expiring_baas = expiringBAAs.rows.length;
    for (const r of expiringBAAs.rows) {
      summary.reminders_created += await insertReminder({
        type: 'baa_expiring',
        entityType: 'business_associate_agreements',
        entityId: r.id,
        message: `BAA expiring within 90 days: ${r.associate_name}`,
        severity: 'high',
        matchOnType: true,
      });
    }
  } catch (err) {
    summary.errors.push(`expiring_baas: ${err.message}`);
  }

  return summary;
}
