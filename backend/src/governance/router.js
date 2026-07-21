import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import core from './workflowCore.cjs';
import factory from './routerFactory.cjs';
import config from './config.cjs';

const db = {
  query: async (sql, params) => (await pool.query(sql, params)).rows,
  transaction: async work => { const client=await pool.connect(); try { await client.query('BEGIN'); const result=await work(async(sql,params)=>(await client.query(sql,params)).rows); await client.query('COMMIT'); return result; } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } },
};
export default factory.createGovernedRouter({ express, workflow: core.createWorkflow(config), auth: authenticateToken, db });
