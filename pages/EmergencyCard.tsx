import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { viewSharedEmergencyCard, SharedEmergencyData } from '../services/emergency';

export default function EmergencyCard() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedEmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid emergency card link.');
      setLoading(false);
      return;
    }

    viewSharedEmergencyCard(token)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setError('This emergency card was not found or is no longer active.');
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading emergency information...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Card Not Available</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Emergency Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 text-white text-center shadow-lg">
          <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight">Emergency Medical Information</h1>
          <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm font-medium">
            Dialysis Patient
          </div>
        </div>

        {/* Blood Type */}
        {data.bloodType && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Blood Type</p>
            <p className="text-5xl font-black text-red-600 dark:text-red-500">{data.bloodType}</p>
          </div>
        )}

        {/* Allergies */}
        {data.allergies && data.allergies.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {data.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="inline-block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dialysis Info */}
        {(data.dialysisCenterName || data.dialysisType || data.accessType) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dialysis Information</p>
            <div className="space-y-3">
              {data.dialysisCenterName && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Center</p>
                  <p className="text-slate-900 dark:text-white font-medium">{data.dialysisCenterName}</p>
                </div>
              )}
              {data.dialysisType && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Type</p>
                  <p className="text-slate-900 dark:text-white font-medium">{data.dialysisType}</p>
                </div>
              )}
              {data.accessType && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Access Type</p>
                  <p className="text-slate-900 dark:text-white font-medium">{data.accessType}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nephrologist */}
        {data.nephrologistName && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Nephrologist</p>
            <p className="text-slate-900 dark:text-white font-medium">{data.nephrologistName}</p>
          </div>
        )}

        {/* Emergency Contact */}
        {(data.emergencyContactName || data.emergencyContactPhone) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emergency Contact</p>
            {data.emergencyContactName && (
              <p className="text-slate-900 dark:text-white font-medium">{data.emergencyContactName}</p>
            )}
            {data.emergencyContactPhone && (
              <a
                href={`tel:${data.emergencyContactPhone}`}
                className="inline-flex items-center gap-2 mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {data.emergencyContactPhone}
              </a>
            )}
          </div>
        )}

        {/* Medications */}
        {data.medications && data.medications.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Medications</p>
            <div className="space-y-3">
              {data.medications.map((med, i) => (
                <div
                  key={i}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                >
                  <p className="text-slate-900 dark:text-white font-semibold">{med.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {med.dose} &middot; {med.route}
                  </p>
                  {med.instructions && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{med.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 pb-4">
          Shared via dialysis.live
        </p>

      </div>
    </div>
  );
}
