'use client'
import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/modal';
import { UserPlus, X, Shield } from 'lucide-react';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

const SuperAdminInviteModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
    const otpString = otp.join('');
    const otpReady = /^\d{6}$/.test(otpString);

    const reset = () => {
        setEmail('');
        setName('');
        setOtp(['', '', '', '', '', '']);
        setOtpSent(false);
        setLoading(false);
    };

    const sendOtp = async () => {
        try {
            setLoading(true);
            const res = await apiRequest('/api/superadmins/request-otp', { method: 'POST' });
            const json = await res.json().catch(() => ({}));
            if (res.ok && (json.success || json.status === 200)) {
                setOtpSent(true);
                setOtp(['', '', '', '', '', '']);
                toast.success('OTP sent to owner email');
            } else {
                toast.error(json.message || 'Failed to send OTP');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Unexpected error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (otpSent) {
            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 0);
        }
    }, [otpSent]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!data) return;
        const filled = data.split('');
        const next = ['','', '', '', '', ''];
        for (let i = 0; i < Math.min(6, filled.length); i++) next[i] = filled[i];
        setOtp(next);
        const lastIndex = Math.min(5, filled.length - 1);
        setTimeout(() => {
            otpRefs.current[lastIndex]?.focus();
        }, 0);
    };

    const invite = async () => {
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error('Enter a valid email');
            return;
        }
        if (!name.trim()) {
            toast.error('Enter name');
            return;
        }
        if (!otpSent) {
            toast.error('Send OTP first');
            return;
        }
        if (!/^\d{6}$/.test(otpString)) {
            toast.error('Enter a valid 6-digit OTP');
            return;
        }
        try {
            setLoading(true);
            const res = await apiRequest('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), name: name.trim(), role: 'superadmin', otp: otpString })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && (json.success || json.status === 200)) {
                toast.success('Invitation sent');
                onUpdated?.();
                reset();
                onClose();
            } else {
                toast.error(json.message || 'Failed to send invitation');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Unexpected error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} showCloseButton={false} className="max-w-[600px] max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-b from-[#6D28D9] to-[#3730A3] px-6 py-4 rounded-t-lg relative">
                <button
                    onClick={() => { reset(); onClose(); }}
                    className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Invite SuperAdmin</h2>
                        <p className="text-sm text-white/90 mt-0.5">Send invitation after OTP verification</p>
                    </div>
                </div>
            </div>
            <form
                className="p-6 space-y-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    invite();
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="superadmin@example.com"
                            className="w-full px-4 py-2.5 bg-[#FAF7FF] border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name"
                            className="w-full px-4 py-2.5 bg-[#FAF7FF] border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>
                {otpSent && (
                    <div className="flex items-center justify-center">
                        <div className="flex gap-2">
                            {otp.map((d, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    value={d}
                                    required={otpSent}
                                    pattern="[0-9]"
                                    onPaste={handleOtpPaste}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    className="w-12 h-12 text-center bg-[#FAF7FF] border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg text-gray-900"
                                    maxLength={1}
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div className="w-full">
                    <button
                        type="button"
                        onClick={sendOtp}
                        disabled={loading || !/^\S+@\S+\.\S+$/.test(email.trim()) || !name.trim()}
                        className="w-full px-6 py-2.5 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {otpSent ? 'Resend OTP to Owner' : 'Send OTP to Owner'}
                    </button>
                </div>
                <div className="px-0 pb-0 flex items-center justify-between gap-3 w-full">
                    <button
                        type="button"
                        onClick={() => { reset(); onClose(); }}
                        className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors w-full border"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !otpSent || !otpReady}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full justify-center"
                    >
                        <UserPlus size={18} />
                        Invite SuperAdmin
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SuperAdminInviteModal;
