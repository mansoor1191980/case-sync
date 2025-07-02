from flask import Flask, request, jsonify
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def get_db_connection():
    #conn_str = (
     #   f"DRIVER={{{os.getenv('DB_DRIVER')}}};"
      #  f"SERVER={os.getenv('DB_SERVER')};"
       # f"DATABASE={os.getenv('DB_NAME')};"
        #f"UID={os.getenv('DB_USER')};"
        #f"PWD={os.getenv('DB_PASSWORD')};"
   # )

    conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=ps02;"
    "DATABASE=global;"
    "Trusted_Connection=yes;"
    )
    return pyodbc.connect(conn_str)

@app.route('/case-sync', methods=['POST'], strict_slashes=False)
def sync_case():
    data = request.get_json()

    Casenumber = data.get('Casenumber')
    DCRID = data.get('DCRID', '')
    Client = data.get('Client', '')
    Protocol = data.get('Protocol', '')
    Status = data.get('Status', '')
    Description = data.get('Description', '')
    
    if not Casenumber:
        return jsonify({"error": "case number is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            MERGE INTO Cases4mSalesforce AS target
            USING (SELECT ? AS Id) AS source
            ON target.Id = source.Id
            WHEN MATCHED THEN
                UPDATE SET Casenumber = ?, DCRID = ?, Client=?, protocol=?, Status=?, Description = ?
            WHEN NOT MATCHED THEN
                INSERT (casenumber, DCRID, Client, protocol, status, Description)
                VALUES (?, ?, ?, ?, ?,?);
        """, (Casenumber, DCRID, Client, Protocol, Status, Description,
              Casenumber, DCRID, Client, Protocol, Status, Description))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Case synced successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Server error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
    
#if __name__ == '__main__':
    #app.run(port=int(os.getenv("PORT", 5000)))

if __name__ == '__main__':
    app.run(debug=True)
