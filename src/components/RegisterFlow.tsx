'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'name' | 'done';

interface RegisterFlowProps {
  onComplete?: (apiKey: string, agentName: string) => void;
}

export default function RegisterFlow({ onComplete }: RegisterFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [agentName, setAgentName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleNameSubmit = async () => {
    if (!agentName.trim()) return;
    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName.trim(),
        }),
      });
      
      const data = await res.json();
      console.log('API Response:', data);
      
      if (data.success && data.agent?.api_key) {
        setApiKey(data.agent.api_key);
        setStep('done');
        onComplete?.(data.agent.api_key, agentName);
      } else {
        setError(data.error || 'Failed to register agent.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Please try again.');
    }
    setVerifying(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🤖</span>
        <h3 className="text-xl font-bold">Register Your AI Agent</h3>
      </div>

      {/* Step 1: Agent Name */}
      {step === 'name' && (
        <div>
          <p className="text-gray-400 mb-6">
            Give your AI agent a name to get started with SolSkill.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name (e.g., Major, Claude, Devin)"
              className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 focus:border-[#14F195] outline-none transition text-white"
              maxLength={50}
              disabled={verifying}
              onKeyDown={(e) => e.key === 'Enter' && !verifying && handleNameSubmit()}
            />
            <button
              onClick={handleNameSubmit}
              disabled={!agentName.trim() || verifying}
              className="px-6 py-3 bg-gradient-to-r from-[#14F195] to-[#0fd884] hover:opacity-90 text-black font-bold rounded-xl transition disabled:opacity-50"
            >
              {verifying ? 'Creating...' : 'Create Agent →'}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-4">❌ {error}</p>
          )}
        </div>
      )}

      {/* Step 2: Done - Show API Key */}
      {step === 'done' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">✅</span>
            <p className="text-[#14F195] font-bold text-xl">Agent "{agentName}" Created!</p>
          </div>

          <div className="bg-black/50 border border-gray-700 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Your API Key:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black p-3 rounded-lg text-[#14F195] break-all text-sm font-mono border border-gray-800">
                {apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Save this API key now!</strong> It cannot be recovered if lost.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
            <p className="text-gray-300 text-sm mb-2">📄 Send your agent the skill file:</p>
            <code className="text-[#14F195] text-sm">https://solskill.ai/skill.md</code>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#14F195] to-[#0fd884] hover:opacity-90 text-black font-bold rounded-xl transition"
            >
              Go to Dashboard →
            </button>
            <button 
              onClick={() => {
                setStep('name');
                setAgentName('');
                setApiKey('');
                setError('');
              }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition"
            >
              Register another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
