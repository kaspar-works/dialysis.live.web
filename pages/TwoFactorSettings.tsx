import { useState, useEffect, useRef } from 'react';
import {
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  getTwoFactorStatus,
  disableTwoFactor,
  regenerateBackupCodes,
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from '../services/auth';

export default function TwoFactorSettings() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenCode, setRegenCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const data = await getTwoFactorStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup() {
    try {
      setSettingUp(true);
      setError('');
      const data = await setupTwoFactor();
      setSetupData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to start 2FA setup');
    } finally {
      setSettingUp(false);
    }
  }

  async function handleVerify() {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }
    try {
      setVerifying(true);
      setError('');
      await verifyAndEnableTwoFactor(verificationCode);
      setBackupCodes(setupData?.backupCodes || null);
      setSetupData(null);
      setVerificationCode('');
      setSuccessMessage('Two-factor authentication has been enabled successfully.');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable() {
    if (disableCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }
    try {
      setDisabling(true);
      setError('');
      await disableTwoFactor(disableCode);
      setDisableCode('');
      setShowDisableConfirm(false);
      setBackupCodes(null);
      setSuccessMessage('Two-factor authentication has been disabled.');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  }

  async function handleRegenerateBackupCodes() {
    if (regenCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }
    try {
      setRegenerating(true);
      setError('');
      const data = await regenerateBackupCodes(regenCode);
      setBackupCodes(data.backupCodes);
      setRegenCode('');
      setSuccessMessage('Backup codes have been regenerated.');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate backup codes');
    } finally {
      setRegenerating(false);
    }
  }

  function copyBackupCodes() {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
  }

  function downloadBackupCodes() {
    if (!backupCodes) return;
    const content = `Dialysis.live - Two-Factor Authentication Backup Codes\n${'='.repeat(55)}\n\nStore these codes in a safe place. Each code can only be used once.\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toLocaleString()}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialysis-live-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Two-Factor Authentication
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-1 text-xs text-red-500 dark:text-red-400 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage('')}
            className="mt-1 text-xs text-emerald-500 dark:text-emerald-400 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Status</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {status?.isEnabled
                ? `Enabled - ${status.backupCodesRemaining} backup code${status.backupCodesRemaining !== 1 ? 's' : ''} remaining`
                : 'Two-factor authentication is not enabled'}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              status?.isEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {status?.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Setup Flow (when disabled) */}
      {!status?.isEnabled && !setupData && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Enable Two-Factor Authentication
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Use an authenticator app like Google Authenticator or Authy to generate verification codes.
          </p>
          <button
            onClick={handleSetup}
            disabled={settingUp}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {settingUp ? 'Setting up...' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {/* QR Code & Verification (setup in progress) */}
      {!status?.isEnabled && setupData && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Scan QR Code
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scan this QR code with your authenticator app, then enter the 6-digit code below to verify.
          </p>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-xl">
              <img
                src={setupData.qrCodeUrl}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Secret Key Fallback */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Can't scan the QR code? Enter this key manually:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-slate-900 dark:text-slate-200 break-all">
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                className="shrink-0 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
              >
                {secretCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Verification Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-center text-lg font-mono tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleVerify}
              disabled={verifying || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {verifying ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button
              onClick={() => {
                setSetupData(null);
                setVerificationCode('');
                setError('');
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes Display */}
      {backupCodes && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Backup Codes
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Save these codes in a safe place. Each code can only be used once to sign in if you lose access to your authenticator app.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <code
                key={index}
                className="text-sm font-mono text-slate-900 dark:text-slate-200 text-center py-1"
              >
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyBackupCodes}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              {codesCopied ? 'Copied' : 'Copy Codes'}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Download
            </button>
          </div>

          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Warning: These codes will not be shown again. Make sure to save them now.
          </p>
        </div>
      )}

      {/* Management (when enabled) */}
      {status?.isEnabled && (
        <>
          {/* Regenerate Backup Codes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Regenerate Backup Codes
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Generate a new set of backup codes. This will invalidate all existing backup codes.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={regenCode}
                onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-center text-lg font-mono tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={regenerating || regenCode.length !== 6}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Backup Codes'}
            </button>
          </div>

          {/* Disable 2FA */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Disable Two-Factor Authentication
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Removing 2FA will make your account less secure. You will only need your password to sign in.
              </p>
            </div>

            {!showDisableConfirm ? (
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Disable 2FA
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    Are you sure? This will remove two-factor authentication from your account.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-center text-lg font-mono tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDisable}
                    disabled={disabling || disableCode.length !== 6}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {disabling ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDisableConfirm(false);
                      setDisableCode('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Security Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          About Two-Factor Authentication
        </h2>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            Two-factor authentication adds an extra layer of security to your account by requiring a
            verification code from your authenticator app in addition to your password when signing in.
          </p>
          <p>This helps protect your account even if your password is compromised. With 2FA enabled:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Sign-in requires both your password and a time-based code</li>
            <li>Unauthorized access is blocked even with a stolen password</li>
            <li>Your health data and personal information stay protected</li>
            <li>Backup codes let you regain access if you lose your device</li>
          </ul>
          <p>
            We recommend using apps like Google Authenticator, Authy, or 1Password to generate your
            verification codes.
          </p>
        </div>
      </div>
    </div>
  );
}
