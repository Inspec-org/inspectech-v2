'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, Info, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

function AcceptInvitationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [invitation, setInvitation] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link.');
            setLoading(false);
            return;
        }

        const fetchInvitation = async () => {
            try {
                const res = await fetch(`/api/invite/details?token=${token}`);
                const data = await res.json();
                if (data.success) {
                    setInvitation(data.invitation);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Failed to load invitation.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [token]);

    const requirements = [
        { label: "At least 10 characters", valid: password.length >= 10 },
        { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
        { label: "At least one number", valid: /\d/.test(password) },
        { label: "At least one special character (!@#$%^&*)", valid: /[!@#$%^&*]/.test(password) },
        { label: "Must not be a common password", valid: true },
    ];

    const satisfiedCount = requirements.filter(r => r.valid).length;
    const isPasswordValid = satisfiedCount >= 5;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (!isPasswordValid) {
            alert("Please satisfy password requirements");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/invite/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (data.success) {
                router.push('/signin?message=registered');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="text-red-500 mb-4 text-xl font-semibold">Error</div>
            <div className="text-gray-700">{error}</div>
            <Link href="/" className="mt-4 text-purple-600 hover:underline">Go to Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFBF9] py-10 px-4 flex flex-col items-center justify-center font-sans">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">InspecTech</h1>
                <p className="text-gray-600">Advanced Inventory Monitoring & Analytics Suite</p>
            </div>

            <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100">
                {/* Card Header */}
                <div className="px-8 pt-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Complete Your Registration</h2>
                        {invitation?.vendorId && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                Vendor ID: 5
                            </span>
                        )}
                    </div>

                    {/* Invitation Details */}
                    <div className="bg-[#F9FAFB] rounded-xl p-5 border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-full border border-purple-200 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-base">Invitation Details</h3>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-[80px_1fr] items-baseline">
                                <span className="text-gray-500">Name:</span>
                                <span className="font-medium text-gray-900">{invitation?.name}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr] items-baseline">
                                <span className="text-gray-500">Vendor:</span>
                                <span className="font-medium text-gray-900">{invitation?.vendorName || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr] items-baseline">
                                <span className="text-gray-500">Role:</span>
                                <span className="font-medium text-gray-900 capitalize">{invitation?.role}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr] items-baseline">
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium text-gray-900">{invitation?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-sm text-blue-600 leading-relaxed">
                            Please create a secure password to complete your account setup. 
                            You'll use your email address and password to sign in.
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-100"></div>

                {/* Form Section */}
                <div className="p-8 bg-[#FDFBF9]">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email (Username) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Email (Username)
                            </label>
                            <input
                                type="text"
                                value={invitation?.email}
                                disabled
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                This email will be used as your login username.
                            </p>
                        </div>

                        {/* Create Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Create Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter a secure password"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm bg-purple-50/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Password Requirements:</span>
                                <span className="text-sm text-gray-500">
                                    <span className="font-bold text-gray-900">{satisfiedCount}</span>/6 satisfied
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {requirements.map((req, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${req.valid ? 'bg-gray-200' : 'bg-gray-200'}`}>
                                            {req.valid && <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                                        </div>
                                        <span className={req.valid ? 'text-gray-400' : ''}>{req.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm bg-purple-50/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !isPasswordValid || password !== confirmPassword}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all shadow-sm mt-4
                                ${submitting || !isPasswordValid || password !== confirmPassword 
                                    ? 'bg-purple-300 cursor-not-allowed' 
                                    : 'bg-[#9D7FE3] hover:bg-purple-600'}`}
                        >
                            {submitting ? 'Registering...' : 'Complete Registration'}
                            {!submitting && <span>→</span>}
                        </button>
                    </form>
                </div>
                
                <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 text-center text-sm text-gray-600">
                    Already have an account? <Link href="/signin" className="text-purple-600 hover:underline font-medium">Log in instead</Link>
                </div>
            </div>
        </div>
    );
}

export default AcceptInvitationContent