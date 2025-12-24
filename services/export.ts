
/**
 * Utility service for exporting patient health data
 */

export const exportDataAsJSON = (data: any, fileName: string = 'renal-health-export') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportSessionsAsCSV = (sessions: any[]) => {
  if (!sessions || sessions.length === 0) return;
  
  const headers = ['ID', 'Type', 'Date', 'Start Time', 'End Time', 'Duration (min)', 'Pre-Weight', 'Post-Weight', 'Fluid Removed', 'Status'];
  const rows = sessions.map(s => [
    s.id,
    s.type,
    new Date(s.startTime).toLocaleDateString(),
    new Date(s.startTime).toLocaleTimeString(),
    s.endTime ? new Date(s.endTime).toLocaleTimeString() : 'N/A',
    s.actualDuration || 0,
    s.preWeight,
    s.postWeight || 'N/A',
    s.fluidRemoved || 0,
    s.status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `dialysis-sessions-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAsPDF = (data: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const { profile, reportName, sessions, weights, fluids, vitals, medications, generatedAt } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 40px; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
        .header p { margin: 5px 0 0; color: #64748b; font-weight: bold; font-size: 12px; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
        .card label { display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .card value { display: block; font-size: 16px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; padding: 10px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
        .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Health Summary</h1>
          <p>Generated on ${new Date(generatedAt).toLocaleString()}</p>
        </div>
        <div style="text-align: right">
          <h2 style="margin:0; font-size: 18px;">${profile.name}</h2>
          <p>Modality: ${profile.preferredDialysisType}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Clinical Profile</div>
        <div class="grid">
          <div class="card"><label>Dry Weight Goal</label><value>${profile.weightGoal} kg</value></div>
          <div class="card"><label>Daily Fluid Limit</label><value>${profile.dailyFluidLimit} ml</value></div>
        </div>
      </div>

      ${sessions ? `
        <div class="section">
          <div class="section-title">Recent Dialysis Sessions</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Fluid Removed</th>
                <th>Weight (Pre/Post)</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.slice(0, 5).map((s: any) => `
                <tr>
                  <td>${new Date(s.startTime).toLocaleDateString()}</td>
                  <td>${s.type}</td>
                  <td>${s.fluidRemoved || '--'} ml</td>
                  <td>${s.preWeight || '--'} / ${s.postWeight || '--'} kg</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${vitals ? `
        <div class="section">
          <div class="section-title">Latest Vital Signs</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reading</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${vitals.slice(0, 5).map((v: any) => `
                <tr>
                  <td>${new Date(v.loggedAt).toLocaleDateString()}</td>
                  <td>${v.type}</td>
                  <td>${v.value1}${v.value2 ? '/' + v.value2 : ''} ${v.unit}</td>
                  <td>${v.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        This report was generated by dialysis.live and is intended for informational tracking purposes only.
        Consult a qualified physician for medical diagnosis and treatment.
      </div>

      <script>
        window.onload = () => {
          window.print();
          // Optional: window.close();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
