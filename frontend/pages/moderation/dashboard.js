import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { reportAPI, warningAPI } from '@/lib/moderationAPI';
import { formatDate } from '@/lib/communityAPI';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';

export default function ModerationDashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('open');
    const [activeTab, setActiveTab] = useState('reports');

    useEffect(() => {
        // Check auth and moderator status
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error('Failed to parse user:', e);
            }
        }

        if (activeTab === 'reports') {
            fetchReports();
        }
    }, [statusFilter, activeTab]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await reportAPI.listReports(statusFilter, 0, 50);
            setReports(data);
            setError(null);
        } catch (err) {
            console.error('Fetch reports error:', err);
            setError('Failed to load reports. Make sure you\'re a moderator.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId, newStatus) => {
        try {
            await reportAPI.updateReportStatus(reportId, newStatus);
            fetchReports();
        } catch (err) {
            console.error('Update error:', err);
            setError(err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
                return 'bg-red-500/20 text-red-300';
            case 'reviewing':
                return 'bg-yellow-500/20 text-yellow-300';
            case 'resolved':
                return 'bg-green-500/20 text-green-300';
            case 'dismissed':
                return 'bg-gray-500/20 text-gray-300';
            default:
                return 'bg-slate-700';
        }
    };

    const getReasonEmoji = (reason) => {
        const emojiMap = {
            spam: '🚫',
            hate: '❌',
            harmful: '⚠️',
            misleading: '🤥',
            copyright: '©️',
            off_topic: '📍',
            other: '❓',
        };
        return emojiMap[reason] || '🚩';
    };

    if (error && reports.length === 0) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <Card className="bg-red-500/10 border-red-500/20 p-8 text-center">
                            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                            <p className="text-red-300 text-lg">{error}</p>
                            <Button onClick={() => window.location.href = '/community'} className="mt-4 bg-red-600 hover:bg-red-700">
                                Back to Communities
                            </Button>
                        </Card>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Moderation Dashboard - Agent Arena</title>
                <meta name="robots" content="noindex" />
            </Head>

            <Navbar />

            <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Moderation Dashboard</h1>
                        <p className="text-gray-400">Review and manage community reports</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <Card className="border-slate-700">
                            <div className="p-6">
                                <AlertCircle size={24} className="text-red-400 mb-2" />
                                <p className="text-gray-400 text-sm">Open Reports</p>
                                <p className="text-2xl font-bold text-white">
                                    {reports.filter(r => r.status === 'open').length}
                                </p>
                            </div>
                        </Card>

                        <Card className="border-slate-700">
                            <div className="p-6">
                                <Clock size={24} className="text-yellow-400 mb-2" />
                                <p className="text-gray-400 text-sm">Under Review</p>
                                <p className="text-2xl font-bold text-white">
                                    {reports.filter(r => r.status === 'reviewing').length}
                                </p>
                            </div>
                        </Card>

                        <Card className="border-slate-700">
                            <div className="p-6">
                                <CheckCircle size={24} className="text-green-400 mb-2" />
                                <p className="text-gray-400 text-sm">Resolved</p>
                                <p className="text-2xl font-bold text-white">
                                    {reports.filter(r => r.status === 'resolved').length}
                                </p>
                            </div>
                        </Card>

                        <Card className="border-slate-700">
                            <div className="p-6">
                                <TrendingUp size={24} className="text-blue-400 mb-2" />
                                <p className="text-gray-400 text-sm">Total Reports</p>
                                <p className="text-2xl font-bold text-white">{reports.length}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'reports'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Reports
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="flex gap-3 mb-6">
                        {['open', 'reviewing', 'resolved', 'dismissed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${statusFilter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Reports Table */}
                    <Card className="border-slate-700 overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                    <p className="text-gray-400">Loading reports...</p>
                                </div>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">All caught up!</h3>
                                <p className="text-gray-500">No {statusFilter} reports at this time.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Reason</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Reporter</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {reports.map((report) => (
                                            <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 text-sm">
                                                    <span className="inline-block px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                                                        {report.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <span>{getReasonEmoji(report.reason)}</span>
                                                        <span className="capitalize">{report.reason.replace('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {report.reporter_id.substring(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {formatDate(report.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(report.status)}`}>
                                                        {report.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="reviewing">Reviewing</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="dismissed">Dismissed</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </main>

            <Footer />
        </>
    );
}
