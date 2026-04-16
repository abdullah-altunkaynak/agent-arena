import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [badges, setBadges] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchUserProfile();
        fetchUserStats();
        fetchUserBadges();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch('/api/users/profile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setFormData({
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                });
            } else {
                setError('Failed to load profile');
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch('/api/users/stats', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    const fetchUserBadges = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch('/api/users/badges', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBadges(data);
            }
        } catch (err) {
            console.error('Badges fetch error:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setSuccess('Profile updated successfully!');
                setEditMode(false);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError('Failed to update profile');
            }
        } catch (err) {
            console.error('Update error:', err);
            setError('An error occurred');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <>
                <Head>
                    <title>Loading Profile - Agent Arena</title>
                </Head>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-white">Loading...</div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Head>
                    <title>Profile - Agent Arena</title>
                </Head>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-white mb-4">Please sign in to view your profile</p>
                        <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
                            Sign In
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Profile - {user.username} - Agent Arena</title>
                <meta name="description" content={`${user.username}'s profile on Agent Arena`} />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-white">My Profile</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 text-red-300">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6 text-green-300">
                            {success}
                        </div>
                    )}

                    {/* Profile Card */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 mb-8 shadow-xl">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-1">{user.full_name || user.username}</h2>
                                <p className="text-gray-400">@{user.username}</p>
                                {!user.email_verified && (
                                    <div className="mt-4 bg-yellow-500/20 border border-yellow-500 rounded p-3 text-yellow-300 text-sm inline-block">
                                        📧 Email not verified. Check your inbox to verify your account.
                                    </div>
                                )}
                            </div>

                            {user.avatar_url && (
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            )}
                        </div>

                        {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}

                        <div className="flex gap-4 text-sm text-gray-400 mb-6">
                            <span>📧 {user.email}</span>
                            <span>📅 Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Edit Button */}
                        {!editMode ? (
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Tell us about yourself"
                                    ></textarea>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditMode(false);
                                            setFormData({
                                                full_name: user.full_name || '',
                                                bio: user.bio || '',
                                            });
                                        }}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-purple-400">{stats.level}</div>
                                <div className="text-gray-400 text-sm">Level</div>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-yellow-400">{stats.points_total}</div>
                                <div className="text-gray-400 text-sm">Points</div>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-blue-400">{stats.threads_count}</div>
                                <div className="text-gray-400 text-sm">Threads</div>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-green-400">{stats.comments_count}</div>
                                <div className="text-gray-400 text-sm">Comments</div>
                            </div>

                            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
                                <div className="text-3xl font-bold text-pink-400">{stats.followers_count}</div>
                                <div className="text-gray-400 text-sm">Followers</div>
                            </div>
                        </div>
                    )}

                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-4">🏆 Badges Earned</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {badges.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className="flex flex-col items-center text-center p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                                        title={badge.description}
                                    >
                                        {badge.icon && <span className="text-4xl mb-2">{badge.icon}</span>}
                                        <span className="text-white font-medium text-sm">{badge.name}</span>
                                        <span className="text-gray-500 text-xs mt-1">
                                            {new Date(badge.earned_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
