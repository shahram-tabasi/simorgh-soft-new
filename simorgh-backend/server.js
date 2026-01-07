// server.js - نسخه نهایی با فیلتر سازنده و اتصال SQL
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'simorgh_db';

app.use(cors());
app.use(express.json());

let db;

// ============================================
// MongoDB Connection (existing)
// ============================================
async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI در .env پیدا نشد!');
    process.exit(1);
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('Connected to MongoDB successfully');
    console.log(`Database: ${DATABASE_NAME}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// ============================================
// SQL Server Connection (ADDED - from server-example.js)
// ============================================
// SQL Server configuration for EPLAN database (READ-ONLY access)
const sqlConfig = {
  user: process.env.SQL_USER || 'userfanni',
  password: process.env.SQL_PASSWORD || '12345678',
  server: process.env.SQL_SERVER || '192.168.1.39',
  database: process.env.SQL_DATABASE || 'Eplan_n2',
  port: parseInt(process.env.SQL_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let sqlPool;

// Connect to SQL Server (READ-ONLY)
async function connectToSqlServer() {
  try {
    if (!sqlPool) {
      console.log("🔄 Connecting to SQL Server (EPLAN)...");
      sqlPool = await sql.connect(sqlConfig);
      console.log("✅ Connected to SQL Server (EPLAN) successfully!");
    }
    return sqlPool;
  } catch (err) {
    console.error("❌ SQL Server connection error:", err.message);
    sqlPool = null;
    throw err;
  }
}

// ============================================
// Existing Routes (unchanged)
// ============================================
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.collection('projects').find({}).toArray();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const projectData = { ...req.body, createdOn: new Date().toISOString(), changedOn: new Date().toISOString() };
    const result = await db.collection('projects').insertOne(projectData);
    res.status(201).json({ _id: result.insertedId, ...projectData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const result = await db.collection('projects').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, changedOn: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const count = await db.collection('projects').countDocuments();

    // Also check SQL connection status
    let sqlStatus = 'disconnected';
    if (sqlPool) {
      try {
        await sqlPool.request().query('SELECT 1 AS test');
        sqlStatus = 'connected';
      } catch (err) {
        sqlStatus = 'error';
      }
    }

    res.json({
      status: 'OK',
      database: 'Connected',
      totalProjects: count,
      sqlServer: sqlStatus
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Simorgh Backend Server is running!' });
});

// ============================================
// ADDED: SQL Parts API with Manufacturer Filter
// Based on server-example.js (READ-ONLY queries only)
// ============================================

/**
 * GET /api/parts - Fetch parts from EPLAN SQL database with filtering
 * Query params:
 *   - search: Search term for part fields
 *   - man: Manufacturer filter (exact match)
 *   - offset: Pagination offset (default 0)
 */
app.get('/api/parts', async (req, res) => {
  console.log('📥 GET /api/parts - Request received');

  try {
    const sqlDb = await connectToSqlServer();

    let { search = '', man = '', offset = 0 } = req.query;
    offset = parseInt(offset) || 0;
    const limit = 50;

    console.log('📊 Parameters:', { search, man, offset, limit });

    // Build WHERE conditions (READ-ONLY: SELECT queries only)
    let where = [];
    let params = {};

    // Search filter: searches across multiple fields
    if (search) {
      const searchPattern = `%${search}%`;
      where.push(`(
        partnr LIKE @search OR
        typenr LIKE @search OR
        ordernr LIKE @search OR
        description1 LIKE @search OR
        description2 LIKE @search OR
        description3 LIKE @search OR
        manufacturer LIKE @search OR
        productgroup LIKE @search
      )`);
      params.search = searchPattern;
    }

    // ADDED: Manufacturer filter (exact match)
    if (man) {
      where.push(`manufacturer = @man`);
      params.man = man;
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    console.log('🔍 WHERE:', whereClause);

    // Count query with separate request (READ-ONLY)
    const countRequest = sqlDb.request();
    Object.keys(params).forEach(key => {
      countRequest.input(key, sql.NVarChar, params[key]);
    });

    const countQuery = `SELECT COUNT(*) AS total FROM tblPart ${whereClause}`;
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    console.log(`📈 Total count: ${total}`);

    // Data query with separate request (READ-ONLY)
    const dataRequest = sqlDb.request();
    Object.keys(params).forEach(key => {
      dataRequest.input(key, sql.NVarChar, params[key]);
    });

    const dataQuery = `
      SELECT
        partnr, typenr, ordernr, manufacturer,
        description1, description2, description3,
        productgroup, productsubgroup,
        width, height, depth, weight,
        mountinglocation, mountingspace,
        certificate_CE, certificate_UL, certificate_ATEX
      FROM (
        SELECT
          *,
          ROW_NUMBER() OVER (ORDER BY partnr) AS RowNum
        FROM tblPart
        ${whereClause}
      ) AS NumberedRows
      WHERE RowNum > ${offset} AND RowNum <= ${offset + limit}
      ORDER BY partnr
    `;

    const dataResult = await dataRequest.query(dataQuery);
    console.log(`📦 Records received: ${dataResult.recordset.length}`);

    // Get manufacturers list on first request (offset === 0) (READ-ONLY)
    let manufacturers = null;
    if (offset === 0) {
      const manRequest = sqlDb.request();
      const manQuery = `
        SELECT DISTINCT manufacturer
        FROM tblPart
        WHERE manufacturer IS NOT NULL AND manufacturer != ''
        ORDER BY manufacturer
      `;
      const manResult = await manRequest.query(manQuery);
      manufacturers = manResult.recordset.map(r => r.manufacturer);
      console.log(`🏭 Manufacturers count: ${manufacturers.length}`);
    }

    const response = {
      success: true,
      total: total,
      data: dataResult.recordset || [],
      manufacturers: manufacturers
    };

    res.json(response);

  } catch (err) {
    console.error("❌ Error in /api/parts:", err.message);
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: err.message,
      hint: 'Check server logs for details'
    });
  }
});

/**
 * GET /api/manufacturers - Get list of all manufacturers from EPLAN
 * (READ-ONLY: SELECT query only)
 */
app.get('/api/manufacturers', async (req, res) => {
  console.log('📥 GET /api/manufacturers - Request received');

  try {
    const sqlDb = await connectToSqlServer();

    const manRequest = sqlDb.request();
    const manQuery = `
      SELECT DISTINCT manufacturer
      FROM tblPart
      WHERE manufacturer IS NOT NULL AND manufacturer != ''
      ORDER BY manufacturer
    `;
    const manResult = await manRequest.query(manQuery);
    const manufacturers = manResult.recordset.map(r => r.manufacturer);

    console.log(`🏭 Manufacturers count: ${manufacturers.length}`);

    res.json({
      success: true,
      count: manufacturers.length,
      manufacturers: manufacturers
    });

  } catch (err) {
    console.error("❌ Error in /api/manufacturers:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/parts/:partnr - Get a single part by part number (full object)
 * (READ-ONLY: SELECT query only)
 */
app.get('/api/parts/:partnr', async (req, res) => {
  console.log('📥 GET /api/parts/:partnr - Request received');

  try {
    const sqlDb = await connectToSqlServer();
    const { partnr } = req.params;

    const partRequest = sqlDb.request();
    partRequest.input('partnr', sql.NVarChar, partnr);

    const partQuery = `
      SELECT
        partnr, typenr, ordernr, manufacturer,
        description1, description2, description3,
        productgroup, productsubgroup,
        width, height, depth, weight,
        mountinglocation, mountingspace,
        certificate_CE, certificate_UL, certificate_ATEX
      FROM tblPart
      WHERE partnr = @partnr
    `;

    const partResult = await partRequest.query(partQuery);

    if (partResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Part not found' });
    }

    res.json({
      success: true,
      data: partResult.recordset[0]
    });

  } catch (err) {
    console.error("❌ Error in /api/parts/:partnr:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// ADDED: MongoDB Selected Part Save/Replace Logic
// When a part is selected, save FULL object to MongoDB
// Replaces previously stored part (delete old, insert new)
// ============================================

/**
 * POST /api/selected-part - Save selected part to MongoDB (replace behavior)
 * Request body:
 *   - projectId: The project ID to associate the part with
 *   - templateType: Template type (LV, MV, HV)
 *   - slotIndex: Slot index within the template
 *   - part: The FULL part object from EPLAN SQL
 *
 * Behavior: Deletes previous part in this slot, inserts the new one
 */
app.post('/api/selected-part', async (req, res) => {
  console.log('📥 POST /api/selected-part - Request received');

  try {
    const { projectId, templateType, slotIndex, part } = req.body;

    // Validate required fields
    if (!projectId || !templateType || slotIndex === undefined || !part) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, templateType, slotIndex, part'
      });
    }

    // Validate part has partnr (code)
    if (!part.partnr) {
      return res.status(400).json({
        success: false,
        error: 'Part object must contain partnr field'
      });
    }

    console.log(`📝 Saving part ${part.partnr} to project ${projectId}, template ${templateType}, slot ${slotIndex}`);

    // Store part with full specifications in MongoDB selected_parts collection
    // This implements the replacement behavior: delete old, insert new
    const selectedPartsCollection = db.collection('selected_parts');

    // Step 1: Delete the previously stored part in this slot (if exists)
    await selectedPartsCollection.deleteOne({
      projectId: projectId,
      templateType: templateType,
      slotIndex: slotIndex
    });
    console.log('🗑️ Deleted previous part in this slot (if any)');

    // Step 2: Insert the newly selected part with FULL specifications
    const partDocument = {
      projectId: projectId,
      templateType: templateType,
      slotIndex: slotIndex,
      part: part, // FULL object with all specifications
      selectedAt: new Date().toISOString()
    };

    await selectedPartsCollection.insertOne(partDocument);
    console.log('✅ New part inserted successfully');

    res.json({
      success: true,
      message: 'Part saved successfully (replaced previous if existed)',
      data: partDocument
    });

  } catch (err) {
    console.error("❌ Error in /api/selected-part:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/selected-parts/:projectId - Get all selected parts for a project
 */
app.get('/api/selected-parts/:projectId', async (req, res) => {
  console.log('📥 GET /api/selected-parts/:projectId - Request received');

  try {
    const { projectId } = req.params;

    const selectedParts = await db.collection('selected_parts')
      .find({ projectId: projectId })
      .toArray();

    res.json({
      success: true,
      count: selectedParts.length,
      data: selectedParts
    });

  } catch (err) {
    console.error("❌ Error in /api/selected-parts:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/selected-part - Delete a selected part from MongoDB
 * Request body:
 *   - projectId: The project ID
 *   - templateType: Template type (LV, MV, HV)
 *   - slotIndex: Slot index within the template
 */
app.delete('/api/selected-part', async (req, res) => {
  console.log('📥 DELETE /api/selected-part - Request received');

  try {
    const { projectId, templateType, slotIndex } = req.body;

    if (!projectId || !templateType || slotIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, templateType, slotIndex'
      });
    }

    const result = await db.collection('selected_parts').deleteOne({
      projectId: projectId,
      templateType: templateType,
      slotIndex: slotIndex
    });

    res.json({
      success: true,
      deleted: result.deletedCount > 0,
      message: result.deletedCount > 0 ? 'Part deleted successfully' : 'No part found in this slot'
    });

  } catch (err) {
    console.error("❌ Error in DELETE /api/selected-part:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ============================================
// Server Startup
// ============================================
async function startServer() {
  await connectToDatabase();

  // Try to connect to SQL Server on startup (non-blocking)
  connectToSqlServer().catch(err => {
    console.warn("⚠️ Initial SQL Server connection failed, will retry on first request");
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`Parts API: http://localhost:${PORT}/api/parts`);
    console.log(`Manufacturers API: http://localhost:${PORT}/api/manufacturers`);
  });
}

startServer();
