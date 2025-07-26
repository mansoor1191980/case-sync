const jsforce = require('jsforce');
const faye = require('faye');
const sql = require('mssql');

// Salesforce login
const conn = new jsforce.Connection({
  loginUrl: 'https://endpointsupport--miaw.sandbox.lightning.force.com'
});   

conn.login('shussainy@endpointclinical.com_miaw', 'tDcd1ORekALrYFLfKHqAhHjXT', async (err) => {
  if (err) return console.error(err);

  const client = new faye.Client(conn.streaming.endpoint + '/cometd/54.0');
  client.setHeader('Authorization', 'OAuth ' + conn.accessToken);

  client.subscribe('/data/CaseChangeEvent', async (message) => {
    console.log('Change received:', JSON.stringify(message));

    const payload = message.payload;
    const caseId = payload.ChangeEventHeader.recordIds[0];
    const changeType = payload.ChangeEventHeader.changeType;

    const caseFields = {
      Id: payload.Id,
      Subject: payload.Subject,
      Status: payload.Status,
      Priority: payload.Priority,
      LastModifiedDate: payload.LastModifiedDate
    };

    await writeToSQLServer(caseFields, changeType);
  });
});

// SQL Server function
async function writeToSQLServer(caseData, changeType) {
  const config = {
    user: 'shussainy',
    password: 'suPer00))',
    server: 'PS01',
    database: 'Global',
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };

  try {
    await sql.connect(config);

    if (changeType === 'CREATE') {
      await sql.query`INSERT INTO Cases4mSalesforce (CaseId, Subject, Status, Priority, LastModified) 
                      VALUES (${caseData.Id}, ${caseData.Subject}, ${caseData.Status}, ${caseData.Priority}, ${caseData.LastModifiedDate})`;
    } else if (changeType === 'UPDATE') {
       await sql.query`INSERT INTO Cases4mSalesforce (CaseId, Subject, Status, Priority, LastModified) 
                      VALUES (${caseData.Id}, ${caseData.Subject}, ${caseData.Status}, ${caseData.Priority}, ${caseData.LastModifiedDate})`;
    } else if (changeType === 'DELETE') {
      await sql.query`DELETE FROM Cases4mSalesforce WHERE CaseId=${caseData.Id}`;
    }

    console.log(`SQL Server updated for Case ${caseData.Id}`);
  } catch (err) {
    console.error('SQL Server error:', err);
  }
}
